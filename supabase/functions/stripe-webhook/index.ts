// Stripe Webhook verificato crittograficamente.
// Configurare su Stripe gli eventi: checkout.session.completed,
// customer.subscription.created, updated, deleted.
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const json = (body: unknown, code=200) => new Response(JSON.stringify(body), {status:code,headers:{'Content-Type':'application/json'}});
const textEncoder = new TextEncoder();
async function verifyStripePayload(raw: string, signature: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(signature.split(',').map(item=>item.split('=')));
  const timestamp = Number(parts.t);
  if (!timestamp || Math.abs(Date.now()/1000-timestamp)>300 || !parts.v1) return false;
  const key = await crypto.subtle.importKey('raw',textEncoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC',key,textEncoder.encode(`${timestamp}.${raw}`)));
  const expected = Array.from(digest).map(b=>b.toString(16).padStart(2,'0')).join('');
  if (expected.length !== parts.v1.length) return false;
  let diff=0;
  for(let i=0;i<expected.length;i++) diff|=expected.charCodeAt(i)^parts.v1.charCodeAt(i);
  return diff===0;
}
Deno.serve(async request=>{
  if (request.method!=='POST') return json({error:'Method not allowed'},405);
  const secret=Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const url=Deno.env.get('SUPABASE_URL');
  const adminKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!secret||!url||!adminKey) return json({error:'Not configured'},503);
  const raw=await request.text();
  if(!await verifyStripePayload(raw,request.headers.get('stripe-signature')||'',secret)) return json({error:'Invalid signature'},400);
  try{
    const evt=JSON.parse(raw);
    const obj=evt.data?.object;
    const db=createClient(url,adminKey,{auth:{persistSession:false,autoRefreshToken:false}});
    if(evt.type==='checkout.session.completed' && obj?.mode==='subscription'){
      const userId=obj.client_reference_id || obj.metadata?.user_id;
      if(userId){
        const {error}=await db.from('subscriptions').upsert({user_id:userId,stripe_customer_id:obj.customer,stripe_subscription_id:obj.subscription,updated_at:new Date().toISOString()},{onConflict:'user_id'});
        if(error) throw error;
      }
    }
    if(['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(evt.type)){
      const userId=obj?.metadata?.user_id;
      if(userId){
        const validStatuses=['active','trialing','past_due','canceled','unpaid'];
        const status=validStatuses.includes(obj.status)?obj.status:'inactive';
        const active=['active','trialing'].includes(status);
        const {error}=await db.from('subscriptions').upsert({
          user_id:userId,plan:active?'organizer_plus':'free',status,
          stripe_customer_id:obj.customer,stripe_subscription_id:obj.id,
          current_period_end:obj.current_period_end ? new Date(obj.current_period_end*1000).toISOString() : null,
          updated_at:new Date().toISOString()
        },{onConflict:'user_id'});
        if(error) throw error;
      }
    }
    return json({received:true});
  }catch{return json({error:'Webhook processing failed'},500);}
});
