# KISA JavaScript 시큐어코딩 룰 매핑

이 문서는 `취약했네` JS 분석 엔진의 1차 룰셋을 KISA JavaScript 시큐어코딩 가이드 항목에 매핑한 기준표입니다.

- 기준 문서: JavaScript 시큐어코딩 가이드 2023년 개정본
- KISA 공식 게시물: <https://www.kisa.or.kr/2060204/form?cPage=1&lang_type=KO&postSeq=14&searchText=&searchType=>
- 전체 항목 수: 42개
- 현재 구현 룰 수: 32개
- KISA Coverage: 32 / 42 = 76.19%
- 검증 샘플: positive 32개, negative 32개
- OWASP 추가 룰: 11개
- 전체 샘플: 86개(KISA 64개 + OWASP 추가 22개)
- 현재 샘플 기준 Precision / Recall: 100% / 100%

## 구현 상태 기준

| 상태 | 의미 |
| --- | --- |
| 구현됨 | `backend/rules/kisa_js_rules.json`에 룰 정의가 있고 positive/negative 자동 검증 샘플이 존재 |
| 미구현 | KISA 항목은 확인했지만 이번 1차 JS 룰셋 범위에는 포함하지 않음 |
| 추후검토 | 항목 의미가 넓거나 다른 룰과 일부 중복되어 데이터플로우/프레임워크 분석 설계 후 구현 예정 |

## 전체 KISA 항목 매핑

| No | KISA 분류 | KISA 항목 | 상태 | Rule ID | CWE | Severity | 비고 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 입력데이터 검증 및 표현 | SQL 삽입 | 구현됨 | JS-KISA-001 | CWE-89 | HIGH | 동적 SQL 문자열 결합 탐지 |
| 2 | 입력데이터 검증 및 표현 | 코드 삽입 | 구현됨 | JS-KISA-002 | CWE-94 | HIGH | eval, Function, vm 실행 계열 탐지 |
| 3 | 입력데이터 검증 및 표현 | 경로 조작 및 자원 삽입 | 구현됨 | JS-KISA-003 | CWE-22 | HIGH | 외부 입력 기반 파일 경로 접근 탐지 |
| 4 | 입력데이터 검증 및 표현 | 크로스사이트 스크립트(XSS) | 구현됨 | JS-KISA-004 | CWE-79 | HIGH | HTML 응답/DOM 삽입 탐지 |
| 5 | 입력데이터 검증 및 표현 | 운영체제 명령어 삽입 | 구현됨 | JS-KISA-005 | CWE-78 | HIGH | child_process exec/shell 실행 탐지 |
| 6 | 입력데이터 검증 및 표현 | 위험한 형식 파일 업로드 | 구현됨 | JS-KISA-006 | CWE-434 | MEDIUM | multer 검증 누락 탐지 |
| 7 | 입력데이터 검증 및 표현 | 신뢰되지 않은 URL주소로 자동접속 연결 | 구현됨 | JS-KISA-016 | CWE-601 | MEDIUM | res.redirect/location 기반 Open Redirect 탐지 |
| 8 | 입력데이터 검증 및 표현 | 부적절한 XML 외부 개체 참조 | 구현됨 | JS-KISA-017 | CWE-611 | HIGH | libxmljs/xml 파서 외부 엔티티 옵션 탐지 |
| 9 | 입력데이터 검증 및 표현 | XML 삽입 | 미구현 | - | CWE-91 | - | XML 생성/쿼리 컨텍스트 분석 필요 |
| 10 | 입력데이터 검증 및 표현 | LDAP 삽입 | 구현됨 | JS-KISA-018 | CWE-90 | HIGH | LDAP filter 문자열 결합 탐지 |
| 11 | 입력데이터 검증 및 표현 | 크로스사이트 요청 위조(CSRF) | 미구현 | - | CWE-352 | - | Express 미들웨어/토큰 검증 분석 필요 |
| 12 | 입력데이터 검증 및 표현 | 서버사이드 요청 위조 | 구현됨 | JS-KISA-007 | CWE-918 | HIGH | 외부 입력 URL 서버 측 호출 탐지 |
| 13 | 입력데이터 검증 및 표현 | 보안기능 결정에 사용되는 부적절한 입력값 | 구현됨 | JS-KISA-019 | CWE-807 | HIGH | req.body/query 권한 결정 탐지 |
| 14 | 보안기능 | 적절한 인증 없는 중요 기능 허용 | 구현됨 | JS-KISA-020 | CWE-306 | HIGH | 중요 라우트 인증 미들웨어 누락 탐지 |
| 15 | 보안기능 | 부적절한 인가 | 구현됨 | JS-KISA-021 | CWE-285 | HIGH | IDOR형 findById 후 소유자 검증 누락 탐지 |
| 16 | 보안기능 | 중요한 자원에 대한 잘못된 권한 설정 | 미구현 | - | CWE-732 | - | 파일/클라우드 권한 API 분석 필요 |
| 17 | 보안기능 | 취약한 암호화 알고리즘 사용 | 구현됨 | JS-KISA-009 | CWE-327 | MEDIUM | MD5, SHA-1, DES, RC4 계열 탐지 |
| 18 | 보안기능 | 암호화되지 않은 중요정보 | 추후검토 | - | CWE-311 | - | 저장/전송 컨텍스트 구분 필요 |
| 19 | 보안기능 | 하드코드된 중요정보 | 구현됨 | JS-KISA-008 | CWE-798 | HIGH | secret/token/password 문자열 선언 탐지 |
| 20 | 보안기능 | 충분하지 않은 키 길이 사용 | 구현됨 | JS-KISA-022 | CWE-326 | MEDIUM | RSA 1024 이하/짧은 비밀키 탐지 |
| 21 | 보안기능 | 적절하지 않은 난수 값 사용 | 구현됨 | JS-KISA-023 | CWE-330 | HIGH | Math.random 기반 토큰/OTP 생성 탐지 |
| 22 | 보안기능 | 취약한 패스워드 허용 | 미구현 | - | CWE-521 | - | 정책/검증 로직 분석 필요 |
| 23 | 보안기능 | 부적절한 전자서명 확인 | 미구현 | - | CWE-347 | - | 서명 검증 API 샘플 필요 |
| 24 | 보안기능 | 부적절한 인증서 유효성 검증 | 구현됨 | JS-KISA-024 | CWE-295 | HIGH | rejectUnauthorized false/NODE_TLS_REJECT_UNAUTHORIZED 탐지 |
| 25 | 보안기능 | 사용자 하드디스크에 저장되는 쿠키를 통한 정보 노출 | 구현됨 | JS-KISA-025 | CWE-539 | MEDIUM | session/token cookie 보안 속성 누락 탐지 |
| 26 | 보안기능 | 주석문 안에 포함된 시스템 주요정보 | 구현됨 | JS-KISA-026 | CWE-615 | MEDIUM | 주석 내 secret/token/API key 탐지 |
| 27 | 보안기능 | 솔트 없이 일방향 해쉬 함수 사용 | 구현됨 | JS-KISA-027 | CWE-759 | MEDIUM | password createHash 직접 사용 탐지 |
| 28 | 보안기능 | 무결성 검사없는 코드 다운로드 | 구현됨 | JS-KISA-028 | CWE-494 | HIGH | 원격 코드 다운로드 후 무결성 검증 누락 탐지 |
| 29 | 보안기능 | 반복된 인증시도 제한 기능 부재 | 구현됨 | JS-KISA-029 | CWE-307 | MEDIUM | 로그인 라우트 rate limit 누락 탐지 |
| 30 | 시간 및 상태 | 종료되지 않는 반복문 또는 재귀 함수 | 구현됨 | JS-KISA-030 | CWE-835 | LOW | while(true)/for(;;)/무조건 재귀 탐지 |
| 31 | 에러처리 | 오류 메시지 정보노출 | 구현됨 | JS-KISA-010 | CWE-209 | MEDIUM | err.stack/message 응답 노출 탐지 |
| 32 | 에러처리 | 오류상황 대응 부재 | 구현됨 | JS-KISA-031 | CWE-390 | LOW | err 단순 return/빈 catch 탐지 |
| 33 | 에러처리 | 부적절한 예외 처리 | 구현됨 | JS-KISA-032 | CWE-248 | LOW | 빈 catch/console만 수행하는 catch 탐지 |
| 34 | 코드오류 | Null Pointer 역참조 | 구현됨 | JS-KISA-011 | CWE-476 | LOW | 외부 입력 객체 연쇄 접근 탐지 |
| 35 | 코드오류 | 부적절한 자원 해제 | 미구현 | - | CWE-772 | - | stream/db connection close 분석 필요 |
| 36 | 코드오류 | 신뢰할 수 없는 데이터의 역직렬화 | 구현됨 | JS-KISA-015 | CWE-502 | HIGH | node-serialize/yaml.load 계열 탐지 |
| 37 | 캡슐화 | 잘못된 세션에 의한 데이터 정보 노출 | 미구현 | - | CWE-488 | - | 세션/캐시 컨텍스트 분석 필요 |
| 38 | 캡슐화 | 제거되지 않고 남은 디버그 코드 | 구현됨 | JS-KISA-012 | CWE-489 | LOW | debugger, console 디버그 출력 탐지 |
| 39 | 캡슐화 | Public 메소드로부터 반환된 Private 배열 | 미구현 | - | CWE-495 | - | 클래스/캡슐화 분석 필요 |
| 40 | 캡슐화 | Private 배열에 Public 데이터 할당 | 미구현 | - | CWE-496 | - | 클래스/캡슐화 분석 필요 |
| 41 | API 오용 | DNS lookup에 의존한 보안결정 | 구현됨 | JS-KISA-014 | CWE-350 | MEDIUM | dns.lookup 결과 기반 if 탐지 |
| 42 | API 오용 | 취약한 API 사용 | 구현됨 | JS-KISA-013 | CWE-676 | MEDIUM | document.write, 문자열 timer, localStorage token 탐지 |

## 검증 지표 산식

| 지표 | 산식 | 현재 값 |
| --- | --- | --- |
| KISA Coverage | 구현 룰 수 / KISA 전체 항목 수 | 32 / 42 = 76.19% |
| Detection Count | 샘플셋에서 발생한 전체 finding 수 | 32 |
| Precision | TP / (TP + FP) | 100% |
| Recall | TP / (TP + FN) | 100% |
| False Positive Rate | negative 샘플 중 탐지 발생 파일 수 / negative 샘플 수 | 0% |
| False Negative Rate | positive 샘플 중 기대 룰 미탐 수 / positive 샘플 수 | 0% |

현재 지표는 `tests/samples`의 curated 샘플셋 기준입니다. 실제 프로젝트 탐지율을 주장하려면 OWASP Benchmark 또는 사내 라벨링 데이터셋 같은 독립 검증셋이 추가로 필요합니다.

## OWASP 추가 룰

KISA 1차 룰셋 외에 OWASP 공식 Cheat Sheet와 Top 10 계열 문서를 참고해 JS/Node 프로젝트에서 자주 보이는 항목 11개를 추가했습니다.

| Rule ID | 항목 | 기준 | CWE | Severity | 상태 |
| --- | --- | --- | --- | --- | --- |
| JS-OWASP-001 | Prototype Pollution | OWASP Prototype Pollution Prevention Cheat Sheet | CWE-1321 | HIGH | 구현됨 |
| JS-OWASP-002 | 정규식 서비스 거부(ReDoS) | OWASP Regular expression Denial of Service - ReDoS | CWE-1333 | MEDIUM | 구현됨 |
| JS-OWASP-003 | 과도하게 허용된 CORS 정책 | OWASP Node.js Security Cheat Sheet | CWE-942 | MEDIUM | 구현됨 |
| JS-OWASP-004 | TLS 인증서 검증 비활성화 | OWASP Node.js Security Cheat Sheet | CWE-295 | HIGH | 구현됨 |
| JS-OWASP-005 | CSRF 보호 없는 상태 변경 라우트 | OWASP CSRF Prevention Cheat Sheet | CWE-352 | MEDIUM | 구현됨 |
| JS-OWASP-006 | NoSQL Injection | OWASP NoSQL Security Cheat Sheet | CWE-943 | HIGH | 구현됨 |
| JS-OWASP-007 | JWT 검증 우회 위험 | OWASP JWT Cheat Sheet / WSTG | CWE-347 | HIGH | 구현됨 |
| JS-OWASP-008 | Mass Assignment | OWASP Mass Assignment Cheat Sheet | CWE-915 | MEDIUM | 구현됨 |
| JS-OWASP-009 | URL에 포함된 민감정보 | OWASP Session/Logging guidance | CWE-598 | MEDIUM | 구현됨 |
| JS-OWASP-010 | postMessage 와일드카드 대상 | OWASP HTML5/DOM XSS guidance | CWE-346 | MEDIUM | 구현됨 |
| JS-OWASP-011 | Server-Side Template Injection | OWASP WSTG SSTI | CWE-1336 | HIGH | 구현됨 |

## 다언어 카탈로그 확장

사용자가 제공한 Java, Python, PHP, Node.js/TypeScript, React, SQL, Generic 룰에서 출발해 Spring/Django/Node 운영 설정, Docker/Kubernetes/의존성 설정, 공급망/클라우드/CI 위험까지 확장한 123개 룰은 `backend/rules/secure_coding_rules.json`에 별도 카탈로그로 관리합니다. 이 카탈로그는 KISA 분류, OWASP Top 10, CWE를 함께 보존하며 Spring Boot의 `CatalogSecurityRule`에서 로드합니다.

| 범위 | 구현 룰 수 | Positive 샘플 | Negative 샘플 | 샘플 기준 Precision | 샘플 기준 Recall |
| --- | --- | --- | --- | --- | --- |
| Java | 18 | 18 | 18 | 100% | 100% |
| Python | 22 | 22 | 22 | 100% | 100% |
| PHP | 13 | 13 | 13 | 100% | 100% |
| JavaScript/TypeScript/React | 25 | 25 | 25 | 100% | 100% |
| SQL | 5 | 5 | 5 | 100% | 100% |
| Dockerfile | 4 | 4 | 4 | 100% | 100% |
| Generic/Config | 36 | 36 | 36 | 100% | 100% |
| Total | 123 | 123 | 123 | 100% | 100% |

검증 명령:

```bash
python3 -m pytest tests/test_secure_coding_catalog.py
python3 tests/catalog_security_metrics.py
```

주의: 다언어 카탈로그 지표 역시 curated bad/good 예제 기준입니다. 실제 프로젝트 검증률은 독립 벤치마크 프로젝트와 외부 SAST 연동 결과로 분리 산정해야 합니다.
