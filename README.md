# HEHE Web

레이저 제모 병원 찾기 앱 **HEHE** 의 다운로드 유도용 지도 웹 랜딩 페이지.

지도에서 주변 레이저 제모 병원을 탐색하고, HEHE 앱 다운로드로 유도하는 것이 목적.

---

## 기술 스택

- **Vue 3** + Vite + TypeScript
- **Pinia** (상태 관리)
- **Vue Router 4**
- **네이버 지도 API** (Maps JavaScript API v3)
- **axios** (API 통신)

---

## 환경변수 설정

프로젝트 루트에 `.env` 파일 생성 후 아래 값을 채운다.

```
VITE_NAVER_MAP_CLIENT_ID=your_naver_map_client_id
VITE_API_BASE_URL=https://api.example.com
```

| 변수 | 설명 |
|---|---|
| `VITE_NAVER_MAP_CLIENT_ID` | 네이버 클라우드 플랫폼 Maps 클라이언트 ID |
| `VITE_API_BASE_URL` | 백엔드 API 베이스 URL |

---

## 개발 실행

```sh
npm install
npm run dev
```

---

## 배포

```sh
# 1. 빌드
npm run build

# 2. EC2 전송
scp -i ~/.ssh/your-key.pem -r dist/ user@your-server:/path/to/hehe-web/
```

Nginx가 `dist/` 폴더를 정적 파일로 서빙한다. 배포 후 Nginx reload 불필요.

---

## 적용 사항

- **SEO** — 메타 태그, OG/Twitter Card, JSON-LD 구조화 데이터, sitemap.xml, robots.txt, Google Search Console 등록
- **Google Analytics 4** — 페이지뷰 자동 수집 + 커스텀 이벤트 (병원 선택, 모달 노출, 앱 버튼 클릭 등 5종)
- **반응형** — 데스크탑(우측 패널) / 모바일(하단 바텀시트) 분기 대응
- **EC2 + Nginx** 정적 배포, HTTPS(Let's Encrypt)

---

## 주요 문서

| 문서 | 설명 |
|---|---|
| `docs/dev_context.md` | 컴포넌트·composable·store 현황 |
| `docs/web_planning.md` | 전체 기획 |
| `docs/seo.md` | SEO 적용 현황 |
| `docs/bug_report.md` | 버그 리포트 |
| `docs/improvement_report.md` | 개선사항 리포트 |
