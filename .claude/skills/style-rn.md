---
description: "rn (React Native) 템플릿 스타일 가이드. /card-news 파이프라인에서 rn 스타일 선택 시 자동 호출"
---

# rn (React Native) 스타일 가이드

- **스타일**: React Native 개발 튜토리얼형
- **배경**: 시안(#00BCD4) 좌 / 화이트(#FFFFFF) 우 스플릿 레이아웃
- **느낌**: 개발자 감성, 기술적, 모던, 코드 중심
- **기본 악센트**: `#00BCD4` (시안)
- **폰트**: JetBrains Mono (모노스페이스)
- **해상도**: 1080x1350px (Instagram 세로형)
- **추천 주제**: React Native 튜토리얼, 모바일 개발, TypeScript, 개발 팁

## 고유 특징

- CSS clip-path 스플릿 컬러 기법
- React 원자 아이콘
- One Dark Pro 코드블럭 (`content-code` 타입)
- 헤더: `@계정명` 좌 + `#ReactNative #TypeScript` 우 (전 슬라이드 통일)
- 페이지 번호: 우측 하단

---

## rn 전용 슬라이드 타입

공통 14종 외에 rn에서만 사용 가능한 전용 타입:

| 타입 | 사용 시점 | 필드 |
|---|---|---|
| `content-code` | 코드 예시 + 설명 | `headline`, `code_filename`, `code_body`, `body` |
| `content-install` | 개념 설명 + 플로우 + 설치법 | `headline`, `body`, `code_body`, `badge_text` |
| `content-table` | Before/After 3컬럼 비교 표 | `headline`, `subtext` (테이블 내용은 HTML 하드코딩) |
| `content-code-desc` | 설명 박스 + 코드블럭 + 노트 | `headline`, `badge_text` (설명), `code_filename`, `code_body`, `body` |
| `content-grid-table` | 4-grid 요약 + 비교 표 | `headline`, `grid1~4_icon/title/desc` |

---

## rn 렌더링 규칙 (필수)

1. **코드블럭 One Dark 테마**: `code_body` 필드에 `<span class='t-kw'>`, `<span class='t-fn'>` 등의 HTML 토큰을 사용하여 구문 강조. 직접 JSON에 HTML 삽입 (render.js는 code_body를 변환하지 않음)

2. **마지막 팔로우/구독 페이지 생성 금지**: `cta` 타입 (팔로우하기, 저장하기 등) 슬라이드를 생성하지 않음. 마지막 슬라이드는 요약 또는 핵심 내용으로 마무리

3. **빈 공간 제한**: 한 페이지 내 빈 공간이 페이지 절반(50%) 이상 차지하면 안됨. 내용이 부족할 경우 설명 박스, 주의사항 박스, 비교 표 등을 추가

4. **slide-label 크기**: 모든 content 템플릿에서 20px (헤드라인과 주석 텍스트의 시각적 구분 강화)

5. **body 인라인 HTML 텍스트 크기**: 설명 박스 본문 22px, 서브텍스트 20px 권장

6. **비교표 컬럼 색상 코딩**:
   - 항목 컬럼: `background:#F0F4F8`, `color:{{accent_color}}`
   - before 컬럼: `background:#FFF5F5`, `color:#C53030`
   - after 컬럼: `background:#F0FFF4`, `color:#276749`
   - 행 교차(even): `#E4ECF4` / `#FFEDED` / `#E6FFF0`
   - 헤더: th-cat `#21252b` / th-before `#2d1f21` / th-after `#1a2b1f`

7. **content-install feature-badges**: 플로우 박스 아래 pill 배지 행 추가로 빈 공간 채움. 이모지 없이 텍스트만 사용

---

## rn 폰트 크기 표준

| 요소 | 크기 |
|---|---|
| slide-label | 20px |
| body 인라인 HTML 본문 | 22px |
| body 인라인 HTML 서브텍스트 | 20px |
| content-install body-text | 30px |
| content-install flow-item | 21px |
| content-install flow-badge | 19px |
| content-install feature-badge | 20px |
| content-install code-body | 28px |
| content-install note | 21px |

---

## One Dark Pro 토큰 클래스

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
