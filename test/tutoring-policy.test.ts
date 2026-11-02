import {describe,it,expect} from "vitest";
import {canPublishForProvider,containsExternalContact,validProposedTime} from "../functions/src/tutoring-policy";
describe("Funzi tutoring safeguards",()=>{
 it("denies unreviewed freelance tutors and schools",()=>{
  expect(canPublishForProvider(undefined)).toBe(false);
  expect(canPublishForProvider({kind:"tutor",status:"pending"})).toBe(false);
  expect(canPublishForProvider({kind:"school",status:"approved",workspaceVerified:false})).toBe(false);
  expect(canPublishForProvider({kind:"school",status:"approved",workspaceVerified:true})).toBe(true);
  expect(canPublishForProvider({kind:"tutor",status:"approved"})).toBe(true);
  expect(canPublishForProvider({kind:"tutor",status:"suspended"})).toBe(false);
 });
 it("blocks off-platform contact exchanges",()=>{
  for(const text of ["Use https://video.example","Email me at teacher@example.com","Call +254 712 345 678","www.example.com"])
   expect(containsExternalContact(text)).toBe(true);
  expect(containsExternalContact("Explain how fractions work, please.")).toBe(false);
 });
 it("keeps booking requests inside the allowed window",()=>{
  const t=Date.parse("2026-11-02T10:00:00Z");
  expect(validProposedTime(new Date(t+2*3600000).toISOString(),t)).toBe(true);
  expect(validProposedTime(new Date(t+1000).toISOString(),t)).toBe(false);
  expect(validProposedTime(new Date(t+100*86400000).toISOString(),t)).toBe(false);
  expect(validProposedTime("not-a-date",t)).toBe(false);
 });
});
