import type { VercelRequest, VercelResponse } from '@vercel/node';
import { get, head, put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import { generateStudentsExcelWorkbook } from '../src/server/excelExport.js';
import { detectLanguage, buildMultilingualSystemPrompt } from '../src/server/aiMultilingual.js';

type User = { id:string; username:string; email:string; displayName:string; passwordHash:string; role:'admin'|'user'; createdAt:string; sessionVersion:number; lastLogin?:string };
type State = { users:User[]; reports:any[]; students:any[]; studentsLastSaved?:string; lostFoundItems:any[]; attendance:any[]; activities:any[]; notifications:any[]; conversations:any[]; adminProfile?:any; schoolInfo?:any; settings?:any };
const PATH = 'campus-os/private/state.json';
const EMPTY = ():State => ({users:[],reports:[],students:[],lostFoundItems:[],attendance:[],activities:[],notifications:[],conversations:[]});
const secret = () => {const x=process.env.JWT_SECRET; if (!x || x.length<32) throw new Error('JWT_SECRET is not configured securely'); return x;};
const storeReady = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN));
const safeUser = (u:User) => ({id:u.id,username:u.username,email:u.email,displayName:u.displayName,role:u.role,createdAt:u.createdAt,lastLogin:u.lastLogin});
const clean = (v:unknown,limit=500) => String(v??'').trim().slice(0,limit);
const fail=(res:VercelResponse,status:number,message:string)=>res.status(status).json({success:false,error:message});
function originGuard(req:VercelRequest,res:VercelResponse) {
  if(!['GET','HEAD','OPTIONS'].includes(req.method||'')) {
    const origin=req.headers.origin;
    const host=req.headers['x-forwarded-host']||req.headers.host;
    const allowed=process.env.APP_URL;
    if(origin && origin!=='https://'+host && origin!==allowed && origin!=='http://localhost:3000') {
      fail(res,403,'Cross-origin request denied');return false;
    }
    if(!String(req.headers['content-type']||'').includes('application/json')) {
      fail(res,415,'Expected application/json');return false;
    }
  }
  return true;
}
async function readState():Promise<State> {
  if(!storeReady()) throw new Error('Private server storage is not configured');
  let result:any;
  try {result=await get(PATH,{access:'private'});} catch(e:any) {
    if(e?.statusCode===404 || e?.status===404 || e?.name==='BlobNotFoundError') return EMPTY();
    throw e;
  }
  if(!result) return EMPTY();
  if(result.statusCode===404)return EMPTY();
  if(!result.stream)throw new Error('Private storage response did not contain data');
  const raw=await new Response(result.stream).text();
  const parsed=JSON.parse(raw) as State;
  if(!Array.isArray(parsed.users)||!Array.isArray(parsed.reports))throw new Error('Corrupted private storage');
  return {...EMPTY(),...parsed};
}
async function mutate<T>(fn:(s:State)=>T):Promise<T> {
  for(let attempt=0;attempt<5;attempt++) {
    const state=await readState();
    let etag:string|undefined;
    try {const info:any=await head(PATH);etag=info?.etag;}catch(e:any){
      if(e?.statusCode!==404 && e?.status!==404 && e?.name!=='BlobNotFoundError') throw e;
    }
    const result=fn(state);
    try {
      await put(PATH,JSON.stringify(state),{access:'private',contentType:'application/json',allowOverwrite:true,...(etag?{ifMatch:etag}:{})});
      return result;
    }catch(e:any){
      if(e?.statusCode===412 || e?.name==='BlobPreconditionFailedError')continue;
      throw e;
    }
  }
  throw new Error('Concurrent update conflict; please retry');
}
function cookieToken(req:VercelRequest):string|undefined {
  const h=req.headers.cookie||'';
  const match=String(h).match(/(?:^|;\s*)campus_session=([^;]+)/);
  return match?decodeURIComponent(match[1]):undefined;
}
function cookie(res:VercelResponse,token:string,maxAge:number) {
  res.setHeader('Set-Cookie','campus_session='+token+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+maxAge);
}
async function currentUser(req:VercelRequest,state?:State):Promise<User|null> {
  const token=cookieToken(req); if(!token)return null;
  try {
    const payload=jwt.verify(token,secret(),{algorithms:['HS256'],issuer:'campus-os',audience:'campus-os'}) as any;
    const db=state||await readState();
    const user=db.users.find(u=>u.id===payload.sub);
    return user && user.sessionVersion===payload.sv ? user:null;
  }catch{return null;}
}
function issue(res:VercelResponse,user:User){
  const token=jwt.sign({sv:user.sessionVersion},secret(),{algorithm:'HS256',subject:user.id,expiresIn:'12h',issuer:'campus-os',audience:'campus-os'});
  cookie(res,token,12*60*60);
}
const badAuth=(res:VercelResponse)=>fail(res,401,'Sign in to continue');
const adminRequired=(res:VercelResponse)=>fail(res,403,'Administrator permission required');
function sanitizeItems(items:any[],limit=5000){return items.slice(0,limit).map(v=>JSON.parse(JSON.stringify(v)));}

function preserveReports(db:State,items:any[]){
  const incoming=sanitizeItems(items);
  const ids=new Set(incoming.map(x=>x.id));
  for(const previous of db.lostFoundItems){
    if(previous?.source==='student_report' && db.reports.some(r=>r.id===previous.id) && !ids.has(previous.id)){
      incoming.push(previous);
      ids.add(previous.id);
    }
  }
  return incoming;
}
const limits=new Map<string,{n:number,until:number}>();
function limited(req:VercelRequest,kind:string,max:number,period:number){
  const key=kind+':'+String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];
  const now=Date.now();const old=limits.get(key);const state=!old||old.until<now?{n:0,until:now+period}:old;
  state.n++;limits.set(key,state);return state.n>max;
}
async function route(req:VercelRequest,res:VercelResponse){
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','same-origin');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Frame-Options','DENY');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(!originGuard(req,res))return;
  const q=req.query.route;
  const routeName=(Array.isArray(q)?q.join('/'):typeof q==='string'?q:'').replace(/^\/|\/$/g,'');
  const method=req.method||'GET';
  if(routeName==='health'&&method==='GET')return res.status(200).json({status:'ok',storageConfigured:storeReady(),aiConfigured:Boolean(process.env.GEMINI_API_KEY)});
  if(!storeReady())return fail(res,503,'Persistent database unavailable; contact administrator');
  if(routeName==='auth/login'&&method==='POST'){
    if(limited(req,'login',12,15*60*1000))return fail(res,429,'Too many attempts. Try again later.');
    const username=clean(req.body?.username,100).toLowerCase(),password=String(req.body?.password||'');
    if(!username||!password)return fail(res,400,'Username and password required');
    let state=await readState();
    let u=state.users.find(x=>x.username===username||x.email===username);
    if(!u && !state.users.some(x=>x.role==='admin') &&
      username===process.env.ADMIN_BOOTSTRAP_USERNAME &&
      !!process.env.ADMIN_BOOTSTRAP_PASSWORD &&
      password===process.env.ADMIN_BOOTSTRAP_PASSWORD) {
      u=await mutate(s=>{
        if(s.users.some(x=>x.role==='admin'))throw new Error('Administrator already initialized');
        const created:User={id:randomUUID(),username,email:'',displayName:'Administrator',role:'admin',passwordHash:bcrypt.hashSync(password,12),createdAt:new Date().toISOString(),sessionVersion:1};
        s.users.push(created);return created;
      });
    }
    if(!u||!bcrypt.compareSync(password,u.passwordHash))return fail(res,401,'Invalid username or password');
    if(req.body?.requireAdmin&&u.role!=='admin')return adminRequired(res);
    issue(res,u);return res.status(200).json({success:true,user:safeUser(u)});
  }
  if(routeName==='auth/register'&&method==='POST'){
    if(limited(req,'register',8,60*60*1000))return fail(res,429,'Too many registrations');
    const username=clean(req.body?.username,70).toLowerCase();
    const email=clean(req.body?.email,160).toLowerCase();
    const name=clean(req.body?.displayName||username,120);
    const password=String(req.body?.password||'');
    if(!/^[a-z0-9_.-]{3,70}$/.test(username)||!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)||password.length<10||password.length>200)return fail(res,400,'Enter a valid username/email and a password of at least 10 characters');
    const created=await mutate(s=>{
      if(s.users.some(x=>x.username===username||x.email===email))return null;
      const u:User={id:randomUUID(),username,email,displayName:name,role:'user',passwordHash:bcrypt.hashSync(password,12),createdAt:new Date().toISOString(),sessionVersion:1};
      s.users.push(u);return u;
    });
    if(!created)return fail(res,409,'Username or email already exists');
    issue(res,created);return res.status(201).json({success:true,user:safeUser(created)});
  }
  if(routeName==='auth/logout'&&method==='POST'){cookie(res,'',0);return res.status(200).json({success:true});}
  if(routeName==='auth/me'&&method==='GET'){const u=await currentUser(req);return res.status(200).json({authenticated:!!u,user:u?safeUser(u):null});}
  // TEMPORARY PREVIEW-ONLY SMOKE TEST CLEANUP. Remove before production.
  if(routeName==='internal/cleanup-smoke'&&method==='POST'&&process.env.VERCEL_ENV==='preview'){
    const state=await readState(),actor=await currentUser(req,state);
    if(!actor || actor.role!=='user' || !actor.username.startsWith('qa_smoke_')) return fail(res,403,'Not a test account');
    await mutate(db=>{
      const reportIds=new Set(db.reports.filter(r=>r.userId===actor.id).map(r=>r.id));
      db.reports=db.reports.filter(r=>r.userId!==actor.id);
      db.lostFoundItems=db.lostFoundItems.filter(v=>!reportIds.has(v.id));
      db.users=db.users.filter(v=>v.id!==actor.id);
      return true;
    });
    cookie(res,'',0);
    return res.status(200).json({success:true,cleaned:true});
  }
  const s=await readState(),u=await currentUser(req,s);
  if(!u)return badAuth(res);
  const admin=u.role==='admin';
  if(routeName==='user/reports') {
    if(method==='GET')return res.status(200).json({success:true,reports:admin?s.reports:s.reports.filter(r=>r.userId===u.id)});
    if(method==='POST'){
      if(limited(req,'report',20,60*60*1000))return fail(res,429,'Too many reports');
      const type=req.body?.type, title=clean(req.body?.title,150),category=clean(req.body?.category,100),location=clean(req.body?.location,200);
      if(!['lost','found'].includes(type)||!title||!category||!location)return fail(res,400,'Report type, title, category, and location required');
      const report=await mutate(db=>{
        const r={id:randomUUID(),userId:u.id,userEmail:u.email,userName:u.displayName,type,title,category,location,
          description:clean(req.body?.description,2500),date:clean(req.body?.date||new Date().toISOString().slice(0,10),20),
          contact:clean(req.body?.contact||u.email,200),status:'pending',createdAt:new Date().toISOString()};
        db.reports.unshift(r);
        db.lostFoundItems.unshift({id:r.id,itemName:title,reportType:type,category,location,dateReported:r.date,reporterName:u.displayName,
          description:r.description,status:type,contactInformation:r.contact,source:'student_report',createdAt:r.createdAt});
        return r;
      });
      return res.status(201).json({success:true,report});
    }
  }
  if(routeName==='admin/lost-found'&&method==='GET') {
    const items=admin?s.lostFoundItems:s.lostFoundItems.map(({contactInformation,reporterName,...safe}:any)=>safe);
    return res.status(200).json({success:true,items});
  }
  if(routeName==='campus-ai') {
    if(method==='GET')return res.status(200).json({status:'ok',configured:Boolean(process.env.GEMINI_API_KEY)});
    if(method==='POST'){
      if(limited(req,'ai',40,60*60*1000))return fail(res,429,'AI request limit reached');
      if(!process.env.GEMINI_API_KEY)return fail(res,503,'Campus AI is not configured');
      const prompt=clean(req.body?.prompt,4000);
      if(!prompt)return fail(res,400,'Message required');
      const lang=clean(req.body?.language,20)||detectLanguage(prompt);
      const history=Array.isArray(req.body?.history)?req.body.history.slice(-12).filter((h:any)=>typeof h?.content==='string').map((h:any)=>({role:h.sender==='user'?'user':'model',parts:[{text:clean(h.content,4000)}]})):[];
      const context=admin?{students:s.students,attendance:s.attendance,lostFoundItems:s.lostFoundItems,schoolInfo:s.schoolInfo}:{
        lostFoundItems:s.lostFoundItems.map(({contactInformation,reporterName,...safe}:any)=>safe),schoolInfo:s.schoolInfo};
      if(history.length&&history[history.length-1]?.role==='user'&&history[history.length-1]?.parts?.[0]?.text===prompt)history.pop();
      const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
      const promptSystem=buildMultilingualSystemPrompt(context,lang)+'\nBe genuinely conversational; respond thoughtfully to follow-up questions. Never invent student records or disclose admin-only records to non-admins. Do not claim to have saved or modified data unless an API did so. Respond in the latest user language; prefer concise natural prose.';
      try{
        const result=await ai.models.generateContent({model:process.env.GEMINI_MODEL||'gemini-2.5-flash',contents:[...history,{role:'user',parts:[{text:prompt}]}],
          config:{systemInstruction:promptSystem,maxOutputTokens:1600,temperature:0.65}});
        if(!result.text?.trim())return fail(res,502,'Model returned an empty response');
        return res.status(200).json({text:result.text,source:'gemini-api',model:process.env.GEMINI_MODEL||'gemini-2.5-flash',detectedLanguage:detectLanguage(prompt)});
      }catch(e:any){console.error('Campus AI model error:',e?.message);return fail(res,502,'Campus AI provider unavailable; please retry');}
    }
  }
  if(!admin)return adminRequired(res);
  if(routeName==='admin/users'&&method==='GET')return res.status(200).json({success:true,users:s.users.map(safeUser)});
  if(routeName==='admin/users'&&method==='POST') {
    const username=clean(req.body?.username,70).toLowerCase(),email=clean(req.body?.email,160).toLowerCase();
    const password=String(req.body?.password||''),displayName=clean(req.body?.displayName,120);
    if(!/^[a-z0-9_.-]{3,70}$/.test(username)||!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)||password.length<10||password.length>200||!displayName)return fail(res,400,'Valid name, username, email and password (10+ characters) required');
    const created=await mutate(db=>{
      if(db.users.some(x=>x.username===username||x.email===email))return null;
      const v:User={id:randomUUID(),username,email,displayName,role:req.body?.role==='admin'?'admin':'user',passwordHash:bcrypt.hashSync(password,12),createdAt:new Date().toISOString(),sessionVersion:1};
      db.users.push(v);return v;
    });
    if(!created)return fail(res,409,'Username or email already exists');
    return res.status(201).json({success:true,user:safeUser(created)});
  }
  if(routeName.startsWith('admin/users/')&&['DELETE','PATCH'].includes(method)){
    const id=routeName.slice('admin/users/'.length);
    const result=await mutate(db=>{
      const target=db.users.find(x=>x.id===id);if(!target)return {error:'User not found'};
      if(method==='DELETE'){
        if(target.id===u.id)return {error:'Cannot delete your own account'};
        if(target.role==='admin'&&db.users.filter(x=>x.role==='admin').length<=1)return {error:'Cannot delete last admin'};
        db.users=db.users.filter(x=>x.id!==id);return {success:true};
      }
      if(req.body?.role==='user'&&target.role==='admin'&&db.users.filter(x=>x.role==='admin').length<=1)return {error:'Cannot demote last admin'};
      if(req.body?.role==='admin'||req.body?.role==='user')target.role=req.body.role;
      if(req.body?.displayName)target.displayName=clean(req.body.displayName,120);
      if(req.body?.email)target.email=clean(req.body.email,160).toLowerCase();
      if(req.body?.password){if(String(req.body.password).length<10)return {error:'Password must have 10+ characters'};target.passwordHash=bcrypt.hashSync(String(req.body.password),12);target.sessionVersion++;}
      return {success:true,user:safeUser(target)};
    });
    return result.error?fail(res,400,result.error):res.status(200).json(result);
  }
  if(routeName==='admin/reports'&&method==='GET')return res.status(200).json({success:true,reports:s.reports});
  if(routeName==='admin/reports'&&method==='PATCH'){
    const id=clean(req.body?.id,120),status=req.body?.status;
    if(!['pending','reviewed','resolved'].includes(status))return fail(res,400,'Invalid report status');
    const r=await mutate(db=>{const x=db.reports.find((v:any)=>v.id===id);if(!x)return null;x.status=status;x.adminNotes=clean(req.body?.adminNotes,1000);return x;});
    return r?res.status(200).json({success:true,report:r}):fail(res,404,'Report not found');
  }
  if(routeName==='admin/lost-found'&&method==='POST'){
    if(!Array.isArray(req.body?.items))return fail(res,400,'Items array required');
    const count=await mutate(db=>{db.lostFoundItems=preserveReports(db,req.body.items);return db.lostFoundItems.length;});
    return res.status(200).json({success:true,count});
  }
  if((routeName==='admin/students'||routeName==='admin/students/index')&&method==='GET')
    return res.status(200).json({success:true,students:s.students,lastSavedAt:s.studentsLastSaved});
  if((routeName==='admin/students'||routeName==='admin/students/save')&&method==='POST'){
    if(!Array.isArray(req.body?.students))return fail(res,400,'Students array required');
    const result=await mutate(db=>{db.students=sanitizeItems(req.body.students);db.studentsLastSaved=new Date().toISOString();return {count:db.students.length,savedAt:db.studentsLastSaved};});
    return res.status(200).json({success:true,...result});
  }
  if(routeName==='admin/students/export-excel'&&method==='POST'){
    const buffer=await generateStudentsExcelWorkbook({schoolName:clean(s.schoolInfo?.name||'Campus OS',150),exportedBy:u.displayName,exportDate:new Date().toISOString().slice(0,10),
      students:s.students,filterClass:req.body?.filterClass,filterStatus:req.body?.filterStatus});
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition','attachment; filename="CampusOS_Students.xlsx"');
    return res.status(200).send(buffer);
  }
  if(routeName==='admin/state'&&method==='GET'){
    const {users,reports,...data}=s;return res.status(200).json({success:true,state:data});
  }
  if(routeName==='admin/state'&&method==='PUT'){
    const valid=['students','attendance','lostFoundItems','activities','notifications','conversations','adminProfile','schoolInfo','settings'];
    const updates=req.body?.state;
    if(!updates||typeof updates!=='object'||Array.isArray(updates))return fail(res,400,'State object required');
    const keys=Object.keys(updates);
    if(keys.some(k=>!valid.includes(k)))return fail(res,400,'Invalid state field');
    await mutate(db=>{
      for(const k of keys){
        const value=updates[k];
        if(['students','attendance','lostFoundItems','activities','notifications','conversations'].includes(k)) {
          if(!Array.isArray(value))throw new Error('Invalid array data for '+k);
          (db as any)[k]=k==='lostFoundItems'?preserveReports(db,value):sanitizeItems(value);
        }else if(value&&typeof value==='object'&&!Array.isArray(value)) (db as any)[k]=value;
      }
      return true;
    });
    return res.status(200).json({success:true});
  }
  return fail(res,404,'Unknown endpoint');
}
export default async function handler(req:VercelRequest,res:VercelResponse){
  try {return await route(req,res);}
  catch(e:any){console.error('Campus OS API error:',e?.message||e);return fail(res,500,'Server operation failed; changes were not saved. Please retry.');}
}
