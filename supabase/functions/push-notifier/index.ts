import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const raw = atob(str);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLen = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

async function generateVAPIDKeysJwk(): Promise<{ publicKey: string; privateKeyJwk: string }> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign']
  );
  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  const x = base64UrlDecode(publicJwk.x!);
  const y = base64UrlDecode(publicJwk.y!);
  const publicBytes = new Uint8Array(65);
  publicBytes[0] = 0x04;
  publicBytes.set(x, 1);
  publicBytes.set(y, 33);
  return {
    publicKey: base64UrlEncode(publicBytes.buffer),
    privateKeyJwk: JSON.stringify(privateJwk),
  };
}

async function signJWT(claims: Record<string, unknown>, privateKeyJwk: string): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const unsignedToken = `${headerB64}.${payloadB64}`;
  const jwk = JSON.parse(privateKeyJwk);
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sigBuffer = await crypto.subtle.sign({ name: 'ECDSA', hash: { name: 'SHA-256' } }, key, new TextEncoder().encode(unsignedToken));
  const sigBytes = new Uint8Array(sigBuffer);
  // Web Crypto returns raw r||s (64 bytes) for P-256
  const sigB64 = base64UrlEncode(sigBytes.buffer);
  return `${unsignedToken}.${sigB64}`;
}

async function encryptPayload(
  clientPubKeyBytes: Uint8Array,
  clientAuthBytes: Uint8Array,
  payloadStr: string
): Promise<Uint8Array> {
  const serverKeys = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const serverPubJwk = await crypto.subtle.exportKey('jwk', serverKeys.publicKey);
  const sx = base64UrlDecode(serverPubJwk.x!);
  const sy = base64UrlDecode(serverPubJwk.y!);
  const serverPubBytes = new Uint8Array(65);
  serverPubBytes[0] = 0x04;
  serverPubBytes.set(sx, 1);
  serverPubBytes.set(sy, 33);

  const clientPubKey = await crypto.subtle.importKey('raw', clientPubKeyBytes, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: clientPubKey }, serverKeys.privateKey, 256));

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();

  // auth_info = "WebPush: info\0" || client_public || server_public
  const authInfo = concatBytes(enc.encode('WebPush: info\0'), clientPubKeyBytes, serverPubBytes);

  // IKM via HKDF extract+expand using client auth as salt
  const authKey = await crypto.subtle.importKey('raw', clientAuthBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', authKey, sharedSecret));
  const prkKey = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const ikm = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, concatBytes(authInfo, new Uint8Array([1])))).slice(0, 32);

  // Content encryption PRK
  const saltKey = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const cePrk = new Uint8Array(await crypto.subtle.sign('HMAC', saltKey, ikm));
  const cePrkKey = await crypto.subtle.importKey('raw', cePrk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

  // Derive CEK (16 bytes) and nonce (12 bytes)
  const cekInfo = enc.encode('Content-Encoding: aes128gcm\0');
  const nonceInfo = enc.encode('Content-Encoding: nonce\0');
  const cek = new Uint8Array(await crypto.subtle.sign('HMAC', cePrkKey, concatBytes(cekInfo, new Uint8Array([1])))).slice(0, 16);
  const nonce = new Uint8Array(await crypto.subtle.sign('HMAC', cePrkKey, concatBytes(nonceInfo, new Uint8Array([1])))).slice(0, 12);

  // Pad and encrypt (RFC 8188: data || 0x02 delimiter for final record)
  const payloadBytes = enc.encode(payloadStr);
  const paddedPayload = concatBytes(payloadBytes, new Uint8Array([2]));
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, paddedPayload));

  // aes128gcm header: salt(16) || rs(4) || idlen(1) || keyid(65) || ciphertext
  const rs = new DataView(new ArrayBuffer(4));
  rs.setUint32(0, 4096);
  const header = concatBytes(salt, new Uint8Array(rs.buffer), new Uint8Array([65]), serverPubBytes);
  return concatBytes(header, encrypted);
}

async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPub: string,
  vapidPrivJwk: string,
  vapidSubject: string
): Promise<{ ok: boolean; status: number }> {
  const clientPub = base64UrlDecode(sub.p256dh);
  const clientAuth = base64UrlDecode(sub.auth);
  const body = await encryptPayload(clientPub, clientAuth, payload);

  const ep = new URL(sub.endpoint);
  const aud = `${ep.protocol}//${ep.host}`;
  const now = Math.floor(Date.now() / 1000);
  const jwt = await signJWT({ aud, exp: now + 43200, sub: vapidSubject }, vapidPrivJwk);

  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Urgency': 'high',
      'Authorization': `vapid t=${jwt}, k=${vapidPub}`,
    },
    body,
  });
  return { ok: res.ok, status: res.status };
}

// ========================
// MAIN HANDLER
// ========================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    // Get or create VAPID config
    async function getConfig() {
      const { data } = await supabaseAdmin.from('push_config').select('*').limit(1).maybeSingle();
      if (data) return data;
      const keys = await generateVAPIDKeysJwk();
      const { data: c, error } = await supabaseAdmin.from('push_config').insert({
        vapid_public_key: keys.publicKey,
        vapid_private_key: keys.privateKeyJwk,
        vapid_subject: 'mailto:admin@garden-gestao.com',
      }).select().single();
      if (error) throw error;
      return c;
    }

    if (action === 'vapid-key') {
      const config = await getConfig();
      return new Response(JSON.stringify({ publicKey: config.vapid_public_key }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'subscribe') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
      if (userErr || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }
      const userId = user.id;
      const body = await req.json();
      const sub = body.subscription;
      await supabaseAdmin.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      }, { onConflict: 'user_id,endpoint' });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'unsubscribe') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
      if (userErr || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }
      const userId = user.id;
      const { endpoint } = await req.json();
      await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send push to a specific user (triggered by DB webhook or internal call)
    if (action === 'send-push') {
      const body = await req.json();
      console.log('[send-push] Received body:', JSON.stringify(body));
      const { user_id, title, message, url: targetUrl, tag } = body;
      if (!user_id || !title) {
        console.error('[send-push] Missing user_id or title');
        return new Response(JSON.stringify({ error: 'user_id and title required' }), { status: 400, headers: corsHeaders });
      }

      // Determine notification category from tag
      // Support both legacy tag names and direct category names
      let category = 'sistema';
      if (tag?.startsWith('chat-')) category = 'chat';
      else if (tag === 'estoque' || tag === 'zero-stock' || tag === 'low-stock' || tag === 'inv-due') category = 'estoque';
      else if (tag === 'financeiro' || tag === 'bills-due' || tag === 'bills-overdue' || tag === 'neg-balance') category = 'financeiro';
      else if (tag === 'checklist' || tag === 'checklist-pending') category = 'checklist';
      else if (tag === 'caixa' || tag === 'cash-closing') category = 'caixa';
      else if (tag === 'agenda') category = 'agenda';
      else if (tag === 'chat') category = 'chat';

      // Check if user has this category disabled
      const { data: pref } = await supabaseAdmin
        .from('notification_preferences')
        .select('enabled')
        .eq('user_id', user_id)
        .eq('category', category)
        .maybeSingle();

      if (pref && pref.enabled === false) {
        console.log('[send-push] User', user_id, 'has category', category, 'disabled. Skipping.');
        return new Response(JSON.stringify({ sent: 0, failed: 0, skipped: true, reason: 'category_disabled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const config = await getConfig();
      console.log('[send-push] VAPID config loaded, public key:', config.vapid_public_key?.substring(0, 20) + '...');
      const { data: subs, error: subsError } = await supabaseAdmin.from('push_subscriptions').select('*').eq('user_id', user_id);
      console.log('[send-push] Found', subs?.length || 0, 'subscriptions for user', user_id, subsError ? 'Error: ' + subsError.message : '');
      let sent = 0, failed = 0;
      for (const s of (subs || [])) {
        try {
          console.log('[send-push] Sending to endpoint:', s.endpoint?.substring(0, 60) + '...');
          const r = await sendPush(
            { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
            JSON.stringify({ title, body: message || '', url: targetUrl || '/', tag: tag || 'notification' }),
            config.vapid_public_key, config.vapid_private_key, config.vapid_subject
          );
          console.log('[send-push] Push result:', r.ok ? 'OK' : 'FAILED', 'status:', r.status);
          if (r.ok) sent++; else { 
            failed++; 
            if (r.status === 410 || r.status === 404) {
              console.log('[send-push] Removing stale subscription:', s.id);
              await supabaseAdmin.from('push_subscriptions').delete().eq('id', s.id); 
            }
          }
        } catch (pushErr) { 
          console.error('[send-push] Push error:', pushErr);
          failed++; 
        }
      }
      console.log('[send-push] Results: sent=', sent, 'failed=', failed);
      return new Response(JSON.stringify({ sent, failed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'check-alerts') {
      const config = await getConfig();
      const { data: adminRoles } = await supabaseAdmin.from('user_roles').select('user_id').eq('role', 'admin');
      const adminIds = (adminRoles || []).map((r: { user_id: string }) => r.user_id);
      const today = new Date().toISOString().split('T')[0];
      const notifs: Array<{ userId: string; title: string; body: string; url: string; tag: string }> = [];

      for (const aid of adminIds) {
        const { data: due } = await supabaseAdmin.from('finance_transactions').select('amount').eq('user_id', aid).eq('type', 'expense').eq('is_paid', false).eq('date', today);
        if (due && due.length > 0) {
          const t = due.reduce((s: number, x: { amount: number }) => s + Number(x.amount), 0);
          notifs.push({ userId: aid, title: '💰 Contas a Pagar Hoje', body: `${due.length} conta(s) - R$ ${t.toFixed(2)}`, url: '/finance', tag: 'bills-due' });
        }
        const { data: over } = await supabaseAdmin.from('finance_transactions').select('amount').eq('user_id', aid).eq('type', 'expense').eq('is_paid', false).lt('date', today);
        if (over && over.length > 0) {
          const t = over.reduce((s: number, x: { amount: number }) => s + Number(x.amount), 0);
          notifs.push({ userId: aid, title: '⚠️ Contas Vencidas', body: `${over.length} conta(s) - R$ ${t.toFixed(2)}`, url: '/finance', tag: 'bills-overdue' });
        }
        const { data: neg } = await supabaseAdmin.from('finance_accounts').select('name, balance').eq('user_id', aid).eq('is_active', true).lt('balance', 0);
        if (neg && neg.length > 0) {
          notifs.push({ userId: aid, title: '🔴 Saldo Negativo', body: neg.map((a: { name: string; balance: number }) => `${a.name}: R$ ${Number(a.balance).toFixed(2)}`).join(', '), url: '/finance', tag: 'neg-balance' });
        }
        const { data: inv } = await supabaseAdmin.from('supplier_invoices').select('amount').eq('user_id', aid).eq('is_paid', false).eq('due_date', today);
        if (inv && inv.length > 0) {
          const t = inv.reduce((s: number, x: { amount: number }) => s + Number(x.amount), 0);
          notifs.push({ userId: aid, title: '📋 Notas Vencendo Hoje', body: `${inv.length} nota(s) - R$ ${t.toFixed(2)}`, url: '/inventory', tag: 'inv-due' });
        }
      }

      const { data: zs } = await supabaseAdmin.from('inventory_items').select('name').eq('current_stock', 0);
      if (zs && zs.length > 0) {
        const nm = zs.slice(0, 3).map((i: { name: string }) => i.name).join(', ');
        for (const aid of adminIds) {
          notifs.push({ userId: aid, title: '📦 Estoque Zerado', body: `${zs.length} item(ns): ${nm}${zs.length > 3 ? '...' : ''}`, url: '/inventory', tag: 'zero-stock' });
        }
      }

      let sent = 0, failed = 0;
      for (const n of notifs) {
        const { data: subs } = await supabaseAdmin.from('push_subscriptions').select('*').eq('user_id', n.userId);
        for (const s of (subs || [])) {
          try {
            const r = await sendPush(
              { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
              JSON.stringify({ title: n.title, body: n.body, url: n.url, tag: n.tag }),
              config.vapid_public_key, config.vapid_private_key, config.vapid_subject
            );
            if (r.ok) sent++; else { failed++; if (r.status === 410 || r.status === 404) await supabaseAdmin.from('push_subscriptions').delete().eq('id', s.id); }
          } catch { failed++; }
        }
      }

      return new Response(JSON.stringify({ sent, failed, alerts: notifs.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'test-push') {
      // Quick test endpoint - sends a test push to a user
      const body = await req.json();
      const userId = body.user_id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: corsHeaders });
      }
      
      const config = await getConfig();
      const { data: subs } = await supabaseAdmin.from('push_subscriptions').select('*').eq('user_id', userId);
      console.log('[test-push] Found', subs?.length || 0, 'subscriptions');
      
      const results: Array<{ endpoint: string; ok: boolean; status: number; error?: string }> = [];
      for (const s of (subs || [])) {
        try {
          console.log('[test-push] Trying endpoint:', s.endpoint?.substring(0, 80));
          const r = await sendPush(
            { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
            JSON.stringify({ title: '🔔 Teste Push', body: 'Notificação de teste do Garden Gestão!', url: '/', tag: 'sistema' }),
            config.vapid_public_key, config.vapid_private_key, config.vapid_subject
          );
          console.log('[test-push] Result:', r.ok, r.status);
          results.push({ endpoint: s.endpoint.substring(0, 80), ok: r.ok, status: r.status });
          
          // Clean up stale subscriptions
          if (r.status === 410 || r.status === 404) {
            await supabaseAdmin.from('push_subscriptions').delete().eq('id', s.id);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error('[test-push] Error:', msg);
          results.push({ endpoint: s.endpoint.substring(0, 80), ok: false, status: 0, error: msg });
        }
      }
      
      return new Response(JSON.stringify({ subscriptions: subs?.length || 0, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
