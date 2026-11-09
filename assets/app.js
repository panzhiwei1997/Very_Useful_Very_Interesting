(() => {
'use strict';
const {resources, categories} = window.VUVI_CATALOG;
const $ = id => document.getElementById(id);
const i18n=window.VUVI_I18N;
const t=value=>i18n.t(value);
const L=(zh,en)=>i18n.language==='en'?en:zh;
const resourceName=r=>i18n.language==='en'?r.english.name:r.name;
const resourceDescription=r=>i18n.language==='en'?r.english.description:r.description;
const categoryName=c=>i18n.language==='en'?c.english:c.name;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = s => String(s).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const iconPaths={orbit:'<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-35 12 12)"/><circle cx="12" cy="12" r="3"/>',book:'<path d="M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z"/><path d="M12 6v15"/>',code:'<path d="m8 5-6 7 6 7m8-14 6 7-6 7M14 3l-4 18"/>',spark:'<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3ZM20 2v5m-2-3h5"/>',learn:'<path d="m2 9 10-5 10 5-10 5ZM6 11v7q6 5 12 0v-7m4-2v8"/>',palette:'<path d="M12 2a10 10 0 1 0 0 20c5 0 0-5 3-5h3c6-3 3-15-6-15Z"/><circle cx="7" cy="9" r="1"/><circle cx="12" cy="6" r="1"/><circle cx="17" cy="9" r="1"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',game:'<path d="M7 6h10q4 0 5 11c0 4-4 3-6-1H8c-2 4-6 5-6 1Q3 6 7 6Z"/><path d="M7 9v6m-3-3h6m6-2h1m2 3h1"/>',globe:'<circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><path d="M2 12h20"/>',people:'<circle cx="9" cy="7" r="3"/><path d="M2 21v-4c0-6 14-6 14 0v4m1-17c5 0 5 6 0 6m2 4q4 1 3 7"/>'};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]||iconPaths.grid}</svg>`;
const catMap = Object.fromEntries(categories.map(c=>[c.id,c]));
let favorites=new Set();
try {const saved=JSON.parse(localStorage.getItem('vuvi-favorites-v1')||'[]'); if(Array.isArray(saved)) favorites=new Set(saved.filter(id=>resources.some(r=>r.id===id)));} catch {}
const params=new URLSearchParams(location.hash.slice(1));
const state={category:catMap[params.get('category')]?params.get('category'):'all',query:params.get('q')||'',subcategory:'all',favorites:params.get('saved')==='1',source:'all',sort:'recommended',limit:24,view:'grid'};
let currentResults=[], currentDetail=null;
const synonyms=[['论文','文献','paper','papers','research','arxiv','preprint'],['配色','颜色','色彩','color','palette'],['翻译','translate','translation'],['图片','图像','image','photo'],['画图','绘图','可视化','plot','plotting','visualization'],['课程','教程','学习','course','tutorial','learn'],['天文','astronomy','astrophysics'],['游戏','game','games','gaming'],['电子书','ebook','books'],['免费','free'],['幻灯片','ppt','slides','presentation'],['光谱','spectrum','spectral'],['地图','map','maps'],['音乐','music','radio'],['代码','编程','code','programming'],['测光','photometry'],['人工智能','ai']];
const stopWords=new Set(['我','想','我要','我想','帮我','可以','如何','怎么','怎样','一个','的','工具','网站','find','a','the','for','to','i','want']);
const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('zh',{granularity:'word'}):null;
function terms(query){
 const n=normalize(query); let ts=segmenter?[...segmenter.segment(n)].filter(s=>s.isWordLike).map(s=>s.segment):n.split(/\s+/);
 // Add matched concepts so unspaced Chinese phrases work without a segmenter too.
 for(const group of synonyms) for(const word of group) if(n.includes(word)&&!ts.includes(word)) ts.push(word);
 return [...new Set(ts.filter(t=>!stopWords.has(t)&&t.length>0 && !/^[\p{Script=Han}]$/u.test(t)))];
}
function distance(a,b){
 if(Math.abs(a.length-b.length)>2)return 9;
 let prev=Array.from({length:b.length+1},(_,i)=>i),prevPrev=null;
 for(let i=1;i<=a.length;i++){
  const row=[i];
  for(let j=1;j<=b.length;j++){
   row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
   if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])row[j]=Math.min(row[j],prevPrev[j-2]+1);
  }
  prevPrev=prev;prev=row;
 }
 return prev[b.length];
}
const indexes=new Map(resources.map(r=>[r.id,{title:normalize([...r.aliases,r.english.name].join(' ')),text:normalize([r.name,r.english.name,r.english.description,...r.aliases,...Object.values(r.descriptions),r.category,catMap[r.category].name,catMap[r.category].english,r.subcategory,...r.tags,...r.sources.flatMap(s=>s.path),r.url].join(' ')),words:normalize([...r.aliases,r.english.name].join(' ')).split(' ')}]));
function contains(text,token){return /^[a-z0-9]{1,3}$/.test(token)?new RegExp('\\b'+token+'\\b').test(text):text.includes(token);}
function searchScore(r,query){
 if(!query.trim())return 1;
 const idx=indexes.get(r.id), q=normalize(query); let score=contains(idx.title,q)?120:contains(idx.text,q)?65:0;
 if(!q)return 0;
 let matched=0; const tokens=terms(query);
 for(const t of tokens){
  if(contains(idx.title,t)){score+=24;matched++;continue;}
  if(contains(idx.text,t)){score+=10;matched++;continue;}
  const group=synonyms.find(g=>g.includes(t));
  if(group?.some(s=>contains(idx.text,s))){score+=6;matched++;continue;}
  if(/^[a-z]{4,}$/.test(t)&&idx.words.some(w=>w.length>=4&&distance(w,t)<=(t.length>6?2:1))){score+=12;matched++;}
 }
 if(tokens.length>1 && matched/tokens.length<0.6 && score<65)return 0;
 if(tokens.length>1&&matched===tokens.length)score+=25;
 return score;
}
function sourceMatch(r){const langs=r.sources.map(s=>s.language);return state.source==='all'||(state.source==='en-only'?langs.includes('en')&&!langs.includes('zh'):langs.includes(state.source));}
function baseResults(){return resources.filter(r=>(state.category==='all'||r.category===state.category)&&(!state.favorites||favorites.has(r.id))&&sourceMatch(r));}
// Shuffle once per page load; interactions keep the same random order.
const shuffledResources=[...resources];
for(let i=shuffledResources.length-1;i>0;i--){
 const j=Math.floor(Math.random()*(i+1));
 [shuffledResources[i],shuffledResources[j]]=[shuffledResources[j],shuffledResources[i]];
}
const randomRank=new Map(shuffledResources.map((r,i)=>[r.id,i]));
function isCategoryPick(r){return state.category!=='all'&&r.category===state.category&&Number.isInteger(r.categoryTopOrder);}
function discoveryRanks(entries){
 const pinned=entries.filter(isCategoryPick).sort((a,b)=>a.categoryTopOrder-b.categoryTopOrder);
 const remaining=entries.filter(r=>!isCategoryPick(r)).sort((a,b)=>randomRank.get(a.id)-randomRank.get(b.id));
 return new Map([...pinned,...remaining].map((r,i)=>[r.id,i]));
}
function getResults(){
 const matches=baseResults().filter(r=>state.subcategory==='all'||r.subcategory===state.subcategory).map(r=>({r,score:searchScore(r,state.query)})).filter(x=>x.score>0);
 const ranks=discoveryRanks(matches.map(x=>x.r));
 return matches.sort((a,b)=>state.sort==='name'?resourceName(a.r).localeCompare(resourceName(b.r),L('zh-Hans-CN','en')):b.score-a.score||ranks.get(a.r.id)-ranks.get(b.r.id)).map(x=>x.r);
}
function syncUrl(){const p=new URLSearchParams();p.set('lang',i18n.language);if(state.query)p.set('q',state.query);if(state.category!=='all')p.set('category',state.category);if(state.favorites)p.set('saved','1');try{history.replaceState(null,'',location.pathname+location.search+(p.size?'#'+p.toString():''));}catch{}}
function toast(message){$('toast').textContent=t(message);$('toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('visible'),2200);}
function toggleFavorite(id){
 if(favorites.has(id))favorites.delete(id);else favorites.add(id);
 let stored=true;try{localStorage.setItem('vuvi-favorites-v1',JSON.stringify([...favorites]));}catch{stored=false;}
 toast(stored?(favorites.has(id)?'已收藏 · 保存在当前浏览器':'已取消收藏'):'当前浏览器不允许保存，收藏仅在本次浏览有效');
 render();if(currentDetail===id)renderDetail(resources.find(r=>r.id===id));
}
function mark(name){const q=state.query.trim();if(!q||q.length<2)return esc(name);const i=name.toLowerCase().indexOf(q.toLowerCase());return i<0?esc(name):esc(name.slice(0,i))+'<mark>'+esc(name.slice(i,i+q.length))+'</mark>'+esc(name.slice(i+q.length));}
function card(r){
 const saved=favorites.has(r.id),name=resourceName(r),source=[...new Set(r.sources.map(s=>s.language.toUpperCase()))].join(' / '),description=resourceDescription(r)||L(`${categoryName(catMap[r.category])} · ${r.subcategory}。访问网站，探索更多。`,`${categoryName(catMap[r.category])} · ${t(r.subcategory)}. Visit this resource to explore more.`);
 return `<article class="card" data-id="${r.id}"><div class="card-top"><div class="site-name"><h3><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${mark(name)}</a></h3><div class="site-domain">${esc(new URL(r.url).hostname.replace(/^www\./,''))}</div></div><button class="favorite ${saved?'saved':''}" data-save="${r.id}" aria-label="${t(saved?'取消收藏':'收藏')} ${esc(name)}" aria-pressed="${saved}">${saved?'♥':'♡'}</button></div><p class="description">${esc(description)}</p><div class="card-bottom"><span class="tag">${esc(t(r.subcategory))}</span><span class="source-badge" title="${t('原始清单来源')}">${source}</span><button class="detail-button" data-detail="${r.id}" aria-label="${esc(L(`查看 ${name} 的详情`,`View details for ${name}`))}">${t('详情')}</button><a class="visit-arrow" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" aria-label="${t('访问')} ${esc(name)} (${t('新窗口')})">↗</a></div></article>`;
}
function renderNav(){
 $('category-nav').innerHTML=categories.map(c=>`<button class="nav-item ${state.category===c.id?'active':''}" data-category="${c.id}" aria-pressed="${state.category===c.id}"><span class="nav-icon">${icon(c.icon)}</span>${esc(categoryName(c))}<span class="count">${resources.filter(r=>r.category===c.id).length}</span></button>`).join('');
 const all=document.querySelector('[data-category="all"]');all.classList.toggle('active',state.category==='all'&&!state.favorites);all.setAttribute('aria-pressed',state.category==='all'&&!state.favorites);
 $('favorites').classList.toggle('active',state.favorites);$('favorites').setAttribute('aria-pressed',state.favorites);$('favorite-count').textContent=favorites.size;$('all-count').textContent=resources.length;
}
function renderChips(){
 const available=[...new Set(baseResults().map(r=>r.subcategory))];if(!available.includes(state.subcategory))state.subcategory='all';
 const labels=state.category==='all'?['全部',...(state.favorites?available:[])]:['全部',...available];
 $('subcategories').innerHTML=labels.map((s,i)=>`<button class="chip ${(i===0&&state.subcategory==='all')||s===state.subcategory?'active':''}" data-subcategory="${i===0?'all':esc(s)}">${esc(t(s))}</button>`).join('')+(state.category==='all'&&!state.favorites?`<span class="chip">${t('按左侧主题，发现更多可能')}</span>`:'');
}
function render(){
 renderNav();renderChips();currentResults=getResults();
 const visible=currentResults.slice(0,state.limit);
 const showPicks=state.category!=='all'&&!state.query.trim()&&state.sort==='recommended'&&!state.favorites;
 const picks=showPicks?visible.filter(isCategoryPick):[];
 const others=showPicks?visible.filter(r=>!isCategoryPick(r)):visible;
 $('category-picks').hidden=!picks.length;
 $('other-resources-title').hidden=!picks.length||!others.length;
 $('category-picks-title').textContent=t('近日推荐');
 $('other-resources-title').textContent=t('其他资源');
 for(const [id,items] of [['recommended-cards',picks],['cards',others]]){
  $(id).classList.toggle('list',state.view==='list');$(id).innerHTML=items.map(card).join('');
 }
 const title=state.favorites?t('我的收藏'):state.query?t('搜索结果'):state.category==='all'?t('引力收藏集'):categoryName(catMap[state.category]);
 $('results-title').innerHTML=esc(title)+' <span id="result-count">'+currentResults.length+'</span>';
 $('breadcrumb-current').textContent=state.favorites?t('我的收藏'):state.category==='all'?t('全部探索'):categoryName(catMap[state.category]);
 $('section-kicker').textContent=state.favorites?'YOUR LITTLE UNIVERSE':state.category==='all'?'THE DIRECTORY':catMap[state.category].english.toUpperCase();
 $('collections').hidden=Boolean(state.query||state.favorites||state.category!=='all');
 $('result-context').textContent=state.query?L(`“${state.query}” 找到 ${currentResults.length} 个相关资源 · 按名称、介绍与用途匹配${state.category!=='all'?' · 当前主题内搜索':''}`,`${currentResults.length} results for “${state.query}” · Matching names, descriptions & purposes${state.category!=='all'?' · Within this topic':''}`):state.favorites?t('收藏保存在当前浏览器，随时回来继续探索。'):'';
 $('empty').hidden=Boolean(currentResults.length);$('empty').querySelector('h3').textContent=t(state.favorites&&!favorites.size?'把喜欢的网站留在这里':'还没找到这颗星');$('empty').querySelector('p').textContent=t(state.favorites&&!favorites.size?'点击资源卡片上的爱心，建立你自己的资源宇宙。':'试试更短的关键词，或清除筛选后继续探索。');
 $('load-more').hidden=currentResults.length<=state.limit;$('showing').textContent=currentResults.length?L(`已展示 ${Math.min(state.limit,currentResults.length)} / ${currentResults.length} 个资源`,`Showing ${Math.min(state.limit,currentResults.length)} of ${currentResults.length} resources`):t('搜索也有边界，好奇心没有。');
 $('clear-search').hidden=!state.query;$('random').disabled=!currentResults.length;syncUrl();
}
function renderDetail(r){
 currentDetail=r.id;const name=resourceName(r);
 const related=r.related.length?`<div class="detail-section"><h3>${t('相关链接')}</h3>${r.related.map((l,i)=>`<a class="source-link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(L(l.name,/[\u4e00-\u9fff]/.test(l.name)?`Reference ${i+1}`:l.name))} ↗</a>`).join('')}</div>`:'';
 const originals=Object.entries(r.descriptions).filter(([,text])=>text).map(([lang,text])=>`<h3>${t(lang==='zh'?'中文原文':'英文原文')}</h3><p class="detail-body" lang="${lang==='zh'?'zh-CN':'en'}">${esc(text)}</p>`).join('');
 $('detail-content').innerHTML=`<div class="detail-header"><h2>${esc(name)}</h2></div><div class="detail-tags"><span class="tag">${esc(categoryName(catMap[r.category]))}</span><span class="tag">${esc(t(r.subcategory))}</span></div><p class="detail-body">${esc(resourceDescription(r)||t('未提供介绍'))}</p>${related}<details class="detail-section original-text"><summary>${t('查看原始说明')}</summary>${originals}<h3>${t('收录名称')}</h3><p class="detail-body">${esc(r.aliases.join(' / '))}</p></details><div class="detail-actions"><a class="primary-link" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${t('访问网站 ↗')}</a><button class="secondary-button" data-save="${r.id}">${t(favorites.has(r.id)?'♥ 已收藏':'♡ 加入收藏')}</button></div>`;
}
function switchLanguage(language){i18n.set(language);render();if(currentDetail)renderDetail(resources.find(r=>r.id===currentDetail));}

function openDetail(id){const r=resources.find(r=>r.id===id);if(!r)return;renderDetail(r);$('detail').showModal();}
function closeMenu(){$('sidebar').classList.remove('open');$('backdrop').hidden=true;$('menu').setAttribute('aria-expanded','false');}
function chooseCategory(id){state.category=id;state.favorites=false;state.subcategory='all';state.limit=24;closeMenu();render();$('resources').scrollIntoView({behavior:'smooth',block:'start'});}
function setQuery(q){state.query=q;state.limit=24;$('search').value=q;render();}
function reset(){Object.assign(state,{category:'all',query:'',subcategory:'all',favorites:false,source:'all',limit:24});$('search').value='';$('source-filter').value='all';render();}
// Event delegation keeps controls functional after results are refreshed.
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.language){switchLanguage(b.dataset.language);return;}
 if(b.dataset.save){toggleFavorite(b.dataset.save);return;}
 if(b.dataset.detail){openDetail(b.dataset.detail);return;}
 if(b.dataset.category){chooseCategory(b.dataset.category);return;}
 if(b.dataset.collection){chooseCategory(b.dataset.collection);return;}
 if(b.dataset.subcategory){state.subcategory=b.dataset.subcategory;state.limit=24;render();return;}
 if(b.dataset.query){setQuery(b.dataset.query);$('search').focus();return;}
});
$('search').addEventListener('input',e=>setQuery(e.target.value));
$('search').addEventListener('keydown',e=>{if(e.key==='Enter')$('resources').scrollIntoView({behavior:'smooth'});});
$('search-submit').onclick=()=>{$('resources').scrollIntoView({behavior:'smooth'});};
$('clear-search').onclick=()=>{setQuery('');$('search').focus();};
$('favorites').onclick=()=>{state.favorites=!state.favorites;state.category='all';state.subcategory='all';state.limit=24;closeMenu();render();$('resources').scrollIntoView({behavior:'smooth'});};
$('source-filter').onchange=e=>{state.source=e.target.value;state.subcategory='all';state.limit=24;render();};
$('sort').onchange=e=>{state.sort=e.target.value;state.limit=24;render();};
$('load-more').onclick=()=>{const firstNew=currentResults[state.limit]?.id;state.limit+=24;render();if(firstNew)document.querySelector(`[data-id="${firstNew}"] a`)?.focus({preventScroll:true});};
$('reset').onclick=reset;
$('random').onclick=()=>{if(currentResults.length)openDetail(currentResults[Math.floor(Math.random()*currentResults.length)].id);};
$('close-detail').onclick=()=>{$('detail').close();};
$('detail').addEventListener('close',()=>currentDetail=null);
$('detail').addEventListener('click',e=>{if(e.target===$('detail')){const b=$('detail').getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)$('detail').close();}});
$('menu').onclick=()=>{const open=$('sidebar').classList.toggle('open');$('backdrop').hidden=!open;$('menu').setAttribute('aria-expanded',open);};
$('backdrop').onclick=closeMenu;
for(const view of ['grid','list'])$(view+'-view').onclick=()=>{state.view=view;for(const v of ['grid','list']){$(v+'-view').classList.toggle('selected',v===view);$(v+'-view').setAttribute('aria-pressed',v===view);}render();};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('detail').open){e.preventDefault();$('search').focus();}if(e.key==='Escape')closeMenu();});
document.querySelectorAll('.brand,.footer-brand').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();reset();window.scrollTo({top:0,behavior:'smooth'});}));
window.addEventListener('hashchange',()=>{if(location.hash==='#resources')return;const p=new URLSearchParams(location.hash.slice(1));if(p.has('lang'))i18n.set(p.get('lang'));state.category=catMap[p.get('category')]?p.get('category'):'all';state.query=p.get('q')||'';state.favorites=p.get('saved')==='1';state.subcategory='all';state.limit=24;$('search').value=state.query;render();});
i18n.apply();$('total-stat').textContent=resources.length;$('search').value=state.query;render();
// Expose only the deterministic search helpers for a small regression check.
window.VUVI_SEARCH={search:query=>resources.map(r=>({name:r.name,score:searchScore(r,query)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score),terms};
})();
