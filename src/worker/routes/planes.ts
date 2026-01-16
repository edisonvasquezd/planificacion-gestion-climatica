// =============================================================================
// Planes Routes - PACCC / PGRD Management
// =============================================================================

import { Hono } from "hono";
import { eq, desc, and, like } from "drizzle-orm";
import { z } from "zod";
import type { Env } from "@/types/cloudflare";
import { planes, diagnosticos, consultasPublicas, acciones, riesgos, amenazas, vulnerabilidades, activosCriticos, inventariosGei } from "@/db/schema";
import type { Database } from "@/db";
import { requireAuth, requireOrganizacional } from "../middleware/auth";

const planesRouter = new Hono<{
    Bindings: Env;
    Variables: { db: Database; userId: string; organizacionId: string };
}>();

// =============================================================================
// Schemas
// =============================================================================

const createPlanSchema = z.object({
    nombrePlan: z.string().min(5).max(500),
    tipoPlan: z.enum(["PACCC", "PGRD"]),
    responsablePlan: z.string().min(2),
    version: z.string().default("1.0"),
});

const updatePlanSchema = createPlanSchema.partial().extend({
    estadoPlan: z.enum(["En elaboración", "En consulta pública", "Vigente", "Archivado"]).optional(),
    fechaAprobacion: z.string().optional(),
    fechaVigenciaInicio: z.string().optional(),
    fechaVigenciaFin: z.string().optional(),
    linkDocumentoPublico: z.string().url().optional(),
});

// =============================================================================
// Routes
// =============================================================================

// GET /api/planes - List all plans (for current organization)
planesRouter.get("/", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const organizacionId = c.get("organizacionId");
        const userRol = c.get("userRol");

        const { tipoPlan, estado, page = "1", limit = "20" } = c.req.query();

        let query = db.query.planes.findMany({
            where: userRol === "Administrador Plataforma"
                ? undefined
                : eq(planes.organizacionId, organizacionId),
            orderBy: [desc(planes.createdAt)],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            with: {
                organizacion: true,
            },
        });

        const result = await query;

        return c.json({
            success: true,
            data: result,
            meta: { page: parseInt(page), pageSize: parseInt(limit) },
        });
    } catch (error) {
        console.error("List planes error:", error);
        return c.json({ success: false, error: "Error al listar planes" }, 500);
    }
});

// GET /api/planes/:id - Get single plan with diagnostics
planesRouter.get("/:id", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const planId = c.req.param("id");

        const plan = await db.query.planes.findFirst({
            where: eq(planes.planId, planId),
            with: {
                organizacion: true,
                diagnosticos: {
                    with: {
                        amenazas: true,
                        vulnerabilidades: true,
                        activosCriticos: true,
                        inventariosGei: true,
                    },
                },
                consultasPublicas: true,
            },
        });

        if (!plan) {
            return c.json({ success: false, error: "Plan no encontrado" }, 404);
        }

        return c.json({ success: true, data: plan });
    } catch (error) {
        console.error("Get plan error:", error);
        return c.json({ success: false, error: "Error al obtener plan" }, 500);
    }
});

// POST /api/planes - Create new plan
planesRouter.post("/", requireAuth, requireOrganizacional, async (c) => {
    try {
        const body = await c.req.json();
        const parsed = createPlanSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos", details: parsed.error.errors }, 400);
        }

        const db = c.get("db");
        const organizacionId = c.get("organizacionId");

        // Create plan
        const [newPlan] = await db
            .insert(planes)
            .values({
                ...parsed.data,
                organizacionId,
                estadoPlan: "En elaboración",
            })
            .returning();

        // Create empty diagnostic
        await db.insert(diagnosticos).values({
            planId: newPlan.planId,
            descripcionGeneral: null,
        });

        return c.json({ success: true, data: newPlan }, 201);
    } catch (error) {
        console.error("Create plan error:", error);
        return c.json({ success: false, error: "Error al crear plan" }, 500);
    }
});

// PATCH /api/planes/:id - Update plan
planesRouter.patch("/:id", requireAuth, requireOrganizacional, async (c) => {
    try {
        const planId = c.req.param("id");
        const body = await c.req.json();
        const parsed = updatePlanSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos" }, 400);
        }

        const db = c.get("db");

        const [updated] = await db
            .update(planes)
            .set({
                ...parsed.data,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(planes.planId, planId))
            .returning();

        if (!updated) {
            return c.json({ success: false, error: "Plan no encontrado" }, 404);
        }

        return c.json({ success: true, data: updated });
    } catch (error) {
        console.error("Update plan error:", error);
        return c.json({ success: false, error: "Error al actualizar plan" }, 500);
    }
});

// DELETE /api/planes/:id - Delete plan
planesRouter.delete("/:id", requireAuth, requireOrganizacional, async (c) => {
    try {
        const planId = c.req.param("id");
        const db = c.get("db");

        const [deleted] = await db
            .delete(planes)
            .where(eq(planes.planId, planId))
            .returning();

        if (!deleted) {
            return c.json({ success: false, error: "Plan no encontrado" }, 404);
        }

        return c.json({ success: true, message: "Plan eliminado" });
    } catch (error) {
        console.error("Delete plan error:", error);
        return c.json({ success: false, error: "Error al eliminar plan" }, 500);
    }
});

// GET /api/planes/:id/validar-completitud - Check plan completeness before consultation
planesRouter.get("/:id/validar-completitud", requireAuth, requireOrganizacional, async (c) => {
    try {
        const planId = c.req.param("id");
        const db = c.get("db");

        // Get plan with all related data
        const plan = await db.query.planes.findFirst({
            where: eq(planes.planId, planId),
            with: {
                diagnosticos: {
                    with: {
                        inventariosGei: true,
                        amenazas: true,
                        vulnerabilidades: true,
                        activosCriticos: true,
                    },
                },
            },
        });

        if (!plan) {
            return c.json({ success: false, error: "Plan no encontrado" }, 404);
        }

        // Get associated actions (via relacionPlanIds)
        const allAcciones = await db.query.acciones.findMany();
        const accionesDelPlan = allAcciones.filter(a => {
            const planIds = JSON.parse(a.relacionPlanIds || "[]");
            return planIds.includes(planId);
        });

        // Get all riesgos from this plan's diagnostics
        const diagnosticoIds = plan.diagnosticos.map(d => d.diagnosticoId);
        const amenazaIds = plan.diagnosticos.flatMap(d => d.amenazas.map(a => a.amenazaId));
        const allRiesgos = await db.query.riesgos.findMany();
        const riesgosDelPlan = allRiesgos.filter(r => amenazaIds.includes(r.amenazaId));

        // Calculate completeness
        const validaciones = {
            tieneInventarioGei: plan.diagnosticos.some(d => d.inventariosGei.length > 0),
            tieneAmenazas: plan.diagnosticos.some(d => d.amenazas.length > 0),
            tieneVulnerabilidades: plan.diagnosticos.some(d => d.vulnerabilidades.length > 0),
            tieneActivosCriticos: plan.diagnosticos.some(d => d.activosCriticos.length > 0),
            tieneRiesgos: riesgosDelPlan.length > 0,
            tieneAcciones: accionesDelPlan.length > 0,
        };

        const todoCompleto = Object.values(validaciones).every(v => v === true);

        const detalles = {
            inventariosGei: plan.diagnosticos.reduce((sum, d) => sum + d.inventariosGei.length, 0),
            amenazas: plan.diagnosticos.reduce((sum, d) => sum + d.amenazas.length, 0),
            vulnerabilidades: plan.diagnosticos.reduce((sum, d) => sum + d.vulnerabilidades.length, 0),
            activosCriticos: plan.diagnosticos.reduce((sum, d) => sum + d.activosCriticos.length, 0),
            riesgos: riesgosDelPlan.length,
            acciones: accionesDelPlan.length,
        };

        return c.json({
            success: true,
            data: {
                planId,
                nombrePlan: plan.nombrePlan,
                completo: todoCompleto,
                validaciones,
                detalles,
                mensajesFaltantes: Object.entries(validaciones)
                    .filter(([_, v]) => !v)
                    .map(([k, _]) => {
                        const mensajes: Record<string, string> = {
                            tieneInventarioGei: "Debe registrar al menos 1 inventario de emisiones GEI",
                            tieneAmenazas: "Debe identificar al menos 1 amenaza climática",
                            tieneVulnerabilidades: "Debe identificar al menos 1 vulnerabilidad",
                            tieneActivosCriticos: "Debe registrar al menos 1 activo crítico",
                            tieneRiesgos: "Debe evaluar al menos 1 riesgo en la matriz",
                            tieneAcciones: "Debe proponer al menos 1 acción",
                        };
                        return mensajes[k];
                    }),
            },
        });
    } catch (error) {
        console.error("Validar completitud error:", error);
        return c.json({ success: false, error: "Error al validar completitud" }, 500);
    }
});

// POST /api/planes/:id/iniciar-consulta - Start public consultation
planesRouter.post("/:id/iniciar-consulta", requireAuth, requireOrganizacional, async (c) => {
    try {
        const planId = c.req.param("id");
        const db = c.get("db");
        const body = await c.req.json();

        const diasConsulta = body.dias || 30; // Mínimo legal: 30 días
        const omitirValidacion = body.omitirValidacion === true; // Allow bypass for testing

        if (diasConsulta < 30) {
            return c.json({
                success: false,
                error: "La consulta pública debe durar mínimo 30 días (Ley 21.455)"
            }, 400);
        }

        // Validate plan completeness before starting consultation
        if (!omitirValidacion) {
            const plan = await db.query.planes.findFirst({
                where: eq(planes.planId, planId),
                with: {
                    diagnosticos: {
                        with: {
                            inventariosGei: true,
                            amenazas: true,
                            vulnerabilidades: true,
                            activosCriticos: true,
                        },
                    },
                },
            });

            if (!plan) {
                return c.json({ success: false, error: "Plan no encontrado" }, 404);
            }

            // Get associated actions
            const allAcciones = await db.query.acciones.findMany();
            const accionesDelPlan = allAcciones.filter(a => {
                const planIds = JSON.parse(a.relacionPlanIds || "[]");
                return planIds.includes(planId);
            });

            // Get riesgos
            const amenazaIds = plan.diagnosticos.flatMap(d => d.amenazas.map(a => a.amenazaId));
            const allRiesgos = await db.query.riesgos.findMany();
            const riesgosDelPlan = allRiesgos.filter(r => amenazaIds.includes(r.amenazaId));

            // Validate completeness
            const faltantes: string[] = [];

            if (!plan.diagnosticos.some(d => d.inventariosGei.length > 0)) {
                faltantes.push("Inventario de emisiones GEI");
            }
            if (!plan.diagnosticos.some(d => d.amenazas.length > 0)) {
                faltantes.push("Amenazas climáticas identificadas");
            }
            if (!plan.diagnosticos.some(d => d.vulnerabilidades.length > 0)) {
                faltantes.push("Vulnerabilidades identificadas");
            }
            if (!plan.diagnosticos.some(d => d.activosCriticos.length > 0)) {
                faltantes.push("Activos críticos registrados");
            }
            if (riesgosDelPlan.length === 0) {
                faltantes.push("Riesgos evaluados en matriz");
            }
            if (accionesDelPlan.length === 0) {
                faltantes.push("Acciones propuestas");
            }

            if (faltantes.length > 0) {
                return c.json({
                    success: false,
                    error: "El plan no está completo para iniciar consulta pública",
                    faltantes,
                    mensaje: `Antes de iniciar la consulta pública, debe completar: ${faltantes.join(", ")}`
                }, 400);
            }
        }

        // Check if there's already an active consultation
        const consultaExistente = await db.query.consultasPublicas.findFirst({
            where: and(
                eq(consultasPublicas.planId, planId),
                eq(consultasPublicas.estadoConsulta, "Activa")
            ),
        });

        if (consultaExistente) {
            return c.json({
                success: false,
                error: "Ya existe una consulta pública activa para este plan"
            }, 400);
        }

        const fechaInicio = new Date();
        const fechaFin = new Date(fechaInicio.getTime() + diasConsulta * 24 * 60 * 60 * 1000);

        // Update plan status
        await db
            .update(planes)
            .set({ estadoPlan: "En consulta pública", updatedAt: new Date().toISOString() })
            .where(eq(planes.planId, planId));

        // Create consulta publica record
        const [consulta] = await db
            .insert(consultasPublicas)
            .values({
                planId,
                fechaInicio: fechaInicio.toISOString(),
                fechaFin: fechaFin.toISOString(),
                diasMinimos: 30,
                estadoConsulta: "Activa",
            })
            .returning();

        return c.json({ success: true, data: consulta });
    } catch (error) {
        console.error("Iniciar consulta error:", error);
        return c.json({ success: false, error: "Error al iniciar consulta pública" }, 500);
    }
});

export { planesRouter as planesRoutes };
