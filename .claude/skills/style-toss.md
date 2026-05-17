---
description: "toss 템플릿 스타일 가이드. /card-news 파이프라인에서 toss 스타일 선택 시 자동 호출"
---

# toss 스타일 가이드

- **스타일**: 토스 스타일 울트라 미니멀
- **배경**: 다크 플랫 (grey900 `#191F28`), 장식 요소 없음
- **느낌**: 미니멀, 신뢰감, 핀테크, 현대적
- **기본 악센트**: `#3182F6` (Toss Blue = TDS blue500)
- **폰트**: Pretendard
- **해상도**: 1080x1350px (Instagram 세로형)
- **추천 주제**: 금융, 테크, 비즈니스, 데이터, 생산성

## TDS 디자인 토큰 (실제 토스 디자인 시스템)

모든 toss 템플릿(`templates/toss/*.html`)은 `:root`에 아래 **실제 TDS Foundation Colors**를 정의하고 `var(--tds-*)`로 참조합니다. `style_override`에서도 그대로 사용 가능합니다.
출처: TDS Foundation Colors (tossmini-docs.toss.im/tds-react-native/foundation/colors).

| 토큰 | hex | 용도 |
|---|---|---|
| `--tds-grey-900` | `#191F28` | 배경(base) |
| `--tds-grey-800` | `#333D4B` | 보더/디바이더(다크) |
| `--tds-grey-700` | `#4E5968` | 푸터·서브틀 텍스트 |
| `--tds-grey-600` | `#6B7684` | 캡션·주석 |
| `--tds-grey-500` | `#8B95A1` | 보조 텍스트 |
| `--tds-grey-400` | `#B0B8C1` | 본문(다크)·코드 전경 |
| `--tds-blue-500` | `#3182F6` | Toss Blue / primary |
| `--tds-blue-400` | `#4593FC` | primary hover/lighter |
| `--tds-red-500` | `#F04452` | 부정/에러 |
| `--tds-red-400` | `#F66570` | 부정 시그널(다크 가독) |
| `--tds-red-300` | `#FB8890` | 부정 텍스트(다크) |
| `--tds-green-500` | `#03B26C` | 긍정/성공 |
| `--tds-green-400` | `#15C47E` | 긍정 시그널 |
| `--tds-green-300` | `#3FD599` | 긍정 시그널/텍스트(다크 가독) |

**시맨틱 매핑**: `--tds-bg`=grey900, `--tds-surface`=`#232A35`(grey900 + greyOpacity 다크 레이어드 표면), `--tds-text-strong`=`#FFFFFF`(다크 1차 텍스트), `--tds-text-weak`=grey500, `--tds-text-subtle`=grey700, `--tds-primary`=blue500.

**규칙**
- 새 색은 임의 hex 금지 → 위 TDS 토큰(`var(--tds-*)`)만 사용. 다크 틴트가 필요하면 TDS hex의 `rgba(...,0.10)` 형태로 레이어링.
- Before/문제 = red 계열, After/해결 = green 계열, 강조/브랜드 = blue 계열.
- 코드 슬라이드의 신택스 하이라이트(One Dark Pro: 키워드/문자열/함수/태그)는 코드 가독성 영역으로 TDS 적용 예외. 단 코드박스 표면·보더·시그널·전경·주석은 TDS 토큰 사용.

## 사용 가능한 슬라이드 타입

공통 14종: `cover`, `content`, `content-stat`, `content-quote`, `cta`, `content-image`, `content-steps`, `content-list`, `content-badge`, `content-split`, `content-highlight`, `content-grid`, `content-bigdata`, `content-fullimage`
