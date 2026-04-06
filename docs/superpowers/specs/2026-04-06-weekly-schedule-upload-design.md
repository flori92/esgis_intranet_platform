# Weekly Schedule PDF Upload & Display

## Overview

Allow admins and professors to upload weekly schedule PDFs (emplois du temps) per department and level. Students automatically see and can preview/download the schedule for their own department and level. Notifications (in-app + email) are sent on publication.

## Data Model

### Table: `weekly_schedules`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| title | TEXT | NOT NULL |
| file_path | TEXT | NOT NULL (path in Storage bucket) |
| department_id | INTEGER | FK → departments(id), NOT NULL |
| level_code | VARCHAR(20) | NOT NULL (L1, L2, L3, M1, M2) |
| week_start_date | DATE | NOT NULL |
| academic_year | TEXT | e.g. "2025-2026" |
| uploaded_by | UUID | FK → profiles(id), NOT NULL |
| notes | TEXT | nullable |
| status | VARCHAR(20) | DEFAULT 'published' (published, draft, archived) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**Indexes:**
- `idx_weekly_schedules_dept_level` on (department_id, level_code)
- `idx_weekly_schedules_week` on (week_start_date)

**RLS Policies:**
- Admins: full CRUD
- Professors: INSERT/UPDATE/SELECT on rows where department_id matches their own department; DELETE only own uploads
- Students: SELECT only where department_id and level_code match their profile

## Storage

**Bucket:** `schedules` (new, dedicated)

**File path pattern:** `{department_id}/{level_code}/{academic_year}/{week_start_date}.pdf`
- Example: `3/M1/2026/2026-04-06.pdf`

**Policies:**
- Authenticated users: read access (download via signed URL)
- Admins + professors: write access (upload, overwrite, delete)

**Constraints:**
- MIME type: `application/pdf` only
- Max file size: 10 MB

## Pages & Routes

### Admin/Professor: Upload & Management

**Route:** `/admin/weekly-schedules` (admin), `/professor/weekly-schedules` (professor)

**Features:**
- Table listing all uploaded schedules: title, department, level, week, status, uploader, actions
- "Publier un EDT" button opens a dialog:
  - Department selector (dropdown from departments table)
  - Level selector (L1, L2, L3, M1, M2)
  - Week start date picker (auto-snaps to Monday)
  - Title field (auto-filled: "EDT {level} {department} - Semaine du {date}")
  - PDF upload zone (drag & drop or click, validates PDF type and 10MB max)
  - Notes field (optional)
- Row actions: preview (opens PDF in modal), download, archive, delete
- Professors see only their department's schedules; admins see all

### Student: View & Download

**Route:** `/student/weekly-schedules`

**Features:**
- Auto-filtered to student's department + level (from profile)
- Latest published schedule shown prominently with embedded PDF preview (`<embed>` or `<iframe>`)
- Download button
- Week navigation: dropdown or prev/next arrows to browse past weeks
- Empty state if no schedule available for current week

### Sidebar Navigation

- **Admin menu:** "Emplois du temps PDF" item (CalendarMonth icon), under Calendrier section
- **Student menu:** "EDT Hebdomadaire" item (EventNote icon), near existing "Emploi du temps"
- **Professor menu:** "Emplois du temps PDF" item, near existing schedule entry

## Notifications

Triggered when a schedule is published (status = 'published'):

1. **In-app:** Insert into existing `notifications` table for each student matching department_id + level_code
   - Title: "Nouvel emploi du temps disponible"
   - Message: "L'EDT de la semaine du {week_start_date} pour {level_code} {department_name} est disponible"
   - Link: `/student/weekly-schedules`

2. **Email:** Send to verified student emails in the matching department + level, using existing email service
   - Same content as in-app notification
   - Includes direct link to the platform

## API Layer

**File:** `src/api/weeklySchedules.js`

**Functions:**
- `getWeeklySchedules(filters)` — list schedules with optional department_id, level_code, status filters
- `getWeeklyScheduleById(id)` — single schedule with signed download URL
- `getStudentCurrentSchedule({ departmentId, levelCode })` — latest published for student's dept/level
- `uploadWeeklySchedule({ file, title, departmentId, levelCode, weekStartDate, academicYear, notes })` — upload PDF to storage + insert row
- `updateWeeklySchedule(id, updates)` — update metadata or status
- `deleteWeeklySchedule(id)` — remove from storage + delete row
- `getScheduleDownloadUrl(filePath)` — generate signed URL (1h expiry)

## Security

- PDF MIME validation on client (accept attribute) and on upload (content-type check)
- 10 MB file size limit enforced client-side and via Storage bucket config
- RLS ensures students cannot access other departments' schedules
- Signed URLs with 1-hour expiration for downloads (no permanent public URLs)
- Professors scoped to their own department only

## File Structure

```
src/
  api/weeklySchedules.js          — API functions
  pages/
    admin/WeeklySchedulesPage.jsx — Admin upload & management
    professor/WeeklySchedulesPage.jsx — Professor upload (reuses admin component with role filter)
    student/WeeklySchedulesPage.jsx   — Student preview & download
supabase/
  migrations/YYYYMMDD_weekly_schedules.sql — Table + RLS + bucket
```
