---
description: "카드뉴스 생성 파이프라인 (Harness v1.0). 사용자가 '카드뉴스 만들어줘', '카드뉴스 생성', '카드뉴스' 등 카드뉴스 제작을 요청할 때 자동 트리거"
---

# 카드뉴스 생성 파이프라인 (Harness Architecture)

> GAN 영감 3역할 하네스: 기획자(Planner) → 스프린트 계약 → 생성자(Generator) ⇄ 평가자(Evaluator)

사용자가 카드뉴스를 요청하면 아래 파이프라인을 순서대로 실행합니다.

---

## Step 0: 요청 파싱

사용자 입력에서 다음 파라미터를 추출합니다:

| 파라미터 | 기본값 | 설명 |
|---|---|---|
| `topic` | (필수) | 카드뉴스 주제 |
| `tone` | `professional` | 톤 (professional / casual / energetic) |
| `template` | `minimal` | 템플릿 스타일 |
| `slide_count` | `7` | 슬라이드 수 (최소 5, 최대 12) |
| `accent_color` | 템플릿 기본값 | 악센트 색상 (hex) |
| `account_name` | `my_account` | 계정명 (@ 없이 입력, 템플릿에서 자동 추가) |

명시되지 않은 파라미터는 `config.json`의 기본값을 사용합니다.

**파싱 후 즉시**: 해당 템플릿의 `/style-{template}` 스킬을 호출하여 템플릿별 가이드를 로드합니다.

**반복 상태 초기화**: 오케스트레이터는 다음 상태를 추적합니다:
- `current_iteration`: 0
- `max_iterations`: 5
- `best_version`: null
- `best_score`: 0

---

## Step 1: 기획자 (Planner) — 서브 에이전트

**에이전트**: general-purpose
**모델**: sonnet
**출력 파일**: `workspace/research.md` + `workspace/spec.md`

기획자는 리서치, 팩트체킹, 상세 기획을 하나의 에이전트에서 수행합니다.

### 1-1. 웹 리서치

주제에 대한 웹 검색을 수행하고 다음 내용을 포함한 `workspace/research.md`를 작성합니다:

- 핵심 포인트 5~10개
- 관련 통계 및 수치
- 인용구 1~2개 (전문가 의견, 명언 등)
- 최신 트렌드 및 맥락 정보

### 1-2. 자체 팩트체킹

리서치에 포함된 통계와 수치에 대해 추가 웹 검색으로 교차 검증합니다:

- 각 통계/수치의 출처를 확인
- 출처 불분명한 데이터는 제거 또는 대체
- 모든 핵심 포인트가 검증 가능한 상태여야 함

### 1-3. 상세 기획서 작성

`workspace/spec.md`를 다음 포맷으로 작성합니다:

```markdown
# 카드뉴스 기획서

## 메타 정보
- 주제: {topic}
- 톤: {tone}
- 템플릿: {template}
- 슬라이드 수: {slide_count}
- 악센트: {accent_color}

## 슬라이드 설계
### 슬라이드 1: cover
- 목적: {구체적 훅 전략}
- 핵심 메시지: {message}
- 목표 감정: {emotion}

### 슬라이드 2: {type}
- 목적: {이 슬라이드가 왜 필요한지}
- 핵심 데이터: {리서치에서 가져온 근거}
- 콘텐츠 밀도: {높음/중간/낮음}

... (슬라이드별 1섹션)

## 디자인 노트
- 색상 활용 의도
- 시각적 리듬 (밀도 높은 슬라이드 ↔ 가벼운 슬라이드 교대)
- 스타일 특화 고려사항

## 리서치 요약
(research.md에서 핵심만 압축)
```

---

## Step 2: 스프린트 계약 (Sprint Contract) — 오케스트레이터

서브 에이전트가 아닌 **오케스트레이터(메인 세션)**가 `workspace/spec.md`를 기반으로 `workspace/contract.md`를 작성합니다.

### contract.md 포맷

```markdown
# 스프린트 계약

## 산출물
{slide_count}장의 {template} 스타일 카드뉴스 (workspace/slides.json)

## 수락 기준

### 1. 디자인 품질 (30%) — 색상/레이아웃 일관성
- 악센트 색상 활용이 스타일 가이드와 일관적
- 빈 공간 50% 이상인 슬라이드 없음
- 타이포그래피 위계 유지 (headline > body > subtext)
- 스타일 특화 요소 존재 (예: clean의 brand-dot, premium의 글래스모피즘)

### 2. 독창성 (25%) — AI 특유의 뻔한 스타일 배제
- 커버 헤드라인에 "X가지 방법", "알아보자", "당신이 몰랐던" 등 진부한 패턴 배제
- 플레이스홀더성 텍스트 없음 ("설명 텍스트", "자세한 내용" 등)
- 주제에 특화된 신선한 표현/비유
- 슬라이드 타입 다양성 (content + content-list만으로 구성 금지)

### 3. 기술적 완성도 (25%) — 여백, 기본기
- 텍스트가 안전 마진 내에 수용됨 (오버플로 없음)
- 한국어 기준 한 줄 ~15자 이내
- 슬라이드 타입별 필수 필드 완비
- 빈 슬라이드, 거의 빈 슬라이드 없음

### 4. 기능성 (20%) — 직관적 사용성
- 슬라이드 1→N 논리적 흐름 (서사 아크)
- 각 슬라이드가 고유한 역할 수행 (중복 없음)
- 헤드라인만으로 핵심 메시지 파악 가능
- cta 타입 슬라이드 미포함 (프로젝트 규칙 — cs-v2, cs-doodle도 포함). **cs-v2, cs-doodle은 대신** 마지막 장을 `content-cheatsheet`로 고정한다

## 통과 기준
- 각 축 최소 6/10
- 가중 합산 최소 7.0/10
- 어떤 축이든 5 미만이면 합산 무관 자동 불통과

## style_override 가이드
- 텍스트 길이 조정, 패딩 미세 조정, 특정 요소 색상 변경에 사용 가능
- 템플릿 기본 레이아웃이나 브랜드 아이덴티티 변경 금지
- 평가자가 오버라이드의 시각적 효과도 검증

## 피드백 규약
- 평가자는 슬라이드별 피드백 제공 (집계만 불가)
- 모든 피드백에 구체적 필드 + 구체적 변경 제안 포함
- 생성자는 6점 미만 축의 모든 피드백 필수 반영
```

> 계약 내용은 spec.md의 디자인 노트와 주제 특성에 맞게 구체화합니다. 위 포맷은 기본 골격이며, 주제별로 수락 기준의 세부 항목을 조정할 수 있습니다.

---

## Step 3: 생성자-평가자 루프 (최대 5회)

### Step 3a: 생성자 (Generator) — 서브 에이전트

**에이전트**: general-purpose
**모델**: sonnet
**입력**:
- `workspace/spec.md` + `workspace/contract.md` + `workspace/research.md`
- 템플릿 스타일 가이드 (Step 0에서 로드)
- iteration > 1이면: `workspace/evaluation.md` (이전 평가 피드백)

**출력 파일**: `workspace/slides.json`

생성자는 기획서와 계약을 기반으로 slides.json을 작성합니다. 2회차 이후에는 평가자의 피드백을 반드시 반영합니다.

### slides.json 포맷

```json
[
  {"slide": 1, "type": "cover", "headline": "...", "subtext": "..."},
  {"slide": 2, "type": "content-badge", "badge_text": "TREND", "headline": "핵심 트렌드", "body": "설명 텍스트", "subtext": "2025년"},
  {"slide": 3, "type": "content-steps", "headline": "진행 절차", "step1": "첫 번째 단계", "step2": "두 번째 단계", "step3": "세 번째 단계"},
  {"slide": 4, "type": "content-list", "headline": "핵심 포인트", "item1": "항목 1", "item2": "항목 2", "item3": "항목 3", "item4": "항목 4", "item5": "항목 5"},
  {"slide": 5, "type": "content-split", "headline": "A vs B", "left_title": "A", "left_body": "설명", "right_title": "B", "right_body": "설명"},
  {"slide": 6, "type": "content-highlight", "headline": "핵심 포인트", "emphasis": "키워드", "body": "설명"},
  {"slide": 7, "type": "content-stat", "headline": "...", "emphasis": "85%", "body": "..."}
]
```

### style_override 필드 (선택적)

슬라이드별로 CSS 오버라이드가 필요한 경우 `style_override` 필드를 추가할 수 있습니다:

```json
{
  "slide": 3,
  "type": "content-split",
  "headline": "...",
  "left_title": "...",
  "left_body": "긴 텍스트...",
  "right_title": "...",
  "right_body": "긴 텍스트...",
  "style_override": ".left-body { font-size: 28px; } .right-body { font-size: 28px; }"
}
```

**사용 가능한 경우**:
- 텍스트가 길어서 폰트 크기 축소가 필요할 때
- 패딩/마진 미세 조정이 필요할 때
- 특정 요소의 색상 변경이 필요할 때
- `{{accent_color}}` 플레이스홀더 사용 가능 (render.js가 자동 치환)

**사용 금지**:
- 템플릿의 기본 레이아웃 구조 변경
- 브랜드 아이덴티티 훼손
- 대규모 스타일 재정의

### 공통 슬라이드 타입 레퍼런스

| 타입 | 사용 시점 | 필드 |
|---|---|---|
| `cover` | 항상 첫 번째 슬라이드 (표지) | `headline`, `subtext` |
| `content` | 일반 내용 설명 | `headline`, `body` |
| `content-stat` | 숫자/통계/퍼센트 강조 | `headline`, `emphasis`, `body` |
| `content-quote` | 인용구, 명언, 전문가 의견 | `headline` (출처), `body` (인용문) |
| `content-image` | 이미지와 텍스트를 함께 보여줄 때 | `headline`, `body`, `image_url` |
| `content-steps` | 단계별 프로세스/절차 설명 | `headline`, `step1`, `step2`, `step3`, `body` |
| `content-list` | 항목을 나열할 때 (최대 5개) | `headline`, `item1`~`item5` |
| `content-badge` | 카테고리/태그 + 대형 헤드라인 | `badge_text`, `headline`, `body`, `subtext` |
| `content-split` | 두 가지를 비교/대조할 때 | `headline`, `left_title`, `left_body`, `right_title`, `right_body`, `subtext` |
| `content-highlight` | 핵심 정보를 강조 박스로 표시 | `headline`, `emphasis`, `body`, `subtext` |
| `content-grid` | 4가지 항목을 그리드로 정리할 때 | `headline`, `grid1_icon`~`grid4_icon`, `grid1_title`~`grid4_title`, `grid1_desc`~`grid4_desc` |
| `content-bigdata` | 거대 숫자/금액/규모를 강조할 때 | `headline`, `bigdata_number`, `bigdata_unit`, `body`, `subtext` |
| `content-fullimage` | 풀 배경 이미지 위에 텍스트 오버레이 | `headline`, `badge_text`, `body`, `badge2_text`, `body2`, `image_url` |
| `content-code` | 코드 블럭 + 설명 (`rn`/`aws`/`linux` 전용) | `headline`, `code_filename`, `code_body`, `body` |

> 템플릿별 전용 슬라이드 타입은 해당 `/style-{name}` 스킬에서 확인하세요.

### 카피라이팅 가이드라인

- **슬라이드 1 (cover)**: 강력한 훅 문장, 호기심 유발, 핵심 키워드 포함
- **중간 슬라이드**: 한 슬라이드에 하나의 포인트만, 명확하고 간결하게
- **숫자/통계가 있으면** `content-stat` 타입으로 강조
- **인용구/명언/전문가 의견이 있으면** `content-quote` 타입 활용
- **카테고리/태그가 있으면** `content-badge` 타입으로 시작 (예: "TREND", "EVENT", "TIP")
- **절차/과정 설명은** `content-steps` 타입 활용 (3단계)
- **여러 항목 나열은** `content-list` 타입 활용 (최대 5개)
- **비교/대조가 필요하면** `content-split` 타입 활용
- **핵심 메시지 강조는** `content-highlight` 타입 활용
- **이미지가 필요한 슬라이드는** `content-image` 타입 (image_url은 비워두면 플레이스홀더 표시)
- **2x2 그리드 정보 정리는** `content-grid` 타입 활용 (4개 항목, 이모지 아이콘)
- **대형 숫자/금액/규모 강조는** `content-bigdata` 타입 활용 (거대 숫자 + 단위)
- **풀 배경 이미지 + 텍스트 오버레이는** `content-fullimage` 타입 활용 (두 개의 배지 섹션, 다크 오버레이)
- **코드 예시가 필요하면** `content-code` 타입 활용 (해당 템플릿 스타일 스킬 참조)
- **문장 길이**: 짧고 임팩트 있게, 한 줄 15자 이내 권장
- **어조**: 요청된 톤(professional / casual / energetic)에 맞게 작성

### cs-v2 카피 규칙 (cs-v2, cs-doodle 스타일에서는 위 가이드라인보다 우선)

목표는 "폰에서 한 장당 2~3초 안에 읽히고, 저장해서 다시 보고 싶은 카드"다. **1차 목적은 공부한 내용을 스스로 기록하는 것**이고, 그 다음이 다른 사람도 가볍게 보고 지식을 얻어가는 것이다 — "팔로우해줘", "친구한테 보내줘" 같은 공유·성장 유도는 목적이 아니다.

1. **장당 핵심 문장 1개 + 보조 1줄.** 핵심은 `headline`/`lead`, 보조는 `caption`/`subtext`에 쓴다. 넘치면 장을 나눈다. `body`에 문단을 쌓지 않는다.
2. **표지 헤드라인은 결과나 긴장을 담은 훅**으로 쓴다. 예: "HTTPS 자물쇠 뒤의 키는 한 번도 전송되지 않는다". 주제명만 적은 제목("디피-헬만 키 교환")은 금지하고, 주제명은 `subtext`에 검색 키워드로 넣는다.
3. **설명형 불릿 나열 대신 보여준다.** 흐름은 `content-diagram`, 대비는 `content-split`, 절차와 수식은 `content-steps`로 쓴다. `content-list`는 정말 목록일 때만 쓴다.
4. **구성 고정**: 1장 `cover` → 내용 → 마지막 `content-cheatsheet`. `cta` 타입은 쓰지 않는다(공유 요구 카드 금지 — 프로젝트 전체 규칙과 동일). 권장 분량은 8~10장이다.
5. **치트시트가 마지막 장이다.** 저장해 두고 다시 볼 한 장 요약이므로, 행마다 라벨 1개·값 한 줄로 쓰고 문장을 쓰지 않는다. 후속편이 있다면 `save_hint`에 짧게 한 줄만 얹는다(예: "저장해두면 시험 전날 1분 복습"). 별도 CTA 슬라이드를 만들지 않는다.
6. **길이**: 장 제목 2줄 이내(한 줄 약 12자), 표지 헤드라인 3줄 이내(한 줄 약 9자), `lead` 2줄 이내.
7. **개념 색 배정**: 기획서(`spec.md`) 디자인 노트에 "개념 → 토큰" 표를 먼저 쓰고 전 장에 똑같이 적용한다. 물감이나 도형 색과 수식 변수 색은 반드시 같은 토큰이어야 한다.
8. **수식**은 `<sup>`와 `.eq`로 쓴다. 캐럿(`^`) 표기는 코드 블록이 아닌 한 금지한다.
9. **`my_note`는 초안 생성 시 만들지 않는다.** 작성자 한 줄 코멘트는 파이프라인이 대신 지어내지 않는다 — 사용자가 "N번 장에 이 코멘트 넣어줘"라고 직접 요청할 때만 `/edit-card-news`로 추가한다.
10. **헤드라인 금지 패턴**: `—` 구분자, `A · B · C` 가운뎃점 나열, 제목 속 단어 하나 색칠
11. **대체 텍스트**: slides.json 각 장에 `alt` 필드(1~2문장, 이미지에 보이는 내용 묘사)를 쓴다. 렌더링에는 쓰이지 않고 `caption.md`에 들어간다.

---

### Step 3b: 렌더링 (Bash)

`render.js` 스크립트를 실행하여 슬라이드 JSON을 PNG 이미지로 변환합니다.

```bash
node scripts/render.js \
  --slides workspace/slides.json \
  --style {template} \
  --output output/ \
  --accent "{accent_color}" \
  --account "{account_name}"
```

렌더링은 4개 워커가 병렬로 실행되며, 완료 후 `output/` 디렉토리에 `slide_01.png` ~ `slide_0N.png` 파일이 생성됩니다.

**cs-v2, cs-doodle 스타일은 추가로** `--series "{카테고리}" --preview` 를 붙이고, 렌더링 직후 가독성 lint를 실행합니다:

```bash
node scripts/render.js --slides workspace/slides.json --style cs-v2 --output output/ \
  --accent "#16171B" --account "{account_name}" --series "{카테고리}" --preview
node scripts/lint-slides.js --slides workspace/slides.json --style cs-v2 \
  --accent "#16171B" --account "{account_name}" --series "{카테고리}"
```

`--style cs-doodle`로 바꾸면 cs-doodle에도 그대로 적용됩니다.

- `output/preview/slide_XX.png`: 폰 체감 크기(360px 폭) 축소본
- `output/preview/grid_cover.png`: 프로필 그리드(3:4)에서 보이는 표지
- lint 검사 항목: 글자 28px 미만, 대비 4.5:1 미만, 34px 크롭 영역 침범, 캔버스·레이아웃 영역 밖 요소, 잘린 텍스트 → error / 72px 여백 침범 → warning
- **cs-doodle에서만 추가로**: 손글씨 폰트 크기가 최소치 미만 → error, 손그림 도형이 텍스트 위를 덮음 → warning, 같은 슬라이드를 2회 렌더링한 결과가 다름(결정성 깨짐) → error
- **lint가 exit 1(error 존재)이면 평가자에게 넘기기 전에 생성자 단계로 되돌립니다.** error 목록을 `evaluation.md`의 `[CRITICAL]` 항목으로 그대로 전달합니다.

---

### Step 3c: 평가자 (Evaluator) — 서브 에이전트

**에이전트**: general-purpose
**모델**: sonnet
**입력**:
- `output/` 디렉토리의 PNG 파일 전체 (시각 검사)
- cs-v2, cs-doodle: `output/preview/` 360px 축소본 전체 + `grid_cover.png`, `lint-slides.js` 출력 결과
- `workspace/slides.json` (데이터 검사)
- `workspace/contract.md` (수락 기준)
- `workspace/spec.md` (기획 의도)
- 템플릿 스타일 가이드

**출력 파일**: `workspace/evaluation.md`

평가자는 렌더링된 PNG를 직접 확인하고, 계약의 4축 기준으로 채점합니다.

### 평가 수행 항목

1. **시각 검사** (PNG): 텍스트 오버플로, 빈 공간 비율, 정렬, 색상 일관성, 가독성, style_override 적용 결과
   - **cs-v2, cs-doodle**: 가독성은 원본 PNG가 아니라 `output/preview/` **360px 축소본으로 판단**한다. 기준은 "폰으로 봤을 때 한 장당 2~3초 안에 핵심이 읽히는가"이다. `grid_cover.png`에서 헤드라인과 비주얼이 온전한지도 확인한다.
   - **cs-v2, cs-doodle**: lint error가 1개라도 남아 있으면 기술적 완성도 축은 5점 이하(자동 불통과)로 채점한다. warning은 슬라이드별 피드백에 적는다.
   - **cs-v2, cs-doodle**: 물감(도형) 색과 수식 변수 색이 같은 개념 토큰인지 확인한다.
   - **cs-doodle 전용**:
     - 360px 미리보기에서 핵심이 2~3초 안에 읽히는가 (그림체가 부드러워졌다고 가독성이 희생되지 않았는지)
     - 그림이 설명을 돕는가, 장식에 그치는가 — 손그림이라는 이유로 정보 없는 낙서를 늘리지 않았는지
     - 낙서 질감(흔들리는 선, 해쳐 채움)이 라벨·수식·화살표 방향 같은 정보를 흐리지 않는가
     - 한 덱 안에서 그림체(선 굵기, 거칠기, 채색 방식)가 일관적인가 — 슬라이드마다 손맛의 정도가 달라 보이지 않는지
2. **데이터 검사** (slides.json): 서사 흐름, 카피 품질, 후킹력, 글자 수, 슬라이드 타입 다양성
3. **4축 채점**: 각 축 1~10점
4. **슬라이드별 피드백**: OK 또는 구체적 수정 제안
5. **PASS/FAIL 판정**: 계약의 통과 기준 적용

### evaluation.md 포맷

```markdown
# 평가 — Iteration {N}

## 점수
| 축 | 점수 | 비고 |
|---|---|---|
| 디자인 품질 | ?/10 | ... |
| 독창성 | ?/10 | ... |
| 기술적 완성도 | ?/10 | ... |
| 기능성 | ?/10 | ... |

**가중 합산**: ?/10 (디자인×0.3 + 독창성×0.25 + 기술×0.25 + 기능×0.2)
**판정**: PASS / FAIL

## 슬라이드별 피드백

### 슬라이드 1 (cover) — OK / 수정 필요
- 발견 사항
- 제안: 구체적 필드 + 구체적 변경
- 관련 축: {축 이름}

... (모든 슬라이드에 대해)

## 우선순위 수정 목록
1. [CRITICAL] ...
2. [HIGH] ...
3. [MEDIUM] ...
```

---

### Step 3d: 반복 결정 — 오케스트레이터

평가자가 `workspace/evaluation.md`를 작성하면 오케스트레이터가 다음을 수행합니다:

1. **점수 확인**: evaluation.md에서 가중 합산과 각 축 점수를 읽음
2. **버전 아카이브**: 현재 `workspace/slides.json`을 `workspace/slides_v{N}.json`으로 복사
3. **최고 점수 추적**: 현재 점수가 역대 최고이면 best_version 갱신

### 결정 로직

| 조건 | 행동 |
|---|---|
| **PASS** (가중합 ≥ 7.0 AND 모든 축 ≥ 6) | Step 4로 진행 |
| **FAIL + 반복 잔여** | evaluation.md 포함하여 Step 3a로 복귀 |
| **FAIL + 5회 소진** | 폴백 실행 |
| **고원 감지** (3회 연속 ±0.3 이내 동일 점수) | 조기 종료, 현재 버전 채택 |

### 반복 시 주의사항

- 생성자에게 `evaluation.md`의 **우선순위 수정 목록**을 반드시 전달
- `[CRITICAL]` 항목은 반드시 해결, `[HIGH]`는 가급적 해결, `[MEDIUM]`은 가능하면 해결
- 3회 연속 같은 이슈가 반복되면(`[RECURRING]` 태그) 계약에 해당 이슈를 "하드 제약"으로 추가

---

### Step 3e: 폴백 — 오케스트레이터

5회 반복 후에도 통과하지 못한 경우:

1. 최고 점수 `workspace/slides_v{best}.json`을 `workspace/slides.json`으로 복원
2. 해당 버전으로 재렌더링
3. 사용자에게 보고:

```
5회 반복 후 최종 결과입니다.
최고 점수 버전: v{N} (총점 {score}/10)
- 디자인 품질: {X}/10
- 독창성: {Y}/10
- 기술적 완성도: {Z}/10
- 기능성: {W}/10

남은 개선 사항:
{evaluation.md의 우선순위 수정 목록}

/edit-card-news 스킬로 수동 수정이 가능합니다.
```

---

## Step 4: 최종 출력

통과 또는 폴백 후, 사용자에게 결과를 보고합니다:

```
카드뉴스 생성 완료! (반복 {N}회, 총점 {score}/10)
- 디자인 품질: {X}/10, 독창성: {Y}/10, 기술적 완성도: {Z}/10, 기능성: {W}/10
output/slide_01.png ~ output/slide_{count}.png
```

### cs-v2, cs-doodle: `output/caption.md` 생성

cs-v2, cs-doodle 결과물은 PNG와 함께 오케스트레이터가 `output/caption.md`를 작성합니다. 캡션, 대체 텍스트, 해시태그는 콘텐츠 분류와 검색 노출(공개 게시물은 구글 검색 포함)에 쓰입니다.

```markdown
# 캡션

{검색 키워드 포함, 이 캐러셀에서 얻는 것을 담은 한 줄}

{#해시태그 최대 5개}

## 대체 텍스트
1. {slide 1 alt}
2. {slide 2 alt}
...

## 업로드 체크리스트
- [ ] 차분한 인스트루멘털 음악 추가 (음악을 넣은 캐러셀은 릴스 탭에 노출될 수 있음)
- [ ] 슬라이드별 대체 텍스트 입력 (고급 설정 → 대체 텍스트 작성)
```

규칙:
- **캡션 본문은 한 줄로만 쓴다.** 여러 줄로 나눠 쓰지 않는다 — 검색 키워드와 핵심을 한 문장에 담는다. 예: "EC2 Status Check와 자동 복구: 호스트·인스턴스·EBS 중 어디서 장애가 나든 감지해서 살려내는 법"
- **해시태그는 5개 이하**로 쓴다. 게시물당 5개로 제한됐고 도달을 올려 주지 않으므로 분류용으로만 고른다.
- 대체 텍스트는 slides.json의 `alt` 필드를 그대로 쓰고, 슬라이드 수와 개수가 같아야 한다.

---

## render.js 동작 방식 참고

- `code_body` 필드는 변환 없이 그대로 HTML에 삽입 (HTML 태그 사용 가능)
- `body` 필드는 `\n` → `<br>` 변환됨 → HTML 테이블을 단일 라인으로 작성하거나 `white-space:normal` 오버라이드 필요
- 템플릿 타입은 `slide.type` 필드로 결정 → `templates/{style}/{type}.html` 파일 로드
- `style_override` 필드는 `<style>` 블록으로 `</head>` 앞에 주입됨 → 템플릿 CSS 이후 cascade로 오버라이드
