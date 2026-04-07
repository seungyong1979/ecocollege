# 순천에코칼리지 생태 의제 창구

생태문명 도시 순천의 시민 의제를 발굴하는 온라인 창구 웹애플리케이션입니다.

## 서비스 URL

- **메인 페이지**: `/`
- **관리자 페이지**: `/admin`
- **초기 관리자 계정**: admin / admin1234

## 주요 기능

### 메인 페이지 (시민용)
1. **의제 입력폼** - 생태적 의제를 자유롭게 작성
2. **개인정보 입력 팝업** - 이름, 연락처, 이메일(선택), 거주 동, 개인정보 동의
3. **다른 시민들의 의제 캐러셀** - 자동으로 돌아가며 표시
4. **키워드 구름(Word Cloud)** - 의제에서 많이 언급된 단어 시각화
5. **의제 활용 안내** - 3단계 프로세스 안내
6. **생태적 공론장 소개**
7. **푸터** - SNS 링크, 연락처

### 관리자 페이지 (`/admin`)
1. **대시보드** - 통계(전체/공개/숨김/오늘) + 빠른 작업 링크
2. **의제 관리** - 공개/숨김/삭제 상태 변경, 내용 수정, 상세 보기, 검색/필터
3. **CSV 다운로드** - 모든 의제 엑셀 파일로 내보내기
4. **사이트 설정** - 메인 타이틀·부제·안내문구·배경이미지 URL 변경
5. **계정 설정** - 관리자 비밀번호 변경

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/agendas` | 공개 의제 목록 |
| POST | `/api/agendas` | 의제 등록 |
| GET | `/api/word-cloud` | 키워드 빈도 |
| GET | `/api/settings` | 사이트 설정 조회 |
| POST | `/api/admin/login` | 관리자 로그인 |
| GET | `/api/admin/agendas` | 전체 의제 목록(관리자) |
| PATCH | `/api/admin/agendas/:id` | 의제 상태 변경 |
| PUT | `/api/admin/agendas/:id` | 의제 내용 수정 |
| GET | `/api/admin/export` | CSV 내보내기 |
| POST | `/api/admin/settings` | 설정 저장 |
| GET | `/api/admin/stats` | 통계 조회 |
| POST | `/api/admin/change-password` | 비밀번호 변경 |

## 기술 스택

- **Backend**: Hono (TypeScript) on Cloudflare Pages/Workers
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: Vanilla JS + Tailwind CSS (CDN)
- **Build**: Vite + @hono/vite-build

## 배포

```bash
# 1. Cloudflare D1 DB 생성
npx wrangler d1 create sunchon-eco-production
# → database_id를 wrangler.jsonc에 업데이트

# 2. 빌드
npm run build

# 3. 프로덕션 DB 마이그레이션
npm run db:migrate:prod

# 4. 배포
npm run deploy
```

## 로컬 개발

```bash
npm install
npm run db:migrate:local  # 로컬 DB 생성
npm run build
pm2 start ecosystem.config.cjs  # 개발 서버 시작
```

## 데이터 모델

- **agendas**: 의제 (content, name, phone, email, district, privacy_agreed, status)
- **admins**: 관리자 계정 (username, password_hash)
- **site_settings**: 사이트 설정 (key-value)

**Status**: ✅ 운영 중  
**Platform**: Cloudflare Pages  
**Last Updated**: 2024-04-07
