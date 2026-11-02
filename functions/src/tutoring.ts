import {getFirestore,FieldValue} from "firebase-admin/firestore";
import {onCall,HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {z} from "zod";
import OpenAI from "openai";
import {moderate} from "./safety.js";
import {rateLimit} from "./guard.js";

const db=getFirestore();
const AI_KEY=defineSecret("OPENAI_API_KEY");
const uidOf=(r:any):string=>{if(!r.auth?.uid)throw new HttpsError("unauthenticated","Sign in required");return r.auth.uid};
const verified=(r:any)=>{const uid=uidOf(r);if(r.auth.token.email_verified!==true)throw new HttpsError("permission-denied","Verify your email first");return uid};
async function admin(r:any){const uid=verified(r);const u=await db.doc("users/"+uid).get();if(u.data()?.role!=="platform_admin")throw new HttpsError("permission-denied","Platform moderation required");return uid}
const short=z.string().trim().min(2).max(120);
const subjectList=z.array(z.string().trim().min(2).max(60)).min(1).max(12);
const id=z.string().regex(/^[a-zA-Z0-9_-]{5,128}$/);
const application=z.object({name:short,bio:z.string().trim().min(30).max(1500),subjects:subjectList,grades:z.array(z.number().int().min(1).max(12)).min(1).max(12),qualifications:z.string().trim().min(20).max(1500),adultAttestation:z.literal(true)});
const schoolApplication=z.object({schoolName:short,workspaceOrgId:id,contactRole:short,contactEmail:z.string().email().max(160),schoolOwnerAttestation:z.literal(true)});
const packageSchema=z.object({title:short,description:z.string().trim().min(40).max(2000),subject:short,gradeMin:z.number().int().min(1).max(12),gradeMax:z.number().int().min(1).max(12),durationMinutes:z.number().int().min(20).max(180),groupSize:z.number().int().min(1).max(30),priceKes:z.number().int().min(0).max(100000),curriculum:z.enum(["CBC/CBE","8-4-4","IGCSE","Other"]).default("CBC/CBE")}).refine(p=>p.gradeMin<=p.gradeMax,"Grade range is invalid");
function safeProvider(p:any){return {name:p?.name||p?.schoolName||"",subjects:p?.subjects||[],status:p?.status||"none",kind:p?.kind||null,workspaceOrgId:p?.workspaceOrgId||null,reason:p?.reason||null};}
function packageView(d:any,id:string){return {id,title:d.title,description:d.description,subject:d.subject,gradeMin:d.gradeMin,gradeMax:d.gradeMax,durationMinutes:d.durationMinutes,groupSize:d.groupSize,priceKes:d.priceKes,curriculum:d.curriculum,providerName:d.providerName,providerKind:d.providerKind,workspaceOrgId:d.providerKind==="school"?d.workspaceOrgId:null,status:d.status};}
export const applyAsTutor=onCall({enforceAppCheck:true},async r=>{
 const uid=verified(r);await rateLimit(db,uid,"apply-tutor",3,3600);
 const data=application.parse(r.data);const ref=db.doc("tutoringProviders/"+uid);
 const existing=await ref.get();if(existing.data()?.status==="approved")throw new HttpsError("failed-precondition","Tutor already approved");
 if(existing.data()?.kind==="school"&&existing.data()?.status!=="rejected")throw new HttpsError("failed-precondition","Use a separate account for a school");
 await ref.set({...data,kind:"tutor",status:"pending",uid,submittedAt:FieldValue.serverTimestamp(),reviewedBy:null,reason:null});
 return {status:"pending"};
});
export const applyAsSchoolPartner=onCall({enforceAppCheck:true},async r=>{
 const uid=verified(r);await rateLimit(db,uid,"apply-school",3,3600);
 const data=schoolApplication.parse(r.data);const ref=db.doc("tutoringProviders/"+uid);
 const existing=await ref.get();if(existing.data()?.status==="approved")throw new HttpsError("failed-precondition","Partner already approved");
 if(existing.data()?.kind==="tutor"&&existing.data()?.status!=="rejected")throw new HttpsError("failed-precondition","Use a separate account for freelance tutoring");
 // An organization ID is a CLAIM, not proof of control. Staff must verify ownership in TeknTandao Workspace.
 await ref.set({...data,kind:"school",uid,status:"pending",workspaceVerified:false,submittedAt:FieldValue.serverTimestamp(),reason:null,reviewedBy:null});
 return {status:"pending",requiresWorkspaceOwnershipVerification:true};
});
export const requestTutoringEligibility=onCall({enforceAppCheck:true},async r=>{
 const uid=verified(r);await rateLimit(db,uid,"tutoring-eligibility",3,3600);
 const x=z.object({mode:z.enum(["adult","guardian"]),note:z.string().trim().max(500).default("")}).parse(r.data);
 const ref=db.doc("tutoringEligibility/"+uid);const old=await ref.get();
 if(old.data()?.status==="verified")return {status:"verified"};
 await ref.set({uid,mode:x.mode,note:x.note,status:"pending",submittedAt:FieldValue.serverTimestamp()});
 return {status:"pending",message:"Independent adult or guardian authorization is required before live tutoring or bookings."};
});
export const reviewTutoringProvider=onCall({enforceAppCheck:true},async r=>{
 const actor=await admin(r);const x=z.object({uid:id,decision:z.enum(["approved","rejected","suspended"]),reason:z.string().trim().max(500).default(""),workspaceOwnershipVerified:z.boolean().default(false)}).parse(r.data);
 if(actor===x.uid)throw new HttpsError("permission-denied","No self-approval");
 const ref=db.doc("tutoringProviders/"+x.uid);const snap=await ref.get();
 if(!snap.exists)throw new HttpsError("not-found","Provider application not found");
 if(snap.data()?.kind==="school"&&x.decision==="approved"&&!x.workspaceOwnershipVerified)throw new HttpsError("failed-precondition","Independently verify school ownership in TeknTandao Workspace");
 await ref.update({status:x.decision,reason:x.reason,workspaceVerified:snap.data()?.kind==="school"?x.workspaceOwnershipVerified:false,reviewedBy:actor,reviewedAt:FieldValue.serverTimestamp()});
 await db.collection("tutoringAudit").add({action:"provider_review",actor,target:x.uid,decision:x.decision,reason:x.reason,at:FieldValue.serverTimestamp()});
 return {status:x.decision};
});
export const reviewTutoringEligibility=onCall({enforceAppCheck:true},async r=>{
 const actor=await admin(r);const x=z.object({uid:id,decision:z.enum(["verified","rejected"]),reason:z.string().trim().max(500).default(""),evidenceChecked:z.literal(true)}).parse(r.data);
 if(actor===x.uid)throw new HttpsError("permission-denied","No self-verification");
 const ref=db.doc("tutoringEligibility/"+x.uid);if(!(await ref.get()).exists)throw new HttpsError("not-found","Eligibility request not found");
 await ref.update({status:x.decision,reason:x.reason,verifiedBy:actor,verifiedAt:FieldValue.serverTimestamp()});
 await db.collection("tutoringAudit").add({action:"eligibility_review",actor,target:x.uid,decision:x.decision,at:FieldValue.serverTimestamp()});
 return {status:x.decision};
});
export const getMyTutoringAccount=onCall({enforceAppCheck:true},async r=>{
 const uid=uidOf(r);const [p,e]=await Promise.all([db.doc("tutoringProviders/"+uid).get(),db.doc("tutoringEligibility/"+uid).get()]);
 return {provider:safeProvider(p.data()),eligibility:{status:e.data()?.status||"none",mode:e.data()?.mode||null,reason:e.data()?.reason||null}};
});
export const submitTutoringPackage=onCall({enforceAppCheck:true},async r=>{
 const uid=verified(r);await rateLimit(db,uid,"tutoring-package",10,3600);
 const x=packageSchema.and(z.object({packageId:id.optional()})).parse(r.data);
 const profile=(await db.doc("tutoringProviders/"+uid).get()).data();
 if(profile?.status!=="approved"||(profile.kind==="school"&&profile.workspaceVerified!==true))throw new HttpsError("permission-denied","Approved, verified provider required");
 const ref=x.packageId?db.doc("tutoringPackages/"+x.packageId):db.collection("tutoringPackages").doc();
 const prior=await ref.get();if(prior.exists&&prior.data()?.providerUid!==uid)throw new HttpsError("permission-denied","Not your package");
 const {packageId,...fields}=x;
 await ref.set({...fields,providerUid:uid,providerName:profile.kind==="school"?profile.schoolName:profile.name,providerKind:profile.kind,
   workspaceOrgId:profile.kind==="school"?profile.workspaceOrgId:null,status:"pending_review",createdAt:prior.data()?.createdAt||FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
 return {id:ref.id,status:"pending_review"};
});
export const reviewTutoringPackage=onCall({enforceAppCheck:true},async r=>{
 const actor=await admin(r);const x=z.object({packageId:id,decision:z.enum(["published","rejected","unpublished"]),reason:z.string().trim().max(500).default("")}).parse(r.data);
 const ref=db.doc("tutoringPackages/"+x.packageId);const snap=await ref.get();if(!snap.exists)throw new HttpsError("not-found","Package not found");
 const p=(await db.doc("tutoringProviders/"+snap.data()!.providerUid).get()).data();
 if(x.decision==="published"&&(p?.status!=="approved"||(p.kind==="school"&&!p.workspaceVerified)))throw new HttpsError("permission-denied","Provider is not approved");
 await ref.update({status:x.decision,moderationReason:x.reason,moderatedBy:actor,moderatedAt:FieldValue.serverTimestamp()});
 await db.collection("tutoringAudit").add({action:"package_review",actor,target:x.packageId,decision:x.decision,at:FieldValue.serverTimestamp()});
 return {status:x.decision};
});
export const listTutoringPackages=onCall({enforceAppCheck:true},async r=>{
 uidOf(r);const docs=await db.collection("tutoringPackages").where("status","==","published").limit(50).get();
 // Check current provider approval so suspended providers cannot stay listed.
 const owners=[...new Set(docs.docs.map(s=>String(s.data().providerUid)))];
 const states=new Map(await Promise.all(owners.map(async uid=>[uid,(await db.doc("tutoringProviders/"+uid).get()).data()] as const)));
 return {packages:docs.docs.filter(s=>{const p=states.get(s.data().providerUid);return p?.status==="approved"&&(p.kind!=="school"||p.workspaceVerified===true)}).map(s=>packageView(s.data(),s.id))};
});
export const getMyTutoringDashboard=onCall({enforceAppCheck:true},async r=>{
 const uid=uidOf(r);const [mine,assigned,requested]=await Promise.all([
  db.collection("tutoringPackages").where("providerUid","==",uid).limit(40).get(),
  db.collection("tutoringBookings").where("providerUid","==",uid).limit(40).get(),
  db.collection("tutoringBookings").where("learnerUid","==",uid).limit(40).get()
 ]);
 const book=(s:any)=>({id:s.id,packageId:s.data().packageId,packageTitle:s.data().packageTitle,topic:s.data().topic,status:s.data().status,requestedAt:s.data().requestedAt?.toDate?.()?.toISOString?.()||null,preferredAt:s.data().preferredAt,providerUid:s.data().providerUid,learnerUid:s.data().learnerUid});
 return {packages:mine.docs.map(s=>packageView(s.data(),s.id)),teachingBookings:assigned.docs.map(book),learnerBookings:requested.docs.map(book)};
});
export const requestTutoringBooking=onCall({enforceAppCheck:true},async r=>{
 const uid=verified(r);await rateLimit(db,uid,"tutoring-book",5,3600);
 const x=z.object({packageId:id,topic:z.string().trim().min(5).max(350),preferredAt:z.string().datetime({offset:true})}).parse(r.data);
 const eligible=(await db.doc("tutoringEligibility/"+uid).get()).data();
 if(eligible?.status!=="verified")throw new HttpsError("permission-denied","Verified adult or guardian authorization required");
 const p=(await db.doc("tutoringPackages/"+x.packageId).get()).data();
 if(!p||p.status!=="published"||p.providerUid===uid)throw new HttpsError("failed-precondition","Package unavailable");
 const provider=(await db.doc("tutoringProviders/"+p.providerUid).get()).data();
 if(provider?.status!=="approved"||(provider.kind==="school"&&!provider.workspaceVerified))throw new HttpsError("failed-precondition","Provider unavailable");
 const timestamp=Date.parse(x.preferredAt);if(timestamp<Date.now()+3600000||timestamp>Date.now()+90*86400000)throw new HttpsError("invalid-argument","Choose a time between one hour and 90 days from now");
 const ref=db.collection("tutoringBookings").doc();
 await ref.set({learnerUid:uid,providerUid:p.providerUid,packageId:x.packageId,packageTitle:p.title,topic:x.topic,preferredAt:x.preferredAt,status:"requested",paymentStatus:"not_collected",meetingStatus:"not_provisioned",createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
 return {id:ref.id,status:"requested",paymentStatus:"not_collected"};
});
export const respondTutoringBooking=onCall({enforceAppCheck:true},async r=>{
 const uid=verified(r);const x=z.object({bookingId:id,decision:z.enum(["accepted","declined","cancelled"])}).parse(r.data);
 const ref=db.doc("tutoringBookings/"+x.bookingId);
 await db.runTransaction(async tx=>{
  const s=await tx.get(ref),b=s.data();if(!b)throw new HttpsError("not-found","Request not found");
  if(x.decision==="cancelled"&&b.learnerUid!==uid)throw new HttpsError("permission-denied","Learner only");
  if(x.decision!=="cancelled"&&b.providerUid!==uid)throw new HttpsError("permission-denied","Provider only");
  if(b.status!=="requested")throw new HttpsError("failed-precondition","Request already processed");
  tx.update(ref,{status:x.decision,updatedAt:FieldValue.serverTimestamp()});
 });
 return {status:x.decision};
});
const contactPattern=/(https?:\/\/|www\.|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(?:\+?\d[\d\s().-]{7,}\d))/i;
export const postTutoringMessage=onCall({secrets:[AI_KEY],enforceAppCheck:true},async r=>{
 const uid=verified(r);await rateLimit(db,uid,"tutoring-messages",15,60);
 const x=z.object({bookingId:id,text:z.string().trim().min(1).max(1200)}).parse(r.data);
 const booking=(await db.doc("tutoringBookings/"+x.bookingId).get()).data();
 if(!booking||booking.status!=="accepted"||![booking.learnerUid,booking.providerUid].includes(uid))throw new HttpsError("permission-denied","Accepted booking membership required");
 if(contactPattern.test(x.text))throw new HttpsError("permission-denied","Do not exchange contact details or external links in tutoring messages");
 const decision=await moderate(new OpenAI({apiKey:AI_KEY.value()}),db,uid,x.text,"input");
 if(decision.blocked||decision.escalate)throw new HttpsError("permission-denied","Message held for safety review");
 const ref=db.collection("tutoringBookings").doc(x.bookingId).collection("messages").doc();
 await ref.set({senderUid:uid,text:x.text,createdAt:FieldValue.serverTimestamp(),safetyStatus:"passed"});
 return {id:ref.id,status:"delivered"};
});
export const listTutoringMessages=onCall({enforceAppCheck:true},async r=>{
 const uid=uidOf(r);const x=z.object({bookingId:id}).parse(r.data);
 const booking=(await db.doc("tutoringBookings/"+x.bookingId).get()).data();
 if(!booking||![booking.learnerUid,booking.providerUid].includes(uid))throw new HttpsError("permission-denied","Not a booking participant");
 const docs=await db.collection("tutoringBookings").doc(x.bookingId).collection("messages").orderBy("createdAt","asc").limit(100).get();
 return {messages:docs.docs.map(s=>({id:s.id,senderUid:s.data().senderUid,text:s.data().text,at:s.data().createdAt?.toDate?.()?.toISOString?.()||null}))};
});
export const listTutoringModeration=onCall({enforceAppCheck:true},async r=>{
 await admin(r);const [p,packages,e]=await Promise.all([
  db.collection("tutoringProviders").where("status","==","pending").limit(40).get(),
  db.collection("tutoringPackages").where("status","==","pending_review").limit(40).get(),
  db.collection("tutoringEligibility").where("status","==","pending").limit(40).get()]);
 return {providers:p.docs.map(s=>({uid:s.id,kind:s.data().kind,name:s.data().name||s.data().schoolName,workspaceOrgId:s.data().workspaceOrgId||null,subjects:s.data().subjects||[],qualifications:s.data().qualifications||null,contactEmail:s.data().contactEmail||null})),packages:packages.docs.map(s=>packageView(s.data(),s.id)),eligibility:e.docs.map(s=>({uid:s.id,mode:s.data().mode,note:s.data().note||""}))};
});
