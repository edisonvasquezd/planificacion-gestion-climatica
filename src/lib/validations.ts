import { z } from "zod";
import {
    TipoPlan,
    EstadoPlan,
    SectorGEI,
    TipoAmenaza,
    DimensionVulnerabilidad,
    TipoActivoCritico,
    NivelRiesgo,
    PilarPACCC,
    FaseCicloRiesgo,
    TipoSolucion,
    EstadoImplementacion,
    TipoIndicador,
    FrecuenciaMedicion,
    TipoActor,
    RolActor,
    EstadoObservacion,
    RolUsuario,
} from "@/types/enums";

// =============================================================================
// Zod Validation Schemas
// =============================================================================

// --- GeoJSON ---
export const geoJsonPointSchema = z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([z.number(), z.number()]),
});

export const geoJsonPolygonSchema = z.object({
    type: z.literal("Polygon"),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
});

// --- Plan ---
export const createPlanSchema = z.object({
    municipalidadId: z.string().uuid(),
    nombrePlan: z.string().min(5).max(500),
    tipoPlan: z.nativeEnum(TipoPlan),
    version: z.string().default("1.0"),
    responsablePlan: z.string().min(2).max(255),
});

export const updatePlanSchema = createPlanSchema.partial().extend({
    estadoPlan: z.nativeEnum(EstadoPlan).optional(),
    fechaAprobacion: z.date().nullable().optional(),
    fechaVigenciaInicio: z.date().nullable().optional(),
    fechaVigenciaFin: z.date().nullable().optional(),
    linkDocumentoPublico: z.string().url().nullable().optional(),
});

// --- Diagnóstico ---
export const createDiagnosticoSchema = z.object({
    planId: z.string().uuid(),
    descripcionGeneral: z.string().optional(),
});

// --- Inventario GEI ---
export const emisionSectorialSchema = z.object({
    sector: z.nativeEnum(SectorGEI),
    tco2eqSector: z.number().nonnegative(),
});

export const createInventarioGeiSchema = z.object({
    diagnosticoId: z.string().uuid(),
    anioLineaBase: z.number().int().min(2000).max(2100),
    totalTco2eq: z.number().nonnegative(),
    emisionesSectoriales: z.array(emisionSectorialSchema),
    metodologia: z.string().optional(),
    fuenteDatos: z.string().optional(),
});

// --- Amenaza ---
export const createAmenazaSchema = z.object({
    diagnosticoId: z.string().uuid(),
    tipoAmenaza: z.nativeEnum(TipoAmenaza),
    nombreAmenaza: z.string().min(3).max(255),
    descripcionAmenaza: z.string().optional(),
    mapaAmenaza: geoJsonPolygonSchema.nullable().optional(),
    fuenteDatos: z.string().optional(),
    probabilidad: z.number().min(0).max(1).nullable().optional(),
    intensidad: z.number().min(0).max(1).nullable().optional(),
});

// --- Vulnerabilidad ---
export const createVulnerabilidadSchema = z.object({
    diagnosticoId: z.string().uuid(),
    dimensionVulnerabilidad: z.nativeEnum(DimensionVulnerabilidad),
    nombreVulnerabilidad: z.string().min(3).max(255),
    descripcion: z.string().optional(),
    mapaVulnerabilidad: geoJsonPolygonSchema.nullable().optional(),
    indiceVulnerabilidad: z.number().min(0).max(1),
    poblacionAfectada: z.string().optional(),
});

// --- Activo Crítico ---
export const createActivoCriticoSchema = z.object({
    diagnosticoId: z.string().uuid(),
    nombreActivo: z.string().min(3).max(255),
    tipoActivo: z.nativeEnum(TipoActivoCritico),
    descripcion: z.string().optional(),
    ubicacion: geoJsonPointSchema,
    capacidad: z.string().optional(),
    criticidad: z.nativeEnum(NivelRiesgo),
});

// --- Riesgo ---
export const createRiesgoSchema = z.object({
    amenazaId: z.string().uuid(),
    vulnerabilidadId: z.string().uuid(),
    activoId: z.string().uuid().nullable().optional(),
    nombreRiesgo: z.string().min(5).max(500),
    nivelRiesgoCalculado: z.nativeEnum(NivelRiesgo),
    justificacionRiesgo: z.string().optional(),
    mapaRiesgo: geoJsonPolygonSchema.nullable().optional(),
});

// --- Acción ---
export const verificadorSbnSchema = z.object({
    criterio1DesafioSocial: z.boolean(),
    criterio2EscalaPaisaje: z.boolean(),
    criterio3GananciaBiodiversidad: z.boolean(),
    criterio4ViabilidadEconomica: z.boolean(),
    criterio5GobernanzaInclusiva: z.boolean(),
    criterio6GestionTradeoffs: z.boolean(),
    criterio7MonitoreoAdaptativo: z.boolean(),
    criterio8Sostenibilidad: z.boolean(),
});

export const createAccionSchema = z.object({
    nombreAccion: z.string().min(5).max(500),
    descripcionAccion: z.string().optional(),
    responsableImplementacion: z.string().min(2).max(255),
    pilarPaccc: z.nativeEnum(PilarPACCC).default("N/A"),
    faseCicloRiesgo: z.nativeEnum(FaseCicloRiesgo).default("N/A"),
    tipoSolucion: z.nativeEnum(TipoSolucion),
    verificadorSbn: verificadorSbnSchema.nullable().optional(),
    relacionPlanIds: z.array(z.string().uuid()).default([]),
    relacionRiesgoIds: z.array(z.string().uuid()).default([]),
    relacionGeiSectores: z.array(z.nativeEnum(SectorGEI)).default([]),
    costoEstimado: z.number().nonnegative().nullable().optional(),
    prioridad: z.number().int().min(1).max(5).nullable().optional(),
});

// --- Gestión ---
export const createGestionSchema = z.object({
    accionId: z.string().uuid(),
    estadoImplementacion: z.nativeEnum(EstadoImplementacion).default("Diseño"),
    presupuestoAsignadoClp: z.number().int().nonnegative().default(0),
    presupuestoEjecutadoClp: z.number().int().nonnegative().default(0),
    fechaInicioProgramada: z.date().nullable().optional(),
    fechaFinProgramada: z.date().nullable().optional(),
    fechaInicioReal: z.date().nullable().optional(),
    fechaFinReal: z.date().nullable().optional(),
    observaciones: z.string().optional(),
});

// --- Indicador ---
export const createIndicadorSchema = z.object({
    accionId: z.string().uuid(),
    nombreIndicador: z.string().min(5).max(500),
    tipoIndicador: z.nativeEnum(TipoIndicador),
    unidadMedida: z.string().min(1).max(100),
    lineaBase: z.number(),
    meta: z.number(),
    frecuenciaMedicion: z.nativeEnum(FrecuenciaMedicion),
    fuenteVerificacion: z.string().optional(),
});

// --- Medición ---
export const createMedicionSchema = z.object({
    indicadorId: z.string().uuid(),
    fechaMedicion: z.date(),
    valorMedido: z.number(),
    evidenciaUrl: z.string().url().nullable().optional(),
    observaciones: z.string().optional(),
    registradoPor: z.string().uuid(),
});

// --- Actor ---
export const actaReunionSchema = z.object({
    fecha: z.date(),
    tema: z.string(),
    linkActa: z.string().url().nullable().optional(),
});

export const createActorSchema = z.object({
    nombreActor: z.string().min(2).max(255),
    tipoActor: z.nativeEnum(TipoActor),
    rolEnPlan: z.nativeEnum(RolActor),
    contactoNombre: z.string().optional(),
    contactoEmail: z.string().email().optional(),
    contactoTelefono: z.string().optional(),
    relacionPlanIds: z.array(z.string().uuid()).default([]),
    relacionAccionIds: z.array(z.string().uuid()).default([]),
    actasReunion: z.array(actaReunionSchema).default([]),
});

// --- Observación Ciudadana ---
export const createObservacionSchema = z.object({
    planId: z.string().uuid(),
    seccionPlan: z.string().min(1).max(255),
    contenidoObservacion: z.string().min(10),
    propuestaCiudadana: z.string().optional(),
    documentoRespaldo: z.string().url().optional(),
    ubicacionGeoreferenciada: geoJsonPointSchema.nullable().optional(),
    ciudadanoId: z.string().uuid().nullable().optional(),
    esAnonimo: z.boolean().default(false),
    organizacionRepresentada: z.string().optional(),
});

export const responderObservacionSchema = z.object({
    estadoObservacion: z.nativeEnum(EstadoObservacion),
    respuestaMunicipal: z.string().min(10),
    justificacion: z.string().min(10),
    responsableAnalisis: z.string().uuid(),
});

// --- Usuario ---
export const createUsuarioSchema = z.object({
    email: z.string().email(),
    nombreCompleto: z.string().min(2).max(255),
    rol: z.nativeEnum(RolUsuario).default("Ciudadano"),
    municipalidadId: z.string().uuid().nullable().optional(),
    claveUnicaRut: z.string().optional(),
});

// --- Municipalidad ---
export const createMunicipalidadSchema = z.object({
    nombre: z.string().min(2).max(255),
    region: z.string().min(2).max(100),
    provincia: z.string().min(2).max(100),
    limitesGeograficos: geoJsonPolygonSchema.nullable().optional(),
    poblacion: z.number().int().nonnegative().optional(),
    contactoEmail: z.string().email().optional(),
});

// --- Consulta Pública ---
export const createConsultaPublicaSchema = z.object({
    planId: z.string().uuid(),
    fechaInicio: z.date(),
    fechaFin: z.date(),
    diasMinimos: z.number().int().min(30).default(30),
});

// Export type inference
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type CreateDiagnosticoInput = z.infer<typeof createDiagnosticoSchema>;
export type CreateInventarioGeiInput = z.infer<typeof createInventarioGeiSchema>;
export type CreateAmenazaInput = z.infer<typeof createAmenazaSchema>;
export type CreateVulnerabilidadInput = z.infer<typeof createVulnerabilidadSchema>;
export type CreateActivoCriticoInput = z.infer<typeof createActivoCriticoSchema>;
export type CreateRiesgoInput = z.infer<typeof createRiesgoSchema>;
export type CreateAccionInput = z.infer<typeof createAccionSchema>;
export type CreateGestionInput = z.infer<typeof createGestionSchema>;
export type CreateIndicadorInput = z.infer<typeof createIndicadorSchema>;
export type CreateMedicionInput = z.infer<typeof createMedicionSchema>;
export type CreateActorInput = z.infer<typeof createActorSchema>;
export type CreateObservacionInput = z.infer<typeof createObservacionSchema>;
export type ResponderObservacionInput = z.infer<typeof responderObservacionSchema>;
export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type CreateMunicipalidadInput = z.infer<typeof createMunicipalidadSchema>;
export type CreateConsultaPublicaInput = z.infer<typeof createConsultaPublicaSchema>;
