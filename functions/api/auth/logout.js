import {json,cookieHeader} from '../../_lib/auth.js';
export async function onRequestPost(){return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':cookieHeader('',0)}})}
