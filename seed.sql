-- Seed data for blog posts
INSERT OR IGNORE INTO posts (title, slug, content, excerpt, published) VALUES 
(
  'ようこそ', 
  'welcome',
  '# ようこそ\n\n才能の機会損失をゼロにする旅が、ここから始まります。\n\nこのブログでは、私たちの理念やビジョン、そして出会った人々の物語を綴っていきます。',
  '才能の機会損失をゼロにする旅が、ここから始まります。',
  1
),
(
  '理念について',
  'about-philosophy',
  '# 「才能を覚醒させる」という理念\n\n眠っていた才能に火を灯し、その人だけの輝きを引き出す。\n\nそれが私たちの使命です。',
  '眠っていた才能に火を灯し、その人だけの輝きを引き出す。',
  1
);
