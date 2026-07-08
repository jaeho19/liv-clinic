-- 034: Revoke public execution of SECURITY DEFINER inventory RPCs.
-- All call sites go through /api/admin/* routes using the service-role client,
-- so anon-key execution via PostgREST was an unused attack surface
-- (Supabase security advisor: anon_security_definer_function_executable).
-- NOTE: revoking from anon/authenticated alone is not enough — functions get
-- an implicit EXECUTE grant to PUBLIC on creation, so PUBLIC must be revoked
-- and service_role re-granted explicitly.

DO $$
DECLARE fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'create_inventory_item',
        'create_procedure_recipe',
        'get_inventory_items',
        'get_inventory_stats',
        'get_inventory_transactions',
        'get_procedure_recipes',
        'soft_delete_inventory_item',
        'update_inventory_item_by_id'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.sig);
  END LOOP;
END $$;
