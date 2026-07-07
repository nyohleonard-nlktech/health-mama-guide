
-- Track enum
CREATE TYPE public.app_track AS ENUM ('pregnant', 'girls');

-- Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN track public.app_track,
  ADD COLUMN onboarded boolean NOT NULL DEFAULT false;

-- Helper: get a user's track (SECURITY DEFINER, bypasses RLS on profiles)
CREATE OR REPLACE FUNCTION public.user_track(_uid uuid)
RETURNS public.app_track
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT track FROM public.profiles WHERE id = _uid;
$$;

-- Restrict clinical tables to pregnant-track users
DROP POLICY IF EXISTS pregnancies_owner_all ON public.pregnancies;
CREATE POLICY pregnancies_owner_all ON public.pregnancies
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.user_track(auth.uid()) = 'pregnant')
  WITH CHECK (auth.uid() = user_id AND public.user_track(auth.uid()) = 'pregnant');

DROP POLICY IF EXISTS danger_logs_owner_all ON public.danger_sign_logs;
CREATE POLICY danger_logs_owner_all ON public.danger_sign_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.user_track(auth.uid()) = 'pregnant')
  WITH CHECK (auth.uid() = user_id AND public.user_track(auth.uid()) = 'pregnant');

DROP POLICY IF EXISTS vitals_owner_select ON public.vitals_readings;
CREATE POLICY vitals_owner_select ON public.vitals_readings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.user_track(auth.uid()) = 'pregnant');

-- Girls content library
CREATE TABLE public.girls_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  topic text NOT NULL CHECK (topic IN ('puberty','menstrual','reproductive')),
  language public.app_language NOT NULL,
  title text NOT NULL,
  body_md text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, language)
);
GRANT SELECT ON public.girls_content TO anon, authenticated;
GRANT ALL ON public.girls_content TO service_role;
ALTER TABLE public.girls_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY girls_content_public_read ON public.girls_content
  FOR SELECT TO anon, authenticated USING (true);

CREATE TRIGGER trg_girls_content_updated
  BEFORE UPDATE ON public.girls_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Adolescent myths corpus (curated Q&A)
CREATE TABLE public.girls_myths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language public.app_language NOT NULL,
  claim text NOT NULL,
  verdict text NOT NULL CHECK (verdict IN ('true','false','misleading')),
  explanation text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.girls_myths TO anon, authenticated;
GRANT ALL ON public.girls_myths TO service_role;
ALTER TABLE public.girls_myths ENABLE ROW LEVEL SECURITY;
CREATE POLICY girls_myths_public_read ON public.girls_myths
  FOR SELECT TO anon, authenticated USING (true);

-- User claim-check log (girls track only)
CREATE TABLE public.claim_checks_girls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  claim_text text NOT NULL,
  verdict text,
  explanation text,
  confident boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.claim_checks_girls TO authenticated;
GRANT ALL ON public.claim_checks_girls TO service_role;
ALTER TABLE public.claim_checks_girls ENABLE ROW LEVEL SECURITY;
CREATE POLICY claim_checks_girls_owner ON public.claim_checks_girls
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.user_track(auth.uid()) = 'girls')
  WITH CHECK (auth.uid() = user_id AND public.user_track(auth.uid()) = 'girls');

-- Help resources (public read, no user-linked logging)
CREATE TABLE public.help_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text,
  region text,
  category text NOT NULL CHECK (category IN ('abuse','mental_health','reproductive','general')),
  name text NOT NULL,
  phone text,
  url text,
  notes text,
  language public.app_language NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.help_resources TO anon, authenticated;
GRANT ALL ON public.help_resources TO service_role;
ALTER TABLE public.help_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY help_resources_public_read ON public.help_resources
  FOR SELECT TO anon, authenticated USING (true);

-- Seed girls_content (FR + EN starter set; PCM/FF placeholders)
INSERT INTO public.girls_content (slug, topic, language, title, body_md, sort_order) VALUES
('puberty-basics','puberty','en','Understanding puberty','Puberty is the natural process your body goes through as you grow up. Changes usually start between ages 8 and 14 and can include body growth, mood shifts, and the start of periods. Everyone changes at their own pace — there is no "normal" timeline.',1),
('puberty-basics','puberty','fr','Comprendre la puberté','La puberté est le processus naturel par lequel ton corps évolue en grandissant. Les changements commencent souvent entre 8 et 14 ans : croissance, changements d''humeur, début des règles. Chacune évolue à son rythme.',1),
('puberty-basics','puberty','pcm','Puberty na wetin?','Puberty na di time wey your body dey change as you dey grow. E dey start between 8 to 14 years. Everybody body dey change for different time — no fear.',1),
('puberty-basics','puberty','ff','Faamde puberté','Puberté ko waylorde ɓanndu ma nde mawnata. Ina wona hakkunde duuɓi 8 e 14.',1),
('menstrual-cycle','menstrual','en','Your menstrual cycle','A menstrual cycle usually lasts 21–35 days. Bleeding lasts 2–7 days. Cramps, mood changes, and tiredness are common. Tracking your cycle helps you know your body.',1),
('menstrual-cycle','menstrual','fr','Ton cycle menstruel','Un cycle menstruel dure généralement 21 à 35 jours. Les règles durent 2 à 7 jours. Les crampes, changements d''humeur et fatigue sont courants. Suivre ton cycle t''aide à connaître ton corps.',1),
('menstrual-cycle','menstrual','pcm','Your monthly period','Period cycle dey last 21 to 35 days. Bleeding dey last 2 to 7 days. Small pain, mood change and tiredness na normal.',1),
('menstrual-cycle','menstrual','ff','Cikkitgol ma','Cikkitgol ina jogii balɗe 21 haa 35.',1),
('period-hygiene','menstrual','en','Period hygiene','Change pads or tampons every 4–6 hours. Wash your hands before and after. Reusable cloth pads are okay if washed and dried in the sun. Never be ashamed to ask for supplies.',2),
('period-hygiene','menstrual','fr','Hygiène pendant les règles','Change ta serviette toutes les 4 à 6 heures. Lave-toi les mains avant et après. Les serviettes lavables sont bien si séchées au soleil.',2),
('consent-basics','reproductive','en','Consent and your body','Your body is yours. No one has the right to touch you without your clear "yes." Consent must be freely given, informed, and can be taken back anytime. If someone pressures you, that is not consent.',1),
('consent-basics','reproductive','fr','Le consentement et ton corps','Ton corps t''appartient. Personne n''a le droit de te toucher sans ton accord clair. Le consentement doit être libre, informé, et peut être retiré à tout moment.',1),
('consent-basics','reproductive','pcm','Consent and your body','Your body na your own. Nobody get right to touch you if you no gree. If person dey force you, that no be consent.',1),
('reproductive-health','reproductive','en','Reproductive health basics','Your reproductive system needs care: eat well, sleep enough, and see a health worker for any unusual pain, discharge, or missed periods. Regular check-ups keep you healthy.',2),
('reproductive-health','reproductive','fr','Santé reproductive : les bases','Ton système reproducteur a besoin de soins : bien manger, bien dormir, et consulter un professionnel de santé en cas de douleur inhabituelle, pertes ou règles absentes.',2);

-- Seed a small myths corpus
INSERT INTO public.girls_myths (language, claim, verdict, explanation, keywords) VALUES
('en','You cannot get pregnant the first time you have sex.','false','Pregnancy is possible from the very first time. Always use protection and talk to a health worker.','{pregnancy,first,sex,virgin}'),
('en','Girls should not exercise during their period.','false','Light to moderate exercise is safe and can even ease cramps. Listen to your body and rest if you feel unwell.','{exercise,period,menstrual,sport}'),
('en','Using tampons means you are no longer a virgin.','false','Tampons do not affect virginity. Virginity is a social idea, not a physical state.','{tampon,virgin,virginity}'),
('en','Missing a period always means pregnancy.','misleading','Stress, illness, weight change, and hormones can also cause missed periods. If you are worried, take a test and see a health worker.','{missed,period,pregnancy,late}'),
('fr','On ne peut pas tomber enceinte la première fois.','false','Une grossesse est possible dès la première fois. Utilise une protection et parle à un professionnel de santé.','{grossesse,première,premiere,vierge}'),
('fr','Les filles ne doivent pas faire de sport pendant leurs règles.','false','Une activité physique légère est sans danger et peut soulager les crampes.','{sport,règles,regles,exercice}'),
('fr','Un retard de règles signifie toujours une grossesse.','misleading','Le stress, la maladie, les changements de poids et les hormones peuvent aussi retarder les règles.','{retard,règles,regles,grossesse}');

-- Seed help resources
INSERT INTO public.help_resources (country, category, name, phone, url, notes, language, sort_order) VALUES
('Cameroon','abuse','SOS Filles en Détresse (helpline)','1512',NULL,'Free helpline for girls in distress','fr',1),
('Cameroon','abuse','Girls in Distress Helpline','1512',NULL,'Free helpline for girls in distress','en',1),
(NULL,'mental_health','Trusted adult','',NULL,'Talk to a trusted parent, teacher, aunt, or health worker you know.','en',2),
(NULL,'mental_health','Adulte de confiance','',NULL,'Parle à un parent, un enseignant, une tante ou un professionnel de santé de confiance.','fr',2),
(NULL,'reproductive','Nearest clinic','',NULL,'Use the clinic finder in this app to locate the nearest health center.','en',3),
(NULL,'reproductive','Clinique la plus proche','',NULL,'Utilise le localisateur de cliniques de l''application.','fr',3),
(NULL,'general','UNICEF U-Report',NULL,'https://ureport.in/','Confidential SMS-based support for young people','en',4),
(NULL,'general','UNICEF U-Report',NULL,'https://ureport.in/','Support confidentiel par SMS pour les jeunes','fr',4);
