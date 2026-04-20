import type { Context } from 'hono'
import { db } from '../db'

// 공통 헤더/CSS 헬퍼
function commonHead(title: string) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | 순천에코칼리지</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Noto Sans KR', sans-serif; }
    .back-btn:hover { transform: translateX(-3px); }
    .back-btn { transition: all 0.2s; }
    .fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    .card-hover { transition: all 0.25s; }
    .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.10); }
    .prose p { margin-bottom: 1.3em; line-height: 1.9; color: #374151; font-size: 1rem; }
    .prose img { border-radius: 12px; max-width: 100%; margin: 1.5em 0; }
    .prose h2 { font-size: 1.3rem; font-weight: 800; color: #14532d; margin: 1.8em 0 0.6em; }
    .prose h3 { font-size: 1.1rem; font-weight: 700; color: #166534; margin: 1.4em 0 0.5em; }
    .prose ul { list-style: disc; padding-left: 1.5em; margin-bottom: 1em; }
    .prose ul li { margin-bottom: 0.4em; color: #4b5563; }
    .prose blockquote { border-left: 4px solid #22c55e; padding-left: 1em; color: #6b7280; font-style: italic; margin: 1.5em 0; }
  </style>
</head>`
}

function commonNav(backHref: string, backLabel: string) {
  return `<header class="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
    <div class="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
      <a href="${backHref}" class="back-btn flex items-center gap-2 text-gray-500 hover:text-green-700 text-sm font-medium">
        <i class="fas fa-arrow-left text-xs"></i>
        <span>${backLabel}</span>
      </a>
      <span class="text-xs px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-700">NEWSLETTER</span>
      <a href="/" class="flex items-center gap-1.5 text-green-700 font-black text-sm">
        <i class="fas fa-leaf text-green-500"></i>
        <span class="hidden sm:block">순천에코칼리지</span>
      </a>
    </div>
  </header>`
}

function commonFooter() {
  return `<footer class="text-center text-xs text-gray-400 py-8">
    © 2026 순천에코칼리지. 사람과 자연이 함께 살아가는 도시를 향해 나아갑니다.
  </footer>`
}

// ─── 뉴스레터 목록 페이지 ───────────────────────────────────────
export async function newsletterListPage(c: Context) {
  let newsletters: any[] = []
  try {
    newsletters = db.prepare(
      `SELECT id, title, summary, cover_image, created_at FROM newsletters
       WHERE status = 'published' ORDER BY created_at DESC`
    ).all() as any[]
  } catch (e) {}

  const cards = newsletters.length
    ? newsletters.map(n => {
        const date = new Date(n.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
        const summary = n.summary ? n.summary.slice(0, 80) + (n.summary.length > 80 ? '…' : '') : ''
        return `<a href="/newsletter/${n.id}" class="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden card-hover fade-in">
          ${n.cover_image
            ? `<div class="h-44 overflow-hidden"><img src="${n.cover_image}" alt="${n.title}" class="w-full h-full object-cover"></div>`
            : `<div class="h-44 bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center">
                <i class="fas fa-newspaper text-white text-5xl opacity-30"></i>
               </div>`
          }
          <div class="p-5">
            <p class="text-xs text-green-600 font-semibold mb-1"><i class="fas fa-calendar-alt mr-1"></i>${date}</p>
            <h2 class="text-base font-black text-gray-900 leading-tight mb-2">${n.title}</h2>
            ${summary ? `<p class="text-sm text-gray-500 leading-relaxed">${summary}</p>` : ''}
            <div class="mt-3 flex items-center gap-1 text-green-600 text-xs font-semibold">
              <span>자세히 보기</span><i class="fas fa-arrow-right text-xs"></i>
            </div>
          </div>
        </a>`
      }).join('')
    : `<div class="col-span-2 text-center py-20 text-gray-400 fade-in">
        <i class="fas fa-newspaper text-5xl text-green-200 mb-4 block"></i>
        <p class="text-base font-semibold">아직 등록된 소식지가 없습니다.</p>
        <p class="text-sm mt-1">에코칼리지 소식을 곧 전해드릴게요!</p>
      </div>`

  const html = `${commonHead('소식지')}
<body class="bg-gray-50 min-h-screen">
${commonNav('/', '메인으로')}
<main class="max-w-3xl mx-auto px-4 pb-20">
  <div class="mt-8 mb-8 fade-in">
    <div class="flex items-center gap-2 mb-3">
      <span class="text-xs px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-700">
        <i class="fas fa-newspaper mr-1"></i>NEWSLETTER
      </span>
    </div>
    <h1 class="text-2xl sm:text-3xl font-black text-gray-900 mb-2">소식지</h1>
    <p class="text-gray-500 text-sm">순천에코칼리지의 활동과 소식을 전합니다.</p>
    <div class="mt-4 h-1 w-16 rounded-full bg-green-500"></div>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
    ${cards}
  </div>
</main>
${commonFooter()}
</body></html>`

  return c.html(html)
}

// ─── 뉴스레터 상세 페이지 ───────────────────────────────────────
export async function newsletterDetailPage(c: Context) {
  const id = c.req.param('id')
  let nl: any = null
  try {
    nl = db.prepare(`SELECT * FROM newsletters WHERE id = ? AND status = 'published'`).get(id)
  } catch (e) {}

  if (!nl) {
    return c.html(`${commonHead('소식지를 찾을 수 없습니다')}
<body class="bg-gray-50 min-h-screen">
${commonNav('/newsletter', '소식지 목록')}
<main class="max-w-3xl mx-auto px-4 py-20 text-center text-gray-400">
  <i class="fas fa-exclamation-circle text-5xl text-gray-200 mb-4 block"></i>
  <p class="text-lg font-semibold">소식지를 찾을 수 없습니다.</p>
  <a href="/newsletter" class="mt-6 inline-block bg-green-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors">
    목록으로 돌아가기
  </a>
</main>
${commonFooter()}
</body></html>`, 404)
  }

  const date = new Date(nl.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  // content를 단락/이미지/마크다운 기본 변환
  function renderContent(text: string): string {
    if (!text) return '<p class="text-gray-400">내용이 없습니다.</p>'
    // 줄바꿈 → 단락 (빈 줄 기준 단락 구분)
    return text
      .split(/\n{2,}/)
      .map(block => {
        const trimmed = block.trim()
        if (!trimmed) return ''
        if (trimmed.startsWith('## ')) return `<h2>${trimmed.slice(3)}</h2>`
        if (trimmed.startsWith('### ')) return `<h3>${trimmed.slice(4)}</h3>`
        if (trimmed.startsWith('> ')) return `<blockquote>${trimmed.slice(2)}</blockquote>`
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split('\n').map(l => `<li>${l.replace(/^[-*]\s/, '')}</li>`).join('')
          return `<ul>${items}</ul>`
        }
        // 이미지 URL 감지 (단독 줄)
        if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(trimmed)) {
          return `<img src="${trimmed}" alt="">`
        }
        return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`
      })
      .filter(Boolean)
      .join('\n')
  }

  const html = `${commonHead(nl.title)}
<body class="bg-gray-50 min-h-screen">
${commonNav('/newsletter', '소식지 목록')}
<main class="max-w-3xl mx-auto px-4 pb-20">

  ${nl.cover_image ? `
  <div class="rounded-2xl overflow-hidden mt-6 shadow-md fade-in" style="max-height:420px">
    <img src="${nl.cover_image}" alt="${nl.title}" class="w-full object-cover" style="max-height:420px">
  </div>` : ''}

  <div class="mt-8 mb-6 fade-in">
    <div class="flex items-center gap-2 mb-3">
      <span class="text-xs px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-700">
        <i class="fas fa-newspaper mr-1"></i>NEWSLETTER
      </span>
      <span class="text-xs text-gray-400">${date}</span>
    </div>
    <h1 class="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-2">${nl.title}</h1>
    ${nl.summary ? `<p class="text-gray-500 text-sm leading-relaxed">${nl.summary}</p>` : ''}
    <div class="mt-4 h-1 w-16 rounded-full bg-green-500"></div>
  </div>

  <article class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10 fade-in">
    <div class="prose max-w-none">
      ${renderContent(nl.content)}
    </div>
  </article>

  <div class="mt-8 flex gap-3">
    <a href="/newsletter" class="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-green-400 text-gray-600 hover:text-green-700 font-semibold py-3 rounded-xl transition-all text-sm">
      <i class="fas fa-list-ul text-xs"></i> 목록으로
    </a>
    <a href="/" class="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all text-sm">
      <i class="fas fa-home text-xs"></i> 메인으로
    </a>
  </div>

</main>
${commonFooter()}
</body></html>`

  return c.html(html)
}
