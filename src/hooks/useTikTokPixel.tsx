import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TikTokPixelContextType {
  trackEvent: (eventName: string, properties?: Record<string, any>, userData?: Record<string, any>) => void;
  pixelIds: string[];
}

const TikTokPixelContext = createContext<TikTokPixelContextType>({ trackEvent: () => {}, pixelIds: [] });

export function TikTokPixelProvider({ children }: { children: ReactNode }) {
  const [pixelIds, setPixelIds] = useState<string[]>([]);

  useEffect(() => {
    loadPixelSettings();
  }, []);

  const loadPixelSettings = async () => {
    try {
      const { data } = await supabase
        .from('pixel_settings')
        .select('pixel_id, enabled')
        .eq('platform', 'tiktok')
        .eq('enabled', true);

      const ids = (data || []).map(d => d.pixel_id).filter(Boolean);
      if (ids.length > 0) {
        setPixelIds(ids);
        initPixels(ids);
      }
    } catch {}
  };

  const initPixels = (ids: string[]) => {
    // Inject base TikTok pixel snippet only once
    if (!(window as any).ttq) {
      const script = document.createElement('script');
      script.innerHTML = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e+""]=+new Date,ttq._o=ttq._o||{},ttq._o[e+""]=n||{};var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)}}(window,document,"ttq");`;
      document.head.appendChild(script);
    }

    const ttq = (window as any).ttq;
    if (!ttq) return;

    // Load each pixel and trigger pageview per instance
    ids.forEach((id) => {
      try {
        ttq.load(id);
        ttq.instance(id).page();
      } catch {}
    });
  };

  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>, userData?: Record<string, any>) => {
    // Generate a single event_id used by BOTH browser pixel and server event for deduplication
    const eventId = `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const getCookie = (name: string): string => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : '';
    };

    // Client-side tracking — fire on every loaded pixel instance
    const ttq = (window as any).ttq;
    if (ttq && pixelIds.length > 0) {
      const opts = { event_id: eventId };
      pixelIds.forEach((id) => {
        try {
          const inst = ttq.instance(id);
          if (properties) {
            inst.track(eventName, properties, opts);
          } else {
            inst.track(eventName, {}, opts);
          }
        } catch {}
      });
    }

    // Server-side tracking — edge function fans out to all enabled pixels
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    if (projectId) {
      const ttclid = getCookie('ttclid');
      const ttp = getCookie('_ttp');
      fetch(`https://${projectId}.supabase.co/functions/v1/tiktok-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: eventName,
          event_id: eventId,
          event_source_url: window.location.href,
          properties,
          user_data: {
            ...(userData || {}),
            ...(ttclid ? { ttclid } : {}),
            ...(ttp ? { ttp } : {}),
          },
        }),
      }).catch(() => {});
    }
  }, [pixelIds]);

  return (
    <TikTokPixelContext.Provider value={{ trackEvent, pixelIds }}>
      {children}
    </TikTokPixelContext.Provider>
  );
}

export function useTikTokPixel() {
  return useContext(TikTokPixelContext);
}
