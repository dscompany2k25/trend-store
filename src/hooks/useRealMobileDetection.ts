// Client-side real-mobile detection. Returns signals + verdict.

export interface DetectionResult {
  isRealMobile: boolean;
  score: number;
  maxScore: number;
  passedChecks: string[];
  failedChecks: string[];
  signals: Record<string, any>;
}

const EMULATOR_REGEX = /sdk_gphone|google_sdk|emulator|android sdk built for x86|genymotion|bluestacks|nox|ldplayer|memu/i;

const LANG_TZ_MAP: Record<string, string[]> = {
  'es-es': ['Europe/Madrid', 'Atlantic/Canary', 'Africa/Ceuta'],
  'ca-es': ['Europe/Madrid', 'Atlantic/Canary', 'Africa/Ceuta'],
  'gl-es': ['Europe/Madrid', 'Atlantic/Canary', 'Africa/Ceuta'],
  'eu-es': ['Europe/Madrid', 'Atlantic/Canary', 'Africa/Ceuta'],
  'pt-pt': ['Europe/Lisbon', 'Atlantic/Azores', 'Atlantic/Madeira'],
  'pt-br': [], // any America/*
};

function detectAutomation(): { webdriver: boolean; automationProps: boolean } {
  const w = window as any;
  const props = ['cdc_', '$cdc_', '__webdriver_', '__selenium_', '__nightmare', '_phantom', 'callPhantom', 'domAutomation', 'domAutomationController'];
  const has = props.some(p => Object.keys(w).some(k => k.startsWith(p))) || !!w.domAutomation || !!w.callPhantom;
  return { webdriver: !!navigator.webdriver, automationProps: has };
}

function detectHeadless(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  const isChromeUA = ua.includes('chrome');
  const noPlugins = navigator.plugins && navigator.plugins.length === 0 && !/mobile|android|iphone/.test(ua);
  const noChrome = isChromeUA && !(window as any).chrome;
  const noLangs = !navigator.languages || navigator.languages.length === 0;
  return noPlugins || noChrome || noLangs || /headless|electron/.test(ua);
}

function getWebGL(): { vendor: string; renderer: string } {
  try {
    const c = document.createElement('canvas');
    const gl: any = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!gl) return { vendor: '', renderer: '' };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return { vendor: '', renderer: '' };
    return {
      vendor: String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || ''),
      renderer: String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || ''),
    };
  } catch { return { vendor: '', renderer: '' }; }
}

function safeAreaInset(): boolean {
  try {
    const d = document.createElement('div');
    d.style.paddingTop = 'env(safe-area-inset-top)';
    document.body.appendChild(d);
    const val = parseInt(getComputedStyle(d).paddingTop, 10) || 0;
    document.body.removeChild(d);
    return val > 0;
  } catch { return false; }
}

function navigatorSpoofed(): boolean {
  try {
    const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(navigator), 'userAgent');
    const src = desc?.get?.toString() || '';
    return src.length > 0 && !src.includes('[native code]');
  } catch { return false; }
}

export function collectSignals(): Record<string, any> {
  const ua = navigator.userAgent;
  const uaData = (navigator as any).userAgentData;
  const webgl = getWebGL();
  const conn = (navigator as any).connection || {};
  const automation = detectAutomation();
  const sw = window.screen.width;
  const sh = window.screen.height;
  const ww = window.innerWidth;
  const wh = window.innerHeight;

  return {
    userAgent: ua,
    uaDataMobile: uaData?.mobile ?? null,
    uaDataPlatform: uaData?.platform ?? null,
    uaDataBrands: uaData?.brands ?? null,
    platform: (navigator as any).platform || '',
    pointerCoarse: matchMedia('(pointer: coarse)').matches,
    hoverNone: matchMedia('(hover: none)').matches,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    touchEvent: 'ontouchstart' in window,
    screenWidth: sw,
    screenHeight: sh,
    windowInnerWidth: ww,
    windowInnerHeight: wh,
    devicePixelRatio: window.devicePixelRatio,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory || 0,
    batteryApi: !!(navigator as any).getBattery,
    vibrationApi: !!navigator.vibrate,
    orientationApi: 'orientation' in window || !!(window as any).screen?.orientation,
    connectionType: conn.type || '',
    effectiveType: conn.effectiveType || '',
    saveData: conn.saveData || false,
    webglVendor: webgl.vendor,
    webglRenderer: webgl.renderer,
    safeAreaInset: safeAreaInset(),
    navigatorSpoofed: navigatorSpoofed(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    languages: navigator.languages ? Array.from(navigator.languages) : [navigator.language],
    webdriver: automation.webdriver,
    automationProps: automation.automationProps,
    headless: detectHeadless(),
    emulatorMatch: EMULATOR_REGEX.test(ua),
    inIframe: window.top !== window.self,
  };
}

export function evaluateDetection(): DetectionResult {
  const s = collectSignals();
  const ua = s.userAgent.toLowerCase();
  const passed: string[] = [];
  const failed: string[] = [];

  // 6 critical
  const criticals: Array<[string, boolean]> = [
    ['coarse_pointer', s.pointerCoarse],
    ['touch_screen', s.touchEvent || s.maxTouchPoints > 0],
    ['ua_mobile', /mobile|android|iphone|ipad|ipod/.test(ua) || s.uaDataMobile === true],
    ['not_emulator', !s.emulatorMatch],
    ['not_automated', !s.webdriver && !s.automationProps && !s.navigatorSpoofed && !s.headless],
    ['tz_lang_coherent', tzLangCoherent(s.timezone, s.languages)],
  ];
  let criticalPassed = true;
  for (const [k, v] of criticals) {
    if (v) passed.push(`critical:${k}`);
    else { failed.push(`critical:${k}`); criticalPassed = false; }
  }

  // strong
  const renderer = String(s.webglRenderer || '').toLowerCase();
  const strongs: Array<[string, boolean]> = [
    ['orientation_api', !!s.orientationApi],
    ['small_screen', s.screenWidth <= 500 && s.screenHeight <= 1000],
    ['screen_eq_window', Math.abs(s.screenWidth - s.windowInnerWidth) < 50],
    ['high_dpr', s.devicePixelRatio >= 1.5],
    // iOS Safari intentionally blocks WebGL GPU info — empty renderer on iOS counts as passed
    ['mobile_gpu', /adreno|mali|powervr|apple gpu|tegra/.test(renderer) || (!renderer && /iphone|ipad|ipod/.test(ua))],
    ['notch', !!s.safeAreaInset],
    ['hover_none', !!s.hoverNone],
  ];
  let strongPassed = 0;
  for (const [k, v] of strongs) {
    if (v) { passed.push(`strong:${k}`); strongPassed++; }
    else failed.push(`strong:${k}`);
  }

  // bonus
  const bonuses: Array<[string, boolean]> = [
    ['low_cores', s.hardwareConcurrency > 0 && s.hardwareConcurrency <= 8],
    ['low_memory', s.deviceMemory > 0 && s.deviceMemory <= 8],
    ['mobile_connection', /cellular|2g|3g|4g|5g/.test(String(s.connectionType) + String(s.effectiveType))],
    ['battery_api', !!s.batteryApi],
    ['vibration_api', !!s.vibrationApi],
    ['ua_ch_mobile', s.uaDataMobile === true],
  ];
  let bonusPassed = 0;
  for (const [k, v] of bonuses) {
    if (v) { passed.push(`bonus:${k}`); bonusPassed++; }
    else failed.push(`bonus:${k}`);
  }

  const score = (criticalPassed ? 6 : criticals.filter(c => c[1]).length) + strongPassed + bonusPassed;
  const maxScore = criticals.length + strongs.length + bonuses.length;

  const isRealMobile = criticalPassed && strongPassed >= 2 && (strongPassed + bonusPassed) >= 3;

  return {
    isRealMobile,
    score,
    maxScore,
    passedChecks: passed,
    failedChecks: failed,
    signals: { ...s, score, maxScore, passedChecks: passed, failedChecks: failed },
  };
}

function tzLangCoherent(tz: string, languages: string[]): boolean {
  if (!tz || tz === 'UTC' || tz === 'GMT' || tz === 'Etc/UTC') return false;
  const langs = languages.map(l => l.toLowerCase());
  // Iberian / BR variants
  const isES = langs.some(l => l.startsWith('es') || l.startsWith('ca') || l.startsWith('gl') || l.startsWith('eu'));
  const isPT_PT = langs.some(l => l === 'pt-pt' || l === 'pt' || l.startsWith('pt-pt'));
  const isPT_BR = langs.some(l => l === 'pt-br' || l.startsWith('pt-br'));
  const isEN = langs.some(l => l === 'en' || l.startsWith('en-') || l.startsWith('en'));
  const tzES = /^(Europe\/Madrid|Atlantic\/Canary|Africa\/Ceuta)$/.test(tz);
  const tzPT = /^(Europe\/Lisbon|Atlantic\/Azores|Atlantic\/Madeira)$/.test(tz);
  const tzBR = /^America\//.test(tz);
  const tzAllowed = tzES || tzPT || tzBR;
  if (!tzAllowed) return false;
  if (isES && tzES) return true;
  if (isPT_PT && tzPT) return true;
  if (isPT_BR && tzBR) return true;
  // pt without region — accept Europe/Lisbon or America/*
  if (langs.some(l => l.startsWith('pt')) && (tzPT || tzBR)) return true;
  // English is a neutral/wildcard language inside the allowed TZ set
  if (isEN && tzAllowed) return true;
  return false;
}