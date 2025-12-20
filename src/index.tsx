import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Serve static files (images, etc.)
app.use('/images/*', serveStatic({ root: './' }))

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
        background-image: url('/images/hero-background.jpg');
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
        cursor: pointer;
      }
      .member-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.15);
      }
      .modal-backdrop {
        backdrop-filter: blur(4px);
        animation: fadeIn 0.3s ease;
      }
      .modal-content {
        animation: slideUp 0.3s ease;
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
    </style>
</head>
<body class="bg-white text-gray-900 smooth-scroll">
    
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" class="flex items-center">
                <img src="/images/logo-header.png" alt="Enthusiasts" class="h-16 md:h-20 w-auto">
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
                <div class="member-card bg-white overflow-hidden shadow-sm rounded-lg" onclick="openMemberModal(0)">
                    <img src="/images/member-2.jpg" alt="佐々木 慧" class="w-full h-64 object-cover">
                    <div class="p-6">
                        <div class="text-xs font-bold text-gray-400 mb-2 tracking-widest">PROJECT LEADER</div>
                        <h3 class="text-2xl font-bold mb-2">佐々木 慧</h3>
                        <p class="text-sm text-gray-600">理念: 原石に光を</p>
                    </div>
                </div>

                <!-- Member 2: 布野 雅也 -->
                <div class="member-card bg-white overflow-hidden shadow-sm rounded-lg" onclick="openMemberModal(1)">
                    <img src="/images/member-1.jpg" alt="布野 雅也" class="w-full h-64 object-cover">
                    <div class="p-6">
                        <div class="text-xs font-bold text-gray-400 mb-2 tracking-widest">CORE MEMBER</div>
                        <h3 class="text-2xl font-bold mb-2">布野 雅也</h3>
                        <p class="text-sm text-gray-600">理念: Find Your Why .</p>
                    </div>
                </div>

                <!-- Member 3: 黒岩 礼生 -->
                <div class="member-card bg-white overflow-hidden shadow-sm rounded-lg" onclick="openMemberModal(2)">
                    <img src="/images/member-5.jpg" alt="黒岩 礼生" class="w-full h-64 object-cover">
                    <div class="p-6">
                        <div class="text-xs font-bold text-gray-400 mb-2 tracking-widest">CORE MEMBER</div>
                        <h3 class="text-2xl font-bold mb-2">黒岩 礼生</h3>
                        <p class="text-sm text-gray-600">理念: 人々に眠る愛おしさを照らし出す</p>
                    </div>
                </div>

                <!-- Member 4: 甘糟 里奈 -->
                <div class="member-card bg-white overflow-hidden shadow-sm rounded-lg" onclick="openMemberModal(3)">
                    <img src="/images/member-3.jpg" alt="甘糟 里奈" class="w-full h-64 object-cover">
                    <div class="p-6">
                        <div class="text-xs font-bold text-gray-400 mb-2 tracking-widest">MEMBER</div>
                        <h3 class="text-2xl font-bold mb-2">甘糟 里奈</h3>
                        <p class="text-sm text-gray-600">理念: 感性で世界を彩る</p>
                    </div>
                </div>

                <!-- Member 5: 當内 脩平 -->
                <div class="member-card bg-white overflow-hidden shadow-sm rounded-lg" onclick="openMemberModal(4)">
                    <img src="/images/member-4.jpg" alt="當内 脩平" class="w-full h-64 object-cover">
                    <div class="p-6">
                        <div class="text-xs font-bold text-gray-400 mb-2 tracking-widest">MEMBER</div>
                        <h3 class="text-2xl font-bold mb-2">當内 脩平</h3>
                        <p class="text-sm text-gray-600">理念: Make Your Rock</p>
                    </div>
                </div>

                <!-- Future Member Card -->
                <div class="bg-white overflow-hidden shadow-sm border-2 border-dashed border-gray-300 rounded-lg" style="cursor: default;">
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
            
            <!-- Member Modal -->
            <div id="memberModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 modal-backdrop px-4" onclick="closeMemberModal(event)">
                <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto modal-content" onclick="event.stopPropagation()">
                    <div class="relative">
                        <button onclick="closeMemberModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl z-10">&times;</button>
                        <div id="modalContent"></div>
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
      // Member data
      const memberData = [
        {
          name: '佐々木 慧',
          role: 'PROJECT LEADER',
          philosophy: '原石に光を',
          vision: '才能の機会損失がゼロになった世界',
          expertise: 'ファイナンス・経営戦略・プロデュース・考察',
          image: '/images/member-2.jpg',
          story: '元日本一のレーサーを父に持ち、自身もその背中を追いかけた元レーサー。レース中のクラッシュで再起不能となり、資金難も重なりレーサーの夢を断念。夢を失った虚無感から一念発起し、IT業界での成功を目指し上京。大学と専門学校のWスクールで勉強を重ね、多数の資格を取得。就職活動では、人気就活番組で年収600万円のオファーを勝ち取るも、用意された成功に違和感を覚え、すべての内定を辞退。その後、経営とファイナンスを学び、東大や京大でのイベントプロデュースに参画。現在は、出逢った人の才能の機会損失をゼロにするプロジェクトを立ち上げ、ご縁があった若者の衝動に愛と知性を加え、その可能性をプロデュースしている。'
        },
        {
          name: '布野 雅也',
          role: 'CORE MEMBER',
          philosophy: 'Find Your Why .',
          vision: '今を生きる人があふれる世界',
          expertise: 'マーケティング・PR・プロデュース',
          image: '/images/member-1.jpg',
          story: '「島根の陸上を強くする」その志を胸に、高校時代は絶対王者の25連覇を阻むジャイアントキリングを達成し、チームを初の全国へ導いた。その後、都内の強豪大学へ進むも、怪我により志半ばで引退。「走る」という生きがいを失いかけたが、陸上イベントの主催・プロデュースという新たな道に出逢う。そこで「人々が熱狂する瞬間」を生み出す喜びに目覚めた。就職活動では「自分の人生を自分の足で歩みたい」という想いから、複数の内定をすべて辞退。現在は佐々木と共に、自己実現へ向けた新たな一歩を踏み出している。'
        },
        {
          name: '黒岩 礼生',
          role: 'CORE MEMBER',
          philosophy: '人々に眠る愛おしさを照らし出す',
          vision: '誰もがかっこいい自分を大好きに',
          expertise: 'シークレット',
          image: '/images/member-5.jpg',
          story: '幼少期から不安定な家庭環境の中で過ごし、転居や人間関係における苦悩を経験。集団に馴染むことや「普通に生きること」に難しさを覚えながら大学時代を過ごす。一人暮らしの中で顕在化した「孤独」と向き合い続ける生活のなかで、生活習慣改善・体調管理をきっかけにポジティブなマインドセットを醸成することと、己を愛すること（自己愛）の重要性に気づく。現在は、食・健康・自己受容をテーマにコーチングやSNSで発信中。目指すのは、自立したGiver同士が愛し合う世界。「すみません」という謝罪ではなく、「ありがとう」という感謝が飛び交う日本に変えるべく、挑戦を続けている。'
        },
        {
          name: '甘糟 里奈',
          role: 'MEMBER',
          philosophy: '感性で世界を彩る',
          vision: '頑張る人々が心の余白で輝ける社会を',
          expertise: 'PR',
          image: '/images/member-3.jpg',
          story: '「本だけが、心の拠り所だった」 幼少期から3000冊以上の物語に没頭し、独自の感性を磨き上げた。「右向け右」の社会に葛藤しながらも、生徒会活動や豪州留学へ挑戦。外の世界に触れることで、日本のサブカルが放つ独自の輝きを再確認する。しかし、いじめや家庭崩壊、受験と就職の失敗により転落。生きる意味を喪失し、まさに「生きた屍」として日々を浪費していた。転機は、佐々木との出逢い。彼との対話により、自身の武器は読書で培った「感性」と「芸術」にあると気づく。現在は栃木県さくら市に移住し、地域おこし協力隊として活動中。地域の魅力をアートへと昇華させ、地元の人々と共に新たな熱狂を生み出している。'
        },
        {
          name: '當内 脩平',
          role: 'MEMBER',
          philosophy: 'Make Your Rock 〜自分を壊さない道と術を〜',
          vision: '衝動と脆さが響き合う世界に',
          expertise: 'PR・イベントプロデュース',
          image: '/images/member-4.jpg',
          url: 'https://starzdash.com/',
          story: '「正しさ」という仮面を被り、息を潜めて生きた少年時代。中学受験をするも、周囲の価値観に馴染めず、二度の不登校を経験。自分が間違っているかのような絶望の中で、魂を震わせる「Rock」に惹かれる。音楽がくれた救い、そして夢を追う同志や佐々木との出逢いを通じて衝動を形に変える手段を手に入れる。現在は、大阪天王寺にて音楽フェス「STAR\\'Z DASH!!」を主催。「衝動と脆さが響き合う世界」を現実にすべく、音楽と経営の二軸で、行き場のない若者たちの道を切り拓いている。'
        }
      ];

      // Open member modal
      function openMemberModal(index) {
        const member = memberData[index];
        const modal = document.getElementById('memberModal');
        const modalContent = document.getElementById('modalContent');
        
        modalContent.innerHTML = \`
          <img src="\${member.image}" alt="\${member.name}" class="w-full h-80 object-cover">
          <div class="p-8">
            <div class="text-sm font-bold text-gray-400 mb-2 tracking-widest">\${member.role}</div>
            <h2 class="text-3xl md:text-4xl font-bold mb-4">\${member.name}</h2>
            
            <div class="mb-6 pb-6 border-b">
              <p class="text-lg font-semibold text-gray-700 mb-2">理念</p>
              <p class="text-xl text-gray-900">\${member.philosophy}</p>
            </div>
            
            <div class="mb-6 pb-6 border-b">
              <p class="text-lg font-semibold text-gray-700 mb-2">ビジョン</p>
              <p class="text-xl text-gray-900">\${member.vision}</p>
            </div>
            
            <div class="mb-6 pb-6 border-b">
              <p class="text-lg font-semibold text-gray-700 mb-2">専門分野</p>
              <p class="text-gray-900">\${member.expertise}</p>
            </div>
            
            <div class="mb-6">
              <p class="text-lg font-semibold text-gray-700 mb-4">ストーリー</p>
              <p class="text-gray-700 leading-relaxed whitespace-pre-line">\${member.story}</p>
            </div>
            
            \${member.url ? \`
              <div class="mt-8">
                <a href="\${member.url}" target="_blank" rel="noopener noreferrer" class="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
                  詳しく見る →
                </a>
              </div>
            \` : ''}
          </div>
        \`;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
      }

      // Close member modal
      function closeMemberModal(event) {
        if (event && event.target !== event.currentTarget) return;
        
        const modal = document.getElementById('memberModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
      }

      // Close modal on Escape key
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
          closeMemberModal();
        }
      });
    
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
                <img src="/images/logo-header.png" alt="Enthusiasts" class="h-12 md:h-14 w-auto">
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
