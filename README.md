# Plataforma de Gestión de Riesgos Climáticos y Desastres

## 🌎 PGRC Chile

Plataforma web integral para la gestión coordinada de **Planes de Acción Comunal de Cambio Climático (PACCC)** y **Planes de Gestión de Riesgo de Desastres (PGRD)** a nivel municipal en Chile.

### Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript
- **Backend**: Cloudflare Workers + Hono
- **Base de Datos**: Cloudflare D1 (SQLite) + Drizzle ORM
- **Almacenamiento**: Cloudflare R2
- **Caché/Sesiones**: Cloudflare KV
- **Estilos**: Tailwind CSS
- **Mapas**: Leaflet + React-Leaflet

---

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Cloudflare

```bash
# Login a Cloudflare
npx wrangler login

# Crear base de datos D1
npx wrangler d1 create planificacion-gestion-db

# Crear bucket R2
npx wrangler r2 bucket create planificacion-gestion-files

# Crear namespaces KV
npx wrangler kv:namespace create KV_CACHE
npx wrangler kv:namespace create KV_SESSIONS
```

### 3. Actualizar `wrangler.toml`

Copia los IDs generados al archivo `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "planificacion-gestion-db"
database_id = "TU_DATABASE_ID"

[[kv_namespaces]]
binding = "KV_CACHE"
id = "TU_KV_CACHE_ID"

[[kv_namespaces]]
binding = "KV_SESSIONS"
id = "TU_KV_SESSIONS_ID"
```

### 4. Ejecutar Migraciones

```bash
# Generar migraciones desde el schema
npm run db:generate

# Aplicar migraciones (local)
npm run db:migrate

# Aplicar migraciones (producción)
npm run db:migrate:prod
```

### 5. Desarrollo Local

```bash
# Frontend (Next.js)
npm run dev

# Backend (Workers) - en otra terminal
npm run cf:dev
```

---

## 📁 Estructura del Proyecto

```
planificacion_gestion_platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/               # Login / Register
│   │   ├── dashboard/          # Panel protegido
│   │   │   ├── planes/         # Gestión PACCC/PGRD
│   │   │   ├── diagnosticos/   # GEI, amenazas, vulnerabilidades
│   │   │   ├── riesgos/        # Matriz de riesgos
│   │   │   ├── acciones/       # Cartera con SbN
│   │   │   ├── indicadores/    # M&E
│   │   │   ├── actores/        # Gobernanza
│   │   │   ├── participacion/  # Consulta pública
│   │   │   └── mapa/           # Visor SIG
│   │   ├── consulta-publica/   # Acceso ciudadano
│   │   ├── layout.tsx
│   │   └── page.tsx            # Landing
│   │
│   ├── worker/                 # Cloudflare Workers API
│   │   ├── routes/
│   │   │   ├── auth.ts         # Autenticación
│   │   │   ├── planes.ts
│   │   │   ├── diagnosticos.ts
│   │   │   ├── riesgos.ts
│   │   │   ├── acciones.ts
│   │   │   ├── indicadores.ts
│   │   │   ├── actores.ts
│   │   │   ├── participacion.ts
│   │   │   ├── usuarios.ts
│   │   │   └── upload.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   └── index.ts            # Entry point Hono
│   │
│   ├── db/
│   │   ├── schema/
│   │   │   └── index.ts        # Drizzle schema D1
│   │   └── index.ts
│   │
│   ├── lib/
│   │   ├── auth-context.tsx    # React context
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   └── validations.ts      # Zod schemas
│   │
│   ├── types/
│   │   ├── enums.ts
│   │   ├── entities.ts
│   │   ├── cloudflare.ts
│   │   └── index.ts
│   │
│   └── styles/
│       └── globals.css
│
├── drizzle/
│   └── migrations/             # Migraciones SQL
│
├── wrangler.toml               # Config Cloudflare
├── drizzle.config.ts
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔐 Autenticación

El sistema implementa autenticación basada en tokens JWT almacenados en Cloudflare KV:

1. **Login**: POST `/api/auth/login` → Retorna token
2. **Register**: POST `/api/auth/register` → Crea usuario
3. **Me**: GET `/api/auth/me` → Info del usuario actual
4. **Logout**: POST `/api/auth/logout` → Invalida sesión

### Roles

| Rol | Permisos |
|-----|----------|
| `Administrador Plataforma` | Acceso total |
| `Administrador Municipal` | Gestión de su municipio |
| `Técnico Municipal` | Edición de planes |
| `Ciudadano` | Participación en consultas |
| `Observador` | Solo lectura |

---

## 📋 Módulos Principales

### 1. Planes (PACCC / PGRD)
- Creación y versionado
- Estados: Elaboración → Consulta Pública → Vigente → Archivado
- Inicio de consulta pública (mínimo 30 días)

### 2. Diagnóstico
- Inventario GEI por sector (IPCC)
- Registro de amenazas (geofísicas, hidrometeorológicas, biológicas, antrópicas)
- Vulnerabilidades por dimensión (social, económica, infraestructural, ecosistémica)
- Activos críticos georreferenciados

### 3. Matriz de Riesgos
- Cruce Amenaza × Vulnerabilidad × Activo
- Niveles: Bajo, Medio, Alto, Crítico
- Justificación y mapeo

### 4. Cartera de Acciones
- Tipos de solución: Gris, Verde, Híbrida, **SbN**
- Verificador SbN con 8 criterios UICN
- Gestión de implementación y presupuesto
- Priorización

### 5. Indicadores M&E
- Tipos: Impacto (Mitigación/Adaptación), Co-beneficios (SbN)
- Línea base, meta, frecuencia
- Registro de mediciones con evidencia

### 6. Gobernanza
- Actores por tipo (público, privado, sociedad civil, academia)
- Roles (coordinador, implementador, fiscalizador, consultivo)
- Registro de actas de reunión

### 7. Participación Ciudadana
- Consultas públicas activas
- Observaciones ciudadanas
- Respuestas municipales con justificación
- Generación de informe de consulta

### 8. Visor SIG
- Capas de amenazas, vulnerabilidades, riesgos
- Activos críticos
- Integración con IDE Chile (WMS/WFS)

---

## 🌿 Verificador SbN-UICN

Las acciones clasificadas como "Soluciones basadas en la Naturaleza" son verificadas contra los 8 criterios del Estándar Global UICN:

1. ✅ Desafío Social
2. ✅ Escala Paisaje
3. ✅ Ganancia Biodiversidad
4. ✅ Viabilidad Económica
5. ✅ Gobernanza Inclusiva
6. ✅ Gestión Trade-offs
7. ✅ Monitoreo Adaptativo
8. ✅ Sostenibilidad

---

## 📜 Marco Legal

- **Ley 21.455**: Ley Marco de Cambio Climático
  - Art. 4: Planes de Acción Comunal obligatorios
  - Art. 5: Consulta pública mínimo 30 días
  
- **Ley 21.364**: Sistema Nacional de Prevención y Respuesta ante Desastres
  - SENAPRED como ente rector
  - COGRID a nivel comunal
  - Ciclo de gestión de riesgo

---

## 🚀 Despliegue a Producción

### Backend (Workers)

```bash
npm run cf:deploy
```

### Frontend (Pages)

```bash
npm run deploy
```

O conecta tu repositorio a Cloudflare Pages para despliegue automático.

---

## 🔧 Variables de Entorno

Crea un archivo `.env.local` basado en `.env.example`:

```env
# Cloudflare
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_D1_DATABASE_ID=

# Auth
AUTH_SECRET=

# APIs Gobierno Chile
SINAPACC_API_KEY=
SENAPRED_API_KEY=

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8787
```

### Secrets en Workers

```bash
npx wrangler secret put AUTH_SECRET
npx wrangler secret put SINAPACC_API_KEY
npx wrangler secret put SENAPRED_API_KEY
```

---

## 📞 Soporte

Para soporte técnico, contactar a:
- Mesa de Ayuda: soporte@plataforma-riesgos.gob.cl
- Documentación: docs.plataforma-riesgos.gob.cl

---

© 2026 Gobierno de Chile • Ministerio del Medio Ambiente • SENAPRED
