// =============================================================================
// Acciones Routes - Actions Portfolio with SbN Verification
// =============================================================================

import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import type { Env } from "@/types/cloudflare";
import { acciones, gestiones } from "@/db/schema";
import type { Database } from "@/db";
import { requireAuth, requireOrganizacional } from "../middleware/auth";

const accionesRouter = new Hono<{
    Bindings: Env;
    Variables: { db: Database };
}>();

// =============================================================================
// Schemas
// =============================================================================

const verificadorSbnSchema = z.object({
    criterio1DesafioSocial: z.boolean(),
    criterio2EscalaPaisaje: z.boolean(),
    criterio3GananciaBiodiversidad: z.boolean(),
    criterio4ViabilidadEconomica: z.boolean(),
    criterio5GobernanzaInclusiva: z.boolean(),
    criterio6GestionTradeoffs: z.boolean(),
    criterio7MonitoreoAdaptativo: z.boolean(),
    criterio8Sostenibilidad: z.boolean(),
});

const createAccionSchema = z.object({
    nombreAccion: z.string().min(5),
    descripcionAccion: z.string().optional(),
    responsableImplementacion: z.string().min(2),
    pilarPaccc: z.string().default("N/A"), // Flexible: Mitigación, Adaptación, N/A
    faseCicloRiesgo: z.string().default("N/A"), // Flexible: Prevención, Mitigación, Preparación, Respuesta, Recuperación, N/A
    tipoSolucion: z.string().min(1), // Flexible: Gris, Verde, Híbrida, SbN
    verificadorSbn: verificadorSbnSchema.optional().or(z.string().optional()), // Accept object or string
    relacionPlanIds: z.array(z.string()).default([]),
    relacionRiesgoIds: z.array(z.string()).default([]),
    relacionGeiSectores: z.array(z.string()).default([]),
    costoEstimado: z.number().optional(),
    prioridad: z.number().min(1).max(5).optional(),
});

const createGestionSchema = z.object({
    estadoImplementacion: z.string().default("Diseño"), // Flexible: Diseño, Licitación, En Ejecución, Finalizada, Pausada
    presupuestoAsignadoClp: z.number().int().default(0),
    presupuestoEjecutadoClp: z.number().int().default(0),
    fechaInicioProgramada: z.string().optional(),
    fechaFinProgramada: z.string().optional(),
    observaciones: z.string().optional(),
});

// =============================================================================
// Routes
// =============================================================================

// GET /api/acciones
accionesRouter.get("/", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const { tipoSolucion, pilar, fase, page = "1", limit = "50" } = c.req.query();

        const result = await db.query.acciones.findMany({
            orderBy: [desc(acciones.createdAt)],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            with: {
                gestiones: true,
                indicadores: true,
            },
        });

        return c.json({ success: true, data: result });
    } catch (error) {
        return c.json({ success: false, error: "Error al listar acciones" }, 500);
    }
});

// GET /api/acciones/:id
accionesRouter.get("/:id", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const accionId = c.req.param("id");

        const accion = await db.query.acciones.findFirst({
            where: eq(acciones.accionId, accionId),
            with: {
                gestiones: true,
                indicadores: {
                    with: { mediciones: true },
                },
            },
        });

        if (!accion) {
            return c.json({ success: false, error: "Acción no encontrada" }, 404);
        }

        return c.json({ success: true, data: accion });
    } catch (error) {
        return c.json({ success: false, error: "Error al obtener acción" }, 500);
    }
});

// POST /api/acciones
accionesRouter.post("/", requireAuth, requireOrganizacional, async (c) => {
    try {
        const body = await c.req.json();
        const parsed = createAccionSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos", details: parsed.error.errors }, 400);
        }

        const db = c.get("db");

        // Validate SbN criteria if type is SbN
        if (parsed.data.tipoSolucion === "SbN" && !parsed.data.verificadorSbn) {
            return c.json({
                success: false,
                error: "Las soluciones SbN requieren verificación de los 8 criterios UICN"
            }, 400);
        }

        const [accion] = await db
            .insert(acciones)
            .values({
                ...parsed.data,
                verificadorSbn: parsed.data.verificadorSbn
                    ? JSON.stringify(parsed.data.verificadorSbn)
                    : null,
                relacionPlanIds: JSON.stringify(parsed.data.relacionPlanIds),
                relacionRiesgoIds: JSON.stringify(parsed.data.relacionRiesgoIds),
                relacionGeiSectores: JSON.stringify(parsed.data.relacionGeiSectores),
            })
            .returning();

        // Create initial gestion record
        await db.insert(gestiones).values({
            accionId: accion.accionId,
            estadoImplementacion: "Diseño",
            presupuestoAsignadoClp: 0,
            presupuestoEjecutadoClp: 0,
        });

        return c.json({ success: true, data: accion }, 201);
    } catch (error) {
        console.error("Create accion error:", error);
        return c.json({ success: false, error: "Error al crear acción" }, 500);
    }
});

// PATCH /api/acciones/:id
accionesRouter.patch("/:id", requireAuth, requireOrganizacional, async (c) => {
    try {
        const accionId = c.req.param("id");
        const body = await c.req.json();
        const db = c.get("db");

        const updateData: any = { ...body, updatedAt: new Date().toISOString() };

        if (body.verificadorSbn) {
            updateData.verificadorSbn = JSON.stringify(body.verificadorSbn);
        }
        if (body.relacionPlanIds) {
            updateData.relacionPlanIds = JSON.stringify(body.relacionPlanIds);
        }
        if (body.relacionRiesgoIds) {
            updateData.relacionRiesgoIds = JSON.stringify(body.relacionRiesgoIds);
        }

        const [updated] = await db
            .update(acciones)
            .set(updateData)
            .where(eq(acciones.accionId, accionId))
            .returning();

        if (!updated) {
            return c.json({ success: false, error: "Acción no encontrada" }, 404);
        }

        return c.json({ success: true, data: updated });
    } catch (error) {
        return c.json({ success: false, error: "Error al actualizar acción" }, 500);
    }
});

// PATCH /api/acciones/:id/gestion - Update implementation status
accionesRouter.patch("/:id/gestion", requireAuth, requireOrganizacional, async (c) => {
    try {
        const accionId = c.req.param("id");
        const body = await c.req.json();
        const parsed = createGestionSchema.partial().safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos" }, 400);
        }

        const db = c.get("db");

        const [updated] = await db
            .update(gestiones)
            .set({ ...parsed.data, updatedAt: new Date().toISOString() })
            .where(eq(gestiones.accionId, accionId))
            .returning();

        return c.json({ success: true, data: updated });
    } catch (error) {
        return c.json({ success: false, error: "Error al actualizar gestión" }, 500);
    }
});

// DELETE /api/acciones/:id
accionesRouter.delete("/:id", requireAuth, requireOrganizacional, async (c) => {
    try {
        const accionId = c.req.param("id");
        const db = c.get("db");

        await db.delete(acciones).where(eq(acciones.accionId, accionId));

        return c.json({ success: true, message: "Acción eliminada" });
    } catch (error) {
        return c.json({ success: false, error: "Error al eliminar acción" }, 500);
    }
});

// GET /api/acciones/sbn/verificar/:id - Verify SbN criteria
accionesRouter.get("/sbn/verificar/:id", requireAuth, async (c) => {
    try {
        const accionId = c.req.param("id");
        const db = c.get("db");

        const accion = await db.query.acciones.findFirst({
            where: eq(acciones.accionId, accionId),
        });

        if (!accion) {
            return c.json({ success: false, error: "Acción no encontrada" }, 404);
        }

        if (accion.tipoSolucion !== "SbN") {
            return c.json({
                success: false,
                error: "Solo las acciones tipo SbN requieren verificación"
            }, 400);
        }

        const verificador = accion.verificadorSbn
            ? JSON.parse(accion.verificadorSbn)
            : null;

        if (!verificador) {
            return c.json({
                success: true,
                data: {
                    cumple: false,
                    criteriosCumplidos: 0,
                    mensaje: "No se han verificado los criterios SbN",
                },
            });
        }

        const criteriosCumplidos = Object.values(verificador).filter(Boolean).length;
        const cumple = criteriosCumplidos === 8;

        return c.json({
            success: true,
            data: {
                cumple,
                criteriosCumplidos,
                totalCriterios: 8,
                porcentaje: Math.round((criteriosCumplidos / 8) * 100),
                detalle: verificador,
            },
        });
    } catch (error) {
        return c.json({ success: false, error: "Error al verificar SbN" }, 500);
    }
});

export { accionesRouter as accionesRoutes };
