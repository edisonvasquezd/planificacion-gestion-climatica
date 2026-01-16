// =============================================================================
// Cloudflare Worker Types
// =============================================================================

export interface Env {
    // D1 Database
    DB: D1Database;

    // R2 Storage
    R2_BUCKET: R2Bucket;

    // KV Namespaces
    KV_CACHE: KVNamespace;
    KV_SESSIONS: KVNamespace;

    // Environment Variables
    ENVIRONMENT: string;
    APP_NAME: string;
    CONSULTA_PUBLICA_DIAS_MINIMOS: string;

    // Secrets
    AUTH_SECRET: string;
    CLAVEUNICA_CLIENT_ID?: string;
    CLAVEUNICA_CLIENT_SECRET?: string;
    SINAPACC_API_KEY?: string;
    SENAPRED_API_KEY?: string;
    MERCADOPUBLICO_API_KEY?: string;
}

// Request context with environment bindings
export interface AppContext {
    env: Env;
    executionCtx: ExecutionContext;
}

// D1 Result types
export interface D1Result<T> {
    results: T[];
    success: boolean;
    meta: {
        duration: number;
        changes: number;
        last_row_id: number;
        rows_read: number;
        rows_written: number;
    };
}

// R2 Upload result
export interface R2UploadResult {
    key: string;
    url: string;
    size: number;
    contentType: string;
    uploadedAt: Date;
}

// Session data
export interface SessionData {
    userId: string;
    email: string;
    rol: string;
    organizacionId?: string;
    expiresAt: number;
}

// API Response wrapper
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    meta?: {
        page?: number;
        pageSize?: number;
        total?: number;
        totalPages?: number;
    };
}
