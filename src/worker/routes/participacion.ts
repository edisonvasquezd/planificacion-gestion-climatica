// =============================================================================
// Participación Routes - Public Consultation & Citizen Observations
// =============================================================================

import { Hono } from "hono";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import type { Env } from "@/types/cloudflare";
import { consultasPublicas, observacionesCiudadanas, planes } from "@/db/schema";
import type { Database } from "@/db";
import { requireAuth, requireOrganizacional, optionalAuth } from "../middleware/auth";

const participacionRouter = new Hono<{
    Bindings: Env;
    Variables: { db: Database; userId?: string };
}>();

// =============================================================================
// Schemas
// =============================================================================

const createObservacionSchema = z.object({
    planId: z.string().uuid(),
    seccionPlan: z.string().min(1),
    contenidoObservacion: z.string().min(10),
    propuestaCiudadana: z.string().optional(),
    documentoRespaldo: z.string().url().optional(),
    ubicacionGeoreferenciada: z.string().optional(), // GeoJSON Point
    esAnonimo: z.boolean().default(false),
    organizacionRepresentada: z.string().optional(),
});

const responderObservacionSchema = z.object({
    estadoObservacion: z.string().min(1), // Flexible: Recibida, En análisis, Incorporada, Parcialmente incorporada, No incorporada
    respuestaOrganizacion: z.string().min(10),
    justificacion: z.string().min(10),
});

// =============================================================================
// Public Consultation Routes
// =============================================================================

// GET /api/participacion/consultas - List active consultations (PUBLIC)
participacionRouter.get("/consultas", async (c) => {
    try {
        const db = c.get("db");

        const result = await db.query.consultasPublicas.findMany({
            where: eq(consultasPublicas.estadoConsulta, "Activa"),
            orderBy: [desc(consultasPublicas.fechaInicio)],
            with: {
                plan: {
                    with: { organizacion: true },
                },
            },
        });

        return c.json({ success: true, data: result });
    } catch (error) {
        return c.json({ success: false, error: "Error al listar consultas" }, 500);
    }
});

// GET /api/participacion/consultas/:id - Get consultation details (PUBLIC)
participacionRouter.get("/consultas/:id", async (c) => {
    try {
        const db = c.get("db");
        const consultaId = c.req.param("id");

        const consulta = await db.query.consultasPublicas.findFirst({
            where: eq(consultasPublicas.consultaId, consultaId),
            with: {
                plan: {
                    with: {
                        organizacion: true,
                        diagnosticos: {
                            with: {
                                amenazas: true,
                                vulnerabilidades: true,
                            },
                        },
                    },
                },
            },
        });

        if (!consulta) {
            return c.json({ success: false, error: "Consulta no encontrada" }, 404);
        }

        // Calculate days remaining
        const fechaFin = new Date(consulta.fechaFin);
        const hoy = new Date();
        const diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

        return c.json({
            success: true,
            data: {
                ...consulta,
                diasRestantes: Math.max(0, diasRestantes),
                estaActiva: diasRestantes > 0 && consulta.estadoConsulta === "Activa",
            },
        });
    } catch (error) {
        return c.json({ success: false, error: "Error al obtener consulta" }, 500);
    }
});

// =============================================================================
// Citizen Observations Routes
// =============================================================================

// POST /api/participacion/observaciones - Submit observation (REQUIRES AUTH)
participacionRouter.post("/observaciones", requireAuth, async (c) => {
    try {
        const body = await c.req.json();
        const parsed = createObservacionSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos", details: parsed.error.errors }, 400);
        }

        const db = c.get("db");
        const userId = c.get("userId");

        if (!userId) {
            return c.json({
                success: false,
                error: "Debe estar registrado para enviar observaciones"
            }, 401);
        }

        // Verify plan is in public consultation
        const plan = await db.query.planes.findFirst({
            where: eq(planes.planId, parsed.data.planId),
        });

        if (!plan || plan.estadoPlan !== "En consulta pública") {
            return c.json({
                success: false,
                error: "El plan no está en período de consulta pública"
            }, 400);
        }

        // Verify consultation is still active
        const consulta = await db.query.consultasPublicas.findFirst({
            where: and(
                eq(consultasPublicas.planId, parsed.data.planId),
                eq(consultasPublicas.estadoConsulta, "Activa")
            ),
        });

        if (!consulta) {
            return c.json({
                success: false,
                error: "El período de consulta pública ha finalizado"
            }, 400);
        }

        // Check if consultation period has ended
        const fechaFin = new Date(consulta.fechaFin);
        if (new Date() > fechaFin) {
            return c.json({
                success: false,
                error: "El período de consulta pública ha finalizado"
            }, 400);
        }

        // Create observation - always associate with registered user
        const [observacion] = await db
            .insert(observacionesCiudadanas)
            .values({
                ...parsed.data,
                ciudadanoId: userId,
                esAnonimo: false, // No anonymous submissions
                estadoObservacion: "Recibida",
            })
            .returning();

        // Update consultation counters
        await db.update(consultasPublicas)
            .set({
                totalObservaciones: consulta.totalObservaciones + 1,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(consultasPublicas.consultaId, consulta.consultaId));

        return c.json({ success: true, data: observacion }, 201);
    } catch (error) {
        console.error("Create observacion error:", error);
        return c.json({ success: false, error: "Error al enviar observación" }, 500);
    }
});

// GET /api/participacion/mis-observaciones - Get observations by current user
participacionRouter.get("/mis-observaciones", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const userId = c.get("userId");

        const observaciones = await db.query.observacionesCiudadanas.findMany({
            where: eq(observacionesCiudadanas.ciudadanoId, userId),
            orderBy: [desc(observacionesCiudadanas.createdAt)],
            with: {
                plan: {
                    with: { organizacion: true },
                },
            },
        });

        return c.json({ success: true, data: observaciones });
    } catch (error) {
        return c.json({ success: false, error: "Error al obtener observaciones" }, 500);
    }
});

// GET /api/participacion/observaciones/:planId - List observations for a plan
participacionRouter.get("/observaciones/:planId", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const planId = c.req.param("planId");
        const { estado, page = "1", limit = "50" } = c.req.query();

        const result = await db.query.observacionesCiudadanas.findMany({
            where: eq(observacionesCiudadanas.planId, planId),
            orderBy: [desc(observacionesCiudadanas.createdAt)],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
        });

        return c.json({ success: true, data: result });
    } catch (error) {
        return c.json({ success: false, error: "Error al listar observaciones" }, 500);
    }
});

// PATCH /api/participacion/observaciones/:id/responder - Respond to observation
participacionRouter.patch("/:id/responder", requireAuth, requireOrganizacional, async (c) => {
    try {
        const observacionId = c.req.param("id");
        const body = await c.req.json();
        const parsed = responderObservacionSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos" }, 400);
        }

        const db = c.get("db");
        const userId = c.get("userId");

        const [updated] = await db
            .update(observacionesCiudadanas)
            .set({
                ...parsed.data,
                responsableAnalisis: userId,
                fechaRespuesta: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(observacionesCiudadanas.observacionId, observacionId))
            .returning();

        if (!updated) {
            return c.json({ success: false, error: "Observación no encontrada" }, 404);
        }

        return c.json({ success: true, data: updated });
    } catch (error) {
        return c.json({ success: false, error: "Error al responder observación" }, 500);
    }
});

// GET /api/participacion/informe/:planId - Generate consultation report
participacionRouter.get("/informe/:planId", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const planId = c.req.param("planId");

        const observaciones = await db.query.observacionesCiudadanas.findMany({
            where: eq(observacionesCiudadanas.planId, planId),
        });

        const consulta = await db.query.consultasPublicas.findFirst({
            where: eq(consultasPublicas.planId, planId),
        });

        // Generate report statistics
        const informe = {
            planId,
            fechaGeneracion: new Date().toISOString(),
            resumenCuantitativo: {
                totalObservaciones: observaciones.length,
                totalParticipantes: consulta?.totalParticipantes || 0,
                diasConsulta: consulta ?
                    Math.ceil((new Date(consulta.fechaFin).getTime() - new Date(consulta.fechaInicio).getTime()) / (1000 * 60 * 60 * 24)) : 0,
            },
            porEstado: {
                recibidas: observaciones.filter(o => o.estadoObservacion === "Recibida").length,
                enAnalisis: observaciones.filter(o => o.estadoObservacion === "En análisis").length,
                incorporadas: observaciones.filter(o => o.estadoObservacion === "Incorporada").length,
                parcialmenteIncorporadas: observaciones.filter(o => o.estadoObservacion === "Parcialmente incorporada").length,
                noIncorporadas: observaciones.filter(o => o.estadoObservacion === "No incorporada").length,
            },
            porSeccion: {} as Record<string, number>,
            tasaIncorporacion: 0,
        };

        // Group by section
        observaciones.forEach(obs => {
            informe.porSeccion[obs.seccionPlan] = (informe.porSeccion[obs.seccionPlan] || 0) + 1;
        });

        // Calculate incorporation rate
        const respondidas = observaciones.filter(o =>
            ["Incorporada", "Parcialmente incorporada", "No incorporada"].includes(o.estadoObservacion)
        ).length;

        if (respondidas > 0) {
            const incorporadas = informe.porEstado.incorporadas + informe.porEstado.parcialmenteIncorporadas;
            informe.tasaIncorporacion = Math.round((incorporadas / respondidas) * 100);
        }

        return c.json({ success: true, data: informe });
    } catch (error) {
        return c.json({ success: false, error: "Error al generar informe" }, 500);
    }
});

// POST /api/participacion/consultas/:id/cerrar - Close consultation
participacionRouter.post("/consultas/:id/cerrar", requireAuth, requireOrganizacional, async (c) => {
    try {
        const consultaId = c.req.param("id");
        const db = c.get("db");

        const [updated] = await db
            .update(consultasPublicas)
            .set({
                estadoConsulta: "Cerrada",
                updatedAt: new Date().toISOString(),
            })
            .where(eq(consultasPublicas.consultaId, consultaId))
            .returning();

        if (!updated) {
            return c.json({ success: false, error: "Consulta no encontrada" }, 404);
        }

        // Update plan status
        await db
            .update(planes)
            .set({ estadoPlan: "En elaboración", updatedAt: new Date().toISOString() })
            .where(eq(planes.planId, updated.planId));

        return c.json({ success: true, data: updated });
    } catch (error) {
        return c.json({ success: false, error: "Error al cerrar consulta" }, 500);
    }
});

export { participacionRouter as participacionRoutes };
