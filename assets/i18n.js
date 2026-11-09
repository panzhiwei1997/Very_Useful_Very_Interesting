(() => {
'use strict';
const en={
 '跳到资源列表':'Skip to resources','VUVI 首页':'VUVI home','好奇心，自有引力。':'Curiosity has gravity.',
 '你的引力空间':'YOUR SPACE','资源导航':'Resource navigation','全部探索':'Explore all','我的收藏':'My collection','按主题发现':'EXPLORE BY TOPIC','主题分类':'Topics',
 '好奇心，是一种引力。':'Curiosity has gravity.','让散落在互联网的好工具，':'Bring the best of the internet','汇入你的知识宇宙。':'into your own universe.','在 GitHub 一起完善':'Contribute on GitHub',
 '打开分类导航':'Open topic navigation','资源宇宙':'The universe',
 '以好奇心为引力，让好网站在这里相遇。':'Let curiosity draw good things together.','从科研到生活，把值得探索的工具，收入你的宇宙。':'Useful tools and unexpected discoveries, all in your orbit.',
 '个精选资源':'resources','个探索主题':'topics','中英文合辑':'ZH + EN collection',
 '搜索资源':'Search resources','搜索名称、关键词或用途':'Search by name, keyword, or purpose','搜索这个宇宙：网站、工具，或你想做的事…':'Search tools, websites, or what you want to do…','清空搜索':'Clear search','探索一下':'Explore',
 '试着搜':'Try','找相关论文':'Related papers','提取图里的数据':'Extract plot data','免费 PPT':'Free slides','配色灵感':'Color palettes','配色':'Color palettes','中英文 · 用途匹配 · 拼写容错':'Bilingual · Purpose matching · Typo tolerant',
 '探索专题':'Explore collections','ORBIT 01 / 科研':'ORBIT 01 / SCIENCE','ORBIT 02 / 灵感':'ORBIT 02 / INSPIRATION','ORBIT 03 / 休闲':'ORBIT 03 / PLAY',
 '向宇宙提问':'Ask the universe','天文数据库、巡天与科研工具':'Astronomy, surveys & scientific tools','给快乐留点时间':'Make time for play','桌游、游戏、音乐与影音':'Board games, video games, music & more','给灵感一个出口':'Give ideas a place','色彩、图像与好用的创作工具':'Color, images & creative tools',
 '近日推荐':'Recent picks','其他资源':'More resources','引力收藏集':'Within your orbit','✧ 随机跃迁':'✧ Surprise me','细分类别':'Subcategories','全部':'All','按左侧主题，发现更多可能':'Explore more by topic',
 '收录来源':'Original collection','全部来源':'All sources','中文版收录':'Chinese source','英文版收录':'English source','英文版独有':'English-only entries',
 '排序':'Sort order','探索优先':'Discovery order','名称 A–Z':'Name A–Z','显示方式':'Display mode','卡片视图':'Card view','列表视图':'List view',
 '还没找到这颗星':'This star is still out there','试试更短的关键词，或清除筛选后继续探索。':'Try a shorter query, or clear the filters to explore more.','清除筛选':'Clear filters','探索更远一点':'Explore a little further',
 '合万人之智，揽尽天下妙网。':'A collective curiosity. An ever-growing universe.','网站作者：潘志伟 ↗':'Website by Zhiwei Pan ↗','中文原始清单 ↗':'Chinese source ↗','关闭详情':'Close details',
 '搜索结果':'Search results','收藏':'Save','取消收藏':'Unsave','原始清单来源':'Original collection','详情':'Details','新窗口':'new tab','访问':'Visit','查看详情':'View details',
 '已收藏 · 保存在当前浏览器':'Saved in this browser','已取消收藏':'Removed from your collection','当前浏览器不允许保存，收藏仅在本次浏览有效':'Storage is unavailable. Saved items will last for this visit only.',
 '收藏保存在当前浏览器，随时回来继续探索。':'Your collection stays in this browser. Come back and keep exploring.','把喜欢的网站留在这里':'Keep your favorite discoveries here','点击资源卡片上的爱心，建立你自己的资源宇宙。':'Tap the heart on a resource to build your own universe.','搜索也有边界，好奇心没有。':'Search has limits. Curiosity does not.',
 '相关链接':'Related links','收录名称':'Original names','中文原始收录':'Chinese source','原始收录出处':'Original sources','查看原始说明':'Read original descriptions','中文原文':'Chinese original','英文原文':'English original','未提供介绍':'No description in the original list. Visit the resource to learn more.','访问网站 ↗':'Visit website ↗','♥ 已收藏':'♥ Saved','♡ 加入收藏':'♡ Save',
 '数据与工具':'Data & tools','资讯与参考':'News & references','天文课程':'Astronomy courses','望远镜与巡天':'Telescopes & surveys','文献与阅读':'Papers & reading','学者主页':'Academic homepages','社群与校园':'Community & campus','地图与探索':'Maps & exploration','视觉创作':'Visual creation','配色与素材':'Colors & assets','计算与可视化':'Calculators & visualization','语言与写作':'Languages & writing','Python 与科学计算':'Python & scientific computing','开发与教程':'Development & tutorials','LaTeX 与文档':'LaTeX & documents','书籍与人文':'Books & humanities','办公与演示':'Office & presentations','桌游与游戏':'Board & video games','音乐与影像':'Music & video','图像与素材':'Images & assets','课程与学科':'Courses & subjects','生活与指南':'Life & guides','教程与指南':'Tutorials & guides','工具箱':'Toolboxes','日常工具':'Everyday tools','写作与图像':'Writing & images','科研助手':'Research assistants'
};
let language='zh';
try{language=localStorage.getItem('vuvi-language')==='en'?'en':'zh';}catch{}
const requested=new URLSearchParams(location.hash.slice(1)).get('lang');
if(requested==='en'||requested==='zh')language=requested;
const staticText=[], staticAttributes=[];
const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
while(walker.nextNode()){
 const node=walker.currentNode, original=node.textContent;
 if(en[original.trim()]&&!node.parentElement.closest('script,style,svg,#hero-title'))staticText.push({node,original});
}
for(const el of document.querySelectorAll('[aria-label],[placeholder],[title]'))for(const attr of ['aria-label','placeholder','title']){
 const value=el.getAttribute(attr);if(en[value])staticAttributes.push({el,attr,value});
}
const examples=[['找相关论文','related papers'],['提取图里的数据','extract plot data'],['免费 PPT','free slides'],['配色','color palettes']];
const exampleButtons=[...document.querySelectorAll('[data-query]')];
function translate(value){return language==='en'?(en[value]||value):value;}
function apply(){
 document.documentElement.lang=language==='en'?'en':'zh-CN';
 document.title=language==='en'?'VUVI · Good things have gravity':'VUVI · 揽尽天下妙网';
 for(const {node,original} of staticText)node.textContent=language==='en'?original.replace(original.trim(),en[original.trim()]):original;
 for(const {el,attr,value} of staticAttributes)el.setAttribute(attr,translate(value));
 document.getElementById('hero-title').innerHTML=language==='en'?'Good things.<br><span>Drawn together.</span>':'揽尽天下<span>妙网</span><i>✦</i>';
 exampleButtons.forEach((b,i)=>b.dataset.query=examples[i][language==='en'?1:0]);
 for(const b of document.querySelectorAll('[data-language]'))b.setAttribute('aria-pressed',b.dataset.language===language);
 document.querySelector('meta[name="description"]').content=language==='en'?'Useful tools and interesting websites, curated across astronomy, research, creativity, and everyday life. Explore and search the combined Chinese and English collections.':'揽尽天下妙网。分类浏览、中英文搜索，发现科研、创作与生活中的好工具。';
}
window.VUVI_I18N={t:translate,get language(){return language;},apply,set(value){if(value!=='en'&&value!=='zh')return;language=value;try{localStorage.setItem('vuvi-language',value);}catch{}apply();}};
})();
