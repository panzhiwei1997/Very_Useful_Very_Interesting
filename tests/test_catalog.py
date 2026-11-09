import importlib.util
import unittest
import re
from pathlib import Path
spec=importlib.util.spec_from_file_location('build',Path(__file__).resolve().parents[1]/'scripts/build.py')
b=importlib.util.module_from_spec(spec); spec.loader.exec_module(b)
class CatalogTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls): cls.data=b.build(); cls.rows=b.parse('Chinese')+b.parse('English')
 def test_union_keeps_every_source_entry(self):
  expected={(r['file'],r['line']) for r in self.rows}
  actual={(s['file'],s['line']) for r in self.data['resources'] for s in r['sources']}
  self.assertEqual(expected,actual)
 def test_no_duplicate_urls(self):
  urls=[b.canonical(r['url']) for r in self.data['resources']]
  self.assertEqual(len(urls),len(set(urls)))
 def test_categories_and_sources(self):
  ids={c['id'] for c in self.data['categories']}
  for r in self.data['resources']:
   self.assertIn(r['category'],ids); self.assertTrue(r['sources']); self.assertTrue(r['name'])
 def test_bilingual_merge(self):
  r=next(r for r in self.data['resources'] if r['name']=='ADS')
  self.assertEqual(set(r['descriptions']),{'zh','en'})
 def test_english_only_preserved(self):
  self.assertGreater(self.data['meta']['englishOnly'],0)
  self.assertTrue(any('astroparticle.online' in r['url'] for r in self.data['resources']))
 def test_english_display_is_complete(self):
  for r in self.data['resources']:
   with self.subTest(resource=r['name']):
    self.assertTrue(r['english']['name'])
    self.assertFalse(re.search('[\u4e00-\u9fff]',r['english']['name']+' '+r['english']['description']))
    if r['description']:
     self.assertTrue(r['english']['description'])
 def test_original_descriptions_are_preserved(self):
  r=next(r for r in self.data['resources'] if r['name']=='中国色')
  self.assertIn('中国传统',r['descriptions']['zh'])
  self.assertEqual(r['english']['name'],'Traditional Chinese Colors')
 def test_category_recommendations(self):
  resources=self.data['resources']
  for category,urls in b.CATEGORY_TOP.items():
   actual=sorted((r for r in resources if r['category']==category and r['categoryTopOrder'] is not None),key=lambda r:r['categoryTopOrder'])
   self.assertEqual([b.canonical(r['url']) for r in actual],[b.canonical(url) for url in urls])
  self.assertEqual(next(r['category'] for r in resources if r['url']=='https://pokebonk.com/'),'play')
 def test_archived_sources_are_not_published(self):
  for name in ['VUVI_Chinese.md','VUVI_English.md']:
   self.assertTrue((b.ROOT/'data/sources'/name).is_file())
   self.assertFalse((b.ROOT/name).exists())
   self.assertFalse((b.ROOT/'dist'/name).exists())
  html=(b.ROOT/'dist/index.html').read_text()
  self.assertNotRegex(html,r'href=[\"\'][^\"\']*VUVI_(Chinese|English)\.md')
  self.assertNotIn('sourceLinks',(b.ROOT/'assets/app.js').read_text())
 def test_unmerged_promotions_excluded(self):
  self.assertFalse(any('steamdownload.cn' in r['url'] or 'bucketlist.nl' in r['url'] for r in self.data['resources']))
if __name__=='__main__': unittest.main()
