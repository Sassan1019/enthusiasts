import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database;
  ADMIN_PASSWORD_HASH?: string;
}

const app = new Hono<{ Bindings: Bindings }>()

// Serve static files (images, etc.)
app.use('/images/*', serveStatic({ root: './' }))
app.use('/manifest.json', serveStatic({ path: './manifest.json' }))
app.use('/robots.txt', serveStatic({ path: './robots.txt' }))
app.use('/sitemap.xml', serveStatic({ path: './sitemap.xml' }))

app.use('/api/*', cors())

// API: Get latest note.com articles (fetch from RSS)
app.get('/api/posts', async (c) => {
  try {
    // Fetch RSS feed from note.com with cache-busting
    const response = await fetch('https://note.com/sasaki1019/rss', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
    const rssText = await response.text()
    
    // Parse RSS XML
    const items = rssText.match(/<item>[\s\S]*?<\/item>/g) || []
    
    const posts = items.slice(0, 3).map(item => {
      // Extract data using regex
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)
      const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '') : 'Untitled'
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
      const descriptionMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)
      const description = descriptionMatch ? descriptionMatch[1] : ''
      
      // Extract thumbnail from media:thumbnail element
      const mediaThumbnailMatch = item.match(/<media:thumbnail>(.*?)<\/media:thumbnail>/)
      const thumbnail = mediaThumbnailMatch?.[1] || null
      
      // Extract plain text excerpt from description
      const excerpt = description
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .substring(0, 150)
      
      // Extract date
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/)
      const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString()
      
      return {
        title,
        external_url: link,
        excerpt,
        thumbnail_url: thumbnail,
        source: 'note',
        created_at: pubDate
      }
    })
    
    // Set response headers to prevent caching
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    c.header('Pragma', 'no-cache')
    c.header('Expires', '0')
    
    return c.json({ posts })
    
  } catch (error) {
    console.error('Failed to fetch note.com RSS:', error)
    return c.json({ posts: [] })
  }
})

// API: Submit contact form
app.post('/api/contact', async (c) => {
  const { DB } = c.env
  
  try {
    const { name, email, subject, message } = await c.req.json()
    
    // Validation
    if (!name || !email || !message) {
      return c.json({ error: 'Required fields are missing' }, 400)
    }
    
    // Insert contact into database
    await DB.prepare(`
      INSERT INTO contacts (name, email, subject, message, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'new', datetime('now'), datetime('now'))
    `).bind(name, email, subject || '', message).run()
    
    return c.json({ 
      success: true,
      message: 'Contact form submitted successfully' 
    })
    
  } catch (error) {
    console.error('Error submitting contact:', error)
    return c.json({ 
      error: 'Failed to submit contact form' 
    }, 500)
  }
})

// API: Admin login
app.post('/api/admin/login', async (c) => {
  try {
    const { password } = await c.req.json()
    const { ADMIN_PASSWORD_HASH } = c.env
    
    if (!password) {
      return c.json({ error: 'Password is required' }, 400)
    }
    
    // Hash the provided password using Web Crypto API
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    // Compare with stored hash
    if (hashHex === ADMIN_PASSWORD_HASH) {
      // Generate a simple session token
      const sessionToken = crypto.randomUUID()
      
      return c.json({ 
        success: true,
        token: sessionToken 
      })
    } else {
      return c.json({ error: 'Invalid password' }, 401)
    }
    
  } catch (error) {
    console.error('Error in admin login:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// API: Get all contacts (admin only)
app.get('/api/admin/contacts', async (c) => {
  const { DB } = c.env
  const authHeader = c.req.header('Authorization')
  
  // Simple token check (in production, use proper session management)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  try {
    const result = await DB.prepare(`
      SELECT id, name, email, subject, message, status, created_at
      FROM contacts
      ORDER BY created_at DESC
    `).all()
    
    return c.json({ contacts: result.results })
    
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return c.json({ error: 'Failed to fetch contacts' }, 500)
  }
})

// API: Update contact status (admin only)
app.patch('/api/admin/contacts/:id', async (c) => {
  const { DB } = c.env
  const authHeader = c.req.header('Authorization')
  const id = c.req.param('id')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  try {
    const { status } = await c.req.json()
    
    if (!['new', 'read', 'replied'].includes(status)) {
      return c.json({ error: 'Invalid status' }, 400)
    }
    
    await DB.prepare(`
      UPDATE contacts
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(status, id).run()
    
    return c.json({ success: true })
    
  } catch (error) {
    console.error('Error updating contact:', error)
    return c.json({ error: 'Failed to update contact' }, 500)
  }
})

// Home page
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enthusiasts｜出逢った人の才能の機会損失をゼロに</title>
    <meta name="description" content="エンスー（Enthusiasts）は才能を覚醒させるプロジェクト。出逢った人の才能の機会損失をゼロに。1on1コーチング、コミュニティ運営、イベント開催で才能の化学反応を起こし続ける。">
    <meta name="keywords" content="エンスー,Enthusiasts,才能,機会損失,覚醒,コーチング,コミュニティ,イベント,STAR'Z DASH,佐々木慧,才能開発,キャリア支援,自己実現">
    <meta name="author" content="Enthusiasts">
    <link rel="canonical" href="https://enthusiasts.jp/">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/images/favicon.png">
    <link rel="manifest" href="/manifest.json">
    
    <!-- OGP -->
    <meta property="og:site_name" content="Enthusiasts">
    <meta property="og:title" content="Enthusiasts｜出逢った人の才能の機会損失をゼロに">
    <meta property="og:description" content="エンスー（Enthusiasts）は才能を覚醒させるプロジェクト。出逢った人の才能の機会損失をゼロに。">
    <meta property="og:image" content="https://enthusiasts.jp/images/logo-horizontal.png">
    <meta property="og:url" content="https://enthusiasts.jp/">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="ja_JP">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Enthusiasts｜出逢った人の才能の機会損失をゼロに">
    <meta name="twitter:description" content="エンスー（Enthusiasts）は才能を覚醒させるプロジェクト。">
    <meta name="twitter:image" content="https://enthusiasts.jp/images/logo-horizontal.png">
    
    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Enthusiasts",
      "alternateName": "エンスー",
      "url": "https://enthusiasts.jp",
      "logo": "https://enthusiasts.jp/images/logo-horizontal.png",
      "description": "出逢った人の才能の機会損失をゼロにする。才能の化学反応を起こし続けるプロジェクト。",
      "foundingDate": "2024",
      "slogan": "出逢った人の才能の機会損失をゼロに",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Customer Service",
        "url": "https://enthusiasts.jp/contact"
      }
    }
    </script>
    
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
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
      .hero-bg {
        background-image: url('/images/hero-background.jpg');
        background-size: cover;
        background-position: center;
        background-attachment: scroll;
        background-repeat: no-repeat;
        /* Improve image rendering on mobile */
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
      }
      
      /* Desktop only: enable parallax effect */
      @media (min-width: 768px) {
        .hero-bg {
          background-attachment: fixed;
        }
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
        <div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <a href="/" class="flex items-center">
                <img src="/images/logo-header.png" alt="Enthusiasts" id="header-logo" class="h-10 md:h-12 w-auto cursor-pointer">
            </a>
            
            <!-- Desktop Navigation -->
            <nav class="hidden md:flex space-x-8">
                <a href="#philosophy" class="text-gray-700 hover:text-black transition-colors">Philosophy</a>
                <a href="#what-we-do" class="text-gray-700 hover:text-black transition-colors">What We Do</a>
                <a href="#our-work" class="text-gray-700 hover:text-black transition-colors">Our Work</a>
                <a href="#member" class="text-gray-700 hover:text-black transition-colors">Member</a>
                <a href="#blog" class="text-gray-700 hover:text-black transition-colors">Blog</a>
                <a href="/contact" class="text-gray-700 hover:text-black transition-colors">Contact</a>
            </nav>
            
            <!-- Mobile Hamburger Button -->
            <button id="mobile-menu-btn" class="md:hidden p-2 text-gray-700 hover:text-black transition-colors" aria-label="メニュー">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>
        </div>
        
        <!-- Mobile Navigation Menu -->
        <nav id="mobile-menu" class="hidden md:hidden bg-white border-t border-gray-200">
            <div class="px-6 py-4 space-y-3">
                <a href="#philosophy" class="block text-gray-700 hover:text-black transition-colors py-2">Philosophy</a>
                <a href="#what-we-do" class="block text-gray-700 hover:text-black transition-colors py-2">What We Do</a>
                <a href="#our-work" class="block text-gray-700 hover:text-black transition-colors py-2">Our Work</a>
                <a href="#member" class="block text-gray-700 hover:text-black transition-colors py-2">Member</a>
                <a href="#blog" class="block text-gray-700 hover:text-black transition-colors py-2">Blog</a>
                <a href="/contact" class="block text-gray-700 hover:text-black transition-colors py-2">Contact</a>
            </div>
        </nav>
    </header>
    
    <!-- Hero Section -->
    <section class="relative min-h-[70vh] md:min-h-screen flex items-center justify-center hero-bg py-16 md:py-32">
        <div class="hero-gradient absolute inset-0"></div>
        <div class="relative z-10 text-center text-white px-4 md:px-6 max-w-6xl fade-in">
            <!-- Hidden h1 for SEO -->
            <h1 class="sr-only">Enthusiasts（エンスー）｜出逢った人の才能の機会損失をゼロに - 才能を覚醒させるプロジェクト</h1>
            
            <!-- 大胆な英語タイポグラフィ -->
            <div class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 md:mb-12 leading-tight tracking-tight">
                A WORLD<br>
                WHERE<br>
                TALENT LOSS<br>
                IS ZERO
            </div>
            
            <div class="text-xl sm:text-2xl md:text-3xl font-light mb-12 md:mb-16 tracking-wide">
                出逢った人の才能の機会損失をゼロに
            </div>
            
            <div class="text-sm sm:text-base md:text-lg leading-relaxed space-y-4 md:space-y-6 max-w-3xl mx-auto font-light">
                <p>世界を変えてきたのは、特別な天才じゃない。<br>
                「誰かを喜ばせたい」という、まっすぐな想いを信じ抜いた普通の人たちだ。</p>
                
                <p class="mt-6 md:mt-8">心の中で生まれた小さな願いを、誰かのための形にする。<br>
                それが、世界を動かす「才能」になる。</p>
                
                <p class="mt-6 md:mt-8">最初は、根拠のない自信でいい。<br>
                その自由な一歩が、いつか必ず誰かの救いになると信じて進めばいい。</p>
                
                <p class="mt-8 md:mt-12 text-base sm:text-lg md:text-xl font-normal">私たちは、そんな一人ひとりの光を照らし合い、<br class="hidden sm:block">大きく育てていくチーム。</p>
            </div>
        </div>
    </section>

    <!-- Philosophy Section -->
    <section id="philosophy" class="py-10 md:py-32 px-4 md:px-6 bg-white">
        <div class="max-w-5xl mx-auto">
            <div class="text-center mb-12 md:mb-20">
                <h2 class="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 tracking-tight">PHILOSOPHY</h2>
                <p class="text-lg sm:text-xl md:text-2xl text-gray-600">私たちの哲学</p>
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
    <section id="what-we-do" class="py-10 md:py-32 px-4 md:px-6 bg-gray-50">
        <div class="max-w-6xl mx-auto">
            <div class="text-center mb-12 md:mb-20">
                <h2 class="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 tracking-tight">WHAT WE DO</h2>
                <p class="text-lg sm:text-xl md:text-2xl text-gray-600">提供価値</p>
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
                    <h3 class="text-2xl font-bold mb-4">プロデュース</h3>
                    <p class="text-gray-600">行き場のない衝動に愛と知性を加えて、価値あるものにプロデュースします。</p>
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
    <section id="blog" class="py-10 md:py-20 px-4 md:px-6 bg-white">
        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-12 md:mb-16">
                <h2 class="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 tracking-tight">BLOG</h2>
                <p class="text-lg sm:text-xl md:text-2xl text-gray-600">ブログ</p>
            </div>
            
            <!-- note-style article cards -->
            <div class="max-w-6xl mx-auto px-0 sm:px-4 md:px-6">
                <div id="blog-cards" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                    <!-- Cards will be loaded here -->
                </div>
            </div>
            
            <!-- Read More on note.com Button -->
            <div class="text-center mt-12 mb-8">
                <a href="https://note.com/sasaki1019/" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-8 py-3 bg-black hover:bg-gray-800 text-white rounded transition-all font-medium">
                    <span>他の記事を読む</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                </a>
            </div>
        </div>
    </section>

    <!-- Member Section -->
    <section id="member" class="py-10 md:py-32 px-4 md:px-6 bg-gray-50">
        <div class="max-w-6xl mx-auto">
            <div class="text-center mb-12 md:mb-16">
                <h2 class="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 tracking-tight">MEMBER</h2>
                <p class="text-lg sm:text-xl md:text-2xl text-gray-600">エンスーな人々</p>
            </div>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <!-- Member 1: 佐々木 慧 -->
                <div class="member-card bg-white overflow-hidden shadow-sm rounded-lg cursor-pointer" onclick="openMemberModal(0)">
                    <div class="w-full h-64 bg-gray-100 overflow-hidden">
                        <img src="/images/member-2.jpg" alt="佐々木 慧" class="w-full h-full object-cover">
                    </div>
                    <div class="p-6">
                        <div class="text-xs font-bold text-gray-400 mb-2 tracking-widest">PROJECT LEADER</div>
                        <h3 class="text-2xl font-bold mb-2">佐々木 慧</h3>
                        <p class="text-sm text-gray-600">理念: 原石に光を</p>
                    </div>
                </div>

                <!-- Member 2: 布野 雅也 -->
                <div class="member-card bg-white overflow-hidden shadow-sm rounded-lg cursor-pointer" onclick="openMemberModal(1)">
                    <div class="w-full h-64 bg-gray-100 overflow-hidden">
                        <img src="/images/member-1.jpg" alt="布野 雅也" class="w-full h-full object-cover">
                    </div>
                    <div class="p-6">
                        <div class="text-xs font-bold text-gray-400 mb-2 tracking-widest">CORE MEMBER</div>
                        <h3 class="text-2xl font-bold mb-2">布野 雅也</h3>
                        <p class="text-sm text-gray-600">理念: Find Your Why .</p>
                    </div>
                </div>

                <!-- Member 3: 黒岩 礼生 -->
                <div class="member-card bg-white overflow-hidden shadow-sm rounded-lg cursor-pointer" onclick="openMemberModal(2)">
                    <div class="w-full h-64 bg-gray-100 overflow-hidden">
                        <img src="/images/member-5.jpg" alt="黒岩 礼生" class="w-full h-full object-cover">
                    </div>
                    <div class="p-6">
                        <div class="text-xs font-bold text-gray-400 mb-2 tracking-widest">CORE MEMBER</div>
                        <h3 class="text-2xl font-bold mb-2">黒岩 礼生</h3>
                        <p class="text-sm text-gray-600">理念: 人々に眠る愛おしさを照らし出す</p>
                    </div>
                </div>

                <!-- Member 4: 甘糟 里奈 -->
                <div class="member-card bg-white overflow-hidden shadow-sm rounded-lg cursor-pointer" onclick="openMemberModal(3)">
                    <div class="w-full h-64 bg-gray-100 overflow-hidden">
                        <img src="/images/member-3.jpg" alt="甘糟 里奈" class="w-full h-full object-cover">
                    </div>
                    <div class="p-6">
                        <div class="text-xs font-bold text-gray-400 mb-2 tracking-widest">MEMBER</div>
                        <h3 class="text-2xl font-bold mb-2">甘糟 里奈</h3>
                        <p class="text-sm text-gray-600">理念: 感性で世界を彩る</p>
                    </div>
                </div>

                <!-- Member 5: 當内 脩平 -->
                <div class="member-card bg-white overflow-hidden shadow-sm rounded-lg cursor-pointer" onclick="openMemberModal(4)">
                    <div class="w-full h-64 bg-gray-100 overflow-hidden">
                        <img src="/images/member-4.jpg" alt="當内 脩平" class="w-full h-full object-cover">
                    </div>
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
            
            <!-- Image Zoom Modal -->
            <div id="imageModal" class="fixed inset-0 bg-black bg-opacity-95 hidden items-center justify-center z-[60] p-4" onclick="closeImageModal()">
                <button onclick="closeImageModal()" class="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl z-10">&times;</button>
                <img id="zoomedImage" src="" alt="" class="max-w-full max-h-[95vh] w-auto h-auto object-contain">
            </div>
            
            <!-- Admin Login Modal -->
            <div id="adminLoginModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 px-4">
                <div class="bg-white rounded-lg max-w-md w-full p-8 relative">
                    <button onclick="closeAdminLogin()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                    <h2 class="text-2xl font-bold mb-6 text-center">管理者ログイン</h2>
                    <form id="admin-login-form" class="space-y-4">
                        <div>
                            <label for="admin-password" class="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
                            <input type="password" id="admin-password" name="password" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none">
                        </div>
                        <div id="admin-login-error" class="hidden text-red-600 text-sm"></div>
                        <button type="submit" id="admin-login-btn"
                                class="w-full bg-gray-900 text-white py-3 px-6 rounded hover:bg-gray-800 transition-colors font-medium">
                            ログイン
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <!-- Our Work Section -->
    <section id="our-work" class="py-10 md:py-32 px-4 md:px-6 bg-white">
        <div class="max-w-6xl mx-auto">
            <div class="text-center mb-12 md:mb-20">
                <h2 class="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 tracking-tight">OUR WORK</h2>
                <p class="text-lg sm:text-xl md:text-2xl text-gray-600">私たちの衝動</p>
            </div>
            
            <!-- STAR'Z DASH!! -->
            <div class="mb-16 md:mb-24">
                <div class="bg-black rounded-xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow">
                    <div class="grid md:grid-cols-2 gap-0">
                        <!-- Image/Visual Side -->
                        <div class="relative h-64 md:h-auto bg-black flex items-center justify-center p-0">
                            <img src="/images/starzdash-logo.jpg" alt="STAR'Z DASH!!" class="w-full h-full object-cover">
                        </div>
                        
                        <!-- Content Side -->
                        <div class="p-8 md:p-12 text-white bg-gradient-to-br from-gray-900 to-black">
                            <div class="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">NOW AVAILABLE</div>
                            <h3 class="text-2xl md:text-3xl font-bold mb-4">STAR'Z DASH!!</h3>
                            <p class="text-gray-300 mb-6 leading-relaxed">
                                才能を持つ若者たちが、自分の可能性に気づき、一歩を踏み出すためのプログラム。
                                <br><br>
                                「お前じゃ無理」を「お前じゃなきゃ無理」に変える、挑戦の場。
                            </p>
                            <a href="https://starzdash.com/" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-white hover:text-red-400 transition-colors font-bold">
                                詳細を見る
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Coming Soon -->
            <div class="text-center py-12">
                <p class="text-2xl md:text-3xl font-light text-gray-400 tracking-widest">Coming Soon...</p>
            </div>
        </div>
    </section>

    <!-- CTA Banner Section -->
    <section class="py-10 md:py-16 px-6 bg-gray-50">
        <div class="max-w-6xl mx-auto">
            <div class="grid md:grid-cols-2 gap-8">
                <!-- Join Us -->
                <a href="/contact" class="block group">
                    <div class="bg-black text-white p-8 md:p-12 rounded-lg transition-transform hover:-translate-y-2">
                        <h3 class="text-2xl md:text-3xl font-bold mb-3 md:mb-4">JOIN US</h3>
                        <p class="text-base md:text-lg mb-4 md:mb-6">才能を覚醒させる<br>旅に参加しませんか?</p>
                        <span class="text-sm font-bold tracking-widest group-hover:underline">CONTACT →</span>
                    </div>
                </a>
                
                <!-- Contact -->
                <a href="#blog" class="block group">
                    <div class="bg-white border-2 border-black p-8 md:p-12 rounded-lg transition-transform hover:-translate-y-2">
                        <h3 class="text-2xl md:text-3xl font-bold mb-3 md:mb-4">BLOG</h3>
                        <p class="text-base md:text-lg mb-4 md:mb-6">私たちの活動や<br>想いを発信しています</p>
                        <span class="text-sm font-bold tracking-widest group-hover:underline">READ MORE →</span>
                    </div>
                </a>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-10 md:py-16 px-6 bg-black text-white">
        <div class="max-w-6xl mx-auto">
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8">
                <nav class="flex flex-wrap justify-center gap-4 md:gap-8 mb-4 md:mb-0">
                    <a href="#philosophy" class="text-gray-400 hover:text-white transition-colors">Philosophy</a>
                    <a href="#what-we-do" class="text-gray-400 hover:text-white transition-colors">What We Do</a>
                    <a href="#our-work" class="text-gray-400 hover:text-white transition-colors">Our Work</a>
                    <a href="#member" class="text-gray-400 hover:text-white transition-colors">Member</a>
                    <a href="#blog" class="text-gray-400 hover:text-white transition-colors">Blog</a>
                    <a href="/contact" class="text-gray-400 hover:text-white transition-colors">Contact</a>
                </nav>
            </div>
            <div class="border-t border-gray-800 pt-8 text-center">
                <p class="text-lg font-light mb-4">出逢った人の才能の機会損失をゼロに</p>
                <p class="text-sm text-gray-400 mb-2">
                    <a href="/privacy" class="hover:text-white transition-colors">プライバシーポリシー</a>
                </p>
                <p class="text-sm text-gray-400">&copy; 2025 Enthusiasts. All rights reserved.</p>
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
          story: '元日本一のレーサーを父に持ち、自身もその背中を追いかけた元レーサー。レース中のクラッシュで再起不能となり、資金難も重なりレーサーの夢を断念。夢を失った虚無感から一念発起し、IT業界での成功を目指し上京。大学と専門学校のWスクールで勉強を重ね、多数の資格を取得。就職活動では、人気就活番組で年収600万円のオファーを勝ち取るも、用意された成功に違和感を覚え、すべての内定を辞退。その後、経営とファイナンスを学び、東大や京大でのイベントプロデュースに参画。現在は、出逢った人の才能の機会損失をゼロにするプロジェクトを立ち上げ、ご縁があった若者の衝動に愛と知性を加え、その可能性をプロデュースしている。',
          social: {
            instagram: 'https://www.instagram.com/sasaki.1019/',
            x: 'https://x.com/Cat_badminton'
          }
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
          <div class="w-full h-64 bg-gray-100 overflow-hidden">
            <img src="\${member.image}" alt="\${member.name}" class="w-full h-full object-cover">
          </div>
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
            
            \${member.social ? \`
              <div class="mb-6 pb-6 border-t pt-6">
                <p class="text-lg font-semibold text-gray-700 mb-4">SNS</p>
                <div class="flex gap-4">
                  \${member.social.instagram ? \`
                    <a href="\${member.social.instagram}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                      <img src="/images/icon-instagram.png" alt="Instagram" class="w-6 h-6">
                      <span class="text-sm font-medium">Instagram</span>
                    </a>
                  \` : ''}
                  \${member.social.x ? \`
                    <a href="\${member.social.x}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                      <img src="/images/icon-x.png" alt="X" class="w-6 h-6">
                      <span class="text-sm font-medium">X</span>
                    </a>
                  \` : ''}
                </div>
              </div>
            \` : ''}
            
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

      // Open image zoom modal
      function openImageModal(imageSrc, altText) {
        const modal = document.getElementById('imageModal');
        const img = document.getElementById('zoomedImage');
        img.src = imageSrc;
        img.alt = altText;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        event.stopPropagation();
      }

      // Close image zoom modal
      function closeImageModal() {
        const modal = document.getElementById('imageModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }

      // Close modal on Escape key
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
          closeMemberModal();
          closeImageModal();
        }
      });
    
      // Load blog posts
      
      // Secret command: Click header logo 5 times to show admin login
      let currentSlide = 0
      let slideInterval
      
      // Mobile menu toggle
      const mobileMenuBtn = document.getElementById('mobile-menu-btn')
      const mobileMenu = document.getElementById('mobile-menu')
      
      if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
          mobileMenu.classList.toggle('hidden')
        })
        
        // Close menu when clicking a link
        const mobileLinks = mobileMenu.querySelectorAll('a')
        mobileLinks.forEach(link => {
          link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden')
          })
        })
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
          if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
            mobileMenu.classList.add('hidden')
          }
        })
      }
      
      // Load blog cards (note.com style)
      async function loadBlogCards() {
        try {
          const response = await axios.get('/api/posts')
          const posts = response.data.posts.slice(0, 3) // Get top 3 articles
          
          if (posts.length === 0) return
          
          const blogCards = document.getElementById('blog-cards')
          
          // Create note-style cards (vertical layout - professional design)
          blogCards.innerHTML = posts.map(post => {
            const isNote = post.source === 'note'
            const href = isNote ? post.external_url : \`/blog/\${post.slug}\`
            const target = isNote ? 'target="_blank" rel="noopener noreferrer"' : ''
            
            return \`
              <a href="\${href}" \${target} class="block relative bg-white rounded border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all group">
                <!-- Image (note.com style aspect ratio) -->
                <div class="relative w-full bg-gray-100" style="padding-bottom: 52%;">
                  \${post.thumbnail_url ? \`
                    <img src="\${post.thumbnail_url}" alt="\${post.title}" class="absolute inset-0 w-full h-full object-cover">
                  \` : \`
                    <div class="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <img src="/images/note-logo-black.png" alt="note" class="w-24 h-auto opacity-10">
                    </div>
                  \`}
                </div>
                
                <!-- Content -->
                <div class="p-4">
                  <h3 class="font-bold text-base mb-2 text-gray-900 line-clamp-2 leading-relaxed">\${post.title}</h3>
                  <p class="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">\${post.excerpt || ''}</p>
                  <div class="flex items-center gap-2 text-xs text-gray-400 mt-auto">
                    <span>\${new Date(post.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })}</span>
                  </div>
                </div>
                
                <!-- Note logo in bottom-right of card -->
                <div class="absolute bottom-3 right-3">
                  <img src="/images/note-logo-black.png" alt="note" class="h-6 opacity-80">
                </div>
              </a>
            \`
          }).join('')
          
        } catch (error) {
          console.error('Failed to load blog cards:', error)
        }
      }
      
      // Secret command: Click header logo 5 times to show admin login
      // Single click: Navigate to TOP
      let logoClickCount = 0
      let logoClickTimer = null
      let singleClickTimer = null
      
      const headerLogo = document.getElementById('header-logo')
      if (headerLogo) {
        headerLogo.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          
          logoClickCount++
          
          // Clear single click timer if multiple clicks detected
          clearTimeout(singleClickTimer)
          
          // Reset counter after 2 seconds of inactivity
          clearTimeout(logoClickTimer)
          logoClickTimer = setTimeout(() => {
            logoClickCount = 0
          }, 2000)
          
          // Show admin login modal after 5 clicks
          if (logoClickCount === 5) {
            logoClickCount = 0
            clearTimeout(singleClickTimer)
            showAdminLogin()
          } else {
            // Set timer for single click navigation
            singleClickTimer = setTimeout(() => {
              if (logoClickCount === 1) {
                window.location.href = '/'
              }
              logoClickCount = 0
            }, 300) // Wait 300ms to distinguish from multi-click
          }
        })
      }
      
      function showAdminLogin() {
        const modal = document.getElementById('adminLoginModal')
        modal.classList.remove('hidden')
        modal.classList.add('flex')
        document.body.style.overflow = 'hidden'
      }
      
      function closeAdminLogin() {
        const modal = document.getElementById('adminLoginModal')
        modal.classList.remove('flex')
        modal.classList.add('hidden')
        document.body.style.overflow = ''
        document.getElementById('admin-password').value = ''
        document.getElementById('admin-login-error').classList.add('hidden')
      }
      
      // Admin login form submission
      document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const password = document.getElementById('admin-password').value
        const loginBtn = document.getElementById('admin-login-btn')
        const loginError = document.getElementById('admin-login-error')
        
        loginBtn.disabled = true
        loginBtn.textContent = 'ログイン中...'
        loginError.classList.add('hidden')
        
        try {
          const response = await axios.post('/api/admin/login', { password })
          const authToken = response.data.token
          localStorage.setItem('admin_token', authToken)
          
          // Redirect to admin panel
          window.location.href = '/admin/contacts'
        } catch (error) {
          loginError.textContent = 'パスワードが正しくありません'
          loginError.classList.remove('hidden')
        } finally {
          loginBtn.disabled = false
          loginBtn.textContent = 'ログイン'
        }
      })
      
      document.addEventListener('DOMContentLoaded', () => {
        loadBlogCards()
      })
    </script>
</body>
</html>
  `)
})

// Contact page
app.get('/contact', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>お問い合わせ | Enthusiasts</title>
    <meta name="description" content="お問い合わせフォーム - Enthusiasts">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/images/favicon.png">
    <link rel="manifest" href="/manifest.json">
    
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
      .hubspot-iframe {
        border: none;
        width: 100%;
        min-height: 800px;
      }
    </style>
</head>
<body class="bg-white text-gray-900">
    
    <!-- Header -->
    <header class="py-4 px-6 border-b bg-white">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
            <a href="/" class="flex items-center">
                <img src="/images/logo-header.png" alt="Enthusiasts" class="h-10 md:h-12 w-auto">
            </a>
            <a href="/" class="text-sm text-gray-600 hover:text-gray-900">← ホームに戻る</a>
        </div>
    </header>

    <!-- Contact Section -->
    <section class="py-16 px-6">
        <div class="max-w-3xl mx-auto">
            <div class="text-center mb-12">
                <h1 class="text-3xl md:text-4xl font-bold mb-4 tracking-tight">CONTACT</h1>
                <p class="text-base md:text-lg text-gray-600">お問い合わせ</p>
            </div>
            
            <div class="bg-white rounded-lg border border-gray-200 p-8">
                <p class="text-gray-700 mb-8 text-center">
                    ご質問やご相談など、お気軽にお問い合わせください。
                </p>
                
                <!-- Contact Form -->
                <form id="contact-form" class="space-y-6">
                    <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">お名前 <span class="text-red-500">*</span></label>
                        <input type="text" id="name" name="name" required 
                               class="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all">
                    </div>
                    
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">メールアドレス <span class="text-red-500">*</span></label>
                        <input type="email" id="email" name="email" required 
                               class="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all">
                    </div>
                    
                    <div>
                        <label for="subject" class="block text-sm font-medium text-gray-700 mb-2">件名</label>
                        <input type="text" id="subject" name="subject" 
                               class="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all">
                    </div>
                    
                    <div>
                        <label for="message" class="block text-sm font-medium text-gray-700 mb-2">お問い合わせ内容 <span class="text-red-500">*</span></label>
                        <textarea id="message" name="message" required rows="6"
                                  class="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all resize-none"></textarea>
                    </div>
                    
                    <div class="text-xs text-gray-600">
                        <p>お送りいただいた個人情報は、<a href="/privacy" class="text-gray-900 hover:underline">プライバシーポリシー</a>に基づき適切に管理いたします。</p>
                    </div>
                    
                    <div>
                        <button type="submit" id="submit-btn"
                                class="w-full bg-gray-900 text-white py-3 px-6 rounded hover:bg-gray-800 transition-colors font-medium">
                            送信する
                        </button>
                    </div>
                    
                    <div id="form-message" class="hidden mt-4 p-4 rounded"></div>
                </form>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-10 md:py-16 px-6 bg-black text-white mt-32">
        <div class="max-w-6xl mx-auto">
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8">
                <nav class="flex flex-wrap justify-center gap-4 md:gap-8 mb-4 md:mb-0">
                    <a href="/#philosophy" class="text-gray-400 hover:text-white transition-colors">Philosophy</a>
                    <a href="/#what-we-do" class="text-gray-400 hover:text-white transition-colors">What We Do</a>
                    <a href="/#our-work" class="text-gray-400 hover:text-white transition-colors">Our Work</a>
                    <a href="/#member" class="text-gray-400 hover:text-white transition-colors">Member</a>
                    <a href="/#blog" class="text-gray-400 hover:text-white transition-colors">Blog</a>
                    <a href="/contact" class="text-gray-400 hover:text-white transition-colors">Contact</a>
                </nav>
            </div>
            <div class="border-t border-gray-800 pt-8 text-center">
                <p class="text-lg font-light mb-4">出逢った人の才能の機会損失をゼロに</p>
                <p class="text-sm text-gray-400 mb-2">
                    <a href="/privacy" class="hover:text-white transition-colors">プライバシーポリシー</a>
                </p>
                <p class="text-sm text-gray-400">&copy; 2025 Enthusiasts. All rights reserved.</p>
            </div>
        </div>
    </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
      document.getElementById('contact-form').addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const submitBtn = document.getElementById('submit-btn')
        const formMessage = document.getElementById('form-message')
        
        submitBtn.disabled = true
        submitBtn.textContent = '送信中...'
        
        const formData = {
          name: document.getElementById('name').value,
          email: document.getElementById('email').value,
          subject: document.getElementById('subject').value,
          message: document.getElementById('message').value
        }
        
        try {
          const response = await axios.post('/api/contact', formData)
          
          formMessage.classList.remove('hidden', 'bg-red-50', 'text-red-700')
          formMessage.classList.add('bg-green-50', 'text-green-700')
          formMessage.textContent = 'お問い合わせを受け付けました。ご連絡ありがとうございます。'
          
          document.getElementById('contact-form').reset()
          
          setTimeout(() => {
            formMessage.classList.add('hidden')
          }, 5000)
          
        } catch (error) {
          formMessage.classList.remove('hidden', 'bg-green-50', 'text-green-700')
          formMessage.classList.add('bg-red-50', 'text-red-700')
          formMessage.textContent = '送信に失敗しました。もう一度お試しください。'
        } finally {
          submitBtn.disabled = false
          submitBtn.textContent = '送信する'
        }
      })
    </script>
</body>
</html>
  `)
})

// Privacy Policy page
app.get('/privacy', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>プライバシーポリシー | Enthusiasts</title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/images/favicon.png">
    <link rel="manifest" href="/manifest.json">
    
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
    </style>
</head>
<body class="bg-white text-gray-900">
    
    <!-- Header -->
    <header class="py-4 px-6 border-b bg-white">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
            <a href="/" class="flex items-center">
                <img src="/images/logo-header.png" alt="Enthusiasts" class="h-10 md:h-12 w-auto">
            </a>
            <a href="/" class="text-sm text-gray-600 hover:text-gray-900">← ホームに戻る</a>
        </div>
    </header>

    <!-- Privacy Policy Content -->
    <article class="py-16 px-6">
        <div class="max-w-4xl mx-auto">
            <h1 class="text-3xl md:text-4xl font-bold mb-8 tracking-tight">プライバシーポリシー</h1>
            
            <div class="prose max-w-none">
                <p class="mb-8 leading-relaxed">エンスージアスツ（以下「当団体」といいます。）は、当団体の運営する事業において当団体が取得する個人情報につき、その取扱い及び管理に関する指針として、本プライバシーポリシー（以下「本ポリシー」といいます。）を定めております。</p>
                
                <h2 class="text-2xl font-bold mt-12 mb-4">個人情報</h2>
                <p class="mb-6 leading-relaxed">本ポリシーにおいて、「個人情報」とは、個人情報の保護に関する法律（以下「個人情報保護法」といいます。）で定義された「個人情報」をいい、生存する個人に関する情報（個人の氏名、生年月日、住所、電話番号及び連絡先情報を含む。）及び特定の個人を識別可能なその他の記述若しくは情報（個人の外見や声又はその他の種類の個人を識別可能な情報）を意味します。</p>
                
                <h2 class="text-2xl font-bold mt-12 mb-4">個人情報の利用目的</h2>
                <p class="mb-4 leading-relaxed">当団体は、以下の目的（以下「本目的」といいます。）のために個人情報を取得し、利用します。</p>
                <ul class="list-disc pl-6 mb-6 space-y-2 leading-relaxed">
                    <li>当団体が運営する事業におけるサービス提供、利用手続き、健康管理、その他各管理運営業務の実施のため</li>
                    <li>当団体が運営する事業の円滑な運営、安全管理、緊急対応のため</li>
                    <li>当団体が運営するイベントに関する告知等各種連絡のため</li>
                    <li>当団体が実施するアンケートや広報資料作成、取得のため</li>
                    <li>当団体への採用応募者の採否の検討、決定及びその記録のため</li>
                </ul>
                
                <h2 class="text-2xl font-bold mt-12 mb-4">第三者提供</h2>
                <p class="mb-6 leading-relaxed">当団体は、法令により許容される場合又は要求される場合を除き、本人の事前の承諾なしに本人の個人情報を第三者に提供しません。</p>
                <p class="mb-6 leading-relaxed">当団体は、個人情報保護法に従って、当団体の業務の実施、本事業の実施及び本目的の達成のために、本人の個人情報の処理を第三者に委託する場合があります。この場合当団体は、本人の個人情報の処理のために必要な範囲で、本人の個人情報を提供し、当該委託先が本人の個人情報を法令に従って処理するよう監督します。本人の個人情報を処理する委託先は、受領した個人情報を当団体が指示した目的以外に用いることはできません。</p>
                
                <h2 class="text-2xl font-bold mt-12 mb-4">本人の個人情報の開示、訂正又は削除の要請</h2>
                <h3 class="text-xl font-semibold mt-8 mb-3">（1）情報の開示</h3>
                <p class="mb-6 leading-relaxed">当団体が本人から個人情報の開示の請求を受けた場合、当団体は、ご請求にお応えする前に、本人確認をします。本人確認後、当団体は個人情報保護法に従って本人からの請求につき審査いたします。当団体が、請求された情報を開示できない又は開示しない旨を決定した場合は、その旨を通知いたします。</p>
                
                <h3 class="text-xl font-semibold mt-8 mb-3">（2）情報の訂正及び削除</h3>
                <p class="mb-6 leading-relaxed">本人が、当団体に提出した自らの個人情報の一部が不正確であることに気付いた場合は、可能な限り速やかに当該誤りを修正するものとします。当団体は、受領した全てのリクエストについて精査し、情報の修正が必要と判断した場合は、該当する個人情報の修正を行います。また、情報の修正が不要又は不当と判断した場合は、当該決定について本人にご連絡します。</p>
                
                <h2 class="text-2xl font-bold mt-12 mb-4">当団体の保存期間</h2>
                <p class="mb-6 leading-relaxed">当団体は、本ポリシーに定める本目的の遂行に必要な期間、本人の個人情報を保持し、これに加えて、法令又は当団体の規則に照らして本人の個人情報を保持するべき義務がある限度で、更に本人の個人情報を保持します。</p>
                
                <h2 class="text-2xl font-bold mt-12 mb-4">データセキュリティ</h2>
                <p class="mb-6 leading-relaxed">当団体は、当団体が収集する情報の送信及び保管を適切に保護するため、技術的、物理的かつ組織的な各種対策及び管理を実施しています。当団体は、本人の個人情報について、その重要性や要保護性に応じて合理的な保護を講じるものとします。当団体は、当団体が管理する本人の個人情報を不正アクセスの脅威から保護するため、合理的なセキュリティ対策を講じる努力をし、個人情報の漏洩、紛失又は損傷の防止に努めるものとします。万が一、個人情報の漏洩又はその他のセキュリティインシデントが発生した場合、当団体は、直ちに本人に通知し、関連法令で定められた手続きに従って必要な措置を講じます。</p>
                
                <h2 class="text-2xl font-bold mt-12 mb-4">本ポリシーの変更</h2>
                <p class="mb-6 leading-relaxed">当団体は、時期を問わず、また理由の如何によらず、当団体の単独の裁量で本ポリシーを更新することがあります。当団体は、本ポリシーを変更するときは、本人に対して改訂の内容について、改訂の効力発生日に先立ち、合理的な内容で事前通知を行います。また、改訂後の本ポリシーは、当団体のウェブサイトに掲示され、その効力発生日に有効になります。</p>
            </div>
        </div>
    </article>

    <!-- Footer -->
    <footer class="py-10 md:py-16 px-6 bg-black text-white mt-32">
        <div class="max-w-6xl mx-auto">
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8">
                <nav class="flex flex-wrap justify-center gap-4 md:gap-8 mb-4 md:mb-0">
                    <a href="/#philosophy" class="text-gray-400 hover:text-white transition-colors">Philosophy</a>
                    <a href="/#what-we-do" class="text-gray-400 hover:text-white transition-colors">What We Do</a>
                    <a href="/#our-work" class="text-gray-400 hover:text-white transition-colors">Our Work</a>
                    <a href="/#member" class="text-gray-400 hover:text-white transition-colors">Member</a>
                    <a href="/#blog" class="text-gray-400 hover:text-white transition-colors">Blog</a>
                    <a href="/contact" class="text-gray-400 hover:text-white transition-colors">Contact</a>
                </nav>
            </div>
            <div class="border-t border-gray-800 pt-8 text-center">
                <p class="text-lg font-light mb-4">出逢った人の才能の機会損失をゼロに</p>
                <p class="text-sm text-gray-400 mb-2">
                    <a href="/privacy" class="hover:text-white transition-colors">プライバシーポリシー</a>
                </p>
                <p class="text-sm text-gray-400">&copy; 2025 Enthusiasts. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>
  `)
})

// Admin contacts page
app.get('/admin/contacts', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理画面 | Enthusiasts</title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/images/favicon.png">
    <link rel="manifest" href="/manifest.json">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Noto Sans JP', sans-serif;
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: 'Montserrat', 'Noto Sans JP', sans-serif;
      }
    </style>
</head>
<body class="bg-gray-50 text-gray-900">
    
    <!-- Login Modal -->
    <div id="login-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 class="text-2xl font-bold mb-6 text-center">管理者ログイン</h2>
            <form id="login-form" class="space-y-4">
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
                    <input type="password" id="password" name="password" required
                           class="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none">
                </div>
                <div id="login-error" class="hidden text-red-600 text-sm"></div>
                <button type="submit" id="login-btn"
                        class="w-full bg-gray-900 text-white py-3 px-6 rounded hover:bg-gray-800 transition-colors font-medium">
                    ログイン
                </button>
            </form>
        </div>
    </div>

    <!-- Admin Panel -->
    <div id="admin-panel" class="hidden">
        <header class="bg-white border-b">
            <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <h1 class="text-2xl font-bold">お問い合わせ管理</h1>
                <div class="flex items-center gap-4">
                    <button onclick="loadContacts()" class="text-sm text-gray-600 hover:text-gray-900">
                        🔄 更新
                    </button>
                    <button onclick="logout()" class="text-sm text-gray-600 hover:text-gray-900">
                        ログアウト
                    </button>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-6 py-8">
            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div class="bg-white p-6 rounded-lg border">
                    <div class="text-sm text-gray-600 mb-1">新着</div>
                    <div class="text-3xl font-bold" id="stat-new">0</div>
                </div>
                <div class="bg-white p-6 rounded-lg border">
                    <div class="text-sm text-gray-600 mb-1">確認済み</div>
                    <div class="text-3xl font-bold" id="stat-read">0</div>
                </div>
                <div class="bg-white p-6 rounded-lg border">
                    <div class="text-sm text-gray-600 mb-1">返信済み</div>
                    <div class="text-3xl font-bold" id="stat-replied">0</div>
                </div>
            </div>

            <!-- Contacts List -->
            <div class="bg-white rounded-lg border">
                <div id="contacts-container" class="divide-y">
                    <div class="p-8 text-center text-gray-500">
                        読み込み中...
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
      let authToken = localStorage.getItem('admin_token')
      
      // Check if already logged in
      if (authToken) {
        showAdminPanel()
      }
      
      // Login form submission
      document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const password = document.getElementById('password').value
        const loginBtn = document.getElementById('login-btn')
        const loginError = document.getElementById('login-error')
        
        loginBtn.disabled = true
        loginBtn.textContent = 'ログイン中...'
        loginError.classList.add('hidden')
        
        try {
          const response = await axios.post('/api/admin/login', { password })
          authToken = response.data.token
          localStorage.setItem('admin_token', authToken)
          showAdminPanel()
        } catch (error) {
          loginError.textContent = 'パスワードが正しくありません'
          loginError.classList.remove('hidden')
        } finally {
          loginBtn.disabled = false
          loginBtn.textContent = 'ログイン'
          document.getElementById('password').value = ''
        }
      })
      
      function showAdminPanel() {
        document.getElementById('login-modal').classList.add('hidden')
        document.getElementById('admin-panel').classList.remove('hidden')
        loadContacts()
      }
      
      function logout() {
        localStorage.removeItem('admin_token')
        authToken = null
        document.getElementById('login-modal').classList.remove('hidden')
        document.getElementById('admin-panel').classList.add('hidden')
      }
      
      async function loadContacts() {
        try {
          const response = await axios.get('/api/admin/contacts', {
            headers: { 'Authorization': \`Bearer \${authToken}\` }
          })
          
          const contacts = response.data.contacts
          
          // Update stats
          document.getElementById('stat-new').textContent = contacts.filter(c => c.status === 'new').length
          document.getElementById('stat-read').textContent = contacts.filter(c => c.status === 'read').length
          document.getElementById('stat-replied').textContent = contacts.filter(c => c.status === 'replied').length
          
          // Render contacts
          const container = document.getElementById('contacts-container')
          
          if (contacts.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-gray-500">お問い合わせはまだありません</div>'
            return
          }
          
          container.innerHTML = contacts.map(contact => \`
            <div class="p-6 hover:bg-gray-50 transition-colors">
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="font-semibold text-lg">\${contact.name}</h3>
                    <span class="text-sm text-gray-600">\${contact.email}</span>
                    <span class="status-badge status-\${contact.status} text-xs px-2 py-1 rounded">
                      \${getStatusLabel(contact.status)}
                    </span>
                  </div>
                  \${contact.subject ? \`<p class="text-sm text-gray-600 mb-2">件名: \${contact.subject}</p>\` : ''}
                  <p class="text-sm text-gray-700 whitespace-pre-line">\${contact.message}</p>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="text-xs text-gray-500">
                  \${new Date(contact.created_at).toLocaleString('ja-JP')}
                </div>
                <div class="flex gap-2">
                  \${contact.status !== 'read' ? \`
                    <button onclick="updateStatus(\${contact.id}, 'read')" 
                            class="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                      確認済みにする
                    </button>
                  \` : ''}
                  \${contact.status !== 'replied' ? \`
                    <button onclick="updateStatus(\${contact.id}, 'replied')" 
                            class="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
                      返信済みにする
                    </button>
                  \` : ''}
                </div>
              </div>
            </div>
          \`).join('')
          
        } catch (error) {
          console.error('Failed to load contacts:', error)
          if (error.response?.status === 401) {
            logout()
          }
        }
      }
      
      async function updateStatus(id, status) {
        try {
          await axios.patch(\`/api/admin/contacts/\${id}\`, 
            { status },
            { headers: { 'Authorization': \`Bearer \${authToken}\` } }
          )
          loadContacts()
        } catch (error) {
          console.error('Failed to update status:', error)
          alert('ステータスの更新に失敗しました')
        }
      }
      
      function getStatusLabel(status) {
        const labels = {
          'new': '新着',
          'read': '確認済み',
          'replied': '返信済み'
        }
        return labels[status] || status
      }
    </script>
    
    <style>
      .status-new { background-color: #fef3c7; color: #92400e; }
      .status-read { background-color: #dbeafe; color: #1e40af; }
      .status-replied { background-color: #d1fae5; color: #065f46; }
    </style>
</body>
</html>
  `)
})

export default app
