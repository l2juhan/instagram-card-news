---
description: "카드뉴스 생성 파이프라인. 사용자가 '카드뉴스 만들어줘', '카드뉴스 생성', '카드뉴스' 등 카드뉴스 제작을 요청할 때 자동 트리거"
---

# 카드뉴스 생성 파이프라인

사용자가 카드뉴스를 요청하면 아래 파이프라인을 순서대로 실행합니다.

## Step 1: 요청 파싱

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

---

## Step 2: 리서치 (서브 에이전트)

**에이전트**: general-purpose
**모델**: sonnet
**출력 파일**: `workspace/research.md`

주제에 대한 웹 검색을 수행하고 다음 내용을 포함한 `workspace/research.md`를 작성합니다:

- 핵심 포인트 5~10개
- 관련 통계 및 수치
- 인용구 1~2개 (전문가 의견, 명언 등)
- 최신 트렌드 및 맥락 정보

---

## Step 2.5: 리서치 검증 (팀 토론)

리서치 결과의 정확성과 완성도를 팀 에이전트가 교차 검증합니다.

**방식**: 2개의 서브 에이전트를 **병렬**로 실행한 뒤, 오케스트레이터가 종합

### 에이전트 구성

| 역할 | 에이전트 | 모델 | 임무 |
|---|---|---|---|
| 팩트체커 | general-purpose | sonnet | 통계/수치의 출처 확인, 오래된 데이터 지적, 잘못된 정보 식별 |
| 보완 리서처 | general-purpose | sonnet | 빠진 핵심 정보 보완, 다른 소스로 교차 검증, 추가 인사이트 제안 |

### 실행 흐름

1. `workspace/research.md`를 두 에이전트에게 동시에 전달
2. **팩트체커**: 각 통계/수치에 대해 웹 검색으로 출처 확인, 정확도를 `확인됨/미확인/수정필요`로 분류
3. **보완 리서처**: 주제에 대해 독립적으로 웹 검색 수행, 기존 리서치에 없는 중요 정보 식별
4. 오케스트레이터가 두 에이전트의 피드백을 종합하여 `workspace/research.md`를 최종 수정
   - 수정필요 항목: 정확한 데이터로 교체
   - 미확인 항목: 출처 불분명 표기 또는 제거
   - 보완 정보: 유용한 내용만 선별하여 추가

**통과 기준**: 모든 통계/수치가 `확인됨` 상태이고, 핵심 포인트가 5개 이상일 때

---

## Step 3: 카피라이팅 (서브 에이전트)

**에이전트**: general-purpose
**모델**: sonnet
**입력**: `workspace/research.md` + 톤 + 슬라이드 수 + **템플릿 스타일 가이드** (Step 1에서 로드)
**출력 파일**: `workspace/slides.json`

### slides.json 포맷

```json
[
  {"slide": 1, "type": "cover", "headline": "...", "subtext": "..."},
  {"slide": 2, "type": "content", "headline": "...", "body": "..."},
  {"slide": 3, "type": "content-badge", "badge_text": "TREND", "headline": "핵심 트렌드", "body": "설명 텍스트", "subtext": "2025년"},
  {"slide": 4, "type": "content-steps", "headline": "진행 절차", "step1": "첫 번째 단계", "step2": "두 번째 단계", "step3": "세 번째 단계"},
  {"slide": 5, "type": "content-list", "headline": "핵심 포인트", "item1": "항목 1", "item2": "항목 2", "item3": "항목 3", "item4": "항목 4", "item5": "항목 5"},
  {"slide": 6, "type": "content-split", "headline": "A vs B", "left_title": "A", "left_body": "설명", "right_title": "B", "right_body": "설명"},
  {"slide": 7, "type": "content-highlight", "headline": "핵심 포인트", "emphasis": "키워드", "body": "설명"},
  {"slide": 8, "type": "content-image", "headline": "이미지 슬라이드", "body": "설명", "image_url": ""},
  {"slide": 9, "type": "content-stat", "headline": "...", "emphasis": "85%", "body": "..."},
  {"slide": 10, "type": "content-quote", "headline": "— 출처", "body": "인용문..."},
  {"slide": 11, "type": "cta", "headline": "...", "cta_text": "팔로우하기"},
  {"slide": 12, "type": "content-grid", "headline": "4대 핵심 전략", "grid1_icon": "🎯", "grid1_title": "타겟팅", "grid1_desc": "설명", "grid2_icon": "📱", "grid2_title": "콘텐츠", "grid2_desc": "설명", "grid3_icon": "🤖", "grid3_title": "자동화", "grid3_desc": "설명", "grid4_icon": "📊", "grid4_title": "분석", "grid4_desc": "설명"},
  {"slide": 13, "type": "content-bigdata", "headline": "시장 규모", "bigdata_number": "48.8", "bigdata_unit": "조원", "body": "설명 텍스트", "subtext": "출처"},
  {"slide": 14, "type": "content-fullimage", "headline": "풀이미지 타이틀", "badge_text": "핵심 인사이트", "body": "첫 번째 섹션 설명", "badge2_text": "주의할 점", "body2": "두 번째 섹션 설명", "image_url": "https://..."},
  {"slide": 15, "type": "content-code", "headline": "코드 예시", "code_filename": "App.tsx", "code_body": "const [count, setCount] = useState(0);", "body": "설명 텍스트"}
]
```

### 공통 슬라이드 타입 레퍼런스

| 타입 | 사용 시점 | 필드 |
|---|---|---|
| `cover` | 항상 첫 번째 슬라이드 (표지) | `headline`, `subtext` |
| `content` | 일반 내용 설명 | `headline`, `body` |
| `content-stat` | 숫자/통계/퍼센트 강조 | `headline`, `emphasis`, `body` |
| `content-quote` | 인용구, 명언, 전문가 의견 | `headline` (출처), `body` (인용문) |
| `cta` | 항상 마지막 슬라이드 (행동 유도) | `headline`, `cta_text` |
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
- **마지막 슬라이드 (cta)**: 명확한 행동 유도 (저장, 팔로우, 공유 등)
- **문장 길이**: 짧고 임팩트 있게, 한 줄 15자 이내 권장
- **어조**: 요청된 톤(professional / casual / energetic)에 맞게 작성

---

## Step 3.5: 카피 토론 (팀 토론)

카피라이팅 결과물의 후킹력과 품질을 팀 에이전트가 토론하여 검증합니다.

**방식**: 2개의 서브 에이전트를 **병렬**로 실행한 뒤, 오케스트레이터가 종합

### 에이전트 구성

| 역할 | 에이전트 | 모델 | 임무 |
|---|---|---|---|
| 후킹 전문가 | general-purpose | sonnet | 커버 헤드라인의 스크롤 스톱 파워, 호기심 유발 강도, 클릭 유도력 평가 |
| 카피 에디터 | general-purpose | sonnet | 문장 완성도, 톤 일관성, 글자수 적정성, 슬라이드 간 흐름 평가 |

### 실행 흐름

1. `workspace/slides.json`을 두 에이전트에게 동시에 전달
2. **후킹 전문가** 평가 기준:
   - 커버 헤드라인: "이걸 왜 봐야 하지?"에 3초 안에 답하는가
   - 각 슬라이드: 다음 장을 넘기고 싶은 호기심을 유발하는가
   - CTA: 구체적이고 즉시 행동 가능한 문구인가
   - 전체 후킹 점수: 1~10점 (7점 미만이면 수정 요청)
3. **카피 에디터** 평가 기준:
   - 한 줄 15자 이내 준수 여부
   - 톤 일관성 (professional/casual/energetic)
   - 슬라이드 간 논리적 흐름과 스토리라인
   - 중복 표현이나 불필요한 문장 식별
   - 슬라이드 타입 선택의 적절성
4. 오케스트레이터가 두 에이전트의 피드백을 종합:
   - 후킹 점수 7점 미만 → Step 3으로 돌아가 구체적 피드백과 함께 재작성
   - 카피 에디터 지적사항 → 해당 슬라이드만 수정
   - 양쪽 모두 통과 → Step 4로 진행

**통과 기준**: 후킹 점수 7점 이상 + 카피 에디터의 주요 지적사항 0건

---

## Step 4: 렌더링 (Bash)

> Step 3.5 통과 후 실행

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

## Step 5: 검토 (서브 에이전트)

**에이전트**: general-purpose
**모델**: sonnet

`output/` 디렉토리의 PNG 파일들을 읽어 다음 항목을 검토합니다:

- 가독성: 텍스트가 충분히 크고 읽기 쉬운지
- 텍스트 잘림: 내용이 프레임을 벗어나지 않는지
- 흐름: 슬라이드 간 내용이 자연스럽게 연결되는지
- CTA 명확성: 마지막 슬라이드의 행동 유도가 구체적인지
- 주제 일관성: 전체 카드뉴스가 주제에 집중되어 있는지

**문제 발견 시**: Step 3 (카피라이팅)으로 돌아가 구체적인 피드백과 함께 수정 요청 (수정 후 Step 3.5 카피 토론도 재실행)
**이상 없음**: 사용자에게 완료 보고 및 출력 파일 경로 안내

---

## render.js 동작 방식 참고

- `code_body` 필드는 변환 없이 그대로 HTML에 삽입 (HTML 태그 사용 가능)
- `body` 필드는 `\n` → `<br>` 변환됨 → HTML 테이블을 단일 라인으로 작성하거나 `white-space:normal` 오버라이드 필요
- 템플릿 타입은 `slide.type` 필드로 결정 → `templates/{style}/{type}.html` 파일 로드
