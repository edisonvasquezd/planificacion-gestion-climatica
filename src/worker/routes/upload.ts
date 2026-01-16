// =============================================================================
// Upload Routes - R2 File Storage
// =============================================================================

import { Hono } from "hono";
import type { Env } from "@/types/cloudflare";
import { requireAuth } from "../middleware/auth";

const uploadRouter = new Hono<{ Bindings: Env }>();

// =============================================================================
// Routes
// =============================================================================

// POST /api/upload - Upload file to R2
uploadRouter.post("/", requireAuth, async (c) => {
    try {
        const formData = await c.req.formData();
        const file = formData.get("file") as File | null;
        const folder = formData.get("folder") as string || "general";

        if (!file) {
            return c.json({ success: false, error: "No se proporcionó archivo" }, 400);
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return c.json({ success: false, error: "Archivo muy grande (máx 10MB)" }, 400);
        }

        // Validate file type
        const allowedTypes = [
            "image/jpeg", "image/png", "image/webp",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
        ];

        if (!allowedTypes.includes(file.type)) {
            return c.json({ success: false, error: "Tipo de archivo no permitido" }, 400);
        }

        // Generate unique key
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const extension = file.name.split(".").pop() || "bin";
        const key = `${folder}/${timestamp}-${randomStr}.${extension}`;

        // Upload to R2
        await c.env.R2_BUCKET.put(key, file.stream(), {
            httpMetadata: {
                contentType: file.type,
            },
            customMetadata: {
                originalName: file.name,
                uploadedAt: new Date().toISOString(),
            },
        });

        // Return public URL (assuming public bucket or signed URL)
        const url = `https://files.plataforma-riesgos.cl/${key}`;

        return c.json({
            success: true,
            data: {
                key,
                url,
                filename: file.name,
                size: file.size,
                contentType: file.type,
            },
        }, 201);
    } catch (error) {
        console.error("Upload error:", error);
        return c.json({ success: false, error: "Error al subir archivo" }, 500);
    }
});

// GET /api/upload/:key - Get file info
uploadRouter.get("/:key{.+}", requireAuth, async (c) => {
    try {
        const key = c.req.param("key");

        const object = await c.env.R2_BUCKET.head(key);

        if (!object) {
            return c.json({ success: false, error: "Archivo no encontrado" }, 404);
        }

        return c.json({
            success: true,
            data: {
                key,
                size: object.size,
                contentType: object.httpMetadata?.contentType,
                uploadedAt: object.uploaded,
                customMetadata: object.customMetadata,
            },
        });
    } catch (error) {
        return c.json({ success: false, error: "Error al obtener archivo" }, 500);
    }
});

// DELETE /api/upload/:key - Delete file
uploadRouter.delete("/:key{.+}", requireAuth, async (c) => {
    try {
        const key = c.req.param("key");

        await c.env.R2_BUCKET.delete(key);

        return c.json({ success: true, message: "Archivo eliminado" });
    } catch (error) {
        return c.json({ success: false, error: "Error al eliminar archivo" }, 500);
    }
});

// POST /api/upload/presigned - Generate presigned URL for direct upload
uploadRouter.post("/presigned", requireAuth, async (c) => {
    try {
        const body = await c.req.json();
        const { filename, contentType, folder = "general" } = body;

        if (!filename || !contentType) {
            return c.json({ success: false, error: "Faltan parámetros" }, 400);
        }

        // Generate key
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const extension = filename.split(".").pop() || "bin";
        const key = `${folder}/${timestamp}-${randomStr}.${extension}`;

        // Note: For true presigned URLs, you'd use the S3-compatible API
        // This is a simplified version that returns the key for client-side upload

        return c.json({
            success: true,
            data: {
                key,
                uploadUrl: `/api/upload/direct/${key}`,
                expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
            },
        });
    } catch (error) {
        return c.json({ success: false, error: "Error al generar URL" }, 500);
    }
});

export { uploadRouter as uploadRoutes };
