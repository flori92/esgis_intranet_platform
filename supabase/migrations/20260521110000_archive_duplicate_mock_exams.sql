BEGIN;

UPDATE public.exams
SET status = 'archived',
    title = CASE
      WHEN title ILIKE '%archive%' THEN title
      ELSE title || ' (archive)'
    END,
    description = CASE
      WHEN description ILIKE '%Archive technique: doublon conserve pour historique%' THEN description
      ELSE trim(both from concat_ws(
        E'\n\n',
        NULLIF(description, ''),
        'Archive technique: doublon conserve pour historique. Les versions actives des examens blancs sont les examens 8 et 9.'
      ))
    END,
    updated_at = now()
WHERE id IN (1, 2)
  AND category = 'mock_exam';

COMMIT;
