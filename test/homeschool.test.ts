import {homeschoolCatalog,isValidHomeLearningCatalogChoice} from "../functions/src/homeschoolCatalog";
import {describe,expect,it} from "vitest";
import {pathways,validatePlan,type LearnerPlan} from "../src/homeschoolCurricula";
import {studySchedule,curriculumBridge,projectsForSubject,progressMetrics} from "../src/homeschoolIntelligence";
const plan:LearnerPlan={pathway:"kenya-cbe",stage:"Primary",weeklyHours:12.5,language:"English",kenyaContext:true,subjects:["Mathematics","English","Integrated Science"]};
describe("Home education curriculum, scheduling and evidence",()=>{
 it("keeps server and client curriculum metadata synchronized",()=>{for(const p of pathways){expect(homeschoolCatalog[p.id]).toEqual({stages:p.stages,subjects:p.subjects,language:p.language});expect(isValidHomeLearningCatalogChoice({pathway:p.id,stage:p.stages[0],subjects:[p.subjects[0]],language:p.language[0]})).toBe(true)}expect(isValidHomeLearningCatalogChoice({pathway:"kenya-cbe",stage:"Primary",subjects:["Made-up"],language:"English"})).toBe(false)});
 it("lists Kenyan, Chinese, American and international pathways",()=>{
  for(const id of ["kenya-cbe","china-national","us-common-core","us-ngss","us-ap","cambridge","ib","pearson-edexcel","india-cbse","singapore-moe","south-africa-caps","australian-curriculum","canada-ontario","new-zealand","france-national"])expect(pathways.some(p=>p.id===id)).toBe(true);
 });
 it("accepts valid plan and rejects invalid stages and subjects",()=>{
  expect(validatePlan(plan)).toEqual(plan);
  expect(()=>validatePlan({...plan,stage:"Non-existent Stage"})).toThrow();
  expect(()=>validatePlan({...plan,subjects:["Unknown subject"]})).toThrow();
  expect(()=>validatePlan({...plan,weeklyHours:61})).toThrow();
  expect(()=>validatePlan({...plan,subjects:["Mathematics","Mathematics"]})).toThrow();
 });
 it("creates a complete five-day plan without allocating phantom minutes",()=>{
  const blocks=studySchedule(plan,40);
  expect(blocks.reduce((s,b)=>s+b.minutes,0)).toBe(750);
  expect(new Set(blocks.map(b=>b.day)).size).toBe(5);
  expect(blocks.every(b=>b.minutes<=40&&b.minutes>0&&b.context.includes("Kenyan"))).toBe(true);
  expect(()=>studySchedule(plan,0)).toThrow();
 });
 it("provides orientation not equivalence when moving to US or Chinese learning",()=>{
  const us=curriculumBridge("kenya-cbe","us-common-core");
  const china=curriculumBridge("kenya-cbe","china-national");
  expect(us.sharedThemes).toContain("mathematics");
  expect(china.studyGaps).toContain("Chinese Language");
  expect(china.warning).toContain("No grade equivalence");
 });
 it("offers supervised, age-appropriate Kenyan activities",()=>{
  const math=projectsForSubject("Mathematics");
  expect(math[0].title).toContain("Market");
  expect(math[0].steps.length).toBeGreaterThan(1);
  expect(projectsForSubject("Agriculture").length).toBeGreaterThan(0);
  expect(projectsForSubject("Chinese Language")[0].adultSupport.length).toBeGreaterThan(10);
 });
 it("separates reported work and guardian acknowledgements from accreditation",()=>{
  const sessions=[{minutes:45,completedOn:"2026-11-02",reviewStatus:"self_reported"},{minutes:30,completedOn:"2026-11-01",reviewStatus:"guardian_acknowledged"},{minutes:30,completedOn:"2026-10-17",reviewStatus:"guardian_acknowledged"}];
  const a=progressMetrics(sessions,10,new Date("2026-11-02T12:00:00Z"));
  expect(a.minutes).toBe(45);expect(a.acknowledged).toBe(0);expect(a.days).toBe(1);
 });
});