// =============================================================================
// Cloudflare Worker - Main API Entry Point (Hono)
// =============================================================================

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";

import type { Env } from "@/types/cloudflare";
import { createDb } from "@/db";

// Import routes
import { authRoutes } from "./routes/auth";
import { planesRoutes } from "./routes/planes";
import { diagnosticosRoutes } from "./routes/diagnosticos";
import { riesgosRoutes } from "./routes/riesgos";
import { accionesRoutes } from "./routes/acciones";
import { indicadoresRoutes } from "./routes/indicadores";
import { actoresRoutes } from "./routes/actores";
import { participacionRoutes } from "./routes/participacion";
import { usuariosRoutes } from "./routes/usuarios";
import { uploadRoutes } from "./routes/upload";

// Create Hono app with typed env
const app = new Hono<{ Bindings: Env }>();

// =============================================================================
// Middleware
// =============================================================================

app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", secureHeaders());
app.use(
    "*",
    cors({
        origin: [
            "http://localhost:3000",
            "https://*.pages.dev",
            "https://*.workers.dev",
            "https://*.vercel.app",
            "https://planificaciongestionplatform.vercel.app",
        ],
        credentials: true,
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
    })
);

// Inject database into context
app.use("*", async (c, next) => {
    const db = createDb(c.env.DB);
    c.set("db", db);
    await next();
});

// =============================================================================
// Health Check
// =============================================================================

app.get("/", (c) => {
    return c.json({
        name: "Plataforma de Gestión de Riesgos Climáticos API",
        version: "1.0.0",
        status: "healthy",
        environment: c.env.ENVIRONMENT,
    });
});

app.get("/health", (c) => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// =============================================================================
// API Routes
// =============================================================================

app.route("/api/auth", authRoutes);
app.route("/api/planes", planesRoutes);
app.route("/api/diagnosticos", diagnosticosRoutes);
app.route("/api/riesgos", riesgosRoutes);
app.route("/api/acciones", accionesRoutes);
app.route("/api/indicadores", indicadoresRoutes);
app.route("/api/actores", actoresRoutes);
app.route("/api/participacion", participacionRoutes);
app.route("/api/usuarios", usuariosRoutes);
app.route("/api/upload", uploadRoutes);

// =============================================================================
// Error Handler
// =============================================================================

app.onError((err, c) => {
    console.error("API Error:", err);
    return c.json(
        {
            success: false,
            error: err.message || "Internal Server Error",
        },
        500
    );
});

app.notFound((c) => {
    return c.json(
        {
            success: false,
            error: "Endpoint not found",
        },
        404
    );
});

export default app;
