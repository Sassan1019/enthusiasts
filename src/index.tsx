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
      .hero-gradient {
        background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%);
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
    </style>
</head>
<body class="bg-white text-gray-900 smooth-scroll">
    
    <!-- Hero Section -->
    <section class="relative h-screen flex items-center justify-center bg-black">
        <div class="hero-gradient absolute inset-0"></div>
        <div class="relative z-10 text-center text-white px-6 max-w-5xl fade-in">
            <h1 class="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
                出逢った人の才能の<br>機会損失をゼロに
            </h1>
            <div class="text-lg md:text-xl leading-relaxed space-y-4 max-w-3xl mx-auto font-light">
                <p>世界を変えてきたのは、特別な天才じゃない。</p>
                <p>「誰かを喜ばせたい」という、まっすぐな想いを信じ抜いた普通の人たちだ。</p>
                <p class="mt-8">心の中で生まれた小さな願いを、誰かのための形にする。</p>
                <p>それが、世界を動かす「才能」になる。</p>
                <p class="mt-8">最初は、根拠のない自信でいい。</p>
                <p>その自由な一歩が、いつか必ず誰かの救いになると信じて進めばいい。</p>
                <p class="mt-8 font-normal">私たちは、そんな一人ひとりの光を照らし合い、大きく育てていくチーム。</p>
                <p class="text-2xl font-medium mt-12">せっかくの才能が、誰にも知られずに消えていく。<br>そんな悲しいことは、もう終わりにしよう。</p>
                <p class="text-3xl md:text-4xl font-bold mt-12">全ては、出逢った人の才能の機会損失をゼロにするために!</p>
            </div>
        </div>
    </section>

    <!-- Philosophy Section -->
    <section id="philosophy" class="py-32 px-6 bg-white">
        <div class="max-w-4xl mx-auto">
            <h2 class="text-4xl md:text-5xl font-bold text-center mb-20">Philosophy</h2>
            
            <div class="space-y-16">
                <div class="text-center">
                    <h3 class="text-2xl md:text-3xl font-bold mb-4">理念</h3>
                    <p class="text-3xl md:text-4xl font-light mb-4">「才能を覚醒させる」</p>
                    <p class="text-gray-600 text-lg">眠っていた才能に火を灯し、その人だけの輝きを引き出す。</p>
                </div>

                <div class="text-center">
                    <h3 class="text-2xl md:text-3xl font-bold mb-4">ビジョン</h3>
                    <p class="text-3xl md:text-4xl font-light mb-4">「出逢った人の才能の機会損失をゼロにする」</p>
                    <p class="text-gray-600 text-lg">ハグレモノたちが主役として輝く、映画『グレイテスト・ショーマン』のような世界を創る。</p>
                </div>

                <div class="text-center">
                    <h3 class="text-2xl md:text-3xl font-bold mb-4">ミッション</h3>
                    <p class="text-3xl md:text-4xl font-light mb-4">「才能の化学反応を起こし続ける」</p>
                    <p class="text-gray-600 text-lg">「お前じゃ無理」を「お前じゃなきゃ無理」に変える。</p>
                </div>
            </div>
        </div>
    </section>

    <!-- What We Do Section -->
    <section id="what-we-do" class="py-32 px-6 bg-gray-50">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-4xl md:text-5xl font-bold text-center mb-20">What We Do</h2>
            
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
            <h2 class="text-4xl md:text-5xl font-bold text-center mb-20">Blog</h2>
            
            <div id="blog-posts" class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <!-- Blog posts will be loaded here -->
            </div>
        </div>
    </section>

    <!-- Member Section -->
    <section id="member" class="py-32 px-6 bg-gray-50">
        <div class="max-w-4xl mx-auto text-center">
            <h2 class="text-4xl md:text-5xl font-bold mb-12">Member</h2>
            <p class="text-xl text-gray-600">エンスーな人々</p>
            <p class="text-gray-500 mt-8">Coming soon...</p>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-16 px-6 bg-black text-white text-center">
        <p class="text-lg font-light mb-4">出逢った人の才能の機会損失をゼロに</p>
        <p class="text-sm text-gray-400">&copy; 2024 All rights reserved.</p>
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
    
    <header class="py-6 px-6 border-b">
        <div class="max-w-4xl mx-auto">
            <a href="/" class="text-sm text-gray-600 hover:text-gray-900">← ホームに戻る</a>
        </div>
    </header>

    <article class="py-16 px-6">
        <div id="article-content" class="max-w-4xl mx-auto prose">
            <p class="text-gray-500">読み込み中...</p>
        </div>
    </article>

    <footer class="py-16 px-6 bg-black text-white text-center mt-32">
        <p class="text-lg font-light mb-4">出逢った人の才能の機会損失をゼロに</p>
        <p class="text-sm text-gray-400">&copy; 2024 All rights reserved.</p>
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
