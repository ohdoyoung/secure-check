# 전체 QA 결과 및 아쉬운 점

## QA 실행일

2026-06-23

## 현재 점검 가능 범위

| 구분 | 수치 |
| --- | --- |
| 활성 룰 총합 | 166개 |
| KISA JavaScript 룰 | 32개 |
| JS OWASP 보강 룰 | 11개 |
| 다언어 보안 카탈로그 룰 | 123개 |
| curated 샘플 검증 수 | 332개 |
| 지원 입력 | 코드 붙여넣기, 단일 파일, ZIP, 폴더 업로드, 공개 GitHub 저장소 URL |
| 주요 언어/파일 | Java, Spring, JavaScript, TypeScript, React, Python, PHP, SQL, Dockerfile, YAML/JSON/설정 파일 |

## 자동 QA 결과

| 항목 | 결과 |
| --- | --- |
| pytest 전체 | 22 passed, 1 skipped |
| KISA JS metrics | Coverage 76.19%, Precision 100%, Recall 100%, FPR 0%, FNR 0% |
| 다언어 catalog metrics | Rule 123개, Detection 123, Precision 100%, Recall 100%, FPR 0%, FNR 0% |
| realistic benchmark metrics | 10개 케이스, expected label 57/57, forbidden label 오탐 0/57, Precision 100%, Recall 100% |
| 변형 샘플 QA | positive 변형 28개 탐지, negative 변형 13개 미탐지, 2 passed |
| 혼합 문맥 정밀 QA | 안전 코드와 취약 코드가 같은 파일에 있을 때 11/11 탐지, 안전 문맥 오탐 0 |
| Frontend production build | 성공 |
| Backend Maven test | 15 tests, BUILD SUCCESS |

## 2026-06-23 추가 QA

| 항목 | 결과 |
| --- | --- |
| Frontend production build | 성공 |
| Backend Maven test | 15 tests, BUILD SUCCESS |
| pytest 전체 | 22 passed, 1 skipped |
| API 단일 현실형 취약 케이스 | `api-smoke-node_marketplace_account_takeover`, finding 22개, 점수 0점, `입원 권장` |
| API 실무형 폴더 프로젝트 | 17개 파일 요약, 취약 파일 14개, 총 finding 122개, 고유 기대 룰 97/97 탐지 |
| line context | API finding 전후 라인 포함 확인, HTML 리포트 `코드 컨텍스트` 포함 |
| 외부 분석기 상태 | Semgrep 기본 비활성 상태가 `analyzerStatuses`와 HTML 리포트에 표시 |
| 브라우저 결과 이동 | 취약 샘플 실행 후 `#checkup-dashboard` 이동 확인 |
| 브라우저 결과 패널 | 검증률 패널, Semgrep 상태, 진단서 버튼, 상세 전후 라인 표시 확인 |
| 진단서 미리보기 | 모달 열기/닫기 정상, 콘솔 오류 0 |

## 2026-07-02 추가 룰 및 무료 배포 준비

| 항목 | 결과 |
| --- | --- |
| 추가 룰 | Node SSRF, GraphQL introspection/playground, Celery pickle serializer, Spring session fixation none, GitHub Actions pull_request_target checkout, CI secret echo |
| 다언어 카탈로그 | 123개 룰, positive 123/123 탐지, negative own-rule 오탐 0 |
| 활성 룰/샘플 | 166개 활성 룰, 332개 curated 샘플 |
| Frontend 배포 설정 | `VITE_API_BASE_URL`로 분리 배포 API 주소 설정 가능 |
| Render 배포 설정 | `render.yaml`, `backend/Dockerfile`, `PORT` 기반 Spring Boot 포트 설정 추가 |
| 정적 호스팅 설정 | Cloudflare `_headers`/`_redirects`, Vercel `vercel.json`, `.env.example` 추가 |
| 무료 배포 계획 | `docs/free-deployment-plan.md` 추가 |
| pytest 전체 | 22 passed, 1 skipped |
| Frontend production build | 성공 |
| Backend Maven test | 15 tests, BUILD SUCCESS |

## API QA 결과

다언어 취약 프로젝트 payload를 직접 구성해 `POST /api/analyze`로 검증했습니다.

| 항목 | 결과 |
| --- | --- |
| 기대 catalog rule | 123개 |
| 탐지 catalog rule | 123개 |
| 누락 rule | 0개 |
| 총 finding | 154개 |
| 심각도 | HIGH/MEDIUM/LOW 신규 운영 설정 룰 포함 |
| 리포트 검증 | HTML 리포트에 166개 활성 룰, 332개 샘플, 점수 산정, 우선 조치, 위험 파일 TOP5 포함 |

추가로 curated bad_example과 다른 형태의 다언어 변형 프로젝트를 `POST /api/analyze`로 재검증했습니다.

| 항목 | 결과 |
| --- | --- |
| 기대 variant rule | 28개 |
| 탐지 variant rule | 28개 |
| 누락 rule | 0개 |
| 총 finding | 43개 |
| 심각도 | HIGH 32, MEDIUM 10, LOW 1 |
| 판정 | 입원 권장 |

safe pattern이 파일 전체에 적용되어 취약 코드가 가려지는지 확인하기 위해 안전 코드와 취약 코드가 같은 파일에 있는 정밀 프로젝트도 검증했습니다.

| 항목 | 결과 |
| --- | --- |
| 기대 mixed rule | 11개 |
| 탐지 mixed rule | 11개 |
| 누락 rule | 0개 |
| 안전 프로젝트 finding | 0개 |
| 안전 프로젝트 판정 | 건강함 |

프로젝트형 사용자 QA를 위해 Spring/Node/React/Python/PHP/Docker/K8s/의존성 파일이 섞인 미니 프로젝트도 별도로 검증했습니다.

| 항목 | 결과 |
| --- | --- |
| 기대 프로젝트 rule | 37개 |
| 탐지 프로젝트 rule | 37개 |
| 누락 rule | 0개 |
| 총 finding | 47개 |
| 판정 | 입원 권장 |
| TOP 위험 파일 | `frontend/src/routes/admin.tsx`, `UserController.java`, `public/index.php` |
| 안전 프로젝트 | 핵심 룰 오탐 0 |

안전 코드 위주로 보이지 않도록 실제 서비스 흐름에 가까운 취약 코드 묶음도 별도 QA로 추가했습니다.

| 시나리오 | 기대 룰 | 탐지 라벨 | 판정 | 누락 |
| --- | ---: | ---: | --- | --- |
| Node/React 관리자 라우터 | 29 | 33 | 입원 권장 | 0 |
| Spring 레거시 컨트롤러 | 13 | 15 | 입원 권장 | 0 |
| Flask 리포트 API | 19 | 22 | 입원 권장 | 0 |
| PHP CMS 업로드 | 10 | 11 | 입원 권장 | 0 |
| Docker/K8s/SQL/의존성 설정 | 27 | 28 | 입원 권장 | 0 |
| 합계 | 98 | 109 | - | 0 |

위 5개 시나리오를 하나의 실무형 프로젝트 폴더처럼 합쳐 `enterprise/...` 경로를 유지한 payload로도 다시 검증했습니다. 시나리오별 기대 룰 합계는 98개지만, 중복 Rule ID를 제거한 프로젝트 단위 기대 라벨은 97개입니다.

| 항목 | 결과 |
| --- | --- |
| 고유 기대 Rule ID | 97개 |
| 탐지된 기대 Rule ID | 97개 |
| 누락 Rule ID | 0개 |
| 총 finding | 122개 |
| 프로젝트 점수/판정 | 0점, `입원 권장` |
| 파일 요약 | 전체 17개, 취약 파일 14개, 안전 파일 3개 |
| 안전 파일 결과 | `health.ts`, `SafeRepository.java`, `safe-deployment.yaml` finding 0 |
| TOP 위험 파일 | `frontend/src/routes/admin.tsx`, `services/report.py`, `LegacyAdminController.java`, `public/admin.php`, `infra/deployment.yaml` |
| 프로젝트 트리 | `apps`, `backend`, `enterprise`, `infra` 루트와 하위 경로 생성 확인 |
| 리포트 | HTML 리포트에 우선 조치와 위험 파일 TOP5 포함 |

오늘 추가 API QA에서는 같은 실무형 폴더 payload로 `lineContext`, `analyzerStatuses`, HTML 리포트의 외부 분석기 상태와 코드 컨텍스트 포함 여부까지 확인했습니다.

직접 라벨링한 realistic benchmark를 별도로 추가해 취약 케이스와 안전 케이스를 같은 비중으로 검증했습니다. 이 benchmark는 실제 오픈소스 데이터셋은 아니며, 서비스형 코드 흐름을 흉내 낸 독립 QA 레이어입니다.

| 항목 | 결과 |
| --- | --- |
| 케이스 수 | positive 5개, negative 5개 |
| 기대 취약 라벨 | 57개 |
| 탐지된 기대 라벨 | 57개 |
| 금지 라벨 | 57개 |
| 금지 라벨 오탐 | 0개 |
| Precision / Recall | 100% / 100% |
| FPR / FNR | 0% / 0% |

## 브라우저 QA 결과

`http://localhost:5174/`에서 실제 사용자 흐름으로 검증했습니다.

| 항목 | 결과 |
| --- | --- |
| 첫 화면 지표 | 166개 활성 룰, 332개 샘플 검증, Docker/K8s 표시 확인 |
| 코드 붙여넣기 | Node/React 변형 코드가 `PastedCode.js`로 정상 추론 |
| 분석 실행 | 성공 |
| Node/React 변형 룰 | 9/9 탐지 |
| 혼합 문맥 붙여넣기 | KISA 룰 4/4 탐지 |
| 안전 문맥 붙여넣기 | `건강함`, 금지 룰 0개 |
| 결과 검색/필터 | `JS-KISA-008` 검색 시 1/26개 표시, HIGH 필터 동작 |
| 새 분석 필터 초기화 | 취약 분석 후 검색 상태에서 안전 분석 실행 시 0/0개와 전체 필터로 초기화 |
| 다중 취약 코드 붙여넣기 | Node/React 27건, Flask 17건, PHP 10건, 신규 JWT/cookie 혼합 샘플 10/10 탐지 |
| 결과 화면 고도화 | 취약 샘플 분석 후 `#checkup-dashboard` 이동, 결과 배너/severity chip/우선 조치/감점 내역/리포트 카드 표시 |
| 검증률/외부 분석기 패널 | `룰셋 신뢰도 지표`, `Semgrep`, curated QA 수치 표시 확인 |
| finding 전후 라인 | 상세 finding 열기 후 `탐지 근거 · 전후 라인`, 실제 탐지 라인 marker 표시 확인 |
| 진단서 미리보기 | 미리보기 모달 열기/닫기 정상, 콘솔 에러 0 |
| 파일별 결과 화면 | `취약 파일 드릴다운`, `프로젝트 구조`, 파일 행 선택 시 `현재 이 파일만 보는 중` 표시 |
| 콘솔 에러 | 0개 |
| 스크린샷 | `docs/screenshots/dashboard.png` 갱신 |

브라우저 QA 중 `process.env`가 같은 파일에 있을 때 `GEN_SECRET_001`이 과하게 safe 처리되어 하드코딩 키를 놓치는 문제를 발견했고, `GEN_SECRET_001`의 safe pattern을 줄여 수정했습니다.

추가 변형 QA 중 `createReadStream`을 named import로 가져와 직접 호출하는 경우 `NODE_PATH_001`이 빠질 수 있어 `readFile/createReadStream/createWriteStream/writeFile` 직접 호출 패턴을 보강했습니다. 또한 붙여넣기 모드에서 `import express from ...` 형태의 Node 코드가 Python으로 추론되던 문제를 수정했습니다.

정밀 QA 중 safe pattern이 파일 전체에 적용되어 같은 파일의 취약 코드가 가려질 수 있는 구조를 발견했고, Python 테스트 러너와 Spring 룰 실행기를 매칭 근거 단위 safe 판정으로 수정했습니다. 이 과정에서 KISA SSRF 변수명 미탐, 리다이렉트/SSRF/React/K8s 오탐, 레거시 XSS sanitizer 오탐도 함께 보정했습니다.

이번 브라우저/API QA에서는 Python `cursor.execute("...%s", (...))` 파라미터 바인딩이 기본 SQL 룰에 오탐되는 문제와 `escape-html`의 `escape()`가 deprecated API로 오탐되는 문제를 추가로 발견했습니다. 두 항목 모두 Spring 룰을 보정하고 JUnit 회귀 테스트를 추가했습니다.

현실형 취약 QA 중 Flask `send_file("/base/" + request.args.get("name"))` 형태의 경로 조작을 놓치는 문제가 발견되어 `PY_PATH_001`의 직접 인자 사용 패턴을 보강했습니다.

추가 룰 보강 QA 중 정규식 매칭이 파일 첫 글자에서 시작될 때 백엔드가 500을 반환할 수 있는 `lineAt` 경계값 오류를 발견해 수정했습니다. 또한 `.conf` 파일이 지원 확장자 필터에서 빠져 Nginx HSTS 설정 취약점이 프로젝트 분석에 포함되지 않는 문제를 보정했습니다.

## Semgrep 어댑터 QA

| 항목 | 결과 |
| --- | --- |
| 어댑터 구조 | `ExternalAnalyzerPort` 기반 `SemgrepExternalAnalyzer` 추가 |
| 기본 상태 | `chwiyakhaenne.semgrep.enabled=false` |
| Rule ID 매핑 | SQLi, CMDi, XSS, SSRF 계열은 기존 Rule ID로 우선 매핑 |
| 컴파일/테스트 | Backend Maven test 통과 |
| CLI smoke | 로컬 Semgrep rule smoke test 추가, 현재 환경은 Semgrep CLI 미설치로 pytest skip |
| 남은 검증 | Semgrep CLI 설치 후 오픈소스/벤치마크 프로젝트 실측 필요 |

## 아쉬운 점

| 우선순위 | 아쉬운 점 | 이유 |
| --- | --- | --- |
| P0 | 독립 오픈소스 프로젝트 기준 검증률이 아직 없음 | realistic benchmark 1차는 추가됐지만 직접 라벨링 기준이라 외부 검증셋이 필요 |
| P0 | Semgrep/CodeQL 같은 검증된 SAST 엔진의 실측 데이터 부족 | Semgrep smoke test는 준비됐지만 현재 환경에 CLI가 없어 실제 외부 엔진 결과는 아직 없음 |
| P0 | Regex 기반 문맥 판정 한계 | safe pattern은 매칭 근거 단위로 개선했지만, 함수/데이터플로우 단위 정밀도는 Semgrep/CodeQL 연동 전까지 제한적 |
| P1 | 전체 파일 뷰어 수준의 문맥 하이라이트 부족 | 전후 라인 컨텍스트는 추가됐지만, 전체 파일 뷰어와 검색/점프 UX는 아직 없음 |
| P1 | TOP 위험 파일 산정식 설명 부족 | 파일별 count와 riskScore 기준이 UI에서 더 명확해질 여지가 있음 |
| P1 | GitHub private/auth/PR 흐름 미구현 | 공개 저장소 ZIP MVP는 가능하지만 실제 개발 협업 흐름까지는 아직 부족 |
| P1 | 의존성 취약점은 설정 패턴 수준 | 실제 CVE DB, Snyk, OWASP Dependency Check 연동이 필요 |
| P1 | 붙여넣기 언어 수동 선택 없음 | 자동 추론을 보강했지만 사용자가 직접 JS/TS/Python을 지정하는 UX가 있으면 신뢰도가 더 높아짐 |
| P2 | 모바일 QA가 부족함 | 현재 데스크톱 중심으로 확인했으며 작은 화면의 결과 리스트 사용성은 별도 점검 필요 |
| P2 | 리포트 배포 구조는 아직 로컬 중심 | 브라우저 인쇄 기반 PDF 출력은 가능하지만 서버 사이드 PDF 생성, 공유 링크, 템플릿 버전 관리는 필요 |
| P2 | 사용자별 이력은 localStorage 수준 | TiDB/JWT 연동 전까지는 실제 서비스 이력 관리라고 보기 어려움 |

## 다음 작업 제안

1. OWASP Benchmark 또는 실제 취약 오픈소스 샘플을 넣어 룰별 Precision/Recall 재측정
2. Semgrep CLI 설치 후 smoke test와 실제 프로젝트 기준 Rule ID 매핑 품질 측정
3. finding 전체 파일 뷰어, 라인 점프, diff 스타일 수정 예시 추가
4. GitHub private repository 인증과 PR 코멘트 구조 추가
5. Dependency Check/Snyk 계열 연동 구조 추가
