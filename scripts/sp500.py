# Fetch the S&P 500 constituents from Wikipedia with their Wikidata ids -> scripts/sp500.json
import json,re,html,urllib.request,urllib.parse
UA={"User-Agent":"CodaNewsBot/0.1 (info@coda.news)"}
get=lambda u: json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30))
t=get("https://en.wikipedia.org/w/api.php?action=parse&page=List_of_S%26P_500_companies&prop=text&section=1&format=json")['parse']['text']['*']
sp=[]
for r in re.findall(r'<tr>(.*?)</tr>',t,re.S):
    cells=re.findall(r'<td[^>]*>(.*?)</td>',r,re.S)
    if len(cells)<7: continue
    m=re.search(r'<a href="/wiki/([^"]+)"[^>]*>(.*?)</a>',cells[1])
    if not m: continue
    sp.append({"sym":re.sub('<[^>]+>','',cells[0]).strip(),"title":urllib.parse.unquote(html.unescape(m.group(1))).replace('_',' '),
               "name":html.unescape(re.sub('<[^>]+>','',m.group(2)).strip()),"sector":re.sub('<[^>]+>','',cells[2]).strip()})
for i in range(0,len(sp),50):
    j=get("https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&titles="+urllib.parse.quote("|".join(x['title'] for x in sp[i:i+50])))['query']
    norm={x['from']:x['to'] for x in j.get('normalized',[])}; red={x['from']:x['to'] for x in j.get('redirects',[])}
    pages={p['title']:p.get('pageprops',{}).get('wikibase_item') for p in j['pages'].values()}
    for x in sp[i:i+50]:
        tt=red.get(norm.get(x['title'],x['title']),norm.get(x['title'],x['title'])); x['qid']=pages.get(tt); x['wiki']=tt
json.dump(sp,open('scripts/sp500.json','w'),ensure_ascii=False,indent=0)
print(len(sp), sum(1 for x in sp if x.get('qid')))
