// =============================================================================
// Authentication Routes - Login, Register, Session
// =============================================================================

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Env } from "@/types/cloudflare";
import { usuarios } from "@/db/schema";
import type { Database } from "@/db";

const auth = new Hono<{ Bindings: Env; Variables: { db: Database } }>();

// =============================================================================
// Schemas
// =============================================================================

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    nombreCompleto: z.string().min(2),
    rol: z.enum(["Ciudadano", "Técnico", "Administrador"]).default("Ciudadano"),
    organizacionId: z.string().uuid().optional(),
});

// =============================================================================
// Helpers
// =============================================================================

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}

function generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
}

// =============================================================================
// Routes
// =============================================================================

// POST /api/auth/login
auth.post("/login", async (c) => {
    try {
        const body = await c.req.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos" }, 400);
        }

        const { email, password } = parsed.data;
        const db = c.get("db");

        // Find user
        const user = await db.query.usuarios.findFirst({
            where: eq(usuarios.email, email),
        });

        if (!user || !user.passwordHash) {
            return c.json({ success: false, error: "Credenciales inválidas" }, 401);
        }

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return c.json({ success: false, error: "Credenciales inválidas" }, 401);
        }

        if (!user.activo) {
            return c.json({ success: false, error: "Usuario desactivado" }, 403);
        }

        // Generate session token
        const token = generateToken();
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

        // Store session in KV
        await c.env.KV_SESSIONS.put(
            `session:${token}`,
            JSON.stringify({
                userId: user.usuarioId,
                email: user.email,
                rol: user.rol,
                organizacionId: user.organizacionId,
                expiresAt,
            }),
            { expirationTtl: 7 * 24 * 60 * 60 }
        );

        return c.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.usuarioId,
                    email: user.email,
                    nombreCompleto: user.nombreCompleto,
                    rol: user.rol,
                    organizacionId: user.organizacionId,
                },
                expiresAt,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return c.json({ success: false, error: "Error al iniciar sesión" }, 500);
    }
});

// POST /api/auth/register
auth.post("/register", async (c) => {
    try {
        const body = await c.req.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos", details: parsed.error.errors }, 400);
        }

        const { email, password, nombreCompleto, rol, organizacionId } = parsed.data;
        const db = c.get("db");

        // Check if user exists
        const existing = await db.query.usuarios.findFirst({
            where: eq(usuarios.email, email),
        });

        if (existing) {
            return c.json({ success: false, error: "El email ya está registrado" }, 409);
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const [newUser] = await db
            .insert(usuarios)
            .values({
                email,
                passwordHash,
                nombreCompleto,
                rol,
                organizacionId: organizacionId || null,
                activo: true,
            })
            .returning();

        return c.json({
            success: true,
            data: {
                id: newUser.usuarioId,
                email: newUser.email,
                nombreCompleto: newUser.nombreCompleto,
                rol: newUser.rol,
            },
        }, 201);
    } catch (error) {
        console.error("Register error:", error);
        return c.json({ success: false, error: "Error al registrar usuario" }, 500);
    }
});

// GET /api/auth/me
auth.get("/me", async (c) => {
    try {
        const authHeader = c.req.header("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return c.json({ success: false, error: "No autorizado" }, 401);
        }

        const token = authHeader.slice(7);
        const sessionData = await c.env.KV_SESSIONS.get(`session:${token}`);

        if (!sessionData) {
            return c.json({ success: false, error: "Sesión inválida o expirada" }, 401);
        }

        const session = JSON.parse(sessionData);
        const db = c.get("db");

        const user = await db.query.usuarios.findFirst({
            where: eq(usuarios.usuarioId, session.userId),
        });

        if (!user) {
            return c.json({ success: false, error: "Usuario no encontrado" }, 404);
        }

        return c.json({
            success: true,
            data: {
                id: user.usuarioId,
                email: user.email,
                nombreCompleto: user.nombreCompleto,
                rol: user.rol,
                organizacionId: user.organizacionId,
            },
        });
    } catch (error) {
        console.error("Me error:", error);
        return c.json({ success: false, error: "Error al obtener usuario" }, 500);
    }
});

// POST /api/auth/logout
auth.post("/logout", async (c) => {
    try {
        const authHeader = c.req.header("Authorization");
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.slice(7);
            await c.env.KV_SESSIONS.delete(`session:${token}`);
        }

        return c.json({ success: true, message: "Sesión cerrada" });
    } catch (error) {
        console.error("Logout error:", error);
        return c.json({ success: false, error: "Error al cerrar sesión" }, 500);
    }
});

// POST /api/auth/refresh
auth.post("/refresh", async (c) => {
    try {
        const authHeader = c.req.header("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return c.json({ success: false, error: "No autorizado" }, 401);
        }

        const oldToken = authHeader.slice(7);
        const sessionData = await c.env.KV_SESSIONS.get(`session:${oldToken}`);

        if (!sessionData) {
            return c.json({ success: false, error: "Sesión inválida" }, 401);
        }

        const session = JSON.parse(sessionData);

        // Generate new token
        const newToken = generateToken();
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

        // Store new session
        await c.env.KV_SESSIONS.put(
            `session:${newToken}`,
            JSON.stringify({ ...session, expiresAt }),
            { expirationTtl: 7 * 24 * 60 * 60 }
        );

        // Delete old session
        await c.env.KV_SESSIONS.delete(`session:${oldToken}`);

        return c.json({
            success: true,
            data: { token: newToken, expiresAt },
        });
    } catch (error) {
        console.error("Refresh error:", error);
        return c.json({ success: false, error: "Error al refrescar sesión" }, 500);
    }
});

export { auth as authRoutes };
