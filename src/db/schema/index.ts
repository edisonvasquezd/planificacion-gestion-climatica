// =============================================================================
// Database Schema - Drizzle ORM for Cloudflare D1 (SQLite)
// RESILIAI - Resiliencia Climática Inteligente
// =============================================================================

import {
    sqliteTable,
    text,
    integer,
    real,
    index,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// =============================================================================
// Helper: Generate UUID default
// =============================================================================
const generateId = () => crypto.randomUUID();

// =============================================================================
// Tables
// =============================================================================

// --- Organización (Municipalidades y Empresas Privadas) ---
export const organizaciones = sqliteTable(
    "organizaciones",
    {
        organizacionId: text("organizacion_id").primaryKey().$defaultFn(generateId),
        nombre: text("nombre").notNull(),
        tipo: text("tipo").notNull().default("Municipal"), // "Municipal" | "Privada"
        region: text("region").notNull(),
        provincia: text("provincia").notNull(),
        limitesGeograficos: text("limites_geograficos"), // GeoJSON as text
        poblacion: integer("poblacion"),
        contactoEmail: text("contacto_email"),
        createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
        updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        nombreIdx: index("organizaciones_nombre_idx").on(table.nombre),
        regionIdx: index("organizaciones_region_idx").on(table.region),
        tipoIdx: index("organizaciones_tipo_idx").on(table.tipo),
    })
);

// --- Usuario ---
export const usuarios = sqliteTable(
    "usuarios",
    {
        usuarioId: text("usuario_id").primaryKey().$defaultFn(generateId),
        email: text("email").notNull().unique(),
        nombreCompleto: text("nombre_completo").notNull(),
        passwordHash: text("password_hash"),
        rol: text("rol").notNull().default("Ciudadano"),
        organizacionId: text("organizacion_id").references(
            () => organizaciones.organizacionId
        ),
        claveUnicaRut: text("clave_unica_rut"),
        activo: integer("activo", { mode: "boolean" }).default(true),
        createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
        updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        emailIdx: index("usuarios_email_idx").on(table.email),
        organizacionIdx: index("usuarios_organizacion_idx").on(table.organizacionId),
    })
);

// --- Plan ---
export const planes = sqliteTable(
    "planes",
    {
        planId: text("plan_id").primaryKey().$defaultFn(generateId),
        organizacionId: text("organizacion_id")
            .notNull()
            .references(() => organizaciones.organizacionId),
        nombrePlan: text("nombre_plan").notNull(),
        tipoPlan: text("tipo_plan").notNull(), // PACCC | PGRD
        version: text("version").notNull().default("1.0"),
        estadoPlan: text("estado_plan").notNull().default("En elaboración"),
        fechaAprobacion: text("fecha_aprobacion"),
        fechaVigenciaInicio: text("fecha_vigencia_inicio"),
        fechaVigenciaFin: text("fecha_vigencia_fin"),
        responsablePlan: text("responsable_plan").notNull(),
        linkDocumentoPublico: text("link_documento_publico"),
        createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
        updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        organizacionIdx: index("planes_organizacion_idx").on(table.organizacionId),
        tipoPlanIdx: index("planes_tipo_plan_idx").on(table.tipoPlan),
        estadoPlanIdx: index("planes_estado_plan_idx").on(table.estadoPlan),
    })
);

// --- Diagnóstico ---
export const diagnosticos = sqliteTable("diagnosticos", {
    diagnosticoId: text("diagnostico_id").primaryKey().$defaultFn(generateId),
    planId: text("plan_id")
        .notNull()
        .references(() => planes.planId),
    descripcionGeneral: text("descripcion_general"),
    createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// --- Inventario GEI ---
export const inventariosGei = sqliteTable("inventarios_gei", {
    inventarioId: text("inventario_id").primaryKey().$defaultFn(generateId),
    diagnosticoId: text("diagnostico_id")
        .notNull()
        .references(() => diagnosticos.diagnosticoId),
    anioLineaBase: integer("anio_linea_base").notNull(),
    totalTco2eq: real("total_tco2eq").notNull(),
    emisionesSectoriales: text("emisiones_sectoriales").notNull(), // JSON string
    metodologia: text("metodologia"),
    fuenteDatos: text("fuente_datos"),
    createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

// --- Amenaza ---
export const amenazas = sqliteTable(
    "amenazas",
    {
        amenazaId: text("amenaza_id").primaryKey().$defaultFn(generateId),
        diagnosticoId: text("diagnostico_id")
            .notNull()
            .references(() => diagnosticos.diagnosticoId),
        tipoAmenaza: text("tipo_amenaza").notNull(),
        nombreAmenaza: text("nombre_amenaza").notNull(),
        descripcionAmenaza: text("descripcion_amenaza"),
        mapaAmenaza: text("mapa_amenaza"), // GeoJSON as text
        fuenteDatos: text("fuente_datos"),
        probabilidad: real("probabilidad"),
        intensidad: real("intensidad"),
        createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
        updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        tipoAmenazaIdx: index("amenazas_tipo_idx").on(table.tipoAmenaza),
        diagnosticoIdx: index("amenazas_diagnostico_idx").on(table.diagnosticoId),
    })
);

// --- Vulnerabilidad ---
export const vulnerabilidades = sqliteTable(
    "vulnerabilidades",
    {
        vulnerabilidadId: text("vulnerabilidad_id").primaryKey().$defaultFn(generateId),
        diagnosticoId: text("diagnostico_id")
            .notNull()
            .references(() => diagnosticos.diagnosticoId),
        dimensionVulnerabilidad: text("dimension_vulnerabilidad").notNull(),
        nombreVulnerabilidad: text("nombre_vulnerabilidad").notNull(),
        descripcion: text("descripcion"),
        mapaVulnerabilidad: text("mapa_vulnerabilidad"), // GeoJSON
        indiceVulnerabilidad: real("indice_vulnerabilidad").notNull(),
        poblacionAfectada: text("poblacion_afectada"),
        createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
        updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        dimensionIdx: index("vulnerabilidades_dimension_idx").on(table.dimensionVulnerabilidad),
        diagnosticoIdx: index("vulnerabilidades_diagnostico_idx").on(table.diagnosticoId),
    })
);

// --- Activo Crítico ---
export const activosCriticos = sqliteTable(
    "activos_criticos",
    {
        activoId: text("activo_id").primaryKey().$defaultFn(generateId),
        diagnosticoId: text("diagnostico_id")
            .notNull()
            .references(() => diagnosticos.diagnosticoId),
        nombreActivo: text("nombre_activo").notNull(),
        tipoActivo: text("tipo_activo").notNull(),
        descripcion: text("descripcion"),
        ubicacion: text("ubicacion").notNull(), // GeoJSON Point
        capacidad: text("capacidad"),
        criticidad: text("criticidad").notNull(),
        createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
        updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        tipoActivoIdx: index("activos_criticos_tipo_idx").on(table.tipoActivo),
        diagnosticoIdx: index("activos_criticos_diagnostico_idx").on(table.diagnosticoId),
    })
);

// --- Riesgo ---
export const riesgos = sqliteTable(
    "riesgos",
    {
        riesgoId: text("riesgo_id").primaryKey().$defaultFn(generateId),
        amenazaId: text("amenaza_id")
            .notNull()
            .references(() => amenazas.amenazaId),
        vulnerabilidadId: text("vulnerabilidad_id")
            .notNull()
            .references(() => vulnerabilidades.vulnerabilidadId),
        activoId: text("activo_id").references(() => activosCriticos.activoId),
        nombreRiesgo: text("nombre_riesgo").notNull(),
        nivelRiesgoCalculado: text("nivel_riesgo_calculado").notNull(),
        justificacionRiesgo: text("justificacion_riesgo"),
        mapaRiesgo: text("mapa_riesgo"), // GeoJSON
        createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
        updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        nivelRiesgoIdx: index("riesgos_nivel_idx").on(table.nivelRiesgoCalculado),
        amenazaIdx: index("riesgos_amenaza_idx").on(table.amenazaId),
        vulnerabilidadIdx: index("riesgos_vulnerabilidad_idx").on(table.vulnerabilidadId),
    })
);

// --- Acción ---
export const acciones = sqliteTable(
    "acciones",
    {
        accionId: text("accion_id").primaryKey().$defaultFn(generateId),
        nombreAccion: text("nombre_accion").notNull(),
        descripcionAccion: text("descripcion_accion"),
        responsableImplementacion: text("responsable_implementacion").notNull(),
        pilarPaccc: text("pilar_paccc").notNull().default("N/A"),
        faseCicloRiesgo: text("fase_ciclo_riesgo").notNull().default("N/A"),
        tipoSolucion: text("tipo_solucion").notNull(),
        verificadorSbn: text("verificador_sbn"), // JSON string
        relacionPlanIds: text("relacion_plan_ids").notNull().default("[]"),
        relacionRiesgoIds: text("relacion_riesgo_ids").notNull().default("[]"),
        relacionGeiSectores: text("relacion_gei_sectores").notNull().default("[]"),
        costoEstimado: real("costo_estimado"),
        prioridad: integer("prioridad"),
        createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
        updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        pilarIdx: index("acciones_pilar_idx").on(table.pilarPaccc),
        faseIdx: index("acciones_fase_idx").on(table.faseCicloRiesgo),
        tipoSolucionIdx: index("acciones_tipo_solucion_idx").on(table.tipoSolucion),
    })
);

// --- Gestión ---
export const gestiones = sqliteTable(
    "gestiones",
    {
        gestionId: text("gestion_id").primaryKey().$defaultFn(generateId),
        accionId: text("accion_id")
            .notNull()
            .references(() => acciones.accionId),
        estadoImplementacion: text("estado_implementacion").notNull().default("Diseño"),
        presupuestoAsignadoClp: integer("presupuesto_asignado_clp").notNull().default(0),
        presupuestoEjecutadoClp: integer("presupuesto_ejecutado_clp").notNull().default(0),
        fechaInicioProgramada: text("fecha_inicio_programada"),
        fechaFinProgramada: text("fecha_fin_programada"),
        fechaInicioReal: text("fecha_inicio_real"),
        fechaFinReal: text("fecha_fin_real"),
        observaciones: text("observaciones"),
        createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
        updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        estadoIdx: index("gestiones_estado_idx").on(table.estadoImplementacion),
        accionIdx: index("gestiones_accion_idx").on(table.accionId),
    })
);

// --- Indicador ---
export const indicadores = sqliteTable(
    "indicadores",
    {
        indicadorId: text("indicador_id").primaryKey().$defaultFn(generateId),
        accionId: text("accion_id")
            .notNull()
            .references(() => acciones.accionId),
        nombreIndicador: text("nombre_indicador").notNull(),
        tipoIndicador: text("tipo_indicador").notNull(),
        unidadMedida: text("unidad_medida").notNull(),
        lineaBase: real("linea_base").notNull(),
        meta: real("meta").notNull(),
        frecuenciaMedicion: text("frecuencia_medicion").notNull(),
        fuenteVerificacion: text("fuente_verificacion"),
        createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
        updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        tipoIndicadorIdx: index("indicadores_tipo_idx").on(table.tipoIndicador),
        accionIdx: index("indicadores_accion_idx").on(table.accionId),
    })
);

// --- Medición ---
export const mediciones = sqliteTable(
    "mediciones",
    {
        medicionId: text("medicion_id").primaryKey().$defaultFn(generateId),
        indicadorId: text("indicador_id")
            .notNull()
            .references(() => indicadores.indicadorId),
        fechaMedicion: text("fecha_medicion").notNull(),
        valorMedido: real("valor_medido").notNull(),
        evidenciaUrl: text("evidencia_url"),
        observaciones: text("observaciones"),
        registradoPor: text("registrado_por")
            .notNull()
            .references(() => usuarios.usuarioId),
        createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        indicadorIdx: index("mediciones_indicador_idx").on(table.indicadorId),
        fechaIdx: index("mediciones_fecha_idx").on(table.fechaMedicion),
    })
);

// --- Actor ---
export const actores = sqliteTable(
    "actores",
    {
        actorId: text("actor_id").primaryKey().$defaultFn(generateId),
        nombreActor: text("nombre_actor").notNull(),
        tipoActor: text("tipo_actor").notNull(),
        rolEnPlan: text("rol_en_plan").notNull(),
        contactoNombre: text("contacto_nombre"),
        contactoEmail: text("contacto_email"),
        contactoTelefono: text("contacto_telefono"),
        relacionPlanIds: text("relacion_plan_ids").notNull().default("[]"),
        relacionAccionIds: text("relacion_accion_ids").notNull().default("[]"),
        actasReunion: text("actas_reunion").notNull().default("[]"),
        createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
        updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        tipoActorIdx: index("actores_tipo_idx").on(table.tipoActor),
        rolIdx: index("actores_rol_idx").on(table.rolEnPlan),
    })
);

// --- Consulta Pública ---
export const consultasPublicas = sqliteTable(
    "consultas_publicas",
    {
        consultaId: text("consulta_id").primaryKey().$defaultFn(generateId),
        planId: text("plan_id")
            .notNull()
            .references(() => planes.planId),
        fechaInicio: text("fecha_inicio").notNull(),
        fechaFin: text("fecha_fin").notNull(),
        diasMinimos: integer("dias_minimos").notNull().default(30),
        estadoConsulta: text("estado_consulta").notNull().default("Activa"),
        totalParticipantes: integer("total_participantes").notNull().default(0),
        totalObservaciones: integer("total_observaciones").notNull().default(0),
        informeConsultaUrl: text("informe_consulta_url"),
        createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
        updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        planIdx: index("consultas_publicas_plan_idx").on(table.planId),
        estadoIdx: index("consultas_publicas_estado_idx").on(table.estadoConsulta),
    })
);

// --- Observación Ciudadana ---
export const observacionesCiudadanas = sqliteTable(
    "observaciones_ciudadanas",
    {
        observacionId: text("observacion_id").primaryKey().$defaultFn(generateId),
        planId: text("plan_id")
            .notNull()
            .references(() => planes.planId),
        seccionPlan: text("seccion_plan").notNull(),
        contenidoObservacion: text("contenido_observacion").notNull(),
        propuestaCiudadana: text("propuesta_ciudadana"),
        documentoRespaldo: text("documento_respaldo"),
        ubicacionGeoreferenciada: text("ubicacion_georeferenciada"), // GeoJSON
        ciudadanoId: text("ciudadano_id").references(() => usuarios.usuarioId),
        esAnonimo: integer("es_anonimo", { mode: "boolean" }).notNull().default(false),
        organizacionRepresentada: text("organizacion_representada"),
        estadoObservacion: text("estado_observacion").notNull().default("Recibida"),
        respuestaOrganizacion: text("respuesta_organizacion"),
        justificacion: text("justificacion"),
        responsableAnalisis: text("responsable_analisis").references(() => usuarios.usuarioId),
        fechaRespuesta: text("fecha_respuesta"),
        createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
        updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        planIdx: index("observaciones_plan_idx").on(table.planId),
        estadoIdx: index("observaciones_estado_idx").on(table.estadoObservacion),
    })
);

// --- Audit Log ---
export const auditLog = sqliteTable(
    "audit_log",
    {
        logId: text("log_id").primaryKey().$defaultFn(generateId),
        usuarioId: text("usuario_id").references(() => usuarios.usuarioId),
        accion: text("accion").notNull(),
        entidad: text("entidad").notNull(),
        entidadId: text("entidad_id").notNull(),
        datosAnteriores: text("datos_anteriores"), // JSON
        datosNuevos: text("datos_nuevos"), // JSON
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
    },
    (table) => ({
        usuarioIdx: index("audit_log_usuario_idx").on(table.usuarioId),
        entidadIdx: index("audit_log_entidad_idx").on(table.entidad),
        createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
    })
);

// =============================================================================
// Relations
// =============================================================================

export const organizacionesRelations = relations(organizaciones, ({ many }) => ({
    planes: many(planes),
    usuarios: many(usuarios),
}));

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
    organizacion: one(organizaciones, {
        fields: [usuarios.organizacionId],
        references: [organizaciones.organizacionId],
    }),
    mediciones: many(mediciones),
}));

export const planesRelations = relations(planes, ({ one, many }) => ({
    organizacion: one(organizaciones, {
        fields: [planes.organizacionId],
        references: [organizaciones.organizacionId],
    }),
    diagnosticos: many(diagnosticos),
    consultasPublicas: many(consultasPublicas),
    observacionesCiudadanas: many(observacionesCiudadanas),
}));

export const diagnosticosRelations = relations(diagnosticos, ({ one, many }) => ({
    plan: one(planes, {
        fields: [diagnosticos.planId],
        references: [planes.planId],
    }),
    inventariosGei: many(inventariosGei),
    amenazas: many(amenazas),
    vulnerabilidades: many(vulnerabilidades),
    activosCriticos: many(activosCriticos),
}));

export const amenazasRelations = relations(amenazas, ({ one, many }) => ({
    diagnostico: one(diagnosticos, {
        fields: [amenazas.diagnosticoId],
        references: [diagnosticos.diagnosticoId],
    }),
    riesgos: many(riesgos),
}));

export const vulnerabilidadesRelations = relations(vulnerabilidades, ({ one, many }) => ({
    diagnostico: one(diagnosticos, {
        fields: [vulnerabilidades.diagnosticoId],
        references: [diagnosticos.diagnosticoId],
    }),
    riesgos: many(riesgos),
}));

export const riesgosRelations = relations(riesgos, ({ one }) => ({
    amenaza: one(amenazas, {
        fields: [riesgos.amenazaId],
        references: [amenazas.amenazaId],
    }),
    vulnerabilidad: one(vulnerabilidades, {
        fields: [riesgos.vulnerabilidadId],
        references: [vulnerabilidades.vulnerabilidadId],
    }),
    activoCritico: one(activosCriticos, {
        fields: [riesgos.activoId],
        references: [activosCriticos.activoId],
    }),
}));

export const accionesRelations = relations(acciones, ({ many }) => ({
    gestiones: many(gestiones),
    indicadores: many(indicadores),
}));

export const indicadoresRelations = relations(indicadores, ({ one, many }) => ({
    accion: one(acciones, {
        fields: [indicadores.accionId],
        references: [acciones.accionId],
    }),
    mediciones: many(mediciones),
}));

export const medicionesRelations = relations(mediciones, ({ one }) => ({
    indicador: one(indicadores, {
        fields: [mediciones.indicadorId],
        references: [indicadores.indicadorId],
    }),
    registradoPorUsuario: one(usuarios, {
        fields: [mediciones.registradoPor],
        references: [usuarios.usuarioId],
    }),
}));

export const gestionesRelations = relations(gestiones, ({ one }) => ({
    accion: one(acciones, {
        fields: [gestiones.accionId],
        references: [acciones.accionId],
    }),
}));

export const inventariosGeiRelations = relations(inventariosGei, ({ one }) => ({
    diagnostico: one(diagnosticos, {
        fields: [inventariosGei.diagnosticoId],
        references: [diagnosticos.diagnosticoId],
    }),
}));

export const activosCriticosRelations = relations(activosCriticos, ({ one }) => ({
    diagnostico: one(diagnosticos, {
        fields: [activosCriticos.diagnosticoId],
        references: [diagnosticos.diagnosticoId],
    }),
}));

export const consultasPublicasRelations = relations(consultasPublicas, ({ one, many }) => ({
    plan: one(planes, {
        fields: [consultasPublicas.planId],
        references: [planes.planId],
    }),
}));

export const observacionesCiudadanasRelations = relations(observacionesCiudadanas, ({ one }) => ({
    plan: one(planes, {
        fields: [observacionesCiudadanas.planId],
        references: [planes.planId],
    }),
    ciudadano: one(usuarios, {
        fields: [observacionesCiudadanas.ciudadanoId],
        references: [usuarios.usuarioId],
    }),
}));
