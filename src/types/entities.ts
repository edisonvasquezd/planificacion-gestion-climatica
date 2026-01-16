// =============================================================================
// Interfaces y Tipos del Sistema
// Basados en el modelo de datos de la propuesta y legislación chilena
// =============================================================================

import type {
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
} from "./enums";

// =============================================================================
// GeoJSON Types
// =============================================================================
export interface GeoJSONPoint {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONPolygon {
    type: "Polygon";
    coordinates: number[][][];
}

export interface GeoJSONMultiPolygon {
    type: "MultiPolygon";
    coordinates: number[][][][];
}

export type GeoJSONGeometry = GeoJSONPoint | GeoJSONPolygon | GeoJSONMultiPolygon;

// =============================================================================
// 1. Entidad: Plan
// =============================================================================
export interface Plan {
    planId: string;
    organizacionId: string;
    nombrePlan: string;
    tipoPlan: TipoPlan;
    version: string;
    estadoPlan: EstadoPlan;
    fechaAprobacion: Date | null;
    fechaVigenciaInicio: Date | null;
    fechaVigenciaFin: Date | null;
    responsablePlan: string;
    linkDocumentoPublico: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// 2. Entidad: Diagnóstico
// =============================================================================
export interface Diagnostico {
    diagnosticoId: string;
    planId: string;
    descripcionGeneral: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// --- Sub-Módulo: Inventario GEI (PACCC) ---
export interface EmisionSectorial {
    sector: SectorGEI;
    tco2eqSector: number;
}

export interface InventarioGEI {
    inventarioId: string;
    diagnosticoId: string;
    anioLineaBase: number;
    totalTco2eq: number;
    emisionesSectoriales: EmisionSectorial[];
    metodologia: string | null;
    fuenteDatos: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// --- Sub-Módulo: Amenaza ---
export interface Amenaza {
    amenazaId: string;
    diagnosticoId: string;
    tipoAmenaza: TipoAmenaza;
    nombreAmenaza: string;
    descripcionAmenaza: string | null;
    mapaAmenaza: GeoJSONGeometry | null;
    fuenteDatos: string | null;
    probabilidad: number | null; // 0-1
    intensidad: number | null;   // 0-1
    createdAt: Date;
    updatedAt: Date;
}

// --- Sub-Módulo: Vulnerabilidad ---
export interface Vulnerabilidad {
    vulnerabilidadId: string;
    diagnosticoId: string;
    dimensionVulnerabilidad: DimensionVulnerabilidad;
    nombreVulnerabilidad: string;
    descripcion: string | null;
    mapaVulnerabilidad: GeoJSONGeometry | null;
    indiceVulnerabilidad: number; // 0-1
    poblacionAfectada: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// --- Sub-Módulo: Activo Crítico ---
export interface ActivoCritico {
    activoId: string;
    diagnosticoId: string;
    nombreActivo: string;
    tipoActivo: TipoActivoCritico;
    descripcion: string | null;
    ubicacion: GeoJSONPoint;
    capacidad: string | null;
    criticidad: NivelRiesgo;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// 3. Entidad: Riesgo
// =============================================================================
export interface Riesgo {
    riesgoId: string;
    amenazaId: string;
    vulnerabilidadId: string;
    activoId: string | null;
    nombreRiesgo: string;
    nivelRiesgoCalculado: NivelRiesgo;
    justificacionRiesgo: string | null;
    mapaRiesgo: GeoJSONGeometry | null;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// 4. Entidad: Acción
// =============================================================================
export interface VerificadorSbN {
    criterio1DesafioSocial: boolean;
    criterio2EscalaPaisaje: boolean;
    criterio3GananciaBiodiversidad: boolean;
    criterio4ViabilidadEconomica: boolean;
    criterio5GobernanzaInclusiva: boolean;
    criterio6GestionTradeoffs: boolean;
    criterio7MonitoreoAdaptativo: boolean;
    criterio8Sostenibilidad: boolean;
}

export interface Accion {
    accionId: string;
    nombreAccion: string;
    descripcionAccion: string | null;
    responsableImplementacion: string;
    // Clasificación Legal
    pilarPaccc: PilarPACCC;
    faseCicloRiesgo: FaseCicloRiesgo;
    // Clasificación Metodológica SbN
    tipoSolucion: TipoSolucion;
    verificadorSbn: VerificadorSbN | null;
    // Relaciones
    relacionPlanIds: string[];
    relacionRiesgoIds: string[];
    relacionGeiSectores: SectorGEI[];
    // Metadatos
    costoEstimado: number | null;
    prioridad: number | null; // 1-5
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// 5. Entidad: Gestión
// =============================================================================
export interface Gestion {
    gestionId: string;
    accionId: string;
    estadoImplementacion: EstadoImplementacion;
    presupuestoAsignadoClp: number;
    presupuestoEjecutadoClp: number;
    fechaInicioProgramada: Date | null;
    fechaFinProgramada: Date | null;
    fechaInicioReal: Date | null;
    fechaFinReal: Date | null;
    observaciones: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// 6. Entidad: Indicador
// =============================================================================
export interface Indicador {
    indicadorId: string;
    accionId: string;
    nombreIndicador: string;
    tipoIndicador: TipoIndicador;
    unidadMedida: string;
    lineaBase: number;
    meta: number;
    frecuenciaMedicion: FrecuenciaMedicion;
    fuenteVerificacion: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// 7. Entidad: Medición
// =============================================================================
export interface Medicion {
    medicionId: string;
    indicadorId: string;
    fechaMedicion: Date;
    valorMedido: number;
    evidenciaUrl: string | null;
    observaciones: string | null;
    registradoPor: string;
    createdAt: Date;
}

// =============================================================================
// 8. Entidad: Actor
// =============================================================================
export interface ActaReunion {
    fecha: Date;
    tema: string;
    linkActa: string | null;
}

export interface Actor {
    actorId: string;
    nombreActor: string;
    tipoActor: TipoActor;
    rolEnPlan: RolActor;
    contactoNombre: string | null;
    contactoEmail: string | null;
    contactoTelefono: string | null;
    relacionPlanIds: string[];
    relacionAccionIds: string[];
    actasReunion: ActaReunion[];
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// 9. Participación Ciudadana
// =============================================================================
export interface ObservacionCiudadana {
    observacionId: string;
    planId: string;
    seccionPlan: string; // diagnóstico, acción específica, indicador
    contenidoObservacion: string;
    propuestaCiudadana: string | null;
    documentoRespaldo: string | null;
    ubicacionGeoreferenciada: GeoJSONPoint | null;
    // Identificación
    ciudadanoId: string | null; // null si anónimo
    esAnonimo: boolean;
    organizacionRepresentada: string | null;
    // Gestión
    estadoObservacion: EstadoObservacion;
    respuestaOrganizacion: string | null;
    justificacion: string | null;
    responsableAnalisis: string | null;
    fechaRespuesta: Date | null;
    // Metadatos
    createdAt: Date;
    updatedAt: Date;
}

export interface ConsultaPublica {
    consultaId: string;
    planId: string;
    fechaInicio: Date;
    fechaFin: Date;
    diasMinimos: number; // Mínimo 30 días (Ley 21.455)
    estadoConsulta: "Activa" | "Cerrada" | "En sistematización";
    totalParticipantes: number;
    totalObservaciones: number;
    informeConsultaUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// 10. Organizaciones y Usuarios
// =============================================================================
export type TipoOrganizacion = "Municipal" | "Privada";

export interface Organizacion {
    organizacionId: string;
    nombre: string;
    tipo: TipoOrganizacion;
    region: string;
    provincia: string;
    limitesGeograficos: GeoJSONPolygon | null;
    poblacion: number | null;
    contactoEmail: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Usuario {
    usuarioId: string;
    email: string;
    nombreCompleto: string;
    rol: RolUsuario;
    organizacionId: string | null; // null si es ciudadano o admin plataforma
    claveUnicaRut: string | null;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// Tipos auxiliares para UI
// =============================================================================
export interface SelectOption<T = string> {
    value: T;
    label: string;
}

export interface TableColumn<T> {
    key: keyof T;
    header: string;
    sortable?: boolean;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface PaginationParams {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
