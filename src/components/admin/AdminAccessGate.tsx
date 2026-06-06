import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ShieldCheck, ShieldX, Server, Globe, Search, Smartphone, Monitor } from "lucide-react";

type Log = any;
type Stats = {
  total_count: number; passed_count: number; blocked_count: number; datacenter_count: number;
  countries: Record<string, number>; block_categories: Record<string, number>; block_reasons: Record<string, number>;
};

const PAGE_SIZE = 50;

const CATEGORY_COLORS: Record<string, string> = {
  datacenter: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  asn: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  headers: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  ua_bot: "bg-red-500/15 text-red-700 border-red-500/30",
  ua_mismatch: "bg-pink-500/15 text-pink-700 border-pink-500/30",
  gesture: "bg-purple-500/15 text-purple-700 border-purple-500/30",
  turnstile: "bg-cyan-500/15 text-cyan-700 border-cyan-500/30",
  rate_limit: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  geo: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  client_signal: "bg-indigo-500/15 text-indigo-700 border-indigo-500/30",
  other: "bg-muted text-muted-foreground border-border",
};

function categorize(reason: string): string {
  const r = (reason || "").toLowerCase();
  if (/datacenter|vpn|proxy|hosting|cloud/.test(r)) return "datacenter";
  if (r.includes("asn")) return "asn";
  if (/header|sec-fetch|accept/.test(r)) return "headers";
  if (/bot|crawler|spider|scraper|facebookexternalhit|adsbot|googlebot/.test(r)) return "ua_bot";
  if (/mismatch|spoof|ch-ua|platform|webgl|gpu/.test(r)) return "ua_mismatch";
  if (/gesture|touch|pointer|orientation/.test(r)) return "gesture";
  if (/turnstile|captcha/.test(r)) return "turnstile";
  if (r.includes("rate")) return "rate_limit";
  if (/geo|country|timezone|language/.test(r)) return "geo";
  if (/webdriver|automation|headless|emulator|navigator|battery|vibration|dpr|screen/.test(r)) return "client_signal";
  return "other";
}

function flag(cc?: string) {
  if (!cc || cc.length !== 2) return "🌐";
  const A = 0x1F1E6;
  return String.fromCodePoint(A + cc.charCodeAt(0) - 65) + String.fromCodePoint(A + cc.charCodeAt(1) - 65);
}

const COUNTRY_NAMES: Record<string, string> = { ES: "Spain", PT: "Portugal", BR: "Brazil", US: "United States", FR: "France", DE: "Germany", GB: "United Kingdom", IT: "Italy", NL: "Netherlands", CA: "Canada" };

function ReasonBadge({ reason, fromServer }: { reason: string; fromServer?: boolean }) {
  const cat = categorize(reason);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border ${CATEGORY_COLORS[cat]}`}>
      {fromServer && <span className="opacity-60">[SERVER]</span>}
      <span className="font-mono">{reason}</span>
    </span>
  );
}

export default function AdminAccessGate() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [page, setPage] = useState(0);
  const [verdict, setVerdict] = useState<"all" | "passed" | "blocked">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Log | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    const { data } = await supabase.from("access_stats").select("*").eq("id", 1).maybeSingle();
    if (data) setStats(data as Stats);
  };

  const loadLogs = async () => {
    setLoading(true);
    let q = supabase.from("access_logs").select("*").order("created_at", { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (verdict !== "all") q = q.eq("verdict", verdict);
    const { data } = await q;
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { loadLogs(); }, [page, verdict]);

  useEffect(() => {
    const ch = supabase.channel("access_admin_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "access_logs" }, () => { if (page === 0) loadLogs(); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "access_stats" }, () => loadStats())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [page, verdict]);

  const filtered = useMemo(() => {
    if (!search) return logs;
    const s = search.toLowerCase();
    return logs.filter(l =>
      [l.ip, l.country, l.city, l.isp, l.user_agent, l.browser, l.os, ...(l.block_reasons || [])]
        .filter(Boolean).some((v: string) => String(v).toLowerCase().includes(s))
    );
  }, [logs, search]);

  const passRate = stats && stats.total_count > 0 ? ((stats.passed_count / stats.total_count) * 100).toFixed(1) : "0.0";

  const topCountries = useMemo(() => {
    if (!stats?.countries) return [];
    return Object.entries(stats.countries).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 6);
  }, [stats]);

  const topReasons = useMemo(() => {
    if (!stats?.block_reasons) return [];
    return Object.entries(stats.block_reasons).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 6);
  }, [stats]);

  const blocksByCat = useMemo(() => {
    if (!stats?.block_categories) return [];
    return Object.entries(stats.block_categories).sort((a, b) => Number(b[1]) - Number(a[1]));
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Access Gate</h2>
          <p className="text-xs text-muted-foreground">Real-time monitoring of /blog gate · cumulative all-time stats</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => { loadStats(); loadLogs(); }}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI label="Total" value={stats?.total_count ?? 0} />
        <KPI label="Passed" value={stats?.passed_count ?? 0} className="text-emerald-600" icon={<ShieldCheck className="h-4 w-4" />} />
        <KPI label="Blocked" value={stats?.blocked_count ?? 0} className="text-red-600" icon={<ShieldX className="h-4 w-4" />} />
        <KPI label="Datacenter IP" value={stats?.datacenter_count ?? 0} className="text-amber-600" icon={<Server className="h-4 w-4" />} />
        <KPI label="Pass rate" value={`${passRate}%`} icon={<Globe className="h-4 w-4" />} />
      </div>

      {/* Insights */}
      <div className="grid md:grid-cols-3 gap-3">
        <Panel title="Blocks by category">
          {blocksByCat.length === 0 ? <Empty /> : blocksByCat.map(([cat, n]) => (
            <Row key={cat}>
              <span className={`px-2 py-0.5 rounded text-[11px] border ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.other}`}>{cat}</span>
              <span className="font-mono text-sm">{String(n)}</span>
            </Row>
          ))}
        </Panel>
        <Panel title="Top specific reasons">
          {topReasons.length === 0 ? <Empty /> : topReasons.map(([r, n]) => (
            <Row key={r}><span className="text-xs font-mono truncate">{r}</span><span className="font-mono text-sm">{String(n)}</span></Row>
          ))}
        </Panel>
        <Panel title="Top countries">
          {topCountries.length === 0 ? <Empty /> : topCountries.map(([cc, n]) => (
            <Row key={cc}>
              <span className="text-sm">{flag(cc)} {COUNTRY_NAMES[cc] || cc} <span className="text-muted-foreground">({cc})</span></span>
              <span className="font-mono text-sm">{String(n)}</span>
            </Row>
          ))}
        </Panel>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex border rounded overflow-hidden">
          {(["all", "passed", "blocked"] as const).map(v => (
            <button key={v} onClick={() => { setVerdict(v); setPage(0); }}
              className={`px-3 py-1 text-xs ${verdict === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{v}</button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search IP, country, city, ISP, UA, reason…" value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-8 text-xs" />
        </div>
      </div>

      {/* Logs table */}
      <div className="border rounded overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-2 py-2">When</th>
              <th className="px-2 py-2">Verdict</th>
              <th className="px-2 py-2">IP</th>
              <th className="px-2 py-2">Location</th>
              <th className="px-2 py-2">Device</th>
              <th className="px-2 py-2">Browser</th>
              <th className="px-2 py-2">Score</th>
              <th className="px-2 py-2">Reasons</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">No logs.</td></tr>}
            {filtered.map(l => {
              const reasons: string[] = l.block_reasons || [];
              return (
                <tr key={l.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(l)}>
                  <td className="px-2 py-2 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="px-2 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${l.verdict === 'passed' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' : 'bg-red-500/15 text-red-700 border-red-500/30'}`}>{l.verdict}</span>
                  </td>
                  <td className="px-2 py-2 font-mono">{l.ip || "—"} {l.is_datacenter && <span title="datacenter">⚠</span>}</td>
                  <td className="px-2 py-2">{flag(l.country_code)} {l.city || "—"}, {l.country_code || "?"}</td>
                  <td className="px-2 py-2">{l.device_type === "mobile" ? <Smartphone className="inline h-3 w-3" /> : <Monitor className="inline h-3 w-3" />} {l.os}</td>
                  <td className="px-2 py-2">{l.browser}</td>
                  <td className="px-2 py-2 font-mono">{l.score}/{l.max_score}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      {reasons.slice(0, 3).map(r => <ReasonBadge key={r} reason={r} fromServer />)}
                      {reasons.length > 3 && <span className="text-[10px] text-muted-foreground">+{reasons.length - 3}</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {filtered.length} on page {page + 1} · cumulative all-time: {stats?.total_count ?? 0}</span>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Prev</Button>
          <Button size="sm" variant="outline" disabled={logs.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && <Drawer log={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function KPI({ label, value, className = "", icon }: { label: string; value: any; className?: string; icon?: React.ReactNode }) {
  return (
    <div className="border rounded p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">{icon}{label}</div>
      <div className={`text-2xl font-bold mt-1 ${className}`}>{value}</div>
    </div>
  );
}

function Panel({ title, children }: any) {
  return (
    <div className="border rounded p-3">
      <div className="text-xs font-semibold mb-2">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function Row({ children }: any) { return <div className="flex items-center justify-between gap-2">{children}</div>; }
function Empty() { return <div className="text-xs text-muted-foreground">No data yet.</div>; }

function Drawer({ log, onClose }: { log: Log; onClose: () => void }) {
  const s = log.signals || {};
  const h = log.headers || {};
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-2xl bg-background h-full overflow-y-auto p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Access log detail</h3>
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
        </div>

        <Section title="Verdict">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${log.verdict === 'passed' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' : 'bg-red-500/15 text-red-700 border-red-500/30'}`}>{log.verdict}</span>
            <span className="text-xs font-mono">{log.score}/{log.max_score}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {(log.block_reasons || []).map((r: string) => <ReasonBadge key={r} reason={r} fromServer />)}
          </div>
        </Section>

        <Section title="Network">
          <KV k="IP" v={log.ip} />
          <KV k="Country" v={`${flag(log.country_code)} ${log.country || "?"} (${log.country_code || "?"})`} />
          <KV k="Region" v={log.region} />
          <KV k="City" v={log.city} />
          <KV k="ASN" v={log.asn} />
          <KV k="ISP" v={log.isp} />
          <KV k="Datacenter" v={String(!!log.is_datacenter)} />
          <KV k="Connection" v={`${s.connectionType || "?"} / ${s.effectiveType || "?"}`} />
        </Section>

        <Section title="HTTP Headers">
          {Object.entries(h).map(([k, v]) => <KV key={k} k={k} v={String(v)} />)}
          <KV k="Page Path" v={log.page_path} />
        </Section>

        <Section title="Device & Hardware">
          <KV k="Browser" v={log.browser} />
          <KV k="OS" v={log.os} />
          <KV k="Device type" v={log.device_type} />
          <KV k="Platform" v={s.platform} />
          <KV k="UA-Data platform" v={s.uaDataPlatform} />
          <KV k="hardwareConcurrency" v={s.hardwareConcurrency} />
          <KV k="deviceMemory (GB)" v={s.deviceMemory} />
          <KV k="DPR" v={s.devicePixelRatio} />
          <KV k="Screen" v={`${s.screenWidth}×${s.screenHeight}`} />
          <KV k="Window" v={`${s.windowInnerWidth}×${s.windowInnerHeight}`} />
          <KV k="Timezone" v={s.timezone} />
          <KV k="Languages" v={(s.languages || []).join(", ")} />
        </Section>

        <Section title="GPU (WebGL)">
          <KV k="Vendor" v={s.webglVendor} />
          <KV k="Renderer" v={s.webglRenderer} />
        </Section>

        <Section title="Mobile Signals">
          <KV k="pointer:coarse" v={String(!!s.pointerCoarse)} />
          <KV k="hover:none" v={String(!!s.hoverNone)} />
          <KV k="touch" v={String(!!s.touchEvent)} />
          <KV k="maxTouchPoints" v={s.maxTouchPoints} />
          <KV k="UA-Data mobile" v={String(s.uaDataMobile)} />
          <KV k="Orientation API" v={String(!!s.orientationApi)} />
          <KV k="Battery API" v={String(!!s.batteryApi)} />
          <KV k="Vibration API" v={String(!!s.vibrationApi)} />
          <KV k="Safe-area inset" v={String(!!s.safeAreaInset)} />
          <KV k="In iframe" v={String(!!s.inIframe)} />
          <KV k="Emulator hint" v={String(!!s.emulatorMatch)} />
          <KV k="navigator spoofed" v={String(!!s.navigatorSpoofed)} />
          <KV k="webdriver" v={String(!!s.webdriver)} />
          <KV k="automation props" v={String(!!s.automationProps)} />
          <KV k="headless" v={String(!!s.headless)} />
        </Section>

        <Section title="Checks Breakdown">
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <div className="font-semibold text-emerald-600 mb-1">Passed</div>
              {(log.passed_checks || []).map((c: string) => <div key={c} className="font-mono">✓ {c}</div>)}
            </div>
            <div>
              <div className="font-semibold text-red-600 mb-1">Failed</div>
              {(log.failed_checks || []).map((c: string) => <div key={c} className="font-mono">✗ {c}</div>)}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="border rounded p-3">
      <div className="text-xs font-bold mb-2 uppercase tracking-wider">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function KV({ k, v }: { k: string; v: any }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-2 text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono break-all">{v ?? "—"}</span>
    </div>
  );
}