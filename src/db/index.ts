// =============================================================================
// Database Connection - Cloudflare D1
// =============================================================================

import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Database = DrizzleD1Database<typeof schema>;

/**
 * Create a Drizzle instance from D1 binding
 */
export function createDb(d1: D1Database): Database {
    return drizzle(d1, { schema });
}

// Export schema for easy access
export { schema };

// Re-export all tables
export * from "./schema";
