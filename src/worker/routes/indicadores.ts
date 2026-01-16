// =============================================================================
// Indicadores Routes - Indicators and Measurements
// =============================================================================

import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import type { Env } from "@/types/cloudflare";
import { indicadores, mediciones } from "@/db/schema";
import type { Database } from "@/db";
import { requireAuth, requireOrganizacional } from "../middleware/auth";

const indicadoresRouter = new Hono<{
    Bindings: Env;
    Variables: { db: Database; userId: string };
}>();

// =============================================================================
// Schemas
// =============================================================================

const createIndicadorSchema = z.object({
    accionId: z.string().uuid(),
    nombreIndicador: z.string().min(5),
    tipoIndicador: z.string().min(1), // Flexible: Impacto, Co-Beneficio, Gestión, etc.
    unidadMedida: z.string().min(1),
    lineaBase: z.number(),
    meta: z.number(),
    frecuenciaMedicion: z.string().min(1), // Flexible: Mensual, Trimestral, Semestral, Anual
    fuenteVerificacion: z.string().optional(),
});

const createMedicionSchema = z.object({
    fechaMedicion: z.string(),
    valorMedido: z.number(),
    evidenciaUrl: z.string().url().optional(),
    observaciones: z.string().optional(),
});

// =============================================================================
// Indicadores Routes
// =============================================================================

// GET /api/indicadores
indicadoresRouter.get("/", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const { accionId, tipo, page = "1", limit = "50" } = c.req.query();

        let query = db.query.indicadores.findMany({
            orderBy: [desc(indicadores.createdAt)],
            limit: parseInt(limit),
            with: {
                accion: true,
                mediciones: {
                    orderBy: [desc(mediciones.fechaMedicion)],
                    limit: 5,
                },
            },
        });

        const result = await query;

        return c.json({ success: true, data: result });
    } catch (error) {
        return c.json({ success: false, error: "Error al listar indicadores" }, 500);
    }
});

// GET /api/indicadores/:id
indicadoresRouter.get("/:id", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const indicadorId = c.req.param("id");

        const indicador = await db.query.indicadores.findFirst({
            where: eq(indicadores.indicadorId, indicadorId),
            with: {
                accion: true,
                mediciones: {
                    orderBy: [desc(mediciones.fechaMedicion)],
                },
            },
        });

        if (!indicador) {
            return c.json({ success: false, error: "Indicador no encontrado" }, 404);
        }

        // Calculate progress
        const ultimaMedicion = indicador.mediciones[0];
        const avance = ultimaMedicion
            ? ((ultimaMedicion.valorMedido - indicador.lineaBase) /
                (indicador.meta - indicador.lineaBase)) * 100
            : 0;

        return c.json({
            success: true,
            data: {
                ...indicador,
                avance: Math.min(Math.max(avance, 0), 100).toFixed(1),
                ultimaMedicion: ultimaMedicion?.valorMedido || indicador.lineaBase,
            },
        });
    } catch (error) {
        return c.json({ success: false, error: "Error al obtener indicador" }, 500);
    }
});

// POST /api/indicadores
indicadoresRouter.post("/", requireAuth, requireOrganizacional, async (c) => {
    try {
        const body = await c.req.json();
        const parsed = createIndicadorSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos", details: parsed.error.errors }, 400);
        }

        const db = c.get("db");

        const [indicador] = await db
            .insert(indicadores)
            .values(parsed.data)
            .returning();

        return c.json({ success: true, data: indicador }, 201);
    } catch (error) {
        return c.json({ success: false, error: "Error al crear indicador" }, 500);
    }
});

// PATCH /api/indicadores/:id
indicadoresRouter.patch("/:id", requireAuth, requireOrganizacional, async (c) => {
    try {
        const indicadorId = c.req.param("id");
        const body = await c.req.json();
        const db = c.get("db");

        const [updated] = await db
            .update(indicadores)
            .set({ ...body, updatedAt: new Date().toISOString() })
            .where(eq(indicadores.indicadorId, indicadorId))
            .returning();

        return c.json({ success: true, data: updated });
    } catch (error) {
        return c.json({ success: false, error: "Error al actualizar indicador" }, 500);
    }
});

// DELETE /api/indicadores/:id
indicadoresRouter.delete("/:id", requireAuth, requireOrganizacional, async (c) => {
    try {
        const indicadorId = c.req.param("id");
        const db = c.get("db");

        await db.delete(indicadores).where(eq(indicadores.indicadorId, indicadorId));

        return c.json({ success: true, message: "Indicador eliminado" });
    } catch (error) {
        return c.json({ success: false, error: "Error al eliminar indicador" }, 500);
    }
});

// =============================================================================
// Mediciones Routes
// =============================================================================

// GET /api/indicadores/:id/mediciones
indicadoresRouter.get("/:id/mediciones", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const indicadorId = c.req.param("id");

        const result = await db.query.mediciones.findMany({
            where: eq(mediciones.indicadorId, indicadorId),
            orderBy: [desc(mediciones.fechaMedicion)],
            with: {
                registradoPorUsuario: {
                    columns: { nombreCompleto: true, email: true },
                },
            },
        });

        return c.json({ success: true, data: result });
    } catch (error) {
        return c.json({ success: false, error: "Error al listar mediciones" }, 500);
    }
});

// POST /api/indicadores/:id/mediciones
indicadoresRouter.post("/:id/mediciones", requireAuth, requireOrganizacional, async (c) => {
    try {
        const indicadorId = c.req.param("id");
        const body = await c.req.json();
        const parsed = createMedicionSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos" }, 400);
        }

        const db = c.get("db");
        const userId = c.get("userId");

        const [medicion] = await db
            .insert(mediciones)
            .values({
                indicadorId,
                ...parsed.data,
                registradoPor: userId,
            })
            .returning();

        return c.json({ success: true, data: medicion }, 201);
    } catch (error) {
        return c.json({ success: false, error: "Error al registrar medición" }, 500);
    }
});

// GET /api/indicadores/resumen/general - Dashboard summary
indicadoresRouter.get("/resumen/general", requireAuth, async (c) => {
    try {
        const db = c.get("db");

        const allIndicadores = await db.query.indicadores.findMany({
            with: { mediciones: { limit: 1, orderBy: [desc(mediciones.fechaMedicion)] } },
        });

        const resumen = {
            totalIndicadores: allIndicadores.length,
            porTipo: {} as Record<string, number>,
            conMediciones: 0,
            sinMediciones: 0,
            promedioAvance: 0,
        };

        let totalAvance = 0;

        allIndicadores.forEach((ind) => {
            resumen.porTipo[ind.tipoIndicador] = (resumen.porTipo[ind.tipoIndicador] || 0) + 1;

            if (ind.mediciones.length > 0) {
                resumen.conMediciones++;
                const avance = ((ind.mediciones[0].valorMedido - ind.lineaBase) /
                    (ind.meta - ind.lineaBase)) * 100;
                totalAvance += Math.min(Math.max(avance, 0), 100);
            } else {
                resumen.sinMediciones++;
            }
        });

        resumen.promedioAvance = resumen.conMediciones > 0
            ? Math.round(totalAvance / resumen.conMediciones)
            : 0;

        return c.json({ success: true, data: resumen });
    } catch (error) {
        return c.json({ success: false, error: "Error al generar resumen" }, 500);
    }
});

export { indicadoresRouter as indicadoresRoutes };
