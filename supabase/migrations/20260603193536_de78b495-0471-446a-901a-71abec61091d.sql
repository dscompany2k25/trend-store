
-- ACCESS LOGS TABLE
CREATE TABLE IF NOT EXISTS public.access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  verdict text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  max_score integer NOT NULL DEFAULT 0,
  ip text,
  country text,
  country_code text,
  region text,
  city text,
  asn text,
  isp text,
  is_datacenter boolean DEFAULT false,
  user_agent text,
  browser text,
  os text,
  device_type text,
  page_path text,
  referer text,
  block_reasons text[] DEFAULT '{}',
  block_categories text[] DEFAULT '{}',
  passed_checks text[] DEFAULT '{}',
  failed_checks text[] DEFAULT '{}',
  signals jsonb DEFAULT '{}'::jsonb,
  headers jsonb DEFAULT '{}'::jsonb
);

GRANT SELECT ON public.access_logs TO authenticated;
GRANT ALL ON public.access_logs TO service_role;

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read access_logs" ON public.access_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS access_logs_created_idx ON public.access_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS access_logs_verdict_idx ON public.access_logs (verdict);
CREATE INDEX IF NOT EXISTS access_logs_ip_idx ON public.access_logs (ip);

-- ACCESS STATS SINGLETON
CREATE TABLE IF NOT EXISTS public.access_stats (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_count bigint NOT NULL DEFAULT 0,
  passed_count bigint NOT NULL DEFAULT 0,
  blocked_count bigint NOT NULL DEFAULT 0,
  datacenter_count bigint NOT NULL DEFAULT 0,
  countries jsonb NOT NULL DEFAULT '{}'::jsonb,
  block_categories jsonb NOT NULL DEFAULT '{}'::jsonb,
  block_reasons jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.access_stats (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON public.access_stats TO authenticated;
GRANT ALL ON public.access_stats TO service_role;

ALTER TABLE public.access_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read access_stats" ON public.access_stats
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- CATEGORIZE REASON
CREATE OR REPLACE FUNCTION public.categorize_reason(reason text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF reason IS NULL THEN RETURN 'other'; END IF;
  reason := lower(reason);
  IF reason LIKE '%datacenter%' OR reason LIKE '%vpn%' OR reason LIKE '%proxy%' OR reason LIKE '%hosting%' OR reason LIKE '%cloud%' THEN RETURN 'datacenter';
  ELSIF reason LIKE '%asn%' THEN RETURN 'asn';
  ELSIF reason LIKE '%header%' OR reason LIKE '%sec-fetch%' OR reason LIKE '%accept%' THEN RETURN 'headers';
  ELSIF reason LIKE '%bot%' OR reason LIKE '%crawler%' OR reason LIKE '%spider%' OR reason LIKE '%scraper%' OR reason LIKE '%facebookexternalhit%' OR reason LIKE '%adsbot%' OR reason LIKE '%googlebot%' THEN RETURN 'ua_bot';
  ELSIF reason LIKE '%mismatch%' OR reason LIKE '%spoof%' OR reason LIKE '%ch-ua%' OR reason LIKE '%platform%' OR reason LIKE '%webgl%' OR reason LIKE '%gpu%' THEN RETURN 'ua_mismatch';
  ELSIF reason LIKE '%gesture%' OR reason LIKE '%touch%' OR reason LIKE '%pointer%' OR reason LIKE '%orientation%' THEN RETURN 'gesture';
  ELSIF reason LIKE '%turnstile%' OR reason LIKE '%captcha%' THEN RETURN 'turnstile';
  ELSIF reason LIKE '%rate%' THEN RETURN 'rate_limit';
  ELSIF reason LIKE '%geo%' OR reason LIKE '%country%' OR reason LIKE '%timezone%' OR reason LIKE '%language%' THEN RETURN 'geo';
  ELSIF reason LIKE '%webdriver%' OR reason LIKE '%automation%' OR reason LIKE '%headless%' OR reason LIKE '%emulator%' OR reason LIKE '%navigator%' OR reason LIKE '%battery%' OR reason LIKE '%vibration%' OR reason LIKE '%dpr%' OR reason LIKE '%screen%' THEN RETURN 'client_signal';
  ELSE RETURN 'other';
  END IF;
END;
$$;

-- PROCESS ACCESS LOG TRIGGER
CREATE OR REPLACE FUNCTION public.process_access_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cur_countries jsonb;
  cur_cats jsonb;
  cur_reasons jsonb;
  cat text;
  rsn text;
  cnt bigint;
  ckey text;
BEGIN
  SELECT countries, block_categories, block_reasons INTO cur_countries, cur_cats, cur_reasons FROM public.access_stats WHERE id = 1 FOR UPDATE;

  IF NEW.country_code IS NOT NULL AND NEW.country_code <> '' THEN
    ckey := NEW.country_code;
    cur_countries := jsonb_set(cur_countries, ARRAY[ckey], to_jsonb(COALESCE((cur_countries->>ckey)::bigint, 0) + 1));
  END IF;

  IF NEW.verdict = 'blocked' THEN
    FOREACH cat IN ARRAY COALESCE(NEW.block_categories, ARRAY[]::text[]) LOOP
      cur_cats := jsonb_set(cur_cats, ARRAY[cat], to_jsonb(COALESCE((cur_cats->>cat)::bigint, 0) + 1));
    END LOOP;
    FOREACH rsn IN ARRAY COALESCE(NEW.block_reasons, ARRAY[]::text[]) LOOP
      cur_reasons := jsonb_set(cur_reasons, ARRAY[rsn], to_jsonb(COALESCE((cur_reasons->>rsn)::bigint, 0) + 1));
    END LOOP;
  END IF;

  UPDATE public.access_stats
  SET total_count = total_count + 1,
      passed_count = passed_count + CASE WHEN NEW.verdict = 'passed' THEN 1 ELSE 0 END,
      blocked_count = blocked_count + CASE WHEN NEW.verdict = 'blocked' THEN 1 ELSE 0 END,
      datacenter_count = datacenter_count + CASE WHEN NEW.is_datacenter THEN 1 ELSE 0 END,
      countries = cur_countries,
      block_categories = cur_cats,
      block_reasons = cur_reasons,
      updated_at = now()
  WHERE id = 1;

  -- prune
  SELECT count(*) INTO cnt FROM public.access_logs;
  IF cnt > 500 THEN
    DELETE FROM public.access_logs WHERE id IN (
      SELECT id FROM public.access_logs ORDER BY created_at DESC OFFSET 100
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_process_access_log ON public.access_logs;
CREATE TRIGGER trg_process_access_log
AFTER INSERT ON public.access_logs
FOR EACH ROW EXECUTE FUNCTION public.process_access_log();

-- enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.access_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.access_stats;
