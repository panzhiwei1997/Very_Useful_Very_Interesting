# VUVI 网站初版 · 黑洞主题

可部署到 GitHub Pages 的纯静态网站。原有中英文 Markdown 归档于 `data/sources/`，作为内部构建数据源，不复制到部署目录；页面按 URL 合并两份清单，保留中英文别名、描述、来源分类和原文位置。

## 本地预览

直接用浏览器打开 `index.html` 即可使用。预生成数据在 `assets/catalog.js`，不需要 Node、安装依赖或 API 密钥。

修改 `data/sources/` 中的清单后重新生成：

```sh
python3 scripts/build.py
python3 -m http.server 4173 --directory dist
```

打开 `http://localhost:4173`。部署目录是 `dist/`。

## 功能

- 完整中英切换：导航、分类、搜索状态和全部资源名称与简介；语言选择保存在浏览器，支持 `#lang=en` 直达。
- 10 个用途主题、主题内细分类别、来源筛选（含英文独有）。
- 中英文名称、描述、别名、用途关键词搜索；同义词扩展和英文拼写容错。
- 首页全部随机；分类页面将手动置顶列表单独显示为「近日推荐」，其余资源随机排列。刷新页面重新随机，同一次浏览切换语言、收藏、加载更多不打乱顺序；搜索仍优先按相关度，也可按名称排序。
- 卡片 / 列表；分批加载；随机发现。
- 浏览器本地收藏；详情保留双语描述，不再链接原始 Markdown。
- 可分享的搜索与主题 URL；键盘 `/` 聚焦搜索；响应式布局。
- 黑洞、吸积盘、星空和缓慢汇入的关键词；尊重减少动画设置。

搜索为本地词法匹配，不调用大模型，不将搜索内容发送到服务器。中文分词使用浏览器内置 `Intl.Segmenter`；不支持时回退到关键词匹配。

## GitHub Pages 发布

1. 将网站文件加入原仓库 `panzhiwei1997/Very_Useful_Very_Interesting` 的 `main` 分支。
2. 在仓库 Settings → Pages → Build and deployment 中选择 **GitHub Actions**。
3. `.github/workflows/pages.yml` 会运行数据校验、生成 `dist/` 并发布。
4. 后续修改内部清单或网站代码并推送到 `main`，网站会自动重建。

参考 [GitHub Pages 自定义工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。部署结果可在仓库 Actions 与 Settings → Pages 中查看。

## 维护

- `scripts/build.py`：清单解析、URL 归一化、合并、分类、用途关键词和构建。
- `data/english.json`：按稳定资源 ID 保存英文补译；原始清单不变。新增中文条目时需补齐英文，覆盖校验会提示遗漏。
- `assets/i18n.js`：界面翻译、语言偏好和静态文案切换。
- `assets/app.js`：筛选、排序、搜索评分、详情和收藏。
- `assets/style.css`：响应式布局和黑洞主题。
- `index.html`：页面与原生 SVG 黑洞插画。
- `tests/test_catalog.py`：合并覆盖率、URL 去重、双语保留、英文独有条目等回归检查。

```sh
python3 -m unittest discover -s tests
```

数据快照：中文 333 条、英文 125 条，合并为 332 个不同 URL，其中英文独有 2 个。同 URL 的不同名称保存为别名。保留源清单的介绍与链接，英文界面使用原有英文或补译摘要，可在详情展开原始说明；尚未逐一验证外部网站是否仍可用。#6、#8 未合并的推广条目不在数据中。

分类置顶顺序在 `data/category-top.json` 中按分类 ID 和网址数组配置，数组顺序即推荐顺序。目前天文区是 NEXUS，游戏区依次是 PokéBonk、BGA；首页不置顶。网站作者链接位于页脚，中英文同步。

新增条目默认按路径和关键词分类；分类规则位于 `classify()`。用途同义词在 `HINTS` 和前端 `synonyms` 中扩充。收藏仅存于当前浏览器，清除网站数据会清除收藏。字体可选加载 Google Fonts，失败时使用系统宋体；核心脚本、样式与插画均为本地资源。
