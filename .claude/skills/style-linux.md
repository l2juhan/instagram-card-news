---
description: "linux 템플릿 스타일 가이드. /card-news 파이프라인에서 linux 스타일 선택 시 자동 호출"
---

# linux 스타일 가이드

- **스타일**: Linux 정보 전달형
- **배경**: 다크 터미널 (#1A1A2E) + 격자 패턴 오버레이
- **느낌**: 터미널 감성, 테크니컬, 해커 무드
- **기본 악센트**: `#F5D838` (Tux 골든 옐로우)
- **폰트**: JetBrains Mono
- **해상도**: 1080x1080px (정사각형)
- **추천 주제**: Linux 명령어, 서버 관리, DevOps, 시스템 관리

## 고유 특징

- 골든 그라디언트 악센트 바
- 글로우 효과
- `content-code` 슬라이드 타입 지원
- **정사각형 해상도** (1080x1080px, 다른 템플릿과 다름)

## content-code 슬라이드

코드 예시를 보여줄 때 사용. `code_body` 필드에 One Dark Pro HTML 토큰을 직접 삽입합니다.

### One Dark Pro 토큰 클래스

| 클래스 | 색상 | 용도 |
|---|---|---|
| `t-kw` | `#c678dd` | 키워드: const, let, import, return, if, null |
| `t-fn` | `#61afef` | 함수명: create, persist, set, useEffect |
| `t-str` | `#98c379` | 문자열: `'auth-storage'`, 템플릿 리터럴 |
| `t-num` | `#d19a66` | 숫자 |
| `t-cm` | `#5c6370` (italic) | 주석: `// ...` |
| `t-var` | `#e06c75` | 변수/프로퍼티: accessToken, isHydrated |
| `t-op` | `#56b6c2` | 연산자: `=>`, `=` |
| `t-type` | `#e5c07b` | 타입/클래스: AsyncStorage, AuthState |
| `t-plain` | `#abb2bf` | 일반 텍스트 |

## 사용 가능한 슬라이드 타입

공통 14종 + `content-code`
