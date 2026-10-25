// Server-side Funzi adapter for TeknTandao School Management.
// Never bundle or import this module into a browser-facing React component.
// The caller supplies a freshly minted Firebase ID token for the dedicated
// Funzi identity authorized in the school's TeknTandao workspace.
export async function fetchTeknTandaoSchoolFeed({
  endpoint, idToken, orgId, type, className, afterId, limit=50, fetchImpl=fetch
}) {
  if(typeof endpoint!=='string'||!/^https:\/\//.test(endpoint))
    throw new Error('HTTPS TeknTandao callable endpoint required');
  if(typeof idToken!=='string'||!idToken)throw new Error('Funzi service ID token required');
  if(!['lessons','assignments','announcements'].includes(type))
    throw new Error('Unsupported curriculum feed');
  if(typeof orgId!=='string'||!orgId||typeof className!=='string'||!className)
    throw new Error('Workspace and class required');
  if(!Number.isInteger(limit)||limit<1||limit>100)throw new Error('Invalid page limit');
  const response=await fetchImpl(endpoint,{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${idToken}`},
    body:JSON.stringify({data:{orgId,type,className,limit,...(afterId?{afterId}:{})}})
  });
  const payload=await response.json();
  if(!response.ok||payload.error)
    throw new Error(`TeknTandao school feed failed: ${payload.error?.message||response.status}`);
  const result=payload.result;
  if(result?.schemaVersion!==1||result.orgId!==orgId||result.className!==className||
     result.type!==type||!Array.isArray(result.items))
    throw new Error('Unexpected school feed response schema');
  return result;
}
export async function fetchAllTeknTandaoClassContent(args,{maxPages=30}={}){
  if(!Number.isInteger(maxPages)||maxPages<1||maxPages>100)
    throw new Error('Invalid sync page cap');
  const items=[],seen=new Set();
  let afterId;
  for(let i=0;i<maxPages;i++){
    const page=await fetchTeknTandaoSchoolFeed({...args,afterId});
    for(const entry of page.items){
      if(typeof entry?.id!=='string'||seen.has(entry.id))
        throw new Error('Duplicate or invalid school feed item');
      seen.add(entry.id);
      items.push(entry);
    }
    if(!page.nextCursor)return {items,complete:true};
    if(page.nextCursor===afterId||seen.has(page.nextCursor)===false)
      throw new Error('Invalid school sync cursor');
    afterId=page.nextCursor;
  }
  throw new Error('School sync exceeded allowed page count; no partial import should be committed');
}
