# S&P 100 and Nasdaq-100 constituents from Wikipedia (with Wikidata ids) -> scripts/indices.json
import json,re,html,urllib.request,urllib.parse
UA={"User-Agent":"CodaNewsBot/0.1 (info@coda.news)"}
get=lambda u: json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30))
def rows(page, section=None):
    u=f"https://en.wikipedia.org/w/api.php?action=parse&page={urllib.parse.quote(page)}&prop=text&format=json"+(f"&section={section}" if section else "")
    t=get(u)['parse']['text']['*']
    out=[]
    for tb in re.findall(r'<table[^>]*wikitable[^>]*>(.*?)</table>',t,re.S):
        for r in re.findall(r'<tr>(.*?)</tr>',tb,re.S):
            cells=re.findall(r'<td[^>]*>(.*?)</td>',r,re.S)
            if len(cells)<2: continue
            # the company cell is the first one holding a wiki link to an article
            for cell in cells[:3]:
                m=re.search(r'<a href="/wiki/([^"#]+)"[^>]*>(.*?)</a>',cell)
                if m and not re.fullmatch(r'[A-Z.]{1,6}',re.sub('<[^>]+>','',m.group(2)).strip()):
                    out.append({"title":urllib.parse.unquote(html.unescape(m.group(1))).replace('_',' '),"name":html.unescape(re.sub('<[^>]+>','',m.group(2)).strip())}); break
        if len(out)>=90: break
    return out
res={}
for key,page,sec in [("SP100","S&P 100","5"),("NDX100","List of NASDAQ-100 companies",None)]:
    sp=rows(page,sec)
    for i in range(0,len(sp),50):
        j=get("https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&titles="+urllib.parse.quote("|".join(x['title'] for x in sp[i:i+50])))['query']
        norm={x['from']:x['to'] for x in j.get('normalized',[])}; red={x['from']:x['to'] for x in j.get('redirects',[])}
        pages={p['title']:p.get('pageprops',{}).get('wikibase_item') for p in j['pages'].values()}
        for x in sp[i:i+50]:
            t=norm.get(x['title'],x['title']); t=red.get(t,t); x['qid']=pages.get(t); x['wiki']=t
    res[key]=[x for x in sp if x.get('qid')]
    print(key,len(res[key]),[x['name'] for x in res[key][:5]])
json.dump(res,open('scripts/indices.json','w'),ensure_ascii=False,indent=0)
