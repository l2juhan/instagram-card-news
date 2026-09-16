# Instagram 카드뉴스 생성 프로젝트

> **v10.0** — 15종 슬라이드 타입 + 14종 템플릿 스타일(cs-doodle 손그림 그림체 추가) + GAN 영감 하네스 아키텍처 + Skills 기반 + 가독성 lint(결정성 검사 포함)

## 프로젝트 개요

이 프로젝트는 주어진 주제에 대해 Instagram 카드뉴스(캐러셀 포스트)를 자동으로 생성합니다.

**입력**: 주제, 톤, 템플릿 스타일, 슬라이드 수, 악센트 색상
**출력**: `output/` 디렉토리에 PNG 이미지 파일들

## 카드뉴스 생성

사용자가 카드뉴스를 요청하면 (예: "AI 프롬프트 팁으로 카드뉴스 만들어줘") **`/card-news` 스킬을 자동으로 호출**하여 파이프라인을 실행합니다.

파이프라인 (Harness Architecture): 기획(리서치+팩트체킹+기획서) → 스프린트 계약 → 생성자⇄평가자 루프(최대 5회) → 출력

- **기획자**: 웹 리서치 + 자체 팩트체킹 + 상세 슬라이드별 기획서 작성
- **스프린트 계약**: 생성자와 평가자의 4축 수락 기준 사전 합의
- **생성자**: slides.json + 필요시 style_override CSS 작성
- **평가자**: PNG 시각 검사 + 4축 채점(디자인 품질/독창성/기술적 완성도/기능성)
- 통과 기준: 가중합 ≥ 7.0, 각 축 ≥ 6. 미통과 시 피드백 루프, 5회 후 최고 점수 버전 채택

### 사용 가능한 템플릿 스타일

| 스타일 | 설명 | 스킬 |
|---|---|---|
| `minimal` | 깔끔한 정보 전달형, 밝은 배경 | `/style-minimal` |
| `bold` | 강렬한 임팩트형, 그라디언트 배경 | `/style-bold` |
| `elegant` | 고급스러운 감성형, 어두운 배경 | `/style-elegant` |
| `premium` | 다크 프리미엄형, 글래스모피즘 | `/style-premium` |
| `toss` | 토스 스타일 미니멀, 다크 플랫 | `/style-toss` |
| `magazine` | 매거진 스타일, 포토 오버레이 | `/style-magazine` |
| `clean` | 클린 에디토리얼형, 라이트그레이 | `/style-clean` |
| `blueprint` | 블루프린트 프레젠테이션형 | `/style-blueprint` |
| `aws` | AWS 서비스 소개형, 다크 네이비 | `/style-aws` |
| `rn` | React Native 튜토리얼형, 스플릿 | `/style-rn` |
| `cs` | CS 교육 콘텐츠형, 브라우저 프레임 (이전 게시물 재렌더링용) | `/style-cs` |
| `cs-v2` | CS 교육 콘텐츠 v2, 웜 페이퍼 + 개념 색 토큰, 4:5 (1080×1350) | `/style-cs-v2` |
| `cs-doodle` | CS 교육 콘텐츠, cs-v2 + 손그림 낙서풍(볼펜 낙서) 그림체, 4:5 (1080×1350) | `/style-cs-doodle` |
| `linux` | Linux 정보 전달형, 다크 터미널 | `/style-linux` |

### cs-v2 카피 규칙 (요약)

cs-v2로 만들 때는 `/card-news` 스킬의 "cs-v2 카피 규칙"을 따른다. 핵심:

- 장당 핵심 문장 1개 + 보조 1줄. 넘치면 장을 나눈다.
- 표지 헤드라인은 결과나 긴장을 담은 훅으로 쓰고, 주제명만 적은 제목은 금지한다.
- 설명형 불릿 나열 대신 다이어그램, 비교, 단계로 보여준다.
- 마지막 장은 `content-cheatsheet`로 고정한다. `cta` 타입(팔로우·공유 요구)은 다른 스타일과 동일하게 안 쓴다.
- 결과물과 함께 `output/caption.md`를 만든다: 캡션 본문은 검색 키워드를 담은 한 줄만, 해시태그 5개 이하, 슬라이드별 alt text, 음악 추가 리마인더.
- 렌더링은 `--accent "#16171B" --series "{카테고리}" --preview`로 하고, `node scripts/lint-slides.js` error 0이어야 평가 단계로 넘어간다.

### 빠른 명령어 예시

```
카드뉴스 만들어줘: AI 트렌드 2025
볼드 스타일로 "성공하는 아침 루틴" 카드뉴스 5장
"ChatGPT 활용법" 카드뉴스, 엘레건트, 10장, 악센트 #FF6B6B
미니멀 스타일로 투자 기초 지식 카드뉴스, @finance_tips 계정
```

---

## 설정 (config.json)

`config.json`에서 기본값을 변경할 수 있습니다:

```json
{
  "version": "3.0",
  "defaults": {
    "template": "cs-v2",
    "accent_color": "#16171B",
    "account_name": "cse_juhan02",
    "slide_count": 7
  }
}
```

> 기본 스타일이 `cs-v2`이므로 `카드뉴스 만들어줘: {주제}`만 입력하면 cs-v2로 생성됩니다. 다른 스타일은 요청에 이름을 적어 지정합니다 (예: "클린 스타일로").

---

## 디렉토리 구조

```
instagram-card-news/
├── .claude/
│   └── skills/          # Claude Skills (16개)
│       ├── card-news.md         # 하네스 파이프라인 (기획자-생성자-평가자)
│       ├── create-template.md   # 새 템플릿 스타일 생성 절차
│       ├── edit-card-news.md    # 기존 카드뉴스 수동 수정
│       ├── style-minimal.md     # 템플릿별 스타일 가이드
│       ├── style-bold.md
│       ├── style-elegant.md
│       ├── style-premium.md
│       ├── style-toss.md
│       ├── style-magazine.md
│       ├── style-clean.md
│       ├── style-blueprint.md
│       ├── style-aws.md
│       ├── style-rn.md
│       ├── style-cs.md
│       ├── style-cs-v2.md
│       ├── style-cs-doodle.md
│       └── style-linux.md
├── templates/           # HTML 템플릿 (14 스타일)
│   ├── minimal/         # 14종 (공통 슬라이드 타입)
│   ├── bold/            # 14종
│   ├── elegant/         # 14종
│   ├── premium/         # 14종
│   ├── toss/            # 14종
│   ├── magazine/        # 14종
│   ├── clean/           # 14종
│   ├── blueprint/       # 14종
│   ├── aws/             # 14종
│   ├── rn/              # 20종 (공통 14 + rn 전용 6)
│   ├── cs/              # 14종 (1080×1080)
│   ├── cs-v2/           # 16종 (1080×1350, 공통 14 + content-diagram, content-cheatsheet) ※ build-cs-v2.js가 생성
│   ├── cs-doodle/       # 16종 (1080×1350, cs-v2와 동일 구성 + 손그림 그림체) ※ build-cs-doodle.js가 생성
│   └── linux/           # 15종 (1080×1080, content-code 포함)
├── scripts/
│   ├── render.js        # Puppeteer HTML → PNG 렌더러 (--series, --preview)
│   ├── lint-slides.js   # 가독성 검사 (글자 크기, 대비, 안전 영역, 오버플로, cs-doodle 결정성/겹침)
│   ├── build-cs-v2.js   # cs-v2 템플릿 생성기
│   ├── build-cs-doodle.js # cs-doodle 템플릿 생성기
│   ├── doodle/          # cs-doodle 드로잉 엔진 (rough.js 결정적 SVG, 클라이언트 변환기, 오브젝트 빌더)
│   └── generate-samples.js
├── assets/doodle/       # cs-doodle 낙서 오브젝트 스프라이트 (build-objects.js가 생성) + README
├── style-example/       # 각 스타일 커버 예시 PNG
├── workspace/           # 런타임 작업 공간
├── output/              # 최종 PNG 출력
├── config.json          # 기본 설정
└── CLAUDE.md            # 이 파일
```

---

## 노션 레퍼런스 (Notion MCP)

카드뉴스 제작 시 아래 노션 페이지를 MCP로 참고할 수 있습니다.

**접근 방법**: `mcp__notion__API-get-block-children` 으로 블록 내용을, `mcp__notion__API-post-search` 로 페이지를 검색합니다.

| 주제 | 페이지 ID |
|---|---|
| Zustand + persist 미들웨어로 상태 관리 | `307b508e-2f68-815d-a336-ee5dbf1f80ff` |

> 테이블 블록은 `has_children: true` 이므로 해당 block_id로 한 번 더 `API-get-block-children` 호출 필요.
