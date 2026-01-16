/**
 * Script para crear el usuario Super Admin oficial de la plataforma PGRC
 *
 * Este script genera el SQL necesario para insertar el usuario administrador
 * de la plataforma con las credenciales oficiales.
 *
 * Uso:
 *   npx tsx scripts/seed-superadmin.ts
 *
 * Luego ejecutar el SQL generado con:
 *   npx wrangler d1 execute pgrc-database --local --command "..."
 *   npx wrangler d1 execute pgrc-database --remote --command "..."
 */

// Función de hash igual a la del backend
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// Configuración del Super Admin
const SUPERADMIN_CONFIG = {
    email: "admin@pgrc.cl",
    nombreCompleto: "Administrador PGRC",
    password: "PgrcAdmin2024!", // Cambiar en producción
    rol: "Administrador Plataforma",
};

async function main() {
    const passwordHash = await hashPassword(SUPERADMIN_CONFIG.password);
    const usuarioId = crypto.randomUUID();
    const now = new Date().toISOString();

    const sql = `
-- ============================================
-- Insertar Usuario Super Admin PGRC
-- ============================================
-- Email: ${SUPERADMIN_CONFIG.email}
-- Password: ${SUPERADMIN_CONFIG.password}
-- Rol: ${SUPERADMIN_CONFIG.rol}
-- ============================================

INSERT INTO usuarios (
    usuario_id,
    email,
    nombre_completo,
    password_hash,
    rol,
    organizacion_id,
    activo,
    created_at,
    updated_at
) VALUES (
    '${usuarioId}',
    '${SUPERADMIN_CONFIG.email}',
    '${SUPERADMIN_CONFIG.nombreCompleto}',
    '${passwordHash}',
    '${SUPERADMIN_CONFIG.rol}',
    NULL,
    1,
    '${now}',
    '${now}'
);

-- Verificar inserción
SELECT * FROM usuarios WHERE email = '${SUPERADMIN_CONFIG.email}';
`;

    console.log("=".repeat(60));
    console.log("SCRIPT DE SEED - SUPER ADMIN PGRC");
    console.log("=".repeat(60));
    console.log("\nCredenciales del Super Admin:");
    console.log(`  Email: ${SUPERADMIN_CONFIG.email}`);
    console.log(`  Password: ${SUPERADMIN_CONFIG.password}`);
    console.log(`  Rol: ${SUPERADMIN_CONFIG.rol}`);
    console.log("\n" + "=".repeat(60));
    console.log("SQL GENERADO:");
    console.log("=".repeat(60));
    console.log(sql);
    console.log("=".repeat(60));
    console.log("\nPara ejecutar LOCALMENTE:");
    console.log(`npx wrangler d1 execute pgrc-database --local --command "${sql.replace(/\n/g, " ").replace(/"/g, '\\"')}"`);
    console.log("\nPara ejecutar en PRODUCCIÓN:");
    console.log(`npx wrangler d1 execute pgrc-database --remote --command "INSERT INTO usuarios (usuario_id, email, nombre_completo, password_hash, rol, organizacion_id, activo, created_at, updated_at) VALUES ('${usuarioId}', '${SUPERADMIN_CONFIG.email}', '${SUPERADMIN_CONFIG.nombreCompleto}', '${passwordHash}', '${SUPERADMIN_CONFIG.rol}', NULL, 1, '${now}', '${now}');"`);
    console.log("=".repeat(60));
}

main().catch(console.error);
