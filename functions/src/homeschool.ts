import {getApps,initializeApp} from "firebase-admin/app";
import {getFirestore,FieldValue} from "firebase-admin/firestore";
import {onCall,HttpsError} from "firebase-functions/v2/https";
import {z} from "zod";
import {createHash,randomBytes,timingSafeEqual} from "node:crypto";
import {rateLimit} from "./guard.js";
import {isValidHomeLearningCatalogChoice} from "./homeschoolCatalog.js";

if(!getApps().length)initializeApp();
const db=getFirestore();
const uidOf=(r:any):string=>{if(!r.auth?.uid)throw new HttpsError("unauthenticated","Sign in required");return r.auth.uid};
const curricula=["kenya-cbe","kenya-844","cambridge","pearson-edexcel","ib","us-common-core","us-ngss","us-ap","china-national","british-national","montessori","waldorf","india-cbse","singapore-moe","south-africa-caps","australian-curriculum","canada-ontario","new-zealand","france-national"] as const;
const planSchema=z.object({
 pathway:z.enum(curricula),
 stage:z.string().trim().min(2).max(80),
 language:z.string().trim().min(2).max(60),
 weeklyHours:z.number().min(1).max(60),
 kenyaContext:z.boolean(),
 subjects:z.array(z.string().trim().min(2).max(80)).min(1).max(15),
 learningStyle:z.enum(["mixed","reading","visual","audio","hands-on"]).default("mixed"),
 lowBandwidth:z.boolean().default(false),
 lessonMinutes:z.number().int().min(10).max(90).default(30),
 weeklyGoal:z.string().trim().max(300).default(""),
}).strict().refine(x=>new Set(x.subjects).size===x.subjects.length,{message:"Subjects must be unique"});
const activitySchema=z.object({
 subject:z.string().trim().min(2).max(80),
 activity:z.enum(["reading","guided-lesson","practice","project","experiment","quiz","tutoring","fieldwork","reflection"]),
 minutes:z.number().int().min(1).max(240),
 completedOn:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 reflection:z.string().trim().max(1500).default(""),
 evidenceDescription:z.string().trim().max(500).default(""),
}).strict();
const learnerId=z.string().regex(/^[A-Za-z0-9_-]{5,128}$/);
const recordId=z.string().regex(/^[A-Za-z0-9_-]{5,128}$/);
const format=(s:any)=>({...s.data(),id:s.id,createdAt:s.data()?.createdAt?.toDate?.()?.toISOString?.()||null,reviewedAt:s.data()?.reviewedAt?.toDate?.()?.toISOString?.()||null});
function schoolworkCompatibleDate(raw:string){const t=Date.parse(raw+"T12:00:00Z");if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==raw)return false;const now=Date.now();const nairobiDate=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Nairobi",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(now));return raw<=nairobiDate&&t>=now-365*86400000;}
async function linkedParent(parentUid:string,studentUid:string){
 const link=await db.doc("homeschoolGuardianLinks/"+studentUid+"_"+parentUid).get();
 return link.exists&&link.data()?.learnerId===studentUid&&link.data()?.parentId===parentUid;
}
async function dashboard(studentUid:string){
 const [profile,events]=await Promise.all([
  db.doc("homeschoolProfiles/"+studentUid).get(),
  db.collection("homeschoolProfiles").doc(studentUid).collection("sessions").orderBy("createdAt","desc").limit(100).get(),
 ]);
 const sessions=events.docs.map(format);
 const totalMinutes=sessions.reduce((n:any,s:any)=>n+(Number(s.minutes)||0),0);
 const acknowledged=sessions.filter((s:any)=>s.reviewStatus==="guardian_acknowledged").length;
 return {plan:profile.exists?profile.data()?.plan||null:null,sessions,totalMinutes,acknowledgedCount:acknowledged,
    recordsLimitedTo:100,recordType:"self_reported_learning_log",officialGrade:false};
}
export const saveHomeLearningPlan=onCall({enforceAppCheck:true},async r=>{
 const uid=uidOf(r);await rateLimit(db,uid,"home-plan",12,3600);
 const plan=planSchema.parse(r.data);
 if(!isValidHomeLearningCatalogChoice(plan))throw new HttpsError("invalid-argument","Stage, subjects or teaching language do not match the selected curriculum");
 // Catalog validation does not imply official curriculum endorsement or certification.
 await db.doc("homeschoolProfiles/"+uid).set({uid,plan,updatedAt:FieldValue.serverTimestamp()},{merge:true});
 return {saved:true,officiallyAccredited:false};
});
export const getMyHomeLearningDashboard=onCall({enforceAppCheck:true},async r=>dashboard(uidOf(r)));
export const recordHomeLearningSession=onCall({enforceAppCheck:true},async r=>{
 const uid=uidOf(r);await rateLimit(db,uid,"home-log",50,3600);
 const data=activitySchema.parse(r.data);
 if(!schoolworkCompatibleDate(data.completedOn))throw new HttpsError("invalid-argument","Choose an actual date within the last year");
 const profile=await db.doc("homeschoolProfiles/"+uid).get();
 const subjects:unknown=profile.data()?.plan?.subjects;
 if(!Array.isArray(subjects)||!subjects.includes(data.subject))throw new HttpsError("failed-precondition","Select a subject from your saved homeschool plan");
 const ref=db.collection("homeschoolProfiles").doc(uid).collection("sessions").doc();
 await ref.create({...data,uid,reviewStatus:"self_reported",source:"learner_self_report",createdAt:FieldValue.serverTimestamp(),reviewedBy:null});
 return {id:ref.id,reviewStatus:"self_reported",officialGrade:false};
});
export const getHomeLearningFamilyDashboard=onCall({enforceAppCheck:true},async r=>{
 const actor=uidOf(r);const x=z.object({learnerUid:learnerId}).parse(r.data);
 if(!await linkedParent(actor,x.learnerUid))throw new HttpsError("permission-denied","Explicit learner-parent link required");
 return dashboard(x.learnerUid);
});
export const reviewHomeLearningSession=onCall({enforceAppCheck:true},async r=>{
 const actor=uidOf(r);
 const x=z.object({learnerUid:learnerId,sessionId:recordId,decision:z.enum(["guardian_acknowledged","needs_revision"]),note:z.string().trim().max(500).default("")}).parse(r.data);
 if(actor===x.learnerUid||!await linkedParent(actor,x.learnerUid))throw new HttpsError("permission-denied","Linked guardian account required");
 await rateLimit(db,actor,"home-guardian-review",50,3600);
 const ref=db.doc("homeschoolProfiles/"+x.learnerUid+"/sessions/"+x.sessionId);
 await db.runTransaction(async tx=>{
  const existing=await tx.get(ref);
  if(!existing.exists)throw new HttpsError("not-found","Learning record not found");
  tx.update(ref,{reviewStatus:x.decision,reviewNote:x.note,reviewedBy:actor,reviewedAt:FieldValue.serverTimestamp()});
 });
 return {status:x.decision,officialGrade:false};
});

/**
 * Two-account, short-lived proof-of-control handshake for homeschooling guardians.
 * This establishes an account link ONLY, never verifies adult age or legal guardianship.
 */
const hashCode=(token:string)=>createHash("sha256").update(token).digest("hex");
export const createHomeGuardianInvite=onCall({enforceAppCheck:true},async r=>{
 const guardianUid=uidOf(r);
 if(r.auth?.token.email_verified!==true)throw new HttpsError("permission-denied","Guardian must verify email");
 z.object({adultAttestation:z.literal(true)}).parse(r.data);
 await rateLimit(db,guardianUid,"home-guardian-invite",6,3600);
 const ref=db.collection("homeschoolGuardianInvites").doc();
 const token=randomBytes(24).toString("hex");
 const expiresAt=Date.now()+15*60*1000;
 await ref.create({guardianUid,tokenHash:hashCode(token),expiresAt,createdAt:FieldValue.serverTimestamp(),used:false});
 return {inviteCode:ref.id+"."+token,expiresAt:new Date(expiresAt).toISOString(),
   warning:"Account link only. Age, identity and legal guardianship are not verified."};
});
export const acceptHomeGuardianInvite=onCall({enforceAppCheck:true},async r=>{
 const learnerUid=uidOf(r);
 const code=z.object({inviteCode:z.string().trim().regex(/^[A-Za-z0-9_-]{10,128}\.[a-f0-9]{48}$/)}).parse(r.data).inviteCode;
 await rateLimit(db,learnerUid,"home-guardian-accept",8,3600);
 const [inviteId,secret]=code.split(".");
 const inviteRef=db.doc("homeschoolGuardianInvites/"+inviteId);
 const accepted=await db.runTransaction(async tx=>{
  const invite=await tx.get(inviteRef);const entry=invite.data();
  if(!entry||entry.used||Number(entry.expiresAt)<Date.now())throw new HttpsError("failed-precondition","Invitation expired or already used");
  const expected=Buffer.from(String(entry.tokenHash),"hex");
  const actual=Buffer.from(hashCode(secret),"hex");
  if(expected.length!==actual.length||!timingSafeEqual(expected,actual))throw new HttpsError("permission-denied","Invalid invitation");
  const guardianUid=String(entry.guardianUid);
  if(guardianUid===learnerUid)throw new HttpsError("failed-precondition","Separate learner and guardian accounts required");
  const linkRef=db.doc("homeschoolGuardianLinks/"+learnerUid+"_"+guardianUid);
  tx.set(linkRef,{learnerId:learnerUid,parentId:guardianUid,status:"linked_unverified",createdAt:FieldValue.serverTimestamp()},{merge:true});
  tx.update(inviteRef,{used:true,usedAt:FieldValue.serverTimestamp(),usedBy:learnerUid});
  return guardianUid;
 });
 return {linked:true,guardianUid:accepted,legalGuardianVerified:false};
});
export const listMyHomeGuardianLinks=onCall({enforceAppCheck:true},async r=>{
 const uid=uidOf(r);
 const [learning,guarding]=await Promise.all([
  db.collection("homeschoolGuardianLinks").where("learnerId","==",uid).limit(30).get(),
  db.collection("homeschoolGuardianLinks").where("parentId","==",uid).limit(30).get(),
 ]);
 return {myGuardians:learning.docs.map(d=>({guardianUid:d.data().parentId,status:d.data().status})),
    myLearners:guarding.docs.map(d=>({learnerUid:d.data().learnerId,status:d.data().status}))};
});
export const revokeHomeGuardianLink=onCall({enforceAppCheck:true},async r=>{
 const actor=uidOf(r);
 const x=z.object({learnerUid:learnerId,guardianUid:learnerId}).parse(r.data);
 if(actor!==x.learnerUid&&actor!==x.guardianUid)throw new HttpsError("permission-denied","Not a participant");
 await rateLimit(db,actor,"home-guardian-revoke",20,3600);
 const ref=db.doc("homeschoolGuardianLinks/"+x.learnerUid+"_"+x.guardianUid);
 const snap=await ref.get();
 if(!snap.exists||snap.data()?.learnerId!==x.learnerUid||snap.data()?.parentId!==x.guardianUid)throw new HttpsError("not-found","Link not found");
 await ref.delete();
 return {revoked:true};
});
