// =============================================================================
// Diagnósticos Routes - GEI, Amenazas, Vulnerabilidades, Activos Críticos
// =============================================================================

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Env } from "@/types/cloudflare";
import { diagnosticos, inventariosGei, amenazas, vulnerabilidades, activosCriticos } from "@/db/schema";
import type { Database } from "@/db";
import { requireAuth, requireOrganizacional } from "../middleware/auth";

const diagnosticosRouter = new Hono<{
    Bindings: Env;
    Variables: { db: Database };
}>();

// =============================================================================
// Schemas
// =============================================================================

const inventarioGeiSchema = z.object({
    anioLineaBase: z.number().int().min(2000).max(2100),
    totalTco2eq: z.number().nonnegative(),
    emisionesSectoriales: z.record(z.string(), z.number()), // Objeto flexible {Energia: number, Transporte: number, etc}
    metodologia: z.string().optional(),
    fuenteDatos: z.string().optional(),
});

const amenazaSchema = z.object({
    tipoAmenaza: z.string().min(3), // Flexible para cualquier tipo
    nombreAmenaza: z.string().min(3),
    descripcionAmenaza: z.string().optional(),
    mapaAmenaza: z.string().optional(), // GeoJSON string
    fuenteDatos: z.string().optional(),
    probabilidad: z.number().min(0).max(1).optional(),
    intensidad: z.number().min(0).max(1).optional(),
});

const vulnerabilidadSchema = z.object({
    dimensionVulnerabilidad: z.string().min(3), // Flexible
    nombreVulnerabilidad: z.string().min(3),
    descripcion: z.string().optional(),
    mapaVulnerabilidad: z.string().optional(),
    indiceVulnerabilidad: z.number().min(0).max(1),
    poblacionAfectada: z.string().optional(),
});

const activoCriticoSchema = z.object({
    nombreActivo: z.string().min(3),
    tipoActivo: z.string().min(3), // Flexible para aceptar cualquier tipo de activo
    descripcion: z.string().optional(),
    ubicacion: z.string(), // GeoJSON Point string or address
    capacidad: z.string().optional(),
    criticidad: z.string().min(3), // Flexible: Baja, Media, Alta, Crítica
});

// =============================================================================
// Diagnóstico Routes
// =============================================================================

// GET /api/diagnosticos/:planId
diagnosticosRouter.get("/:planId", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const planId = c.req.param("planId");

        const diagnostico = await db.query.diagnosticos.findFirst({
            where: eq(diagnosticos.planId, planId),
            with: {
                inventariosGei: true,
                amenazas: true,
                vulnerabilidades: true,
                activosCriticos: true,
            },
        });

        if (!diagnostico) {
            return c.json({ success: false, error: "Diagnóstico no encontrado" }, 404);
        }

        return c.json({ success: true, data: diagnostico });
    } catch (error) {
        console.error("Get diagnostico error:", error);
        return c.json({ success: false, error: "Error al obtener diagnóstico" }, 500);
    }
});

// =============================================================================
// Inventario GEI Routes
// =============================================================================

// POST /api/diagnosticos/:diagnosticoId/inventario-gei
diagnosticosRouter.post("/:diagnosticoId/inventario-gei", requireAuth, requireOrganizacional, async (c) => {
    try {
        const diagnosticoId = c.req.param("diagnosticoId");
        const body = await c.req.json();
        const parsed = inventarioGeiSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos", details: parsed.error.errors }, 400);
        }

        const db = c.get("db");

        const [inventario] = await db
            .insert(inventariosGei)
            .values({
                diagnosticoId,
                ...parsed.data,
                emisionesSectoriales: JSON.stringify(parsed.data.emisionesSectoriales),
            })
            .returning();

        return c.json({ success: true, data: inventario }, 201);
    } catch (error) {
        console.error("Create inventario GEI error:", error);
        return c.json({ success: false, error: "Error al crear inventario GEI" }, 500);
    }
});

// =============================================================================
// Amenazas Routes
// =============================================================================

// GET /api/diagnosticos/:diagnosticoId/amenazas
diagnosticosRouter.get("/:diagnosticoId/amenazas", requireAuth, async (c) => {
    try {
        const db = c.get("db");
        const diagnosticoId = c.req.param("diagnosticoId");

        const result = await db.query.amenazas.findMany({
            where: eq(amenazas.diagnosticoId, diagnosticoId),
        });

        return c.json({ success: true, data: result });
    } catch (error) {
        return c.json({ success: false, error: "Error al listar amenazas" }, 500);
    }
});

// POST /api/diagnosticos/:diagnosticoId/amenazas
diagnosticosRouter.post("/:diagnosticoId/amenazas", requireAuth, requireOrganizacional, async (c) => {
    try {
        const diagnosticoId = c.req.param("diagnosticoId");
        const body = await c.req.json();
        const parsed = amenazaSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos" }, 400);
        }

        const db = c.get("db");

        const [amenaza] = await db
            .insert(amenazas)
            .values({ diagnosticoId, ...parsed.data })
            .returning();

        return c.json({ success: true, data: amenaza }, 201);
    } catch (error) {
        return c.json({ success: false, error: "Error al crear amenaza" }, 500);
    }
});

// =============================================================================
// Vulnerabilidades Routes
// =============================================================================

// POST /api/diagnosticos/:diagnosticoId/vulnerabilidades
diagnosticosRouter.post("/:diagnosticoId/vulnerabilidades", requireAuth, requireOrganizacional, async (c) => {
    try {
        const diagnosticoId = c.req.param("diagnosticoId");
        const body = await c.req.json();
        const parsed = vulnerabilidadSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos" }, 400);
        }

        const db = c.get("db");

        const [vulnerabilidad] = await db
            .insert(vulnerabilidades)
            .values({ diagnosticoId, ...parsed.data })
            .returning();

        return c.json({ success: true, data: vulnerabilidad }, 201);
    } catch (error) {
        return c.json({ success: false, error: "Error al crear vulnerabilidad" }, 500);
    }
});

// =============================================================================
// Activos Críticos Routes
// =============================================================================

// POST /api/diagnosticos/:diagnosticoId/activos-criticos
diagnosticosRouter.post("/:diagnosticoId/activos-criticos", requireAuth, requireOrganizacional, async (c) => {
    try {
        const diagnosticoId = c.req.param("diagnosticoId");
        const body = await c.req.json();
        const parsed = activoCriticoSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos" }, 400);
        }

        const db = c.get("db");

        const [activo] = await db
            .insert(activosCriticos)
            .values({ diagnosticoId, ...parsed.data })
            .returning();

        return c.json({ success: true, data: activo }, 201);
    } catch (error) {
        return c.json({ success: false, error: "Error al crear activo crítico" }, 500);
    }
});

export { diagnosticosRouter as diagnosticosRoutes };
