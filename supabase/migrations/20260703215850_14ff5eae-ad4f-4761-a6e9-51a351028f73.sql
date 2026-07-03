
-- Pin search_path on SQL helpers
CREATE OR REPLACE FUNCTION public.gestational_week(lmp date)
RETURNS int
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT GREATEST(0, (CURRENT_DATE - lmp) / 7)::int;
$$;

CREATE OR REPLACE FUNCTION public.trimester_for(lmp date)
RETURNS public.trimester_enum
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN (CURRENT_DATE - lmp) < 7 * 13 THEN 'first'::public.trimester_enum
    WHEN (CURRENT_DATE - lmp) < 7 * 27 THEN 'second'::public.trimester_enum
    ELSE 'third'::public.trimester_enum
  END;
$$;

CREATE OR REPLACE FUNCTION public.compute_triggered_critical(signs jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE((signs->>'bleeding')::boolean, false)
      OR COALESCE((signs->>'convulsions')::boolean, false)
      OR COALESCE((signs->>'water_broke_before_labor')::boolean, false)
      OR (
        COALESCE((signs->>'severe_headache')::boolean, false)
        AND COALESCE((signs->>'blurred_vision')::boolean, false)
      );
$$;

-- Lock down the signup handler — only the auth trigger should invoke it.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
