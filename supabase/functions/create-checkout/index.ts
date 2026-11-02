// Supabase Edge Function: checkout dell'abbonamento Organizzatore Plus.
// Richiede autenticazione Supabase. Le chiavi Stripe rimangono SOLTANTO lato server.
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const cors = { 'Access-Control-Allow-Origin': Deno.env.get('APP_URL') || 'http://localhost:5173', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const answer = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return answer({ error: 'Metodo non consentito' },405);
  try {
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return answer({ error: 'Accesso necessario' },401);
    const url = Deno.env.get('SUPABASE_URL')!;
    const key = Deno.env.get('SUPABASE_ANON_KEY')!;
    const adminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('STRIPE_SECRET_KEY')!;
    const priceId = Deno.env.get('STRIPE_PRICE_ID')!;
    const appUrl = Deno.env.get('APP_URL')!;
    if (!url || !key || !adminKey || !apiKey || !priceId || !appUrl) return answer({ error: 'Pagamento non configurato' },503);
    const auth = createClient(url,key,{ auth: { autoRefreshToken:false, persistSession:false } });
    const { data:{user}, error } = await auth.auth.getUser(authHeader.slice(7));
    if (error || !user?.email) return answer({ error: 'Sessione scaduta' },401);
    const admin = createClient(url,adminKey,{ auth:{autoRefreshToken:false,persistSession:false} });
    const { data:sub } = await admin.from('subscriptions').select('plan,status').eq('user_id',user.id).maybeSingle();
    if (sub?.plan === 'organizer_plus' && ['active','trialing'].includes(sub.status)) return answer({ error: 'Abbonamento già attivo' },409);
    const body = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      client_reference_id: user.id,
      customer_email: user.email,
      'metadata[user_id]': user.id,
      'subscription_data[metadata][user_id]': user.id,
      success_url: `${appUrl}/plus?checkout=success`,
      cancel_url: `${appUrl}/plus?checkout=canceled`,
      allow_promotion_codes: 'true',
    });
    const stripe = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/x-www-form-urlencoded'},body,
    });
    const result = await stripe.json();
    if (!stripe.ok || !result.url) return answer({ error: result.error?.message || 'Checkout non disponibile' },502);
    return answer({url:result.url});
  } catch { return answer({error:'Checkout temporaneamente non disponibile'},500); }
});
