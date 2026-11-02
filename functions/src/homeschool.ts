import {getApps,initializeApp} from "firebase-admin/app";
import {getFirestore,FieldValue} from "firebase-admin/firestore";
import {onCall,HttpsError} from "firebase-functions/v2/https";
import {z} from "zod";
import {rateLimit} from "./guard.js";

if(!getApps().length)initializeApp();
const db=getFirestore();
const uidOf=(r:any):string=>{if(!r.auth?.uid)throw new HttpsError("unauthenticated","Sign in required");return r.auth.uid};
const curricula=["kenya-cbe","kenya-844","cambridge","pearson-edexcel","ib","us-common-core","us-ngss","us-ap","china-national","british-national","montessori","waldorf"] as const;
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
function schoolworkCompatibleDate(raw:string){const t=Date.parse(raw+"T12:00:00Z");if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==raw)return false;const now=Date.now();return t<=now+86400000&&t>=now-365*86400000;}
async function linkedParent(parentUid:string,studentUid:string){
 const link=await db.doc("parentLinks/"+studentUid+"_"+parentUid).get();
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
 // Independently validate curriculum catalog membership/stages in the UI; the server enforces
 // identity, field bounds and recognized pathway IDs, not official curriculum certification.
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
