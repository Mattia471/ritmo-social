import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import * as webpush from "jsr:@negrel/webpush@0.5.0";

type VapidKeys = webpush.ExportedVapidKeys;
type WorkerConfig = { hook: string; keys: VapidKeys | null };
const projectUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const admin = createClient(projectUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Content-Type": "application/json",
};
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: cors });
async function getConfig(): Promise<WorkerConfig> {
  const { data, error } = await admin.rpc("push_worker_config");
  if (error || !data?.hook) throw new Error("Push worker config unavailable");
  return data as WorkerConfig;
}
async function getOrCreateVapid(config: WorkerConfig): Promise<VapidKeys> {
  if (config.keys) return config.keys;
  const pair = await webpush.generateVapidKeys({ extractable: true });
  const generated = await webpush.exportVapidKeys(pair);
  const { error } = await admin.rpc("initialize_push_vapid", { p_keys: generated });
  if (error) throw error;
  const current = await getConfig(); // Atomic DB initializer wins any simultaneous race.
  if (!current.keys) throw new Error("Failed to initialize VAPID keys");
  return current.keys;
}
function isApprovedPushEndpoint(raw: unknown): raw is string {
  if (typeof raw !== "string" || raw.length > 2048) return false;
  try {
    const uri = new URL(raw);
    if (uri.protocol !== "https:" || uri.username || uri.password || uri.port) return false;
    const host = uri.hostname.toLowerCase();
    return host === "fcm.googleapis.com"
      || host === "updates.push.services.mozilla.com"
      || host.endsWith(".push.services.mozilla.com")
      || host === "web.push.apple.com"
      || host.endsWith(".push.apple.com")
      || host.endsWith(".notify.windows.com")
      || host === "wns2-pn1p.notify.windows.com";
  } catch { return false; }
}
async function deliver(notificationId: string, config: WorkerConfig) {
  const { data: notification, error: notifError } = await admin.from("user_notifications")
    .select("id,user_id,title,body,target_path,kind").eq("id", notificationId).maybeSingle();
  if (notifError) throw notifError;
  if (!notification) return { sent: 0, reason: "Notification not found" };
  const { data: prefs, error: prefError } = await admin.from("notification_preferences")
    .select("push_enabled").eq("user_id", notification.user_id).maybeSingle();
  if (prefError) throw prefError;
  if (!prefs?.push_enabled) return { sent: 0, reason: "Push disabled" };
  const { data: subscriptions, error: subsError } = await admin.from("push_subscriptions")
    .select("id,endpoint,p256dh,auth").eq("user_id", notification.user_id).limit(30);
  if (subsError) throw subsError;
  if (!subscriptions?.length) return { sent: 0, reason: "No subscribed devices" };
  const vapidKeys = await getOrCreateVapid(config);
  const keys = await webpush.importVapidKeys(vapidKeys, { extractable: false });
  const server = await webpush.ApplicationServer.new({
    contactInformation: "https://ritmo-social-theta.vercel.app",
    vapidKeys: keys,
  });
  let sent = 0;
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.target_path,
    tag: "ritmo-" + notification.id,
    kind: notification.kind,
  });
  for (const sub of subscriptions) {
    // Never make arbitrary outbound requests from a client-supplied endpoint.
    if (!isApprovedPushEndpoint(sub.endpoint)) continue;
    try {
      await server.subscribe({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }).pushTextMessage(payload, { ttl: 86400 });
      sent++;
    } catch (error) {
      const responseStatus = (error as { response?: { status?: number } })?.response?.status;
      // Dead browser subscriptions should not cause perpetual delivery failures.
      if (responseStatus === 404 || responseStatus === 410) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        console.error("Push service delivery rejected", { status: responseStatus ?? "unknown" });
      }
    }
  }
  return { sent, eligible: subscriptions.length };
}
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!projectUrl || !serviceKey) return json({ error: "Server not configured" }, 503);
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return json({ error: "Invalid request" }, 400); }
  try {
    const config = await getConfig();
    if (body.kind === "public-key") {
      const keys = await getOrCreateVapid(config);
      const imported = await webpush.importVapidKeys(keys, { extractable: false });
      const publicKey = await webpush.exportApplicationServerKey(imported);
      return json({ publicKey });
    }
    if (body.kind !== "deliver" || typeof body.notificationId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.notificationId)) {
      return json({ error: "Unsupported operation" }, 400);
    }
    // This token is generated and encrypted by Supabase Vault, never sent to browsers.
    const supplied = request.headers.get("x-ritmo-hook");
    if (!supplied || supplied.length !== config.hook.length) return json({ error: "Forbidden" }, 403);
    let mismatch = 0;
    for (let i = 0; i < supplied.length; i++) mismatch |= supplied.charCodeAt(i) ^ config.hook.charCodeAt(i);
    if (mismatch) return json({ error: "Forbidden" }, 403);
    const result = await deliver(body.notificationId, config);
    return json(result);
  } catch (error) {
    console.error("Web Push worker failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "Delivery unavailable" }, 503);
  }
});
