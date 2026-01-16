// =============================================================================
// API Configuration
// =============================================================================

export const API_CONFIG = {
    // Base URLs for external APIs
    external: {
        sinapacc: process.env.SINAPACC_API_URL || "https://api.sinapacc.mma.gob.cl",
        senapred: process.env.SENAPRED_API_URL || "https://api.senapred.gob.cl",
        mercadoPublico: process.env.MERCADOPUBLICO_API_URL || "https://api.mercadopublico.cl",
        ideChileWms: process.env.IDE_CHILE_WMS_URL || "https://www.ide.cl/geoserver/wms",
        ideChileWfs: process.env.IDE_CHILE_WFS_URL || "https://www.ide.cl/geoserver/wfs",
        arclim: process.env.ARCLIM_API_URL || "https://arclim.mma.gob.cl/api",
    },

    // Pagination defaults
    pagination: {
        defaultPageSize: 20,
        maxPageSize: 100,
    },

    // File upload limits
    upload: {
        maxFileSizeMB: 10,
        allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
        ],
    },

    // Consulta pública settings (Ley 21.455)
    consultaPublica: {
        diasMinimos: 30, // Mínimo legal obligatorio
        diasDefault: 45,
    },

    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // requests per window
    },
};

// =============================================================================
// Application Constants
// =============================================================================

export const REGIONES_CHILE = [
    { codigo: "XV", nombre: "Arica y Parinacota" },
    { codigo: "I", nombre: "Tarapacá" },
    { codigo: "II", nombre: "Antofagasta" },
    { codigo: "III", nombre: "Atacama" },
    { codigo: "IV", nombre: "Coquimbo" },
    { codigo: "V", nombre: "Valparaíso" },
    { codigo: "RM", nombre: "Metropolitana" },
    { codigo: "VI", nombre: "O'Higgins" },
    { codigo: "VII", nombre: "Maule" },
    { codigo: "XVI", nombre: "Ñuble" },
    { codigo: "VIII", nombre: "Biobío" },
    { codigo: "IX", nombre: "La Araucanía" },
    { codigo: "XIV", nombre: "Los Ríos" },
    { codigo: "X", nombre: "Los Lagos" },
    { codigo: "XI", nombre: "Aysén" },
    { codigo: "XII", nombre: "Magallanes" },
];

export const SECTORES_GEI_INFO = {
    Energía: {
        descripcion: "Generación eléctrica, calefacción, industrias",
        icono: "⚡",
        color: "#f59e0b",
    },
    Transporte: {
        descripcion: "Vehículos, transporte público, carga",
        icono: "🚗",
        color: "#3b82f6",
    },
    Residuos: {
        descripcion: "Rellenos sanitarios, tratamiento de aguas",
        icono: "🗑️",
        color: "#8b5cf6",
    },
    IPPU: {
        descripcion: "Procesos Industriales y Uso de Productos",
        icono: "🏭",
        color: "#6b7280",
    },
    AFOLU: {
        descripcion: "Agricultura, Silvicultura y Otros Usos de la Tierra",
        icono: "🌾",
        color: "#22c55e",
    },
};

export const CRITERIOS_SBN_UICN = [
    {
        numero: 1,
        nombre: "Desafío Social",
        descripcion: "La SbN responde efectivamente a desafíos sociales",
    },
    {
        numero: 2,
        nombre: "Escala Paisaje",
        descripcion: "El diseño considera el paisaje más amplio",
    },
    {
        numero: 3,
        nombre: "Ganancia Biodiversidad",
        descripcion: "Resulta en ganancia neta de biodiversidad",
    },
    {
        numero: 4,
        nombre: "Viabilidad Económica",
        descripcion: "Es económicamente viable a largo plazo",
    },
    {
        numero: 5,
        nombre: "Gobernanza Inclusiva",
        descripcion: "Se basa en procesos de gobernanza inclusivos",
    },
    {
        numero: 6,
        nombre: "Gestión Tradeoffs",
        descripcion: "Equilibra trade-offs entre objetivos",
    },
    {
        numero: 7,
        nombre: "Monitoreo Adaptativo",
        descripcion: "Se gestiona de forma adaptativa con base en evidencia",
    },
    {
        numero: 8,
        nombre: "Sostenibilidad",
        descripcion: "Es sostenible y se integra al marco institucional",
    },
];
