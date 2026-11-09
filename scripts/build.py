#!/usr/bin/env python3
"""Merge the maintained Markdown lists into a deterministic, dependency-free site."""
import hashlib, json, re, shutil
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = [
 ('astronomy','天文与宇宙','Astronomy','orbit'),('research','论文与阅读','Research & reading','book'),
 ('code','编程与数据','Code & data','code'),('ai','AI 与智能工具','AI tools','spark'),
 ('learn','学习与语言','Learning & languages','learn'),('design','设计与创作','Design & creation','palette'),
 ('productivity','效率与工具','Productivity','grid'),('play','游戏与影音','Games & media','game'),
 ('world','地图与生活','Maps & everyday life','globe'),('community','学者与校园','People & campus','people')]
LINK = re.compile(r'\[([^\]]+)\]\((https?://[^\s)]+)(?:\s+"[^"]*")?\)')
def clean(s):
 return re.sub(r'\s+', ' ', LINK.sub(lambda m:m[1],s).replace('**','').replace('&nbsp;','')).strip(' :：\n')
def canonical(url):
 p=urlsplit(url)
 # Preserve query/fragment: many resources use these to identify distinct content.
 return urlunsplit(('',p.netloc.lower(),p.path.rstrip('/'),p.query,p.fragment))
def parse(lang):
 path=ROOT/'data/sources'/f'VUVI_{lang}.md'; active=False; headings={}; rows=[]; current=None
 for num,line in enumerate(path.read_text().splitlines(),1):
  h=re.match(r'^\s*(?:\*\s+)?(#{1,3})\s+(.+)',line)
  if h:
   level=len(h[1]); name=h[2].strip()
   if name in ('学科','Astronomy'): active=True
   if name in ('致谢','Acknowledgements'): active=False
   headings={k:v for k,v in headings.items() if k<level}; headings[level]=name
   current=None; continue
  if not active: continue
  m=re.match(r'^\s*[*-]\s+\[',line)
  links=list(LINK.finditer(line))
  if m and links:
   first=links[0]; current={'name':clean(first[1]),'url':first[2], 'description':clean(line[first.end():]),'path':list(headings.values()),'language':'zh' if lang=='Chinese' else 'en','line':num,'file':path.relative_to(ROOT).as_posix(),'related':[{'name':x[1],'url':x[2]} for x in links[1:]]}
   rows.append(current)
  elif current and line.strip() and not line.strip().startswith('&nbsp;'):
   current['description']+=' '+clean(re.sub(r'^\s*\*\s*','',line))
 return rows

def classify(r):
 n=r['name'].lower(); u=r['url'].lower(); p=' / '.join(r['path']); t=n+' '+u+' '+r['description'].lower()
 if any(x in t for x in ['chatgpt','魔咒','tags wiki','国台天文大模型','秘塔写作猫','微软爱写作','ai对对联','彩云小梦','ai生成动漫','upscayl']): return 'ai','写作与图像' if '天文' not in n else '科研助手'
 if any(x in n for x in ['ads','scix','arxiv','alphaxiv','soaxiv','benty','giiisp','connectedpapers','zotero','文献','电子书','library genesis','springer','scihub','oalib','鸠摩','zlibrary','影响因子','academic accelerator','联图云','全国图书馆']): return 'research','文献与阅读'
 if any(x in p for x in ['天文学者','Homepages','学校','北京大学']): return 'community','学者主页' if '主页' in p or 'Homepages' in p else '社群与校园'
 if any(x in t for x in ['地图','map-generator','watabou','google earth','tasteatlas','windy','地铁','天气','time.is','中国制霸','历史地理','观沧海']): return 'world','地图与探索'
 if any(x in n for x in ['配色','中国色','adobe color','color space','palette','iconfont','觅元素','pexels','wallhaven','wallpaper','paper quilling','svg背景','emojiall','免费照片','canva','思维导图','gitmind','iodraw']): return 'design','配色与素材' if any(x in n for x in ['色','color','palette']) else '视觉创作'
 if any(x in n for x in ['webplotdigitizer','desmos','omni calculator','积分计算器','泊松','flourish','花火','mcmc interactive']): return 'code','计算与可视化'
 if any(x in p for x in ['语言','English']): return 'learn','语言与写作'
 if any(x in p for x in ['天文','Astronomy']):
  sub='数据与工具'
  if any(x in p for x in ['获取信息','Infos']): sub='资讯与参考'
  if any(x in p for x in ['课程','Tutorials']): sub='天文课程'
  if any(x in p for x in ['巡天','Instruments']): sub='望远镜与巡天'
  return 'astronomy',sub
 if any(x in p for x in ['Python包','Python packages']): return 'code','Python 与科学计算'
 if any(x in p for x in ['计算机','Programs']):
  return ('productivity','LaTeX 与文档') if 'Latex' in p else ('code','开发与教程')
 if any(x in p for x in ['文献与电子书','文学 / 数据库','心理学']): return 'research','书籍与人文'
 if any(x in p for x in ['Office','Latex','文档编辑','思维导图']): return 'productivity','LaTeX 与文档' if 'Latex' in p else '办公与演示'
 if any(x in p for x in ['桌游','游戏','影音','Entertainments']): return 'play','桌游与游戏' if any(x in p for x in ['桌游','游戏','Entertainments']) else '音乐与影像'
 if '图片' in p or '配色' in p: return 'design','图像与素材'
 if any(x in p for x in ['课程','Courses','物理','数学','化学','Chemistry']): return 'learn','课程与学科'
 if any(x in t for x in ['买房','做饭','影评','食评','防疫','法律','wikihow','后续']): return 'world','生活与指南'
 if '攻略' in p or 'Tutorials' in p: return 'learn','教程与指南'
 return 'productivity','工具箱' if '工具箱' in p else '日常工具'

# Search hints supplement, rather than replace, source descriptions.
HINTS = {
 'webplotdigitizer':['提取图里的数据','图片数据提取','曲线取点','图表数字化','digitize chart','extract plot data'],
 'connectedpapers':['找相关论文','文献关系','论文图谱','related papers'],
 'zotero':['管理论文','参考文献','引用','citation manager'],
 'desmos':['画函数图','函数绘图','plot function'],
 'remove.bg':['去背景','抠图','remove background'],
 'overleaf':['写论文','latex','协作写作','论文排版'],
 'astrometry.net':['识别星空','天区定位','plate solving'],
 'deepl':['翻译英文','翻译论文','translate'],
 'ppt':['做演示','幻灯片','presentation','slides'],
 'color':['颜色搭配','配色','palette'],
 'arxiv':['找论文','预印本','paper','preprint'],
 'adsabs':['找论文','天文论文','paper search'],
 'photutils':['测光','photometry'],
 'pyqsofit':['类星体光谱拟合','quasar spectrum'],
 'windy':['查天气','天气预报','weather'],
 'boardgamearena':['在线桌游','和朋友玩桌游','board games'],
 'nbviewer':['打开notebook','jupyter','笔记本预览'],
 'canva':['做海报','设计海报','poster'],
 'numpy':['数组','科学计算','array'],
 'matplotlib':['画图','科研绘图','plotting'],
 'grammarly':['英语润色','语法检查','grammar'],
 'wayback':['网页历史','历史快照','网页存档','archive'],
}
# Each category has its own manually ordered recommendation list.
CATEGORY_TOP=json.loads((ROOT/'data/category-top.json').read_text())
TOP_ORDER={category:{canonical(url):rank for rank,url in enumerate(urls)} for category,urls in CATEGORY_TOP.items()}
def build():
 rows=parse('Chinese')+parse('English'); merged={}
 for r in rows:
  key=canonical(r['url'])
  if key not in merged:
   cat,sub=classify(r)
   merged[key]={'id':hashlib.sha1(key.encode()).hexdigest()[:12], 'name':r['name'],'url':r['url'],'description':r['description'],'category':cat,'subcategory':sub,'aliases':[],'descriptions':{},'sources':[],'related':[],'tags':[],'categoryTopOrder':TOP_ORDER.get(cat,{}).get(key)}
  e=merged[key]
  if r['name'] not in e['aliases']: e['aliases'].append(r['name'])
  e['descriptions'].setdefault(r['language'],r['description'])
  e['sources'].append({k:r[k] for k in ['language','file','line','path']})
  e['related']+=r['related']
  if not e['description']: e['description']=r['description']
 for e in merged.values():
  t=(e['name']+' '+e['url']).lower()
  for needle,hints in HINTS.items():
   if needle in t: e['tags']+=hints
  e['tags']=list(dict.fromkeys(e['tags']))
 translations=json.loads((ROOT/'data/english.json').read_text())
 for e in merged.values():
  translated=translations.get(e['id'],{})
  english_name=next((a for a in e['aliases'] if not re.search('[\u4e00-\u9fff]',a)),e['name'])
  english_desc=e['descriptions'].get('en') or e['description']
  e['english']={'name':translated.get('name',english_name),'description':translated.get('description',english_desc),'supplemented':bool(translated)}
 entries=list(merged.values())
 payload={'categories':[dict(zip(['id','name','english','icon'],x)) for x in CATEGORIES],'resources':entries,'meta':{'sourceEntries':len(rows),'uniqueResources':len(entries),'chineseEntries':len(parse('Chinese')),'englishEntries':len(parse('English')),'englishOnly':sum(all(s['language']=='en' for s in e['sources']) for e in entries)}}
 (ROOT/'assets/catalog.js').write_text('window.VUVI_CATALOG = '+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n')
 dist=ROOT/'dist'; dist.mkdir(exist_ok=True)
 for name in ['index.html','assets']:
  src=ROOT/name; dst=dist/name
  if src.is_dir(): shutil.copytree(src,dst,dirs_exist_ok=True)
  else: shutil.copy2(src,dst)
 # Remove obsolete outputs from earlier builds; archived lists are not published.
 for name in ['VUVI_Chinese.md','VUVI_English.md']: (dist/name).unlink(missing_ok=True)
 (dist/'.nojekyll').touch()
 print(json.dumps(payload['meta'],ensure_ascii=False,indent=2))
 return payload
if __name__=='__main__': build()
