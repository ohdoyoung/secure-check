# 무료 배포 계획

확인일: 2026-07-02

## 추천 조합

가장 현실적인 무료 MVP 배포 조합은 **프론트엔드 Cloudflare Pages 또는 Vercel + 백엔드 Render Free Web Service**입니다.

현재 서비스는 검사 이력을 `localStorage` 중심으로 다루고 있어 운영 DB 없이도 데모가 가능합니다. 그래서 초반에는 DB를 붙이지 않는 편이 무료 유지와 장애 가능성 면에서 낫습니다.

## 1안: Cloudflare Pages + Render Free

### Frontend

- 플랫폼: Cloudflare Pages
- Root directory: `frontend`
- Build command: `npm ci && npm run build`
- Output directory: `dist`
- 환경변수:
  - `VITE_API_BASE_URL=https://<render-service>.onrender.com`
- SPA fallback: `frontend/public/_redirects`
- 보안 헤더: `frontend/public/_headers`

Cloudflare Pages Free plan은 월 500 builds, build timeout 20분, 사이트당 20,000 files, 단일 asset 25 MiB 제한이 있습니다. 현재 Vite 정적 앱 규모에는 충분합니다.

출처: [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)

### Backend

- 플랫폼: Render Free Web Service
- Blueprint: `render.yaml`
- Runtime: Docker
- Dockerfile: `backend/Dockerfile`
- Health check path: `/api/health`
- 환경변수:
  - `CHWIYAKHAENNE_CORS_ALLOWED_ORIGINS=https://<frontend-domain>`

Render Free Web Service는 15분 무트래픽 시 spin down되고, 다음 요청 때 다시 뜨는 데 약 1분 정도 걸릴 수 있습니다. 월 750 free instance hours가 제공되며, 로컬 파일시스템은 재배포/재시작/spin down 시 유지되지 않습니다. 포트폴리오 데모에는 괜찮지만 운영 서비스처럼 보장하면 안 됩니다.

출처: [Render Deploy for Free](https://render.com/docs/free)

## 2안: Vercel + Render Free

Vercel Hobby도 프론트 정적 배포에 잘 맞습니다.

- Root directory: `frontend`
- Build command: `npm ci && npm run build`
- Output directory: `dist`
- 환경변수:
  - `VITE_API_BASE_URL=https://<render-service>.onrender.com`
- Vercel 설정 파일: `frontend/vercel.json`

Vercel Hobby는 $0/mo 플랜이고 개인/포트폴리오 프로젝트 시작점으로 적합합니다. 공식 가격표 기준 Hobby에는 월 100GB Fast Data Transfer, 1M Edge Requests 등이 포함됩니다.

출처: [Vercel Pricing](https://vercel.com/pricing)

## DB는 언제 붙일지

지금은 붙이지 않는 것을 추천합니다.

Supabase Free Plan은 시작용으로 좋고 무료 프로젝트 2개, 프로젝트당 DB 500MB, egress 5GB 같은 무료 한도가 있습니다. 다만 이 프로젝트의 현재 핵심 가치는 “코드 업로드 후 즉시 분석”이므로, 처음 배포에서는 DB 없이 데모 안정성을 우선하는 편이 좋습니다.

DB를 붙일 타이밍은 다음 기능을 넣을 때입니다.

- 사용자별 검사 이력 영구 저장
- 공유 가능한 진단서 링크
- GitHub 저장소별 점수 변화 추적
- 팀/프로젝트 단위 리포트 관리

출처: [Supabase billing docs](https://supabase.com/docs/guides/platform/billing-on-supabase)

## 배포 전 체크리스트

1. `frontend`에 `VITE_API_BASE_URL` 환경변수를 설정한다.
2. Render 백엔드에 `CHWIYAKHAENNE_CORS_ALLOWED_ORIGINS`를 프론트 도메인으로 설정한다.
3. Render 배포 후 `https://<backend>/api/health`가 `{"status":"ok"}`를 반환하는지 확인한다.
4. 프론트 배포 후 브라우저에서 취약 샘플을 실행해 `/api/analyze` 요청이 Render로 가는지 확인한다.
5. 첫 요청 cold start 안내 문구를 README 또는 포트폴리오 설명에 짧게 적는다.

## 나중에 유료로 넘어갈 때

포트폴리오 데모에서 실제 사용자가 생기면 우선순위는 이렇습니다.

1. Render 백엔드만 유료 인스턴스로 전환해 cold start 제거
2. Supabase 또는 TiDB에 검사 이력 저장
3. HTML 리포트 공유 링크 추가
4. Semgrep CLI를 별도 worker나 job 구조로 분리
