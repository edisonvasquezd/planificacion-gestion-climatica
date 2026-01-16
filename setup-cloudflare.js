const https = require('https');

const AUTH_EMAIL = 'edison@jhedai.com';
const AUTH_KEY = '6acaf499b9d3429e81158e3edbf8840cf63db';
const ACCOUNT_ID = '985d023768a24497cde522d66548777b2';

async function cfRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.cloudflare.com',
            port: 443,
            path: `/client/v4${path}`,
            method: method,
            headers: {
                'X-Auth-Email': AUTH_EMAIL,
                'X-Auth-Key': AUTH_KEY,
                'Content-Type': 'application/json',
            },
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(json);
                    } else {
                        reject({ statusCode: res.statusCode, body: json });
                    }
                } catch (e) {
                    reject({ error: e, body });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function main() {
    try {
        console.log('--- Cloudflare Setup ---');

        // 1. Create D1
        console.log('\nCreating D1 Database...');
        let dbId;
        try {
            const resp = await cfRequest(`/accounts/${ACCOUNT_ID}/d1/database`, 'POST', { name: 'planificacion-gestion-db' });
            dbId = resp.result.uuid;
            console.log('D1 Created. ID:', dbId);
        } catch (e) {
            if (e.body && e.body.errors && e.body.errors[0].code === 7002) { // Already exists or similar
                console.log('D1 might already exist, searching...');
                const list = await cfRequest(`/accounts/${ACCOUNT_ID}/d1/database`);
                const existing = list.result.find(d => d.name === 'planificacion-gestion-db');
                if (existing) {
                    dbId = existing.uuid;
                    console.log('Found existing D1. ID:', dbId);
                } else {
                    console.error('Error:', e.statusCode, JSON.stringify(e.body));
                }
            } else {
                console.error('Error creating D1:', e.statusCode, JSON.stringify(e.body));
            }
        }

        // 2. Create KV
        console.log('\nCreating KV Namespaces...');
        const createKV = async (title) => {
            try {
                const resp = await cfRequest(`/accounts/${ACCOUNT_ID}/storage/kv/namespaces`, 'POST', { title });
                console.log(`KV ${title} Created. ID:`, resp.result.id);
                return resp.result.id;
            } catch (e) {
                console.log(`KV ${title} error (maybe exists):`, e.statusCode);
                const list = await cfRequest(`/accounts/${ACCOUNT_ID}/storage/kv/namespaces`);
                const existing = list.result.find(k => k.title === title);
                if (existing) {
                    console.log(`Found existing KV ${title}. ID:`, existing.id);
                    return existing.id;
                }
            }
        };

        const kvCacheId = await createKV('KV_CACHE');
        const kvSessionsId = await createKV('KV_SESSIONS');

        console.log('\n--- Summary for wrangler.toml ---');
        console.log(`database_id = "${dbId || ''}"`);
        console.log(`KV_CACHE id = "${kvCacheId || ''}"`);
        console.log(`KV_SESSIONS id = "${kvSessionsId || ''}"`);

    } catch (error) {
        console.error('Fatal Error:', error);
    }
}

main();

