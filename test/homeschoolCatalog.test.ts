import {describe,it,expect} from "vitest";
import {HOMESCHOOL_TRACKS,KENYA_LOCAL_LAYER,buildHomeWeek,curriculumCompare,trackById} from "../src/homeschoolCatalog";
describe("Kenya-local global homeschool catalog",()=>{
 it("provides unique official-source references rather than claimed accreditation",()=>{
  expect(HOMESCHOOL_TRACKS.length).toBeGreaterThanOrEqual(15);
  expect(new Set(HOMESCHOOL_TRACKS.map(t=>t.id)).size).toBe(HOMESCHOOL_TRACKS.length);
  for(const t of HOMESCHOOL_TRACKS){
   expect(t.stages.length).toBeGreaterThan(0);
   expect(t.subjects.length).toBeGreaterThan(0);
   expect(new URL(t.officialSource).protocol).toBe("https:");
   expect(t.status).toBe("reference");
   expect(t.qualificationNote.length).toBeGreaterThan(25);
  }
 });
 it("contains Kenya, US and China as distinct frameworks",()=>{
  expect(trackById("kenya-cbe")?.region).toBe("Kenya");
  expect(trackById("us-k12")?.subjects).toContain("Earth and Space Science");
  expect(trackById("china-compulsory")?.referenceVersion).toContain("2022");
  expect(KENYA_LOCAL_LAYER.contexts.some(x=>x.includes("Rift Valley"))).toBe(true);
 });
 it("does not assert official cross-system equivalence",()=>{
  const comparison=curriculumCompare("kenya-cbe","china-compulsory");
  expect(comparison?.requiresHumanReview).toBe(true);
  expect(comparison?.comparison).toContain("not been verified");
  expect(curriculumCompare("unknown","china-compulsory")).toBe(null);
 });
 it("creates a five-day, Kenya-adapted and time-bounded schedule",()=>{
  const tasks=buildHomeWeek({subjects:["Mathematics","English","Science"],minutesPerDay:150,daysPerWeek:5,includeKenya:true});
  expect(tasks).toHaveLength(15);
  for(let day=0;day<5;day++){
   const entries=tasks.filter(t=>t.day===day);
   expect(entries.reduce((sum,t)=>sum+t.minutes,0)).toBe(150);
   expect(entries.filter(t=>t.isKenyaLayer)).toHaveLength(1);
   expect(entries.every(t=>t.standardsVerified===false)).toBe(true);
  }
 });
 it("respects optional Kenya layer and avoids negative allocations",()=>{
  const result=buildHomeWeek({subjects:["Mathematics"],minutesPerDay:30,daysPerWeek:6,includeKenya:false});
  expect(result).toHaveLength(6);
  expect(result.every(t=>t.minutes===30&&!t.isKenyaLayer)).toBe(true);
  expect(buildHomeWeek({subjects:[],minutesPerDay:100,daysPerWeek:5,includeKenya:true})).toEqual([]);
 });
});
