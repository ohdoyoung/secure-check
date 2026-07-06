# Analyzer Layer

Spring Boot MVP 엔진은 `src/main/java/com/chwiyakhaenne/analyzer`에 구현되어 있습니다.

- `AnalyzerEngine`: 분석 엔진 교체를 위한 진입 인터페이스
- `StaticRuleAnalyzer`: 현재 MVP 정규식 기반 분석기
- `port/ExternalAnalyzerPort`: Semgrep, SonarQube, CodeQL 같은 외부 SAST 도구 연결 포트
- `port/DependencyScannerPort`: OWASP Dependency Check, Snyk 연결 포트

이 폴더는 포트폴리오 문서용 구조이며, 향후 Python 기반 룰 엔진이나 외부 스캐너 프로세스를 붙일 때 어댑터를 둘 위치입니다.

## KISA JS 룰 러너

- `kisa_js_analyzer.py`: `backend/rules/kisa_js_rules.json`을 읽는 1차 JavaScript 룰 러너
- 탐지 방식: Regex + 간단 AST 신호(call/member/assignment) 혼합
- 검증: `tests/test_kisa_js_rules.py`, `tests/kisa_js_metrics.py`
- 향후 연동: Spring `ExternalAnalyzerPort`에서 별도 프로세스로 호출하거나 Semgrep/CodeQL adapter로 교체
