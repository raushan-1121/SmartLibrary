-- ============================================================================
-- SmartLib Database Migration 001 — Hardened Production Version (v3)
-- Target File: database/migrations/001_add_membership_and_status.sql
-- ============================================================================
-- PURPOSE:
--   Extend the 'users' table with two new columns:
--     1. membership_type VARCHAR(20) NOT NULL DEFAULT 'BOOK_ONLY'
--        CHECK (membership_type IN ('BOOK_ONLY', 'COMBO'))
--     2. account_status  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
--        CHECK (account_status IN ('PENDING_APPROVAL', 'ACTIVE', 'REJECTED'))
--
-- SAFETY & IDEMPOTENCY GUARANTEES:
--   1. Transactional: Runs entirely inside BEGIN ... COMMIT. Any check failure
--      triggers RAISE EXCEPTION, automatically rolling back all changes.
--   2. Strict Column Verification: If columns already exist, verifies exact
--      type (VARCHAR(20)), nullability (NOT NULL), and default. Incompatible
--      columns abort the migration instead of being silently accepted.
--   3. Strict Constraint Verification: If constraints already exist:
--      - Validates pg_constraint.conkey to prove the constraint is bound
--        exclusively to the intended column.
--      - Validates convalidated = true (not an unvalidated constraint).
--      - Validates expression structure: rejects unexpected expressions,
--        negations (NOT), disjunctions (OR / IS NULL), or extra operators.
--      - Verifies the exact sorted set of allowed literals.
--   4. Zero Data Modification on Re-run: Contains NO application UPDATE
--      statements. PENDING_APPROVAL and REJECTED accounts are 100% preserved.
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1 — Add or Verify membership_type column
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_full_type  text;
  v_not_null   boolean;
  v_default    text;
BEGIN
  SELECT
    format_type(a.atttypid, a.atttypmod),
    a.attnotnull,
    pg_get_expr(d.adbin, d.adrelid)
  INTO
    v_full_type,
    v_not_null,
    v_default
  FROM pg_attribute a
  LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
  WHERE a.attrelid = 'users'::regclass
    AND a.attname  = 'membership_type'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF NOT FOUND THEN
    -- Column does not exist: create with strict specifications
    EXECUTE $sql$
      ALTER TABLE users
        ADD COLUMN membership_type VARCHAR(20)
          NOT NULL DEFAULT 'BOOK_ONLY'
    $sql$;
    RAISE NOTICE 'Migration 001 Step 1: Added column users.membership_type (VARCHAR(20) NOT NULL DEFAULT ''BOOK_ONLY'').';
  ELSE
    -- Column already exists: verify exact type, nullability, and default
    IF v_full_type = 'character varying(20)'
       AND v_not_null = true
       AND v_default = '''BOOK_ONLY''::character varying' THEN
      RAISE NOTICE 'Migration 001 Step 1: users.membership_type already exists with verified definition (VARCHAR(20), NOT NULL, DEFAULT ''BOOK_ONLY''). Skipping.';
    ELSE
      RAISE EXCEPTION
        E'Migration 001 ABORTED at Step 1.\n'
        'Column users.membership_type exists with an incompatible definition:\n'
        '  Actual   : type=%, not_null=%, default=%\n'
        '  Expected : type=character varying(20), not_null=true, default=''BOOK_ONLY''::character varying\n'
        'Resolve the schema discrepancy before re-running.',
        v_full_type, v_not_null, v_default;
    END IF;
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2 — Add or Verify account_status column
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_full_type  text;
  v_not_null   boolean;
  v_default    text;
BEGIN
  SELECT
    format_type(a.atttypid, a.atttypmod),
    a.attnotnull,
    pg_get_expr(d.adbin, d.adrelid)
  INTO
    v_full_type,
    v_not_null,
    v_default
  FROM pg_attribute a
  LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
  WHERE a.attrelid = 'users'::regclass
    AND a.attname  = 'account_status'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF NOT FOUND THEN
    EXECUTE $sql$
      ALTER TABLE users
        ADD COLUMN account_status VARCHAR(20)
          NOT NULL DEFAULT 'ACTIVE'
    $sql$;
    RAISE NOTICE 'Migration 001 Step 2: Added column users.account_status (VARCHAR(20) NOT NULL DEFAULT ''ACTIVE'').';
  ELSE
    IF v_full_type = 'character varying(20)'
       AND v_not_null = true
       AND v_default = '''ACTIVE''::character varying' THEN
      RAISE NOTICE 'Migration 001 Step 2: users.account_status already exists with verified definition (VARCHAR(20), NOT NULL, DEFAULT ''ACTIVE''). Skipping.';
    ELSE
      RAISE EXCEPTION
        E'Migration 001 ABORTED at Step 2.\n'
        'Column users.account_status exists with an incompatible definition:\n'
        '  Actual   : type=%, not_null=%, default=%\n'
        '  Expected : type=character varying(20), not_null=true, default=''ACTIVE''::character varying\n'
        'Resolve the schema discrepancy before re-running.',
        v_full_type, v_not_null, v_default;
    END IF;
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3 — Add or Verify CHECK constraint on membership_type
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_con_oid         oid;
  v_convalidated    boolean;
  v_con_cols        text[];
  v_existing_def    text;
  v_actual_values   text[];
  v_expected_sorted text[] := ARRAY['BOOK_ONLY', 'COMBO'];
  v_token_count     integer;
BEGIN
  -- 1. Locate existing constraint
  SELECT
    c.oid,
    c.convalidated,
    pg_get_constraintdef(c.oid, false),
    ARRAY(
      SELECT a.attname
      FROM unnest(c.conkey) AS k(attnum)
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
      ORDER BY a.attname
    )
  INTO
    v_con_oid,
    v_convalidated,
    v_existing_def,
    v_con_cols
  FROM pg_constraint c
  WHERE c.conrelid = 'users'::regclass
    AND c.conname  = 'users_membership_type_check'
    AND c.contype  = 'c';

  IF NOT FOUND THEN
    -- Constraint is absent: create it
    EXECUTE $sql$
      ALTER TABLE users
        ADD CONSTRAINT users_membership_type_check
          CHECK (membership_type IN ('BOOK_ONLY', 'COMBO'))
    $sql$;
    RAISE NOTICE 'Migration 001 Step 3: Created constraint users_membership_type_check.';

  ELSE
    -- Constraint exists: perform rigorous multi-layer verification

    -- (a) Verify column binding: must target ONLY 'membership_type'
    IF v_con_cols IS DISTINCT FROM ARRAY['membership_type'] THEN
      RAISE EXCEPTION
        E'Migration 001 ABORTED at Step 3.\n'
        'Constraint users_membership_type_check exists but references unexpected column(s): %\n'
        'Expected strictly: [membership_type]. Definition: %',
        v_con_cols, v_existing_def;
    END IF;

    -- (b) Verify enforcement: must be active and validated
    IF NOT v_convalidated THEN
      RAISE EXCEPTION
        E'Migration 001 ABORTED at Step 3.\n'
        'Constraint users_membership_type_check exists but is marked NOT VALID. Definition: %',
        v_existing_def;
    END IF;

    -- (c) Reject subverting clauses (NOT, OR, AND, IS NULL, CASE, subqueries)
    IF v_existing_def ~* '\y(NOT|OR|AND|IS\s+NULL|CASE|WHEN|LIKE|ILIKE|SIMILAR|BETWEEN|EXISTS|SELECT)\y' THEN
      RAISE EXCEPTION
        E'Migration 001 ABORTED at Step 3.\n'
        'Constraint users_membership_type_check contains unexpected or subverting clauses.\n'
        'Definition: %\n'
        'Only clean positive membership expressions are permitted.',
        v_existing_def;
    END IF;

    -- (d) Verify structural positive array membership format
    IF v_existing_def !~ '^CHECK\s*\(\({1,3}\(membership_type\)::text\s*=\s*ANY\s*\((\(ARRAY|ARRAY\[).*?\)\)\)$'
       AND v_existing_def !~* '^CHECK\s*\(\(?membership_type\)?\s+IN\s+\(' THEN
      RAISE EXCEPTION
        E'Migration 001 ABORTED at Step 3.\n'
        'Constraint users_membership_type_check does not match the expected positive membership structure.\n'
        'Definition: %',
        v_existing_def;
    END IF;

    -- (e) Extract and verify exact sorted literal value set
    SELECT array_agg(m[1] ORDER BY m[1]), count(*)
      INTO v_actual_values, v_token_count
      FROM regexp_matches(v_existing_def, '''([A-Z_]+)''', 'g') AS m;

    IF v_token_count <> 2 OR v_actual_values IS DISTINCT FROM v_expected_sorted THEN
      RAISE EXCEPTION
        E'Migration 001 ABORTED at Step 3.\n'
        'Constraint users_membership_type_check allowed values mismatch.\n'
        '  Extracted : %\n'
        '  Expected  : %\n'
        '  Definition: %',
        v_actual_values, v_expected_sorted, v_existing_def;
    END IF;

    RAISE NOTICE 'Migration 001 Step 3: users_membership_type_check verified (column binding, validation state, and exact value set match). Skipping.';
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 4 — Add or Verify CHECK constraint on account_status
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_con_oid         oid;
  v_convalidated    boolean;
  v_con_cols        text[];
  v_existing_def    text;
  v_actual_values   text[];
  v_expected_sorted text[] := ARRAY['ACTIVE', 'PENDING_APPROVAL', 'REJECTED'];
  v_token_count     integer;
BEGIN
  SELECT
    c.oid,
    c.convalidated,
    pg_get_constraintdef(c.oid, false),
    ARRAY(
      SELECT a.attname
      FROM unnest(c.conkey) AS k(attnum)
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
      ORDER BY a.attname
    )
  INTO
    v_con_oid,
    v_convalidated,
    v_existing_def,
    v_con_cols
  FROM pg_constraint c
  WHERE c.conrelid = 'users'::regclass
    AND c.conname  = 'users_account_status_check'
    AND c.contype  = 'c';

  IF NOT FOUND THEN
    EXECUTE $sql$
      ALTER TABLE users
        ADD CONSTRAINT users_account_status_check
          CHECK (account_status IN ('PENDING_APPROVAL', 'ACTIVE', 'REJECTED'))
    $sql$;
    RAISE NOTICE 'Migration 001 Step 4: Created constraint users_account_status_check.';

  ELSE
    -- (a) Verify column binding: must target ONLY 'account_status'
    IF v_con_cols IS DISTINCT FROM ARRAY['account_status'] THEN
      RAISE EXCEPTION
        E'Migration 001 ABORTED at Step 4.\n'
        'Constraint users_account_status_check exists but references unexpected column(s): %\n'
        'Expected strictly: [account_status]. Definition: %',
        v_con_cols, v_existing_def;
    END IF;

    -- (b) Verify enforcement: must be active and validated
    IF NOT v_convalidated THEN
      RAISE EXCEPTION
        E'Migration 001 ABORTED at Step 4.\n'
        'Constraint users_account_status_check exists but is marked NOT VALID. Definition: %',
        v_existing_def;
    END IF;

    -- (c) Reject subverting clauses (NOT, OR, AND, IS NULL, CASE, subqueries)
    IF v_existing_def ~* '\y(NOT|OR|AND|IS\s+NULL|CASE|WHEN|LIKE|ILIKE|SIMILAR|BETWEEN|EXISTS|SELECT)\y' THEN
      RAISE EXCEPTION
        E'Migration 001 ABORTED at Step 4.\n'
        'Constraint users_account_status_check contains unexpected or subverting clauses.\n'
        'Definition: %\n'
        'Only clean positive membership expressions are permitted.',
        v_existing_def;
    END IF;

    -- (d) Verify structural positive array membership format
    IF v_existing_def !~ '^CHECK\s*\(\({1,3}\(account_status\)::text\s*=\s*ANY\s*\((\(ARRAY|ARRAY\[).*?\)\)\)$'
       AND v_existing_def !~* '^CHECK\s*\(\(?account_status\)?\s+IN\s+\(' THEN
      RAISE EXCEPTION
        E'Migration 001 ABORTED at Step 4.\n'
        'Constraint users_account_status_check does not match the expected positive membership structure.\n'
        'Definition: %',
        v_existing_def;
    END IF;

    -- (e) Extract and verify exact sorted literal value set
    SELECT array_agg(m[1] ORDER BY m[1]), count(*)
      INTO v_actual_values, v_token_count
      FROM regexp_matches(v_existing_def, '''([A-Z_]+)''', 'g') AS m;

    IF v_token_count <> 3 OR v_actual_values IS DISTINCT FROM v_expected_sorted THEN
      RAISE EXCEPTION
        E'Migration 001 ABORTED at Step 4.\n'
        'Constraint users_account_status_check allowed values mismatch.\n'
        '  Extracted : %\n'
        '  Expected  : %\n'
        '  Definition: %',
        v_actual_values, v_expected_sorted, v_existing_def;
    END IF;

    RAISE NOTICE 'Migration 001 Step 4: users_account_status_check verified (column binding, validation state, and exact value set match). Skipping.';
  END IF;
END
$$;

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (Reference only — do not run unless reverting Phase 2C)
-- ORDER: Stop/revert backend/server.js before dropping these columns.
-- ============================================================================
--
-- BEGIN;
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_membership_type_check;
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;
-- ALTER TABLE users DROP COLUMN  IF EXISTS membership_type;
-- ALTER TABLE users DROP COLUMN  IF EXISTS account_status;
-- COMMIT;
--
-- ============================================================================
-- POST-MIGRATION AUDIT QUERIES (Read-only, post-commit)
-- ============================================================================
--
-- 1. Inspect exact column properties:
-- SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
--   FROM information_schema.columns
--  WHERE table_name  = 'users'
--    AND column_name IN ('membership_type', 'account_status')
--  ORDER BY column_name;
--
-- 2. Inspect exact constraint definitions and referenced columns:
-- SELECT
--   c.conname,
--   c.convalidated,
--   ARRAY(
--     SELECT a.attname
--     FROM unnest(c.conkey) AS k(attnum)
--     JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
--   ) AS constrained_columns,
--   pg_get_constraintdef(c.oid, true) AS definition
-- FROM pg_constraint c
-- WHERE c.conrelid = 'users'::regclass
--   AND c.conname  IN ('users_membership_type_check', 'users_account_status_check');
--
-- 3. Confirm student statuses (verifies no PENDING_APPROVAL/REJECTED reset):
-- SELECT account_status, COUNT(*) AS count
--   FROM users
--  GROUP BY account_status;
-- ============================================================================
