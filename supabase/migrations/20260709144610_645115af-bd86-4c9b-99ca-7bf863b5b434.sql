
-- Extend clinics with services and whatsapp
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS services text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Seed a starter set of Cameroon clinics
INSERT INTO public.clinics (name, type, region, city, address, lat, lng, phone, whatsapp, hours, services, verified, source, notes) VALUES
('Yaoundé Central Hospital', 'public', 'Centre', 'Yaoundé', 'Rue Henri Dunant, Yaoundé', 3.8667, 11.5167, '+237222234040', NULL, '24/7', ARRAY['antenatal','delivery','emergency','family_planning'], true, 'MoH Cameroon', 'Public referral hospital'),
('Hôpital Gynéco-Obstétrique et Pédiatrique de Yaoundé', 'public', 'Centre', 'Yaoundé', 'Ngousso, Yaoundé', 3.8894, 11.5300, '+237222212525', NULL, '24/7', ARRAY['antenatal','delivery','emergency','adolescent_health'], true, 'MoH Cameroon', 'Specialised maternity'),
('Hôpital Général de Douala', 'public', 'Littoral', 'Douala', 'Rue de l''Hôpital, Douala', 4.0511, 9.7679, '+237233371010', NULL, '24/7', ARRAY['antenatal','delivery','emergency'], true, 'MoH Cameroon', NULL),
('Hôpital Laquintinie de Douala', 'public', 'Littoral', 'Douala', 'Akwa, Douala', 4.0400, 9.7050, '+237233422080', NULL, '24/7', ARRAY['antenatal','delivery','emergency','family_planning'], true, 'MoH Cameroon', NULL),
('Bamenda Regional Hospital', 'public', 'Nord-Ouest', 'Bamenda', 'Hospital Roundabout, Bamenda', 5.9631, 10.1591, '+237233361137', NULL, '24/7', ARRAY['antenatal','delivery','emergency'], true, 'MoH Cameroon', NULL),
('Buea Regional Hospital', 'public', 'Sud-Ouest', 'Buea', 'Great Soppo, Buea', 4.1554, 9.2920, '+237233322208', NULL, '24/7', ARRAY['antenatal','delivery','emergency'], true, 'MoH Cameroon', NULL),
('Garoua Regional Hospital', 'public', 'Nord', 'Garoua', 'Avenue Ahmadou Ahidjo, Garoua', 9.3017, 13.3921, '+237222271025', NULL, '24/7', ARRAY['antenatal','delivery','emergency'], true, 'MoH Cameroon', NULL),
('Maroua Regional Hospital', 'public', 'Extrême-Nord', 'Maroua', 'Domayo, Maroua', 10.5910, 14.3159, '+237222291025', NULL, '24/7', ARRAY['antenatal','delivery','emergency','family_planning'], true, 'MoH Cameroon', NULL),
('Ngaoundéré Regional Hospital', 'public', 'Adamaoua', 'Ngaoundéré', 'Baladji, Ngaoundéré', 7.3167, 13.5833, '+237222251025', NULL, '24/7', ARRAY['antenatal','delivery','emergency'], true, 'MoH Cameroon', NULL),
('Bafoussam Regional Hospital', 'public', 'Ouest', 'Bafoussam', 'Kamkop, Bafoussam', 5.4781, 10.4177, '+237233441025', NULL, '24/7', ARRAY['antenatal','delivery','emergency'], true, 'MoH Cameroon', NULL),
('Ebolowa Regional Hospital', 'public', 'Sud', 'Ebolowa', 'Angalé, Ebolowa', 2.9000, 11.1500, '+237222281025', NULL, '24/7', ARRAY['antenatal','delivery','emergency'], true, 'MoH Cameroon', NULL),
('Bertoua Regional Hospital', 'public', 'Est', 'Bertoua', 'Nkolbikon, Bertoua', 4.5833, 13.6833, '+237222241025', NULL, '24/7', ARRAY['antenatal','delivery','emergency'], true, 'MoH Cameroon', NULL),
('Cameroon Baptist Convention Health Services - Mbingo', 'confessional', 'Nord-Ouest', 'Mbingo', 'Mbingo, Boyo', 6.2333, 10.2833, '+237677000000', NULL, '24/7', ARRAY['antenatal','delivery','emergency','family_planning'], true, 'CBCHS', 'Confessional hospital'),
('Hôpital Ad Lucem de Banka', 'confessional', 'Ouest', 'Banka', 'Banka, Bafang', 5.1500, 10.1833, '+237233401025', NULL, '08:00–18:00', ARRAY['antenatal','delivery','family_planning'], true, 'Ad Lucem', NULL),
('Efoulan District Hospital', 'public', 'Centre', 'Yaoundé', 'Efoulan, Yaoundé', 3.8420, 11.4990, '+237222310000', NULL, '24/7', ARRAY['antenatal','delivery','family_planning','adolescent_health'], true, 'MoH Cameroon', NULL),
('Deido District Hospital', 'public', 'Littoral', 'Douala', 'Deido, Douala', 4.0662, 9.7042, '+237233420000', NULL, '24/7', ARRAY['antenatal','delivery','family_planning'], true, 'MoH Cameroon', NULL),
('Nkwen Baptist Health Centre', 'confessional', 'Nord-Ouest', 'Bamenda', 'Nkwen, Bamenda', 5.9856, 10.1889, '+237677000001', NULL, '08:00–20:00', ARRAY['antenatal','family_planning','adolescent_health'], true, 'CBCHS', NULL),
('Limbe Regional Hospital', 'public', 'Sud-Ouest', 'Limbe', 'Down Beach, Limbe', 4.0186, 9.2149, '+237233332025', NULL, '24/7', ARRAY['antenatal','delivery','emergency'], true, 'MoH Cameroon', NULL),
('Kumba District Hospital', 'public', 'Sud-Ouest', 'Kumba', 'Fiango, Kumba', 4.6363, 9.4469, '+237233352025', NULL, '24/7', ARRAY['antenatal','delivery'], true, 'MoH Cameroon', NULL),
('Kribi District Hospital', 'public', 'Sud', 'Kribi', 'Centre-ville, Kribi', 2.9366, 9.9098, '+237222462025', NULL, '24/7', ARRAY['antenatal','delivery','family_planning'], true, 'MoH Cameroon', NULL)
ON CONFLICT DO NOTHING;

-- pgvector for FAQ
CREATE EXTENSION IF NOT EXISTS vector;

-- Pregnancy FAQ corpus
CREATE TABLE public.faq_pregnancy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  question_variants text[] NOT NULL,
  verified_answer_en text NOT NULL,
  who_source text NOT NULL,
  danger_sign_flag boolean NOT NULL DEFAULT false,
  local_referral text,
  translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  translations_reviewed jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faq_pregnancy TO anon, authenticated;
GRANT ALL ON public.faq_pregnancy TO service_role;
ALTER TABLE public.faq_pregnancy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faq_pregnancy_public_read" ON public.faq_pregnancy FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER faq_pregnancy_updated_at BEFORE UPDATE ON public.faq_pregnancy FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX faq_pregnancy_embedding_idx ON public.faq_pregnancy USING hnsw (embedding vector_cosine_ops);

-- Girls FAQ corpus (separate table — never merged)
CREATE TABLE public.faq_girls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  question_variants text[] NOT NULL,
  verified_answer_en text NOT NULL,
  who_source text NOT NULL,
  danger_sign_flag boolean NOT NULL DEFAULT false,
  local_referral text,
  translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  translations_reviewed jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faq_girls TO anon, authenticated;
GRANT ALL ON public.faq_girls TO service_role;
ALTER TABLE public.faq_girls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faq_girls_public_read" ON public.faq_girls FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER faq_girls_updated_at BEFORE UPDATE ON public.faq_girls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX faq_girls_embedding_idx ON public.faq_girls USING hnsw (embedding vector_cosine_ops);

-- Unanswered questions log
CREATE TABLE public.faq_unanswered (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  corpus text NOT NULL CHECK (corpus IN ('pregnancy','girls')),
  question_text text NOT NULL,
  language public.app_language NOT NULL DEFAULT 'en',
  top_score numeric,
  top_match_slug text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.faq_unanswered TO authenticated;
GRANT INSERT ON public.faq_unanswered TO anon;
GRANT ALL ON public.faq_unanswered TO service_role;
ALTER TABLE public.faq_unanswered ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faq_unanswered_insert_any" ON public.faq_unanswered
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "faq_unanswered_select_own" ON public.faq_unanswered
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Match functions (one per corpus, keeps corpora fully separate)
CREATE OR REPLACE FUNCTION public.match_faq_pregnancy(query_embedding vector(1536))
RETURNS TABLE (
  slug text,
  verified_answer_en text,
  who_source text,
  danger_sign_flag boolean,
  local_referral text,
  translations jsonb,
  translations_reviewed jsonb,
  similarity float
)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT f.slug, f.verified_answer_en, f.who_source, f.danger_sign_flag,
         f.local_referral, f.translations, f.translations_reviewed,
         1 - (f.embedding <=> query_embedding) AS similarity
  FROM public.faq_pregnancy f
  WHERE f.embedding IS NOT NULL
  ORDER BY f.embedding <=> query_embedding
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.match_faq_girls(query_embedding vector(1536))
RETURNS TABLE (
  slug text,
  verified_answer_en text,
  who_source text,
  danger_sign_flag boolean,
  local_referral text,
  translations jsonb,
  translations_reviewed jsonb,
  similarity float
)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT f.slug, f.verified_answer_en, f.who_source, f.danger_sign_flag,
         f.local_referral, f.translations, f.translations_reviewed,
         1 - (f.embedding <=> query_embedding) AS similarity
  FROM public.faq_girls f
  WHERE f.embedding IS NOT NULL
  ORDER BY f.embedding <=> query_embedding
  LIMIT 1;
$$;

-- Seed Pregnancy FAQ (English answers; translations reviewed for fr+en only)
INSERT INTO public.faq_pregnancy (slug, question_variants, verified_answer_en, who_source, danger_sign_flag, local_referral, translations, translations_reviewed) VALUES
('anc-visits', ARRAY['how many antenatal visits','how often should I see the doctor during pregnancy','number of ANC visits','combien de visites prénatales'],
 'WHO recommends at least 8 antenatal care contacts during pregnancy: one in the first trimester, two in the second, and five in the third. Regular visits help detect problems early.',
 'WHO 2016 Antenatal Care Guideline', false, 'Visit your nearest maternity or health centre.',
 '{"en":"WHO recommends at least 8 antenatal care contacts during pregnancy: one in the first trimester, two in the second, and five in the third. Regular visits help detect problems early.","fr":"L''OMS recommande au moins 8 consultations prénatales pendant la grossesse : une au premier trimestre, deux au deuxième et cinq au troisième. Des visites régulières aident à détecter les problèmes tôt."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('folic-acid', ARRAY['should I take folic acid','folate during pregnancy','vitamins in pregnancy','acide folique grossesse'],
 'Take 400 micrograms of folic acid daily, ideally starting before conception and through the first trimester. It reduces the risk of neural tube defects in the baby.',
 'WHO Nutrition Guidance', false, 'Ask your ANC clinic for iron and folic acid supplements.',
 '{"en":"Take 400 micrograms of folic acid daily, ideally starting before conception and through the first trimester. It reduces the risk of neural tube defects in the baby.","fr":"Prenez 400 microgrammes d''acide folique par jour, idéalement avant la conception et pendant le premier trimestre. Cela réduit le risque de malformations du tube neural."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('bleeding-pregnancy', ARRAY['vaginal bleeding pregnancy','I am bleeding while pregnant','saignement pendant la grossesse','blood coming out pregnant'],
 'Any vaginal bleeding during pregnancy is a danger sign. Go to a health facility immediately, especially if the bleeding is heavy or comes with pain.',
 'WHO Pregnancy Danger Signs', true, 'Go to the nearest maternity now, or call 119 (SAMU Cameroon).',
 '{"en":"Any vaginal bleeding during pregnancy is a danger sign. Go to a health facility immediately, especially if the bleeding is heavy or comes with pain.","fr":"Tout saignement vaginal pendant la grossesse est un signe de danger. Rendez-vous immédiatement dans un centre de santé, surtout si le saignement est abondant ou accompagné de douleurs."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('severe-headache', ARRAY['severe headache pregnancy','bad headache and blurred vision pregnant','mal de tête grossesse','preeclampsia signs'],
 'A severe headache with blurred vision or swelling of the face and hands can be a sign of pre-eclampsia, a serious pregnancy complication. Seek care today.',
 'WHO Pregnancy Danger Signs', true, 'Go to a health facility today for a blood pressure and urine check.',
 '{"en":"A severe headache with blurred vision or swelling of the face and hands can be a sign of pre-eclampsia, a serious pregnancy complication. Seek care today.","fr":"Un mal de tête sévère avec vision floue ou gonflement du visage et des mains peut être un signe de pré-éclampsie, une complication grave. Consultez aujourd''hui même."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('fetal-movements', ARRAY['baby not moving','reduced fetal movements','my baby moves less','le bébé ne bouge plus'],
 'From about 28 weeks, your baby should move regularly. If you notice a clear decrease in movements over a few hours, go to the health facility for a check-up.',
 'WHO Pregnancy Danger Signs', true, 'Go to your maternity for fetal heart monitoring.',
 '{"en":"From about 28 weeks, your baby should move regularly. If you notice a clear decrease in movements over a few hours, go to the health facility for a check-up.","fr":"À partir d''environ 28 semaines, le bébé doit bouger régulièrement. Si vous remarquez une nette diminution des mouvements sur quelques heures, rendez-vous à la maternité pour un contrôle."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('nausea-early', ARRAY['morning sickness','nausea in early pregnancy','vomiting first trimester','nausée grossesse'],
 'Nausea and vomiting are common in the first trimester and usually improve after 12–16 weeks. Eat small meals, drink fluids, and rest. If you cannot keep anything down for a day, see your clinic.',
 'WHO 2016 Antenatal Care Guideline', false, 'If severe, visit your ANC clinic — you may need rehydration.',
 '{"en":"Nausea and vomiting are common in the first trimester and usually improve after 12–16 weeks. Eat small meals, drink fluids, and rest. If you cannot keep anything down for a day, see your clinic.","fr":"Les nausées et vomissements sont fréquents au premier trimestre et s''améliorent souvent après 12 à 16 semaines. Mangez peu à la fois, buvez et reposez-vous. Si vous ne gardez rien pendant une journée, consultez votre centre de santé."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('safe-medicines', ARRAY['what medicines are safe in pregnancy','can I take paracetamol pregnant','médicaments enceinte'],
 'Do not take any medicine without checking with a health worker. Paracetamol is generally considered safe in the recommended dose. Avoid ibuprofen and traditional herbal remedies unless a health worker approves them.',
 'WHO Safer Pregnancy Guidance', false, 'Ask a nurse or pharmacist before taking any new medicine.',
 '{"en":"Do not take any medicine without checking with a health worker. Paracetamol is generally considered safe in the recommended dose. Avoid ibuprofen and traditional herbal remedies unless a health worker approves them.","fr":"Ne prenez aucun médicament sans avis d''un professionnel de santé. Le paracétamol est généralement considéré comme sûr à la dose recommandée. Évitez l''ibuprofène et les remèdes traditionnels sauf accord d''un soignant."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('tetanus-vaccine', ARRAY['tetanus shot pregnancy','vaccine during pregnancy','vaccin tétanos grossesse'],
 'Tetanus toxoid vaccination during pregnancy protects both mother and newborn against tetanus. Your ANC clinic will give it according to the national schedule.',
 'WHO Immunization in Pregnancy', false, 'Get the tetanus vaccine at your ANC visit.',
 '{"en":"Tetanus toxoid vaccination during pregnancy protects both mother and newborn against tetanus. Your ANC clinic will give it according to the national schedule.","fr":"La vaccination antitétanique pendant la grossesse protège la mère et le nouveau-né. Votre centre prénatal l''administre selon le calendrier national."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('water-broke', ARRAY['my water broke','water broke before labor','waters broken before contractions','perte des eaux'],
 'If your waters break before labour starts (before 37 weeks, or even at term without contractions), go to the health facility right away. There is a risk of infection.',
 'WHO Intrapartum Care Guideline', true, 'Go to a maternity now.',
 '{"en":"If your waters break before labour starts (before 37 weeks, or even at term without contractions), go to the health facility right away. There is a risk of infection.","fr":"Si vous perdez les eaux avant le travail (avant 37 semaines, ou à terme sans contractions), rendez-vous immédiatement à la maternité. Il y a un risque d''infection."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('signs-of-labor', ARRAY['am I in labor','signs of labor','contractions','le travail commence'],
 'Signs of labour include regular painful contractions that get stronger and closer together, a "show" of mucus, or your waters breaking. Go to the maternity when contractions are strong every 5 minutes.',
 'WHO Intrapartum Care Guideline', false, 'Go to your maternity when contractions are strong every 5 minutes.',
 '{"en":"Signs of labour include regular painful contractions that get stronger and closer together, a \"show\" of mucus, or your waters breaking. Go to the maternity when contractions are strong every 5 minutes.","fr":"Les signes du travail : contractions douloureuses régulières de plus en plus rapprochées, perte du bouchon muqueux, perte des eaux. Rendez-vous à la maternité quand les contractions fortes surviennent toutes les 5 minutes."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb)
;

-- Seed Girls FAQ
INSERT INTO public.faq_girls (slug, question_variants, verified_answer_en, who_source, danger_sign_flag, local_referral, translations, translations_reviewed) VALUES
('period-normal-length', ARRAY['how long should my period last','normal period length','durée règles','how many days is a period'],
 'A normal period usually lasts between 3 and 7 days. Cycles can be irregular in the first few years after they start. If bleeding is very heavy or lasts longer than 8 days, talk to a health worker.',
 'WHO Adolescent Health', false, 'Talk to a nurse at your health centre if worried.',
 '{"en":"A normal period usually lasts between 3 and 7 days. Cycles can be irregular in the first few years after they start. If bleeding is very heavy or lasts longer than 8 days, talk to a health worker.","fr":"Les règles durent normalement entre 3 et 7 jours. Les cycles peuvent être irréguliers pendant les premières années. Si le saignement est très abondant ou dure plus de 8 jours, parlez à un professionnel de santé."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('first-time-pregnancy', ARRAY['can you get pregnant the first time','pregnancy first sex','tomber enceinte première fois'],
 'Yes. It is possible to become pregnant the very first time you have vaginal sex, if no contraception is used. Any unprotected sex during your fertile days can lead to pregnancy.',
 'WHO Reproductive Health', false, 'Ask a health worker about contraception options at your health centre.',
 '{"en":"Yes. It is possible to become pregnant the very first time you have vaginal sex, if no contraception is used. Any unprotected sex during your fertile days can lead to pregnancy.","fr":"Oui. Il est possible de tomber enceinte dès la première fois si aucun moyen de contraception n''est utilisé. Toute relation non protégée pendant les jours fertiles peut entraîner une grossesse."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('period-pain', ARRAY['my period hurts','painful periods','cramps during period','règles douloureuses'],
 'Some pain and cramps during periods are common. Warmth on your belly, gentle movement, and paracetamol can help. If the pain stops you from going to school or work, see a health worker.',
 'WHO Adolescent Health', false, 'Visit a health centre if pain is severe.',
 '{"en":"Some pain and cramps during periods are common. Warmth on your belly, gentle movement, and paracetamol can help. If the pain stops you from going to school or work, see a health worker.","fr":"Des douleurs et crampes pendant les règles sont fréquentes. La chaleur sur le ventre, des mouvements doux et le paracétamol peuvent aider. Si la douleur vous empêche d''aller à l''école ou au travail, consultez un professionnel."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('contraception-options', ARRAY['what contraception can I use','birth control options','moyens de contraception'],
 'There are many safe contraception options: condoms, the pill, injections, implants, and IUDs. Only condoms also protect against sexually transmitted infections. A health worker can help you choose what fits you best.',
 'WHO Family Planning Guidance', false, 'Ask at a youth-friendly health centre.',
 '{"en":"There are many safe contraception options: condoms, the pill, injections, implants, and IUDs. Only condoms also protect against sexually transmitted infections. A health worker can help you choose what fits you best.","fr":"Il existe plusieurs contraceptifs sûrs : préservatifs, pilule, injections, implants, DIU. Seuls les préservatifs protègent aussi des infections sexuellement transmissibles. Un professionnel peut vous aider à choisir."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('unsafe-touch', ARRAY['someone touched me without permission','I was forced','sexual abuse','on m''a forcée'],
 'You did nothing wrong. What happened is not your fault. Please tell a trusted adult, or contact a helpline for confidential support. If you are in danger right now, go to the nearest police station or hospital.',
 'WHO Violence Against Women & Girls', true, 'Call 1500 (Cameroon child protection) or go to the nearest hospital.',
 '{"en":"You did nothing wrong. What happened is not your fault. Please tell a trusted adult, or contact a helpline for confidential support. If you are in danger right now, go to the nearest police station or hospital.","fr":"Vous n''avez rien fait de mal. Ce qui s''est passé n''est pas de votre faute. Parlez à un adulte de confiance ou appelez une ligne d''écoute. Si vous êtes en danger, allez au commissariat ou à l''hôpital le plus proche."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('missed-period', ARRAY['I missed my period','late period','no period this month','règles en retard'],
 'A missed period can happen because of stress, weight change, illness, or pregnancy. If you have had unprotected sex, take a pregnancy test at a health centre. A nurse can also help figure out other causes.',
 'WHO Adolescent Health', false, 'Visit a health centre for a pregnancy test if unsure.',
 '{"en":"A missed period can happen because of stress, weight change, illness, or pregnancy. If you have had unprotected sex, take a pregnancy test at a health centre. A nurse can also help figure out other causes.","fr":"Un retard de règles peut être dû au stress, à un changement de poids, à une maladie ou à une grossesse. En cas de rapport non protégé, faites un test de grossesse au centre de santé."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('sti-signs', ARRAY['signs of STI','unusual discharge','burning when peeing','infection sexuellement transmissible'],
 'Unusual discharge, itching, sores, or burning when peeing may be signs of a sexually transmitted infection. STIs are treatable — go to a health centre. Do not use antibiotics without a prescription.',
 'WHO STI Guidelines', false, 'Visit a youth-friendly clinic for confidential testing.',
 '{"en":"Unusual discharge, itching, sores, or burning when peeing may be signs of a sexually transmitted infection. STIs are treatable — go to a health centre. Do not use antibiotics without a prescription.","fr":"Des pertes inhabituelles, des démangeaisons, des plaies ou des brûlures en urinant peuvent être des signes d''infection sexuellement transmissible. Les IST se soignent — consultez un centre de santé."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('body-changes', ARRAY['my body is changing','puberty','breasts growing','puberté'],
 'During puberty your body changes: breasts develop, hair grows in new places, and periods begin. Everyone changes at their own pace — usually between ages 8 and 16. This is normal and healthy.',
 'WHO Adolescent Health', false, NULL,
 '{"en":"During puberty your body changes: breasts develop, hair grows in new places, and periods begin. Everyone changes at their own pace — usually between ages 8 and 16. This is normal and healthy.","fr":"Pendant la puberté, le corps change : la poitrine se développe, des poils apparaissent, et les règles commencent. Chaque personne évolue à son rythme — généralement entre 8 et 16 ans. C''est normal et sain."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('feeling-sad', ARRAY['I feel very sad','depressed teenager','thoughts of hurting myself','pensées suicidaires'],
 'Feelings of sadness or hopelessness are real and deserve care. Please talk to someone you trust today. If you are thinking of hurting yourself, call a helpline right now — you are not alone.',
 'WHO Mental Health', true, 'Call 1510 (mental health support Cameroon) or go to the nearest hospital.',
 '{"en":"Feelings of sadness or hopelessness are real and deserve care. Please talk to someone you trust today. If you are thinking of hurting yourself, call a helpline right now — you are not alone.","fr":"La tristesse ou le désespoir sont des sentiments réels qui méritent de l''attention. Parlez à quelqu''un de confiance aujourd''hui. Si vous pensez à vous faire du mal, appelez une ligne d''écoute maintenant — vous n''êtes pas seule."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb),
('hygiene-periods', ARRAY['how to stay clean during period','menstrual hygiene','pads or cups','hygiène règles'],
 'Change pads or cloths every 4–6 hours. Wash with clean water and soap. Both disposable pads and clean reusable cloths work — the key is changing them often. Menstruation is normal and clean.',
 'WHO Menstrual Health', false, NULL,
 '{"en":"Change pads or cloths every 4–6 hours. Wash with clean water and soap. Both disposable pads and clean reusable cloths work — the key is changing them often. Menstruation is normal and clean.","fr":"Changez de serviette ou de tissu toutes les 4 à 6 heures. Lavez-vous avec de l''eau propre et du savon. Serviettes jetables ou tissus lavables propres conviennent — l''important est de changer souvent. Les règles sont normales et saines."}'::jsonb,
 '{"en":true,"fr":true}'::jsonb)
;
