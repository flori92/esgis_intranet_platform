import https from 'https';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://zsuszjlgatsylleuopff.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzdXN6amxnYXRzeWxsZXVvcGZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIwMDk2NiwiZXhwIjoyMDkwNzY5NjY2fQ.KoZX_65H9eeGDrV4FrYi3b-i0xxLa4GVLah-nKlHUhw';

const sqlFilePath = process.argv[2];

if (!sqlFilePath) {
  console.error('Usage: node apply_sql.mjs <path_to_sql_file>');
  process.exit(1);
}

const sql = fs.readFileSync(sqlFilePath, 'utf8');

async function applySql(query) {
  const options = {
    hostname: 'zsuszjlgatsylleuopff.supabase.co',
    path: '/rest/v1/rpc/exec_sql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify({ sql: query }));
    req.end();
  });
}

console.log(`Applying SQL from ${sqlFilePath}...`);
applySql(sql)
  .then(data => {
    console.log('✅ SQL applied successfully');
    console.log(data);
  })
  .catch(err => {
    console.error('❌ Error applying SQL:', err.message);
    process.exit(1);
  });
