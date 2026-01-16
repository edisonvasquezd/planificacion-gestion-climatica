-- =============================================================================
-- Migración Inicial - Plataforma de Planificación y Gestión de Riesgos Climáticos
-- =============================================================================

-- Municipalidades
CREATE TABLE IF NOT EXISTS municipalidades (
    municipalidad_id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    region TEXT NOT NULL,
    provincia TEXT NOT NULL,
    limites_geograficos TEXT,
    poblacion INTEGER,
    contacto_email TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS municipalidades_nombre_idx ON municipalidades(nombre);
CREATE INDEX IF NOT EXISTS municipalidades_region_idx ON municipalidades(region);

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    usuario_id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    nombre_completo TEXT NOT NULL,
    password_hash TEXT,
    rol TEXT NOT NULL DEFAULT 'Ciudadano',
    municipalidad_id TEXT REFERENCES municipalidades(municipalidad_id),
    clave_unica_rut TEXT,
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS usuarios_email_idx ON usuarios(email);
CREATE INDEX IF NOT EXISTS usuarios_municipalidad_idx ON usuarios(municipalidad_id);

-- Planes
CREATE TABLE IF NOT EXISTS planes (
    plan_id TEXT PRIMARY KEY,
    municipalidad_id TEXT NOT NULL REFERENCES municipalidades(municipalidad_id),
    nombre_plan TEXT NOT NULL,
    tipo_plan TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    estado_plan TEXT NOT NULL DEFAULT 'En elaboración',
    fecha_aprobacion TEXT,
    fecha_vigencia_inicio TEXT,
    fecha_vigencia_fin TEXT,
    responsable_plan TEXT NOT NULL,
    link_documento_publico TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS planes_municipalidad_idx ON planes(municipalidad_id);
CREATE INDEX IF NOT EXISTS planes_tipo_plan_idx ON planes(tipo_plan);
CREATE INDEX IF NOT EXISTS planes_estado_plan_idx ON planes(estado_plan);

-- Diagnósticos
CREATE TABLE IF NOT EXISTS diagnosticos (
    diagnostico_id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL REFERENCES planes(plan_id),
    descripcion_general TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Inventarios GEI
CREATE TABLE IF NOT EXISTS inventarios_gei (
    inventario_id TEXT PRIMARY KEY,
    diagnostico_id TEXT NOT NULL REFERENCES diagnosticos(diagnostico_id),
    anio_linea_base INTEGER NOT NULL,
    total_tco2eq REAL NOT NULL,
    emisiones_sectoriales TEXT NOT NULL,
    metodologia TEXT,
    fuente_datos TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Amenazas
CREATE TABLE IF NOT EXISTS amenazas (
    amenaza_id TEXT PRIMARY KEY,
    diagnostico_id TEXT NOT NULL REFERENCES diagnosticos(diagnostico_id),
    tipo_amenaza TEXT NOT NULL,
    nombre_amenaza TEXT NOT NULL,
    descripcion_amenaza TEXT,
    mapa_amenaza TEXT,
    fuente_datos TEXT,
    probabilidad REAL,
    intensidad REAL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS amenazas_tipo_idx ON amenazas(tipo_amenaza);
CREATE INDEX IF NOT EXISTS amenazas_diagnostico_idx ON amenazas(diagnostico_id);

-- Vulnerabilidades
CREATE TABLE IF NOT EXISTS vulnerabilidades (
    vulnerabilidad_id TEXT PRIMARY KEY,
    diagnostico_id TEXT NOT NULL REFERENCES diagnosticos(diagnostico_id),
    dimension_vulnerabilidad TEXT NOT NULL,
    nombre_vulnerabilidad TEXT NOT NULL,
    descripcion TEXT,
    mapa_vulnerabilidad TEXT,
    indice_vulnerabilidad REAL NOT NULL,
    poblacion_afectada TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS vulnerabilidades_dimension_idx ON vulnerabilidades(dimension_vulnerabilidad);
CREATE INDEX IF NOT EXISTS vulnerabilidades_diagnostico_idx ON vulnerabilidades(diagnostico_id);

-- Activos Críticos
CREATE TABLE IF NOT EXISTS activos_criticos (
    activo_id TEXT PRIMARY KEY,
    diagnostico_id TEXT NOT NULL REFERENCES diagnosticos(diagnostico_id),
    nombre_activo TEXT NOT NULL,
    tipo_activo TEXT NOT NULL,
    descripcion TEXT,
    ubicacion TEXT NOT NULL,
    capacidad TEXT,
    criticidad TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS activos_criticos_tipo_idx ON activos_criticos(tipo_activo);
CREATE INDEX IF NOT EXISTS activos_criticos_diagnostico_idx ON activos_criticos(diagnostico_id);

-- Riesgos
CREATE TABLE IF NOT EXISTS riesgos (
    riesgo_id TEXT PRIMARY KEY,
    amenaza_id TEXT NOT NULL REFERENCES amenazas(amenaza_id),
    vulnerabilidad_id TEXT NOT NULL REFERENCES vulnerabilidades(vulnerabilidad_id),
    activo_id TEXT REFERENCES activos_criticos(activo_id),
    nombre_riesgo TEXT NOT NULL,
    nivel_riesgo_calculado TEXT NOT NULL,
    justificacion_riesgo TEXT,
    mapa_riesgo TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS riesgos_nivel_idx ON riesgos(nivel_riesgo_calculado);
CREATE INDEX IF NOT EXISTS riesgos_amenaza_idx ON riesgos(amenaza_id);
CREATE INDEX IF NOT EXISTS riesgos_vulnerabilidad_idx ON riesgos(vulnerabilidad_id);

-- Acciones
CREATE TABLE IF NOT EXISTS acciones (
    accion_id TEXT PRIMARY KEY,
    nombre_accion TEXT NOT NULL,
    descripcion_accion TEXT,
    responsable_implementacion TEXT NOT NULL,
    pilar_paccc TEXT NOT NULL DEFAULT 'N/A',
    fase_ciclo_riesgo TEXT NOT NULL DEFAULT 'N/A',
    tipo_solucion TEXT NOT NULL,
    verificador_sbn TEXT,
    relacion_plan_ids TEXT NOT NULL DEFAULT '[]',
    relacion_riesgo_ids TEXT NOT NULL DEFAULT '[]',
    relacion_gei_sectores TEXT NOT NULL DEFAULT '[]',
    costo_estimado REAL,
    prioridad INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS acciones_pilar_idx ON acciones(pilar_paccc);
CREATE INDEX IF NOT EXISTS acciones_fase_idx ON acciones(fase_ciclo_riesgo);
CREATE INDEX IF NOT EXISTS acciones_tipo_solucion_idx ON acciones(tipo_solucion);

-- Gestiones
CREATE TABLE IF NOT EXISTS gestiones (
    gestion_id TEXT PRIMARY KEY,
    accion_id TEXT NOT NULL REFERENCES acciones(accion_id),
    estado_implementacion TEXT NOT NULL DEFAULT 'Diseño',
    presupuesto_asignado_clp INTEGER NOT NULL DEFAULT 0,
    presupuesto_ejecutado_clp INTEGER NOT NULL DEFAULT 0,
    fecha_inicio_programada TEXT,
    fecha_fin_programada TEXT,
    fecha_inicio_real TEXT,
    fecha_fin_real TEXT,
    observaciones TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS gestiones_estado_idx ON gestiones(estado_implementacion);
CREATE INDEX IF NOT EXISTS gestiones_accion_idx ON gestiones(accion_id);

-- Indicadores
CREATE TABLE IF NOT EXISTS indicadores (
    indicador_id TEXT PRIMARY KEY,
    accion_id TEXT NOT NULL REFERENCES acciones(accion_id),
    nombre_indicador TEXT NOT NULL,
    tipo_indicador TEXT NOT NULL,
    unidad_medida TEXT NOT NULL,
    linea_base REAL NOT NULL,
    meta REAL NOT NULL,
    frecuencia_medicion TEXT NOT NULL,
    fuente_verificacion TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS indicadores_tipo_idx ON indicadores(tipo_indicador);
CREATE INDEX IF NOT EXISTS indicadores_accion_idx ON indicadores(accion_id);

-- Mediciones
CREATE TABLE IF NOT EXISTS mediciones (
    medicion_id TEXT PRIMARY KEY,
    indicador_id TEXT NOT NULL REFERENCES indicadores(indicador_id),
    fecha_medicion TEXT NOT NULL,
    valor_medido REAL NOT NULL,
    evidencia_url TEXT,
    observaciones TEXT,
    registrado_por TEXT NOT NULL REFERENCES usuarios(usuario_id),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS mediciones_indicador_idx ON mediciones(indicador_id);
CREATE INDEX IF NOT EXISTS mediciones_fecha_idx ON mediciones(fecha_medicion);

-- Actores
CREATE TABLE IF NOT EXISTS actores (
    actor_id TEXT PRIMARY KEY,
    nombre_actor TEXT NOT NULL,
    tipo_actor TEXT NOT NULL,
    rol_en_plan TEXT NOT NULL,
    contacto_nombre TEXT,
    contacto_email TEXT,
    contacto_telefono TEXT,
    relacion_plan_ids TEXT NOT NULL DEFAULT '[]',
    relacion_accion_ids TEXT NOT NULL DEFAULT '[]',
    actas_reunion TEXT NOT NULL DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS actores_tipo_idx ON actores(tipo_actor);
CREATE INDEX IF NOT EXISTS actores_rol_idx ON actores(rol_en_plan);

-- Consultas Públicas
CREATE TABLE IF NOT EXISTS consultas_publicas (
    consulta_id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL REFERENCES planes(plan_id),
    fecha_inicio TEXT NOT NULL,
    fecha_fin TEXT NOT NULL,
    dias_minimos INTEGER NOT NULL DEFAULT 30,
    estado_consulta TEXT NOT NULL DEFAULT 'Activa',
    total_participantes INTEGER NOT NULL DEFAULT 0,
    total_observaciones INTEGER NOT NULL DEFAULT 0,
    informe_consulta_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS consultas_publicas_plan_idx ON consultas_publicas(plan_id);
CREATE INDEX IF NOT EXISTS consultas_publicas_estado_idx ON consultas_publicas(estado_consulta);

-- Observaciones Ciudadanas
CREATE TABLE IF NOT EXISTS observaciones_ciudadanas (
    observacion_id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL REFERENCES planes(plan_id),
    seccion_plan TEXT NOT NULL,
    contenido_observacion TEXT NOT NULL,
    propuesta_ciudadana TEXT,
    documento_respaldo TEXT,
    ubicacion_georeferenciada TEXT,
    ciudadano_id TEXT REFERENCES usuarios(usuario_id),
    es_anonimo INTEGER NOT NULL DEFAULT 0,
    organizacion_representada TEXT,
    estado_observacion TEXT NOT NULL DEFAULT 'Recibida',
    respuesta_municipal TEXT,
    justificacion TEXT,
    responsable_analisis TEXT REFERENCES usuarios(usuario_id),
    fecha_respuesta TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS observaciones_plan_idx ON observaciones_ciudadanas(plan_id);
CREATE INDEX IF NOT EXISTS observaciones_estado_idx ON observaciones_ciudadanas(estado_observacion);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    log_id TEXT PRIMARY KEY,
    usuario_id TEXT REFERENCES usuarios(usuario_id),
    accion TEXT NOT NULL,
    entidad TEXT NOT NULL,
    entidad_id TEXT NOT NULL,
    datos_anteriores TEXT,
    datos_nuevos TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS audit_log_usuario_idx ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS audit_log_entidad_idx ON audit_log(entidad);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log(created_at);

-- =============================================================================
-- Datos iniciales
-- =============================================================================

-- Municipalidad de ejemplo
INSERT INTO municipalidades (municipalidad_id, nombre, region, provincia, poblacion, contacto_email)
VALUES ('muni-demo-001', 'Municipalidad Demo', 'Región Metropolitana', 'Santiago', 500000, 'contacto@municipalidaddemo.cl');

-- Usuario administrador de ejemplo (password: admin123)
INSERT INTO usuarios (usuario_id, email, nombre_completo, password_hash, rol, municipalidad_id)
VALUES ('user-admin-001', 'admin@demo.cl', 'Administrador Demo', '$2a$10$example_hash_here', 'Administrador Municipal', 'muni-demo-001');
