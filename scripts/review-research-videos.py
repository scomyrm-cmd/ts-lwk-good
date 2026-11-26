import concurrent.futures,json,re,urllib.request,sys
from pathlib import Path
root=Path(sys.argv[1])
audit=json.loads((root/'audit.json').read_text());vids=[r for r in audit if r['type']=='video']
def inspect(r):
 id=re.search(r'(?:embed/|v=)([\w-]{11})',r['url'])[1]
 text=(root/(r['id']+'.raw')).read_text(errors='replace')
 if r['id'] not in ['V01','V02']:
  try:
   with urllib.request.urlopen('https://www.youtube.com/watch?v='+id,timeout=25) as resp:text=resp.read(5000000).decode('utf8',errors='replace')
  except Exception as e:return {'id':r['id'],'original':r['url'],'videoId':id,'error':str(e),'review':'unavailable; individual school connection not established'}
 result={'id':r['id'],'original':r['url'],'videoId':id,'normalizedWatchUrl':'https://www.youtube.com/watch?v='+id}
 for name in ['playabilityStatus','videoDetails','microformat']:
  m=re.search('"'+name+'":',text)
  if m:
   try:result[name]=json.JSONDecoder().raw_decode(text[m.end():])[0]
   except:pass
 if 'videoDetails' in result:result['videoDetails']={k:result['videoDetails'].get(k) for k in ['videoId','title','author','shortDescription','lengthSeconds']}
 if 'microformat' in result:result['microformat']= {k:result['microformat'].get('playerMicroformatRenderer',{}).get(k) for k in ['publishDate','uploadDate','category','isFamilySafe']}
 return result
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(inspect,vids))
(root/'videos.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print(json.dumps([{**r,'videoDetails':{k:v for k,v in r.get('videoDetails',{}).items() if k!='shortDescription'}} for r in results],ensure_ascii=False,indent=2))
