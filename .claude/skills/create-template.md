---
description: "새 템플릿 스타일 생성. '템플릿 만들어줘', '새 스타일 추가', 'create template' 등 새로운 카드뉴스 템플릿 제작 요청 시 트리거"
---

# 새 템플릿 스타일 생성 가이드

사용자가 새로운 카드뉴스 템플릿 스타일을 요청하면 아래 절차를 따릅니다.

## Step 1: 스타일 정의

사용자로부터 다음 정보를 수집합니다 (명시되지 않으면 직접 제안):

| 항목 | 예시 | 설명 |
|---|---|---|
| `name` | `neon` | 영문 소문자, 디렉토리명으로 사용 |
| `description` | 네온 사이버펑크형 | 한줄 설명 |
| `background` | 다크 (#0A0A1A) | 주 배경색 + 느낌 |
| `accent_color` | `#00FF88` | 기본 악센트 색상 (hex) |
| `font` | Pretendard | 주 폰트 |
| `feel` | 사이버펑크, 미래적, 네온 글로우 | 분위기 키워드 |
| `resolution` | 1080x1350 또는 1080x1080 | 해상도 |
| `recommended_topics` | 테크, 게임, AI | 추천 주제 |

**참고 자료**: 기존 템플릿의 커버 예시를 보여주려면 `style-example/` 디렉토리의 PNG 파일을 참고합니다.

---

## Step 2: HTML 템플릿 생성

`templates/{name}/` 디렉토리를 만들고 **공통 14종** HTML 파일을 생성합니다.

### 필수 파일 목록 (14종)

| 파일명 | 슬라이드 타입 | 필수 placeholder |
|---|---|---|
| `cover.html` | 표지 | `{{headline}}`, `{{subtext}}` |
| `content.html` | 일반 내용 | `{{headline}}`, `{{body}}` |
| `content-stat.html` | 통계 강조 | `{{headline}}`, `{{emphasis}}`, `{{body}}` |
| `content-quote.html` | 인용구 | `{{headline}}` (출처), `{{body}}` (인용문) |
| `cta.html` | 행동 유도 | `{{headline}}`, `{{cta_text}}` |
| `content-image.html` | 이미지+텍스트 | `{{headline}}`, `{{body}}`, `{{image_url}}` |
| `content-steps.html` | 3단계 절차 | `{{headline}}`, `{{step1}}`, `{{step2}}`, `{{step3}}` |
| `content-list.html` | 항목 나열 | `{{headline}}`, `{{item1}}`~`{{item5}}` |
| `content-badge.html` | 배지+헤드라인 | `{{badge_text}}`, `{{headline}}`, `{{body}}`, `{{subtext}}` |
| `content-split.html` | 좌우 비교 | `{{headline}}`, `{{left_title}}`, `{{left_body}}`, `{{right_title}}`, `{{right_body}}` |
| `content-highlight.html` | 강조 박스 | `{{headline}}`, `{{emphasis}}`, `{{body}}` |
| `content-grid.html` | 2x2 그리드 | `{{headline}}`, `{{grid1_icon}}`~`{{grid4_icon}}`, `{{grid1_title}}`~`{{grid4_title}}`, `{{grid1_desc}}`~`{{grid4_desc}}` |
| `content-bigdata.html` | 대형 숫자 | `{{headline}}`, `{{bigdata_number}}`, `{{bigdata_unit}}`, `{{body}}` |
| `content-fullimage.html` | 풀이미지 오버레이 | `{{headline}}`, `{{badge_text}}`, `{{body}}`, `{{badge2_text}}`, `{{body2}}`, `{{image_url}}` |

### 시스템 placeholder (자동 치환)

모든 HTML에서 사용 가능:

| placeholder | 설명 |
|---|---|
| `{{accent_color}}` | 악센트 색상 (render.js가 주입) |
| `{{account_name}}` | Instagram 계정명 |
| `{{slide_number}}` | 현재 슬라이드 번호 (01, 02...) |
| `{{total_slides}}` | 전체 슬라이드 수 |

### HTML 템플릿 작성 규칙

1. **독립 HTML**: 각 파일은 완전한 `<!DOCTYPE html>` 문서 (외부 CSS 의존 없음)
2. **고정 크기**: `html, body`에 `width: {width}px; height: {height}px; overflow: hidden;` 설정
3. **박스 모델**: `*, *::before, *::after { box-sizing: border-box; }` 필수
4. **폰트**: Google Fonts CDN 링크 사용 (`<link href="https://fonts.googleapis.com/css2?family=...">`)
5. **악센트 색상**: 하드코딩 대신 `{{accent_color}}` placeholder 사용
6. **word-break**: 한글 텍스트에 `word-break: keep-all` 적용
7. **여백**: padding 80px 기준, 텍스트가 프레임을 벗어나지 않도록 max-width 설정
8. **남은 placeholder 정리**: render.js가 미사용 placeholder를 자동 제거하므로 선택적 필드도 안전

### 기존 템플릿 참고

새 템플릿 작성 시 가장 유사한 기존 스타일의 HTML을 기반으로 수정하면 효율적입니다:

| 기반 스타일 | 적합한 경우 |
|---|---|
| `minimal` | 밝은 배경, 깔끔한 레이아웃 |
| `bold` / `elegant` | 다크 배경, 그라디언트 |
| `premium` | 글래스모피즘, 현대적 |
| `toss` | 울트라 미니멀, 장식 최소 |
| `aws` / `linux` | 다크 + 격자 패턴, 코드블럭 필요 시 |
| `rn` | 스플릿 레이아웃, 코드 중심 |

---

## Step 3: 전용 슬라이드 타입 (선택)

템플릿 고유의 슬라이드 타입이 필요하면 추가 HTML 파일을 생성합니다.

예시: `content-code.html` (코드블럭), `content-install.html` (설치 가이드) 등

전용 타입 추가 시:
- `templates/{name}/` 에 HTML 파일 추가
- render.js는 `slide.type` 값으로 자동 매칭하므로 코드 수정 불필요
- 해당 타입의 필드를 `/style-{name}` 스킬에 문서화

---

## Step 4: config.json 업데이트

`config.json`의 `templates` 객체에 새 항목을 추가합니다:

```json
"{name}": {
  "description": "{한줄 설명}",
  "accent_color": "{기본 악센트}",
  "background": "{배경 키워드}"
}
```

정사각형 해상도(1080x1080)인 경우 `style_dimensions`에도 추가:

```json
"style_dimensions": {
  "{name}": { "width": 1080, "height": 1080 }
}
```

---

## Step 5: 스타일 스킬 생성

`.claude/skills/style-{name}.md` 파일을 생성합니다:

```markdown
---
description: "{name} 템플릿 스타일 가이드. /card-news 파이프라인에서 {name} 스타일 선택 시 자동 호출"
---

# {name} 스타일 가이드

- **스타일**: {설명}
- **배경**: {배경}
- **느낌**: {분위기 키워드}
- **기본 악센트**: `{accent_color}`
- **폰트**: {폰트}
- **해상도**: {width}x{height}px
- **추천 주제**: {추천 주제}

## 고유 특징
- {특징 1}
- {특징 2}
...

## 사용 가능한 슬라이드 타입
공통 14종: `cover`, `content`, `content-stat`, `content-quote`, `cta`, `content-image`, `content-steps`, `content-list`, `content-badge`, `content-split`, `content-highlight`, `content-grid`, `content-bigdata`, `content-fullimage`
(+ 전용 타입이 있으면 추가)
```

---

## Step 6: CLAUDE.md 업데이트

`CLAUDE.md`의 **사용 가능한 템플릿 스타일** 테이블에 새 항목 추가:

```markdown
| `{name}` | {한줄 설명} | `/style-{name}` |
```

**디렉토리 구조** 섹션에도 새 템플릿 디렉토리 추가.

---

## Step 7: 검증

1. 샘플 `slides.json`을 만들어 렌더링 테스트:
   ```bash
   node scripts/render.js --slides workspace/slides.json --style {name} --output output/ --accent "{accent_color}" --account "test_account"
   ```
2. `output/` 디렉토리의 PNG 파일들을 확인하여:
   - 텍스트 잘림 없는지
   - 악센트 색상 적용 확인
   - 모든 슬라이드 타입이 정상 렌더링되는지
3. 문제 발견 시 해당 HTML 수정 후 재렌더링

---

## 체크리스트

- [ ] `templates/{name}/` 디렉토리에 공통 14종 HTML 생성
- [ ] 전용 슬라이드 타입 HTML 생성 (필요 시)
- [ ] `config.json` 업데이트 (templates + style_dimensions)
- [ ] `.claude/skills/style-{name}.md` 스킬 생성
- [ ] `CLAUDE.md` 테이블 + 디렉토리 구조 업데이트
- [ ] 렌더링 테스트 통과
