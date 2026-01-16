// =============================================================================
// Enumeraciones del Sistema - Basadas en Ley 21.455 y Ley 21.364
// =============================================================================

// --- Plan ---
export const TipoPlan = {
    PACCC: "PACCC", // Plan de Acción Comunal de Cambio Climático (Ley 21.455)
    PGRD: "PGRD",   // Plan de Gestión de Riesgo de Desastres (Ley 21.364)
} as const;
export type TipoPlan = (typeof TipoPlan)[keyof typeof TipoPlan];

export const EstadoPlan = {
    EN_ELABORACION: "En elaboración",
    EN_CONSULTA_PUBLICA: "En consulta pública", // Obligatorio Ley 21.455
    VIGENTE: "Vigente",
    ARCHIVADO: "Archivado",
} as const;
export type EstadoPlan = (typeof EstadoPlan)[keyof typeof EstadoPlan];

// --- Diagnóstico: Inventario GEI ---
export const SectorGEI = {
    ENERGIA: "Energía",
    TRANSPORTE: "Transporte",
    RESIDUOS: "Residuos",
    IPPU: "IPPU", // Procesos Industriales y Uso de Productos
    AFOLU: "AFOLU", // Agricultura, Silvicultura y Otros Usos de la Tierra
} as const;
export type SectorGEI = (typeof SectorGEI)[keyof typeof SectorGEI];

// --- Diagnóstico: Amenazas (Ley 21.364) ---
export const TipoAmenaza = {
    GEOFISICA: "Geofísica",               // Sismo, Vulcanismo, Tsunami
    HIDROMETEOROLOGICA: "Hidrometeorológica", // Inundación, Sequía, Ola de calor
    BIOLOGICA: "Biológica",               // Marea Roja, Pandemia
    ANTROPICA: "Antrópica",               // Incendio forestal, Contaminación
} as const;
export type TipoAmenaza = (typeof TipoAmenaza)[keyof typeof TipoAmenaza];

// --- Diagnóstico: Vulnerabilidad ---
export const DimensionVulnerabilidad = {
    SOCIAL: "Social",
    ECONOMICA: "Económica",
    INFRAESTRUCTURAL: "Infraestructural",
    ECOSISTEMICA: "Ecosistémica",
} as const;
export type DimensionVulnerabilidad = (typeof DimensionVulnerabilidad)[keyof typeof DimensionVulnerabilidad];

// --- Diagnóstico: Activos Críticos ---
export const TipoActivoCritico = {
    INFRAESTRUCTURA_CRITICA: "Infraestructura crítica",
    SISTEMA_SOPORTE_VITAL: "Sistema de soporte vital",
    SERVICIO_ESENCIAL: "Servicio esencial",
    PATRIMONIO_CULTURAL: "Patrimonio cultural",
    EQUIPAMIENTO_COMUNAL: "Equipamiento comunal",
} as const;
export type TipoActivoCritico = (typeof TipoActivoCritico)[keyof typeof TipoActivoCritico];

// --- Riesgo ---
export const NivelRiesgo = {
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    CRITICO: "Crítico",
} as const;
export type NivelRiesgo = (typeof NivelRiesgo)[keyof typeof NivelRiesgo];

// --- Acción: Clasificación PACCC (Ley 21.455) ---
export const PilarPACCC = {
    MITIGACION: "Mitigación",
    ADAPTACION: "Adaptación",
    NA: "N/A",
} as const;
export type PilarPACCC = (typeof PilarPACCC)[keyof typeof PilarPACCC];

// --- Acción: Clasificación PGRD (Ley 21.364) ---
export const FaseCicloRiesgo = {
    PREVENCION: "Prevención",
    MITIGACION_RIESGO: "Mitigación (de Riesgo)",
    PREPARACION: "Preparación",
    RESPUESTA: "Respuesta",
    RECUPERACION: "Recuperación",
    NA: "N/A",
} as const;
export type FaseCicloRiesgo = (typeof FaseCicloRiesgo)[keyof typeof FaseCicloRiesgo];

// --- Acción: Tipo de Solución (SbN - UICN) ---
export const TipoSolucion = {
    GRIS: "Gris",         // Infraestructura tradicional
    VERDE: "Verde",       // Basada en ecosistemas
    HIBRIDA: "Híbrida",   // Combinación
    SBN: "SbN",           // Solución Basada en Naturaleza (verificada UICN)
} as const;
export type TipoSolucion = (typeof TipoSolucion)[keyof typeof TipoSolucion];

// --- Gestión: Estado de Implementación ---
export const EstadoImplementacion = {
    DISENO: "Diseño",
    LICITACION: "Licitación",
    EN_EJECUCION: "En Ejecución",
    FINALIZADA: "Finalizada",
    PAUSADA: "Pausada",
} as const;
export type EstadoImplementacion = (typeof EstadoImplementacion)[keyof typeof EstadoImplementacion];

// --- Indicador: Tipo ---
export const TipoIndicador = {
    IMPACTO_MITIGACION: "Impacto (PACCC-Mitigación)",
    IMPACTO_ADAPTACION: "Impacto (PACCC-Adaptación)",
    IMPACTO_REDUCCION_RIESGO: "Impacto (PGRD-Reducción Riesgo)",
    COBENEFICIO_BIODIVERSIDAD: "Co-Beneficio (SbN-Biodiversidad)",
    COBENEFICIO_SOCIAL: "Co-Beneficio (SbN-Social)",
    GESTION: "Gestión",
} as const;
export type TipoIndicador = (typeof TipoIndicador)[keyof typeof TipoIndicador];

// --- Indicador: Frecuencia de Medición ---
export const FrecuenciaMedicion = {
    MENSUAL: "Mensual",
    TRIMESTRAL: "Trimestral",
    SEMESTRAL: "Semestral",
    ANUAL: "Anual",
} as const;
export type FrecuenciaMedicion = (typeof FrecuenciaMedicion)[keyof typeof FrecuenciaMedicion];

// --- Actor: Tipo (Ley 21.364 / 21.455) ---
export const TipoActor = {
    ORGANISMO_PUBLICO: "Organismo Público",
    PRIVADO: "Privado",
    SOCIEDAD_CIVIL: "Sociedad Civil",
    ACADEMIA: "Academia",
} as const;
export type TipoActor = (typeof TipoActor)[keyof typeof TipoActor];

// --- Actor: Rol en Plan ---
export const RolActor = {
    COORDINADOR: "Coordinador",
    IMPLEMENTADOR: "Implementador",
    FISCALIZADOR: "Fiscalizador",
    CONSULTIVO: "Consultivo", // Participación ciudadana
} as const;
export type RolActor = (typeof RolActor)[keyof typeof RolActor];

// --- Participación Ciudadana: Estado de Observación ---
export const EstadoObservacion = {
    RECIBIDA: "Recibida",
    EN_ANALISIS: "En análisis",
    INCORPORADA: "Incorporada",
    PARCIALMENTE_INCORPORADA: "Parcialmente incorporada",
    NO_INCORPORADA: "No incorporada",
} as const;
export type EstadoObservacion = (typeof EstadoObservacion)[keyof typeof EstadoObservacion];

// --- Usuario: Roles del Sistema ---
export const RolUsuario = {
    ADMIN_PLATAFORMA: "Administrador Plataforma",
    ADMIN_MUNICIPAL: "Administrador Municipal",
    TECNICO_MUNICIPAL: "Técnico Municipal",
    CIUDADANO: "Ciudadano",
    OBSERVADOR: "Observador", // Solo lectura
} as const;
export type RolUsuario = (typeof RolUsuario)[keyof typeof RolUsuario];
