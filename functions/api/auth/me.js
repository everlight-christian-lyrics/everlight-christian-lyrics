import {isAuthed,json} from '../../_lib/auth.js';
export async function onRequestGet({request,env}){return isAuthed(request,env)?json({ok:true}):json({error:'Not logged in.'},401)}
