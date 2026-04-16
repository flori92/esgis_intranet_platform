import { readFile } from 'node:fs/promises';
import process from 'node:process';

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF || 'zsuszjlgatsylleuopff';
const subject =
  process.env.SUPABASE_RECOVERY_SUBJECT ||
  'ESGIS Campus Platform | Réinitialisation de votre mot de passe';
const templatePath =
  process.env.SUPABASE_RECOVERY_TEMPLATE_PATH ||
  new URL('../supabase/templates/recovery.html', import.meta.url);

if (!accessToken) {
  console.error('Missing SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}

const recoveryTemplate = await readFile(templatePath, 'utf8');

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mailer_subjects_recovery: subject,
    mailer_templates_recovery_content: recoveryTemplate,
  }),
});

if (!response.ok) {
  const errorText = await response.text();
  console.error(`Supabase Management API error (${response.status}): ${errorText}`);
  process.exit(1);
}

const data = await response.json();
console.log(
  JSON.stringify(
    {
      project_ref: projectRef,
      mailer_subjects_recovery: data.mailer_subjects_recovery,
      recovery_template_updated: true,
    },
    null,
    2
  )
);
