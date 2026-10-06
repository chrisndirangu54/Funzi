export type SensorSample={sensorId:string;quantity:string;unit:string;value:number;timestamp:number};
export interface SensorAdapter{connect():Promise<void>;disconnect():Promise<void>;read():Promise<SensorSample[]>}
export type CollaborationRole="experimenter"|"recorder"|"analyst"|"reviewer";
export type LabSessionMember={uid:string;role:CollaborationRole;joinedAt:number};
export type LabSession={id:string;labId:string;ownerUid:string;members:LabSessionMember[];state:"setup"|"running"|"analysis"|"submitted";};
export function parseCsv(text:string){const rows=text.trim().split(/\r?\n/).map(r=>r.split(",").map(x=>x.trim()));if(rows.length<2)return[];const headers=rows[0];return rows.slice(1).map(row=>Object.fromEntries(headers.map((h,i)=>[h,Number.isFinite(Number(row[i]))?Number(row[i]):row[i]??""])))}
export type PortfolioLabEvidence={labId:string;notebookId:string;skillIds:string[];competencyIds:string[];rubricScore:number;artifactRefs:string[];teacherVerified:boolean};