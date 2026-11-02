import {getApps,initializeApp} from "firebase-admin/app";
import {getFirestore,FieldValue} from "firebase-admin/firestore";
import {onCall,HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {z} from "zod";
import {rateLimit} from "./guard.js";

// Dedicated, revocable TeknTandao Workspace service identity. Never put these
// credentials in Vite/Flutter configuration or expose them to a learner.
const WORKSPACE_API_KEY=defineSecret("TEKNTANDAO_WORKSPACE_API_KEY");
const WORKSPACE_REFRESH_TOKEN=defineSecret("TEKNTANDAO_FUNZI_SERVICE_REFRESH_TOKEN");
const WORKSPACE_FEED_URL=defineSecret("TEKNTANDAO_FUNZI_SCHOOL_FEED_URL");
if(!getApps().length)initializeApp();
const db=getFirestore();
const orgSchema=z.string().regex(/^[a-zA-Z0-9_-]{2,128}$/);
type FeedType="lessons"|"assignments"|"announcements";
const types:FeedType[]=["lessons","assignments","announcements"];
const requireUid=(r:any)=>{if(!r.auth?.uid)throw new HttpsError("unauthenticated","Sign in required");return r.auth.uid as string};
function endpoint(){const url=WORKSPACE_FEED_URL.value();if(!/^https:\/\//.test(url))throw new HttpsError("failed-precondition","HTTPS school integration not configured");return url}
async function workspaceToken(){
 const key=WORKSPACE_API_KEY.value(),refresh=WORKSPACE_REFRESH_TOKEN.value();
 if(!key||!refresh)throw new HttpsError("failed-precondition","School integration secrets not configured");
 const response=await fetch("https://securetoken.googleapis.com/v1/token?key="+encodeURIComponent(key),{
  method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
  body:new URLSearchParams({grant_type:"refresh_token",refresh_token:refresh})});
 if(!response.ok)throw new HttpsError("unavailable","School integration authentication unavailable");
 const payload:any=await response.json();if(typeof payload.id_token!=="string")throw new HttpsError("unavailable","School integration token unavailable");
 return payload.id_token as string;
}
function sanitizeItem(type:FeedType,raw:any){
 if(typeof raw?.id!=="string"||raw.id.length>128||typeof raw?.name!=="string")throw new HttpsError("data-loss","Invalid school curriculum item");
 return {id:raw.id,type,name:raw.name.slice(0,240),subject:typeof raw.subject==="string"?raw.subject.slice(0,120):null,
  ...(type==="assignments"?{dueAt:typeof raw.dueAt==="string"?raw.dueAt.slice(0,48):null}:{})};
}
async function retrieve(orgId:string,uid:string,type:FeedType,token:string){
 const items:any[]=[],ids=new Set<string>();let afterId:string|undefined;
 for(let page=0;page<4;page++){
  const response=await fetch(endpoint(),{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},
   body:JSON.stringify({data:{orgId,funziLearnerId:uid,type,limit:20,...(afterId?{afterId}:{})}})});
  if(!response.ok)throw new HttpsError("permission-denied","School link is unavailable or no longer authorized");
  const payload:any=await response.json();const result=payload.result;
  if(payload.error||result?.schemaVersion!==2||result.orgId!==orgId||result.funziLearnerId!==uid||result.type!==type||!Array.isArray(result.items))
   throw new HttpsError("data-loss","Unexpected school feed response");
  for(const raw of result.items){
   const item=sanitizeItem(type,raw);
   if(ids.has(item.id))throw new HttpsError("data-loss","Duplicate school item");ids.add(item.id);items.push(item);
  }
  if(!result.nextCursor)return items;
  if(typeof result.nextCursor!=="string"||!ids.has(result.nextCursor)||result.nextCursor===afterId)
   throw new HttpsError("data-loss","Invalid school feed cursor");
  afterId=result.nextCursor;
 }
 throw new HttpsError("resource-exhausted","Too many schoolwork pages; no partial data saved");
}
export const syncLinkedSchoolwork=onCall({
 enforceAppCheck:true,secrets:[WORKSPACE_API_KEY,WORKSPACE_REFRESH_TOKEN,WORKSPACE_FEED_URL]
},async r=>{
 const uid=requireUid(r),orgId=orgSchema.parse(r.data?.orgId);
 await rateLimit(db,uid,"schoolwork-sync",4,3600);
 const token=await workspaceToken(),ref=db.doc("schoolworkSnapshots/"+uid);
 try{
  // The Workspace endpoint independently verifies that this exact Funzi UID
  // is linked to an enrolled student. Org IDs or email matches are not proof.
  const [lessons,assignments,announcements]=await Promise.all(types.map(type=>retrieve(orgId,uid,type,token)));
  const syncedAt=new Date().toISOString(),expiresAt=new Date(Date.now()+24*3600*1000);
  await ref.set({uid,orgId,lessons,assignments,announcements,syncedAt,expiresAt,readOnly:true,
    dataScope:"linked-student-class-content",updatedAt:FieldValue.serverTimestamp()});
  return {orgId,lessons,assignments,announcements,syncedAt,expiresAt:expiresAt.toISOString(),readOnly:true};
 }catch(error){
  // A revoked link must not continue to be displayed as current schoolwork.
  await ref.delete();throw error;
 }
});
export const getMySchoolwork=onCall({enforceAppCheck:true},async r=>{
 const uid=requireUid(r),snap=await db.doc("schoolworkSnapshots/"+uid).get(),d=snap.data();
 if(!d||!d.expiresAt||d.expiresAt.toMillis()<=Date.now())
  return {connected:false,lessons:[],assignments:[],announcements:[],message:"Sync a currently linked school account to access recent class content."};
 return {connected:true,orgId:d.orgId,lessons:d.lessons,assignments:d.assignments,announcements:d.announcements,
  syncedAt:d.syncedAt,expiresAt:d.expiresAt.toDate().toISOString(),readOnly:true};
});
