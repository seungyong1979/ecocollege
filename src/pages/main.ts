import type { Context } from 'hono'
import { db } from '../db'

export async function mainPage(c: Context) {
  let settings: Record<string, string> = {}
  try {
    const rows = db.prepare(`SELECT key, value FROM site_settings`).all() as { key: string; value: string }[]
    for (const row of rows) settings[row.key] = row.value
  } catch (e) {}

  const s = {
    main_title: settings['main_title'] || '공론화하고 싶은 무엇이든 알려주세요',
    main_subtitle: settings['main_subtitle'] || '순천에코칼리지에서 생태문명 도시 순천의 의제를 모읍니다.',
    usage_guide: settings['usage_guide'] || '이 곳에 기록된 희망 의제들은 순천시 생태적 공론장에 반영되어 공개적으로 논의될 예정입니다.',
    forum_description: settings['forum_description'] || '기존의 인간중심의 정치·경제 중심 공론장에서 벗어나, 생태계를 이루는 모든 비인간 존재와의 공존과 관계를 중심으로 논의를 확장해가는 공론장입니다.',
    footer_blog: settings['footer_blog'] || '#',
    footer_facebook: settings['footer_facebook'] || '#',
    footer_instagram: settings['footer_instagram'] || '#',
    footer_phone: settings['footer_phone'] || '',
    footer_email: settings['footer_email'] || '',
    hero_image: settings['hero_image'] || ''
  }

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>순천 생태 의제 창구 | 순천에코칼리지</title>
  <meta name="description" content="${s.main_subtitle}">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            eco: { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d' }
          },
          fontFamily: { sans: ['"Noto Sans KR"', 'sans-serif'] }
        }
      }
    }
  </script>
  <style>
    * { font-family: 'Noto Sans KR', sans-serif; }
    .word-cloud-item { display:inline-block; transition:transform 0.2s; cursor:default; }
    .word-cloud-item:hover { transform:scale(1.15); }
    @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    .fade-in-up { animation:fadeInUp 0.6s ease-out forwards; }
    @keyframes pulse-green { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)} 50%{box-shadow:0 0 0 10px rgba(34,197,94,0)} }
    .pulse-green { animation:pulse-green 2s infinite; }
    .hero-overlay { background:linear-gradient(135deg,rgba(21,128,61,0.88) 0%,rgba(5,46,22,0.75) 100%); }
    .glass-card { background:rgba(255,255,255,0.92); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.6); }
    textarea:focus,input:focus,select:focus { outline:none; border-color:#16a34a !important; box-shadow:0 0 0 3px rgba(22,163,74,0.15); }
    .btn-primary { background:linear-gradient(135deg,#16a34a,#15803d); transition:all 0.2s; }
    .btn-primary:hover { background:linear-gradient(135deg,#15803d,#14532d); transform:translateY(-1px); box-shadow:0 4px 15px rgba(22,163,74,0.4); }
    .section-divider { height:3px; background:linear-gradient(90deg,transparent,#16a34a,transparent); }
    .modal-backdrop { background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); }
    #carousel-track { display:flex; gap:16px; transition:transform 0.7s ease-in-out; }
    .agenda-card { min-width:280px; max-width:320px; flex-shrink:0; }
    @media(max-width:640px){ .agenda-card{min-width:calc(100vw - 64px);max-width:calc(100vw - 64px);} }
  </style>
</head>
<body class="bg-gray-50 text-gray-800">

<!-- HERO -->
<section class="relative min-h-screen flex items-center justify-center overflow-hidden"
  ${s.hero_image ? `style="background-image:url('${s.hero_image}');background-size:cover;background-position:center;"` : 'style="background:linear-gradient(135deg,#14532d 0%,#166534 40%,#15803d 100%);"'}>
  <div class="hero-overlay absolute inset-0"></div>
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-10 left-10 w-64 h-64 bg-green-400 opacity-10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-20 right-10 w-96 h-96 bg-green-300 opacity-10 rounded-full blur-3xl"></div>
  </div>
  <div class="relative z-10 text-center px-4 max-w-4xl mx-auto w-full">
    <div class="inline-flex items-center gap-2 bg-white bg-opacity-20 rounded-full px-4 py-2 mb-6 text-white text-sm font-medium">
      <i class="fas fa-leaf text-green-300"></i><span>순천에코칼리지</span>
    </div>
    <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight fade-in-up">${s.main_title}</h1>
    <p class="text-lg sm:text-xl text-green-100 mb-10 max-w-2xl mx-auto leading-relaxed fade-in-up" style="animation-delay:0.2s">${s.main_subtitle}</p>

    <div class="glass-card rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto shadow-2xl fade-in-up" style="animation-delay:0.4s">
      <h2 class="text-xl font-bold text-green-800 mb-3 flex items-center gap-2">
        <i class="fas fa-seedling text-green-600"></i>생태적 의제를 입력해 주세요
      </h2>
      <p class="text-sm text-gray-500 mb-4">순천에서 다뤘으면 하는 생태·환경 의제를 자유롭게 작성해 주세요.</p>
      <textarea id="main-agenda-input" class="w-full border-2 border-gray-200 rounded-xl p-4 text-gray-800 text-base resize-none transition-all"
        rows="4" maxlength="500"
        placeholder="예) 동천변 생태 복원이 필요합니다. 자전거 도로 확충이 필요해요..."></textarea>
      <div class="flex justify-between items-center mt-2 mb-4">
        <span class="text-xs text-gray-400">최대 500자</span>
        <span class="text-xs text-gray-400" id="char-count">0 / 500</span>
      </div>
      <button onclick="openSubmitModal()" class="btn-primary w-full text-white font-bold py-4 rounded-xl text-lg pulse-green">
        <i class="fas fa-paper-plane mr-2"></i>의제 등록하기
      </button>
    </div>
    <div class="mt-12 text-white text-sm opacity-70 animate-bounce"><i class="fas fa-chevron-down"></i></div>
  </div>
</section>

<!-- 다른 시민들의 의제 -->
<section class="py-16 bg-white">
  <div class="max-w-6xl mx-auto px-4">
    <div class="text-center mb-10">
      <span class="text-green-600 text-sm font-semibold uppercase tracking-wider">COMMUNITY</span>
      <h2 class="text-3xl font-black text-gray-800 mt-2">다른 시민들의 의제</h2>
      <p class="text-gray-500 mt-2">순천 시민들이 직접 제안한 의제들을 확인해 보세요</p>
      <div class="section-divider w-24 mx-auto mt-4"></div>
    </div>
    <div class="overflow-hidden" id="carousel-container">
      <div id="carousel-track">
        <div class="text-center text-gray-400 py-12 w-full">
          <i class="fas fa-spinner fa-spin text-3xl text-green-400"></i>
          <p class="mt-3">의제를 불러오는 중...</p>
        </div>
      </div>
    </div>
    <div class="text-center mt-6">
      <span class="text-sm text-gray-400">총 <span id="total-count" class="font-bold text-green-600">0</span>개의 의제가 등록되었습니다</span>
    </div>
  </div>
</section>

<!-- 단어 구름 -->
<section class="py-16 bg-green-50">
  <div class="max-w-4xl mx-auto px-4">
    <div class="text-center mb-10">
      <span class="text-green-600 text-sm font-semibold uppercase tracking-wider">WORD CLOUD</span>
      <h2 class="text-3xl font-black text-gray-800 mt-2">많이 언급된 키워드</h2>
      <p class="text-gray-500 mt-2">시민들의 의제에서 가장 많이 등장한 단어들입니다</p>
      <div class="section-divider w-24 mx-auto mt-4"></div>
    </div>
    <div id="word-cloud-container" class="bg-white rounded-2xl shadow-lg p-8 min-h-48 flex flex-wrap justify-center items-center gap-3">
      <div class="text-gray-400 text-sm"><i class="fas fa-spinner fa-spin mr-2 text-green-400"></i>키워드를 분석 중...</div>
    </div>
  </div>
</section>

<!-- 의제 활용 안내 -->
<section class="py-16 bg-white">
  <div class="max-w-4xl mx-auto px-4">
    <div class="text-center mb-10">
      <span class="text-green-600 text-sm font-semibold uppercase tracking-wider">HOW IT WORKS</span>
      <h2 class="text-3xl font-black text-gray-800 mt-2">의제를 작성하면 어떻게 되나요?</h2>
      <div class="section-divider w-24 mx-auto mt-4"></div>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="text-center p-6 rounded-2xl bg-green-50 border border-green-100">
        <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-pencil-alt text-green-600 text-xl"></i>
        </div>
        <h3 class="font-bold text-lg mb-2 text-green-800">1. 의제 작성</h3>
        <p class="text-gray-600 text-sm">순천에서 다뤘으면 하는 생태·환경 의제를 자유롭게 작성합니다.</p>
      </div>
      <div class="text-center p-6 rounded-2xl bg-green-50 border border-green-100">
        <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-filter text-green-600 text-xl"></i>
        </div>
        <h3 class="font-bold text-lg mb-2 text-green-800">2. 검토 및 선별</h3>
        <p class="text-gray-600 text-sm">순천에코칼리지 운영진이 의제를 검토하고 공론장 주제를 선별합니다.</p>
      </div>
      <div class="text-center p-6 rounded-2xl bg-green-50 border border-green-100">
        <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-comments text-green-600 text-xl"></i>
        </div>
        <h3 class="font-bold text-lg mb-2 text-green-800">3. 공론장 반영</h3>
        <p class="text-gray-600 text-sm">${s.usage_guide}</p>
      </div>
    </div>
  </div>
</section>

<!-- 생태적 공론장이란? -->
<section class="py-16 bg-gradient-to-br from-green-800 to-green-900 text-white">
  <div class="max-w-4xl mx-auto px-4">
    <div class="text-center mb-10">
      <span class="text-green-300 text-sm font-semibold uppercase tracking-wider">ECOLOGICAL PUBLIC FORUM</span>
      <h2 class="text-3xl font-black mt-2">생태적 공론장이란?</h2>
      <div class="h-0.5 w-24 bg-green-400 mx-auto mt-4"></div>
    </div>
    <div class="grid md:grid-cols-2 gap-8 items-center">
      <div class="space-y-6">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <i class="fas fa-globe text-green-200"></i>
          </div>
          <div>
            <h3 class="font-bold text-green-200 mb-1">인간 중심을 넘어</h3>
            <p class="text-green-100 text-sm leading-relaxed">${s.forum_description}</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <i class="fas fa-users text-green-200"></i>
          </div>
          <div>
            <h3 class="font-bold text-green-200 mb-1">시민이 직접 참여</h3>
            <p class="text-green-100 text-sm leading-relaxed">각 현안의 이해당사자 뿐만 아니라, 비인간 존재, 그리고 시민들이 직접 참여하여 정책을 제안하고 공론화하는 장입니다.</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <i class="fas fa-seedling text-green-200"></i>
          </div>
          <div>
            <h3 class="font-bold text-green-200 mb-1">생태문명 실현</h3>
            <p class="text-green-100 text-sm leading-relaxed">생태문명 도시를 지향하는 순천시에서 지속가능한 미래를 함께 만들어갑니다.</p>
          </div>
        </div>
      </div>
      <div class="text-center">
        <div class="bg-white bg-opacity-10 rounded-2xl p-8 border border-green-600">
          <i class="fas fa-leaf text-green-300 text-6xl mb-4 opacity-80"></i>
          <p class="text-green-200 text-lg font-medium mb-4">순천에코칼리지는<br>생태적 공론장을<br>실험적으로 운영합니다</p>
          <button onclick="document.getElementById('main-agenda-input').scrollIntoView({behavior:'smooth'}); setTimeout(()=>document.getElementById('main-agenda-input').focus(),600)"
            class="bg-green-500 hover:bg-green-400 text-white font-bold py-3 px-6 rounded-xl transition-all">
            <i class="fas fa-plus mr-2"></i>지금 의제 남기기
          </button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer class="bg-gray-900 text-gray-400 py-12">
  <div class="max-w-4xl mx-auto px-4 text-center">
    <div class="flex items-center justify-center gap-2 mb-4">
      <i class="fas fa-leaf text-green-500 text-xl"></i>
      <span class="text-white font-bold text-lg">순천에코칼리지</span>
    </div>
    <div class="flex justify-center gap-6 mb-6">
      <a href="${s.footer_blog}" target="_blank" class="hover:text-green-400 transition-colors" title="블로그">
        <i class="fas fa-blog text-2xl"></i>
      </a>
      <a href="${s.footer_facebook}" target="_blank" class="hover:text-green-400 transition-colors" title="페이스북">
        <i class="fab fa-facebook text-2xl"></i>
      </a>
      <a href="${s.footer_instagram}" target="_blank" class="hover:text-green-400 transition-colors" title="인스타그램">
        <i class="fab fa-instagram text-2xl"></i>
      </a>
    </div>
    <div class="text-sm space-y-1">
      ${s.footer_phone ? `<p><i class="fas fa-phone mr-2 text-green-500"></i>${s.footer_phone}</p>` : ''}
      ${s.footer_email ? `<p><i class="fas fa-envelope mr-2 text-green-500"></i><a href="mailto:${s.footer_email}" class="hover:text-green-400">${s.footer_email}</a></p>` : ''}
    </div>
    <div class="mt-6 pt-6 border-t border-gray-800 text-xs text-gray-600">
      © 2024 순천에코칼리지. 생태문명 도시 순천을 함께 만들어갑니다.
    </div>
  </div>
</footer>

<!-- 개인정보 입력 모달 -->
<div id="submit-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4">
  <div class="modal-backdrop absolute inset-0" onclick="closeModal('submit-modal')"></div>
  <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto z-10">
    <div class="bg-gradient-to-r from-green-700 to-green-600 p-6 rounded-t-2xl text-white">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-xl font-bold"><i class="fas fa-user-check mr-2"></i>등록자 정보 입력</h3>
          <p class="text-green-200 text-sm mt-1">의제 등록을 위해 기본 정보를 입력해 주세요</p>
        </div>
        <button onclick="closeModal('submit-modal')" class="text-white hover:text-green-200">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
    </div>
    <div class="mx-6 mt-5 p-4 bg-green-50 rounded-xl border-l-4 border-green-500">
      <p class="text-xs text-green-600 font-semibold mb-1">등록할 의제</p>
      <p id="preview-content" class="text-gray-700 text-sm leading-relaxed"></p>
    </div>
    <div class="p-6 space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">이름 <span class="text-red-500">*</span></label>
          <input type="text" id="input-name" placeholder="홍길동"
            class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">연락처 <span class="text-red-500">*</span></label>
          <input type="tel" id="input-phone" placeholder="010-0000-0000"
            class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
        </div>
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">이메일 <span class="text-gray-400 font-normal">(선택)</span></label>
        <input type="email" id="input-email" placeholder="example@email.com"
          class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">거주 동 <span class="text-red-500">*</span></label>
        <select id="input-district" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all bg-white">
          <option value="">거주하시는 동을 선택해 주세요</option>
          <option>매곡동</option><option>조례동</option><option>풍덕동</option>
          <option>연향동</option><option>왕지동</option><option>덕연동</option>
          <option>오천동</option><option>가곡동</option><option>생목동</option>
          <option>남제동</option><option>장천동</option><option>용당동</option>
          <option>저전동</option><option>향동</option><option>행동</option>
          <option>교량동</option><option>와룡동</option><option>금곡동</option>
          <option>인제동</option><option>도사동</option><option>해룡면</option>
          <option>서면</option><option>황전면</option><option>월등면</option>
          <option>주암면</option><option>승주읍</option><option>외서면</option>
          <option>낙안면</option><option>별량면</option><option>상사면</option>
          <option>기타</option>
        </select>
      </div>
      <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h4 class="font-semibold text-sm text-gray-700 mb-2"><i class="fas fa-shield-alt text-green-600 mr-1"></i>개인정보 수집·이용 동의</h4>
        <div class="text-xs text-gray-500 space-y-1 mb-3 max-h-28 overflow-y-auto">
          <p><strong>수집 목적:</strong> 생태적 공론장 의제 발굴 및 참여자 연락</p>
          <p><strong>수집 항목:</strong> 이름, 연락처, 이메일(선택), 거주 동</p>
          <p><strong>보유 기간:</strong> 공론장 사업 종료 후 1년</p>
          <p><strong>제3자 제공:</strong> 없음 (순천에코칼리지 내부 사용)</p>
        </div>
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" id="privacy-agree" class="w-5 h-5 accent-green-600 rounded">
          <span class="text-sm font-medium text-gray-700">개인정보 수집·이용에 <strong class="text-green-700">동의합니다</strong></span>
        </label>
      </div>
      <div id="modal-error" class="hidden bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
        <i class="fas fa-exclamation-circle mr-1"></i><span id="modal-error-text"></span>
      </div>
      <button onclick="submitAgenda()" id="submit-btn"
        class="btn-primary w-full text-white font-bold py-4 rounded-xl text-base">
        <i class="fas fa-paper-plane mr-2"></i>의제 최종 등록하기
      </button>
    </div>
  </div>
</div>

<!-- 성공 모달 -->
<div id="success-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4">
  <div class="modal-backdrop absolute inset-0"></div>
  <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center z-10">
    <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <i class="fas fa-check-circle text-green-600 text-4xl"></i>
    </div>
    <h3 class="text-xl font-bold text-gray-800 mb-2">의제가 등록되었습니다!</h3>
    <p class="text-gray-500 text-sm mb-6">소중한 의견이 순천 생태적 공론장에 반영될 수 있도록 최선을 다하겠습니다.</p>
    <button onclick="closeModal('success-modal'); location.reload();"
      class="btn-primary w-full text-white font-bold py-3 rounded-xl">확인</button>
  </div>
</div>

<script>
let allAgendas = []
let carouselInterval = null
let carouselOffset = 0

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadAgendas(), loadWordCloud()])
  const ta = document.getElementById('main-agenda-input')
  ta.addEventListener('input', () => {
    document.getElementById('char-count').textContent = ta.value.length + ' / 500'
  })
})

async function loadAgendas() {
  try {
    const res = await fetch('/api/agendas')
    const json = await res.json()
    if (json.success) {
      allAgendas = json.data
      document.getElementById('total-count').textContent = allAgendas.length
      renderCarousel()
    }
  } catch(e) {
    document.getElementById('carousel-track').innerHTML = '<div class="text-gray-400 text-center py-8 w-full">의제를 불러올 수 없습니다.</div>'
  }
}

function renderCarousel() {
  const track = document.getElementById('carousel-track')
  if (!allAgendas.length) {
    track.innerHTML = \`<div class="text-center text-gray-400 py-12 w-full">
      <i class="fas fa-seedling text-4xl text-green-300 mb-3 block"></i>
      <p>아직 등록된 의제가 없습니다. 첫 의제를 남겨보세요!</p>
    </div>\`
    return
  }
  const palette = [
    {bg:'bg-green-50',border:'border-green-200',icon:'text-green-500'},
    {bg:'bg-blue-50',border:'border-blue-200',icon:'text-blue-500'},
    {bg:'bg-purple-50',border:'border-purple-200',icon:'text-purple-500'},
    {bg:'bg-amber-50',border:'border-amber-200',icon:'text-amber-500'},
    {bg:'bg-rose-50',border:'border-rose-200',icon:'text-rose-500'},
  ]
  track.innerHTML = allAgendas.map((a,i) => {
    const p = palette[i % palette.length]
    const date = new Date(a.created_at).toLocaleDateString('ko-KR',{month:'short',day:'numeric'})
    return \`<div class="agenda-card \${p.bg} border \${p.border} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
          <i class="fas fa-quote-left text-xs \${p.icon}"></i>
        </div>
        <p class="text-gray-700 text-sm leading-relaxed flex-1">\${esc(a.content)}</p>
      </div>
      <div class="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span><i class="fas fa-map-marker-alt mr-1 \${p.icon}"></i>\${esc(a.district)}</span>
        <span>\${date}</span>
      </div>
    </div>\`
  }).join('')

  if (carouselInterval) clearInterval(carouselInterval)
  const cardW = 296 + 16
  carouselInterval = setInterval(() => {
    carouselOffset += cardW
    const maxOffset = Math.max(0, allAgendas.length * cardW - document.getElementById('carousel-container').offsetWidth)
    if (carouselOffset > maxOffset) carouselOffset = 0
    track.style.transform = \`translateX(-\${carouselOffset}px)\`
  }, 3000)
}

async function loadWordCloud() {
  try {
    const res = await fetch('/api/word-cloud')
    const json = await res.json()
    const el = document.getElementById('word-cloud-container')
    if (!json.success || !json.data.length) {
      el.innerHTML = '<p class="text-gray-400 text-sm">아직 키워드 데이터가 없습니다.</p>'
      return
    }
    const words = json.data
    const maxC = words[0].count, minC = words[words.length-1].count
    const colors = ['#16a34a','#15803d','#059669','#0d9488','#2563eb','#7c3aed','#db2777','#ea580c','#ca8a04']
    el.innerHTML = words.map((item,i) => {
      const ratio = maxC===minC ? 0.5 : (item.count-minC)/(maxC-minC)
      const fs = Math.round(12 + ratio*28)
      const op = (0.6 + ratio*0.4).toFixed(2)
      const rot = [-15,-8,0,8,15][i%5]
      return \`<span class="word-cloud-item font-bold select-none"
        style="font-size:\${fs}px;color:\${colors[i%colors.length]};opacity:\${op};transform:rotate(\${rot}deg)"
        title="\${item.count}회 언급">\${esc(item.word)}</span>\`
    }).join(' ')
  } catch(e) {
    document.getElementById('word-cloud-container').innerHTML = '<p class="text-gray-400 text-sm">키워드를 불러올 수 없습니다.</p>'
  }
}

function openSubmitModal() {
  const content = document.getElementById('main-agenda-input').value.trim()
  if (!content) {
    const ta = document.getElementById('main-agenda-input')
    ta.style.borderColor = '#ef4444'
    ta.focus()
    setTimeout(()=>ta.style.borderColor='',2000)
    return
  }
  document.getElementById('preview-content').textContent = content
  document.getElementById('submit-modal').classList.remove('hidden')
  document.body.style.overflow = 'hidden'
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden')
  document.body.style.overflow = ''
  if (id==='submit-modal') document.getElementById('modal-error').classList.add('hidden')
}

async function submitAgenda() {
  const content = document.getElementById('main-agenda-input').value.trim()
  const name = document.getElementById('input-name').value.trim()
  const phone = document.getElementById('input-phone').value.trim()
  const email = document.getElementById('input-email').value.trim()
  const district = document.getElementById('input-district').value
  const privacyAgreed = document.getElementById('privacy-agree').checked
  const errEl = document.getElementById('modal-error')
  const errTxt = document.getElementById('modal-error-text')

  errEl.classList.add('hidden')
  const showErr = (m) => { errTxt.textContent=m; errEl.classList.remove('hidden') }

  if (!name) return showErr('이름을 입력해 주세요.')
  if (!phone) return showErr('연락처를 입력해 주세요.')
  if (!district) return showErr('거주 동을 선택해 주세요.')
  if (!privacyAgreed) return showErr('개인정보 수집·이용에 동의해 주세요.')

  const btn = document.getElementById('submit-btn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>등록 중...'

  try {
    const res = await fetch('/api/agendas', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({content,name,phone,email,district,privacy_agreed:privacyAgreed})
    })
    const json = await res.json()
    if (json.success) {
      closeModal('submit-modal')
      document.getElementById('success-modal').classList.remove('hidden')
      document.body.style.overflow = 'hidden'
      document.getElementById('main-agenda-input').value = ''
      document.getElementById('char-count').textContent = '0 / 500'
    } else {
      showErr(json.error || '등록 중 오류가 발생했습니다.')
    }
  } catch(e) {
    showErr('네트워크 오류가 발생했습니다.')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>의제 최종 등록하기'
  }
}

function esc(text) {
  const d = document.createElement('div')
  d.appendChild(document.createTextNode(text))
  return d.innerHTML
}

document.addEventListener('keydown', e => {
  if (e.key==='Escape') ['submit-modal','success-modal'].forEach(id => {
    if (!document.getElementById(id).classList.contains('hidden')) closeModal(id)
  })
})
</script>
</body>
</html>`

  return c.html(html)
}
