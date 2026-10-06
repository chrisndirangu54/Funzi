export type SimVariable={id:string;label:string;unit?:string;min:number;max:number;step:number;default:number;role:"independent"|"control"};
export type SimOutput={id:string;label:string;unit?:string;formula:string;precision?:number};
export type ExperimentStep={id:string;instruction:string;checkpoint?:string};
export type ScienceSimulation={id:string;title:string;subject:string;skillId:string;grade:number;objective:string;hypothesisPrompt:string;apparatus:string[];variables:SimVariable[];outputs:SimOutput[];steps:ExperimentStep[];hazards:string[];safety:string[];explanation:string;};
const allowed=/^[0-9a-zA-Z_+\-*/()., <>=?:%]*$/;
export function evaluateFormula(formula:string,vars:Record<string,number>){if(!allowed.test(formula))throw new Error("Unsafe formula");const names=Object.keys(vars);if(names.some(n=>!/^[A-Za-z_][A-Za-z0-9_]*$/.test(n)))throw new Error("Invalid variable");const fn=Function(...names,`"use strict";return Number(${formula})`);const n=fn(...names.map(k=>vars[k]));if(!Number.isFinite(n))throw new Error("Non-finite result");return n}
export function simulate(s:ScienceSimulation,vars:Record<string,number>){return Object.fromEntries(s.outputs.map(o=>{const n=evaluateFormula(o.formula,vars);return[o.id,Number(n.toFixed(o.precision??2))]}))}
export function initialVariables(s:ScienceSimulation){return Object.fromEntries(s.variables.map(v=>[v.id,v.default]))}