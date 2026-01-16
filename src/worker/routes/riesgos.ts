// =============================================================================
// Riesgos Routes - Risk Matrix (Amenaza × Vulnerabilidad)
// =============================================================================

import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import type { Env } from "@/types/cloudflare";
import { riesgos } from "@/db/schema";
import type { Database } from "@/db";
import { requireAuth, requireOrganizacional } from "../middleware/auth";

const riesgosRouter = new Hono<{
    Bindings: Env;
    Variables: { db: Database };
}>();

// =============================================================================
// Schemas
// =============================================================================

const createRiesgoSchema = z.object({
    amenazaId: z.string().uuid(),
    vulnerabilidadId: z.string().uuid(),
    activoId: z.string().uuid().optional(),
    nombreRiesgo: z.string().min(5),
    nivelRiesgoCalculado: z.enum(["Bajo", "Medio", "Alto", "Crítico"]),
    justificacionRiesgo: z.string().optional(),
    mapaRiesgo: z.string().optional(), // GeoJSON
});

// =============================================================================
// Routes
// =============================================================================

// GET /api/riesgos - List all risks
riesgosRouter.get("/", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const { nivel, amenazaId, page = "1", limit = "50" } = c.req.query();

        const result = await db.query.riesgos.findMany({
            orderBy: [desc(riesgos.createdAt)],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            with: {
                amenaza: true,
                vulnerabilidad: true,
                activoCritico: true,
            },
        });

        return c.json({ success: true, data: result });
    } catch (error) {
        console.error("List riesgos error:", error);
        return c.json({ success: false, error: "Error al listar riesgos" }, 500);
    }
});

// GET /api/riesgos/:id
riesgosRouter.get("/:id", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const riesgoId = c.req.param("id");

        const riesgo = await db.query.riesgos.findFirst({
            where: eq(riesgos.riesgoId, riesgoId),
            with: {
                amenaza: true,
                vulnerabilidad: true,
                activoCritico: true,
            },
        });

        if (!riesgo) {
            return c.json({ success: false, error: "Riesgo no encontrado" }, 404);
        }

        return c.json({ success: true, data: riesgo });
    } catch (error) {
        return c.json({ success: false, error: "Error al obtener riesgo" }, 500);
    }
});

// POST /api/riesgos - Create risk
riesgosRouter.post("/", requireAuth, requireOrganizacional, async (c) => {
    try {
        const body = await c.req.json();
        const parsed = createRiesgoSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos", details: parsed.error.errors }, 400);
        }

        const db = c.get("db");

        const [riesgo] = await db
            .insert(riesgos)
            .values(parsed.data)
            .returning();

        return c.json({ success: true, data: riesgo }, 201);
    } catch (error) {
        console.error("Create riesgo error:", error);
        return c.json({ success: false, error: "Error al crear riesgo" }, 500);
    }
});

// PATCH /api/riesgos/:id
riesgosRouter.patch("/:id", requireAuth, requireOrganizacional, async (c) => {
    try {
        const riesgoId = c.req.param("id");
        const body = await c.req.json();
        const db = c.get("db");

        const [updated] = await db
            .update(riesgos)
            .set({ ...body, updatedAt: new Date().toISOString() })
            .where(eq(riesgos.riesgoId, riesgoId))
            .returning();

        if (!updated) {
            return c.json({ success: false, error: "Riesgo no encontrado" }, 404);
        }

        return c.json({ success: true, data: updated });
    } catch (error) {
        return c.json({ success: false, error: "Error al actualizar riesgo" }, 500);
    }
});

// DELETE /api/riesgos/:id
riesgosRouter.delete("/:id", requireAuth, requireOrganizacional, async (c) => {
    try {
        const riesgoId = c.req.param("id");
        const db = c.get("db");

        await db.delete(riesgos).where(eq(riesgos.riesgoId, riesgoId));

        return c.json({ success: true, message: "Riesgo eliminado" });
    } catch (error) {
        return c.json({ success: false, error: "Error al eliminar riesgo" }, 500);
    }
});

// GET /api/riesgos/matriz - Get risk matrix summary
riesgosRouter.get("/matriz/resumen", requireAuth, async (c) => {
    try {
        const db = c.get("db");

        const allRiesgos = await db.query.riesgos.findMany({
            with: { amenaza: true, vulnerabilidad: true },
        });

        // Group by level
        const resumen = {
            total: allRiesgos.length,
            porNivel: {
                Bajo: allRiesgos.filter((r) => r.nivelRiesgoCalculado === "Bajo").length,
                Medio: allRiesgos.filter((r) => r.nivelRiesgoCalculado === "Medio").length,
                Alto: allRiesgos.filter((r) => r.nivelRiesgoCalculado === "Alto").length,
                Crítico: allRiesgos.filter((r) => r.nivelRiesgoCalculado === "Crítico").length,
            },
            porTipoAmenaza: {} as Record<string, number>,
            porDimensionVulnerabilidad: {} as Record<string, number>,
        };

        allRiesgos.forEach((r) => {
            if (r.amenaza) {
                resumen.porTipoAmenaza[r.amenaza.tipoAmenaza] =
                    (resumen.porTipoAmenaza[r.amenaza.tipoAmenaza] || 0) + 1;
            }
            if (r.vulnerabilidad) {
                resumen.porDimensionVulnerabilidad[r.vulnerabilidad.dimensionVulnerabilidad] =
                    (resumen.porDimensionVulnerabilidad[r.vulnerabilidad.dimensionVulnerabilidad] || 0) + 1;
            }
        });

        return c.json({ success: true, data: resumen });
    } catch (error) {
        return c.json({ success: false, error: "Error al generar matriz" }, 500);
    }
});

export { riesgosRouter as riesgosRoutes };
