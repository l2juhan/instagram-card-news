---
description: "aws 템플릿 스타일 가이드. /card-news 파이프라인에서 aws 스타일 선택 시 자동 호출"
---

# aws 스타일 가이드

- **스타일**: AWS 서비스 소개형
- **배경**: 다크 네이비 (#232F3E) + 격자 패턴 오버레이
- **느낌**: 테크니컬, 신뢰감, 클라우드 브랜드 정체성
- **기본 악센트**: `#FF9900` (AWS 오렌지)
- **폰트**: Pretendard
- **해상도**: 1080x1350px (Instagram 세로형)
- **추천 주제**: AWS 서비스 소개, 클라우드 아키텍처, DevOps, 인프라 튜토리얼

## 고유 특징

- AWS 오렌지 악센트
- 서비스 아이콘 지원
- 다크 배경 + 글로우 효과
- `content-code` 슬라이드 타입 지원 (One Dark Pro 테마)

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
