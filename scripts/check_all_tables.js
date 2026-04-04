import https from 'https';

const SUPABASE_URL = 'https://zsuszjlgatsylleuopff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzdXN6amxnYXRzeWxsZXVvcGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDA5NjYsImV4cCI6MjA5MDc3Njk2Nn0.KoZX_65H9eeGDrV4FrYi3b-i0xxLa4GVLah-nKlHUhw';

async function checkTable(table) {
  const options = {
    hostname: 'zsuszjlgatsylleuopff.supabase.co',
    path: `/rest/v1/${table}?select=count&limit=1`,
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

async function main() {
  const tables = [
    'profiles', 'departments', 'courses', 'students', 'professors', 
    'exams', 'validation_queue', 'generated_documents', 'document_templates', 
    'documents', 'grades', 'student_courses', 'professor_courses', 
    'quiz_results', 'exam_results', 'active_students', 'cheating_attempts',
    'events', 'messages', 'notifications', 'internships', 'internship_applications',
    'filieres', 'niveaux', 'inscriptions', 'cours', 'notes' // old names
  ];

  console.log('Checking all possible tables...');
  for (const table of tables) {
    const exists = await checkTable(table);
    console.log(`${exists ? '✅' : '❌'} Table: ${table}`);
  }
}

main();
