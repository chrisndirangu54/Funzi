// Pure, testable safeguards shared by the tutoring callables.
export type Publisher={kind?:string;status?:string;workspaceVerified?:boolean}|undefined|null;
export function canPublishForProvider(provider:Publisher):boolean{
 return provider?.status==="approved"&&(provider.kind!=="school"||provider.workspaceVerified===true);
}
const contactPattern=/(https?:\/\/|www\.|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|(?:\+?\d[\d\s().-]{7,}\d))/i;
export function containsExternalContact(text:string):boolean{return contactPattern.test(text);}
export function validProposedTime(iso:string,now=Date.now()):boolean{
 const ts=Date.parse(iso);return Number.isFinite(ts)&&ts>=now+3600000&&ts<=now+90*86400000;
}
