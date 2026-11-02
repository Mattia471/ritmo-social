import { ArrowUpRight, Megaphone } from 'lucide-react';
import { AdSenseSlot } from './AdSenseSlot';

// Only direct, clearly labeled, contextual sponsors. No tracking or ad-network scripts.
// Empty configuration intentionally renders nothing until a real sponsor is approved.
const sponsorName = (import.meta.env.VITE_SPONSOR_NAME || '').trim().slice(0, 80);
const sponsorDescription = (import.meta.env.VITE_SPONSOR_DESCRIPTION || '').trim().slice(0, 170);
const rawUrl = (import.meta.env.VITE_SPONSOR_URL || '').trim();
let sponsorUrl: string | null = null;
try {
  const parsed = new URL(rawUrl);
  if (parsed.protocol === 'https:') sponsorUrl = parsed.toString();
} catch { /* Sponsors remain disabled until a valid HTTPS URL is configured. */ }

export function SponsorSlot({ placement }: { placement: 'home' | 'explore' }) {
  if (!sponsorName || !sponsorDescription || !sponsorUrl) return <AdSenseSlot placement={placement}/>;
  return <aside className={`sponsor-slot sponsor-slot-${placement}`} aria-label="Contenuto sponsorizzato">
    <div className="sponsor-heading"><Megaphone size={17}/><span>Sponsorizzato</span></div>
    <div className="sponsor-body"><div><strong>{sponsorName}</strong><p>{sponsorDescription}</p></div>
      <a href={sponsorUrl} target="_blank" rel="noopener noreferrer sponsored nofollow" aria-label={`Scopri lo sponsor ${sponsorName}`}>
        Scopri <ArrowUpRight size={16}/>
      </a>
    </div>
  </aside>;
}
