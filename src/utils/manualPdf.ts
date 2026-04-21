import PDFDocument from 'pdfkit'
import path from 'path'

const FONT_DIR = path.join(process.cwd(), 'public', 'fonts')
const FONT_REGULAR = path.join(FONT_DIR, 'NanumGothic.ttf')
const FONT_BOLD    = path.join(FONT_DIR, 'NanumGothicBold.ttf')

// ── 색상 팔레트 ──────────────────────────────────────────
const COLOR = {
  green:      '#166534',
  greenLight: '#16a34a',
  greenBg:    '#f0fdf4',
  greenBorder:'#86efac',
  blue:       '#1e40af',
  blueBg:     '#eff6ff',
  gray900:    '#111827',
  gray700:    '#374151',
  gray500:    '#6b7280',
  gray300:    '#d1d5db',
  gray100:    '#f3f4f6',
  white:      '#ffffff',
  red:        '#dc2626',
  amber:      '#92400e',
  amberBg:    '#fffbeb',
}

const PAGE_W  = 595.28   // A4 width pt
const PAGE_H  = 841.89   // A4 height pt
const MARGIN  = 50
const CONTENT_W = PAGE_W - MARGIN * 2

/** 현재 Y가 페이지 끝에 가까우면 새 페이지 */
function checkPage(doc: PDFKit.PDFDocument, y: number, needed = 60) {
  if (y + needed > PAGE_H - MARGIN) {
    doc.addPage()
    return MARGIN
  }
  return y
}

/** 수평선 */
function hr(doc: PDFKit.PDFDocument, y: number, color = COLOR.gray300) {
  doc.save().strokeColor(color).lineWidth(0.5).moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).stroke().restore()
  return y + 10
}

/** 색상 박스 배경 */
function box(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number,
             fillColor: string, borderColor?: string) {
  doc.save().roundedRect(x, y, w, h, 6)
  if (borderColor) doc.fillAndStroke(fillColor, borderColor)
  else doc.fill(fillColor)
  doc.restore()
}

/** 아이콘 원형 배지 */
function badge(doc: PDFKit.PDFDocument, x: number, y: number, text: string,
               bg: string, fg: string, r = 10) {
  doc.save().circle(x + r, y + r, r).fill(bg)
  doc.fillColor(fg).font(FONT_BOLD).fontSize(8)
     .text(text, x, y + r - 4, { width: r * 2, align: 'center' })
  doc.restore()
}

/** 섹션 제목 (큰 헤더) */
function sectionTitle(doc: PDFKit.PDFDocument, y: number, num: string, title: string) {
  y = checkPage(doc, y, 60)
  // 좌측 녹색 바
  doc.save().rect(MARGIN, y, 4, 28).fill(COLOR.greenLight).restore()
  // 번호
  doc.fillColor(COLOR.greenLight).font(FONT_BOLD).fontSize(10)
     .text(num, MARGIN + 10, y + 2, { continued: false })
  // 제목
  doc.fillColor(COLOR.green).font(FONT_BOLD).fontSize(16)
     .text(title, MARGIN + 10, y + 14)
  return y + 36
}

/** 소제목 */
function subTitle(doc: PDFKit.PDFDocument, y: number, title: string, color = COLOR.gray900) {
  y = checkPage(doc, y, 40)
  doc.fillColor(color).font(FONT_BOLD).fontSize(12).text(title, MARGIN, y)
  return y + 20
}

/** 일반 본문 텍스트 */
function body(doc: PDFKit.PDFDocument, y: number, text: string, indent = 0) {
  y = checkPage(doc, y, 30)
  doc.fillColor(COLOR.gray700).font(FONT_REGULAR).fontSize(10)
     .text(text, MARGIN + indent, y, { width: CONTENT_W - indent, lineGap: 3 })
  return doc.y + 6
}

/** 불릿 항목 */
function bullet(doc: PDFKit.PDFDocument, y: number, text: string, color = COLOR.greenLight) {
  y = checkPage(doc, y, 28)
  doc.save().circle(MARGIN + 8, y + 5, 3).fill(color).restore()
  doc.fillColor(COLOR.gray700).font(FONT_REGULAR).fontSize(10)
     .text(text, MARGIN + 18, y, { width: CONTENT_W - 18, lineGap: 2 })
  return doc.y + 5
}

/** 번호 항목 */
function numberedItem(doc: PDFKit.PDFDocument, y: number, num: number, text: string) {
  y = checkPage(doc, y, 28)
  badge(doc, MARGIN, y - 2, String(num), COLOR.greenLight, COLOR.white)
  doc.fillColor(COLOR.gray700).font(FONT_REGULAR).fontSize(10)
     .text(text, MARGIN + 25, y, { width: CONTENT_W - 25, lineGap: 2 })
  return doc.y + 7
}

/** 강조 박스 */
function infoBox(doc: PDFKit.PDFDocument, y: number, text: string,
                 bg = COLOR.greenBg, border = COLOR.greenBorder, fgColor = COLOR.green) {
  y = checkPage(doc, y, 50)
  // 텍스트 높이 측정
  const textH = doc.heightOfString(text, { width: CONTENT_W - 30, lineGap: 3 }) + 20
  box(doc, MARGIN, y, CONTENT_W, textH, bg, border)
  doc.fillColor(fgColor).font(FONT_REGULAR).fontSize(10)
     .text(text, MARGIN + 15, y + 10, { width: CONTENT_W - 30, lineGap: 3 })
  return y + textH + 8
}

/** 경고 박스 */
function warnBox(doc: PDFKit.PDFDocument, y: number, text: string) {
  return infoBox(doc, y, text, COLOR.amberBg, '#fcd34d', COLOR.amber)
}

/** 표 행 */
function tableRow(doc: PDFKit.PDFDocument, y: number, cols: string[],
                  widths: number[], isHeader = false) {
  y = checkPage(doc, y, 22)
  const rowH = 22
  const bg = isHeader ? COLOR.green : (y % 2 === 0 ? COLOR.gray100 : COLOR.white)
  box(doc, MARGIN, y, CONTENT_W, rowH, bg)
  let x = MARGIN
  cols.forEach((col, i) => {
    doc.fillColor(isHeader ? COLOR.white : COLOR.gray700)
       .font(isHeader ? FONT_BOLD : FONT_REGULAR).fontSize(9)
       .text(col, x + 5, y + 6, { width: widths[i] - 10, ellipsis: true })
    x += widths[i]
  })
  // 구분선
  doc.save().strokeColor(COLOR.gray300).lineWidth(0.3)
     .moveTo(MARGIN, y + rowH).lineTo(MARGIN + CONTENT_W, y + rowH).stroke().restore()
  return y + rowH
}

// ═══════════════════════════════════════════════════════════════
//  메인: PDF 버퍼 생성
// ═══════════════════════════════════════════════════════════════
export function generateManualPdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true })
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.registerFont('Regular', FONT_REGULAR)
    doc.registerFont('Bold',    FONT_BOLD)

    // ────────────────────────────────────────────────────────
    //  ① 표지
    // ────────────────────────────────────────────────────────
    // 상단 녹색 헤더 영역
    box(doc, 0, 0, PAGE_W, 220, COLOR.green)
    // 장식 원
    doc.save().opacity(0.08).circle(PAGE_W - 60, 60, 120).fill(COLOR.white).restore()
    doc.save().opacity(0.05).circle(PAGE_W - 20, 180, 80).fill(COLOR.white).restore()

    // 로고 / 단체명
    doc.fillColor(COLOR.white).font('Bold').fontSize(11)
       .text('순천에코칼리지', MARGIN, 55)
    doc.save().strokeColor('#4ade80').lineWidth(1)
       .moveTo(MARGIN, 72).lineTo(MARGIN + 100, 72).stroke().restore()

    // 메인 제목
    doc.fillColor(COLOR.white).font('Bold').fontSize(30)
       .text('사이트 사용 매뉴얼', MARGIN, 88)
    doc.fillColor('#bbf7d0').font('Regular').fontSize(13)
       .text('순천에코칼리지 의제 창구 시스템 안내서', MARGIN, 130)

    // 버전 / 발행일
    const today = new Date()
    const dateStr = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`
    doc.fillColor('#86efac').font('Regular').fontSize(10)
       .text(`발행일: ${dateStr}  ·  v1.0`, MARGIN, 155)

    // 하단 장식 바
    box(doc, 0, 220, PAGE_W, 6, COLOR.greenLight)
    box(doc, 0, 226, PAGE_W, 3, '#4ade80')

    // 소개 텍스트
    let y = 260
    doc.fillColor(COLOR.gray700).font('Regular').fontSize(11)
       .text(
         '본 매뉴얼은 순천에코칼리지 의제 창구 시스템의 모든 기능을\n' +
         '사용자와 관리자가 효율적으로 활용할 수 있도록 작성된 안내서입니다.',
         MARGIN, y, { width: CONTENT_W, lineGap: 5, align: 'center' }
       )
    y = doc.y + 20

    // 목차 박스
    box(doc, MARGIN, y, CONTENT_W, 200, COLOR.gray100, COLOR.gray300)
    y += 15
    doc.fillColor(COLOR.green).font('Bold').fontSize(12)
       .text('목  차', MARGIN + 15, y)
    y += 20
    hr(doc, y, COLOR.gray300); y += 5

    const toc = [
      ['1장', '서비스 소개 및 접속 방법', '2'],
      ['2장', '메인 페이지 기능 안내', '3'],
      ['3장', '의제 등록 방법', '4'],
      ['4장', '사이드 메뉴 (ABOUT / PROGRAM / APPLY)', '5'],
      ['5장', '소식지 열람', '6'],
      ['6장', '관리자 페이지 사용법', '7'],
      ['7장', '자주 묻는 질문 (FAQ)', '12'],
    ]
    toc.forEach(([ch, title, pg]) => {
      doc.fillColor(COLOR.gray700).font('Regular').fontSize(10)
         .text(ch, MARGIN + 15, y, { continued: true, width: 35 })
         .font('Bold').text('  ' + title, { continued: true, width: CONTENT_W - 90 })
         .font('Regular').fillColor(COLOR.gray500)
         .text(pg + '쪽', { align: 'right', width: 40 })
      y += 18
    })

    y = PAGE_H - 80
    hr(doc, y); y += 8
    doc.fillColor(COLOR.gray500).font('Regular').fontSize(8)
       .text('© 2026 순천에코칼리지. 사람과 자연이 함께 살아가는 도시를 향해 나아갑니다.',
             MARGIN, y, { align: 'center', width: CONTENT_W })

    // ────────────────────────────────────────────────────────
    //  ② 1장: 서비스 소개 및 접속 방법
    // ────────────────────────────────────────────────────────
    doc.addPage()
    y = MARGIN

    y = sectionTitle(doc, y, '1장', '서비스 소개 및 접속 방법')
    y += 5
    y = body(doc, y,
      '순천에코칼리지 의제 창구는 순천 시민들이 생태·환경 관련 의제를 자유롭게 제안하고, ' +
      '다른 시민들의 의견을 한눈에 확인할 수 있는 온라인 플랫폼입니다. ' +
      '제안된 의제는 생태적 공론장에 반영되어 공개적으로 논의됩니다.')
    y += 8

    y = subTitle(doc, y, '1.1 주요 기능')
    const features = [
      '시민 의제 등록: 생태·환경 관련 희망 의제를 500자 이내로 작성하여 제출',
      '다른 의견 보기: 등록된 시민들의 의견을 카드·말풍선 형태로 열람',
      '좋아요 기능: 공감하는 의제에 좋아요 표시 가능',
      '워드 클라우드: 의제에 자주 등장하는 핵심 단어 시각화',
      '소식지: 에코칼리지의 활동 소식과 자료를 PDF로 제공',
      '단체 소개 / 프로그램 / 참여 안내 메뉴',
    ]
    features.forEach(f => { y = bullet(doc, y, f) })
    y += 8

    y = subTitle(doc, y, '1.2 사이트 접속')
    y = body(doc, y, '웹 브라우저(Chrome, Safari, Edge 등)에서 아래 주소로 접속합니다.')
    y = infoBox(doc, y, '사이트 주소: https://sunchon-eco-agenda.onrender.com')
    y = body(doc, y, '모바일(스마트폰·태블릿)에서도 동일하게 이용할 수 있습니다.')
    y += 8

    y = subTitle(doc, y, '1.3 지원 환경')
    const envRows = [
      ['구분', '지원 브라우저 / OS'],
      ['PC', 'Chrome 90+, Safari 15+, Edge 90+, Firefox 90+'],
      ['모바일', 'iOS Safari 15+, Android Chrome 90+'],
      ['권장 해상도', '360px 이상 (모바일) / 1280px 이상 (데스크탑)'],
    ]
    const envW = [CONTENT_W * 0.25, CONTENT_W * 0.75]
    envRows.forEach((row, i) => { y = tableRow(doc, y, row, envW, i === 0) })

    // ────────────────────────────────────────────────────────
    //  ③ 2장: 메인 페이지 기능 안내
    // ────────────────────────────────────────────────────────
    doc.addPage()
    y = MARGIN

    y = sectionTitle(doc, y, '2장', '메인 페이지 기능 안내')
    y += 5
    y = body(doc, y, '메인 페이지는 크게 ① 네비게이션 바, ② 히어로 섹션, ③ 의제 등록 영역, ④ 다른 의견 보기, ⑤ 워드 클라우드, ⑥ 소개 섹션, ⑦ 푸터로 구성되어 있습니다.')
    y += 8

    y = subTitle(doc, y, '2.1 상단 네비게이션 바')
    y = bullet(doc, y, '좌측 햄버거 메뉴(☰) 버튼: 클릭 시 사이드 메뉴 패널이 열립니다.')
    y = bullet(doc, y, '중앙 로고: 클릭 시 메인 페이지로 이동합니다.')
    y = bullet(doc, y, '우측 소식지 버튼: 소식지 목록 페이지로 이동합니다.')
    y += 8

    y = subTitle(doc, y, '2.2 히어로 섹션')
    y = body(doc, y, '사이트의 메인 타이틀과 부제가 표시됩니다. 관리자가 배경 이미지를 설정할 경우 해당 이미지가 배경으로 나타납니다.')
    y += 8

    y = subTitle(doc, y, '2.3 의제 등록 영역')
    y = body(doc, y, '시민이 직접 의제를 입력하는 공간입니다. 아래 "3장 의제 등록 방법"을 참고하세요.')
    y += 8

    y = subTitle(doc, y, '2.4 다른 사람들의 의제 보기')
    y = bullet(doc, y, '최근 등록된 의제 50개가 카드 형태로 자동 표시됩니다.')
    y = bullet(doc, y, '각 카드에는 의제 내용, 거주동, 등록 시각, 좋아요 수가 표시됩니다.')
    y = bullet(doc, y, '❤️ 버튼을 누르면 해당 의제에 공감 표시를 할 수 있습니다. (IP 기반, 1회)')
    y = bullet(doc, y, '"모여진 전체 의제 보기" 버튼: 클릭 시 전체 의제를 말풍선 형태로 펼쳐 볼 수 있습니다.')
    y += 8

    y = subTitle(doc, y, '2.5 워드 클라우드')
    y = body(doc, y, '등록된 의제들에서 자주 등장하는 핵심 명사를 추출하여 시각적으로 표시합니다. 단어가 클수록 많이 언급된 키워드입니다. 가운데 위치한 단어일수록 빈도가 높습니다.')
    y += 8

    y = subTitle(doc, y, '2.6 사이드 메뉴 열기')
    y = body(doc, y, '좌측 상단 ☰ 버튼을 클릭하면 사이드 패널이 열립니다. ABOUT / PROGRAM / APPLY 메뉴 항목을 클릭하면 해당 페이지로 이동합니다.')

    // ────────────────────────────────────────────────────────
    //  ④ 3장: 의제 등록 방법
    // ────────────────────────────────────────────────────────
    doc.addPage()
    y = MARGIN

    y = sectionTitle(doc, y, '3장', '의제 등록 방법')
    y += 5
    y = body(doc, y, '순천에코칼리지가 다뤄야 할 생태·환경 관련 의제를 자유롭게 제안할 수 있습니다.')
    y += 8

    y = subTitle(doc, y, '3.1 등록 순서')
    const steps = [
      '메인 페이지 의제 입력 창에 내용을 작성합니다. (최대 500자)',
      '"의제 등록하기" 버튼을 클릭합니다.',
      '팝업 창에서 이름, 연락처, 거주동을 입력합니다.',
      '이메일은 선택 사항입니다.',
      '개인정보 활용 동의에 체크합니다.',
      '"등록하기" 버튼을 클릭하면 완료됩니다.',
    ]
    steps.forEach((s, i) => { y = numberedItem(doc, y, i + 1, s) })
    y += 8

    y = subTitle(doc, y, '3.2 입력 항목 안내')
    const fieldRows = [
      ['항목', '필수 여부', '설명'],
      ['의제 내용', '필수', '생태·환경 관련 의제, 최대 500자'],
      ['이름', '필수', '실명 또는 닉네임'],
      ['연락처', '필수', '010-XXXX-XXXX 형식'],
      ['이메일', '선택', '올바른 이메일 형식'],
      ['거주 동', '필수', '순천시 거주 동 선택'],
      ['개인정보 동의', '필수', '체크 필요'],
    ]
    const fw = [CONTENT_W * 0.35, CONTENT_W * 0.2, CONTENT_W * 0.45]
    fieldRows.forEach((row, i) => { y = tableRow(doc, y, row, fw, i === 0) })
    y += 8

    y = subTitle(doc, y, '3.3 유의 사항')
    y = warnBox(doc, y,
      '⚠  금칙어가 포함된 내용은 자동으로 * 처리됩니다.\n' +
      '⚠  욕설, 비방, 개인정보가 포함된 내용은 관리자에 의해 숨김 처리될 수 있습니다.\n' +
      '⚠  등록된 의제는 공개적으로 표시됩니다.')

    // ────────────────────────────────────────────────────────
    //  ⑤ 4장: 사이드 메뉴
    // ────────────────────────────────────────────────────────
    doc.addPage()
    y = MARGIN

    y = sectionTitle(doc, y, '4장', '사이드 메뉴 (ABOUT / PROGRAM / APPLY)')
    y += 5
    y = body(doc, y, '좌측 상단 ☰ 버튼을 클릭하면 사이드 패널이 열립니다. 각 메뉴를 클릭하면 해당 안내 페이지로 이동합니다.')
    y += 8

    y = subTitle(doc, y, '4.1 ABOUT — 단체 소개', COLOR.green)
    const aboutItems = [
      ['에코칼리지란?', '순천에코칼리지의 설립 취지와 소개'],
      ['교육 철학',     '교육의 방향과 철학'],
      ['소개',          '운영 주체 및 참여 기관 안내'],
    ]
    aboutItems.forEach(([title, desc]) => {
      y = checkPage(doc, y, 22)
      doc.fillColor(COLOR.green).font('Bold').fontSize(10)
         .text('▸ ' + title, MARGIN, y, { continued: true, width: 100 })
         .fillColor(COLOR.gray700).font('Regular')
         .text(' — ' + desc, { width: CONTENT_W - 100 })
      y = doc.y + 5
    })
    y += 5

    y = subTitle(doc, y, '4.2 PROGRAM — 운영 프로그램', COLOR.blue)
    const progItems = [
      ['2025 시범과정',       '2025년 시범 운영 프로그램 안내'],
      ['2026 양성 과정',      '2026 생태문명 전환 촉진자 양성 과정'],
      ['생태공론장',          '시민 의제 공론화 프로그램'],
    ]
    progItems.forEach(([title, desc]) => {
      y = checkPage(doc, y, 22)
      doc.fillColor(COLOR.blue).font('Bold').fontSize(10)
         .text('▸ ' + title, MARGIN, y, { continued: true, width: 120 })
         .fillColor(COLOR.gray700).font('Regular')
         .text(' — ' + desc, { width: CONTENT_W - 120 })
      y = doc.y + 5
    })
    y += 5

    y = subTitle(doc, y, '4.3 APPLY — 참여 신청', '#7c3aed')
    const applyItems = [
      ['참여 안내',   '프로그램 참여 신청 방법 안내'],
      ['의제 등록',   '시민 의제 제안 안내'],
      ['문의하기',    '전화·이메일·블로그 문의처'],
    ]
    applyItems.forEach(([title, desc]) => {
      y = checkPage(doc, y, 22)
      doc.fillColor('#7c3aed').font('Bold').fontSize(10)
         .text('▸ ' + title, MARGIN, y, { continued: true, width: 100 })
         .fillColor(COLOR.gray700).font('Regular')
         .text(' — ' + desc, { width: CONTENT_W - 100 })
      y = doc.y + 5
    })
    y += 8
    y = infoBox(doc, y, '각 페이지의 본문에 URL 링크가 포함된 경우 클릭하면 새 창에서 해당 페이지가 열립니다.')

    // ────────────────────────────────────────────────────────
    //  ⑥ 5장: 소식지
    // ────────────────────────────────────────────────────────
    doc.addPage()
    y = MARGIN

    y = sectionTitle(doc, y, '5장', '소식지 열람')
    y += 5
    y = body(doc, y, '에코칼리지의 활동 소식, 뉴스레터를 PDF 형태로 제공합니다.')
    y += 8

    y = subTitle(doc, y, '5.1 소식지 목록 접근')
    y = numberedItem(doc, y, 1, '메인 페이지 우측 상단의 "소식지" 버튼을 클릭합니다.')
    y = numberedItem(doc, y, 2, '또는 브라우저에서 /newsletter 경로로 직접 접속합니다.')
    y += 8

    y = subTitle(doc, y, '5.2 소식지 카드 구성')
    y = bullet(doc, y, '커버 이미지 (A4 세로 비율, 3:4)')
    y = bullet(doc, y, '소식지 제목')
    y = bullet(doc, y, '발행 날짜')
    y = bullet(doc, y, 'PDF 파일이 있는 경우 빨간 PDF 배지 표시')
    y += 8

    y = subTitle(doc, y, '5.3 소식지 상세 보기')
    y = numberedItem(doc, y, 1, '소식지 카드를 클릭하면 상세 페이지로 이동합니다.')
    y = numberedItem(doc, y, 2, 'PDF가 등록된 경우 인라인 뷰어에서 바로 확인할 수 있습니다.')
    y = numberedItem(doc, y, 3, '"새 탭에서 열기" 버튼으로 원본 PDF를 별도 창에서 볼 수 있습니다.')
    y += 8
    y = infoBox(doc, y, '소식지 PDF는 구글 드라이브에서 제공됩니다. 링크가 공개 설정인 경우에만 정상적으로 표시됩니다.')

    // ────────────────────────────────────────────────────────
    //  ⑦ 6장: 관리자 페이지 (다음 페이지들)
    // ────────────────────────────────────────────────────────
    doc.addPage()
    y = MARGIN

    y = sectionTitle(doc, y, '6장', '관리자 페이지 사용법')
    y += 5
    y = body(doc, y, '관리자 페이지는 사이트 운영자가 의제 관리, 사이트 설정, 소식지 관리, 금칙어 관리 등을 수행하는 백오피스 화면입니다.')
    y = infoBox(doc, y, '관리자 페이지 접속 주소: /admin\n초기 계정 — 아이디: admin  /  비밀번호: admin1234\n(최초 로그인 후 반드시 비밀번호를 변경하세요.)')
    y += 8

    y = subTitle(doc, y, '6.1 로그인')
    y = numberedItem(doc, y, 1, '/admin 주소로 접속합니다.')
    y = numberedItem(doc, y, 2, '아이디와 비밀번호를 입력하고 로그인 버튼을 클릭합니다.')
    y = numberedItem(doc, y, 3, '인증 토큰은 브라우저에 24시간 저장됩니다.')
    y += 8

    y = subTitle(doc, y, '6.2 대시보드')
    y = bullet(doc, y, '전체 의제 수 / 공개 의제 수 / 숨김 의제 수 / 오늘 등록 수 통계 확인')
    y = bullet(doc, y, '"의제 관리하기" / "엑셀 다운로드" / "사이트 설정" 빠른 작업 버튼')
    y += 8

    y = subTitle(doc, y, '6.3 의제 목록 관리')
    y = bullet(doc, y, '상태 필터(전체/공개/숨김)와 키워드 검색으로 의제를 조회합니다.')
    y = bullet(doc, y, '각 행의 관리 버튼으로 의제 상태를 변경하거나 내용을 수정할 수 있습니다.')
    y = bullet(doc, y, '"CSV 다운로드" 버튼으로 전체 의제 데이터를 엑셀 파일로 내보냅니다.')

    const statusRows = [
      ['상태', '설명', '전환 가능 동작'],
      ['공개(visible)', '메인에 정상 표시됨', '숨김 처리, 삭제'],
      ['숨김(hidden)', '메인에 표시되지 않음', '공개 전환, 삭제'],
      ['삭제(deleted)', '완전히 삭제 처리됨', '복구 불가'],
    ]
    const sw = [CONTENT_W * 0.3, CONTENT_W * 0.35, CONTENT_W * 0.35]
    y += 5
    statusRows.forEach((row, i) => { y = tableRow(doc, y, row, sw, i === 0) })
    y += 8

    // 6.4 ~ 6.7
    doc.addPage()
    y = MARGIN

    y = subTitle(doc, y, '6.4 사이트 설정')
    y = bullet(doc, y, '메인 타이틀 / 부제 / 의제 활용 안내 / 생태적 공론장 설명 텍스트 수정')
    y = bullet(doc, y, 'ABOUT / PROGRAM / APPLY 하위 메뉴 본문 및 대표 이미지 URL 수정')
    y = bullet(doc, y, '히어로 배경 이미지 URL 설정')
    y = bullet(doc, y, '푸터 블로그 / 페이스북 / 인스타그램 / 전화 / 이메일 수정')
    y = bullet(doc, y, '메뉴 표시/숨김 토글: 각 항목을 끄면 사이드 메뉴에서 숨겨짐')
    y = infoBox(doc, y, '설정 변경 후 반드시 하단의 "설정 저장하기" 버튼을 눌러야 반영됩니다.')
    y += 8

    y = subTitle(doc, y, '6.5 소식지 관리')
    y = numberedItem(doc, y, 1, '"새 소식지" 버튼 → 제목, 커버 이미지 URL, PDF 링크 입력 → 저장')
    y = numberedItem(doc, y, 2, 'PDF 링크는 구글 드라이브 공유 링크를 사용합니다.')
    y = numberedItem(doc, y, 3, '공개/비공개 상태 선택 가능 (비공개: 목록에 표시 안 됨)')
    y = numberedItem(doc, y, 4, '수정: 소식지 목록에서 편집 아이콘 클릭')
    y = numberedItem(doc, y, 5, '삭제: 소식지 목록에서 삭제 아이콘 클릭 (확인 후 삭제)')

    y = warnBox(doc, y,
      '📌 구글 드라이브 PDF 공유 방법:\n' +
      '   ① 구글 드라이브에서 파일 우클릭 → "공유"\n' +
      '   ② "링크가 있는 모든 사용자" 로 권한 변경\n' +
      '   ③ 링크 복사 후 PDF 링크 입력란에 붙여넣기')
    y += 8

    y = subTitle(doc, y, '6.6 금칙어 관리')
    y = body(doc, y,
      '의제 등록 시 자동으로 * 처리할 단어를 관리합니다. ' +
      '실시간으로 적용되므로 추가 즉시 효력이 발생합니다.')
    y = bullet(doc, y, '단어 추가: 입력창에 단어 입력 후 엔터 또는 "추가" 버튼 클릭')
    y = bullet(doc, y, '단어 삭제: 태그의 ✕ 버튼 클릭 → 확인 후 삭제')
    y = bullet(doc, y, '단어 수정: 태그 텍스트를 더블클릭 → 수정 → 엔터로 저장')
    y = warnBox(doc, y,
      '⚠  기존에 등록된 의제에는 소급 적용되지 않습니다.\n' +
      '⚠  1자짜리 단어는 오탐이 발생할 수 있으니 2자 이상을 권장합니다.')
    y += 8

    y = subTitle(doc, y, '6.7 계정 설정')
    y = numberedItem(doc, y, 1, '사이드바의 "계정 설정" 클릭')
    y = numberedItem(doc, y, 2, '현재 비밀번호, 새 비밀번호(최소 6자), 새 비밀번호 확인 입력')
    y = numberedItem(doc, y, 3, '"비밀번호 변경" 버튼 클릭')
    y = infoBox(doc, y, '보안을 위해 초기 비밀번호(admin1234)는 최초 로그인 즉시 변경하시기 바랍니다.')

    // ────────────────────────────────────────────────────────
    //  ⑧ 7장: FAQ
    // ────────────────────────────────────────────────────────
    doc.addPage()
    y = MARGIN

    y = sectionTitle(doc, y, '7장', '자주 묻는 질문 (FAQ)')
    y += 5

    const faqs = [
      {
        q: '의제를 등록했는데 바로 보이지 않습니다.',
        a: '의제는 등록 즉시 "공개" 상태로 처리되어 메인 페이지에 표시됩니다.\n' +
           '다만 최신 50건만 기본 표시되므로, "전체 의제 보기" 버튼을 눌러 확인해 보세요.\n' +
           '관리자가 검토 후 숨김 처리할 수도 있습니다.',
      },
      {
        q: '연락처를 잘못 입력했습니다. 수정할 수 있나요?',
        a: '시민 화면에서는 등록 후 수정이 불가합니다. 수정이 필요하다면\n' +
           '관리자(이메일 또는 전화)에게 문의하시면 처리해 드립니다.',
      },
      {
        q: '좋아요를 눌렀는데 취소할 수 있나요?',
        a: '같은 의제의 ❤️ 버튼을 다시 클릭하면 좋아요가 취소됩니다.\n' +
           '단, 브라우저/IP가 변경되면 새로운 투표로 인식될 수 있습니다.',
      },
      {
        q: '소식지 PDF가 표시되지 않습니다.',
        a: '구글 드라이브 PDF의 공유 권한이 "링크가 있는 모든 사용자"로 설정되어 있는지 확인하세요.\n' +
           '"새 탭에서 열기" 버튼을 클릭하면 원본 파일을 직접 열 수 있습니다.',
      },
      {
        q: '관리자 비밀번호를 잊어버렸습니다.',
        a: '서버 환경에서 DB를 직접 수정하거나 개발자에게 문의하여 초기화 처리가 필요합니다.',
      },
      {
        q: '모바일에서 이미지가 깨집니다.',
        a: '관리자 페이지에서 설정한 이미지 URL이 올바른 공개 이미지 URL인지 확인하세요.\n' +
           'HTTPS로 제공되는 이미지를 사용하면 모든 환경에서 안정적으로 표시됩니다.',
      },
      {
        q: '워드 클라우드에 원하지 않는 단어가 표시됩니다.',
        a: '워드 클라우드는 등록된 의제에서 명사를 자동 추출합니다.\n' +
           '특정 단어를 제거하려면 해당 의제를 숨김 처리하거나 내용을 수정하면 반영됩니다.',
      },
    ]

    faqs.forEach((faq, i) => {
      y = checkPage(doc, y, 70)
      // Q 박스
      box(doc, MARGIN, y, CONTENT_W, 22, COLOR.green)
      badge(doc, MARGIN + 5, y + 1, 'Q', '#4ade80', COLOR.green)
      doc.fillColor(COLOR.white).font('Bold').fontSize(10)
         .text(faq.q, MARGIN + 30, y + 6, { width: CONTENT_W - 35 })
      y += 22

      // A 박스
      const aH = doc.heightOfString(faq.a, { width: CONTENT_W - 35, lineGap: 3 }) + 20
      y = checkPage(doc, y, aH)
      box(doc, MARGIN, y, CONTENT_W, aH, COLOR.gray100, COLOR.gray300)
      badge(doc, MARGIN + 5, y + 8, 'A', COLOR.greenLight, COLOR.white)
      doc.fillColor(COLOR.gray700).font('Regular').fontSize(10)
         .text(faq.a, MARGIN + 30, y + 10, { width: CONTENT_W - 35, lineGap: 3 })
      y += aH + 10
    })

    // ────────────────────────────────────────────────────────
    //  페이지 번호 삽입 (표지 제외)
    // ────────────────────────────────────────────────────────
    const totalPages = doc.bufferedPageRange().count
    for (let i = 1; i < totalPages; i++) {
      doc.switchToPage(i)
      // 헤더 라인
      doc.save().strokeColor(COLOR.greenBorder).lineWidth(0.5)
         .moveTo(MARGIN, 30).lineTo(PAGE_W - MARGIN, 30).stroke().restore()
      doc.fillColor(COLOR.green).font('Bold').fontSize(8)
         .text('순천에코칼리지 의제 창구 사용 매뉴얼', MARGIN, 20, { width: CONTENT_W * 0.6 })
      // 페이지 번호
      doc.fillColor(COLOR.gray500).font('Regular').fontSize(8)
         .text(`${i} / ${totalPages - 1}`, PAGE_W - MARGIN - 40, 20, { width: 40, align: 'right' })
      // 푸터 라인
      doc.save().strokeColor(COLOR.gray300).lineWidth(0.3)
         .moveTo(MARGIN, PAGE_H - 35).lineTo(PAGE_W - MARGIN, PAGE_H - 35).stroke().restore()
      doc.fillColor(COLOR.gray500).font('Regular').fontSize(8)
         .text('© 2026 순천에코칼리지', MARGIN, PAGE_H - 25, { width: CONTENT_W, align: 'center' })
    }

    doc.end()
  })
}
