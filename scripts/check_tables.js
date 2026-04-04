// Script to check what tables exist in Supabase
import https from 'https';

// Configuration Supabase
const SUPABASE_URL = 'https://zsuszjlgatsylleuopff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzdXN6amxnYXRzeWxsZXVvcGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDA5NjYsImV4cCI6MjA5MDc3Njk2Nn0.KoZX_65H9eeGDrV4FrYi3b-i0xxLa4GVLah-nKlHUhw';

// Fonction pour effectuer une requête HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

// Check what tables exist by trying to query them
async function checkTables() {
  console.log('Checking existing tables...');

  const tablesToCheck = ['profiles', 'departments', 'courses', 'students', 'professors', 'exams', 'validation_queue', 'generated_documents', 'document_templates', 'documents'];

  for (const table of tablesToCheck) {
    const options = {
      hostname: 'zsuszjlgatsylleuopff.supabase.co',
      path: `/rest/v1/${table}?select=count&limit=1`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    };

    try {
      const response = await makeRequest(options);
      if (response.statusCode === 200) {
        console.log(`✅ Table ${table} exists`);
      } else if (response.statusCode === 404) {
        console.log(`❌ Table ${table} does not exist`);
      } else {
        console.log(`❓ Table ${table} status: ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ Error checking ${table}:`, error.message);
    }
  }
}

checkTables();