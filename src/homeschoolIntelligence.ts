import {pathways,validatePlan,type CurriculumId,type LearnerPlan} from "./homeschoolCurricula";
export type DailyLesson={day:string;sequence:number;subject:string;minutes:number;mode:"guided"|"practice"|"project";context:string;breakAfterMinutes:number};
const subjectGroup=(s:string):string=>{
 const t=s.toLowerCase();
 if(/mathematic|numeracy|calculus/.test(t))return "mathematics";
 if(/english|language arts|literacy/.test(t))return "english-literacy";
 if(/science|biology|chemistry|physics|earth|engineering/.test(t))return "science";
 if(/kiswahili|swahili/.test(t))return "kiswahili";
 if(/chinese|mandarin/.test(t))return "chinese";
 if(/history|social studies|societies/.test(t))return "humanities";
 if(/comput|information technology/.test(t))return "computing";
 if(/agricultur|nature studies|ecology/.test(t))return "environment";
 if(/art|creative/.test(t))return "creative";
 if(/business|econom/.test(t))return "business";
 return t.replace(/[^a-z]+/g,"-");
};
export function studySchedule(plan:LearnerPlan,lessonMinutes=30):DailyLesson[]{
 validatePlan(plan);
 if(!Number.isInteger(lessonMinutes)||lessonMinutes<10||lessonMinutes>90)throw Error("Lesson duration must be 10–90 minutes");
 const total=Math.round(plan.weeklyHours*60);
 const days=["Monday","Tuesday","Wednesday","Thursday","Friday"];
 const baseline=Math.floor(total/5),extra=total%5;
 let subjectCursor=0;
 const out:DailyLesson[]=[];
 for(let d=0;d<5;d++){
  let remaining=baseline+(d<extra?1:0),sequence=1;
  while(remaining>0){
   const minutes=Math.min(lessonMinutes,remaining);
   const subject=plan.subjects[subjectCursor%plan.subjects.length];
   out.push({day:days[d],sequence:sequence++,subject,minutes,
    mode:subjectCursor%5===4?"project":subjectCursor%2===0?"guided":"practice",
    context:plan.kenyaContext?"Use Kenyan examples and locally available materials where appropriate.":"Use the selected curriculum's own examples.",
    breakAfterMinutes:remaining>minutes?5:0});
   remaining-=minutes;subjectCursor++;
  }
 }
 return out;
}
export type BridgeComparison={source:string;target:string;sharedThemes:string[];studyGaps:string[];uniqueSource:string[];warning:string;};
export function curriculumBridge(from:CurriculumId,to:CurriculumId):BridgeComparison{
 const a=pathways.find(x=>x.id===from),b=pathways.find(x=>x.id===to);
 if(!a||!b)throw Error("Unknown curriculum");
 const groupA=new Set(a.subjects.map(subjectGroup));
 const groupB=new Set(b.subjects.map(subjectGroup));
 return {
  source:a.name,target:b.name,
  sharedThemes:[...groupA].filter(x=>groupB.has(x)).map(x=>x.replace(/-/g," ")),
  studyGaps:b.subjects.filter(x=>!groupA.has(subjectGroup(x))),
  uniqueSource:a.subjects.filter(x=>!groupB.has(subjectGroup(x))),
  warning:"Subject-level orientation only. No grade equivalence, transfer credit, examination eligibility or accredited crosswalk is implied. Compare the official stage-by-stage learning standards with a qualified educator."
 };
}
export type HomeProject={title:string;subjectArea:string;question:string;steps:string[];evidence:string;adultSupport:string;materials:string[];};
const projectBank:HomeProject[]=[
 {title:"Market-day arithmetic",subjectArea:"mathematics",question:"How do prices, discounts and change work in a local market?",steps:["Choose five grocery items and assign realistic KES prices.","Calculate totals, change and a percentage discount.","Explain each method and check the calculations."],evidence:"Photograph a handwritten price table or write a solution.",adultSupport:"Work with a guardian; never spend money without permission.",materials:["Paper","Pencil","Calculator (optional)"]},
 {title:"Water-use investigation",subjectArea:"science",question:"How can a household estimate daily water consumption?",steps:["Measure a small sample using a safe measuring jug.","Estimate litres for ordinary household activities without handling unsafe water.","Make a graph and suggest responsible conservation ideas."],evidence:"Table, graph and reflection.",adultSupport:"A guardian supervises water measurements.",materials:["Measuring cup","Paper"]},
 {title:"Kenyan ecology observations",subjectArea:"environment",question:"Which plants and animals are visible in a nearby safe environment?",steps:["Observe from a safe supervised location.","Sketch three organisms and record habitats.","Explain how climate and human activity affect them."],evidence:"Sketchbook with dated observations.",adultSupport:"Stay with a guardian; avoid wild animals, unsafe roads and unknown plants.",materials:["Notebook","Pencil"]},
 {title:"Build a bilingual story",subjectArea:"english-literacy",question:"How does meaning change between English and Kiswahili?",steps:["Write a short original story set in your community.","Translate five sentences into Kiswahili with adult guidance.","Read aloud and reflect on different expressions."],evidence:"Original writing and translated sentences.",adultSupport:"A parent or educator checks translations.",materials:["Notebook"]},
 {title:"Map a community service",subjectArea:"humanities",question:"How do schools, libraries and clinics serve a neighborhood?",steps:["Draw a fictionalized map; do not record real home addresses.","Mark general services and discuss travel barriers.","Suggest one inclusive improvement."],evidence:"Map and short written explanation.",adultSupport:"Do not share identifiable places or people's private information online.",materials:["Paper","Ruler"]},
 {title:"Build a no-code algorithm",subjectArea:"computing",question:"How do precise instructions change a result?",steps:["Write an algorithm for sorting cards by number.","Ask a family member to follow the exact instructions.","Find ambiguous steps and improve them."],evidence:"Before/after pseudocode.",adultSupport:"No computer or internet required.",materials:["Numbered paper cards"]},
 {title:"Pattern and shape art",subjectArea:"creative",question:"How do symmetry and repetition create visual designs?",steps:["Observe geometric patterns from familiar surroundings.","Sketch a new original pattern with at least two symmetries.","Explain the repeated shapes."],evidence:"Original artwork and reflection.",adultSupport:"Use safe, age-appropriate tools only.",materials:["Paper","Coloured pencils"]},
 {title:"Mandarin everyday phrases",subjectArea:"chinese",question:"How are greetings and numbers expressed in Mandarin?",steps:["Practice short greetings and counting with a vetted learning resource.","Write the corresponding English or Kiswahili meanings.","Record a private pronunciation reflection; do not upload without adult consent."],evidence:"Phrase glossary and self-reflection.",adultSupport:"A qualified Mandarin instructor should confirm pronunciation and meaning.",materials:["Notebook","Approved learning resource"]},
 {title:"Grow a seed observation log",subjectArea:"science",question:"What conditions support plant growth?",steps:["Place common edible seeds on damp tissue using clean water.","Observe over several days without ingesting the experimental seeds.","Record changes and distinguish observation from hypothesis."],evidence:"Dated diagram and simple growth chart.",adultSupport:"Avoid mold, chemicals and unknown seeds; discard spoiled samples safely.",materials:["Approved edible seeds","Tissue","Clean container"]},
];
export function projectsForSubject(subject:string):HomeProject[]{
 const group=subjectGroup(subject);
 const byGroup=projectBank.filter(p=>p.subjectArea===group);
 if(byGroup.length)return byGroup;
 return [{title:"Community inquiry portfolio",subjectArea:group,question:"How does "+subject+" connect to life in your community?",steps:["Choose an age-appropriate question with a guardian.","Gather safe observations using approved resources.","Create a drawing or short explanation and reflect on what remains uncertain."],evidence:"Written reflection, drawing or portfolio entry.",adultSupport:"Guardian supervision required; avoid collecting personal data.",materials:["Notebook","Pencil"]}];
}
export function progressMetrics(sessions:{minutes:number;completedOn:string;reviewStatus?:string}[],weeklyHours:number,now=new Date()){
 const date=new Date(now.getTime());
 const day=(date.getUTCDay()+6)%7;
 date.setUTCDate(date.getUTCDate()-day);date.setUTCHours(0,0,0,0);
 const start=date.toISOString().slice(0,10);
 const thisWeek=sessions.filter(s=>s.completedOn>=start&&s.completedOn<=now.toISOString().slice(0,10));
 const minutes=thisWeek.reduce((sum,s)=>sum+Math.max(0,Number(s.minutes)||0),0);
 const goal=Math.round(weeklyHours*60);
 return {minutes,goal,percent:goal?Math.min(100,Math.round(minutes/goal*100)):0,days:[...new Set(thisWeek.map(s=>s.completedOn))].length,acknowledged:thisWeek.filter(s=>s.reviewStatus==="guardian_acknowledged").length};
}
