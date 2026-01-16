// =============================================================================
// Actores Routes - Governance and Stakeholders
// =============================================================================

import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import type { Env } from "@/types/cloudflare";
import { actores } from "@/db/schema";
import type { Database } from "@/db";
import { requireAuth, requireOrganizacional } from "../middleware/auth";

const actoresRouter = new Hono<{
    Bindings: Env;
    Variables: { db: Database };
}>();

// =============================================================================
// Schemas
// =============================================================================

const actaReunionSchema = z.object({
    fecha: z.string(),
    tema: z.string(),
    linkActa: z.string().url().optional(),
});

const createActorSchema = z.object({
    nombreActor: z.string().min(2),
    tipoActor: z.string().min(2), // Flexible: Organismo Público, Privado, Sociedad Civil, Academia
    rolEnPlan: z.string().min(2), // Flexible: Coordinador, Implementador, Fiscalizador, Consultivo
    contactoNombre: z.string().optional(),
    contactoEmail: z.string().email().optional(),
    contactoTelefono: z.string().optional(),
    relacionPlanIds: z.array(z.string()).default([]),
    relacionAccionIds: z.array(z.string()).default([]),
});

// =============================================================================
// Routes
// =============================================================================

// GET /api/actores
actoresRouter.get("/", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const { tipo, rol, page = "1", limit = "50" } = c.req.query();

        const result = await db.query.actores.findMany({
            orderBy: [desc(actores.createdAt)],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
        });

        return c.json({ success: true, data: result });
    } catch (error) {
        return c.json({ success: false, error: "Error al listar actores" }, 500);
    }
});

// GET /api/actores/:id
actoresRouter.get("/:id", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const actorId = c.req.param("id");

        const actor = await db.query.actores.findFirst({
            where: eq(actores.actorId, actorId),
        });

        if (!actor) {
            return c.json({ success: false, error: "Actor no encontrado" }, 404);
        }

        // Parse JSON fields
        const parsedActor = {
            ...actor,
            relacionPlanIds: JSON.parse(actor.relacionPlanIds || "[]"),
            relacionAccionIds: JSON.parse(actor.relacionAccionIds || "[]"),
            actasReunion: JSON.parse(actor.actasReunion || "[]"),
        };

        return c.json({ success: true, data: parsedActor });
    } catch (error) {
        return c.json({ success: false, error: "Error al obtener actor" }, 500);
    }
});

// POST /api/actores
actoresRouter.post("/", requireAuth, requireOrganizacional, async (c) => {
    try {
        const body = await c.req.json();
        const parsed = createActorSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos", details: parsed.error.errors }, 400);
        }

        const db = c.get("db");

        const [actor] = await db
            .insert(actores)
            .values({
                ...parsed.data,
                relacionPlanIds: JSON.stringify(parsed.data.relacionPlanIds),
                relacionAccionIds: JSON.stringify(parsed.data.relacionAccionIds),
                actasReunion: "[]",
            })
            .returning();

        return c.json({ success: true, data: actor }, 201);
    } catch (error) {
        return c.json({ success: false, error: "Error al crear actor" }, 500);
    }
});

// PATCH /api/actores/:id
actoresRouter.patch("/:id", requireAuth, requireOrganizacional, async (c) => {
    try {
        const actorId = c.req.param("id");
        const body = await c.req.json();
        const db = c.get("db");

        const updateData: any = { ...body, updatedAt: new Date().toISOString() };

        if (body.relacionPlanIds) {
            updateData.relacionPlanIds = JSON.stringify(body.relacionPlanIds);
        }
        if (body.relacionAccionIds) {
            updateData.relacionAccionIds = JSON.stringify(body.relacionAccionIds);
        }

        const [updated] = await db
            .update(actores)
            .set(updateData)
            .where(eq(actores.actorId, actorId))
            .returning();

        return c.json({ success: true, data: updated });
    } catch (error) {
        return c.json({ success: false, error: "Error al actualizar actor" }, 500);
    }
});

// DELETE /api/actores/:id
actoresRouter.delete("/:id", requireAuth, requireOrganizacional, async (c) => {
    try {
        const actorId = c.req.param("id");
        const db = c.get("db");

        await db.delete(actores).where(eq(actores.actorId, actorId));

        return c.json({ success: true, message: "Actor eliminado" });
    } catch (error) {
        return c.json({ success: false, error: "Error al eliminar actor" }, 500);
    }
});

// POST /api/actores/:id/actas - Add meeting minutes
actoresRouter.post("/:id/actas", requireAuth, requireOrganizacional, async (c) => {
    try {
        const actorId = c.req.param("id");
        const body = await c.req.json();
        const parsed = actaReunionSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos" }, 400);
        }

        const db = c.get("db");

        // Get current actor
        const actor = await db.query.actores.findFirst({
            where: eq(actores.actorId, actorId),
        });

        if (!actor) {
            return c.json({ success: false, error: "Actor no encontrado" }, 404);
        }

        // Add new acta
        const actasActuales = JSON.parse(actor.actasReunion || "[]");
        actasActuales.push(parsed.data);

        // Update
        const [updated] = await db
            .update(actores)
            .set({
                actasReunion: JSON.stringify(actasActuales),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(actores.actorId, actorId))
            .returning();

        return c.json({ success: true, data: updated });
    } catch (error) {
        return c.json({ success: false, error: "Error al agregar acta" }, 500);
    }
});

// GET /api/actores/resumen/gobernanza - Governance summary
actoresRouter.get("/resumen/gobernanza", requireAuth, async (c) => {
    try {
        const db = c.get("db");

        const allActores = await db.query.actores.findMany();

        const resumen = {
            total: allActores.length,
            porTipo: {} as Record<string, number>,
            porRol: {} as Record<string, number>,
            totalActas: 0,
        };

        allActores.forEach((actor) => {
            resumen.porTipo[actor.tipoActor] = (resumen.porTipo[actor.tipoActor] || 0) + 1;
            resumen.porRol[actor.rolEnPlan] = (resumen.porRol[actor.rolEnPlan] || 0) + 1;
            const actas = JSON.parse(actor.actasReunion || "[]");
            resumen.totalActas += actas.length;
        });

        return c.json({ success: true, data: resumen });
    } catch (error) {
        return c.json({ success: false, error: "Error al generar resumen" }, 500);
    }
});

export { actoresRouter as actoresRoutes };
