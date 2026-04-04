import https from 'https';

const SUPABASE_URL = 'https://zsuszjlgatsylleuopff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzdXN6amxnYXRzeWxsZXVvcGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDA5NjYsImV4cCI6MjA5MDc3Njk2Nn0.KoZX_65H9eeGDrV4FrYi3b-i0xxLa4GVLah-nKlHUhw';

async function getColumns(table) {
  const options = {
    hostname: 'zsuszjlgatsylleuopff.supabase.co',
    path: `/rest/v1/rpc/exec_sql`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  };

  const sql = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = '${table}' 
    AND table_schema = 'public';
  `;

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.write(JSON.stringify({ sql }));
    req.end();
  });
}

async function main() {
  const tables = ['students', 'professors', 'grades', 'profiles'];
  console.log('Fetching table info...');
  
  for (const table of tables) {
    console.log(`\nTable: ${table}`);
    const columns = await getColumns(table);
    if (columns && Array.isArray(columns)) {
      columns.forEach(c => console.log(` - ${c.column_name}: ${c.data_type}`));
    } else {
      console.log(' - (Could not fetch or RPC exec_sql missing)');
    }
  }
}

main();
