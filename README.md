# VUVI · 揽尽天下妙网

以好奇心为引力，收集实用、有趣的网站与工具。黑洞主题，支持中英文切换、分类检索、用途搜索与本地收藏。

**[进入网站 / Visit the website](https://panzhiwei1997.github.io/Very_Useful_Very_Interesting/)**

- 首页随机探索全部资源。
- 各分类的「近日推荐」由作者手动排序，其余资源随机展示。
- 中英文资源合并去重，支持名称、简介与用途关键词搜索。

网站作者：[潘志伟 / Zhiwei Pan](https://panzhiwei1997.github.io/)。感谢所有推荐资源的贡献者。

## 维护

两份旧版清单已归档到 `data/sources/`，仅供构建网站数据，不发布到网站。
分类推荐列表在 `data/category-top.json`，英文补译在 `data/english.json`。

```sh
python3 -m unittest discover -s tests
python3 scripts/build.py
python3 -m http.server 4173 --directory dist
```

推送到 `main` 后通过 GitHub Actions 自动部署 GitHub Pages。更多说明见 [WEBSITE.md](WEBSITE.md)。
