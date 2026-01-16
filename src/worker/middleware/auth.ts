// =============================================================================
// Authentication Middleware
// =============================================================================

import { Context, Next } from "hono";
import type { Env, SessionData } from "@/types/cloudflare";

/**
 * Middleware to require authentication
 */
export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
        return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const token = authHeader.slice(7);
    const sessionData = await c.env.KV_SESSIONS.get(`session:${token}`);

    if (!sessionData) {
        return c.json({ success: false, error: "Sesión inválida o expirada" }, 401);
    }

    const session: SessionData = JSON.parse(sessionData);

    if (session.expiresAt < Date.now()) {
        await c.env.KV_SESSIONS.delete(`session:${token}`);
        return c.json({ success: false, error: "Sesión expirada" }, 401);
    }

    // Set session in context
    c.set("session", session);
    c.set("userId", session.userId);
    c.set("userRol", session.rol);
    c.set("organizacionId", session.organizacionId);

    await next();
}

/**
 * Middleware to require specific roles
 */
export function requireRole(...roles: string[]) {
    return async (c: Context<{ Bindings: Env }>, next: Next) => {
        const userRol = c.get("userRol");

        if (!userRol || !roles.includes(userRol)) {
            return c.json(
                { success: false, error: "No tienes permisos para esta acción" },
                403
            );
        }

        await next();
    };
}

/**
 * Middleware to require admin role
 */
export async function requireAdmin(c: Context<{ Bindings: Env }>, next: Next) {
    const userRol = c.get("userRol");

    if (userRol !== "Administrador Plataforma" && userRol !== "Administrador") {
        return c.json(
            { success: false, error: "Se requiere rol de administrador" },
            403
        );
    }

    await next();
}

/**
 * Middleware to require organizational user (any organizational role)
 */
export async function requireOrganizacional(c: Context<{ Bindings: Env }>, next: Next) {
    const userRol = c.get("userRol");
    const organizacionRoles = ["Administrador", "Técnico"];

    if (!userRol || !organizacionRoles.includes(userRol)) {
        return c.json(
            { success: false, error: "Se requiere rol organizacional" },
            403
        );
    }

    await next();
}

/**
 * Optional auth - sets session if present but doesn't require it
 */
export async function optionalAuth(c: Context<{ Bindings: Env }>, next: Next) {
    const authHeader = c.req.header("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const sessionData = await c.env.KV_SESSIONS.get(`session:${token}`);

        if (sessionData) {
            const session: SessionData = JSON.parse(sessionData);
            if (session.expiresAt >= Date.now()) {
                c.set("session", session);
                c.set("userId", session.userId);
                c.set("userRol", session.rol);
                c.set("organizacionId", session.organizacionId);
            }
        }
    }

    await next();
}
