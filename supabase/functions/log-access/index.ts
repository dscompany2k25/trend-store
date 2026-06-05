import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ALLOWED_COUNTRIES = new Set(['ES', 'PT', 'BR']);

const DATACENTER_KEYWORDS = [
  'aws','amazon','ec2','google cloud','gcp','azure','microsoft','ovh','hetzner','digitalocean','linode','vultr','scaleway','cloudflare','fastly','akamai','leaseweb','contabo','choopa','m247','datacamp','oracle cloud','alibaba','tencent',
  'mullvad','nordvpn','expressvpn','surfshark','protonvpn','private internet access','pia','cyberghost','ipvanish','windscribe','tunnelbear','vyprvpn','hidemyass','purevpn','hide.me','perfect privacy','tor','relay',
  'bright data','luminati','oxylabs','smartproxy','iproyal','soax','netnut','packetstream','geosurf','rayobyte','webshare','zenrows','scrapingbee','datacenter','hosting','colocation',
];

const BANNED_ASNS = new Set([
  'AS14061','AS16509','AS14618','AS15169','AS396982','AS8075','AS8068','AS16276','AS24940','AS20473','AS63949','AS13335','AS54113','AS20940','AS31898','AS45102','AS132203','AS136907','AS9009','AS51852','AS62240','AS46844','AS35916','AS399471','AS395092','AS19994','AS3356','AS62567','AS200651','AS49981','AS60068','AS212238','AS22612','AS49453','AS9370','AS197540','AS51167',
]);

const BOT_PATTERNS = [
  'bot','crawler','spider','scrape','headlesschrome','phantomjs','puppeteer','playwright','selenium','webdriver','curl/','wget/','python-requests','python/','node-fetch','okhttp','go-http-client','java/','libwww','lwp::','ruby','axios/',
  'facebookexternalhit','facebookcatalog','facebot','meta-externalagent','meta-externalfetcher','adsbot-google','mediapartners-google','google-read-aloud','google-adwords','googlebot','apis-google','bingbot','bingpreview','adidxbot','yandexbot','duckduckbot','applebot','twitterbot','linkedinbot','whatsapp','telegrambot','slackbot','discordbot','pinterest','redditbot','ia_archiver','ahrefsbot','semrushbot','mj12bot','dotbot','petalbot','bytespider','gptbot','ccbot','claudebot','perplexitybot','amazonbot','headless','electron',
];

function categorize(reason: string): string {
  const r = reason.toLowerCase();
  if (/datacenter|vpn|proxy|hosting|cloud/.test(r)) return 'datacenter';
  if (r.includes('asn')) return 'asn';
  if (/header|sec-fetch|accept/.test(r)) return 'headers';
  if (/bot|crawler|spider|scraper|facebookexternalhit|adsbot|googlebot/.test(r)) return 'ua_bot';
  if (/mismatch|spoof|ch-ua|platform|webgl|gpu|device_gpu/.test(r)) return 'ua_mismatch';
  if (/gesture|touch|pointer|orientation/.test(r)) return 'gesture';
  if (/turnstile|captcha/.test(r)) return 'turnstile';
  if (r.includes('rate')) return 'rate_limit';
  if (/geo|country|timezone|language/.test(r)) return 'geo';
  if (/webdriver|automation|headless|emulator|navigator|battery|vibration|dpr|screen/.test(r)) return 'client_signal';
  return 'other';
}

async function fetchWithTimeout(url: string, ms = 3000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function fetchGeo(ip: string): Promise<any> {
  const providers = [
    async () => {
      const d = await fetchWithTimeout(`https://ipapi.co/${ip}/json/`);
      // Rate-limit or error responses have d.error=true and no country_code — reject so Promise.any tries next
      if (!d.country_code || d.error) throw new Error('ipapi.co: no data');
      return { country: d.country_name, country_code: d.country_code, region: d.region, city: d.city, asn: d.asn, isp: d.org };
    },
    async () => {
      const d = await fetchWithTimeout(`https://ipwho.is/${ip}`);
      if (!d.country_code || !d.success) throw new Error('ipwho.is: no data');
      return { country: d.country, country_code: d.country_code, region: d.region, city: d.city, asn: d.connection?.asn ? `AS${d.connection.asn}` : '', isp: d.connection?.isp || d.connection?.org };
    },
    async () => {
      const d = await fetchWithTimeout(`https://api.ipapi.is/?q=${ip}`);
      if (!d.location?.country_code) throw new Error('ipapi.is: no data');
      return { country: d.location?.country, country_code: d.location?.country_code, region: d.location?.state, city: d.location?.city, asn: d.asn?.asn ? `AS${d.asn.asn}` : '', isp: d.asn?.org || d.company?.name };
    },
  ];
  try {
    return await Promise.any(providers.map(p => p()));
  } catch {
    return {};
  }
}

function parseUA(ua: string) {
  const u = ua.toLowerCase();
  let browser = 'Unknown', os = 'Unknown', device_type = 'desktop';
  if (u.includes('edg/')) browser = 'Edge';
  else if (u.includes('chrome/')) browser = 'Chrome';
  else if (u.includes('firefox/')) browser = 'Firefox';
  else if (u.includes('safari/')) browser = 'Safari';
  if (u.includes('iphone') || u.includes('ipad')) { os = 'iOS'; device_type = 'mobile'; }
  else if (u.includes('android')) { os = 'Android'; device_type = 'mobile'; }
  else if (u.includes('mac os')) os = 'macOS';
  else if (u.includes('windows')) os = 'Windows';
  else if (u.includes('linux')) os = 'Linux';
  return { browser, os, device_type };
}

// in-memory rate limiter (best-effort per instance)
const rateMap = new Map<string, number[]>();
function checkRate(ip: string): boolean {
  const now = Date.now();
  const arr = (rateMap.get(ip) || []).filter(t => now - t < 60000);
  arr.push(now);
  rateMap.set(ip, arr);
  return arr.length > 30; // 30 req/min — previous 15 was too aggressive for shared IPs
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const signals = body.signals || {};
    const clientPassed = !!body.isRealMobile;

    const h = req.headers;
    const ua = h.get('user-agent') || '';
    const acceptLang = h.get('accept-language') || '';
    const accept = h.get('accept') || '';
    const secChUaMobile = h.get('sec-ch-ua-mobile') || '';
    const secChUaPlatform = (h.get('sec-ch-ua-platform') || '').replace(/"/g, '');
    const secFetchMode = h.get('sec-fetch-mode') || '';
    const secFetchDest = h.get('sec-fetch-dest') || '';
    const secFetchSite = h.get('sec-fetch-site') || '';
    const referer = h.get('referer') || '';
    const cfCountry = h.get('cf-ipcountry') || h.get('x-vercel-ip-country') || '';
    const ip = (h.get('cf-connecting-ip') || h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || '').trim();

    const reasons: string[] = [];
    const passedChecks: string[] = [];
    const failedChecks: string[] = [];

    // headers
    if (!ua) { reasons.push('header_missing_user_agent'); failedChecks.push('ua_present'); } else passedChecks.push('ua_present');
    // Accept-Language: log absence but don't block — Brave/Firefox privacy mode and iOS Private Relay strip this
    if (!acceptLang) { failedChecks.push('accept_language_missing'); } else passedChecks.push('accept_language');
    if (!accept) failedChecks.push('accept_header'); else passedChecks.push('accept_header');

    // Sec-Fetch: iOS Safari and Samsung Internet don't send these — only block clearly wrong values, not absence
    if (!secFetchMode && !secFetchDest && !secFetchSite) {
      failedChecks.push('sec_fetch_missing'); // log only, not a block reason
    } else {
      if (secFetchMode && !['cors','no-cors','navigate','same-origin'].includes(secFetchMode)) reasons.push(`header_bad_sec_fetch_mode:${secFetchMode}`);
      if (secFetchDest && !['empty','document','iframe','frame'].includes(secFetchDest)) reasons.push(`header_bad_sec_fetch_dest:${secFetchDest}`);
      if (secFetchSite && !['cross-site','same-site','same-origin','none'].includes(secFetchSite)) reasons.push(`header_bad_sec_fetch_site:${secFetchSite}`);
      passedChecks.push('sec_fetch');
    }

    // bot UA
    const uaLower = ua.toLowerCase();
    const botMatch = BOT_PATTERNS.find(p => uaLower.includes(p));
    if (botMatch) { reasons.push(`ua_bot:${botMatch}`); failedChecks.push('ua_not_bot'); } else passedChecks.push('ua_not_bot');

    // geo
    let geo: any = {};
    if (ip) geo = await fetchGeo(ip);
    if (!geo.country_code && cfCountry) geo.country_code = cfCountry;

    // Fix: ISPs like DIGI Romania operate physically in PT/ES but IPs are registered
    // under the Romanian parent company — geo databases return country_code:'RO'.
    // Use the client timezone as ground truth to correct the country.
    // Real Romanian bots would have Europe/Bucharest timezone, not Europe/Lisbon/Madrid.
    const clientTz = String(signals.timezone || '');
    if (geo.country_code && !ALLOWED_COUNTRIES.has(geo.country_code) && clientTz) {
      if (/^(Europe\/Lisbon|Atlantic\/Azores|Atlantic\/Madeira)$/.test(clientTz)) {
        geo.country_code = 'PT';
      } else if (/^(Europe\/Madrid|Atlantic\/Canary|Africa\/Ceuta)$/.test(clientTz)) {
        geo.country_code = 'ES';
      } else if (/^America\//.test(clientTz)) {
        geo.country_code = 'BR';
      }
    }

    if (!geo.country_code) {
      // Geo lookup completely failed (all providers down/rate limited) — log but don't block
      failedChecks.push('geo_unknown_country');
    } else if (!ALLOWED_COUNTRIES.has(geo.country_code)) {
      reasons.push(`geo_country_not_allowed:${geo.country_code}`);
      failedChecks.push('geo_country');
    } else passedChecks.push('geo_country');

    // datacenter / ASN
    const isp = (geo.isp || '').toLowerCase();
    const dcKw = DATACENTER_KEYWORDS.find(k => isp.includes(k));
    const isDatacenter = !!dcKw;
    if (dcKw) { reasons.push(`datacenter_isp:${dcKw}`); failedChecks.push('residential_ip'); } else passedChecks.push('residential_ip');
    if (geo.asn && BANNED_ASNS.has(geo.asn)) { reasons.push(`asn_banned:${geo.asn}`); failedChecks.push('asn_allowed'); } else passedChecks.push('asn_allowed');

    // rate limit
    if (ip && checkRate(ip)) reasons.push('rate_limit_exceeded');

    // UA-CH mismatches
    const isIosUA = /iphone|ipad|ipod/.test(uaLower);
    const isAndroidUA = uaLower.includes('android');
    const isMobileUA = isIosUA || isAndroidUA || /mobile/.test(uaLower);
    if (secChUaMobile === '?1' && !isMobileUA) reasons.push('ch_ua_mobile_mismatch_true');
    if (secChUaMobile === '?0' && isMobileUA) reasons.push('ch_ua_mobile_mismatch_false');
    if (secChUaPlatform) {
      if (isIosUA && secChUaPlatform.toLowerCase() !== 'ios') reasons.push(`ch_ua_platform_mismatch:${secChUaPlatform}`);
      if (isAndroidUA && secChUaPlatform.toLowerCase() !== 'android') reasons.push(`ch_ua_platform_mismatch:${secChUaPlatform}`);
    }

    // navigator.platform vs UA
    const navPlatform = (signals.platform || '').toLowerCase();
    if (isIosUA && navPlatform && !/iphone|ipad|ipod|mac/.test(navPlatform)) reasons.push(`platform_mismatch_ios:${navPlatform}`);
    if (isAndroidUA && /iphone|ipad|ipod/.test(navPlatform)) reasons.push(`platform_mismatch_android:${navPlatform}`);

    // WebGL vs UA
    // iOS intentionally restricts WebGL GPU info — empty renderer is expected on Safari, not a spoof signal
    const renderer = (signals.webglRenderer || '').toLowerCase();
    if (isIosUA && renderer && /swiftshader|llvmpipe|angle-d3d|intel hd|nvidia geforce|radeon/.test(renderer)) reasons.push(`webgl_ios_desktop_gpu:${renderer}`);
    if (isAndroidUA && /intel|nvidia|radeon|swiftshader|llvmpipe|angle-d3d/.test(renderer)) reasons.push(`webgl_gpu_desktop:${renderer}`);

    // Device brand (UA) vs GPU family (WebGL) coherence — catches device spoofing
    let brand: string | null = null;
    if (/huawei|honor|nam-al00|-al00|-tl00|-l29|-lx[0-9]|hma-|eml-|ana-|els-|nova/i.test(ua)) brand = 'huawei';
    else if (isIosUA) brand = 'apple';
    else if (/samsung|sm-|gt-|sc-0/i.test(ua)) brand = 'samsung';
    else if (/xiaomi|redmi|poco|\bmi /i.test(ua)) brand = 'xiaomi';
    else if (/pixel/i.test(ua)) brand = 'pixel';
    else if (/oneplus|oppo|cph|realme|rmx|vivo/i.test(ua)) brand = 'bbk';

    let gpuFamily = 'unknown';
    if (!renderer) gpuFamily = 'empty';
    else if (/swiftshader|llvmpipe|angle-d3d|intel|nvidia geforce|radeon/.test(renderer)) gpuFamily = 'desktop';
    else if (/adreno/.test(renderer)) gpuFamily = 'adreno';
    else if (/mali/.test(renderer)) gpuFamily = 'mali';
    else if (/powervr/.test(renderer)) gpuFamily = 'powervr';
    else if (/apple/.test(renderer)) gpuFamily = 'apple';
    else if (/tegra/.test(renderer)) gpuFamily = 'tegra';
    else if (/generic/.test(renderer)) gpuFamily = 'generic';

    if (brand === 'huawei' && gpuFamily === 'adreno') {
      reasons.push(`device_gpu_mismatch:huawei_adreno:${renderer}`);
    }
    // iOS hides GPU info by design (privacy) — empty/generic is normal for Safari, not a block signal
    // Only Android should have GPU info; if Android has generic/desktop GPU it's likely an emulator
    if (isAndroidUA && gpuFamily === 'generic') {
      reasons.push('device_gpu_mismatch:android_generic_gpu');
    }
    if (isMobileUA && gpuFamily === 'desktop') {
      reasons.push(`device_gpu_mismatch:mobile_desktop_gpu:${renderer}`);
    }
    // iOS: only flag if there IS a renderer and it's explicitly a desktop GPU (clear spoof)
    if (isIosUA && renderer && gpuFamily === 'desktop') {
      reasons.push(`device_gpu_mismatch:ios_desktop_gpu:${renderer}`);
    }

    // screen vs UA
    const sw = Number(signals.screenWidth || 0);
    const ww = Number(signals.windowInnerWidth || 0);
    const dpr = Number(signals.devicePixelRatio || 0);
    if (isMobileUA) {
      if (ww && sw && (ww > sw * 1.5 || Math.abs(ww - sw) > 200)) reasons.push('emulator_screen_window_diff');
      if (dpr && dpr < 1.0) reasons.push('mobile_low_dpr'); // < 1.0 only — budget Androids (DPR 1.3-1.4) are real devices
    }

    // timezone vs country
    const tz = String(signals.timezone || '');
    const langs: string[] = [
      ...(acceptLang ? acceptLang.toLowerCase().split(',').map(s => s.split(';')[0].trim()) : []),
      ...((signals.languages || []) as string[]).map(s => String(s).toLowerCase()),
    ];
    if (!tz || tz === 'UTC' || tz === 'GMT' || tz === 'Etc/UTC') reasons.push(`timezone_invalid:${tz}`);
    else if (geo.country_code === 'ES' && !/^(Europe\/Madrid|Atlantic\/Canary|Africa\/Ceuta)$/.test(tz)) reasons.push(`timezone_country_mismatch_ES:${tz}`);
    else if (geo.country_code === 'PT' && !/^(Europe\/Lisbon|Atlantic\/Azores|Atlantic\/Madeira)$/.test(tz)) reasons.push(`timezone_country_mismatch_PT:${tz}`);
    else if (geo.country_code === 'BR' && !/^America\//.test(tz)) reasons.push(`timezone_country_mismatch_BR:${tz}`);

    // language vs country — only check if we have language data (privacy browsers strip Accept-Language)
    const hasLang = (prefixes: string[]) => langs.some(l => prefixes.some(p => l.startsWith(p)));
    if (langs.length > 0) {
      if (geo.country_code === 'ES' && !hasLang(['es','ca','gl','eu','en'])) reasons.push('lang_country_mismatch:ES');
      if (geo.country_code === 'PT' && !hasLang(['pt','en'])) reasons.push('lang_country_mismatch:PT');
      if (geo.country_code === 'BR' && !hasLang(['pt','en'])) reasons.push('lang_country_mismatch:BR');
    }

    // iOS impossibles
    if (isIosUA && signals.batteryApi) reasons.push('ios_impossible_battery_api');
    if (isIosUA && signals.vibrationApi) reasons.push('ios_impossible_vibration_api');

    // automation
    if (signals.webdriver) reasons.push('automation_webdriver');
    if (signals.automationProps) reasons.push('automation_cdp_props');
    if (signals.headless) reasons.push('headless_signals');

    // final verdict — calculated before DB insert so it's not affected by insert failures
    const serverBlocked = reasons.length > 0;
    const verdict = (!serverBlocked && clientPassed) ? 'passed' : 'blocked';

    const categories = Array.from(new Set(reasons.map(categorize)));
    const { browser, os, device_type } = parseUA(ua);
    const maxScore = (signals.maxScore as number) || 0;
    const score = (signals.score as number) || 0;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fire-and-forget the DB insert — response is returned immediately without waiting
    // Deno Deploy settles background promises after the response is sent
    supabase.from('access_logs').insert({
      verdict,
      score,
      max_score: maxScore,
      ip,
      country: geo.country || null,
      country_code: geo.country_code || null,
      region: geo.region || null,
      city: geo.city || null,
      asn: geo.asn || null,
      isp: geo.isp || null,
      is_datacenter: isDatacenter,
      user_agent: ua,
      browser,
      os,
      device_type,
      page_path: body.path || '/blog',
      referer,
      block_reasons: reasons,
      block_categories: categories,
      passed_checks: [...passedChecks, ...(signals.passedChecks || [])],
      failed_checks: [...failedChecks, ...(signals.failedChecks || [])],
      signals,
      headers: {
        'user-agent': ua,
        'accept-language': acceptLang,
        'accept': accept,
        'sec-ch-ua-mobile': secChUaMobile,
        'sec-ch-ua-platform': secChUaPlatform,
        'sec-fetch-mode': secFetchMode,
        'sec-fetch-dest': secFetchDest,
        'sec-fetch-site': secFetchSite,
        'referer': referer,
      },
    }).then(() => {}).catch((e: any) => console.error('access_logs insert failed:', e.message));

    return new Response(JSON.stringify({ verdict, reasons, categories }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('log-access unhandled error:', e.message);
    // Do NOT return verdict:"blocked" on internal errors — that would block real users
    // Return the client-passed signal so BlogPage can use its own fallback
    return new Response(JSON.stringify({ verdict: 'error', error: e.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});