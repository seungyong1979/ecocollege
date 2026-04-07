import type { Context } from 'hono'

type Bindings = { DB: D1Database; ADMIN_SECRET: string }

export async function adminPage(c: Context<{ Bindings: Bindings }>) {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>관리자 페이지 | 순천에코칼리지</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Noto Sans KR', sans-serif; }
    .sidebar { width: 240px; min-height: 100vh; }
    @media (max-width: 768px) { .sidebar { width: 100%; min-height: auto; } }
    .nav-item { transition: all 0.2s; }
    .nav-item:hover, .nav-item.active { background: rgba(255,255,255,0.15); }
    .table-row:hover { background: #f0fdf4; }
    .status-visible { background: #dcfce7; color: #166534; }
    .status-hidden { background: #fef9c3; color: #854d0e; }
    .status-deleted { background: #fee2e2; color: #991b1b; }
    .modal-backdrop { background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
    input:focus, textarea:focus, select:focus { outline: none; border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,0.15); }
  </style>
</head>
<body class="bg-gray-100 text-gray-800">

<!-- 로그인 화면 -->
<div id="login-screen" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-eco-800 to-eco-900">
  <style>.from-eco-800{--tw-gradient-from:#166534}.to-eco-900{--tw-gradient-to:#14532d}</style>
  <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
    <div class="text-center mb-6">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <i class="fas fa-leaf text-green-600 text-2xl"></i>
      </div>
      <h1 class="text-2xl font-black text-gray-800">관리자 로그인</h1>
      <p class="text-gray-500 text-sm mt-1">순천에코칼리지 의제 관리 시스템</p>
    </div>
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">아이디</label>
        <input type="text" id="login-username" placeholder="admin"
          class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 transition-all"
          onkeydown="if(event.key==='Enter') document.getElementById('login-password').focus()">
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">비밀번호</label>
        <input type="password" id="login-password" placeholder="비밀번호"
          class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 transition-all"
          onkeydown="if(event.key==='Enter') doLogin()">
      </div>
      <div id="login-error" class="hidden bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center"></div>
      <button onclick="doLogin()" id="login-btn"
        class="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition-all">
        <i class="fas fa-sign-in-alt mr-2"></i>로그인
      </button>
    </div>
    <p class="text-center text-xs text-gray-400 mt-4">
      초기 계정: admin / admin1234
    </p>
  </div>
</div>

<!-- 관리자 메인 -->
<div id="admin-main" class="hidden min-h-screen flex flex-col md:flex-row">
  <!-- 사이드바 -->
  <aside class="sidebar bg-green-800 text-white flex-shrink-0">
    <div class="p-6 border-b border-green-700">
      <div class="flex items-center gap-2">
        <i class="fas fa-leaf text-green-300 text-xl"></i>
        <div>
          <p class="font-bold text-white">에코칼리지</p>
          <p class="text-green-300 text-xs">의제 관리 시스템</p>
        </div>
      </div>
    </div>
    <nav class="p-3 space-y-1">
      <a onclick="showSection('dashboard')" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-green-100 hover:text-white active" id="nav-dashboard">
        <i class="fas fa-chart-bar w-4"></i><span>대시보드</span>
      </a>
      <a onclick="showSection('agendas')" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-green-100 hover:text-white" id="nav-agendas">
        <i class="fas fa-list w-4"></i><span>의제 목록</span>
      </a>
      <a onclick="showSection('settings')" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-green-100 hover:text-white" id="nav-settings">
        <i class="fas fa-cog w-4"></i><span>사이트 설정</span>
      </a>
      <a onclick="showSection('account')" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-green-100 hover:text-white" id="nav-account">
        <i class="fas fa-user-cog w-4"></i><span>계정 설정</span>
      </a>
    </nav>
    <div class="p-3 absolute bottom-0 w-full md:relative">
      <button onclick="doLogout()" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-green-300 hover:text-white hover:bg-white hover:bg-opacity-10 transition-all">
        <i class="fas fa-sign-out-alt w-4"></i><span class="text-sm">로그아웃</span>
      </button>
    </div>
  </aside>

  <!-- 메인 콘텐츠 -->
  <main class="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
    <div class="max-w-5xl mx-auto">

      <!-- ── 대시보드 ── -->
      <section id="sec-dashboard">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-black text-gray-800">대시보드</h2>
          <span class="text-sm text-gray-400" id="admin-user-info"></span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p class="text-3xl font-black text-green-700" id="stat-total">-</p>
            <p class="text-sm text-gray-500 mt-1">전체 의제</p>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p class="text-3xl font-black text-blue-600" id="stat-visible">-</p>
            <p class="text-sm text-gray-500 mt-1">공개 의제</p>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p class="text-3xl font-black text-yellow-600" id="stat-hidden">-</p>
            <p class="text-sm text-gray-500 mt-1">숨김 의제</p>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p class="text-3xl font-black text-eco-600" id="stat-today" style="color:#16a34a">-</p>
            <p class="text-sm text-gray-500 mt-1">오늘 등록</p>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <i class="fas fa-bolt text-yellow-500"></i> 빠른 작업
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onclick="showSection('agendas')"
              class="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-800 font-semibold py-3 px-4 rounded-xl transition-all">
              <i class="fas fa-list"></i> 의제 관리하기
            </button>
            <button onclick="exportCSV()"
              class="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold py-3 px-4 rounded-xl transition-all">
              <i class="fas fa-file-excel"></i> 엑셀 다운로드
            </button>
            <button onclick="showSection('settings')"
              class="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold py-3 px-4 rounded-xl transition-all">
              <i class="fas fa-cog"></i> 사이트 설정
            </button>
          </div>
        </div>
      </section>

      <!-- ── 의제 목록 ── -->
      <section id="sec-agendas" class="hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h2 class="text-2xl font-black text-gray-800">의제 목록</h2>
          <button onclick="exportCSV()"
            class="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-4 rounded-xl transition-all text-sm">
            <i class="fas fa-file-excel"></i> CSV 다운로드
          </button>
        </div>

        <!-- 필터/검색 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div class="flex flex-col sm:flex-row gap-3">
            <select id="filter-status" onchange="loadAdminAgendas(1)"
              class="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm flex-shrink-0">
              <option value="all">전체</option>
              <option value="visible">공개</option>
              <option value="hidden">숨김</option>
            </select>
            <input type="text" id="search-keyword" placeholder="내용, 이름, 동으로 검색..."
              class="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm flex-1"
              onkeydown="if(event.key==='Enter') loadAdminAgendas(1)">
            <button onclick="loadAdminAgendas(1)"
              class="bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-800 transition-all">
              <i class="fas fa-search"></i> 검색
            </button>
          </div>
        </div>

        <!-- 테이블 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">의제 내용</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">이름</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">연락처</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">동</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">상태</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">등록일</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody id="agenda-table-body">
                <tr><td colspan="8" class="text-center py-8 text-gray-400">
                  <i class="fas fa-spinner fa-spin mr-2"></i>불러오는 중...
                </td></tr>
              </tbody>
            </table>
          </div>
          <!-- 페이지네이션 -->
          <div class="flex items-center justify-between p-4 border-t border-gray-100">
            <span class="text-sm text-gray-500" id="page-info">-</span>
            <div class="flex gap-2" id="pagination"></div>
          </div>
        </div>
      </section>

      <!-- ── 사이트 설정 ── -->
      <section id="sec-settings" class="hidden">
        <h2 class="text-2xl font-black text-gray-800 mb-6">사이트 설정</h2>

        <div class="space-y-4">
          <!-- 메인 텍스트 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <i class="fas fa-heading text-green-600"></i> 메인 텍스트 설정
            </h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">메인 타이틀</label>
                <input type="text" id="s-main-title" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">메인 부제</label>
                <textarea id="s-main-subtitle" rows="2" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all resize-none"></textarea>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">의제 활용 안내 문구</label>
                <textarea id="s-usage-guide" rows="2" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all resize-none"></textarea>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">생태적 공론장 설명</label>
                <textarea id="s-forum-desc" rows="3" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all resize-none"></textarea>
              </div>
            </div>
          </div>

          <!-- 배경 이미지 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <i class="fas fa-image text-blue-600"></i> 히어로 배경 이미지
            </h3>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">이미지 URL</label>
              <input type="url" id="s-hero-image" placeholder="https://example.com/image.jpg"
                class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
              <p class="text-xs text-gray-400 mt-1">공개 이미지 URL을 입력하세요. 비워두면 기본 그라데이션 배경이 사용됩니다.</p>
              <div id="image-preview-container" class="mt-3 hidden">
                <img id="image-preview" src="" alt="미리보기" class="h-32 rounded-xl object-cover border border-gray-200">
              </div>
            </div>
          </div>

          <!-- 푸터 설정 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <i class="fas fa-link text-purple-600"></i> 푸터 연락처/링크
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1"><i class="fas fa-blog mr-1 text-orange-500"></i>블로그 URL</label>
                <input type="url" id="s-footer-blog" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1"><i class="fab fa-facebook mr-1 text-blue-600"></i>페이스북 URL</label>
                <input type="url" id="s-footer-facebook" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1"><i class="fab fa-instagram mr-1 text-pink-600"></i>인스타그램 URL</label>
                <input type="url" id="s-footer-instagram" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1"><i class="fas fa-phone mr-1 text-green-600"></i>전화번호</label>
                <input type="tel" id="s-footer-phone" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
              </div>
              <div class="sm:col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-1"><i class="fas fa-envelope mr-1 text-red-500"></i>이메일</label>
                <input type="email" id="s-footer-email" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
              </div>
            </div>
          </div>

          <div id="settings-msg" class="hidden"></div>

          <button onclick="saveSettings()"
            class="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-xl transition-all">
            <i class="fas fa-save mr-2"></i>설정 저장하기
          </button>
        </div>
      </section>

      <!-- ── 계정 설정 ── -->
      <section id="sec-account" class="hidden">
        <h2 class="text-2xl font-black text-gray-800 mb-6">계정 설정</h2>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-md">
          <h3 class="font-bold text-gray-700 mb-4"><i class="fas fa-key text-yellow-500 mr-2"></i>비밀번호 변경</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">현재 비밀번호</label>
              <input type="password" id="curr-pw" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">새 비밀번호</label>
              <input type="password" id="new-pw" placeholder="최소 6자 이상"
                class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">새 비밀번호 확인</label>
              <input type="password" id="new-pw-confirm"
                class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
            </div>
            <div id="pw-msg" class="hidden text-sm p-3 rounded-xl"></div>
            <button onclick="changePassword()"
              class="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition-all">
              <i class="fas fa-key mr-2"></i>비밀번호 변경
            </button>
          </div>
        </div>
      </section>

    </div>
  </main>
</div>

<!-- 의제 수정 모달 -->
<div id="edit-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4">
  <div class="modal-backdrop absolute inset-0" onclick="closeEditModal()"></div>
  <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 p-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-bold text-gray-800 text-lg"><i class="fas fa-edit text-green-600 mr-2"></i>의제 수정</h3>
      <button onclick="closeEditModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button>
    </div>
    <input type="hidden" id="edit-agenda-id">
    <textarea id="edit-content" rows="5"
      class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all resize-none mb-4"></textarea>
    <div id="edit-msg" class="hidden text-sm p-3 rounded-xl mb-3"></div>
    <div class="flex gap-3">
      <button onclick="closeEditModal()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all">취소</button>
      <button onclick="saveEdit()" class="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-all">저장</button>
    </div>
  </div>
</div>

<!-- 상세보기 모달 -->
<div id="detail-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4">
  <div class="modal-backdrop absolute inset-0" onclick="closeDetailModal()"></div>
  <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 p-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-bold text-gray-800 text-lg"><i class="fas fa-info-circle text-blue-600 mr-2"></i>의제 상세</h3>
      <button onclick="closeDetailModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button>
    </div>
    <div id="detail-content" class="space-y-3 text-sm"></div>
  </div>
</div>

<script>
let authToken = localStorage.getItem('eco_admin_token')
let currentPage = 1
let currentSection = 'dashboard'

// ==================== 초기화 ====================
document.addEventListener('DOMContentLoaded', () => {
  if (authToken) {
    showAdminMain()
  }
})

// ==================== 로그인 ====================
async function doLogin() {
  const username = document.getElementById('login-username').value.trim()
  const password = document.getElementById('login-password').value
  const errEl = document.getElementById('login-error')
  const btn = document.getElementById('login-btn')

  if (!username || !password) {
    errEl.textContent = '아이디와 비밀번호를 입력해 주세요.'
    errEl.classList.remove('hidden')
    return
  }

  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>로그인 중...'

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const json = await res.json()

    if (json.success) {
      authToken = json.token
      localStorage.setItem('eco_admin_token', authToken)
      localStorage.setItem('eco_admin_user', json.username)
      errEl.classList.add('hidden')
      showAdminMain()
    } else {
      errEl.textContent = json.error || '로그인 실패'
      errEl.classList.remove('hidden')
    }
  } catch (e) {
    errEl.textContent = '네트워크 오류가 발생했습니다.'
    errEl.classList.remove('hidden')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>로그인'
  }
}

function doLogout() {
  localStorage.removeItem('eco_admin_token')
  localStorage.removeItem('eco_admin_user')
  authToken = null
  document.getElementById('admin-main').classList.add('hidden')
  document.getElementById('login-screen').classList.remove('hidden')
}

function showAdminMain() {
  document.getElementById('login-screen').classList.add('hidden')
  document.getElementById('admin-main').classList.remove('hidden')
  const user = localStorage.getItem('eco_admin_user') || 'admin'
  document.getElementById('admin-user-info').textContent = user + ' 님 환영합니다'
  loadStats()
  showSection('dashboard')
}

// ==================== 섹션 전환 ====================
function showSection(name) {
  ['dashboard', 'agendas', 'settings', 'account'].forEach(s => {
    document.getElementById('sec-' + s).classList.toggle('hidden', s !== name)
    document.getElementById('nav-' + s).classList.toggle('active', s === name)
  })
  currentSection = name

  if (name === 'agendas') loadAdminAgendas(1)
  if (name === 'settings') loadSettings()
  if (name === 'dashboard') loadStats()
}

// ==================== 통계 ====================
async function loadStats() {
  try {
    const res = await authFetch('/api/admin/stats')
    const json = await res.json()
    if (json.success) {
      document.getElementById('stat-total').textContent = json.data.total
      document.getElementById('stat-visible').textContent = json.data.visible
      document.getElementById('stat-hidden').textContent = json.data.hidden
      document.getElementById('stat-today').textContent = json.data.today
    }
  } catch (e) {}
}

// ==================== 의제 목록 ====================
async function loadAdminAgendas(page = 1) {
  currentPage = page
  const status = document.getElementById('filter-status').value
  const search = document.getElementById('search-keyword').value.trim()
  const tbody = document.getElementById('agenda-table-body')
  tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>불러오는 중...</td></tr>'

  try {
    const params = new URLSearchParams({ page: String(page), status })
    if (search) params.set('search', search)
    const res = await authFetch('/api/admin/agendas?' + params)
    const json = await res.json()

    if (!json.success) throw new Error(json.error)

    const { data, total, totalPages } = json
    document.getElementById('page-info').textContent = \`총 \${total}건 / \${page}/\${totalPages} 페이지\`

    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-400">검색 결과가 없습니다.</td></tr>'
      return
    }

    tbody.innerHTML = data.map(a => {
      const statusClass = a.status === 'visible' ? 'status-visible' : a.status === 'hidden' ? 'status-hidden' : 'status-deleted'
      const statusLabel = a.status === 'visible' ? '공개' : a.status === 'hidden' ? '숨김' : '삭제'
      const date = new Date(a.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
      const shortContent = a.content.length > 40 ? a.content.slice(0, 40) + '...' : a.content
      return \`<tr class="table-row border-b border-gray-100 cursor-pointer" onclick="showDetail(\${JSON.stringify(a).replace(/"/g, '&quot;')})">
        <td class="px-4 py-3 text-gray-400 text-xs">\${a.id}</td>
        <td class="px-4 py-3 text-gray-700 max-w-xs">\${escHtml(shortContent)}</td>
        <td class="px-4 py-3 text-gray-600 hidden md:table-cell">\${escHtml(a.name)}</td>
        <td class="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">\${escHtml(maskPhone(a.phone))}</td>
        <td class="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">\${escHtml(a.district)}</td>
        <td class="px-4 py-3"><span class="px-2 py-1 rounded-full text-xs font-semibold \${statusClass}">\${statusLabel}</span></td>
        <td class="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">\${date}</td>
        <td class="px-4 py-3" onclick="event.stopPropagation()">
          <div class="flex gap-1 justify-center flex-wrap">
            <button onclick="openEdit(\${a.id}, \${JSON.stringify(a.content).replace(/"/g, '&quot;')})" 
              class="bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs px-2 py-1 rounded-lg transition-all" title="수정">
              <i class="fas fa-edit"></i>
            </button>
            \${a.status !== 'visible' ? 
              \`<button onclick="updateStatus(\${a.id}, 'visible')" class="bg-green-100 hover:bg-green-200 text-green-700 text-xs px-2 py-1 rounded-lg transition-all" title="공개">
                <i class="fas fa-eye"></i></button>\` : ''}
            \${a.status !== 'hidden' ? 
              \`<button onclick="updateStatus(\${a.id}, 'hidden')" class="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs px-2 py-1 rounded-lg transition-all" title="숨기기">
                <i class="fas fa-eye-slash"></i></button>\` : ''}
            <button onclick="if(confirm('정말 삭제하시겠습니까?')) updateStatus(\${a.id}, 'deleted')" 
              class="bg-red-100 hover:bg-red-200 text-red-700 text-xs px-2 py-1 rounded-lg transition-all" title="삭제">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>\`
    }).join('')

    // 페이지네이션
    let paginationHtml = ''
    const startPage = Math.max(1, page - 2)
    const endPage = Math.min(totalPages, page + 2)
    if (page > 1) paginationHtml += \`<button onclick="loadAdminAgendas(\${page-1})" class="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"><i class="fas fa-chevron-left"></i></button>\`
    for (let p = startPage; p <= endPage; p++) {
      paginationHtml += \`<button onclick="loadAdminAgendas(\${p})" class="px-3 py-1 rounded-lg text-sm \${p === page ? 'bg-green-700 text-white' : 'bg-gray-100 hover:bg-gray-200'}">\${p}</button>\`
    }
    if (page < totalPages) paginationHtml += \`<button onclick="loadAdminAgendas(\${page+1})" class="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"><i class="fas fa-chevron-right"></i></button>\`
    document.getElementById('pagination').innerHTML = paginationHtml
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-red-400">데이터를 불러올 수 없습니다.</td></tr>'
  }
}

// 상태 변경
async function updateStatus(id, status) {
  try {
    const res = await authFetch(\`/api/admin/agendas/\${id}\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    const json = await res.json()
    if (json.success) {
      loadAdminAgendas(currentPage)
      loadStats()
    } else {
      alert(json.error || '오류 발생')
    }
  } catch (e) { alert('오류가 발생했습니다.') }
}

// ==================== 수정 모달 ====================
function openEdit(id, content) {
  document.getElementById('edit-agenda-id').value = id
  document.getElementById('edit-content').value = content
  document.getElementById('edit-msg').classList.add('hidden')
  document.getElementById('edit-modal').classList.remove('hidden')
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden')
}

async function saveEdit() {
  const id = document.getElementById('edit-agenda-id').value
  const content = document.getElementById('edit-content').value.trim()
  const msgEl = document.getElementById('edit-msg')

  if (!content) {
    msgEl.textContent = '내용을 입력해 주세요.'
    msgEl.className = 'text-sm p-3 rounded-xl bg-red-50 text-red-600'
    msgEl.classList.remove('hidden')
    return
  }

  try {
    const res = await authFetch(\`/api/admin/agendas/\${id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })
    const json = await res.json()
    if (json.success) {
      msgEl.textContent = '수정되었습니다.'
      msgEl.className = 'text-sm p-3 rounded-xl bg-green-50 text-green-700'
      msgEl.classList.remove('hidden')
      setTimeout(() => { closeEditModal(); loadAdminAgendas(currentPage) }, 1000)
    } else {
      msgEl.textContent = json.error || '오류 발생'
      msgEl.className = 'text-sm p-3 rounded-xl bg-red-50 text-red-600'
      msgEl.classList.remove('hidden')
    }
  } catch (e) {
    msgEl.textContent = '오류가 발생했습니다.'
    msgEl.classList.remove('hidden')
  }
}

// ==================== 상세 보기 ====================
function showDetail(a) {
  const modal = document.getElementById('detail-modal')
  document.getElementById('detail-content').innerHTML = \`
    <div class="bg-gray-50 rounded-xl p-4">
      <p class="text-gray-500 text-xs mb-1">의제 내용</p>
      <p class="text-gray-800 leading-relaxed">\${escHtml(a.content)}</p>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div class="bg-gray-50 rounded-xl p-3">
        <p class="text-gray-400 text-xs mb-0.5">이름</p>
        <p class="font-semibold">\${escHtml(a.name)}</p>
      </div>
      <div class="bg-gray-50 rounded-xl p-3">
        <p class="text-gray-400 text-xs mb-0.5">연락처</p>
        <p class="font-semibold">\${escHtml(a.phone)}</p>
      </div>
      <div class="bg-gray-50 rounded-xl p-3">
        <p class="text-gray-400 text-xs mb-0.5">이메일</p>
        <p class="font-semibold">\${escHtml(a.email || '-')}</p>
      </div>
      <div class="bg-gray-50 rounded-xl p-3">
        <p class="text-gray-400 text-xs mb-0.5">거주 동</p>
        <p class="font-semibold">\${escHtml(a.district)}</p>
      </div>
      <div class="bg-gray-50 rounded-xl p-3">
        <p class="text-gray-400 text-xs mb-0.5">개인정보 동의</p>
        <p class="font-semibold">\${a.privacy_agreed ? '✅ 동의' : '❌ 미동의'}</p>
      </div>
      <div class="bg-gray-50 rounded-xl p-3">
        <p class="text-gray-400 text-xs mb-0.5">등록일시</p>
        <p class="font-semibold text-xs">\${new Date(a.created_at).toLocaleString('ko-KR')}</p>
      </div>
    </div>
  \`
  modal.classList.remove('hidden')
}

function closeDetailModal() {
  document.getElementById('detail-modal').classList.add('hidden')
}

// ==================== CSV 다운로드 ====================
async function exportCSV() {
  try {
    const res = await authFetch('/api/admin/export')
    if (!res.ok) throw new Error()
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'agenda_' + new Date().toISOString().slice(0, 10) + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    alert('다운로드 중 오류가 발생했습니다.')
  }
}

// ==================== 설정 ====================
async function loadSettings() {
  try {
    const res = await fetch('/api/settings')
    const json = await res.json()
    if (json.success) {
      const s = json.data
      document.getElementById('s-main-title').value = s.main_title || ''
      document.getElementById('s-main-subtitle').value = s.main_subtitle || ''
      document.getElementById('s-usage-guide').value = s.usage_guide || ''
      document.getElementById('s-forum-desc').value = s.forum_description || ''
      document.getElementById('s-hero-image').value = s.hero_image || ''
      document.getElementById('s-footer-blog').value = s.footer_blog || ''
      document.getElementById('s-footer-facebook').value = s.footer_facebook || ''
      document.getElementById('s-footer-instagram').value = s.footer_instagram || ''
      document.getElementById('s-footer-phone').value = s.footer_phone || ''
      document.getElementById('s-footer-email').value = s.footer_email || ''
      
      const imgUrl = s.hero_image || ''
      if (imgUrl) {
        document.getElementById('image-preview').src = imgUrl
        document.getElementById('image-preview-container').classList.remove('hidden')
      }
    }
  } catch (e) {}
}

document.getElementById && document.addEventListener('DOMContentLoaded', () => {
  const imgInput = document.getElementById('s-hero-image')
  if (imgInput) {
    imgInput.addEventListener('input', () => {
      const url = imgInput.value.trim()
      const preview = document.getElementById('image-preview')
      const container = document.getElementById('image-preview-container')
      if (url) {
        preview.src = url
        container.classList.remove('hidden')
      } else {
        container.classList.add('hidden')
      }
    })
  }
})

async function saveSettings() {
  const settings = {
    main_title: document.getElementById('s-main-title').value,
    main_subtitle: document.getElementById('s-main-subtitle').value,
    usage_guide: document.getElementById('s-usage-guide').value,
    forum_description: document.getElementById('s-forum-desc').value,
    hero_image: document.getElementById('s-hero-image').value,
    footer_blog: document.getElementById('s-footer-blog').value,
    footer_facebook: document.getElementById('s-footer-facebook').value,
    footer_instagram: document.getElementById('s-footer-instagram').value,
    footer_phone: document.getElementById('s-footer-phone').value,
    footer_email: document.getElementById('s-footer-email').value,
  }

  const msgEl = document.getElementById('settings-msg')

  try {
    const res = await authFetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    const json = await res.json()
    if (json.success) {
      msgEl.textContent = '✅ 설정이 저장되었습니다. 메인 페이지에 적용됩니다.'
      msgEl.className = 'bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-xl'
      msgEl.classList.remove('hidden')
    } else {
      msgEl.textContent = '❌ 오류: ' + (json.error || '저장 실패')
      msgEl.className = 'bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl'
      msgEl.classList.remove('hidden')
    }
  } catch (e) {
    msgEl.textContent = '❌ 네트워크 오류가 발생했습니다.'
    msgEl.classList.remove('hidden')
  }

  setTimeout(() => msgEl.classList.add('hidden'), 3000)
}

// ==================== 비밀번호 변경 ====================
async function changePassword() {
  const curr = document.getElementById('curr-pw').value
  const next = document.getElementById('new-pw').value
  const confirm = document.getElementById('new-pw-confirm').value
  const msgEl = document.getElementById('pw-msg')

  function showMsg(text, isError) {
    msgEl.textContent = text
    msgEl.className = \`text-sm p-3 rounded-xl \${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}\`
    msgEl.classList.remove('hidden')
  }

  if (!curr || !next || !confirm) return showMsg('모든 항목을 입력해 주세요.', true)
  if (next !== confirm) return showMsg('새 비밀번호가 일치하지 않습니다.', true)
  if (next.length < 6) return showMsg('새 비밀번호는 6자 이상이어야 합니다.', true)

  try {
    const res = await authFetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: curr, new_password: next })
    })
    const json = await res.json()
    if (json.success) {
      showMsg('✅ 비밀번호가 변경되었습니다.', false)
      document.getElementById('curr-pw').value = ''
      document.getElementById('new-pw').value = ''
      document.getElementById('new-pw-confirm').value = ''
    } else {
      showMsg(json.error || '변경 실패', true)
    }
  } catch (e) { showMsg('오류가 발생했습니다.', true) }
}

// ==================== 유틸 ====================
function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'Authorization': 'Bearer ' + authToken
    }
  })
}

function escHtml(text) {
  if (!text) return ''
  const d = document.createElement('div')
  d.appendChild(document.createTextNode(String(text)))
  return d.innerHTML
}

function maskPhone(phone) {
  if (!phone) return '-'
  return phone.replace(/(\\d{3})\\d{3,4}(\\d{4})/, '$1****$2')
}
</script>
</body>
</html>`

  return c.html(html)
}
