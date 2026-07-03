
-- =========================================================================
-- MamaHealth Phase 1 schema
--
-- DESIGN INVARIANT (do not violate in future migrations or app code):
-- No other data source in this app — including vitals_readings — may
-- suppress, downgrade, or auto-dismiss a WHO danger-sign alert.
-- Danger-sign logic is authoritative and independent.
-- =========================================================================

-- Enums -------------------------------------------------------------------
CREATE TYPE public.app_language AS ENUM ('fr', 'en', 'pcm', 'ff');
CREATE TYPE public.trimester_enum AS ENUM ('first', 'second', 'third');
CREATE TYPE public.danger_sign_severity AS ENUM ('critical', 'urgent', 'monitor');
CREATE TYPE public.vitals_source_enum AS ENUM ('esp32_bridge', 'manual', 'other');

-- Shared updated_at trigger ----------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Pregnancy helpers -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gestational_week(lmp date)
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT GREATEST(0, (CURRENT_DATE - lmp) / 7)::int;
$$;

CREATE OR REPLACE FUNCTION public.trimester_for(lmp date)
RETURNS public.trimester_enum
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN (CURRENT_DATE - lmp) < 7 * 13 THEN 'first'::public.trimester_enum
    WHEN (CURRENT_DATE - lmp) < 7 * 27 THEN 'second'::public.trimester_enum
    ELSE 'third'::public.trimester_enum
  END;
$$;

-- profiles ----------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  preferred_language public.app_language NOT NULL DEFAULT 'fr',
  is_adolescent_module boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_owner_select" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_owner_insert" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_owner_update" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NULLIF(NEW.raw_user_meta_data->>'display_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- pregnancies -------------------------------------------------------------
CREATE TABLE public.pregnancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lmp_date date NOT NULL,
  edd_date date GENERATED ALWAYS AS (lmp_date + 280) STORED,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX pregnancies_one_active_per_user
  ON public.pregnancies (user_id) WHERE active;
CREATE INDEX pregnancies_user_id_idx ON public.pregnancies (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pregnancies TO authenticated;
GRANT ALL ON public.pregnancies TO service_role;
ALTER TABLE public.pregnancies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pregnancies_owner_all" ON public.pregnancies FOR ALL
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER pregnancies_updated_at
  BEFORE UPDATE ON public.pregnancies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- danger_sign_logs --------------------------------------------------------
-- INVARIANT: This table's `triggered_critical` field is derived only from
-- the WHO danger-sign booleans in `signs`. It MUST NOT be influenced by
-- vitals_readings or any other sensor input, now or in the future.
CREATE OR REPLACE FUNCTION public.compute_triggered_critical(signs jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE((signs->>'bleeding')::boolean, false)
      OR COALESCE((signs->>'convulsions')::boolean, false)
      OR COALESCE((signs->>'water_broke_before_labor')::boolean, false)
      OR (
        COALESCE((signs->>'severe_headache')::boolean, false)
        AND COALESCE((signs->>'blurred_vision')::boolean, false)
      );
$$;

CREATE TABLE public.danger_sign_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pregnancy_id uuid REFERENCES public.pregnancies(id) ON DELETE SET NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  signs jsonb NOT NULL,
  triggered_critical boolean NOT NULL DEFAULT false,
  acknowledged_at timestamptz,
  synced_from_offline boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.danger_sign_logs IS
  'Authoritative WHO danger-sign checks. No sensor data may suppress or downgrade these alerts.';
CREATE INDEX danger_sign_logs_user_idx ON public.danger_sign_logs (user_id, checked_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.danger_sign_logs TO authenticated;
GRANT ALL ON public.danger_sign_logs TO service_role;
ALTER TABLE public.danger_sign_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "danger_logs_owner_all" ON public.danger_sign_logs FOR ALL
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_triggered_critical()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.triggered_critical := public.compute_triggered_critical(NEW.signs);
  RETURN NEW;
END;
$$;
CREATE TRIGGER danger_sign_logs_set_critical
  BEFORE INSERT OR UPDATE OF signs ON public.danger_sign_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_triggered_critical();

-- clinics -----------------------------------------------------------------
CREATE TABLE public.clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text,
  region text,
  city text,
  address text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  phone text,
  hours text,
  verified boolean NOT NULL DEFAULT false,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clinics_lat_lng_idx ON public.clinics (lat, lng);
GRANT SELECT ON public.clinics TO anon, authenticated;
GRANT ALL ON public.clinics TO service_role;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinics_public_read" ON public.clinics FOR SELECT
  TO anon, authenticated USING (true);
CREATE TRIGGER clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- cycle_logs (adolescent module) -----------------------------------------
CREATE TABLE public.cycle_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_start_date date NOT NULL,
  cycle_length_days int,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cycle_logs_user_idx ON public.cycle_logs (user_id, cycle_start_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_logs TO authenticated;
GRANT ALL ON public.cycle_logs TO service_role;
ALTER TABLE public.cycle_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cycle_logs_owner_all" ON public.cycle_logs FOR ALL
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- vitals_readings (Phase 2 landing zone; empty for now) ------------------
-- INVARIANT: Advisory only. MUST NOT influence danger_sign_logs logic.
CREATE TABLE public.vitals_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pregnancy_id uuid REFERENCES public.pregnancies(id) ON DELETE SET NULL,
  reading_type text NOT NULL,
  value numeric NOT NULL,
  unit text,
  source public.vitals_source_enum NOT NULL DEFAULT 'esp32_bridge',
  verified boolean NOT NULL DEFAULT false,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.vitals_readings IS
  'Advisory sensor readings. MUST NOT influence danger_sign_logs.';
CREATE INDEX vitals_readings_user_idx ON public.vitals_readings (user_id, recorded_at DESC);
-- Users can READ their own readings; INSERT/UPDATE/DELETE restricted to service_role (edge function).
GRANT SELECT ON public.vitals_readings TO authenticated;
GRANT ALL ON public.vitals_readings TO service_role;
ALTER TABLE public.vitals_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vitals_owner_select" ON public.vitals_readings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
