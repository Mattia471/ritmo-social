import { useEffect, useRef, useState } from 'react';

// Prepared adapter, NOT enabled until the publisher, site, CMP and hosting are approved.
// Ads only appear on the Home and Explore pages. Never on chat/booking/address pages.
type TCFData = { cmpStatus?: string; eventStatus?: string; listenerId?: number; purpose?: { consents?: Record<string, boolean> }; gdprApplies?: boolean };
type TCFCallback = (data: TCFData, success: boolean) => void;
declare global { interface Window { __tcfapi?: (cmd: string, version: number, callback: TCFCallback, parameter?: number) => void; adsbygoogle?: Record<string, unknown>[] } }
const enabled = import.meta.env.VITE_ADS_ENABLED === 'true' && import.meta.env.VITE_ADS_APPROVED === 'true';
const publisher = (import.meta.env.VITE_ADSENSE_CLIENT_ID || '').trim();
const slots = { home: (import.meta.env.VITE_ADSENSE_HOME_SLOT || '').trim(), explore: (import.meta.env.VITE_ADSENSE_EXPLORE_SLOT || '').trim() };
let pendingScript: Promise<void> | null = null;
const loadScript = () => {
  if (pendingScript) return pendingScript;
  pendingScript = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisher}`;
    script.onload = () => resolve(); script.onerror = () => reject(new Error('AdSense non disponibile'));
    document.head.appendChild(script);
  });
  return pendingScript;
};
export function AdSenseSlot({ placement }: { placement: 'home' | 'explore' }) {
  const [consented, setConsented] = useState(false);
  const element = useRef<HTMLModElement>(null);
  const started = useRef(false);
  const slot = slots[placement];
  const configured = enabled && /^ca-pub-\d{16}$/.test(publisher) && /^\d+$/.test(slot);
  useEffect(() => {
    if (!configured || !window.__tcfapi) return;
    let listener: number | undefined;
    window.__tcfapi('addEventListener', 2, (tc, success) => {
      if (!success || !tc) return;
      listener = tc.listenerId;
      // Fail closed. A certified CMP must provide a completed consent decision.
      if (tc.cmpStatus === 'loaded' && ['tcloaded', 'useractioncomplete'].includes(tc.eventStatus ?? '') &&
          tc.purpose?.consents?.['1'] === true && tc.purpose?.consents?.['2'] === true) setConsented(true);
      else setConsented(false);
    });
    return () => { if (listener !== undefined) window.__tcfapi?.('removeEventListener', 2, () => {}, listener); };
  }, [configured]);
  useEffect(() => {
    if (!configured || !consented || !element.current || started.current) return;
    started.current = true;
    void loadScript().then(() => { window.adsbygoogle = window.adsbygoogle || []; window.adsbygoogle.push({}); }).catch(() => { started.current = false; });
  }, [configured, consented]);
  if (!configured || !consented) return null;
  return <aside className={`adsense-slot adsense-slot-${placement}`} aria-label="Pubblicità"><span className="adsense-disclosure">Pubblicità</span>
    <ins ref={element} className="adsbygoogle" style={{display:'block',minHeight:100}} data-ad-client={publisher} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true"/>
  </aside>;
}
