import type { Context } from 'hono'
import { db } from '../db'

// 구글 드라이브 링크 → 임베드 URL 변환
function toGoogleDriveEmbedUrl(url: string): string {
  if (!url) return ''
  // https://drive.google.com/file/d/FILE_ID/view  →  embed
  const m1 = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (m1) return `https://drive.google.com/file/d/${m1[1]}/preview`
  // https://drive.google.com/open?id=FILE_ID
  const m2 = url.match(/[?&]id=([^&]+)/)
  if (m2) return `https://drive.google.com/file/d/${m2[1]}/preview`
  // 이미 /preview 형태면 그대로
  if (url.includes('drive.google.com')) return url.replace('/view', '/preview')
  return url
}

// 공통 헤더
function commonHead(title: string, extra = '') {
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
    .back-btn { transition: all 0.2s; }
    .back-btn:hover { transform: translateX(-3px); }
    .fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    .nl-card { transition: all 0.28s cubic-bezier(0.4,0,0.2,1); }
    .nl-card:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(0,0,0,0.13); }
    .nl-card:hover .cover-overlay { opacity: 1; }
    .cover-overlay { opacity: 0; transition: opacity 0.25s; }
    .prose p { margin-bottom: 1.3em; line-height: 1.9; color: #374151; }
    .prose img { border-radius: 12px; max-width: 100%; margin: 1.5em 0; }
    .prose h2 { font-size: 1.3rem; font-weight: 800; color: #14532d; margin: 1.8em 0 0.6em; }
    .prose h3 { font-size: 1.1rem; font-weight: 700; color: #166534; margin: 1.4em 0 0.5em; }
    .prose ul { list-style: disc; padding-left: 1.5em; margin-bottom: 1em; }
    .prose ul li { margin-bottom: 0.4em; color: #4b5563; }
    .prose blockquote { border-left: 4px solid #22c55e; padding-left: 1em; color: #6b7280; font-style: italic; margin: 1.5em 0; }
    ${extra}
  </style>
</head>`
}

function commonNav(backHref: string, backLabel: string) {
  return `<header class="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
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
  return `<footer class="text-center text-xs text-gray-400 py-10">
    © 2026 순천에코칼리지. 사람과 자연이 함께 살아가는 도시를 향해 나아갑니다.
  </footer>`
}

// ─── 뉴스레터 목록 페이지 ───────────────────────────────────────
export async function newsletterListPage(c: Context) {
  let newsletters: any[] = []
  try {
    newsletters = db.prepare(
      `SELECT id, title, summary, cover_image, pdf_url, created_at FROM newsletters
       WHERE status = 'published' ORDER BY created_at DESC`
    ).all() as any[]
  } catch (e) {}

  const cards = newsletters.length
    ? newsletters.map((n, idx) => {
        const date = new Date(n.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
        const summary = n.summary ? n.summary.slice(0, 60) + (n.summary.length > 60 ? '…' : '') : ''
        const delay = idx * 80
        const href = '/newsletter/' + n.id
        const hasPdf = !!n.pdf_url
        const hasCover = !!n.cover_image

        const coverSection = hasCover
          ? `<img src="${n.cover_image}" alt="${n.title}"
               class="w-full h-full object-cover"
               onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full bg-gradient-to-br from-green-800 to-green-600 flex flex-col items-center justify-center\\'><i class=\\'fas fa-newspaper text-white text-5xl opacity-25 mb-2\\'></i><p class=\\'text-white text-xs font-bold opacity-40\\'>소식지 #${n.id}</p></div>'">`
          : `<div class="w-full h-full bg-gradient-to-br from-green-800 to-green-600 flex flex-col items-center justify-center">
               <i class="fas fa-newspaper text-white text-5xl opacity-25 mb-2"></i>
               <p class="text-white text-xs font-bold opacity-40">소식지 #${n.id}</p>
             </div>`

        return `<a href="${href}"
          class="nl-card block bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden fade-in group"
          style="animation-delay:${delay}ms">

          <!-- 커버 이미지 영역: A4 세로 비율(3:4)로 전체 커버 표시 -->
          <div class="relative overflow-hidden bg-gray-100" style="padding-bottom:133.33%;">
            <div class="absolute inset-0">
              ${coverSection}
            </div>
            <!-- 호버 오버레이 -->
            <div class="cover-overlay absolute inset-0 flex flex-col items-end justify-start p-3">
              ${hasPdf
                ? `<span class="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                     <i class="fas fa-file-pdf"></i> PDF
                   </span>`
                : ''}
            </div>
            <!-- 클릭 힌트 오버레이 (호버 시 중앙) -->
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-250"
                 style="background:rgba(10,40,20,0.55)">
              <div class="text-center text-white">
                <div class="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-white border-opacity-40">
                  ${hasPdf
                    ? `<i class="fas fa-file-pdf text-xl text-red-300"></i>`
                    : `<i class="fas fa-arrow-right text-lg"></i>`}
                </div>
                <p class="text-xs font-bold tracking-wider">${hasPdf ? 'PDF 보기' : '자세히 보기'}</p>
              </div>
            </div>
          </div>

          <!-- 텍스트 정보 -->
          <div class="px-3 py-3">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-xs text-gray-400 truncate"><i class="fas fa-calendar-alt mr-1 text-green-500"></i>${date}</span>
            </div>
            <h2 class="text-sm font-black text-gray-900 leading-snug line-clamp-2 mb-0.5">${n.title}</h2>
            ${summary ? `<p class="text-xs text-gray-400 leading-relaxed line-clamp-2">${summary}</p>` : ''}
          </div>
        </a>`
      }).join('')
    : `<div class="col-span-full text-center py-20 text-gray-400 fade-in">
        <i class="fas fa-newspaper text-5xl text-green-200 mb-4 block"></i>
        <p class="text-base font-semibold">아직 등록된 소식지가 없습니다.</p>
        <p class="text-sm mt-1">에코칼리지 소식을 곧 전해드릴게요!</p>
      </div>`

  const html = `${commonHead('소식지', `
    .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .group:hover .cover-overlay { opacity: 1; }
  `)}
<body class="bg-gray-50 min-h-screen">
${commonNav('/', '메인으로')}
<main class="max-w-5xl mx-auto px-4 pb-20">
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

  <!-- 그리드: 모바일 2열, 태블릿+ 3열, 대형 4열 -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
    ${cards}
  </div>
</main>
${commonFooter()}
</body></html>`

  return c.html(html)
}

// ─── 뉴스레터 상세 / PDF 뷰어 페이지 ───────────────────────────
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
  const embedUrl = nl.pdf_url ? toGoogleDriveEmbedUrl(nl.pdf_url) : ''

  // 마크다운 → HTML 변환
  function renderContent(text: string): string {
    if (!text) return '<p class="text-gray-400">내용이 없습니다.</p>'
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
        if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(trimmed)) {
          return `<img src="${trimmed}" alt="">`
        }
        return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`
      })
      .filter(Boolean)
      .join('\n')
  }

  // ── PDF 있는 경우: 뷰어 중심 레이아웃 ──
  if (embedUrl) {
    const html = `${commonHead(nl.title, `
      #pdf-frame { border: none; width: 100%; }
      .pdf-wrapper { background: #404040; border-radius: 16px; overflow: hidden; }
      @media (max-width: 640px) { #pdf-frame { height: 70vh; } }
      @media (min-width: 641px) { #pdf-frame { height: 85vh; } }
    `)}
<body class="bg-gray-50 min-h-screen">
${commonNav('/newsletter', '소식지 목록')}
<main class="max-w-5xl mx-auto px-4 pb-16">

  <!-- 제목 영역 -->
  <div class="mt-6 mb-5 fade-in">
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <span class="text-xs px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-700">
        <i class="fas fa-newspaper mr-1"></i>NEWSLETTER
      </span>
      <span class="text-xs text-gray-400"><i class="fas fa-calendar-alt mr-1"></i>${date}</span>
      <span class="text-xs bg-red-50 text-red-500 font-semibold px-2 py-0.5 rounded-full">
        <i class="fas fa-file-pdf mr-1"></i>PDF
      </span>
    </div>
    <h1 class="text-xl sm:text-2xl font-black text-gray-900 leading-tight">${nl.title}</h1>
    ${nl.summary ? `<p class="text-gray-500 text-sm mt-1 leading-relaxed">${nl.summary}</p>` : ''}
  </div>

  <!-- PDF 뷰어 -->
  <div class="pdf-wrapper shadow-xl fade-in" style="animation-delay:0.1s">
    <!-- 로딩 상태 -->
    <div id="pdf-loading" class="flex flex-col items-center justify-center py-16 text-gray-400">
      <i class="fas fa-spinner fa-spin text-3xl text-green-400 mb-3"></i>
      <p class="text-sm font-semibold">PDF를 불러오는 중...</p>
      <p class="text-xs mt-1 opacity-70">구글 드라이브에서 로드 중입니다</p>
    </div>
    <iframe id="pdf-frame"
      src="${embedUrl}"
      allow="autoplay"
      onload="document.getElementById('pdf-loading').style.display='none';this.style.display='block'"
      style="display:none">
    </iframe>
  </div>

  <!-- 액션 버튼 -->
  <div class="mt-5 flex flex-wrap gap-3 fade-in" style="animation-delay:0.2s">
    <a href="${nl.pdf_url}" target="_blank" rel="noopener noreferrer"
       class="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm shadow-sm">
      <i class="fas fa-external-link-alt"></i>
      <span>새 탭에서 열기</span>
    </a>
    <a href="/newsletter"
       class="flex items-center gap-2 border-2 border-gray-200 hover:border-green-400 text-gray-600 hover:text-green-700 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm">
      <i class="fas fa-list-ul text-xs"></i>
      <span>목록으로</span>
    </a>
    <a href="/"
       class="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm">
      <i class="fas fa-home text-xs"></i>
      <span>메인으로</span>
    </a>
  </div>

  ${(nl.content && nl.content.trim()) ? `
  <!-- 추가 내용 (있을 경우) -->
  <div class="mt-10 fade-in" style="animation-delay:0.3s">
    <h2 class="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
      <i class="fas fa-align-left text-green-500"></i> 소식 내용
    </h2>
    <article class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <div class="prose max-w-none">${renderContent(nl.content)}</div>
    </article>
  </div>` : ''}

</main>
${commonFooter()}
</body></html>`
    return c.html(html)
  }

  // ── PDF 없는 경우: 기존 텍스트 상세 레이아웃 ──
  const html = `${commonHead(nl.title)}
<body class="bg-gray-50 min-h-screen">
${commonNav('/newsletter', '소식지 목록')}
<main class="max-w-3xl mx-auto px-4 pb-20">

  ${nl.cover_image ? `
  <div class="rounded-2xl overflow-hidden mt-6 shadow-md fade-in bg-gray-50"
       style="max-height:480px; display:flex; align-items:center; justify-content:center;">
    <img src="${nl.cover_image}" alt="${nl.title}"
         class="w-full object-contain" style="max-height:480px">
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
    <div class="prose max-w-none">${renderContent(nl.content)}</div>
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
