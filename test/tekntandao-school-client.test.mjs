import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fetchTeknTandaoSchoolFeed,fetchAllTeknTandaoClassContent} from '../server/tekntandao-school-client.mjs';
const base={endpoint:'https://europe-west1-example.cloudfunctions.net/funziSchoolFeed',idToken:'test-token',orgId:'school1',type:'lessons',className:'Form 1'};
test('Funzi client sends a scoped authenticated callable request',async()=>{
 let body,auth;
 const fetchImpl=async (url,options)=>{body=JSON.parse(options.body);auth=options.headers.Authorization;
   return {ok:true,json:async()=>({result:{schemaVersion:1,orgId:'school1',type:'lessons',className:'Form 1',items:[],nextCursor:null}})};};
 const result=await fetchTeknTandaoSchoolFeed({...base,fetchImpl});
 assert.equal(auth,'Bearer test-token');
 assert.equal(body.data.className,'Form 1');
 assert.equal(result.items.length,0);
});
test('Funzi client rejects failed authorization and unscoped results',async()=>{
 await assert.rejects(fetchTeknTandaoSchoolFeed({...base,fetchImpl:async()=>({ok:false,status:403,json:async()=>({error:{message:'Denied'}})})}),/Denied/);
 await assert.rejects(fetchTeknTandaoSchoolFeed({...base,fetchImpl:async()=>({ok:true,json:async()=>({result:{schemaVersion:1,orgId:'other',type:'lessons',className:'Form 1',items:[]}})})}),/schema/);
});
test('full sync paginates and collects class content',async()=>{
 let n=0;
 const fetchImpl=async()=>({ok:true,json:async()=>({result:{schemaVersion:1,orgId:'school1',type:'lessons',className:'Form 1',
   items:[{id:n++===0?'a':'b'}],nextCursor:n===1?'a':null}})});
 const result=await fetchAllTeknTandaoClassContent({...base,fetchImpl});
 assert.deepEqual(result.items.map(x=>x.id),['a','b']);
});
