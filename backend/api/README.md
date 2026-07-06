# API Layer

주요 API는 `src/main/java/com/chwiyakhaenne/api`에 있습니다.

- `GET /api/health`
- `POST /api/analyze`: JSON 기반 프로젝트 분석
- `POST /api/analyze/upload`: multipart 파일/ZIP 업로드 분석

프론트엔드는 브라우저에서 폴더와 ZIP을 먼저 읽어 `/api/analyze`로 보내며, 서버 업로드 API는 Postman/외부 클라이언트와 향후 대용량 업로드 대응을 위해 유지합니다.
