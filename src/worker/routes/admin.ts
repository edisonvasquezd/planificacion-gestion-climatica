// =============================================================================
// Admin Routes - Platform Super Admin Management
// =============================================================================

import { Hono } from "hono";
import { eq, desc, count, sql } from "drizzle-orm";
import { z } from "zod";
import type { Env } from "@/types/cloudflare";
import {
    organizaciones,
    usuarios,
    planes,
    consultasPublicas,
    auditLog,
} from "@/db/schema";
import type { Database } from "@/db";
import { requireAuth, requireSuperAdmin } from "../middleware/auth";

const adminRouter = new Hono<{
    Bindings: Env;
    Variables: { db: Database; userId?: string };
}>();

// Apply auth middleware to all routes
adminRouter.use("*", requireAuth);
adminRouter.use("*", requireSuperAdmin);

// =============================================================================
// Schemas
// =============================================================================

const createOrganizacionSchema = z.object({
    nombre: z.string().min(2),
    tipo: z.string().default("Municipal"),
    region: z.string().min(2),
    provincia: z.string().min(2),
    poblacion: z.number().optional(),
    contactoEmail: z.string().email().optional(),
    limitesGeograficos: z.string().optional(),
    // Optional admin user data
    admin: z.object({
        nombreCompleto: z.string().min(2),
        email: z.string().email(),
    }).optional(),
});

const updateOrganizacionSchema = createOrganizacionSchema.partial();

const updateUsuarioSchema = z.object({
    nombreCompleto: z.string().min(2).optional(),
    rol: z.string().optional(),
    organizacionId: z.string().uuid().nullable().optional(),
    activo: z.boolean().optional(),
});

// =============================================================================
// Dashboard Statistics
// =============================================================================

// GET /api/admin/stats - Global platform statistics
adminRouter.get("/stats", async (c) => {
    try {
        const db = c.get("db");

        // Get counts
        const [orgsResult] = await db
            .select({ count: count() })
            .from(organizaciones);

        const [usersResult] = await db
            .select({ count: count() })
            .from(usuarios);

        const [activeUsersResult] = await db
            .select({ count: count() })
            .from(usuarios)
            .where(eq(usuarios.activo, true));

        const [planesResult] = await db
            .select({ count: count() })
            .from(planes);

        const [consultasActivasResult] = await db
            .select({ count: count() })
            .from(consultasPublicas)
            .where(eq(consultasPublicas.estadoConsulta, "Activa"));

        // Plans by status
        const planesPorEstado = await db
            .select({
                estadoPlan: planes.estadoPlan,
                count: count(),
            })
            .from(planes)
            .groupBy(planes.estadoPlan);

        // Users by role
        const usuariosPorRol = await db
            .select({
                rol: usuarios.rol,
                count: count(),
            })
            .from(usuarios)
            .groupBy(usuarios.rol);

        return c.json({
            success: true,
            data: {
                totalOrganizaciones: orgsResult.count,
                totalUsuarios: usersResult.count,
                usuariosActivos: activeUsersResult.count,
                totalPlanes: planesResult.count,
                consultasActivas: consultasActivasResult.count,
                planesPorEstado: planesPorEstado.reduce((acc, item) => {
                    acc[item.estadoPlan] = item.count;
                    return acc;
                }, {} as Record<string, number>),
                usuariosPorRol: usuariosPorRol.reduce((acc, item) => {
                    acc[item.rol] = item.count;
                    return acc;
                }, {} as Record<string, number>),
            },
        });
    } catch (error) {
        console.error("Stats error:", error);
        return c.json({ success: false, error: "Error al obtener estadísticas" }, 500);
    }
});

// GET /api/admin/actividad - Recent activity
adminRouter.get("/actividad", async (c) => {
    try {
        const db = c.get("db");
        const { limit = "20" } = c.req.query();

        const actividad = await db.query.auditLog.findMany({
            orderBy: [desc(auditLog.createdAt)],
            limit: parseInt(limit),
            with: {
                // Note: Need to add relation if desired
            },
        });

        return c.json({ success: true, data: actividad });
    } catch (error) {
        return c.json({ success: false, error: "Error al obtener actividad" }, 500);
    }
});

// =============================================================================
// Organizations Management
// =============================================================================

// GET /api/admin/organizaciones - List all organizations with stats
adminRouter.get("/organizaciones", async (c) => {
    try {
        const db = c.get("db");
        const { page = "1", limit = "20", region, tipo } = c.req.query();

        const result = await db.query.organizaciones.findMany({
            orderBy: [desc(organizaciones.createdAt)],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            with: {
                planes: true,
                usuarios: true,
            },
        });

        // Add stats to each organization
        const orgsWithStats = result.map((org) => ({
            ...org,
            totalPlanes: org.planes.length,
            totalUsuarios: org.usuarios.length,
            planes: undefined, // Don't send full plans array
            usuarios: undefined, // Don't send full usuarios array
        }));

        return c.json({ success: true, data: orgsWithStats });
    } catch (error) {
        return c.json({ success: false, error: "Error al listar organizaciones" }, 500);
    }
});

// GET /api/admin/organizaciones/:id - Get organization details with users and plans
adminRouter.get("/organizaciones/:id", async (c) => {
    try {
        const db = c.get("db");
        const organizacionId = c.req.param("id");

        const org = await db.query.organizaciones.findFirst({
            where: eq(organizaciones.organizacionId, organizacionId),
            with: {
                planes: true,
                usuarios: {
                    columns: {
                        passwordHash: false, // Don't expose password hash
                    },
                },
            },
        });

        if (!org) {
            return c.json({ success: false, error: "Organización no encontrada" }, 404);
        }

        return c.json({ success: true, data: org });
    } catch (error) {
        return c.json({ success: false, error: "Error al obtener organización" }, 500);
    }
});

// POST /api/admin/organizaciones - Create organization (optionally with admin user)
adminRouter.post("/organizaciones", async (c) => {
    try {
        const body = await c.req.json();
        const parsed = createOrganizacionSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos", details: parsed.error.errors }, 400);
        }

        const db = c.get("db");
        const { admin, ...orgData } = parsed.data;

        // Create organization
        const [org] = await db
            .insert(organizaciones)
            .values(orgData)
            .returning();

        let adminUser = null;
        let tempPassword = null;

        // If admin data provided, create admin user
        if (admin) {
            // Check if email already exists
            const existingUser = await db.query.usuarios.findFirst({
                where: eq(usuarios.email, admin.email),
            });

            if (existingUser) {
                // Rollback org creation
                await db.delete(organizaciones).where(eq(organizaciones.organizacionId, org.organizacionId));
                return c.json({ success: false, error: "El email del administrador ya está registrado" }, 409);
            }

            // Generate temporary password
            tempPassword = Math.random().toString(36).slice(-8) + "A1!";
            const encoder = new TextEncoder();
            const data = encoder.encode(tempPassword);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const passwordHash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

            // Create admin user
            const [newUser] = await db
                .insert(usuarios)
                .values({
                    email: admin.email,
                    nombreCompleto: admin.nombreCompleto,
                    passwordHash,
                    rol: "Administrador",
                    organizacionId: org.organizacionId,
                    activo: true,
                })
                .returning({
                    usuarioId: usuarios.usuarioId,
                    email: usuarios.email,
                    nombreCompleto: usuarios.nombreCompleto,
                    rol: usuarios.rol,
                });

            adminUser = newUser;
        }

        return c.json({
            success: true,
            data: {
                organizacion: org,
                admin: adminUser,
                tempPassword, // Only returned once, super admin should share securely
            },
        }, 201);
    } catch (error) {
        console.error("Create org error:", error);
        return c.json({ success: false, error: "Error al crear organización" }, 500);
    }
});

// PATCH /api/admin/organizaciones/:id - Update organization
adminRouter.patch("/organizaciones/:id", async (c) => {
    try {
        const organizacionId = c.req.param("id");
        const body = await c.req.json();
        const parsed = updateOrganizacionSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos" }, 400);
        }

        const db = c.get("db");

        const [updated] = await db
            .update(organizaciones)
            .set({
                ...parsed.data,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(organizaciones.organizacionId, organizacionId))
            .returning();

        if (!updated) {
            return c.json({ success: false, error: "Organización no encontrada" }, 404);
        }

        return c.json({ success: true, data: updated });
    } catch (error) {
        return c.json({ success: false, error: "Error al actualizar organización" }, 500);
    }
});

// DELETE /api/admin/organizaciones/:id - Delete/deactivate organization
adminRouter.delete("/organizaciones/:id", async (c) => {
    try {
        const organizacionId = c.req.param("id");
        const db = c.get("db");

        // Check if org has users or plans
        const org = await db.query.organizaciones.findFirst({
            where: eq(organizaciones.organizacionId, organizacionId),
            with: {
                planes: true,
                usuarios: true,
            },
        });

        if (!org) {
            return c.json({ success: false, error: "Organización no encontrada" }, 404);
        }

        if (org.planes.length > 0 || org.usuarios.length > 0) {
            return c.json({
                success: false,
                error: "No se puede eliminar una organización con planes o usuarios asociados. Desactive los usuarios y elimine los planes primero.",
            }, 400);
        }

        await db.delete(organizaciones).where(eq(organizaciones.organizacionId, organizacionId));

        return c.json({ success: true, message: "Organización eliminada" });
    } catch (error) {
        return c.json({ success: false, error: "Error al eliminar organización" }, 500);
    }
});

// =============================================================================
// Users Management
// =============================================================================

// GET /api/admin/usuarios - List all users
adminRouter.get("/usuarios", async (c) => {
    try {
        const db = c.get("db");
        const { page = "1", limit = "50", rol, organizacionId, activo } = c.req.query();

        const result = await db.query.usuarios.findMany({
            orderBy: [desc(usuarios.createdAt)],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            columns: {
                passwordHash: false, // Don't expose password hash
            },
            with: {
                organizacion: true,
            },
        });

        return c.json({ success: true, data: result });
    } catch (error) {
        return c.json({ success: false, error: "Error al listar usuarios" }, 500);
    }
});

// GET /api/admin/usuarios/:id - Get user details
adminRouter.get("/usuarios/:id", async (c) => {
    try {
        const db = c.get("db");
        const usuarioId = c.req.param("id");

        const usuario = await db.query.usuarios.findFirst({
            where: eq(usuarios.usuarioId, usuarioId),
            columns: {
                passwordHash: false,
            },
            with: {
                organizacion: true,
            },
        });

        if (!usuario) {
            return c.json({ success: false, error: "Usuario no encontrado" }, 404);
        }

        return c.json({ success: true, data: usuario });
    } catch (error) {
        return c.json({ success: false, error: "Error al obtener usuario" }, 500);
    }
});

// POST /api/admin/usuarios - Create new user with organization
adminRouter.post("/usuarios", async (c) => {
    try {
        const body = await c.req.json();

        const createUsuarioSchema = z.object({
            email: z.string().email("Email inválido"),
            nombreCompleto: z.string().min(2, "Nombre muy corto"),
            rol: z.enum(["Ciudadano", "Técnico", "Administrador", "Administrador Plataforma"]),
            organizacionId: z.string().uuid().nullable().optional(),
        });

        const parsed = createUsuarioSchema.safeParse(body);
        if (!parsed.success) {
            return c.json({ success: false, error: parsed.error.errors[0]?.message || "Datos inválidos" }, 400);
        }

        const db = c.get("db");

        // Check if email already exists
        const existingUser = await db.query.usuarios.findFirst({
            where: eq(usuarios.email, parsed.data.email),
        });

        if (existingUser) {
            return c.json({ success: false, error: "El email ya está registrado" }, 409);
        }

        // If organizacionId provided, validate it exists
        if (parsed.data.organizacionId) {
            const org = await db.query.organizaciones.findFirst({
                where: eq(organizaciones.organizacionId, parsed.data.organizacionId),
            });
            if (!org) {
                return c.json({ success: false, error: "Organización no encontrada" }, 400);
            }
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
        const encoder = new TextEncoder();
        const data = encoder.encode(tempPassword);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const passwordHash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

        // Create user
        const [newUser] = await db
            .insert(usuarios)
            .values({
                email: parsed.data.email,
                nombreCompleto: parsed.data.nombreCompleto,
                passwordHash,
                rol: parsed.data.rol,
                organizacionId: parsed.data.organizacionId || null,
                activo: true,
            })
            .returning({
                usuarioId: usuarios.usuarioId,
                email: usuarios.email,
                nombreCompleto: usuarios.nombreCompleto,
                rol: usuarios.rol,
                organizacionId: usuarios.organizacionId,
                activo: usuarios.activo,
            });

        return c.json({
            success: true,
            data: {
                usuario: newUser,
                tempPassword,
                message: "Usuario creado. Comparta la contraseña temporal de forma segura.",
            },
        }, 201);
    } catch (error) {
        console.error("Create user error:", error);
        return c.json({ success: false, error: "Error al crear usuario" }, 500);
    }
});

// PATCH /api/admin/usuarios/:id - Update user (role, org, status)
adminRouter.patch("/usuarios/:id", async (c) => {
    try {
        const usuarioId = c.req.param("id");
        const body = await c.req.json();
        const parsed = updateUsuarioSchema.safeParse(body);

        if (!parsed.success) {
            return c.json({ success: false, error: "Datos inválidos" }, 400);
        }

        const db = c.get("db");

        // If changing organization, validate it exists
        if (parsed.data.organizacionId) {
            const org = await db.query.organizaciones.findFirst({
                where: eq(organizaciones.organizacionId, parsed.data.organizacionId),
            });
            if (!org) {
                return c.json({ success: false, error: "Organización no encontrada" }, 400);
            }
        }

        const [updated] = await db
            .update(usuarios)
            .set({
                ...parsed.data,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(usuarios.usuarioId, usuarioId))
            .returning({
                usuarioId: usuarios.usuarioId,
                email: usuarios.email,
                nombreCompleto: usuarios.nombreCompleto,
                rol: usuarios.rol,
                organizacionId: usuarios.organizacionId,
                activo: usuarios.activo,
                createdAt: usuarios.createdAt,
                updatedAt: usuarios.updatedAt,
            });

        if (!updated) {
            return c.json({ success: false, error: "Usuario no encontrado" }, 404);
        }

        return c.json({ success: true, data: updated });
    } catch (error) {
        return c.json({ success: false, error: "Error al actualizar usuario" }, 500);
    }
});

// POST /api/admin/usuarios/:id/reset-password - Reset user password
adminRouter.post("/usuarios/:id/reset-password", async (c) => {
    try {
        const usuarioId = c.req.param("id");
        const db = c.get("db");

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + "A1!";

        // Hash the password (using Web Crypto API)
        const encoder = new TextEncoder();
        const data = encoder.encode(tempPassword);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        const [updated] = await db
            .update(usuarios)
            .set({
                passwordHash,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(usuarios.usuarioId, usuarioId))
            .returning({
                usuarioId: usuarios.usuarioId,
                email: usuarios.email,
                nombreCompleto: usuarios.nombreCompleto,
            });

        if (!updated) {
            return c.json({ success: false, error: "Usuario no encontrado" }, 404);
        }

        // In production, send email with temp password
        // For now, return it (only for admin to communicate)
        return c.json({
            success: true,
            data: {
                usuario: updated,
                tempPassword, // Admin should communicate this securely to user
                message: "Contraseña reseteada. El usuario debe cambiarla al iniciar sesión.",
            },
        });
    } catch (error) {
        return c.json({ success: false, error: "Error al resetear contraseña" }, 500);
    }
});

// =============================================================================
// Plans Overview
// =============================================================================

// GET /api/admin/planes - List all plans across organizations
adminRouter.get("/planes", async (c) => {
    try {
        const db = c.get("db");
        const { page = "1", limit = "50", estadoPlan, tipoPlan, organizacionId } = c.req.query();

        const result = await db.query.planes.findMany({
            orderBy: [desc(planes.createdAt)],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            with: {
                organizacion: true,
                consultasPublicas: true,
            },
        });

        return c.json({ success: true, data: result });
    } catch (error) {
        return c.json({ success: false, error: "Error al listar planes" }, 500);
    }
});

// GET /api/admin/planes/:id - Get plan details
adminRouter.get("/planes/:id", async (c) => {
    try {
        const db = c.get("db");
        const planId = c.req.param("id");

        const plan = await db.query.planes.findFirst({
            where: eq(planes.planId, planId),
            with: {
                organizacion: true,
                diagnosticos: {
                    with: {
                        inventariosGei: true,
                        amenazas: true,
                        vulnerabilidades: true,
                        activosCriticos: true,
                    },
                },
                consultasPublicas: true,
                observacionesCiudadanas: true,
            },
        });

        if (!plan) {
            return c.json({ success: false, error: "Plan no encontrado" }, 404);
        }

        return c.json({ success: true, data: plan });
    } catch (error) {
        return c.json({ success: false, error: "Error al obtener plan" }, 500);
    }
});

// =============================================================================
// Organization Impersonation (view as org)
// =============================================================================

// POST /api/admin/impersonate/:orgId - Create a temporary session to view as organization
adminRouter.post("/impersonate/:orgId", async (c) => {
    try {
        const db = c.get("db");
        const organizacionId = c.req.param("orgId");
        const userId = c.get("userId");

        // Verify organization exists
        const org = await db.query.organizaciones.findFirst({
            where: eq(organizaciones.organizacionId, organizacionId),
        });

        if (!org) {
            return c.json({ success: false, error: "Organización no encontrada" }, 404);
        }

        // Get current user
        const user = await db.query.usuarios.findFirst({
            where: eq(usuarios.usuarioId, userId),
        });

        if (!user) {
            return c.json({ success: false, error: "Usuario no encontrado" }, 404);
        }

        // Generate new token for impersonation session
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const token = btoa(String.fromCharCode(...array));
        const expiresAt = Date.now() + 2 * 60 * 60 * 1000; // 2 hours only for impersonation

        // Store impersonation session
        await c.env.KV_SESSIONS.put(
            `session:${token}`,
            JSON.stringify({
                userId: user.usuarioId,
                email: user.email,
                rol: "Administrador Plataforma", // Keep super admin role
                organizacionId: organizacionId, // But set the org context
                isImpersonating: true,
                originalOrganizacionId: user.organizacionId,
                impersonatingOrgName: org.nombre,
                expiresAt,
            }),
            { expirationTtl: 2 * 60 * 60 } // 2 hours
        );

        return c.json({
            success: true,
            data: {
                token,
                organizacion: {
                    id: org.organizacionId,
                    nombre: org.nombre,
                    region: org.region,
                },
                expiresAt,
                message: "Sesión de organización activa por 2 horas",
            },
        });
    } catch (error) {
        console.error("Impersonate error:", error);
        return c.json({ success: false, error: "Error al acceder a la organización" }, 500);
    }
});

// POST /api/admin/stop-impersonation - Return to normal super admin session
adminRouter.post("/stop-impersonation", async (c) => {
    try {
        const userId = c.get("userId");
        const db = c.get("db");

        // Get user
        const user = await db.query.usuarios.findFirst({
            where: eq(usuarios.usuarioId, userId),
        });

        if (!user) {
            return c.json({ success: false, error: "Usuario no encontrado" }, 404);
        }

        // Generate new normal session token
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const token = btoa(String.fromCharCode(...array));
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

        // Store normal session
        await c.env.KV_SESSIONS.put(
            `session:${token}`,
            JSON.stringify({
                userId: user.usuarioId,
                email: user.email,
                rol: user.rol,
                organizacionId: user.organizacionId,
                expiresAt,
            }),
            { expirationTtl: 7 * 24 * 60 * 60 }
        );

        return c.json({
            success: true,
            data: {
                token,
                expiresAt,
            },
        });
    } catch (error) {
        return c.json({ success: false, error: "Error al restaurar sesión" }, 500);
    }
});

export { adminRouter as adminRoutes };
