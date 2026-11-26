"""Build a public provenance inventory from a local audit, with no media copies."""
import json,re,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1];audit_root=Path(sys.argv[1])
audit=json.loads((audit_root/'audit.json').read_text());videos=json.loads((audit_root/'videos.json').read_text());editorial=json.loads((root/'src/content/researchEditorial.json').read_text())
T=lambda fr,ar,en:dict(fr=fr,ar=ar,en=en)
publication={'S01':'2026','S02':'2026','S03':'2026','S06':'2015-07-11','S07':'2015-11-06','S08':'2017-02-25','S09':'2018-12-19','S10':'2018-12-28','S11':'2019-11-07','S12':'2020-01-04','S13':'2019-12-30','S14':'2019-07-05','S15':'2020-10-10','S16':'2022-03-28','S17':'2022-05-30','S18':'2022-04-16','S19':'2024-02-27','S20':'2024-10-17','S21':'2025-04-14','S22':'2025-05-03','S23':'2025-12-28','S24':'2025-12-29','S25':'2026-02-18','S26':'2026-03-02','S28':'2026-04-03','S29':'2026-04-06','S30':'2026-07-09','S31':'2026-10-19','S32':'2022-06-10'}
publishers={'S01':'Ministère de l’Éducation nationale','S02':'Ministère de l’Éducation nationale','S03':'Ministère de l’Éducation nationale','S04':'BonMaroc','S05':'Mapcarta / OpenStreetMap','S06':'Meknès Press','S07':'Meknès Press','S08':'Atlasscoop','S09':'Agenda Touristique','S10':'Atlasscoop','S11':'Profeps (blog éducatif non officiel)','S12':'Atlasscoop','S13':'Anwar Press','S14':'Anwar Press','S15':'Taxi News','S16':'Al3omk','S17':'Al3omk','S18':'Rfik TV / YouTube','S19':'Al3omk','S20':'Flach 24 / YouTube','S21':'Al3omk','S22':'Anwar Régions','S23':'Nabaa · Aziz El Massnaoui','S24':'Maroc.ma / MAP','S25':'Flachinfo24 · Mouad El Badaoui','S26':'Al3omk','S27':'Scribd · affiche de formation','S28':'Al3omk','S29':'Béni Mellal News','S30':'Nabaa · Aziz El Massnaoui','S31':'Alittihad','S32':'Al3omk','S33':'Etenma'}
lookup={r['id']:r for r in audit};sources=[]
for r in audit:
 if r['type']!='source':continue
 status='reviewed-source'
 if r['id']=='S22':status='indexed-publisher-text; direct-page-incomplete'
 elif r['id'] in ['S01','S02','S03']:status='official-pdf-reviewed' if r['id']=='S01' else 'official-pdf-retrieved'
 elif r['id']=='S27':status='announcement-only'
 elif r['id']=='S33':status='directory-no-media'
 elif r['id']=='S04':status='directory-lead-not-used-as-official-contact'
 elif r['id'] in ['S18','S20']:status='platform-metadata-embed-allowed'
 sources.append(dict(id=r['id'],mediaType='source',title=r.get('pageTitle') or r['title'],url=r['url'],credit=publishers[r['id']],publishedAt=publication.get(r['id'],''),dateNote=r['dateNote'],status=status,connection='Anwal Khénifra identified in source or supplied source record',rights='No photo republication permission established; see publisher',httpStatus=r.get('httpStatus'),checkedAt=r['checkedAt'],notes=r['reportConfidence']))
for source in sources:
 if source['id']=='S05':source['rights']='Map text CC BY-SA 4.0; page photographs have separate licences and depict nearby landmarks, not verified Anwal photographs.'
 if source['id']=='S04':source['connection']='Directory lead only; no address or contacts imported as official school details.'
 if source['id']=='S32':
  source['dateNote']='Article recovered: published 10 June 2022; the exact activity date remains unconfirmed.'
  source['notes']='Full article recovered and reviewed during this audit; the earlier report recorded it as unavailable.'
 if source['id']=='S22':source['notes']='Direct page returned incomplete HTML; publisher-indexed text and archive corroborate the event and publication dates.'
source_map={r['id']:r for r in sources};images=[]
collages={'P30','P32','P33','P34','P35','P36','P45','P49'}
for gallery in [r for r in editorial if r['kind']=='album']:
 source=source_map[gallery['sourceIds'][0]]
 for i,pid in enumerate(gallery['imageIds']):
  r=lookup[pid];valid='width' in r
  images.append(dict(id=pid,mediaType='photo-collage' if pid in collages else 'photograph',title={l:f"{gallery['title'][l]} · {i+1}" for l in ['fr','ar','en']},url=r['url'],gallerySlug=gallery['slug'],sourceId=source['id'],sourceUrl=source['url'],credit=source['credit']+' · photographer not identified',year=gallery['year'],eventDate=gallery['eventDate'],datePrecision=gallery['datePrecision'],sourcePublishedAt=source['publishedAt'],categoryKey=gallery['categoryKey'],scope=gallery['scope'],status='reviewed-image' if valid else 'not-image-response' if r['retrieval']=='not-an-image' else 'unavailable-during-audit',httpStatus=r.get('httpStatus'),width=r.get('width'),height=r.get('height'),format=r.get('format'),reusePermission='not-established',disposition='linked-original-gallery',rightsNote='Publisher retains rights; no copy hosted and no hotlink loaded.',resized=bool(re.search(r'-\d+x\d+\.',r['url'])),visuallyReviewed=valid,identityConfirmed=False,duplicateOf=None,overlapsWith=['P31'] if pid=='P36' else ['P38'] if pid=='P45' else [],checkedAt=r['checkedAt']))
video_records=[]
for r in videos:
 details=r.get('videoDetails',{});primary=r['id'] in ['V01','V02'];other_school=r['id'] in ['V08','V09'];football=r['id']=='V10';unavailable=r['id']=='V11'
 reason='Included as school-focused video' if primary else 'Unavailable player; original embed URL also has a malformed suffix' if unavailable else 'Football final involving other schools; not an Anwal result' if football else 'Performance by a Takelft/Azilal school; not an Anwal performance' if other_school else 'Shared regional reception, not Anwal-specific footage; retained as an external contextual reference'
 video_records.append(dict(id=r['id'],mediaType='video',title=details.get('title') or 'Unavailable 2017 embed',url=r['original'],watchUrl=r['normalizedWatchUrl'],sourceId='S18' if r['id']=='V01' else 'S20' if r['id']=='V02' else 'S08',sourceUrl=source_map['S18' if r['id']=='V01' else 'S20' if r['id']=='V02' else 'S08']['url'],credit=details.get('author') or 'Uploader unverified',publishedAt=r.get('microformat',{}).get('publishDate'),eventDate='' if primary or football or unavailable else '2017-02-23',scope='school' if primary else 'shared',status=r.get('playabilityStatus',{}).get('status','unverified'),embedAllowed=r.get('playabilityStatus',{}).get('playableInEmbed',False),durationSeconds=int(details.get('lengthSeconds') or 0),disposition='embedded-on-interaction' if primary else 'inventory-only',reason=reason))
inventory=dict(version=1,checkedOn='2026-11-26',sources=sources,images=images,videos=video_records,summary=dict(sourceRecords=len(sources),imageReferences=len(images),imagesVisuallyReviewed=sum(i['visuallyReviewed'] for i in images),imagesUnavailable=sum(not i['visuallyReviewed'] for i in images),hostedPublisherImages=0,exactImageDuplicates=0,schoolImageReferences=sum(i['scope']=='school' for i in images),sharedImageReferences=sum(i['scope']=='shared' for i in images),embeddedVideos=2,inventoryOnlyVideos=9),accuracyNotes=[
 'Journalism workshop: source publication 2026-03-02; event date disputed, no replacement date assigned.',
 '2026 awards: school year retained; no exact day inferred from inconsistent wording.',
 '2019 national cross-country: competition 2019-12-25 to 2019-12-29; report publication 2020-01-04.',
 'S08 confirms four Anwal participants; retrieved text does not individually assign the national team’s medals.',
 '500 summer-school participants are a provincial programme total, not Anwal enrolment.',
 '2600+ medical beneficiaries concern the hospital caravan, not school enrolment.',
 'Robotics background refers to 13 Novembre school in Elhri; invited theatre prize not attributed to Anwal.',
 'Pioneer recognition: Ministry edition 2026, code 26225E, entry 412, page 19; original label award year unknown.',
 'S32 visual-art article recovered: publication 2022-06-10; the event day remains unassigned.',
 'P30, P32–P36, P45 and P49 are collages. P36 reuses the P31 group image; P45 includes the P38 building view.',
 'P08’s obvious size/format variant had already been merged in the supplied dossier. No additional byte-identical images found.',
 'Directory and map contacts, leadership, capacity, official logo and social accounts are not treated as current verified school details.'
])
(root/'public/research/source-inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2)+'\n')

lines=['# Anwal media review and publication decisions','',f"Checked: {inventory['checkedOn']}",'','No publisher photo republication licence was established. All 63 image references are retained as credited links to the original gallery; no copied or hotlinked press photographs are published. The existing unlicensed facade seed is withdrawn without deleting custom CMS uploads.','', '## Counts','',str(inventory['summary']),'','## Source register','', '| Source | Publication | Review | Original |','|---|---|---|---|']
lines += [f"| {s['id']} · {s['credit']} | {s['publishedAt'] or 'Not established'} | {s['status']} | [Source]({s['url']}) |" for s in sources]
lines += ['', '## Images: all 63 decisions','', '| ID | Source | Type | Scope | Retrieved image | Decision |','|---|---|---|---|---|---|']
lines += [f"| {i['id']} | [{i['sourceId']}]({i['sourceUrl']}) | {i['mediaType']} | {i['scope']} | {'Yes' if i['visuallyReviewed'] else i['status']} | External gallery; permission unestablished |" for i in images]
lines += ['', '## Videos: individual review','', '| ID | Title / uploader | Availability | Decision |','|---|---|---|---|']
lines += [f"| [{v['id']}]({v['watchUrl']}) | {v['title']} · {v['credit']} | {v['status']} | {v['reason']} |" for v in video_records]
lines += ['', '## Accuracy decisions','']+[f'- {n}' for n in inventory['accuracyNotes']]
(root/'docs/research/media-review.md').write_text('\n'.join(lines)+'\n')
print(json.dumps(inventory['summary'],indent=2))
