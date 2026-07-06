# 취약했네 UX QA 및 다음 작업 계획

## 사용자 관점 점검

사용자가 처음 보는 화면에서 기대하는 만족감은 “코드를 넣으면 곧바로 건강검진 결과를 받는다”와 “이 결과가 어떤 기준으로 나온 건지 믿을 수 있다”입니다. 현재 MVP는 업로드 방식과 결과 시각화는 갖췄지만, 신뢰 근거와 실제 검증률의 의미를 더 선명하게 보여줘야 합니다.

## 이번 보강

| 구분 | 조치 | 상태 |
| --- | --- | --- |
| 룰 신뢰도 | KISA JS 32개, OWASP 11개, 다언어 123개를 합산해 166개 활성 룰로 표시 | 완료 |
| 샘플 검증 | JS KISA/OWASP 86개 + 다언어 카탈로그 246개 = 총 332개 샘플 검증 지표 표시 | 완료 |
| 다언어 체감 | Java, Python, PHP, Node/TS, SQL, Generic 룰 탐지 수를 결과 대시보드에서 분리 | 완료 |
| 파일 지원 | `.php`, `.sql` 업로드/언어 추론 지원 추가 | 완료 |
| QA 자동화 | 다언어 룰 카탈로그 positive/negative pytest와 metric 스크립트 추가 | 완료 |
| 결과 탐색 | 수정 우선순위 보드, finding 검색, 심각도/룰 계열 필터, 우선순위 정렬, 파일 drill-down, 새 분석 시 필터 초기화 | 완료 |
| 외부 SAST 구조 | Semgrep 어댑터 1차 구현, 기본 비활성, Rule ID 매핑 구조 추가 | 완료 |
| 취약 코드 중심 QA | Node/React, Spring, Flask, PHP, Infra 취약 시나리오 5개 추가 | 완료 |
| 추가 운영 설정 룰 | Spring Actuator/H2/permitAll/error/shutdown, Django cookie/hosts/debug/CSRF, Node JWT/cookie/eval/rate limit/body limit/session store/Helmet, HSTS, K8s hostPath/hostNetwork/권한상승/latest/token automount, Docker remote ADD/curl-bash, Nginx/Terraform/GitHub Actions 보강 | 완료 |
| realistic benchmark | positive 5개, negative 5개, 기대 라벨 57/57 탐지와 금지 라벨 0/57 오탐 metric 추가 | 완료 |
| Semgrep smoke | Semgrep CLI 설치 환경에서 로컬 rule 기반 SQLi/CMDi 매핑을 검증하는 smoke test 추가 | 완료 |
| 결과 화면 고도화 | 취약 파일 드릴다운, 먼저 볼 항목, 탐지 근거, 왜 탐지됐나, 수정 예시/권장 조치 연결 | 완료 |
| 진단 완료 이동 UX | 완료 배너, 결과 섹션 하이라이트, `#checkup-dashboard` 앵커 이동, severity/감점 요약 표시 | 완료 |
| GitHub URL 분석 | 공개 GitHub 저장소를 GitHub API/raw 파일 reader로 읽어 기존 프로젝트 건강검진 흐름으로 분석 | 완료 |
| 검증률 패널 | KISA 커버리지, 활성 룰, 샘플 검증 수, curated Precision/Recall을 결과 화면에 표시 | 완료 |
| 외부 분석기 상태 | Semgrep 활성/설치/탐지 수와 메시지를 API, UI, HTML 리포트에 표시 | 완료 |
| 진단서 UX | HTML 리포트 미리보기 모달과 브라우저 인쇄 기반 PDF 출력 버튼 추가 | 완료 |
| 업로드 진단 | ZIP/폴더/GitHub 업로드 시 전체/분석 포함/제외 파일 수 표시 | 완료 |
| 이력 추세 | 같은 프로젝트의 검사 횟수, 평균 점수, 이전 검사 대비 점수/취약점 변화 표시 | 완료 |
| 코드 근거 | finding 전후 라인 컨텍스트와 실제 탐지 라인 marker 표시 | 완료 |

## 사용 만족도 기준

| 항목 | 판단 기준 | 현재 상태 |
| --- | --- | --- |
| 첫 인상 | 포트폴리오용 데모가 아니라 기준 기반 진단 도구처럼 보이는가 | 개선됨 |
| 조작감 | 붙여넣기, 파일, ZIP, 폴더 업로드가 명확한가 | 양호 |
| 결과 납득도 | 점수, 심각도, 룰 ID, CWE, 탐지 근거, 권장 조치가 한 화면에서 연결되는가 | 개선됨 |
| 신뢰도 | 검증 기준, 샘플 수, 오탐/미탐 한계가 보이는가 | 개선됨 |
| 확장성 | Semgrep, CodeQL, Dependency Scanner 연결 계획이 구조에 남아 있는가 | 양호 |

## 부족한 점과 다음 작업

| 우선순위 | 작업 | 이유 |
| --- | --- | --- |
| P0 | 실제 취약 오픈소스/OWASP Benchmark 프로젝트로 룰별 Precision/Recall 재측정 | realistic benchmark는 직접 라벨링 기준이라 외부 검증셋 수치가 필요 |
| P0 | Semgrep CLI 설치 후 실제 프로젝트 실측 QA | smoke test는 준비됐지만 현재 환경에는 Semgrep CLI가 없어 skipped 상태 |
| P0 | Docker/Kubernetes/의존성 설정 룰을 실제 레포 샘플로 재검증 | 프로젝트 전체 건강검진 범위의 오탐률을 낮추기 위함 |
| P1 | GitHub private repository 인증과 PR 코멘트 | “프로젝트 전체 건강검진”을 실제 개발 흐름으로 확장 |
| P1 | 의존성 파일 분석 `package.json`, `requirements.txt`, `pom.xml`, `build.gradle` | 코드 취약점과 라이브러리 취약점을 함께 보는 포트폴리오 가치 상승 |
| P1 | 붙여넣기 언어 수동 선택 | 자동 추론 실패 시 사용자가 직접 JS/TS/Python을 선택할 수 있어야 신뢰감이 높아짐 |
| P1 | 전체 파일 뷰어와 라인 점프 | 전후 라인은 추가됐지만 파일 전체 문맥에서 finding 사이를 이동하는 UX가 있으면 더 좋음 |
| P2 | 서버 사이드 PDF와 공유 링크 | 브라우저 인쇄 PDF는 가능하지만 제출/공유 경험을 더 안정화해야 함 |
| P2 | TiDB 검사 이력 저장 | 사용자별 추적과 점수 변화 그래프의 실제화 |

## QA 시나리오

1. 취약한 JavaScript/TypeScript 코드를 붙여넣고 `JS-KISA-*`, `JS-OWASP-*`, `NODE_*`, `GEN_*` 룰이 함께 표시되는지 확인한다.
2. Java, Python, PHP, SQL 파일을 API에 프로젝트 단위로 넣고 다언어 카탈로그 룰이 탐지되는지 확인한다.
3. Negative 샘플은 해당 룰로 탐지되지 않는지 pytest로 확인한다.
4. 결과 화면에서 `활성 룰 166개`, `샘플 검증 332개`, `다언어 탐지` 지표가 보이는지 확인한다.

## 이번 QA 결과

| QA | 결과 |
| --- | --- |
| pytest 전체 | 22 passed, 1 skipped |
| KISA JS metrics | Coverage 76.19%, Precision 100%, Recall 100%, FPR 0%, FNR 0% |
| 다언어 catalog metrics | Rule 123개, Detection 123, Precision 100%, Recall 100%, FPR 0%, FNR 0% |
| realistic benchmark metrics | 10개 케이스, expected label 57/57, forbidden label 오탐 0/57 |
| 변형 샘플 자동 QA | positive 변형 28개 탐지, negative 변형 13개 미탐지 |
| 혼합 문맥 정밀 QA | 안전 코드와 취약 코드가 같은 파일에 있을 때 11/11 탐지, 안전 문맥 finding 0 |
| Spring Boot build/test | 15 tests, BUILD SUCCESS |
| Frontend build | BUILD SUCCESS |
| API 다언어 취약 프로젝트 | 기대 catalog rule 123/123 탐지, 누락 0 |
| API 다언어 변형 프로젝트 | 기대 variant rule 28/28 탐지, 누락 0 |
| API 프로젝트형 QA | 기대 룰 37/37 탐지, 안전 프로젝트 핵심 룰 오탐 0 |
| API 실무형 폴더 프로젝트 | 고유 기대 룰 97/97 탐지, 총 finding 122개, 파일 요약 17개, 취약 파일 14개, 안전 파일 3개 finding 0 |
| 브라우저 붙여넣기 QA | Node/React 직접 작성 샘플 26 findings, `JS-KISA-008` 검색 1/26, 안전 문맥 0/0, 콘솔 에러 0 |
| 결과 화면 고도화 QA | 취약 샘플 분석 후 `#checkup-dashboard` 이동, 결과 배너/severity chip/우선 조치/감점 내역/리포트 카드/파일별 드릴다운/프로젝트 구조 표시, 파일 행 선택 동작, 콘솔 에러 0 |
| 2026-06-23 UI QA | 검증률 패널, Semgrep 상태, finding 전후 라인, 진단서 미리보기 모달, 콘솔 에러 0 |
| 2026-06-23 API QA | 현실형 단일 케이스 finding 22개, 실무형 폴더 프로젝트 고유 기대 룰 97/97, `lineContext`/`analyzerStatuses`/HTML 리포트 근거 확인 |
| 현실형 취약 QA | 5개 시나리오 기대 룰 98/98 탐지, 브라우저 취약 붙여넣기 27/17/10건 + 신규 JWT/cookie 혼합 10/10 |
| Semgrep CLI smoke | 현재 환경 Semgrep CLI 미설치로 skip, 설치 환경에서는 `NODE_SQLI_001`/`NODE_CMDI_001` 매핑 검증 |

이번 변형 QA에서 `createReadStream` named import 직접 호출과 Node `import ... from` 붙여넣기 언어 추론 누락을 발견해 수정했습니다.

추가 정밀 QA에서 safe pattern의 파일 전체 적용으로 인한 미탐 위험을 발견해 매칭 근거 단위 판정으로 바꿨고, KISA SSRF 변수명 미탐과 React/K8s/리다이렉트 계열 오탐을 보정했습니다.

이번 QA에서는 Python 파라미터 바인딩 SQL과 `escape-html` sanitizer 사용이 각각 SQL Injection/Deprecated로 오탐되는 문제도 발견해 보정했습니다. 새 분석을 돌렸을 때 이전 검색/필터가 남아 결과가 숨겨지는 UX도 함께 수정했습니다.

추가로 취약 코드 중심 QA를 돌리면서 Flask 경로 조작 변형 미탐을 확인했고, `send_file/open` 인자 안에서 `request.args.get(...)`을 직접 결합하는 패턴까지 탐지하도록 보강했습니다.

이번 추가 보강에서는 운영 설정 취약점 12개를 더 넣으면서 API QA도 다시 돌렸습니다. 그 과정에서 파일 첫 글자 매칭 시 line 계산이 실패하는 백엔드 오류와 `.conf` 확장자 미지원으로 HSTS 설정이 누락되는 문제를 수정했습니다.

다음 단계 착수로 realistic benchmark 라벨 세트를 추가했습니다. 이 과정에서 `jwtSecret` camelCase 비밀값, `subprocess.run(..., shell=True)`, `requests.get(request.args.get(...), verify=False)` 형태의 미탐을 발견했고, 줄 단위 패턴으로 보강해 기존 혼합 문맥 QA까지 통과시켰습니다.

결과 화면 고도화 단계에서는 사용자가 어떤 파일부터 고쳐야 하는지 바로 알 수 있도록 `수정 우선순위 보드`와 `취약 파일 드릴다운`을 추가했습니다. finding 상세에는 탐지 근거, 왜 탐지됐는지, 권장 조치, 수정 예시, CWE/탐지 방식/기준 항목을 한 번에 보이게 정리했습니다.
