// =============================================================================
// Usuarios Routes - User Management
// =============================================================================

import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import type { Env } from "@/types/cloudflare";
import { usuarios, organizaciones } from "@/db/schema";
import type { Database } from "@/db";
import { requireAuth, requireAdmin } from "../middleware/auth";

const usuariosRouter = new Hono<{
    Bindings: Env;
    Variables: { db: Database; userId: string };
}>();

// =============================================================================
// Schemas
// =============================================================================

const updateUsuarioSchema = z.object({
    nombreCompleto: z.string().min(2).optional(),
    rol: z.enum([
        "Administrador Plataforma",
        "Administrador",
        "Técnico",
        "Ciudadano",
        "Observador",
    ]).optional(),
    organizacionId: z.string().uuid().nullable().optional(),
    activo: z.boolean().optional(),
});

const createOrganizacionSchema = z.object({
    nombre: z.string().min(2),
    tipo: z.enum(["Municipal", "Privada"]).default("Municipal"),
    region: z.string().min(2),
    provincia: z.string().min(2),
    poblacion: z.number().int().optional(),
    contactoEmail: z.string().email().optional(),
    limitesGeograficos: z.string().optional(), // GeoJSON
});

// =============================================================================
// Usuario Routes
// =============================================================================

// GET /api/usuarios - List users (admin only)
usuariosRouter.get("/", requireAuth, requireAdmin, async (c) => {
    try {
        const db = c.get("db");
        const { rol, organizacionId, page = "1", limit = "50" } = c.req.query();

        const result = await db.query.usuarios.findMany({
            orderBy: [desc(usuarios.createdAt)],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            columns: {
                passwordHash: false, // Never expose password
            },
            with: {
                organizacion: true,
            },
        });

        return c.json({ success: true, data: result });
    } catch (error) {
        return c.json({ success: false, error: "Error al listar usuarios" }, 500);
    }
});

// GET /api/usuarios/:id
usuariosRouter.get("/:id", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const usuarioId = c.req.param("id");
        const currentUserId = c.get("userId");
        const userRol = c.get("userRol");

        // Only admin or self can view
        if (usuarioId !== currentUserId &&
            !["Administrador Plataforma", "Administrador"].includes(userRol)) {
            return c.json({ success: false, error: "No autorizado" }, 403);
        }

        const usuario = await db.query.usuarios.findFirst({
            where: eq(usuarios.usuarioId, usuarioId),
            columns: { passwordHash: false },
            with: { organizacion: true },
        });

        if (!usuario) {
            return c.json({ success: false, error: "Usuario no encontrado" }, 404);
        }

        return c.json({ success: true, data: usuario });
    } catch (error) {
        return c.json({ success: false, error: "Error al obtener usuario" }, 500);
    }
});

// PATCH /api/usuarios/:id
usuariosRouter.patch("/:id", requireAuth, async (c) => {
    try {
        const usuarioId = c.req.param("id");
        const currentUserId = c.get("userId");
        const userRol = c.get("userRol");
        const body = await c.req.json();

        // Only admin can change roles, self can update profile
        if (usuarioId !== currentUserId &&
            !["Administrador Plataforma", "Administrador"].includes(userRol)) {
            return c.json({ success: false, error: "No autorizado" }, 403);
        }

        // Non-admins cannot change their own role
        if (usuarioId === currentUserId && body.rol &&
            !["Administrador Plataforma"].includes(userRol)) {
            delete body.rol;
        }

        const parsed = updateUsuarioSchema.safeParse(body);
        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos" }, 400);
        }

        const db = c.get("db");

        const [updated] = await db
            .update(usuarios)
            .set({ ...parsed.data, updatedAt: new Date().toISOString() })
            .where(eq(usuarios.usuarioId, usuarioId))
            .returning({
                usuarioId: usuarios.usuarioId,
                email: usuarios.email,
                nombreCompleto: usuarios.nombreCompleto,
                rol: usuarios.rol,
                organizacionId: usuarios.organizacionId,
                activo: usuarios.activo,
            });

        return c.json({ success: true, data: updated });
    } catch (error) {
        return c.json({ success: false, error: "Error al actualizar usuario" }, 500);
    }
});

// DELETE /api/usuarios/:id - Deactivate user (admin only)
usuariosRouter.delete("/:id", requireAuth, requireAdmin, async (c) => {
    try {
        const usuarioId = c.req.param("id");
        const db = c.get("db");

        // Soft delete (deactivate)
        const [updated] = await db
            .update(usuarios)
            .set({ activo: false, updatedAt: new Date().toISOString() })
            .where(eq(usuarios.usuarioId, usuarioId))
            .returning();

        if (!updated) {
            return c.json({ success: false, error: "Usuario no encontrado" }, 404);
        }

        return c.json({ success: true, message: "Usuario desactivado" });
    } catch (error) {
        return c.json({ success: false, error: "Error al desactivar usuario" }, 500);
    }
});

// =============================================================================
// Organizacion Routes
// =============================================================================

// GET /api/usuarios/organizaciones
usuariosRouter.get("/organizaciones/list", requireAuth, async (c) => {
    try {
        const db = c.get("db");

        const result = await db.query.organizaciones.findMany({
            orderBy: [organizaciones.nombre],
        });

        return c.json({ success: true, data: result });
    } catch (error) {
        return c.json({ success: false, error: "Error al listar organizaciones" }, 500);
    }
});

// POST /api/usuarios/organizaciones - Create organization (admin only)
usuariosRouter.post("/organizaciones", requireAuth, requireAdmin, async (c) => {
    try {
        const body = await c.req.json();
        const parsed = createOrganizacionSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos" }, 400);
        }

        const db = c.get("db");

        const [organizacion] = await db
            .insert(organizaciones)
            .values(parsed.data)
            .returning();

        return c.json({ success: true, data: organizacion }, 201);
    } catch (error) {
        return c.json({ success: false, error: "Error al crear organizacion" }, 500);
    }
});

export { usuariosRouter as usuariosRoutes };
