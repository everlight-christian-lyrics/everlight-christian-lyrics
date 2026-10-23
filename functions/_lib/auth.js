const encoder = new TextEncoder();
function b64(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function sign(value, secret){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return b64(await crypto.subtle.sign('HMAC',key,encoder.encode(value)))}
export async function makeCookie(secret){const payload=String(Date.now()+12*60*60*1000);return `${payload}.${await sign(payload,secret)}`}
export async function isAuthed(request,env){const cookie=request.headers.get('Cookie')||'';const match=cookie.match(/(?:^|;\s*)ecl_admin=([^;]+)/);if(!match||!env.SESSION_SECRET)return false;const [expiry,sig]=decodeURIComponent(match[1]).split('.');if(!expiry||!sig||!/^\d+$/.test(expiry)||Number(expiry)<Date.now())return false;return (await sign(expiry,env.SESSION_SECRET))===sig}
export function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}})}
export function cookieHeader(value,maxAge=43200){return `ecl_admin=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`}
export async function requireAuth(request,env){if(!await isAuthed(request,env))return json({error:'Please log in again.'},401);return null}
export function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
export function validUrl(value){if(!value)return true;try{const u=new URL(value);return u.protocol==='https:'}catch{return false}}
