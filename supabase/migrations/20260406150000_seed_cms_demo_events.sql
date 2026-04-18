-- Deprecated duplicate CMS demo seed.
-- The normalized demo content is seeded by 20260406160000_seed_cms_demo_data.sql.

DO $$
BEGIN
  RAISE NOTICE 'Skipping deprecated CMS demo seed; normalized seed runs in 20260406160000.';
END;
$$;
