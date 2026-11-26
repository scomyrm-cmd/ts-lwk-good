"""Audit the supplied dossier without publishing third-party media files.
Usage: python scripts/audit-research.py [scratch-output-directory]
"""
import concurrent.futures, datetime, hashlib, html, json, re, sys, urllib.request, urllib.parse
from pathlib import Path
root=Path(__file__).resolve().parents[1]
report=(root/'docs/research/report.md').read_text()
out=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/anwal-research-audit');out.mkdir(parents=True,exist_ok=True)
records=[]
for line in report.splitlines():
    if re.match(r'\| S\d\d \|',line):
        cols=[p.strip() for p in line.strip('|').split('|')]
        records.append(dict(id=cols[0],title=cols[1],dateNote=cols[2],reportConfidence=cols[3],url=re.search(r'\]\((https?://[^\s]+)\)',cols[4])[1],type='source'))
    elif re.match(r'\| P\d\d \|',line):
        cols=[p.strip() for p in line.strip('|').split('|')]
        records.append(dict(id=cols[0],title=re.search(r'\[([^\]]+)\]',cols[1])[1],url=re.search(r'\]\((https?://[^\s]+)\)',cols[1])[1],reportStatus=cols[2],type='image'))
    elif re.match(r'\| V\d\d ',line):
        cols=[p.strip() for p in line.strip('|').split('|')]
        records.append(dict(id=cols[0][:3],title=cols[0][6:],url=re.search(r'\]\((https?://[^\s]+)\)',cols[1])[1],reportStatus=cols[2],type='video'))
assert [sum(r['type']==t for r in records) for t in ['source','image','video']]==[33,63,11]

def audit(r):
    r={**r,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
    try:
        parts=urllib.parse.urlsplit(r['url']); request_url=urllib.parse.urlunsplit((parts.scheme,parts.netloc,urllib.parse.quote(parts.path,safe='/%:@+'),urllib.parse.quote(parts.query,safe='%=&+?/:') ,''))
        req=urllib.request.Request(request_url,headers={'User-Agent':'CampusOS-source-review/1.0','Accept':'*/*'})
        with urllib.request.urlopen(req,timeout=22) as response:
            body=response.read(12_000_000)
            r.update(httpStatus=response.status,finalUrl=response.url,contentType=response.headers.get('Content-Type',''),bytes=len(body),sha256=hashlib.sha256(body).hexdigest())
        (out/(r['id']+'.raw')).write_bytes(body)
        if 'text' in r['contentType']:
            raw=body.decode('utf-8',errors='replace')
            r['pageTitle']=html.unescape(re.sub('<[^>]*>','',m[1])) if (m:=re.search(r'<title[^>]*>(.*?)</title>',raw,re.S|re.I)) else ''
            r['mentionsAnwal']=bool(re.search('أنوال|Anwal|ANWAL',raw))
            clean=html.unescape(re.sub(r'<[^>]+>',' ',re.sub(r'<(script|style)[^>]*>.*?</\1>','',raw,flags=re.S|re.I)))
            clean=re.sub(r'\s+',' ',clean)
            (out/(r['id']+'.txt')).write_text(clean)
            r['rightsSnippets']=[clean[max(0,m.start()-60):m.end()+160] for m in list(re.finditer(r'جميع الحقوق محفوظة|حقوق النشر|all rights reserved|creative commons|tous droits réservés|CC BY',clean,re.I))[:5]]
            r['dateMetadata']=re.findall(r'<meta[^>]+(?:property|name)=[\"\'](?:article:published_time|datePublished|date)[\"\'][^>]+content=[\"\']([^\"\']+)',raw,re.I)
        r['retrieval']='retrieved'
    except Exception as e:
        r.update(retrieval='unavailable-during-audit',error=str(e)[:240],httpStatus=getattr(e,'code',None))
    if r['type']=='image':r['reuse']='not-established';r['publication']='external-gallery-link'
    return r
existing=json.loads((out/'audit.json').read_text()) if (out/'audit.json').exists() else []
selected=set(sys.argv[2].split(',')) if len(sys.argv)>2 else None
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
    updated=list(pool.map(audit,[r for r in records if selected is None or r['id'] in selected]))
by_id={r['id']:r for r in existing+updated}
results=[by_id[r['id']] for r in records]
(out/'audit.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
for kind in ['source','image','video']:
    group=[r for r in results if r['type']==kind]
    print(kind,len(group),'retrieved',sum(r['retrieval']=='retrieved' for r in group))
print(out/'audit.json')
