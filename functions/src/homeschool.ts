import {getApps,initializeApp} from "firebase-admin/app";
import {FieldValue,getFirestore} from "firebase-admin/firestore";
import {onCall,HttpsError} from "firebase-functions/v2/https";
import {z} from "zod";
import {rateLimit} from "./guard.js";

if(!getApps().length)initializeApp();
const db=getFirestore();
const supported=[
 "kenya-cbe","kenya-844","us-k12","us-ap","china-compulsory",
 "england-national","cambridge","pearson-edexcel","ib","india-cbse",
 "south-africa-caps","singapore","australia","canada-ontario","montessori","waldorf"
] as const;
const curriculum=z.enum(supported);
const identifier=z.string().regex(/^[A-Za-z0-9_-]{5,128}$/);
const str=(length:number)=>z.string().trim().min(2).max(length);
const owner=(r:any)=>{
 if(!r.auth?.uid)throw new HttpsError("unauthenticated","Sign in to a parent/guardian account");
 if(r.auth.token.email_verified!==true)throw new HttpsError("permission-denied","Verify the account email first");
 return r.auth.uid as string;
};
const profile=z.object({
 learnerId:identifier.optional(),alias:str(60),
 curriculum:curriculum,stage:str(100),
 additionalCurricula:z.array(curriculum).max(3).default([]),
 subjects:z.array(str(70)).min(1).max(12),
 daysPerWeek:z.number().int().min(1).max(6),
 minutesPerDay:z.number().int().min(30).max(360),
 termWeeks:z.number().int().min(4).max(24),
 languages:z.array(z.string().trim().min(2).max(40)).min(1).max(4),
 learningGoals:z.string().trim().max(1500).default(""),
 includeKenya:z.boolean().default(true),adultAttestation:z.literal(true)
}).refine(x=>!x.additionalCurricula.includes(x.curriculum),"The primary curriculum cannot be a secondary reference");
function learnerCollection(uid:string){return db.collection("homeschoolHouseholds").doc(uid).collection("learners");}
function profileView(s:any){const x=s.data();return {id:s.id,alias:x.alias,curriculum:x.curriculum,stage:x.stage,
 additionalCurricula:x.additionalCurricula||[],subjects:x.subjects,daysPerWeek:x.daysPerWeek,minutesPerDay:x.minutesPerDay,
 termWeeks:x.termWeeks,languages:x.languages,learningGoals:x.learningGoals,includeKenya:x.includeKenya,
 status:x.status,updatedAt:x.updatedAt?.toDate?.()?.toISOString?.()||null,homeEducationOnly:true};}
export const upsertHomeschoolLearner=onCall({enforceAppCheck:true},async r=>{
 const uid=owner(r);await rateLimit(db,uid,"home-profile",12,3600);
 const x=profile.parse(r.data),collection=learnerCollection(uid);
 const existing=x.learnerId?await collection.doc(x.learnerId).get():null;
 if(x.learnerId&&!existing?.exists)throw new HttpsError("not-found","Home learning profile not found");
 if(!x.learnerId){const count=await collection.where("status","==","active").limit(9).get();
  if(count.size>=8)throw new HttpsError("resource-exhausted","A household may have up to eight active learner profiles");}
 const ref=x.learnerId?collection.doc(x.learnerId):collection.doc();
 const {learnerId,adultAttestation,...fields}=x;
 const uniqueSubjects=[...new Set(fields.subjects)];
 await ref.set({...fields,subjects:uniqueSubjects,status:"active",ownerUid:uid,
  parentDeclaration:true,independentlyVerifiedGuardian:false,
  coverage:"reference-not-accreditation",standardsVerified:false,
  createdAt:existing?.data()?.createdAt||FieldValue.serverTimestamp(),
  updatedAt:FieldValue.serverTimestamp()});
 return {id:ref.id,status:"active",verifiedCurriculumAlignment:false};
});
export const listHomeschoolLearners=onCall({enforceAppCheck:true},async r=>{
 const uid=owner(r);
 const list=await learnerCollection(uid).limit(30).get();
 return {learners:list.docs.filter(s=>s.data().status==="active").map(profileView),
  notice:"Adult/guardian identity is self-attested, not independently verified. Home learning plans are not school registration or recognised qualifications."};
});
export const archiveHomeschoolLearner=onCall({enforceAppCheck:true},async r=>{
 const uid=owner(r);const x=z.object({learnerId:identifier}).parse(r.data),ref=learnerCollection(uid).doc(x.learnerId);
 if(!(await ref.get()).exists)throw new HttpsError("not-found","Profile not found");
 await ref.update({status:"archived",archivedAt:FieldValue.serverTimestamp()});return {archived:true};
});
const evidenceSchema=z.object({
 learnerId:identifier,date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),subject:str(70),
 kind:z.enum(["lesson","reading","quiz","project","fieldwork","practical","portfolio","wellbeing"]),
 description:z.string().trim().min(5).max(1200),
 minutes:z.number().int().min(1).max(360),
 confidence:z.enum(["needs_help","developing","confident"]).optional(),
 score:z.number().min(0).max(100).nullable().optional()
});
export const recordHomeschoolEvidence=onCall({enforceAppCheck:true},async r=>{
 const uid=owner(r);await rateLimit(db,uid,"home-evidence",50,3600);
 const x=evidenceSchema.parse(r.data),day=new Date(x.date+"T12:00:00Z");
 if(Number.isNaN(day.getTime())||day.toISOString().slice(0,10)!==x.date||day.getTime()>Date.now()+86400000||
  day.getTime()<Date.now()-366*86400000)
  throw new HttpsError("invalid-argument","Choose an actual date within the last year");
 const learner=learnerCollection(uid).doc(x.learnerId);
 const current=await learner.get();
 if(!current.exists||current.data()?.status!=="active")throw new HttpsError("permission-denied","Active learner required");
 // User-submitted scores/observations are not official or independently verified.
 const ref=learner.collection("evidence").doc();
 await ref.set({...x,ownerUid:uid,guardianReported:true,teacherVerified:false,examScore:false,
  createdAt:FieldValue.serverTimestamp()});
 return {id:ref.id,recorded:true,assessmentStatus:"guardian_reported"};
});
export const getHomeschoolReport=onCall({enforceAppCheck:true},async r=>{
 const uid=owner(r),x=z.object({learnerId:identifier}).parse(r.data),
 learner=learnerCollection(uid).doc(x.learnerId),snapshot=await learner.get();
 if(!snapshot.exists||snapshot.data()?.status!=="active")throw new HttpsError("not-found","Learner not found");
 // Bounded evidence history; explicit partial-state flag for long histories.
 const logs=await learner.collection("evidence").orderBy("createdAt","desc").limit(200).get();
 const rows=logs.docs.map(s=>({id:s.id,date:s.data().date,subject:s.data().subject,kind:s.data().kind,
  description:s.data().description,minutes:s.data().minutes,score:s.data().score??null,
  confidence:s.data().confidence??null,guardianReported:true}));
 const totals=rows.reduce((a,r)=>{a.minutes+=Number(r.minutes)||0;a.bySubject[r.subject]=(a.bySubject[r.subject]||0)+1;return a;},
  {minutes:0,bySubject:{} as Record<string,number>});
 return {learner:profileView(snapshot),evidence:rows,minutesLogged:totals.minutes,sessionsLogged:rows.length,
  distinctDates:[...new Set(rows.map(x=>x.date))].length,bySubject:totals.bySubject,
  truncated:logs.size===200,assessmentStatus:"family-reported, not external assessment",
  notice:"Progress evidence is a parent-reported portfolio, not a transcript, accreditation, exam result, attendance certificate or official school record."};
});
