# cs-doodle 낙서 오브젝트 라이브러리

`objects/sprite.svg`는 `scripts/doodle/build-objects.js`가 생성한다. 직접 고치지 말고
빌더를 수정한 뒤 `node scripts/doodle/build-objects.js`로 다시 생성한다.

## 왜 미리 굽는가

`visual` 필드의 다이어그램(원, 화살표 등)은 렌더링 시점에 브라우저에서 자동으로
손그림화된다(`scripts/doodle/convert-client.js` 참고). 반면 이 오브젝트들은 덱 전체에서
반복해서 등장하는 아이콘이라 **매번 다른 손그림으로 흔들리면 오히려 정신없어 보인다.**
그래서 각 오브젝트는 고정 seed로 한 번만 그려서 `<symbol>`로 굽고, 항상 같은 모양으로
재사용한다.

## 목록 (17종)

`key`, `lock`, `envelope`, `laptop`, `server`, `db-cylinder`, `cloud`, `gear`,
`magnifier`, `check`, `x`, `exclamation`, `question`, `sparkle`, `paint-drop`,
`brush`, `blender`

모든 심볼은 `viewBox="0 0 120 120"`이고, 선은 `stroke="currentColor"` / `fill="none"`
(방향 A: 볼펜 낙서 — 색은 있어도 채색은 최소로).

## 호출 방법

1. 템플릿 HTML(공통 헤더)에 스프라이트를 한 번 심는다 — `build-cs-doodle.js`가
   `scripts/doodle/inline.js`의 `objectSpriteMarkup()`으로 모든 템플릿에 자동 주입하므로
   콘텐츠 작성자가 따로 신경 쓸 필요는 없다.
2. `visual` 필드(또는 다른 raw SVG)에서 `<use>`로 부른다. 색은 개념 토큰 클래스로 입힌다:

```html
<svg width='120' height='120' viewBox='0 0 120 120' class='k-a'>
  <use href='#doodle-key'/>
</svg>
```

- 크기를 바꾸려면 바깥 `<svg width height>`만 조절한다(내부 `viewBox`는 그대로 둔다).
- 같은 슬라이드에 여러 개 쓸 때는 각각 `<svg>`로 감싸 `x`/`y`로 배치한다(`<use>`
  자체에 `x`/`y`/`width`/`height`를 줘도 되지만, `viewBox`가 있는 symbol이라 `<svg>`로
  감싸는 쪽이 크기 계산이 더 명확하다).

## `scripts/doodle/convert-client.js`가 읽는 opt-in 속성

다이어그램의 기본 도형(`circle`/`ellipse`/`rect`/`line`/`path`/`polygon`)은 렌더링 시
자동으로 손그림 변환되지만, 몇 가지는 원본 SVG에 속성을 달아 동작을 바꿀 수 있다.

| 속성 | 위치 | 효과 |
|---|---|---|
| `data-doodle-fill="solid"` | 개별 도형 | 기본(아웃라인만)과 달리 원래 `fill` 색을 그대로 채운다. 화살촉, 작은 점처럼 채워야 읽히는 도형에 쓴다 |
| `data-doodle-seed="N"` | 개별 도형 | 문서 순서 기반 자동 seed 대신 고정 seed를 쓴다 |
| `data-doodle-skip` | 조상 요소 | 그 안의 도형은 변환하지 않고 원래 모양(직선/원)을 그대로 둔다 |
| `data-doodle-mark="circle" \| "underline"` | 텍스트를 감싼 인라인 요소(예: `<mark>`) | 렌더링 후 텍스트 위치를 측정해 손그림 강조(동그라미/밑줄)를 그린다 |
| `data-doodle-color="k-a"` | `data-doodle-mark`와 같은 요소 | 강조선 색(개념 토큰). 생략하면 `currentColor` |

`stroke-dasharray`는 원본 도형에 있으면 변환된 손그림 path에도 그대로 옮겨진다(점선
화살표, 막힘 표시 등에 그대로 활용).

## 사람 형태

사람은 스프라이트에 없다. `앨리스`, `밥`, `이브`처럼 **내용에 등장인물이 있을 때만**
`visual` 안에 원(머리) + 반원 경로(몸통)로 직접 그린다 — cs-v2에서 쓰던 것과 동일한
마크업이며, 자동 변환기가 그대로 손그림화한다. 표정·소품은 의미 전달에 필요할 때만
추가한다(예: 도청자의 눈만 그리기).
