import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// API: Get all published posts
app.get('/api/posts', async (c) => {
  const { DB } = c.env
  
  const { results } = await DB.prepare(`
    SELECT id, title, slug, excerpt, created_at, updated_at
    FROM posts
    WHERE published = 1
    ORDER BY created_at DESC
  `).all()
  
  return c.json({ posts: results })
})

// API: Get single post by slug
app.get('/api/posts/:slug', async (c) => {
  const { DB } = c.env
  const slug = c.req.param('slug')
  
  const result = await DB.prepare(`
    SELECT id, title, slug, content, excerpt, created_at, updated_at
    FROM posts
    WHERE slug = ? AND published = 1
  `).bind(slug).first()
  
  if (!result) {
    return c.json({ error: 'Post not found' }, 404)
  }
  
  return c.json({ post: result })
})

// Home page
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>才能を覚醒させる | 才能の機会損失をゼロに</title>
    <meta name="description" content="出逢った人の才能の機会損失をゼロにする。才能の化学反応を起こし続けるプロジェクト。">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Noto Sans JP', sans-serif;
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: 'Montserrat', 'Noto Sans JP', sans-serif;
      }
      .hero-bg {
        background-image: url('/images/member-1.jpg');
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
      }
      .hero-gradient {
        background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.8) 100%);
      }
      .fade-in {
        animation: fadeIn 1.2s ease-in;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .smooth-scroll {
        scroll-behavior: smooth;
      }
      .member-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .member-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.15);
      }
    </style>
</head>
<body class="bg-white text-gray-900 smooth-scroll">
    
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm">
        <div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <a href="/" class="flex items-center">
                <img src="/images/logo-horizontal.png" alt="Enthusiasts" class="h-12 w-auto">
            </a>
            <nav class="hidden md:flex space-x-8">
                <a href="#philosophy" class="text-gray-700 hover:text-black transition-colors">Philosophy</a>
                <a href="#what-we-do" class="text-gray-700 hover:text-black transition-colors">What We Do</a>
                <a href="#member" class="text-gray-700 hover:text-black transition-colors">Member</a>
                <a href="#blog" class="text-gray-700 hover:text-black transition-colors">Blog</a>
            </nav>
        </div>
    </header>
    
    <!-- Hero Section -->
    <section class="relative min-h-screen flex items-center justify-center hero-bg py-32">
        <div class="hero-gradient absolute inset-0"></div>
        <div class="relative z-10 text-center text-white px-6 max-w-6xl fade-in">
            <!-- 大胆な英語タイポグラフィ -->
            <div class="text-4xl md:text-7xl lg:text-8xl font-bold mb-12 leading-tight tracking-tight">
                A WORLD<br>
                WHERE<br>
                TALENT LOSS<br>
                IS ZERO
            </div>
            
            <div class="text-xl md:text-3xl font-light mb-16 tracking-wide">
                出逢った人の才能の機会損失をゼロに
            </div>
            
            <div class="text-base md:text-lg leading-relaxed space-y-6 max-w-3xl mx-auto font-light">
                <p>世界を変えてきたのは、特別な天才じゃない。<br>
                「誰かを喜ばせたい」という、まっすぐな想いを信じ抜いた普通の人たちだ。</p>
                
                <p class="mt-8">心の中で生まれた小さな願いを、誰かのための形にする。<br>
                それが、世界を動かす「才能」になる。</p>
                
                <p class="mt-8">最初は、根拠のない自信でいい。<br>
                その自由な一歩が、いつか必ず誰かの救いになると信じて進めばいい。</p>
                
                <p class="mt-12 text-lg md:text-xl font-normal">私たちは、そんな一人ひとりの光を照らし合い、<br>大きく育てていくチーム。</p>
            </div>
        </div>
    </section>

    <!-- Philosophy Section -->
    <section id="philosophy" class="py-32 px-6 bg-white">
        <div class="max-w-5xl mx-auto">
            <div class="text-center mb-20">
                <h2 class="text-5xl md:text-7xl font-bold mb-6 tracking-tight">PHILOSOPHY</h2>
                <p class="text-xl md:text-2xl text-gray-600">私たちの哲学</p>
            </div>
            
            <div class="grid md:grid-cols-3 gap-12">
                <div class="text-center p-8 bg-gray-50 rounded-lg">
                    <div class="text-sm font-bold text-gray-500 mb-4 tracking-widest">PHILOSOPHY</div>
                    <h3 class="text-2xl md:text-3xl font-bold mb-6">理念</h3>
                    <p class="text-2xl md:text-3xl font-light mb-6 leading-tight">才能を<br>覚醒させる</p>
                    <p class="text-gray-600">眠っていた才能に火を灯し、その人だけの輝きを引き出す。</p>
                </div>

                <div class="text-center p-8 bg-gray-50 rounded-lg">
                    <div class="text-sm font-bold text-gray-500 mb-4 tracking-widest">VISION</div>
                    <h3 class="text-2xl md:text-3xl font-bold mb-6">ビジョン</h3>
                    <p class="text-2xl md:text-3xl font-light mb-6 leading-tight">才能の<br>機会損失を<br>ゼロに</p>
                    <p class="text-gray-600">ハグレモノたちが主役として輝く世界を創る。</p>
                </div>

                <div class="text-center p-8 bg-gray-50 rounded-lg">
                    <div class="text-sm font-bold text-gray-500 mb-4 tracking-widest">MISSION</div>
                    <h3 class="text-2xl md:text-3xl font-bold mb-6">ミッション</h3>
                    <p class="text-2xl md:text-3xl font-light mb-6 leading-tight">才能の<br>化学反応を<br>起こし続ける</p>
                    <p class="text-gray-600">「お前じゃ無理」を「お前じゃなきゃ無理」に変える。</p>
                </div>
            </div>
        </div>
    </section>

    <!-- What We Do Section -->
    <section id="what-we-do" class="py-32 px-6 bg-gray-50">
        <div class="max-w-6xl mx-auto">
            <div class="text-center mb-20">
                <h2 class="text-5xl md:text-7xl font-bold mb-6 tracking-tight">WHAT WE DO</h2>
                <p class="text-xl md:text-2xl text-gray-600">提供価値</p>
            </div>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div class="bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                    <h3 class="text-2xl font-bold mb-4">1on1コーチング</h3>
                    <p class="text-gray-600">人生設計をサポートし、あなたの才能を最大限に引き出します。</p>
                </div>

                <div class="bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                    <h3 class="text-2xl font-bold mb-4">コミュニティ運営</h3>
                    <p class="text-gray-600">才能の化学反応が起こる場を創り、互いに高め合う環境を提供します。</p>
                </div>

                <div class="bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                    <h3 class="text-2xl font-bold mb-4">イベント開催</h3>
                    <p class="text-gray-600">才能が交わり、新しい可能性が生まれるイベントを企画・開催します。</p>
                </div>

                <div class="bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                    <h3 class="text-2xl font-bold mb-4">プロジェクト立ち上げ支援</h3>
                    <p class="text-gray-600">アイデアを形にするための具体的なサポートを提供します。</p>
                </div>

                <div class="bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                    <h3 class="text-2xl font-bold mb-4">マッチング(人繋ぎ)</h3>
                    <p class="text-gray-600">才能と才能、人と人を繋ぎ、新たな化学反応を生み出します。</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Blog Section -->
    <section id="blog" class="py-32 px-6 bg-white">
        <div class="max-w-6xl mx-auto">
            <div class="text-center mb-20">
                <h2 class="text-5xl md:text-7xl font-bold mb-6 tracking-tight">BLOG</h2>
                <p class="text-xl md:text-2xl text-gray-600">ブログ</p>
            </div>
            
            <div id="blog-posts" class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <!-- Blog posts will be loaded here -->
            </div>
        </div>
    </section>

    <!-- Member Section -->
    <section id="member" class="py-32 px-6 bg-gray-50">
        <div class="max-w-6xl mx-auto">
            <div class="text-center mb-16">
                <h2 class="text-5xl md:text-7xl font-bold mb-6 tracking-tight">MEMBER</h2>
                <p class="text-xl md:text-2xl text-gray-600">エンスーな人々</p>
            </div>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <!-- Member 1: 佐々木 慧 -->
                <div class="member-card bg-white overflow-hidden shadow-sm rounded-lg">
                    <img src="/images/member-1.jpg" alt="佐々木 慧" class="w-full h-64 object-cover">
                    <div class="p-6">
                        <div class="text-xs font-bold text-gray-400 mb-2 tracking-widest">PROJECT LEADER</div>
                        <h3 class="text-2xl font-bold mb-2">佐々木 慧</h3>
                        <p class="text-sm text-gray-500 mb-4">理念: 原石に光を</p>
                        <div class="mb-4">
                            <p class="text-xs font-bold text-gray-600 mb-1">専門分野</p>
                            <p class="text-xs text-gray-600">ファイナンス・経営戦略・プロデュース・考察</p>
                        </div>
                        <p class="text-sm text-gray-700 leading-relaxed">
                            元日本一のレーサーを父に持つ元レーサー。夢を失った虚無感から一念発起し、IT業界での成功を目指し上京。用意された成功に違和感を覚え、すべての内定を辞退。現在は、出逢った人の才能の機会損失をゼロにするプロジェクトをリード。
                        </p>
                    </div>
                </div>

                <!-- Member 2: 布野 雅也 -->
                <div class="member-card bg-white overflow-hidden shadow-sm rounded-lg">
                    <img src="/images/member-2.jpg" alt="布野 雅也" class="w-full h-64 object-cover">
                    <div class="p-6">
                        <div class="text-xs font-bold text-gray-400 mb-2 tracking-widest">CORE MEMBER</div>
                        <h3 class="text-2xl font-bold mb-2">布野 雅也</h3>
                        <p class="text-sm text-gray-500 mb-4">理念: Find Your Why .</p>
                        <div class="mb-4">
                            <p class="text-xs font-bold text-gray-600 mb-1">専門分野</p>
                            <p class="text-xs text-gray-600">マーケティング・PR・プロデュース</p>
                        </div>
                        <p class="text-sm text-gray-700 leading-relaxed">
                            ビジョンは「今を生きる人があふれる世界」。マーケティングとPRの専門性を活かし、プロジェクトの価値を社会に届けるコアメンバー。
                        </p>
                    </div>
                </div>

                <!-- Member 3: 黒岩 礼生 -->
                <div class="member-card bg-white overflow-hidden shadow-sm rounded-lg">
                    <img src="/images/member-5.jpg" alt="黒岩 礼生" class="w-full h-64 object-cover">
                    <div class="p-6">
                        <div class="text-xs font-bold text-gray-400 mb-2 tracking-widest">CORE MEMBER</div>
                        <h3 class="text-2xl font-bold mb-2">黒岩 礼生</h3>
                        <p class="text-sm text-gray-500 mb-4">理念: 人々に眠る愛おしさを照らし出す</p>
                        <div class="mb-4">
                            <p class="text-xs font-bold text-gray-600 mb-1">専門分野</p>
                            <p class="text-xs text-gray-600">シークレット</p>
                        </div>
                        <p class="text-sm text-gray-700 leading-relaxed">
                            幼少期からの苦悩を経て、食・健康・自己受容をテーマにコーチングを展開。「すみません」ではなく「ありがとう」が飛び交う日本を目指し、自立したGiver同士が愛し合う世界の実現に挑戦中。
                        </p>
                    </div>
                </div>

                <!-- Member 4: 甘糟 里奈 -->
                <div class="member-card bg-white overflow-hidden shadow-sm rounded-lg">
                    <img src="/images/member-3.jpg" alt="甘糟 里奈" class="w-full h-64 object-cover">
                    <div class="p-6">
                        <div class="text-xs font-bold text-gray-400 mb-2 tracking-widest">MEMBER</div>
                        <h3 class="text-2xl font-bold mb-2">甘糟 里奈</h3>
                        <p class="text-sm text-gray-500 mb-4">理念: 感性で世界を彩る</p>
                        <div class="mb-4">
                            <p class="text-xs font-bold text-gray-600 mb-1">専門分野</p>
                            <p class="text-xs text-gray-600">PR</p>
                        </div>
                        <p class="text-sm text-gray-700 leading-relaxed">
                            3000冊以上の物語から独自の感性を磨いた。転落を経て佐々木との出逢いで再起。栃木県さくら市の地域おこし協力隊として、地域の魅力をアートへと昇華させ、新たな熱狂を生み出している。
                        </p>
                    </div>
                </div>

                <!-- Member 5: 當内 脩平 -->
                <div class="member-card bg-white overflow-hidden shadow-sm rounded-lg">
                    <img src="/images/member-4.jpg" alt="當内 脩平" class="w-full h-64 object-cover">
                    <div class="p-6">
                        <div class="text-xs font-bold text-gray-400 mb-2 tracking-widest">MEMBER</div>
                        <h3 class="text-2xl font-bold mb-2">當内 脩平</h3>
                        <p class="text-sm text-gray-500 mb-4">理念: Make Your Rock</p>
                        <div class="mb-4">
                            <p class="text-xs font-bold text-gray-600 mb-1">専門分野</p>
                            <p class="text-xs text-gray-600">PR・イベントプロデュース</p>
                        </div>
                        <p class="text-sm text-gray-700 leading-relaxed">
                            二度の不登校を経験し、Rockに救われた。大阪天王寺で音楽フェス「STAR'Z DASH!!」を主催。衝動と脆さが響き合う世界を現実にすべく、音楽と経営の二軸で行き場のない若者たちの道を切り拓く。
                        </p>
                    </div>
                </div>

                <!-- Future Member Card -->
                <div class="member-card bg-white overflow-hidden shadow-sm border-2 border-dashed border-gray-300">
                    <div class="w-full h-64 bg-gray-100 flex items-center justify-center">
                        <div class="text-center">
                            <p class="text-4xl text-gray-300 mb-4">?</p>
                            <p class="text-gray-500 font-medium">Next is You</p>
                        </div>
                    </div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold mb-2">あなた</h3>
                        <p class="text-gray-600 text-sm mb-3">Your Role</p>
                        <p class="text-gray-700 text-sm">才能を覚醒させる旅に、あなたも参加しませんか?</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Achievements Section -->
    <section class="py-32 px-6 bg-white">
        <div class="max-w-6xl mx-auto">
            <div class="text-center mb-20">
                <h2 class="text-5xl md:text-7xl font-bold mb-6 tracking-tight">ACHIEVEMENTS</h2>
                <p class="text-xl md:text-2xl text-gray-600">実績</p>
            </div>
            
            <div class="grid md:grid-cols-3 gap-12">
                <div class="text-center p-8">
                    <div class="text-5xl md:text-6xl font-bold mb-4">50+</div>
                    <div class="text-lg text-gray-600">覚醒した才能</div>
                </div>
                
                <div class="text-center p-8">
                    <div class="text-5xl md:text-6xl font-bold mb-4">100+</div>
                    <div class="text-lg text-gray-600">化学反応</div>
                </div>
                
                <div class="text-center p-8">
                    <div class="text-5xl md:text-6xl font-bold mb-4">∞</div>
                    <div class="text-lg text-gray-600">可能性</div>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Banner Section -->
    <section class="py-16 px-6 bg-gray-50">
        <div class="max-w-6xl mx-auto">
            <div class="grid md:grid-cols-2 gap-8">
                <!-- Join Us -->
                <a href="#member" class="block group">
                    <div class="bg-black text-white p-12 rounded-lg transition-transform hover:-translate-y-2">
                        <h3 class="text-3xl font-bold mb-4">JOIN US</h3>
                        <p class="text-lg mb-6">才能を覚醒させる<br>旅に参加しませんか?</p>
                        <span class="text-sm font-bold tracking-widest group-hover:underline">LEARN MORE →</span>
                    </div>
                </a>
                
                <!-- Contact -->
                <a href="#blog" class="block group">
                    <div class="bg-white border-2 border-black p-12 rounded-lg transition-transform hover:-translate-y-2">
                        <h3 class="text-3xl font-bold mb-4">BLOG</h3>
                        <p class="text-lg mb-6">私たちの活動や<br>想いを発信しています</p>
                        <span class="text-sm font-bold tracking-widest group-hover:underline">READ MORE →</span>
                    </div>
                </a>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-16 px-6 bg-black text-white">
        <div class="max-w-6xl mx-auto">
            <div class="flex flex-col items-center mb-12">
                <img src="/images/logo-vertical.png" alt="Enthusiasts" class="h-32 w-auto mb-8 filter brightness-0 invert">
            </div>
            <div class="flex flex-col md:flex-row justify-between items-center mb-8">
                <nav class="flex space-x-8 mb-6 md:mb-0">
                    <a href="#philosophy" class="text-gray-400 hover:text-white transition-colors">Philosophy</a>
                    <a href="#what-we-do" class="text-gray-400 hover:text-white transition-colors">What We Do</a>
                    <a href="#member" class="text-gray-400 hover:text-white transition-colors">Member</a>
                    <a href="#blog" class="text-gray-400 hover:text-white transition-colors">Blog</a>
                </nav>
            </div>
            <div class="border-t border-gray-800 pt-8 text-center">
                <p class="text-lg font-light mb-4">出逢った人の才能の機会損失をゼロに</p>
                <p class="text-sm text-gray-400">&copy; 2024 Enthusiasts. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
      // Load blog posts
      async function loadBlogPosts() {
        try {
          const response = await axios.get('/api/posts')
          const posts = response.data.posts
          
          const blogContainer = document.getElementById('blog-posts')
          
          if (posts.length === 0) {
            blogContainer.innerHTML = '<p class="text-gray-500 col-span-full text-center">まだ記事がありません</p>'
            return
          }
          
          blogContainer.innerHTML = posts.map(post => \`
            <a href="/blog/\${post.slug}" class="block bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 class="text-xl font-bold mb-3">\${post.title}</h3>
              <p class="text-gray-600 mb-4">\${post.excerpt || ''}</p>
              <p class="text-sm text-gray-400">\${new Date(post.created_at).toLocaleDateString('ja-JP')}</p>
            </a>
          \`).join('')
        } catch (error) {
          console.error('Failed to load blog posts:', error)
        }
      }
      
      document.addEventListener('DOMContentLoaded', loadBlogPosts)
    </script>
</body>
</html>
  `)
})

// Blog post detail page
app.get('/blog/:slug', async (c) => {
  const slug = c.req.param('slug')
  
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>記事を読み込み中...</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Noto Sans JP', sans-serif;
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: 'Montserrat', 'Noto Sans JP', sans-serif;
      }
      .prose {
        max-width: 65ch;
      }
      .prose h1 { font-size: 2.5em; font-weight: 700; margin: 1em 0 0.5em; }
      .prose h2 { font-size: 2em; font-weight: 600; margin: 1.5em 0 0.5em; }
      .prose h3 { font-size: 1.5em; font-weight: 600; margin: 1.5em 0 0.5em; }
      .prose p { margin: 1em 0; line-height: 1.8; }
      .prose a { color: #3b82f6; text-decoration: underline; }
    </style>
</head>
<body class="bg-white text-gray-900">
    
    <header class="py-4 px-6 border-b bg-white">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
            <a href="/" class="flex items-center">
                <img src="/images/logo-horizontal.png" alt="Enthusiasts" class="h-10 w-auto">
            </a>
            <a href="/" class="text-sm text-gray-600 hover:text-gray-900">← ホームに戻る</a>
        </div>
    </header>

    <article class="py-16 px-6">
        <div id="article-content" class="max-w-4xl mx-auto prose">
            <p class="text-gray-500">読み込み中...</p>
        </div>
    </article>

    <footer class="py-16 px-6 bg-black text-white mt-32">
        <div class="max-w-6xl mx-auto">
            <div class="flex flex-col items-center mb-12">
                <img src="/images/logo-vertical.png" alt="Enthusiasts" class="h-32 w-auto mb-8 filter brightness-0 invert">
            </div>
            <div class="flex flex-col md:flex-row justify-between items-center mb-8">
                <nav class="flex space-x-8 mb-6 md:mb-0">
                    <a href="/#philosophy" class="text-gray-400 hover:text-white transition-colors">Philosophy</a>
                    <a href="/#what-we-do" class="text-gray-400 hover:text-white transition-colors">What We Do</a>
                    <a href="/#member" class="text-gray-400 hover:text-white transition-colors">Member</a>
                    <a href="/#blog" class="text-gray-400 hover:text-white transition-colors">Blog</a>
                </nav>
            </div>
            <div class="border-t border-gray-800 pt-8 text-center">
                <p class="text-lg font-light mb-4">出逢った人の才能の機会損失をゼロに</p>
                <p class="text-sm text-gray-400">&copy; 2024 Enthusiasts. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked@11.0.0/marked.min.js"></script>
    <script>
      async function loadPost() {
        try {
          const response = await axios.get('/api/posts/${slug}')
          const post = response.data.post
          
          document.title = post.title + ' | 才能を覚醒させる'
          
          const content = marked.parse(post.content)
          
          document.getElementById('article-content').innerHTML = \`
            <h1>\${post.title}</h1>
            <p class="text-sm text-gray-500 mb-8">\${new Date(post.created_at).toLocaleDateString('ja-JP')}</p>
            <div>\${content}</div>
          \`
        } catch (error) {
          console.error('Failed to load post:', error)
          document.getElementById('article-content').innerHTML = \`
            <p class="text-red-500">記事の読み込みに失敗しました</p>
          \`
        }
      }
      
      document.addEventListener('DOMContentLoaded', loadPost)
    </script>
</body>
</html>
  `)
})

export default app
