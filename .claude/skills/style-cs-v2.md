---
description: "cs-v2 템플릿 스타일 가이드. /card-news 파이프라인에서 cs-v2 스타일 선택 시 자동 호출"
---

# cs-v2 스타일 가이드

- **스타일**: CS 교육 콘텐츠 v2. 폰에서 한눈에 읽히고, 저장·DM 공유하고 싶은 카드
- **배경**: 웜 페이퍼 `#F6F2EA` + 잉크 `#16171B`
- **느낌**: 교과서 지면, 과슈 물감, 다이어그램 중심
- **기본 악센트**: `#16171B` (render 시 `--accent "#16171B"`를 반드시 넘길 것. 생략하면 config.defaults 값이 들어간다)
- **폰트**: Pretendard Variable (jsDelivr v1.3.9) + JetBrains Mono (코드 전용)
- **해상도**: 1080x1350px (4:5)
- **추천 주제**: 네트워크, 보안, OS, 자료구조, 알고리즘 등 CS 개념 설명

> 템플릿 HTML은 `scripts/build-cs-v2.js`가 생성한다. 템플릿 수정은 빌더를 고친 뒤 `node scripts/build-cs-v2.js`로 재생성한다.

## 렌더링

```bash
node scripts/render.js --slides workspace/slides.json --style cs-v2 \
  --output output/ --accent "#16171B" --account "cse_juhan02" --series "Security" --preview
node scripts/lint-slides.js --slides workspace/slides.json --style cs-v2
```

- `--series`를 생략하면 slides.json에서 처음 나오는 `series` 필드를 전 장에 쓴다.

## 고정 프레임 (모든 장 공통)

| 영역 | 위치 | 내용 |
|---|---|---|
| 헤더 | y 56–96 | 시리즈명 (악센트 마크) · 페이지 번호 `03 / 10` |
| 콘텐츠 | x 72–1008, y 150–1180 | 슬라이드 타입별 레이아웃 |
| 진행바 | y 1206, 6px | 악센트 채움 / Rule 트랙 |
| 푸터 | y 1234–1278 | `@계정명` · 다음 화살표 (마지막 장에서는 자동 제거) |

- 좌우 **72px 여백 안**에만 텍스트와 핵심 도형을 둔다. 좌우 34px는 프로필 그리드(3:4)에서 잘린다.

## 색 토큰

### 베이스
| 토큰 | hex | 용도 |
|---|---|---|
| `--paper` | `#F6F2EA` | 배경 |
| `--surface` | `#ECE5D8` | my_note, 다음 편 예고 (그 외 사용 자제) |
| `--ink` | `#16171B` | 제목, 본문 (대비 16.0) |
| `--ink-soft` | `#4A4B53` | 보조 텍스트, 캡션 (대비 7.8) |
| `--rule` | `#CFC6B6` | 헤어라인, 진행바 트랙. **텍스트에 쓰지 않는다** |
| `--accent` | `{{accent_color}}` | 진행바 채움, 시리즈 마크 **전용** |

### 개념 토큰 (색 = 범례)
주제 속 개념에 역할을 배정하고, **한 개념은 덱 전체에서 같은 토큰**만 쓴다. 모두 paper/surface 위 글자색으로 4.5:1 이상이다.

| 클래스 | hex | 역할 | DH 예시 | TCP 예시 |
|---|---|---|---|---|
| `k-pub` | `#7A5800` | 공개된 것 | g, p, 공개색 | 포트 번호 |
| `k-a` | `#AE3226` | 주체 A 소유 | 앨리스, 비밀 a | 클라이언트 |
| `k-b` | `#1F5FA8` | 주체 B 소유 | 밥, 비밀 b | 서버 |
| `k-a2` | `#9E4A0E` | A에서 파생 | A = g<sup>a</sup> | 클라이언트 ISN |
| `k-b2` | `#2A6A3B` | B에서 파생 | B = g<sup>b</sup> | 서버 ISN |
| `k-ab` | `#6B4226` | A와 B의 결합 결과 | 공유 키 | 연결 수립 |
| `k-threat` | `#6A3491` | 공격자, 실패 | 이브, 맬로리 | SYN flood |

**사용법**
- HTML 텍스트: `<span class='k-a'>a</span>`
- SVG 도형: `class='k-a' fill='currentColor'` 또는 `stroke='currentColor'` (fill 속성에 `var()`를 직접 쓰지 말 것)
- SVG 텍스트: `class='k-a'`만 주면 된다 (기본 fill이 currentColor)
- **물감 원과 수식 변수는 같은 클래스**를 써야 한다. 직관 장과 수식 장을 시각적으로 연결하는 것이 이 스타일의 핵심이다.

## 타입 스케일 (최소 28px, 예외 없음)

| 용도 | 클래스 | 크기 |
|---|---|---|
| 표지 헤드라인 | `.cover-title` | 104px / 800 (visual 없으면 120px) |
| 장 제목 | `.title` | 68px / 800 |
| 핵심 문장 | `.lead` | 44px / 700 |
| 본문 | `.body` | 38px / 500 |
| 수식 | `.eq` / `.eq-lg` | 48px / 60px, 위첨자 0.6em |
| 다이어그램 라벨 | SVG `text` 기본 | 32px / 600 |
| 캡션, 헤더, 푸터, my_note | `.caption` 등 | 30px |

## 수식

- 위첨자는 `<sup>`로 쓴다. **캐럿(`^`) 표기 금지** (코드 블록 제외).
- 수식은 `<span class='eq'>`로 감싼다. 48px 미만 문맥에서 `<sup>`만 쓰면 28px 하한을 어긴다.
- 예: `<span class='eq'><span class='k-a2'>A</span> = <span class='k-pub'>g</span><sup class='k-a'>a</sup> <span class='mod'>mod</span> <span class='k-pub'>p</span></span>`
- SVG 안에서는 `<tspan class='sup'>ab</tspan>` (부모 text가 48px 이상일 때만).

## 다이어그램 SVG 규칙

- `visual` 필드에 **한 줄짜리 raw SVG**로 넣는다. `\n`이 없어야 한다.
- **viewBox를 픽셀과 1:1로**: `<svg width='936' height='640' viewBox='0 0 936 640'>`. 축소 배율을 쓰면 라벨이 실제로는 28px보다 작아진다.
- 라벨은 32px 이상, 도형은 콘텐츠 영역을 충분히 채운다. 다이어그램 높이는 제목 줄 수에 맞춰 560–720px.
- 공격 경로, 불가능한 방향은 점선 + 막힘 표시처럼 **형태로도** 구분한다 (색에만 의존하지 않는다).

## 슬라이드 타입 (15 + 1)

모든 content 계열 타입은 선택 필드 **`my_note`**(작성자 한 줄)와 `note_mark`(원형 마크 글자, 기본 "나")를 지원한다. 비어 있으면 렌더링하지 않는다.

| 타입 | 필드 | 비고 |
|---|---|---|
| `cover` | `headline`, `subtext`, `visual`, `series` | visual이 표지의 주인공. subtext는 검색 키워드 1줄 |
| `content` | `headline`, `lead`, `body`, `subtext` | 텍스트 설명. 가능하면 diagram/steps/split로 대체 |
| `content-diagram` | `headline`, `lead`, `visual`, `caption`, bleed 필드 | **cs-v2 전용**. 다이어그램 중심 장 |
| `content-steps` | `headline`, `lead`, `step1`~`step4`, `step1_title`~`step4_title`, `body` | body는 하단 캡션 |
| `content-list` | `headline`, `lead`, `item1`~`item5` | |
| `content-split` | `headline`, `lead`, `left_title`, `left_body`, `left_color`, `right_title`, `right_body`, `right_color`, `subtext` | `*_color`는 개념 토큰 클래스 (예: `k-threat`) |
| `content-highlight` | `headline`, `emphasis`, `body`, `subtext` | |
| `content-stat` | `headline`, `emphasis`, `body` | emphasis는 220px, 넘치면 자동 축소 |
| `content-bigdata` | `headline`, `bigdata_number`, `bigdata_unit`, `body`, `subtext` | |
| `content-quote` | `headline`(출처), `body`(인용문) | |
| `content-badge` | `badge_text`, `headline`, `body`, `subtext` | |
| `content-image` | `headline`, `body`, `image_url`, `subtext` | |
| `content-grid` | `headline`, `grid1`~`4` `_icon`/`_title`/`_desc` | 헤어라인 2x2 |
| `content-fullimage` | `headline`, `badge_text`, `body`, `badge2_text`, `body2`, `image_url` | 어두운 셰이드 |
| `content-cheatsheet` | `headline`, `row1`~`row6` `_label`/`_value`, `save_hint` | **cs-v2 전용**. 끝에서 두 번째 장 고정 |
| `cta` | `headline`, `cta_text`, `next_topic`, `visual` | 마지막 장 고정. visual 없으면 종이비행기 |

### bleed (슬라이드 경계를 넘는 선)

흐름상 필요한 곳(교환, 전달)에만 쓴다. 모든 장에 넣지 않는다.

```json
{"type": "content-diagram", "bleed_right": true, "bleed_y": 760, "bleed_color": "k-a2", "bleed_from": "mixA"}
```

- 선이 `bleed_from`(visual 안 요소의 id) 오른쪽에서 출발해 x=1080, y=`bleed_y`로 나간다.
- **다음 장**은 자동으로 x=0, 같은 y에서 선을 받는다. 다음 장에 `bleed_to`(id)를 주면 그 요소 왼쪽에 화살촉이 닿는다.
- 여러 줄: `"bleed_right": [{"y": 520, "color": "k-b2", "from": "mixB"}, {"y": 900, "color": "k-a2", "from": "mixA"}]`, 다음 장 `"bleed_to": ["gotB", "gotA"]`
- bleed가 지나가는 y에는 텍스트를 두지 않는다.

## 금지 사항

- 제목과 핵심 문장에 색 넣기. 제목은 항상 잉크 단색이고, 색은 개념 토큰으로만 쓴다.
- 제목에서 단어 하나만 색 바꾸기, 형광펜 마커 반복
- `// Computer Science`, `// END` 같은 코드 주석 흉내 라벨. 대문자와 넓은 자간의 eyebrow 라벨
- 헤드라인의 `—` 구분자 (고유명사 en dash `Diffie–Hellman`만 허용), `A · B · C` 가운뎃점 나열
- 모든 내용을 둥근 카드 + 그림자로 쪼개기 (이 스타일에는 그림자가 없다)
- 옅은 회색 텍스트, 28px 미만 텍스트, 72px 여백 밖 텍스트
- 악센트를 콘텐츠 강조에 쓰기
- JetBrains Mono를 메타 라벨, 페이지 번호에 쓰기

## 카피 규칙

→ `/card-news` 스킬의 "cs-v2 카피 규칙" 섹션을 따른다 (장당 핵심 1 + 보조 1, 훅 헤드라인, 치트시트→CTA 고정, caption.md).
