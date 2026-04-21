import type { Context } from 'hono'
import { db } from '../db'

// 각 안내 페이지 설정 정의
export const INFO_PAGES: Record<string, {
  title: string
  subtitle: string
  contentKey: string
  imgKey: string
  backLabel: string
  category: 'about' | 'program' | 'apply'
  categoryLabel: string
  icon: string
}> = {
  'about-eco': {
    title: '에코칼리지란?',
    subtitle: '순천에코칼리지를 소개합니다',
    contentKey: 'about_eco',
    imgKey: 'about_eco_img',
    backLabel: 'ABOUT',
    category: 'about',
    categoryLabel: '단체 소개',
    icon: 'fa-leaf',
  },
  'about-philosophy': {
    title: '교육 철학',
    subtitle: '우리가 추구하는 교육의 방향',
    contentKey: 'about_philosophy',
    imgKey: 'about_philosophy_img',
    backLabel: 'ABOUT',
    category: 'about',
    categoryLabel: '단체 소개',
    icon: 'fa-book-open',
  },
  'about-org': {
    title: '운영 주체',
    subtitle: '함께 만들어가는 사람들',
    contentKey: 'about_org',
    imgKey: 'about_org_img',
    backLabel: 'ABOUT',
    category: 'about',
    categoryLabel: '단체 소개',
    icon: 'fa-users',
  },
  'prog-2025': {
    title: '2025 시범과정',
    subtitle: '2025년 시범 운영 프로그램',
    contentKey: 'prog_2025',
    imgKey: 'prog_2025_img',
    backLabel: 'PROGRAM',
    category: 'program',
    categoryLabel: '운영 프로그램',
    icon: 'fa-seedling',
  },
  'prog-2026': {
    title: '2026 생태문명 전환 촉진자 양성 과정',
    subtitle: '생태문명 전환을 이끌 촉진자를 양성합니다',
    contentKey: 'prog_2026',
    imgKey: 'prog_2026_img',
    backLabel: 'PROGRAM',
    category: 'program',
    categoryLabel: '운영 프로그램',
    icon: 'fa-graduation-cap',
  },
  'prog-forum': {
    title: '생태공론장',
    subtitle: '시민이 함께 만드는 생태 의제',
    contentKey: 'prog_forum',
    imgKey: 'prog_forum_img',
    backLabel: 'PROGRAM',
    category: 'program',
    categoryLabel: '운영 프로그램',
    icon: 'fa-comments',
  },
  'apply-guide': {
    title: '참여 안내',
    subtitle: '순천에코칼리지와 함께하세요',
    contentKey: 'apply_guide',
    imgKey: 'apply_guide_img',
    backLabel: 'APPLY',
    category: 'apply',
    categoryLabel: '참여 신청',
    icon: 'fa-info-circle',
  },
  'apply-agenda': {
    title: '의제 등록',
    subtitle: '시민의 목소리를 들려주세요',
    contentKey: 'apply_agenda',
    imgKey: 'apply_agenda_img',
    backLabel: 'APPLY',
    category: 'apply',
    categoryLabel: '참여 신청',
    icon: 'fa-pencil-alt',
  },
  'apply-contact': {
    title: '문의하기',
    subtitle: '궁금한 점을 문의해 주세요',
    contentKey: 'apply_contact',
    imgKey: 'apply_contact_img',
    backLabel: 'APPLY',
    category: 'apply',
    categoryLabel: '참여 신청',
    icon: 'fa-envelope',
  },
}

// 텍스트 내 URL을 <a> 태그로 변환 (새창 열기)
function linkify(line: string): string {
  // http:// 또는 https:// 로 시작하는 URL 감지
  return line.replace(
    /(https?:\/\/[^\s<>"'）)]+)/g,
    (url) => {
      // 마지막 문장부호 제거 (., ), ] 등)
      const trailingPunct = url.match(/[.,;!?)\]]+$/)
      const cleanUrl = trailingPunct ? url.slice(0, -trailingPunct[0].length) : url
      const suffix = trailingPunct ? trailingPunct[0] : ''
      // 표시 텍스트: 너무 길면 도메인만 표시
      const display = cleanUrl.length > 50
        ? cleanUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
        : cleanUrl.replace(/^https?:\/\//, '')
      return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer"
        class="text-green-600 underline underline-offset-2 hover:text-green-800 break-all transition-colors"
        >${display}</a>${suffix}`
    }
  )
}

// 텍스트 → HTML 단락 변환 (URL 자동 링크 포함)
function toHtmlParagraphs(text: string): string {
  if (!text) return ''
  return text.split('\n').filter(l => l.trim()).map(l => `<p>${linkify(l.trim())}</p>`).join('')
}

export async function infoPage(c: Context, slug: string) {
  const meta = INFO_PAGES[slug]
  if (!meta) return c.notFound()

  // DB에서 설정 로드
  let settings: Record<string, string> = {}
  try {
    const rows = db.prepare(`SELECT key, value FROM site_settings`).all() as { key: string; value: string }[]
    for (const row of rows) settings[row.key] = row.value
  } catch (e) {}

  const content = settings[meta.contentKey] || ''
  const imgUrl = settings[meta.imgKey] || ''
  const footerPhone = settings['footer_phone'] || ''
  const footerEmail = settings['footer_email'] || ''
  const footerBlog = settings['footer_blog'] || '#'

  // 카테고리별 색상
  const colors: Record<string, { accent: string; bg: string; badge: string }> = {
    about:   { accent: 'text-green-600',  bg: 'bg-green-50',  badge: 'bg-green-100 text-green-700' },
    program: { accent: 'text-blue-600',   bg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-700' },
    apply:   { accent: 'text-purple-600', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700' },
  }
  const c2 = colors[meta.category]

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title} | 순천에코칼리지</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Noto Sans KR', sans-serif; }
    .prose p { margin-bottom: 1.2em; line-height: 1.9; color: #374151; font-size: 1rem; }
    .prose p:first-child::first-letter {
      font-size: 1.5em; font-weight: 900; float: left;
      margin-right: 4px; line-height: 1; color: #15803d;
    }
    .hero-img { max-height: 420px; object-fit: cover; width: 100%; }
    .back-btn { transition: all 0.2s; }
    .back-btn:hover { transform: translateX(-3px); }
    .fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">

  <!-- 상단 네비게이션 -->
  <header class="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
    <div class="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
      <a href="/" class="back-btn flex items-center gap-2 text-gray-500 hover:text-green-700 text-sm font-medium">
        <i class="fas fa-arrow-left text-xs"></i>
        <span>메인으로</span>
      </a>
      <div class="flex items-center gap-2">
        <span class="text-xs px-2.5 py-1 rounded-full font-semibold ${c2.badge}">${meta.backLabel}</span>
      </div>
      <a href="/" class="flex items-center gap-1.5 text-green-700 font-black text-sm">
        <i class="fas fa-leaf text-green-500"></i>
        <span class="hidden sm:block">순천에코칼리지</span>
      </a>
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-4 pb-20">

    <!-- 히어로 이미지 -->
    ${imgUrl ? `
    <div class="rounded-2xl overflow-hidden mt-6 shadow-md fade-in">
      <img src="${imgUrl}" alt="${meta.title}" class="hero-img">
    </div>` : ''}

    <!-- 타이틀 영역 -->
    <div class="mt-8 mb-8 fade-in">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-xs px-2.5 py-1 rounded-full font-semibold ${c2.badge}">
          <i class="fas ${meta.icon} mr-1"></i>${meta.categoryLabel}
        </span>
      </div>
      <h1 class="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-2">${meta.title}</h1>
      <p class="text-gray-500 text-sm">${meta.subtitle}</p>
      <div class="mt-4 h-1 w-16 rounded-full bg-green-500"></div>
    </div>

    <!-- 본문 콘텐츠 -->
    <article class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10 fade-in">
      <div class="prose max-w-none">
        ${toHtmlParagraphs(content) || '<p class="text-gray-400">콘텐츠를 준비 중입니다.</p>'}
      </div>

      ${slug === 'apply-agenda' ? `
      <div class="mt-8 pt-6 border-t border-gray-100">
        <a href="/" class="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all text-base">
          <i class="fas fa-leaf"></i> 의제 등록하러 가기
        </a>
      </div>` : ''}

      ${slug === 'apply-contact' ? `
      <div class="mt-8 pt-6 border-t border-gray-100 space-y-3">
        ${footerPhone ? `<a href="tel:${footerPhone}" class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors group">
          <div class="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
            <i class="fas fa-phone text-green-600 text-sm"></i>
          </div>
          <div>
            <p class="text-xs text-gray-400 mb-0.5">전화</p>
            <p class="font-semibold text-gray-800">${footerPhone}</p>
          </div>
        </a>` : ''}
        ${footerEmail ? `<a href="mailto:${footerEmail}" class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors group">
          <div class="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
            <i class="fas fa-envelope text-green-600 text-sm"></i>
          </div>
          <div>
            <p class="text-xs text-gray-400 mb-0.5">이메일</p>
            <p class="font-semibold text-gray-800">${footerEmail}</p>
          </div>
        </a>` : ''}
        ${footerBlog !== '#' ? `<a href="${footerBlog}" target="_blank" class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors group">
          <div class="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
            <i class="fas fa-blog text-green-600 text-sm"></i>
          </div>
          <div>
            <p class="text-xs text-gray-400 mb-0.5">블로그</p>
            <p class="font-semibold text-gray-800">공식 블로그 방문하기</p>
          </div>
        </a>` : ''}
      </div>` : ''}
    </article>

    <!-- 하단 네비게이션 -->
    <div class="mt-8 flex gap-3">
      <a href="/" class="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-green-400 text-gray-600 hover:text-green-700 font-semibold py-3 rounded-xl transition-all text-sm">
        <i class="fas fa-home text-xs"></i> 메인으로
      </a>
      <a href="javascript:history.back()" class="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all text-sm">
        <i class="fas fa-arrow-left text-xs"></i> 이전 페이지
      </a>
    </div>

  </main>

  <!-- 미니 푸터 -->
  <footer class="text-center text-xs text-gray-400 py-8">
    © 2026 순천에코칼리지. 사람과 자연이 함께 살아가는 도시를 향해 나아갑니다.
  </footer>

</body>
</html>`

  return c.html(html)
}
