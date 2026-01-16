// =============================================================================
// Authentication Routes - Login, Register, Session
// =============================================================================

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Env } from "@/types/cloudflare";
import { usuarios, organizaciones } from "@/db/schema";
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

// Schema for organization registration (creates org + admin user)
const registerOrganizacionSchema = z.object({
    // Organization data
    nombreOrganizacion: z.string().min(2),
    tipoOrganizacion: z.string().default("Municipal"),
    region: z.string().min(2),
    provincia: z.string().min(2),
    poblacion: z.number().optional(),
    contactoEmailOrganizacion: z.string().email().optional(),
    // Admin user data
    email: z.string().email(),
    password: z.string().min(6),
    nombreCompleto: z.string().min(2),
});

// Schema for citizen registration (simplified)
const registerCiudadanoSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    nombreCompleto: z.string().min(2),
    rut: z.string().optional(),
    comunaResidencia: z.string().optional(),
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

// POST /api/auth/register-organizacion - Register new organization with admin user
auth.post("/register-organizacion", async (c) => {
    try {
        const body = await c.req.json();
        const parsed = registerOrganizacionSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos", details: parsed.error.errors }, 400);
        }

        const db = c.get("db");

        // Check if user email already exists
        const existingUser = await db.query.usuarios.findFirst({
            where: eq(usuarios.email, parsed.data.email),
        });

        if (existingUser) {
            return c.json({ success: false, error: "El email ya está registrado" }, 409);
        }

        // Check if organization name already exists (optional - can have duplicate names)
        const existingOrg = await db.query.organizaciones.findFirst({
            where: eq(organizaciones.nombre, parsed.data.nombreOrganizacion),
        });

        if (existingOrg) {
            return c.json({
                success: false,
                error: "Ya existe una organización con este nombre. Si desea unirse, contacte al administrador."
            }, 409);
        }

        // Create organization first
        const [newOrg] = await db
            .insert(organizaciones)
            .values({
                nombre: parsed.data.nombreOrganizacion,
                tipo: parsed.data.tipoOrganizacion,
                region: parsed.data.region,
                provincia: parsed.data.provincia,
                poblacion: parsed.data.poblacion,
                contactoEmail: parsed.data.contactoEmailOrganizacion || parsed.data.email,
            })
            .returning();

        // Hash password
        const passwordHash = await hashPassword(parsed.data.password);

        // Create admin user for the organization
        const [newUser] = await db
            .insert(usuarios)
            .values({
                email: parsed.data.email,
                passwordHash,
                nombreCompleto: parsed.data.nombreCompleto,
                rol: "Administrador", // First user is admin
                organizacionId: newOrg.organizacionId,
                activo: true,
            })
            .returning();

        // Generate session token for auto-login
        const token = generateToken();
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

        await c.env.KV_SESSIONS.put(
            `session:${token}`,
            JSON.stringify({
                userId: newUser.usuarioId,
                email: newUser.email,
                rol: newUser.rol,
                organizacionId: newOrg.organizacionId,
                expiresAt,
            }),
            { expirationTtl: 7 * 24 * 60 * 60 }
        );

        return c.json({
            success: true,
            data: {
                token,
                organizacion: {
                    id: newOrg.organizacionId,
                    nombre: newOrg.nombre,
                    tipo: newOrg.tipo,
                    region: newOrg.region,
                },
                user: {
                    id: newUser.usuarioId,
                    email: newUser.email,
                    nombreCompleto: newUser.nombreCompleto,
                    rol: newUser.rol,
                },
                expiresAt,
            },
        }, 201);
    } catch (error) {
        console.error("Register organizacion error:", error);
        return c.json({ success: false, error: "Error al registrar organización" }, 500);
    }
});

// POST /api/auth/register-ciudadano - Simplified citizen registration for public consultations
auth.post("/register-ciudadano", async (c) => {
    try {
        const body = await c.req.json();
        const parsed = registerCiudadanoSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos", details: parsed.error.errors }, 400);
        }

        const db = c.get("db");

        // Check if user exists
        const existing = await db.query.usuarios.findFirst({
            where: eq(usuarios.email, parsed.data.email),
        });

        if (existing) {
            return c.json({ success: false, error: "El email ya está registrado. Inicie sesión en su lugar." }, 409);
        }

        // Hash password
        const passwordHash = await hashPassword(parsed.data.password);

        // Create citizen user (no organization)
        const [newUser] = await db
            .insert(usuarios)
            .values({
                email: parsed.data.email,
                passwordHash,
                nombreCompleto: parsed.data.nombreCompleto,
                rol: "Ciudadano",
                claveUnicaRut: parsed.data.rut || null,
                organizacionId: null, // Citizens don't belong to organizations
                activo: true,
            })
            .returning();

        // Generate session token for auto-login
        const token = generateToken();
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

        await c.env.KV_SESSIONS.put(
            `session:${token}`,
            JSON.stringify({
                userId: newUser.usuarioId,
                email: newUser.email,
                rol: newUser.rol,
                organizacionId: null,
                expiresAt,
            }),
            { expirationTtl: 7 * 24 * 60 * 60 }
        );

        return c.json({
            success: true,
            data: {
                token,
                user: {
                    id: newUser.usuarioId,
                    email: newUser.email,
                    nombreCompleto: newUser.nombreCompleto,
                    rol: newUser.rol,
                },
                expiresAt,
            },
        }, 201);
    } catch (error) {
        console.error("Register ciudadano error:", error);
        return c.json({ success: false, error: "Error al registrar ciudadano" }, 500);
    }
});

// GET /api/auth/organizaciones-disponibles - List organizations for join requests
auth.get("/organizaciones-disponibles", async (c) => {
    try {
        const db = c.get("db");

        const orgs = await db.query.organizaciones.findMany({
            columns: {
                organizacionId: true,
                nombre: true,
                tipo: true,
                region: true,
                provincia: true,
            },
        });

        return c.json({ success: true, data: orgs });
    } catch (error) {
        return c.json({ success: false, error: "Error al listar organizaciones" }, 500);
    }
});

// POST /api/auth/change-password - Change password for authenticated user
auth.post("/change-password", async (c) => {
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

        const body = await c.req.json();
        const changePasswordSchema = z.object({
            currentPassword: z.string().min(1, "Contraseña actual requerida"),
            newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
        });

        const parsed = changePasswordSchema.safeParse(body);
        if (!parsed.success) {
            return c.json({ success: false, error: parsed.error.errors[0]?.message || "Datos inválidos" }, 400);
        }

        const { currentPassword, newPassword } = parsed.data;
        const db = c.get("db");

        // Get user with current password hash
        const user = await db.query.usuarios.findFirst({
            where: eq(usuarios.usuarioId, session.userId),
        });

        if (!user || !user.passwordHash) {
            return c.json({ success: false, error: "Usuario no encontrado" }, 404);
        }

        // Verify current password
        const isValid = await verifyPassword(currentPassword, user.passwordHash);
        if (!isValid) {
            return c.json({ success: false, error: "La contraseña actual es incorrecta" }, 400);
        }

        // Hash new password
        const newPasswordHash = await hashPassword(newPassword);

        // Update password
        await db
            .update(usuarios)
            .set({
                passwordHash: newPasswordHash,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(usuarios.usuarioId, session.userId));

        return c.json({
            success: true,
            message: "Contraseña actualizada exitosamente",
        });
    } catch (error) {
        console.error("Change password error:", error);
        return c.json({ success: false, error: "Error al cambiar contraseña" }, 500);
    }
});

export { auth as authRoutes };
