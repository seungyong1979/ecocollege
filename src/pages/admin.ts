import type { Context } from 'hono'

export async function adminPage(c: Context) {
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
    * { font-family:'Noto Sans KR',sans-serif; }
    .nav-item { transition:all 0.2s; }
    .nav-item.active, .nav-item:hover { background:rgba(255,255,255,0.15); }
    .table-row:hover { background:#f0fdf4; }
    .status-visible { background:#dcfce7;color:#166534; }
    .status-hidden { background:#fef9c3;color:#854d0e; }
    .status-deleted { background:#fee2e2;color:#991b1b; }
    .modal-backdrop { background:rgba(0,0,0,0.5);backdrop-filter:blur(4px); }
    input:focus,textarea:focus,select:focus { outline:none;border-color:#16a34a !important;box-shadow:0 0 0 3px rgba(22,163,74,0.15); }
    /* 토글 스위치 */
    .menu-toggle-row { display:flex;align-items:center;justify-content:space-between;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:8px 12px;cursor:pointer;transition:background 0.15s; }
    .menu-toggle-row:hover { background:#f0fdf4; }
    .menu-toggle-label { font-size:12px;font-weight:600;color:#374151; }
    .menu-toggle-cb { display:none; }
    .menu-toggle-sw { position:relative;width:38px;height:22px;background:#d1d5db;border-radius:11px;flex-shrink:0;transition:background 0.2s; }
    .menu-toggle-sw::after { content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;background:white;border-radius:50%;transition:transform 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.2); }
    .menu-toggle-cb:checked + .menu-toggle-sw { background:#16a34a; }
    .menu-toggle-cb:checked + .menu-toggle-sw::after { transform:translateX(16px); }
  </style>
</head>
<body class="bg-gray-100 text-gray-800">

<!-- 로그인 -->
<div id="login-screen" class="min-h-screen flex items-center justify-center" style="background:linear-gradient(135deg,#166534,#14532d)">
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
          onkeydown="if(event.key==='Enter')document.getElementById('login-password').focus()">
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">비밀번호</label>
        <input type="password" id="login-password" placeholder="비밀번호"
          class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 transition-all"
          onkeydown="if(event.key==='Enter')doLogin()">
      </div>
      <div id="login-error" class="hidden bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center"></div>
      <button onclick="doLogin()" id="login-btn"
        class="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition-all">
        <i class="fas fa-sign-in-alt mr-2"></i>로그인
      </button>
      <p class="text-center text-xs text-gray-400">초기 계정: admin / admin1234</p>
    </div>
  </div>
</div>

<!-- 관리자 메인 -->
<div id="admin-main" class="hidden min-h-screen flex flex-col md:flex-row">
  <!-- 사이드바 -->
  <aside class="bg-green-800 text-white flex-shrink-0 w-full md:w-60">
    <div class="p-5 border-b border-green-700">
      <div class="flex items-center gap-2">
        <i class="fas fa-leaf text-green-300 text-xl"></i>
        <div><p class="font-bold">에코칼리지</p><p class="text-green-300 text-xs">의제 관리 시스템</p></div>
      </div>
    </div>
    <nav class="p-3 space-y-1">
      <a onclick="showSection('dashboard')" id="nav-dashboard"
        class="nav-item active flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-green-100 hover:text-white">
        <i class="fas fa-chart-bar w-4"></i><span>대시보드</span>
      </a>
      <a onclick="showSection('agendas')" id="nav-agendas"
        class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-green-100 hover:text-white">
        <i class="fas fa-list w-4"></i><span>의제 목록</span>
      </a>
      <a onclick="showSection('settings')" id="nav-settings"
        class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-green-100 hover:text-white">
        <i class="fas fa-cog w-4"></i><span>사이트 설정</span>
      </a>
      <a onclick="showSection('newsletter')" id="nav-newsletter"
        class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-green-100 hover:text-white">
        <i class="fas fa-newspaper w-4"></i><span>소식지 관리</span>
      </a>
      <a onclick="showSection('banned')" id="nav-banned"
        class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-green-100 hover:text-white">
        <i class="fas fa-ban w-4"></i><span>금칙어 관리</span>
      </a>
      <a onclick="showSection('account')" id="nav-account"
        class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-green-100 hover:text-white">
        <i class="fas fa-user-cog w-4"></i><span>계정 설정</span>
      </a>
    </nav>
    <div class="p-3 md:fixed md:bottom-0 md:w-60">
      <button onclick="doLogout()"
        class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-green-300 hover:text-white hover:bg-white hover:bg-opacity-10 transition-all">
        <i class="fas fa-sign-out-alt w-4"></i><span class="text-sm">로그아웃</span>
      </button>
    </div>
  </aside>

  <!-- 메인 콘텐츠 -->
  <main class="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
    <div class="max-w-5xl mx-auto">

      <!-- 대시보드 -->
      <section id="sec-dashboard">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-black text-gray-800">대시보드</h2>
          <span class="text-sm text-gray-400" id="admin-user-info"></span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl p-4 shadow-sm border text-center">
            <p class="text-3xl font-black text-green-700" id="stat-total">-</p>
            <p class="text-sm text-gray-500 mt-1">전체 의제</p>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm border text-center">
            <p class="text-3xl font-black text-blue-600" id="stat-visible">-</p>
            <p class="text-sm text-gray-500 mt-1">공개 의제</p>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm border text-center">
            <p class="text-3xl font-black text-yellow-600" id="stat-hidden">-</p>
            <p class="text-sm text-gray-500 mt-1">숨김 의제</p>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm border text-center">
            <p class="text-3xl font-black" style="color:#16a34a" id="stat-today">-</p>
            <p class="text-sm text-gray-500 mt-1">오늘 등록</p>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border p-6">
          <h3 class="font-bold text-gray-700 mb-4"><i class="fas fa-bolt text-yellow-500 mr-2"></i>빠른 작업</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onclick="showSection('agendas')" class="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-800 font-semibold py-3 px-4 rounded-xl transition-all">
              <i class="fas fa-list"></i>의제 관리하기
            </button>
            <button onclick="exportCSV()" class="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold py-3 px-4 rounded-xl transition-all">
              <i class="fas fa-file-excel"></i>엑셀 다운로드
            </button>
            <button onclick="showSection('settings')" class="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold py-3 px-4 rounded-xl transition-all">
              <i class="fas fa-cog"></i>사이트 설정
            </button>
            <a href="/manual.pdf" download id="manual-dl-btn"
              class="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-800 font-semibold py-3 px-4 rounded-xl transition-all"
              onclick="this.innerHTML='<i class=\\'fas fa-spinner fa-spin\\'></i> 생성 중...';setTimeout(()=>{this.innerHTML='<i class=\\'fas fa-file-pdf\\'></i>사용 매뉴얼 PDF'},4000)">
              <i class="fas fa-file-pdf"></i>사용 매뉴얼 PDF
            </a>
          </div>
        </div>
      </section>

      <!-- 의제 목록 -->
      <section id="sec-agendas" class="hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h2 class="text-2xl font-black text-gray-800">의제 목록</h2>
          <button onclick="exportCSV()" class="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-all">
            <i class="fas fa-file-excel"></i>CSV 다운로드
          </button>
        </div>
        <div class="bg-white rounded-xl shadow-sm border p-4 mb-4">
          <div class="flex flex-col sm:flex-row gap-3">
            <select id="filter-status" onchange="loadAdminAgendas(1)" class="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="all">전체</option>
              <option value="visible">공개</option>
              <option value="hidden">숨김</option>
            </select>
            <input type="text" id="search-keyword" placeholder="내용, 이름, 동으로 검색..."
              class="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm flex-1"
              onkeydown="if(event.key==='Enter')loadAdminAgendas(1)">
            <button onclick="loadAdminAgendas(1)" class="bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-800 transition-all">
              <i class="fas fa-search"></i> 검색
            </button>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b">
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
                <tr><td colspan="8" class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>불러오는 중...</td></tr>
              </tbody>
            </table>
          </div>
          <div class="flex items-center justify-between p-4 border-t">
            <span class="text-sm text-gray-500" id="page-info">-</span>
            <div class="flex gap-2" id="pagination"></div>
          </div>
        </div>
      </section>

      <!-- 사이트 설정 -->
      <section id="sec-settings" class="hidden">
        <h2 class="text-2xl font-black text-gray-800 mb-6">사이트 설정</h2>
        <div class="space-y-4">
          <div class="bg-white rounded-xl shadow-sm border p-6">
            <h3 class="font-bold text-gray-700 mb-4"><i class="fas fa-heading text-green-600 mr-2"></i>메인 텍스트</h3>
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
                <label class="block text-sm font-semibold text-gray-700 mb-1">의제 활용 안내</label>
                <textarea id="s-usage-guide" rows="2" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all resize-none"></textarea>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">생태적 공론장 설명</label>
                <textarea id="s-forum-desc" rows="3" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all resize-none"></textarea>
              </div>
            </div>
          </div>
          <!-- 메뉴 콘텐츠 편집 -->
          <div class="bg-white rounded-xl shadow-sm border p-6">
            <h3 class="font-bold text-gray-700 mb-2"><i class="fas fa-bars text-green-600 mr-2"></i>사이드 메뉴 콘텐츠</h3>
            <p class="text-xs text-gray-400 mb-4">각 메뉴 항목 페이지의 내용과 이미지를 편집합니다. 줄바꿈(Enter)으로 단락을 구분합니다. 이미지는 공개 URL을 입력하세요.</p>

            <!-- ABOUT -->
            <div class="mb-6">
              <p class="text-sm font-bold text-green-700 mb-3 flex items-center gap-1"><i class="fas fa-seedling"></i> ABOUT — 단체 소개</p>

              <!-- 에코칼리지란? -->
              <div class="mb-4 bg-green-50 rounded-xl p-4 space-y-2">
                <p class="text-xs font-bold text-green-800">에코칼리지란?</p>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">대표 이미지 URL</label>
                  <input type="url" id="s-about-eco-img" placeholder="https://example.com/image.jpg"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs">
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">본문 내용</label>
                  <textarea id="s-about-eco" rows="5" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y"></textarea>
                </div>
              </div>

              <!-- 교육 철학 -->
              <div class="mb-4 bg-green-50 rounded-xl p-4 space-y-2">
                <p class="text-xs font-bold text-green-800">교육 철학</p>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">대표 이미지 URL</label>
                  <input type="url" id="s-about-philosophy-img" placeholder="https://example.com/image.jpg"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs">
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">본문 내용</label>
                  <textarea id="s-about-philosophy" rows="3" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y"></textarea>
                </div>
              </div>

              <!-- 운영 주체 -->
              <div class="bg-green-50 rounded-xl p-4 space-y-2">
                <p class="text-xs font-bold text-green-800">운영 주체</p>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">대표 이미지 URL</label>
                  <input type="url" id="s-about-org-img" placeholder="https://example.com/image.jpg"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs">
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">본문 내용</label>
                  <textarea id="s-about-org" rows="3" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y"></textarea>
                </div>
              </div>
            </div>

            <!-- PROGRAM -->
            <div class="mb-6">
              <p class="text-sm font-bold text-blue-700 mb-3 flex items-center gap-1"><i class="fas fa-calendar-alt"></i> PROGRAM — 운영 프로그램</p>

              <!-- 2025 시범과정 -->
              <div class="mb-4 bg-blue-50 rounded-xl p-4 space-y-2">
                <p class="text-xs font-bold text-blue-800">2025 시범과정</p>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">대표 이미지 URL</label>
                  <input type="url" id="s-prog-2025-img" placeholder="https://example.com/image.jpg"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs">
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">본문 내용</label>
                  <textarea id="s-prog-2025" rows="3" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y"></textarea>
                </div>
              </div>

              <!-- 2026 과정 -->
              <div class="mb-4 bg-blue-50 rounded-xl p-4 space-y-2">
                <p class="text-xs font-bold text-blue-800">2026 생태문명 전환 촉진자 양성 과정</p>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">대표 이미지 URL</label>
                  <input type="url" id="s-prog-2026-img" placeholder="https://example.com/image.jpg"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs">
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">본문 내용</label>
                  <textarea id="s-prog-2026" rows="3" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y"></textarea>
                </div>
              </div>

              <!-- 생태공론장 -->
              <div class="bg-blue-50 rounded-xl p-4 space-y-2">
                <p class="text-xs font-bold text-blue-800">생태공론장</p>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">대표 이미지 URL</label>
                  <input type="url" id="s-prog-forum-img" placeholder="https://example.com/image.jpg"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs">
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">본문 내용</label>
                  <textarea id="s-prog-forum" rows="3" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y"></textarea>
                </div>
              </div>
            </div>

            <!-- APPLY -->
            <div>
              <p class="text-sm font-bold text-purple-700 mb-3 flex items-center gap-1"><i class="fas fa-paper-plane"></i> APPLY — 참여 신청</p>

              <!-- 참여 안내 -->
              <div class="mb-4 bg-purple-50 rounded-xl p-4 space-y-2">
                <p class="text-xs font-bold text-purple-800">참여 안내</p>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">대표 이미지 URL</label>
                  <input type="url" id="s-apply-guide-img" placeholder="https://example.com/image.jpg"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs">
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">본문 내용</label>
                  <textarea id="s-apply-guide" rows="3" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y"></textarea>
                </div>
              </div>

              <!-- 의제 등록 -->
              <div class="mb-4 bg-purple-50 rounded-xl p-4 space-y-2">
                <p class="text-xs font-bold text-purple-800">의제 등록</p>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">대표 이미지 URL</label>
                  <input type="url" id="s-apply-agenda-img" placeholder="https://example.com/image.jpg"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs">
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">본문 내용</label>
                  <textarea id="s-apply-agenda" rows="3" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y"></textarea>
                </div>
              </div>

              <!-- 문의하기 -->
              <div class="bg-purple-50 rounded-xl p-4 space-y-2">
                <p class="text-xs font-bold text-purple-800">문의하기</p>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">대표 이미지 URL</label>
                  <input type="url" id="s-apply-contact-img" placeholder="https://example.com/image.jpg"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs">
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">본문 내용</label>
                  <textarea id="s-apply-contact" rows="2" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y"></textarea>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border p-6">
            <h3 class="font-bold text-gray-700 mb-4"><i class="fas fa-image text-blue-600 mr-2"></i>히어로 배경 이미지</h3>
            <input type="url" id="s-hero-image" placeholder="https://example.com/image.jpg"
              class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all">
            <p class="text-xs text-gray-400 mt-1">공개 이미지 URL. 비워두면 기본 그라데이션 배경이 사용됩니다.</p>
            <div id="img-preview-wrap" class="mt-3 hidden">
              <img id="img-preview" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="미리보기" class="h-32 rounded-xl object-cover border">
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-sm border p-6">
            <h3 class="font-bold text-gray-700 mb-4"><i class="fas fa-link text-purple-600 mr-2"></i>푸터 연락처/링크</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1"><i class="fas fa-blog mr-1 text-orange-500"></i>블로그 URL</label>
                <input type="url" id="s-footer-blog" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1"><i class="fab fa-facebook mr-1 text-blue-600"></i>페이스북 URL</label>
                <input type="url" id="s-footer-facebook" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1"><i class="fab fa-instagram mr-1 text-pink-600"></i>인스타그램 URL</label>
                <input type="url" id="s-footer-instagram" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1"><i class="fas fa-phone mr-1 text-green-600"></i>전화번호</label>
                <input type="tel" id="s-footer-phone" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm">
              </div>
              <div class="sm:col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-1"><i class="fas fa-envelope mr-1 text-red-500"></i>이메일</label>
                <input type="email" id="s-footer-email" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm">
              </div>
            </div>
          </div>
          <!-- 메뉴 표시/숨김 제어 -->
          <div class="bg-white rounded-xl shadow-sm border p-6">
            <h3 class="font-bold text-gray-700 mb-2"><i class="fas fa-eye text-indigo-600 mr-2"></i>메뉴 표시/숨김</h3>
            <p class="text-xs text-gray-400 mb-4">토글을 끄면 사이드 메뉴에서 해당 항목이 숨겨집니다.</p>
            <div class="space-y-2">
              <!-- ABOUT -->
              <p class="text-xs font-bold text-green-700 mt-3 mb-1"><i class="fas fa-seedling mr-1"></i>ABOUT</p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label class="menu-toggle-row"><span class="menu-toggle-label">에코칼리지란?</span><input type="checkbox" id="mv-about-eco" class="menu-toggle-cb"><span class="menu-toggle-sw"></span></label>
                <label class="menu-toggle-row"><span class="menu-toggle-label">교육 철학</span><input type="checkbox" id="mv-about-philosophy" class="menu-toggle-cb"><span class="menu-toggle-sw"></span></label>
                <label class="menu-toggle-row"><span class="menu-toggle-label">운영 주체</span><input type="checkbox" id="mv-about-org" class="menu-toggle-cb"><span class="menu-toggle-sw"></span></label>
              </div>
              <!-- PROGRAM -->
              <p class="text-xs font-bold text-blue-700 mt-3 mb-1"><i class="fas fa-calendar-alt mr-1"></i>PROGRAM</p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label class="menu-toggle-row"><span class="menu-toggle-label">2025 시범과정</span><input type="checkbox" id="mv-prog-2025" class="menu-toggle-cb"><span class="menu-toggle-sw"></span></label>
                <label class="menu-toggle-row"><span class="menu-toggle-label">2026 양성과정</span><input type="checkbox" id="mv-prog-2026" class="menu-toggle-cb"><span class="menu-toggle-sw"></span></label>
                <label class="menu-toggle-row"><span class="menu-toggle-label">생태공론장</span><input type="checkbox" id="mv-prog-forum" class="menu-toggle-cb"><span class="menu-toggle-sw"></span></label>
              </div>
              <!-- APPLY -->
              <p class="text-xs font-bold text-purple-700 mt-3 mb-1"><i class="fas fa-paper-plane mr-1"></i>APPLY</p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label class="menu-toggle-row"><span class="menu-toggle-label">참여 안내</span><input type="checkbox" id="mv-apply-guide" class="menu-toggle-cb"><span class="menu-toggle-sw"></span></label>
                <label class="menu-toggle-row"><span class="menu-toggle-label">의제 등록</span><input type="checkbox" id="mv-apply-agenda" class="menu-toggle-cb"><span class="menu-toggle-sw"></span></label>
                <label class="menu-toggle-row"><span class="menu-toggle-label">문의하기</span><input type="checkbox" id="mv-apply-contact" class="menu-toggle-cb"><span class="menu-toggle-sw"></span></label>
              </div>
              <!-- NEWSLETTER -->
              <p class="text-xs font-bold text-orange-700 mt-3 mb-1"><i class="fas fa-newspaper mr-1"></i>NEWSLETTER</p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label class="menu-toggle-row"><span class="menu-toggle-label">소식지 메뉴</span><input type="checkbox" id="mv-newsletter" class="menu-toggle-cb"><span class="menu-toggle-sw"></span></label>
              </div>
            </div>
          </div>

          <div id="settings-msg" class="hidden text-sm p-3 rounded-xl"></div>
          <button onclick="saveSettings()" class="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-xl transition-all">
            <i class="fas fa-save mr-2"></i>설정 저장하기
          </button>
        </div>
      </section>

      <!-- 소식지(뉴스레터) 관리 -->
      <section id="sec-newsletter" class="hidden">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-black text-gray-800">소식지 관리</h2>
          <button onclick="openNlEditor()" class="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm">
            <i class="fas fa-plus"></i> 새 소식지
          </button>
        </div>

        <!-- 목록 -->
        <div id="nl-list" class="space-y-3">
          <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>불러오는 중...</div>
        </div>

        <!-- 에디터 모달 -->
        <div id="nl-modal" class="hidden fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 pb-8" style="background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);overflow-y:auto">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between px-6 py-4 border-b">
              <h3 id="nl-modal-title" class="text-lg font-black text-gray-800">새 소식지 작성</h3>
              <button onclick="closeNlModal()" class="text-gray-400 hover:text-gray-600 text-xl"><i class="fas fa-times"></i></button>
            </div>
            <div class="p-6 space-y-4">
              <input type="hidden" id="nl-edit-id">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">제목 <span class="text-red-400">*</span></label>
                <input type="text" id="nl-title" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all" placeholder="소식지 제목">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">커버 이미지 URL</label>
                <input type="url" id="nl-cover" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="https://example.com/image.jpg">
                <div id="nl-cover-preview" class="mt-2 hidden"><img id="nl-cover-img" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="h-28 rounded-xl object-contain border bg-gray-50"></div>
              </div>
              <div class="bg-red-50 border border-red-100 rounded-xl p-4">
                <label class="block text-sm font-semibold text-gray-700 mb-1">
                  <i class="fas fa-file-pdf text-red-500 mr-1"></i>PDF 링크 (구글 드라이브)
                </label>
                <p class="text-xs text-gray-400 mb-2">구글 드라이브 공유 링크를 붙여넣으세요. 클릭 시 인라인 PDF 뷰어로 바로 표시됩니다.</p>
                <input type="url" id="nl-pdf-url" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-white"
                  placeholder="https://drive.google.com/file/d/…/view?usp=sharing">
                <p class="text-xs text-gray-400 mt-1.5">
                  <i class="fas fa-info-circle text-blue-400 mr-1"></i>
                  구글 드라이브에서 파일 우클릭 → 공유 → 링크 복사 → 링크 공개 설정 확인 필요
                </p>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">본문 내용 <span class="text-gray-400 font-normal text-xs">(PDF가 있을 경우 선택 사항)</span></label>
                <p class="text-xs text-gray-400 mb-1">## 제목, ### 소제목, &gt; 인용, - 목록, 이미지 URL 단독 입력, 빈 줄로 단락 구분</p>
                <textarea id="nl-content" rows="8" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-mono resize-y" placeholder="내용을 입력하세요...&#10;&#10;## 소제목&#10;내용..."></textarea>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">공개 상태</label>
                <select id="nl-status" class="border-2 border-gray-200 rounded-xl px-4 py-2 text-sm">
                  <option value="published">공개</option>
                  <option value="draft">비공개(초안)</option>
                </select>
              </div>
              <div id="nl-msg" class="hidden text-sm p-3 rounded-xl"></div>
            </div>
            <div class="px-6 pb-6 flex gap-3">
              <button onclick="closeNlModal()" class="flex-1 border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-semibold py-3 rounded-xl transition-all text-sm">취소</button>
              <button onclick="saveNewsletter()" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all text-sm">
                <i class="fas fa-save mr-1"></i> 저장하기
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 금칙어 관리 -->
      <section id="sec-banned" class="hidden">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-black text-gray-800">금칙어 관리</h2>
        </div>
        <div class="bg-white rounded-xl shadow-sm border p-6 mb-4">
          <p class="text-sm text-gray-500 mb-4">
            <i class="fas fa-info-circle text-blue-400 mr-1"></i>
            등록된 금칙어는 의제 등록 시 자동으로 <strong>*</strong>로 치환됩니다. 단어를 추가·삭제하여 실시간으로 관리하세요.
          </p>
          <div class="flex gap-2 mb-5">
            <input type="text" id="bw-input" placeholder="추가할 금칙어 입력..."
              maxlength="50"
              class="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm transition-all"
              onkeydown="if(event.key==='Enter')addBannedWord()">
            <button onclick="addBannedWord()"
              class="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap">
              <i class="fas fa-plus mr-1"></i>추가
            </button>
          </div>
          <div id="bw-msg" class="hidden text-sm p-3 rounded-xl mb-3"></div>
          <div id="bw-list" class="min-h-[60px]">
            <div class="text-center py-6 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>불러오는 중...</div>
          </div>
          <p class="text-xs text-gray-400 mt-3">총 <span id="bw-count" class="font-bold text-gray-600">0</span>개의 금칙어가 등록되어 있습니다.</p>
        </div>
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p class="font-bold mb-1"><i class="fas fa-exclamation-triangle mr-1"></i>사용 안내</p>
          <ul class="list-disc list-inside space-y-1 text-xs text-amber-700">
            <li>금칙어는 대소문자를 구분하지 않습니다.</li>
            <li>의제 내용에 포함된 금칙어는 등록 시 자동으로 <strong>*</strong>로 치환됩니다.</li>
            <li>기존에 등록된 의제에는 소급 적용되지 않습니다.</li>
            <li>너무 짧은 단어(1자)는 오탐이 생길 수 있으니 주의하세요.</li>
          </ul>
        </div>
      </section>

      <!-- 계정 설정 -->
      <section id="sec-account" class="hidden">
        <h2 class="text-2xl font-black text-gray-800 mb-6">계정 설정</h2>
        <div class="bg-white rounded-xl shadow-sm border p-6 max-w-md">
          <h3 class="font-bold text-gray-700 mb-4"><i class="fas fa-key text-yellow-500 mr-2"></i>비밀번호 변경</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">현재 비밀번호</label>
              <input type="password" id="curr-pw" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">새 비밀번호 (최소 6자)</label>
              <input type="password" id="new-pw" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">새 비밀번호 확인</label>
              <input type="password" id="new-pw-confirm" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm">
            </div>
            <div id="pw-msg" class="hidden text-sm p-3 rounded-xl"></div>
            <button onclick="changePassword()" class="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition-all">
              <i class="fas fa-key mr-2"></i>비밀번호 변경
            </button>
          </div>
        </div>
      </section>

    </div>
  </main>
</div>

<!-- 수정 모달 -->
<div id="edit-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4">
  <div class="modal-backdrop absolute inset-0" onclick="closeEditModal()"></div>
  <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 p-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-bold text-gray-800"><i class="fas fa-edit text-green-600 mr-2"></i>의제 수정</h3>
      <button onclick="closeEditModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button>
    </div>
    <input type="hidden" id="edit-id">
    <textarea id="edit-content" rows="5" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm transition-all resize-none mb-4"></textarea>
    <div id="edit-msg" class="hidden text-sm p-3 rounded-xl mb-3"></div>
    <div class="flex gap-3">
      <button onclick="closeEditModal()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl">취소</button>
      <button onclick="saveEdit()" class="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl">저장</button>
    </div>
  </div>
</div>

<!-- 상세 모달 -->
<div id="detail-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4">
  <div class="modal-backdrop absolute inset-0" onclick="document.getElementById('detail-modal').classList.add('hidden')"></div>
  <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 p-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-bold text-gray-800"><i class="fas fa-info-circle text-blue-600 mr-2"></i>의제 상세</h3>
      <button onclick="document.getElementById('detail-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button>
    </div>
    <div id="detail-content" class="space-y-3 text-sm"></div>
  </div>
</div>

<script>
let authToken = localStorage.getItem('eco_admin_token')
let currentPage = 1

document.addEventListener('DOMContentLoaded', () => {
  if (authToken) showAdminMain()

  document.getElementById('s-hero-image')?.addEventListener('input', function() {
    const url = this.value.trim()
    const img = document.getElementById('img-preview')
    const wrap = document.getElementById('img-preview-wrap')
    if (url) { img.src=url; wrap.classList.remove('hidden') }
    else wrap.classList.add('hidden')
  })
})

async function doLogin() {
  const username = document.getElementById('login-username').value.trim()
  const password = document.getElementById('login-password').value
  const errEl = document.getElementById('login-error')
  const btn = document.getElementById('login-btn')
  if (!username||!password) { errEl.textContent='아이디와 비밀번호를 입력해 주세요.'; errEl.classList.remove('hidden'); return }
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin mr-2"></i>로그인 중...'
  try {
    const res = await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})})
    const json = await res.json()
    if (json.success) {
      authToken=json.token
      localStorage.setItem('eco_admin_token',authToken)
      localStorage.setItem('eco_admin_user',json.username)
      errEl.classList.add('hidden')
      showAdminMain()
    } else { errEl.textContent=json.error||'로그인 실패'; errEl.classList.remove('hidden') }
  } catch(e) { errEl.textContent='네트워크 오류'; errEl.classList.remove('hidden') }
  finally { btn.disabled=false; btn.innerHTML='<i class="fas fa-sign-in-alt mr-2"></i>로그인' }
}

function doLogout() {
  localStorage.removeItem('eco_admin_token'); localStorage.removeItem('eco_admin_user')
  authToken=null
  document.getElementById('admin-main').classList.add('hidden')
  document.getElementById('login-screen').classList.remove('hidden')
}

function showAdminMain() {
  document.getElementById('login-screen').classList.add('hidden')
  document.getElementById('admin-main').classList.remove('hidden')
  document.getElementById('admin-user-info').textContent=(localStorage.getItem('eco_admin_user')||'admin')+' 님 환영합니다'
  loadStats(); showSection('dashboard')
}

function showSection(name) {
  ['dashboard','agendas','settings','newsletter','banned','account'].forEach(s => {
    document.getElementById('sec-'+s).classList.toggle('hidden',s!==name)
    document.getElementById('nav-'+s).classList.toggle('active',s===name)
  })
  if (name==='agendas') loadAdminAgendas(1)
  if (name==='settings') loadSettings()
  if (name==='dashboard') loadStats()
  if (name==='newsletter') loadNewsletters()
  if (name==='banned') loadBannedWords()
}

async function loadStats() {
  try {
    const res = await aFetch('/api/admin/stats')
    const json = await res.json()
    if (json.success) {
      document.getElementById('stat-total').textContent=json.data.total
      document.getElementById('stat-visible').textContent=json.data.visible
      document.getElementById('stat-hidden').textContent=json.data.hidden
      document.getElementById('stat-today').textContent=json.data.today
    }
  } catch(e){}
}

async function loadAdminAgendas(page=1) {
  currentPage=page
  const status=document.getElementById('filter-status').value
  const search=document.getElementById('search-keyword').value.trim()
  const tbody=document.getElementById('agenda-table-body')
  tbody.innerHTML='<tr><td colspan="8" class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>불러오는 중...</td></tr>'
  try {
    const params=new URLSearchParams({page:String(page),status})
    if(search) params.set('search',search)
    const res=await aFetch('/api/admin/agendas?'+params)
    const json=await res.json()
    if(!json.success) throw new Error()
    const {data,total,totalPages}=json
    document.getElementById('page-info').textContent=\`총 \${total}건 / \${page}/\${totalPages} 페이지\`
    if(!data.length){tbody.innerHTML='<tr><td colspan="8" class="text-center py-8 text-gray-400">검색 결과가 없습니다.</td></tr>';return}
    tbody.innerHTML=data.map(a=>{
      const sc=a.status==='visible'?'status-visible':a.status==='hidden'?'status-hidden':'status-deleted'
      const sl=a.status==='visible'?'공개':a.status==='hidden'?'숨김':'삭제'
      const dt=new Date(a.created_at).toLocaleDateString('ko-KR',{month:'2-digit',day:'2-digit'})
      const short=a.content.length>40?a.content.slice(0,40)+'...':a.content
      return \`<tr class="table-row border-b cursor-pointer" onclick="showDetail(\${JSON.stringify(a).replace(/"/g,'&quot;')})">
        <td class="px-4 py-3 text-gray-400 text-xs">\${a.id}</td>
        <td class="px-4 py-3 text-gray-700 max-w-xs">\${esc(short)}</td>
        <td class="px-4 py-3 text-gray-600 hidden md:table-cell">\${esc(a.name)}</td>
        <td class="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">\${esc(maskPh(a.phone))}</td>
        <td class="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">\${esc(a.district)}</td>
        <td class="px-4 py-3"><span class="px-2 py-1 rounded-full text-xs font-semibold \${sc}">\${sl}</span></td>
        <td class="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">\${dt}</td>
        <td class="px-4 py-3" onclick="event.stopPropagation()">
          <div class="flex gap-1 justify-center">
            <button onclick="openEdit(\${a.id},\${JSON.stringify(a.content).replace(/"/g,'&quot;')})" class="bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs px-2 py-1 rounded-lg" title="수정"><i class="fas fa-edit"></i></button>
            \${a.status!=='visible'?\`<button onclick="setStatus(\${a.id},'visible')" class="bg-green-100 hover:bg-green-200 text-green-700 text-xs px-2 py-1 rounded-lg" title="공개"><i class="fas fa-eye"></i></button>\`:''}
            \${a.status!=='hidden'?\`<button onclick="setStatus(\${a.id},'hidden')" class="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs px-2 py-1 rounded-lg" title="숨기기"><i class="fas fa-eye-slash"></i></button>\`:''}
            <button onclick="if(confirm('정말 삭제하시겠습니까?'))setStatus(\${a.id},'deleted')" class="bg-red-100 hover:bg-red-200 text-red-700 text-xs px-2 py-1 rounded-lg" title="삭제"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>\`
    }).join('')
    let pg=''
    if(page>1) pg+=\`<button onclick="loadAdminAgendas(\${page-1})" class="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"><i class="fas fa-chevron-left"></i></button>\`
    const sp=Math.max(1,page-2),ep=Math.min(totalPages,page+2)
    for(let p=sp;p<=ep;p++) pg+=\`<button onclick="loadAdminAgendas(\${p})" class="px-3 py-1 rounded-lg text-sm \${p===page?'bg-green-700 text-white':'bg-gray-100 hover:bg-gray-200'}">\${p}</button>\`
    if(page<totalPages) pg+=\`<button onclick="loadAdminAgendas(\${page+1})" class="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"><i class="fas fa-chevron-right"></i></button>\`
    document.getElementById('pagination').innerHTML=pg
  } catch(e){tbody.innerHTML='<tr><td colspan="8" class="text-center py-8 text-red-400">데이터를 불러올 수 없습니다.</td></tr>'}
}

async function setStatus(id,status) {
  try {
    const res=await aFetch(\`/api/admin/agendas/\${id}\`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})})
    const json=await res.json()
    if(json.success){loadAdminAgendas(currentPage);loadStats()}
    else alert(json.error||'오류 발생')
  } catch(e){alert('오류가 발생했습니다.')}
}

function openEdit(id,content){
  document.getElementById('edit-id').value=id
  document.getElementById('edit-content').value=content
  document.getElementById('edit-msg').classList.add('hidden')
  document.getElementById('edit-modal').classList.remove('hidden')
}
function closeEditModal(){document.getElementById('edit-modal').classList.add('hidden')}
async function saveEdit(){
  const id=document.getElementById('edit-id').value
  const content=document.getElementById('edit-content').value.trim()
  const msgEl=document.getElementById('edit-msg')
  if(!content){msgEl.textContent='내용을 입력해 주세요.';msgEl.className='text-sm p-3 rounded-xl bg-red-50 text-red-600';msgEl.classList.remove('hidden');return}
  try {
    const res=await aFetch(\`/api/admin/agendas/\${id}\`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({content})})
    const json=await res.json()
    if(json.success){msgEl.textContent='수정되었습니다.';msgEl.className='text-sm p-3 rounded-xl bg-green-50 text-green-700';msgEl.classList.remove('hidden');setTimeout(()=>{closeEditModal();loadAdminAgendas(currentPage)},1000)}
    else{msgEl.textContent=json.error||'오류';msgEl.className='text-sm p-3 rounded-xl bg-red-50 text-red-600';msgEl.classList.remove('hidden')}
  } catch(e){msgEl.textContent='오류가 발생했습니다.';msgEl.classList.remove('hidden')}
}

function showDetail(a){
  document.getElementById('detail-content').innerHTML=\`
    <div class="bg-gray-50 rounded-xl p-4"><p class="text-gray-400 text-xs mb-1">의제 내용</p><p class="text-gray-800 leading-relaxed">\${esc(a.content)}</p></div>
    <div class="grid grid-cols-2 gap-3">
      <div class="bg-gray-50 rounded-xl p-3"><p class="text-gray-400 text-xs mb-0.5">이름</p><p class="font-semibold">\${esc(a.name)}</p></div>
      <div class="bg-gray-50 rounded-xl p-3"><p class="text-gray-400 text-xs mb-0.5">연락처</p><p class="font-semibold">\${esc(a.phone)}</p></div>
      <div class="bg-gray-50 rounded-xl p-3"><p class="text-gray-400 text-xs mb-0.5">이메일</p><p class="font-semibold">\${esc(a.email||'-')}</p></div>
      <div class="bg-gray-50 rounded-xl p-3"><p class="text-gray-400 text-xs mb-0.5">거주 동</p><p class="font-semibold">\${esc(a.district)}</p></div>
      <div class="bg-gray-50 rounded-xl p-3"><p class="text-gray-400 text-xs mb-0.5">개인정보 동의</p><p class="font-semibold">\${a.privacy_agreed?'✅ 동의':'❌ 미동의'}</p></div>
      <div class="bg-gray-50 rounded-xl p-3"><p class="text-gray-400 text-xs mb-0.5">등록일시</p><p class="font-semibold text-xs">\${new Date(a.created_at).toLocaleString('ko-KR')}</p></div>
    </div>\`
  document.getElementById('detail-modal').classList.remove('hidden')
}

async function exportCSV(){
  try {
    const res=await aFetch('/api/admin/export')
    if(!res.ok) throw new Error()
    const blob=await res.blob()
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a'); a.href=url; a.download='agenda_'+new Date().toISOString().slice(0,10)+'.csv'; a.click()
    URL.revokeObjectURL(url)
  } catch(e){alert('다운로드 중 오류가 발생했습니다.')}
}

async function loadSettings(){
  try {
    const res=await fetch('/api/settings')
    const json=await res.json()
    if(json.success){
      const s=json.data
      document.getElementById('s-main-title').value=s.main_title||''
      document.getElementById('s-main-subtitle').value=s.main_subtitle||''
      document.getElementById('s-usage-guide').value=s.usage_guide||''
      document.getElementById('s-forum-desc').value=s.forum_description||''
      document.getElementById('s-hero-image').value=s.hero_image||''
      document.getElementById('s-footer-blog').value=s.footer_blog||''
      document.getElementById('s-footer-facebook').value=s.footer_facebook||''
      document.getElementById('s-footer-instagram').value=s.footer_instagram||''
      document.getElementById('s-footer-phone').value=s.footer_phone||''
      document.getElementById('s-footer-email').value=s.footer_email||''
      if(s.hero_image){document.getElementById('img-preview').src=s.hero_image;document.getElementById('img-preview-wrap').classList.remove('hidden')}
      // 메뉴 표시/숨김 토글
      const mvMap = {
        'mv-about-eco':'menu_visible_about_eco','mv-about-philosophy':'menu_visible_about_philosophy',
        'mv-about-org':'menu_visible_about_org','mv-prog-2025':'menu_visible_prog_2025',
        'mv-prog-2026':'menu_visible_prog_2026','mv-prog-forum':'menu_visible_prog_forum',
        'mv-apply-guide':'menu_visible_apply_guide','mv-apply-agenda':'menu_visible_apply_agenda',
        'mv-apply-contact':'menu_visible_apply_contact','mv-newsletter':'menu_visible_newsletter'
      }
      Object.entries(mvMap).forEach(([elId, key]) => {
        const el = document.getElementById(elId)
        if (el) el.checked = s[key] !== '0'
      })
      // 메뉴 콘텐츠 & 이미지
      document.getElementById('s-about-eco').value=s.about_eco||''
      document.getElementById('s-about-eco-img').value=s.about_eco_img||''
      document.getElementById('s-about-philosophy').value=s.about_philosophy||''
      document.getElementById('s-about-philosophy-img').value=s.about_philosophy_img||''
      document.getElementById('s-about-org').value=s.about_org||''
      document.getElementById('s-about-org-img').value=s.about_org_img||''
      document.getElementById('s-prog-2025').value=s.prog_2025||''
      document.getElementById('s-prog-2025-img').value=s.prog_2025_img||''
      document.getElementById('s-prog-2026').value=s.prog_2026||''
      document.getElementById('s-prog-2026-img').value=s.prog_2026_img||''
      document.getElementById('s-prog-forum').value=s.prog_forum||''
      document.getElementById('s-prog-forum-img').value=s.prog_forum_img||''
      document.getElementById('s-apply-guide').value=s.apply_guide||''
      document.getElementById('s-apply-guide-img').value=s.apply_guide_img||''
      document.getElementById('s-apply-agenda').value=s.apply_agenda||''
      document.getElementById('s-apply-agenda-img').value=s.apply_agenda_img||''
      document.getElementById('s-apply-contact').value=s.apply_contact||''
      document.getElementById('s-apply-contact-img').value=s.apply_contact_img||''
    }
  } catch(e){}
}

async function saveSettings(){
  const settings={
    main_title:document.getElementById('s-main-title').value,
    main_subtitle:document.getElementById('s-main-subtitle').value,
    usage_guide:document.getElementById('s-usage-guide').value,
    forum_description:document.getElementById('s-forum-desc').value,
    hero_image:document.getElementById('s-hero-image').value,
    footer_blog:document.getElementById('s-footer-blog').value,
    footer_facebook:document.getElementById('s-footer-facebook').value,
    footer_instagram:document.getElementById('s-footer-instagram').value,
    footer_phone:document.getElementById('s-footer-phone').value,
    footer_email:document.getElementById('s-footer-email').value,
    // 메뉴 표시/숨김
    menu_visible_about_eco: (document.getElementById('mv-about-eco')).checked ? '1' : '0',
    menu_visible_about_philosophy: (document.getElementById('mv-about-philosophy')).checked ? '1' : '0',
    menu_visible_about_org: (document.getElementById('mv-about-org')).checked ? '1' : '0',
    menu_visible_prog_2025: (document.getElementById('mv-prog-2025')).checked ? '1' : '0',
    menu_visible_prog_2026: (document.getElementById('mv-prog-2026')).checked ? '1' : '0',
    menu_visible_prog_forum: (document.getElementById('mv-prog-forum')).checked ? '1' : '0',
    menu_visible_apply_guide: (document.getElementById('mv-apply-guide')).checked ? '1' : '0',
    menu_visible_apply_agenda: (document.getElementById('mv-apply-agenda')).checked ? '1' : '0',
    menu_visible_apply_contact: (document.getElementById('mv-apply-contact')).checked ? '1' : '0',
    menu_visible_newsletter: (document.getElementById('mv-newsletter')).checked ? '1' : '0',
    // 메뉴 콘텐츠 & 이미지
    about_eco:document.getElementById('s-about-eco').value,
    about_eco_img:document.getElementById('s-about-eco-img').value,
    about_philosophy:document.getElementById('s-about-philosophy').value,
    about_philosophy_img:document.getElementById('s-about-philosophy-img').value,
    about_org:document.getElementById('s-about-org').value,
    about_org_img:document.getElementById('s-about-org-img').value,
    prog_2025:document.getElementById('s-prog-2025').value,
    prog_2025_img:document.getElementById('s-prog-2025-img').value,
    prog_2026:document.getElementById('s-prog-2026').value,
    prog_2026_img:document.getElementById('s-prog-2026-img').value,
    prog_forum:document.getElementById('s-prog-forum').value,
    prog_forum_img:document.getElementById('s-prog-forum-img').value,
    apply_guide:document.getElementById('s-apply-guide').value,
    apply_guide_img:document.getElementById('s-apply-guide-img').value,
    apply_agenda:document.getElementById('s-apply-agenda').value,
    apply_agenda_img:document.getElementById('s-apply-agenda-img').value,
    apply_contact:document.getElementById('s-apply-contact').value,
    apply_contact_img:document.getElementById('s-apply-contact-img').value,
  }
  const msgEl=document.getElementById('settings-msg')
  try {
    const res=await aFetch('/api/admin/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(settings)})
    const json=await res.json()
    if(json.success){msgEl.textContent='✅ 저장되었습니다. 페이지 새로고침 후 반영됩니다.';msgEl.className='bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-xl'}
    else{msgEl.textContent='❌ '+( json.error||'저장 실패');msgEl.className='bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl'}
  } catch(e){msgEl.textContent='❌ 네트워크 오류';msgEl.className='bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl'}
  msgEl.classList.remove('hidden')
  setTimeout(()=>msgEl.classList.add('hidden'),3000)
}

async function changePassword(){
  const curr=document.getElementById('curr-pw').value
  const next=document.getElementById('new-pw').value
  const confirm=document.getElementById('new-pw-confirm').value
  const msgEl=document.getElementById('pw-msg')
  const show=(t,err)=>{msgEl.textContent=t;msgEl.className=\`text-sm p-3 rounded-xl \${err?'bg-red-50 text-red-600':'bg-green-50 text-green-700'}\`;msgEl.classList.remove('hidden')}
  if(!curr||!next||!confirm) return show('모든 항목을 입력해 주세요.',true)
  if(next!==confirm) return show('새 비밀번호가 일치하지 않습니다.',true)
  if(next.length<6) return show('새 비밀번호는 6자 이상이어야 합니다.',true)
  try {
    const res=await aFetch('/api/admin/change-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({current_password:curr,new_password:next})})
    const json=await res.json()
    if(json.success){show('✅ 비밀번호가 변경되었습니다.',false);document.getElementById('curr-pw').value='';document.getElementById('new-pw').value='';document.getElementById('new-pw-confirm').value=''}
    else show(json.error||'변경 실패',true)
  } catch(e){show('오류가 발생했습니다.',true)}
}

function aFetch(url,options={}){
  return fetch(url,{...options,headers:{...(options.headers||{}),'Authorization':'Bearer '+authToken}})
}
function esc(t){if(!t)return'';const d=document.createElement('div');d.appendChild(document.createTextNode(String(t)));return d.innerHTML}
function maskPh(p){if(!p)return'-';return p.replace(/(\d{3})\d{3,4}(\d{4})/,'$1****$2')}

// ==================== 뉴스레터 관리 ====================
async function loadNewsletters() {
  const container = document.getElementById('nl-list')
  container.innerHTML = '<div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>불러오는 중...</div>'
  try {
    const res = await aFetch('/api/admin/newsletters')
    const json = await res.json()
    if (!json.success) throw new Error()
    const list = json.data
    if (!list.length) {
      container.innerHTML = \`<div class="text-center py-14 text-gray-400">
        <i class="fas fa-newspaper text-5xl text-green-200 mb-4 block"></i>
        <p class="font-semibold">등록된 소식지가 없습니다.</p>
        <p class="text-sm mt-1">위의 "새 소식지" 버튼으로 작성해 보세요.</p>
      </div>\`
      return
    }
    container.innerHTML = list.map(n => {
      const date = new Date(n.created_at).toLocaleDateString('ko-KR',{year:'numeric',month:'short',day:'numeric'})
      const isDraft = n.status === 'draft'
      const summary = n.summary ? esc(n.summary).slice(0,60)+(n.summary.length>60?'…':'') : ''
      const coverHtml = n.cover_image
        ? '<img src="' + n.cover_image + '" class="w-full h-full object-contain bg-gray-50">'
        : '<div class="w-full h-full bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center"><i class="fas fa-newspaper text-white text-xl opacity-60"></i></div>'
      const statusClass = isDraft ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
      const statusLabel = isDraft ? '초안' : '공개'
      const summaryHtml = summary ? '<p class="text-xs text-gray-400 mt-0.5 truncate">' + summary + '</p>' : ''
      const pdfBadge = n.pdf_url ? '<span class="text-xs bg-red-50 text-red-500 font-semibold px-1.5 py-0.5 rounded-full ml-1"><i class="fas fa-file-pdf mr-0.5"></i>PDF</span>' : ''
      return \`<div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
        <div class="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
          \${coverHtml}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full \${statusClass}">\${statusLabel}</span>
            \${pdfBadge}
            <span class="text-xs text-gray-400">\${date}</span>
          </div>
          <p class="font-bold text-gray-800 text-sm truncate">\${esc(n.title)}</p>
          \${summaryHtml}
        </div>
        <div class="flex flex-col gap-2 flex-shrink-0">
          <a href="/newsletter/\${n.id}" target="_blank" class="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-semibold transition-all text-center"><i class="fas fa-eye mr-1"></i>보기</a>
          <button onclick="editNewsletter(\${n.id})" class="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-semibold transition-all"><i class="fas fa-edit mr-1"></i>수정</button>
          <button onclick="deleteNewsletter(\${n.id}, '\${esc(n.title)}')" class="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-semibold transition-all"><i class="fas fa-trash mr-1"></i>삭제</button>
        </div>
      </div>\`
    }).join('')
  } catch(e) {
    container.innerHTML = '<div class="text-center py-10 text-red-400">불러오기 실패</div>'
  }
}

function openNlEditor() {
  document.getElementById('nl-modal-title').textContent = '새 소식지 작성';
  (document.getElementById('nl-edit-id')).value = '';
  (document.getElementById('nl-title')).value = '';
  (document.getElementById('nl-cover')).value = '';
  (document.getElementById('nl-pdf-url')).value = '';
  (document.getElementById('nl-content')).value = '';
  (document.getElementById('nl-status')).value = 'published';
  document.getElementById('nl-cover-preview').classList.add('hidden')
  document.getElementById('nl-msg').classList.add('hidden')
  document.getElementById('nl-modal').classList.remove('hidden')
  document.body.style.overflow = 'hidden'
}

async function editNewsletter(id) {
  try {
    const res = await aFetch(\`/api/admin/newsletters/\${id}\`)
    const json = await res.json()
    if (!json.success) return
    const n = json.data
    document.getElementById('nl-modal-title').textContent = '소식지 수정';
    (document.getElementById('nl-edit-id')).value = String(n.id);
    (document.getElementById('nl-title')).value = n.title || '';
    (document.getElementById('nl-cover')).value = n.cover_image || '';
    (document.getElementById('nl-pdf-url')).value = n.pdf_url || '';
    (document.getElementById('nl-content')).value = n.content || '';
    (document.getElementById('nl-status')).value = n.status || 'published'
    const prev = document.getElementById('nl-cover-preview')
    const prevImg = document.getElementById('nl-cover-img')
    if (n.cover_image) { prevImg.src = n.cover_image; prev.classList.remove('hidden') }
    else prev.classList.add('hidden')
    document.getElementById('nl-msg').classList.add('hidden')
    document.getElementById('nl-modal').classList.remove('hidden')
    document.body.style.overflow = 'hidden'
  } catch(e) { alert('불러오기 실패') }
}

function closeNlModal() {
  document.getElementById('nl-modal').classList.add('hidden')
  document.body.style.overflow = ''
}

async function saveNewsletter() {
  const id = (document.getElementById('nl-edit-id')).value
  const title = (document.getElementById('nl-title')).value.trim()
  const cover_image = (document.getElementById('nl-cover')).value.trim()
  const pdf_url = (document.getElementById('nl-pdf-url')).value.trim()
  const content = (document.getElementById('nl-content')).value.trim()
  const status = (document.getElementById('nl-status')).value
  const msgEl = document.getElementById('nl-msg')
  if (!title) { msgEl.textContent = '제목을 입력해 주세요.'; msgEl.className = 'bg-red-50 text-red-600 text-sm p-3 rounded-xl'; msgEl.classList.remove('hidden'); return }
  try {
    const method = id ? 'PUT' : 'POST'
    const url = id ? \`/api/admin/newsletters/\${id}\` : '/api/admin/newsletters'
    const res = await aFetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ title, summary: '', cover_image, pdf_url, content, status }) })
    const json = await res.json()
    if (json.success) {
      msgEl.textContent = '✅ 저장되었습니다.'; msgEl.className = 'bg-green-50 text-green-700 text-sm p-3 rounded-xl'; msgEl.classList.remove('hidden')
      setTimeout(() => { closeNlModal(); loadNewsletters() }, 800)
    } else {
      msgEl.textContent = '❌ ' + (json.error || '저장 실패'); msgEl.className = 'bg-red-50 text-red-600 text-sm p-3 rounded-xl'; msgEl.classList.remove('hidden')
    }
  } catch(e) { msgEl.textContent = '❌ 오류 발생'; msgEl.className = 'bg-red-50 text-red-600 text-sm p-3 rounded-xl'; msgEl.classList.remove('hidden') }
}

async function deleteNewsletter(id, title) {
  if (!confirm(\`"\${title}" 을(를) 삭제하시겠습니까?\`)) return
  try {
    const res = await aFetch(\`/api/admin/newsletters/\${id}\`, { method: 'DELETE' })
    const json = await res.json()
    if (json.success) loadNewsletters()
    else alert('삭제 실패')
  } catch(e) { alert('오류 발생') }
}

// 커버 이미지 미리보기
document.addEventListener('DOMContentLoaded', () => {
  const coverInput = document.getElementById('nl-cover')
  if (coverInput) {
    coverInput.addEventListener('input', () => {
      const url = coverInput.value.trim()
      const prev = document.getElementById('nl-cover-preview')
      const img = document.getElementById('nl-cover-img')
      if (url) { img.src = url; prev.classList.remove('hidden') }
      else prev.classList.add('hidden')
    })
  }
})

// ── 금칙어 관리 ─────────────────────────────────────────────────
let bannedWords = []

async function loadBannedWords() {
  const listEl = document.getElementById('bw-list')
  const countEl = document.getElementById('bw-count')
  listEl.innerHTML = '<div class="text-center py-6 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>불러오는 중...</div>'
  try {
    const res = await aFetch('/api/admin/banned-words')
    const json = await res.json()
    if (!json.success) { listEl.innerHTML = '<p class="text-center text-red-400 py-4">불러오기 실패</p>'; return }
    bannedWords = json.data
    countEl.textContent = bannedWords.length
    renderBannedWords()
  } catch(e) {
    listEl.innerHTML = '<p class="text-center text-red-400 py-4">오류가 발생했습니다.</p>'
  }
}

function renderBannedWords() {
  const listEl = document.getElementById('bw-list')
  if (bannedWords.length === 0) {
    listEl.innerHTML = '<p class="text-center text-gray-400 py-6"><i class="fas fa-check-circle text-green-400 mr-2"></i>등록된 금칙어가 없습니다.</p>'
    return
  }
  listEl.innerHTML = '<div class="flex flex-wrap gap-2">' +
    bannedWords.map(w => \`
      <div class="group flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 rounded-full px-3 py-1.5 text-sm font-medium">
        <span id="bw-text-\${w.id}" class="cursor-default" ondblclick="startEditBannedWord(\${w.id})">\${esc(w.word)}</span>
        <input type="text" id="bw-edit-\${w.id}" class="hidden border border-red-300 rounded px-1 text-xs w-20"
          value="\${esc(w.word)}"
          onblur="cancelEditBannedWord(\${w.id})"
          onkeydown="if(event.key==='Enter')saveEditBannedWord(\${w.id});if(event.key==='Escape')cancelEditBannedWord(\${w.id})">
        <button onclick="deleteBannedWord(\${w.id}, '\${esc(w.word)}')"
          title="삭제"
          class="text-red-400 hover:text-red-600 transition-colors ml-0.5">
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>
    \`).join('') +
  '</div>'
}

function showBwMsg(msg, ok=false) {
  const el = document.getElementById('bw-msg')
  el.textContent = msg
  el.className = \`text-sm p-3 rounded-xl mb-3 \${ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}\`
  el.classList.remove('hidden')
  setTimeout(() => el.classList.add('hidden'), 3000)
}

async function addBannedWord() {
  const input = document.getElementById('bw-input')
  const word = input.value.trim()
  if (!word) { showBwMsg('단어를 입력해 주세요.'); return }
  try {
    const res = await aFetch('/api/admin/banned-words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word })
    })
    const json = await res.json()
    if (json.success) {
      input.value = ''
      showBwMsg(\`"\${esc(word)}" 단어가 추가되었습니다.\`, true)
      await loadBannedWords()
    } else {
      showBwMsg(json.error || '추가 실패')
    }
  } catch(e) { showBwMsg('오류가 발생했습니다.') }
}

async function deleteBannedWord(id, word) {
  if (!confirm(\`"\${word}" 단어를 삭제하시겠습니까?\`)) return
  try {
    const res = await aFetch(\`/api/admin/banned-words/\${id}\`, { method: 'DELETE' })
    const json = await res.json()
    if (json.success) {
      showBwMsg(\`"\${esc(word)}" 단어가 삭제되었습니다.\`, true)
      await loadBannedWords()
    } else {
      showBwMsg(json.error || '삭제 실패')
    }
  } catch(e) { showBwMsg('오류가 발생했습니다.') }
}

function startEditBannedWord(id) {
  const textEl = document.getElementById('bw-text-' + id)
  const inputEl = document.getElementById('bw-edit-' + id)
  textEl.classList.add('hidden')
  inputEl.classList.remove('hidden')
  inputEl.focus()
  inputEl.select()
}

function cancelEditBannedWord(id) {
  const item = bannedWords.find(w => w.id === id)
  const textEl = document.getElementById('bw-text-' + id)
  const inputEl = document.getElementById('bw-edit-' + id)
  if (item) inputEl.value = item.word
  textEl.classList.remove('hidden')
  inputEl.classList.add('hidden')
}

async function saveEditBannedWord(id) {
  const inputEl = document.getElementById('bw-edit-' + id)
  const newWord = inputEl.value.trim()
  if (!newWord) { cancelEditBannedWord(id); return }
  try {
    const res = await aFetch(\`/api/admin/banned-words/\${id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: newWord })
    })
    const json = await res.json()
    if (json.success) {
      showBwMsg('수정되었습니다.', true)
      await loadBannedWords()
    } else {
      showBwMsg(json.error || '수정 실패')
      cancelEditBannedWord(id)
    }
  } catch(e) { showBwMsg('오류가 발생했습니다.'); cancelEditBannedWord(id) }
}
</script>
</body>
</html>`

  return c.html(html)
}
