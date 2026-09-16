---
description: "cs-doodle 템플릿 스타일 가이드. /card-news 파이프라인에서 cs-doodle 스타일 선택 시 자동 호출"
---

# cs-doodle 스타일 가이드

- **스타일**: CS 교육 콘텐츠, 손그림 낙서풍(방향 A: 볼펜 낙서 — 색펜 아웃라인 + 채색 최소). cs-v2와 구조·카피 규칙·가독성 기준은 완전히 같고, **그림체만 다르다**.
- **배경**: 웜 페이퍼 `#F6F2EA` + 잉크 `#16171B` (cs-v2와 동일 — 계정 내 색 언어 통일)
- **느낌**: 손으로 쓱 그린 듯 흔들리는 선, 귀엽고 친근함. 교재 인포그래픽처럼 딱딱하지 않음
- **기본 악센트**: `#16171B` (render 시 `--accent "#16171B"`를 반드시 넘길 것)
- **폰트**: Pretendard Variable(본문/제목) + JetBrains Mono(코드) + Gamja Flower(짧은 손글씨 포인트 주석 전용, 최소 40px)
- **해상도**: 1080x1350px (4:5)
- **추천 주제**: cs-v2와 동일 — 네트워크, 보안, OS, 자료구조, 알고리즘 등

> 템플릿 HTML은 `scripts/build-cs-doodle.js`가 생성한다. 템플릿 수정은 빌더를 고친 뒤 `node scripts/build-cs-doodle.js`로 재생성한다. 오브젝트 스프라이트는 `node scripts/doodle/build-objects.js`.

## 렌더링

```bash
node scripts/render.js --slides workspace/slides.json --style cs-doodle \
  --output output/ --accent "#16171B" --account "cse_juhan02" --series "Security" --preview
node scripts/lint-slides.js --slides workspace/slides.json --style cs-doodle
```

cs-v2와 같은 lint 기준(28px, 4.5:1 대비, 34px 크롭, 72px 여백, 오버플로)에 더해 cs-doodle 전용 규칙(겹침 경고, 결정성, 손글씨 하한)이 추가로 걸린다.

## 그림체가 만들어지는 방식 (알아두면 디버깅에 도움됨)

1. **슬라이드마다 고정인 chrome** (진행바, 구분선, 배지·이미지·다음편 박스 테두리, 화살표/종이비행기/인용 아이콘, 북마크 아이콘)은 `build-cs-doodle.js`가 Node 시점에 `scripts/doodle/rough-svg.js`로 한 번만 굽는다. 텍스트 길이에 따라 크기가 변하는 배지·이미지·다음편 박스는 빌드 시점에 크기를 알 수 없어서, `data-doodle-box="{색 클래스}"`만 붙여 두고 **렌더링 후 실제 크기를 재서** 그린다(`.bleed-layer`에 그림).
2. **슬라이드마다 다른 `visual` 필드**(원, 화살표, 사람 등 raw SVG)는 빌드 시점엔 평범한 SVG 그대로 두고, 렌더링(Puppeteer) 시점에 `scripts/doodle/convert-client.js`가 브라우저에서 `circle`/`ellipse`/`rect`/`line`/`path`/`polygon`을 손그림으로 바꾼다. **cs-v2에서 쓰던 `visual` SVG를 거의 그대로 재사용할 수 있다** — 새로 배울 문법이 없다.
3. 두 경로 모두 seed가 문서 순서나 레이아웃 기반으로 고정돼 있어 **같은 입력을 다시 렌더링하면 같은 PNG가 나온다**(결정성).

## `visual` 작성 규칙 (cs-v2와 다른 점)

- 도형·화살표는 cs-v2와 똑같이 쓴다 (`<circle class='k-a' fill='currentColor'/>` 등). 자동으로 손그림이 된다.
- **화살촉, 체크 표시처럼 작아서 꼭 채워야 읽히는 도형**에는 `data-doodle-fill="solid"`를 붙인다. 안 붙이면 기본 규칙(아웃라인만, 채색 최소)이 적용돼 속이 비어 보인다. `scripts/doodle/helpers.js`의 `arrow()`/`curvedArrow()`는 이미 화살촉에 이 속성을 붙여서 만들어 준다.
- **화살표/막힘 표시/구분선은 직접 좌표 계산하지 말고 헬퍼를 쓴다**:
  ```js
  const H = require('./scripts/doodle/helpers.js');
  H.arrow(x1, y1, x2, y2, { cls: 'ink' });          // 직선 화살표
  H.curvedArrow(x1, y1, cx, cy, x2, y2, { cls: 'k-a2' }); // 곡선 화살표
  H.blockedArrow(x1, y1, x2, y2, { cls: 'k-threat' });    // 점선 + 막힘 표시
  H.divider(x1, y1, x2, y2, {});                     // 구분선
  ```
  (콘텐츠 생성자가 슬라이드를 작성할 때, 위 함수로 얻은 SVG 문자열을 `visual` 필드의 raw SVG 안에 그대로 이어붙인다.)
- **텍스트 강조**(동그라미, 밑줄)는 `visual` 밖 일반 HTML 텍스트에도 쓸 수 있다: 강조할 부분을 `<mark data-doodle-mark="circle" data-doodle-color="k-threat" style="background:none;color:inherit">텍스트</mark>`로 감싼다. `data-doodle-mark`는 `"circle"` 또는 `"underline"`.
- **결정적 seed가 필요 없는(=원래 모양 그대로 둬야 하는) 도형**은 조상에 `data-doodle-skip`을 붙인다.
- **`clip-path`로 겹친 부분만 다른 색을 칠하는 트릭**(cs-v2 표지에서 씀)은 자동 변환기가 이해하지 못한다 — 아웃라인만 남아 어색해진다. cs-doodle에서 "겹치는 두 색" 같은 그림은 세 번째 원을 살짝 옆에 겹쳐 그리는 식으로 다시 그린다.

## 낙서 오브젝트 라이브러리

반복해서 쓰는 사물(열쇠, 자물쇠, 서버 등 17종)은 `assets/doodle/README.md`에 문서화된 대로 `<use href='#doodle-key'/>`로 부른다. 모든 템플릿에 스프라이트가 이미 심어져 있으니 별도 import가 필요 없다.

## 사람과 말풍선

- 사람은 **내용에 등장인물이 있을 때만** `visual` 안에 원(머리) + 반원 경로(몸통)로 직접 그린다 — cs-v2와 같은 마크업. 오브젝트 스프라이트에는 없다.
- 표정·소품은 의미 전달에 필요할 때만 추가한다(예: 도청자의 눈만 그리기).
- 말풍선은 기본 요소가 아니다. 인물의 발화 자체가 가장 명확한 설명 방식일 때만 예외적으로 쓴다.
- 마스코트, 화자 캐릭터, 표정 시스템은 만들지 않는다.

## 타이포그래피

- 제목·본문·수식·라벨은 cs-v2와 완전히 같다 (Pretendard Variable, 800/700/500 굵기, 28px 하한). **제목 굵기는 800 그대로 둔다** — Phase 1 시안 비교에서 700과 시각 차이가 거의 없었고, 부드러운 인상은 그림체에서 나오게 하는 편이 낫다는 결론이었다.
- 그림 옆 짧은 주석(1~4단어)에만 `class='annot'`(Gamja Flower, 40px)을 선택적으로 쓴다. **수식, 숫자, 용어 정의에는 쓰지 않는다.**
- `.hand`/`.annot` 클래스가 슬라이드에 전혀 없어도 렌더링은 깨지지 않는다 — 모든 템플릿에 숨은 프로브 글자가 있어 폰트 로딩 대기가 항상 정상적으로 끝난다.

## 슬라이드 타입 (cs-v2와 동일한 16종)

`cover`, `content`, `content-diagram`, `content-steps`, `content-list`, `content-split`, `content-highlight`, `content-stat`, `content-bigdata`, `content-quote`, `content-badge`, `content-image`, `content-grid`, `content-fullimage`, `content-cheatsheet`, `cta` — 필드와 레이아웃 규칙은 `style-cs-v2.md`를 그대로 따른다.

## 카피 규칙

→ `/card-news` 스킬의 "cs-v2 카피 규칙" 섹션을 그대로 따른다 (장당 핵심 1 + 보조 1, 훅 헤드라인, 치트시트→CTA 고정, caption.md). `my_note`는 기본 생성하지 않는다 — 사용자가 요청할 때만 `/edit-card-news`로 추가한다.

## 금지 사항

cs-v2의 금지 사항(제목 색칠, eyebrow 라벨, `—`/가운뎃점 나열, 회색 텍스트, 28px 미만 등)에 더해:

- 캐릭터, 말풍선, 스토리 연출을 기본값으로 넣기 (내용상 필요할 때만)
- 그림을 이미지 생성 모델로 만들기 (전부 코드/SVG로 그린다)
- 손글씨 폰트를 핵심 정보(수식, 숫자, 용어)에 쓰기, 36px(얇은 서체는 44px) 미만으로 쓰기
- 줄 노트·모눈 배경을 기본값으로 쓰기 ("공부 노트" 인상이 강해져 친근함이 줄어든다)
- 기존 유명 캐릭터·아이콘 세트의 모양 베끼기
