import React,{useEffect,useMemo,useState} from "react";
import {getFunctions,httpsCallable} from "firebase/functions";
import {app} from "./firebase";
import {tutor} from "./api";
import {HOMESCHOOL_TRACKS,KENYA_LOCAL_LAYER,buildHomeWeek,curriculumCompare,trackById} from "./homeschoolCatalog";

const firebaseFunctions=getFunctions(app);
const invoke=async(name:string,data:any={})=>(await httpsCallable<any,any>(firebaseFunctions,name)(data)).data;
type Learner={id:string;alias:string;curriculum:string;stage:string;additionalCurricula:string[];subjects:string[];daysPerWeek:number;minutesPerDay:number;termWeeks:number;languages:string[];learningGoals:string;includeKenya:boolean;status:string};
const starter=()=>({alias:"",curriculum:"kenya-cbe",stage:HOMESCHOOL_TRACKS[0].stages[2],additionalCurricula:[] as string[],subjects:HOMESCHOOL_TRACKS[0].subjects.slice(0,4),daysPerWeek:5,minutesPerDay:150,termWeeks:12,languages:["English","Kiswahili"],learningGoals:"",includeKenya:true});
const todayInKenya=()=>new Date().toLocaleDateString("sv-SE",{timeZone:"Africa/Nairobi"});
const fmtError=(e:any)=>String(e?.message||e).replace(/^FirebaseError:\s*/,"");
const isVerifiedUrl=(url:string)=>{try{const u=new URL(url);return u.protocol==="https:"}catch{return false}};
const options=[["lesson","Lesson"],["reading","Reading"],["quiz","Practice check"],["project","Project"],["fieldwork","Fieldwork"],["practical","Practical"],["portfolio","Portfolio"],["wellbeing","Wellbeing"]];
export default function HomeschoolHub(){
 const [draft,setDraft]=useState(starter()),[adult,setAdult]=useState(false),[editing,setEditing]=useState(""),[profiles,setProfiles]=useState<Learner[]>([]),[active,setActive]=useState(""),[report,setReport]=useState<any>(null),[loading,setLoading]=useState(false),[status,setStatus]=useState(""),[showCatalog,setShowCatalog]=useState(false);
 const [compareTo,setCompareTo]=useState("us-k12"),[practice,setPractice]=useState(""),[practiceBusy,setPracticeBusy]=useState(false);
 const [log,setLog]=useState({date:todayInKenya(),subject:"",kind:"lesson",description:"",minutes:30,confidence:"developing",score:""});
 const selected=profiles.find(p=>p.id===active);
 const catalog=trackById(draft.curriculum)||HOMESCHOOL_TRACKS[0];
 const currentTrack=trackById(selected?.curriculum||draft.curriculum)||catalog;
 const schedule=useMemo(()=>buildHomeWeek(selected?selected:draft),[selected,draft]);
 const comparison=curriculumCompare(selected?.curriculum||draft.curriculum,compareTo);
 async function load(preferId?:string){
  try{const data=await invoke("listHomeschoolLearners");setProfiles(data.learners||[]);
   setActive(prev=>preferId||(data.learners||[]).find((p:Learner)=>p.id===prev)?.id||data.learners?.[0]?.id||"");
  }catch(e){setStatus(fmtError(e))}
 }
 useEffect(()=>{void load()},[]);
 useEffect(()=>{if(!active){setReport(null);return}void invoke("getHomeschoolReport",{learnerId:active}).then(setReport).catch(e=>setStatus(fmtError(e)))},[active]);
 function chooseCurriculum(id:string){const t=trackById(id);if(!t)return;setDraft(d=>({...d,curriculum:id,stage:t.stages[0],subjects:t.subjects.slice(0,4),additionalCurricula:d.additionalCurricula.filter(v=>v!==id)}))}
 function edit(p:Learner){setEditing(p.id);setDraft({alias:p.alias,curriculum:p.curriculum,stage:p.stage,additionalCurricula:p.additionalCurricula,subjects:p.subjects,daysPerWeek:p.daysPerWeek,minutesPerDay:p.minutesPerDay,termWeeks:p.termWeeks,languages:p.languages,learningGoals:p.learningGoals,includeKenya:p.includeKenya});setAdult(false)}
 async function save(){
  if(!adult){setStatus("An adult parent/guardian must attest before creating a home-learning profile.");return}
  setLoading(true);setStatus("");
  try{
   const result=await invoke("upsertHomeschoolLearner",{...draft,...(editing?{learnerId:editing}:{}),adultAttestation:true});
   await load(result.id);setEditing("");setDraft(starter());setAdult(false);
   setStatus("Home-learning profile saved. Curriculum references are not an accredited programme or official syllabus import.");
  }catch(e){setStatus(fmtError(e))}finally{setLoading(false)}
 }
 async function submitEvidence(){
  if(!selected)return;
  setLoading(true);setStatus("");
  try{
   await invoke("recordHomeschoolEvidence",{learnerId:selected.id,date:log.date,subject:log.subject||selected.subjects[0],kind:log.kind,
    description:log.description,minutes:log.minutes,confidence:log.confidence,...(log.score.trim()?{score:Number(log.score)}:{})});
   const data=await invoke("getHomeschoolReport",{learnerId:selected.id});setReport(data);
   setStatus("Family-reported learning evidence recorded. This is not a formal assessment.");
   setLog(v=>({...v,description:"",score:""}));
  }catch(e){setStatus(fmtError(e))}finally{setLoading(false)}
 }
 async function useAI(subject:string,context:string){
  if(!selected)return;setPracticeBusy(true);setPractice("");
  try{
   const prompt=`You are supporting a parent-led, Kenyan-context homeschool activity, NOT issuing school credentials. Framework: ${currentTrack.label}; stage ${selected.stage}; subject ${subject}. Give an engaging, culturally respectful 15-minute Socratic activity relevant to Kenya, using KES and SI units where applicable, and a simple home experiment or exercise with a safety note. Context inspiration: ${context}. Learner languages ${selected.languages.join(", ")}. These are unverified curriculum references, so do not claim a specific official outcome has been satisfied or copy protected textbooks. Provide short questions first, parent guidance and optional extension. Never give personal information or request a child's identity.`;
   const r:any=await tutor(prompt);setPractice(r.text||"No response available");
  }catch(e){setPractice(fmtError(e))}finally{setPracticeBusy(false)}
 }
 const scheduleDays=[...new Set(schedule.map(t=>t.day))];
 return <div className="homeschoolHub">
  <section className="panel"><span className="eyebrow">FUNZI HOME LEARNING · GLOBAL + KENYAN CONTEXT</span><h2>Homeschooling companion for Kenyan families</h2>
   <p>Select a curriculum pathway, organize a flexible timetable, learn with Funzi AI, and collect a parent-reviewed learning portfolio. A curriculum reference does not confer school recognition, an examination entry, an accredited diploma, or authorization to operate a school.</p>
   <p className="muted">Home education requirements in Kenya can be legally complex. Confirm your family's education obligations and assessment eligibility with the appropriate Kenyan authorities and an education-law professional.</p>
   {status&&<p role="status">{status}</p>}
  </section>
  <section className="grid"><article className="panel"><h2>Household learner profiles</h2><p className="muted">Managed by the signed-in adult account. A nickname is sufficient; do not enter a child's full legal identity.</p>
   <div className="formGrid"><select aria-label="Select learner profile" value={active} onChange={e=>setActive(e.target.value)}>
    <option value="">Choose a home learner</option>{profiles.map(p=><option value={p.id} key={p.id}>{p.alias} — {trackById(p.curriculum)?.label}</option>)}</select>
    {selected&&<button className="secondary" onClick={()=>edit(selected)}>Edit selected learner plan</button>}
    <button className="secondary" onClick={()=>{setEditing("");setDraft(starter());setAdult(false)}}>New learner plan</button></div>
   <h3>{editing?"Edit plan":"Create a learner plan"}</h3>
   <div className="formGrid"><label>Learner nickname<input value={draft.alias} maxLength={60} placeholder="e.g. Learner A" onChange={e=>setDraft(v=>({...v,alias:e.target.value}))}/></label>
    <label>Primary curriculum pathway<select value={draft.curriculum} onChange={e=>chooseCurriculum(e.target.value)}>{HOMESCHOOL_TRACKS.filter(t=>t.specialization!=="pedagogy").map(t=><option value={t.id} key={t.id}>{t.label}</option>)}</select></label>
    <label>Learning stage<select value={draft.stage} onChange={e=>setDraft(v=>({...v,stage:e.target.value}))}>{catalog.stages.map(s=><option value={s} key={s}>{s}</option>)}</select></label>
    <fieldset><legend>Subjects to study</legend><div className="homeChecks">{catalog.subjects.map(subject=><label key={subject}><input type="checkbox" checked={draft.subjects.includes(subject)} onChange={e=>setDraft(v=>({...v,subjects:e.target.checked?[...v.subjects,subject]:v.subjects.filter(x=>x!==subject)}))}/> {subject}</label>)}</div></fieldset>
    <fieldset><legend>Additional curriculum comparisons (optional)</legend><div className="homeChecks">{HOMESCHOOL_TRACKS.filter(t=>t.id!==draft.curriculum).map(t=><label key={t.id}><input type="checkbox" checked={draft.additionalCurricula.includes(t.id)} onChange={e=>setDraft(v=>({...v,additionalCurricula:e.target.checked?[...v.additionalCurricula,t.id].slice(0,3):v.additionalCurricula.filter(x=>x!==t.id)}))}/> {t.label}</label>)}</div></fieldset>
    <label>Learning languages<input value={draft.languages.join(", ")} onChange={e=>setDraft(v=>({...v,languages:e.target.value.split(",").map(s=>s.trim()).filter(Boolean).slice(0,4)}))}/></label>
    <label>Learning days per week<input type="number" min={1} max={6} value={draft.daysPerWeek} onChange={e=>setDraft(v=>({...v,daysPerWeek:+e.target.value}))}/></label>
    <label>Daily study minutes<input type="number" min={30} max={360} value={draft.minutesPerDay} onChange={e=>setDraft(v=>({...v,minutesPerDay:+e.target.value}))}/></label>
    <label>Term length (weeks)<input type="number" min={4} max={24} value={draft.termWeeks} onChange={e=>setDraft(v=>({...v,termWeeks:+e.target.value}))}/></label>
    <label>Family learning goals<textarea value={draft.learningGoals} maxLength={1500} onChange={e=>setDraft(v=>({...v,learningGoals:e.target.value}))} placeholder="Reading fluency, robotics, KCSE revision or Cambridge preparation..."/></label>
    <label><input type="checkbox" checked={draft.includeKenya} onChange={e=>setDraft(v=>({...v,includeKenya:e.target.checked}))}/> Include Kenya-specific language, history, science and practical application time</label>
    <label><input type="checkbox" checked={adult} onChange={e=>setAdult(e.target.checked)}/> I am an adult responsible for this home-learning plan; I understand Funzi is not verifying guardianship or providing an official qualification.</label>
    <button className="primary" disabled={loading||!draft.alias.trim()||!draft.subjects.length||!adult} onClick={save}>{loading?"Saving…":editing?"Update learner plan":"Create learner plan"}</button>
   </div>
  </article>
  <article className="panel"><h2>Curriculum reference library</h2><p>{HOMESCHOOL_TRACKS.length} curated curriculum and pedagogy references; detailed official outcomes and content licensing require separate verification.</p>
   <button onClick={()=>setShowCatalog(v=>!v)} className="secondary">{showCatalog?"Hide catalog":"Browse curriculum sources"}</button>
   {(showCatalog?[...HOMESCHOOL_TRACKS]:[catalog]).map(c=><div className="task" key={c.id}><span>◉</span><div><b>{c.label}</b><small>{c.region} · {c.stages.join(" · ")}</small><p>{c.qualificationNote}</p>{isVerifiedUrl(c.officialSource)&&<a href={c.officialSource} target="_blank" rel="noopener noreferrer">Official publisher reference</a>}</div></div>)}
   <h3>Cross-curriculum comparison</h3><select value={compareTo} onChange={e=>setCompareTo(e.target.value)} aria-label="Compare curricula">{HOMESCHOOL_TRACKS.map(t=><option value={t.id} key={t.id}>{t.label}</option>)}</select>
   {comparison&&<><p><b>Overlapping subject labels:</b> {comparison.sharedSubjects.length?comparison.sharedSubjects.join(", "):"No exact subject-label overlaps; content could still be related."}</p><p className="muted">{comparison.comparison}</p></>}
   <h3>Kenya-local learning layer</h3><p>{KENYA_LOCAL_LAYER.subjects.join(" · ")}</p><p className="muted">Use Kenyan geography, farms, public transport, nature, culture, KES and SI measures as age-appropriate examples without replacing the selected curriculum's assessment objectives.</p>
  </article></section>
  {selected&&<><section className="panel"><span className="eyebrow">FAMILY-LED WEEKLY PLAN · REFERENCE-BASED</span><h2>{selected.alias}'s weekly homeschooling timetable</h2>
   <p>Primary pathway: <b>{currentTrack.label}</b> · {selected.stage} · {selected.daysPerWeek} days/week · {selected.minutesPerDay} minutes/day · {selected.termWeeks}-week term.</p>
   <p className="muted">Illustrative learning allocation, not a certified syllabus or officially mapped learning outcome. Adjust pacing for the learner and seek teacher input when needed.</p>
   <div className="homeWeek">{scheduleDays.map(day=><div className="homeDay" key={day}><h3>{schedule.find(t=>t.day===day)?.dayName}</h3>{schedule.filter(t=>t.day===day).map((t,i)=><div className="task" key={i}><span>{t.minutes}m</span><div><b>{t.subject}{t.isKenyaLayer?" · Kenya layer":""}</b><small>{t.activity}</small><small>Example: {t.kenyaContext}</small><button disabled={practiceBusy} onClick={()=>useAI(t.subject,t.kenyaContext)} className="secondary">Guide this lesson with Funzi AI</button></div></div>)}</div>)}</div>
   {practice&&<section className="route"><h3>Funzi AI activity (parent review required)</h3><p style={{whiteSpace:"pre-wrap"}}>{practice}</p></section>}
   <button className="secondary" onClick={()=>window.print()}>Print this family study timetable</button>
  </section>
  <section className="grid"><article className="panel"><h2>Family learning journal</h2>
    <p>Log completed lessons, science practicals, fieldwork, reading and projects. Records are labelled parent-reported rather than teacher-verified.</p>
    <div className="formGrid"><label>Date<input type="date" value={log.date} onChange={e=>setLog(v=>({...v,date:e.target.value}))}/></label>
    <label>Subject<select value={log.subject||selected.subjects[0]} onChange={e=>setLog(v=>({...v,subject:e.target.value}))}>{[...new Set([...selected.subjects,...(selected.includeKenya?KENYA_LOCAL_LAYER.subjects:[])])].map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Evidence type<select value={log.kind} onChange={e=>setLog(v=>({...v,kind:e.target.value}))}>{options.map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label>
    <label>Minutes completed<input type="number" min={1} max={360} value={log.minutes} onChange={e=>setLog(v=>({...v,minutes:+e.target.value}))}/></label>
    <label>Parent-observed confidence<select value={log.confidence} onChange={e=>setLog(v=>({...v,confidence:e.target.value}))}><option value="needs_help">Needs help</option><option value="developing">Developing</option><option value="confident">Confident</option></select></label>
    <label>Optional practice score (%)<input type="number" min={0} max={100} value={log.score} onChange={e=>setLog(v=>({...v,score:e.target.value}))}/></label>
    <label>What was learned or demonstrated?<textarea value={log.description} onChange={e=>setLog(v=>({...v,description:e.target.value}))} placeholder="Describe an activity, concept, reading reflection or practical experiment. Avoid identity or sensitive records."/></label>
    <button disabled={loading||log.description.length<5} onClick={submitEvidence} className="primary">Record family learning evidence</button></div>
  </article><article className="panel"><h2>Parent learning report</h2>
    {report?<><div className="metrics"><article><span>Logged study time</span><strong>{report.minutesLogged}</strong><small>minutes</small></article><article><span>Activity records</span><strong>{report.sessionsLogged}</strong><small>parent-reported</small></article><article><span>Learning days</span><strong>{report.distinctDates}</strong><small>recorded dates</small></article></div>
      <h3>Subject coverage</h3>{Object.entries(report.bySubject||{}).map(([subject,count])=><p key={subject}>{subject} — {String(count)} record(s)</p>)}
      <h3>Recent activities</h3>{report.evidence?.slice(0,12).map((e:any)=><div className="task" key={e.id}><span>◉</span><div><b>{e.subject} · {e.date}</b><small>{e.kind} · {e.minutes} minutes · {e.confidence||"unrated"}</small><p>{e.description}</p></div></div>)}
      {report.truncated&&<p>Only the 200 latest records are included in this summary.</p>}
      <p className="muted">{report.notice}</p>
      <button className="secondary" onClick={()=>window.print()}>Print family-reported learning summary</button>
      </>:<p className="muted">Your progress journal appears here after you log learning activities.</p>}
    <p className="muted">Personalized homeschool data is confined to the signed-in household account through server-side authorization; children should not share the adult's login.</p>
  </article></section></>}
 </div>;
}
