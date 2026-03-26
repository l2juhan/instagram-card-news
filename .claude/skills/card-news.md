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
- cta 타입 슬라이드 미포함 (프로젝트 규칙)

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

---

### Step 3c: 평가자 (Evaluator) — 서브 에이전트

**에이전트**: general-purpose
**모델**: sonnet
**입력**:
- `output/` 디렉토리의 PNG 파일 전체 (시각 검사)
- `workspace/slides.json` (데이터 검사)
- `workspace/contract.md` (수락 기준)
- `workspace/spec.md` (기획 의도)
- 템플릿 스타일 가이드

**출력 파일**: `workspace/evaluation.md`

평가자는 렌더링된 PNG를 직접 확인하고, 계약의 4축 기준으로 채점합니다.

### 평가 수행 항목

1. **시각 검사** (PNG): 텍스트 오버플로, 빈 공간 비율, 정렬, 색상 일관성, 가독성, style_override 적용 결과
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

---

## render.js 동작 방식 참고

- `code_body` 필드는 변환 없이 그대로 HTML에 삽입 (HTML 태그 사용 가능)
- `body` 필드는 `\n` → `<br>` 변환됨 → HTML 테이블을 단일 라인으로 작성하거나 `white-space:normal` 오버라이드 필요
- 템플릿 타입은 `slide.type` 필드로 결정 → `templates/{style}/{type}.html` 파일 로드
- `style_override` 필드는 `<style>` 블록으로 `</head>` 앞에 주입됨 → 템플릿 CSS 이후 cascade로 오버라이드
