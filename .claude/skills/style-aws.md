---
description: "aws 템플릿 스타일 가이드. /card-news 파이프라인에서 aws 스타일 선택 시 자동 호출"
---

# aws 스타일 가이드

- **스타일**: AWS 서비스 소개·아키텍처·콘솔 실습 튜토리얼·CLI/IaC 코드. cs-doodle과 같은
  손그림 낙서풍 엔진(`scripts/doodle/`)을 쓰되, 배경은 **다크(방향 B)** — 계정 그리드 통일보다
  AWS 특유의 기술적 무게감을 우선한 선택이다(Phase 1 시안 비교 후 사용자 확정).
- **배경**: Squid Ink `#232F3E` (카드 전체, cs-doodle의 페이퍼 배경과 달리 처음부터 끝까지 다크)
- **잉크**: `#F6F2EA` (크림 화이트)
- **느낌**: 손으로 쓱 그린 흰/오렌지 펜 낙서. 격자 오버레이·방사형 글로우·그라데이션 바 없음
  (구버전 aws의 장식 전부 제거)
- **기본 악센트**: `#FF9900` (AWS 오렌지 — 마커 강조, 진행바, series-mark에만 쓰고 본문 텍스트로는
  쓰지 않는다. `#232F3E` 위에서 6.34:1로 대비는 통과하지만, 오렌지 텍스트는 시각적으로 “경고”
  톤이 강해서 강조 용도로 남겨 둔다.)
- **폰트**: Pretendard Variable(본문/제목/라벨) + JetBrains Mono(코드) + Gamja Flower(짧은 손글씨
  주석 전용, 최소 36px) — cs-doodle과 동일 규칙. **서비스 라벨은 항상 Pretendard, 손글씨 폰트
  금지.**
- **해상도**: 1080×1350px (4:5, `config.json`의 `style_dimensions.aws`)

> 템플릿 HTML은 `scripts/build-aws.js`가 생성한다(코어: `scripts/doodle/build-core.js`, 팔레트·추가
> 타입: `scripts/doodle/themes/aws.js`). 템플릿 수정은 테마 파일을 고친 뒤
> `node scripts/build-aws.js`로 재생성한다. cs-doodle과 같은 코어를 공유하므로, 코어 자체를 고칠
> 땐 반드시 `node scripts/build-cs-doodle.js` 후 기존 `templates/cs-doodle/*.html`과 바이트 단위로
> 같은지 확인할 것(cs-doodle 쪽 회귀 방지).

## 렌더링

```bash
node scripts/render.js --slides workspace/slides.json --style aws \
  --output output/ --accent "#FF9900" --account "cse_juhan02" --series "AWS" --preview
node scripts/lint-slides.js --slides workspace/slides.json --style aws
```

cs-v2/cs-doodle과 같은 lint 기준(28px, 4.5:1 대비, 72px 여백, 오버플로, 겹침 경고, 결정성)에 더해
아래 aws 전용 규칙이 걸린다(모두 `scripts/lint-slides.js`에 일반화돼 있어 스타일 이름을 따로
분기하지 않는다):

| 검사 | 등급 | 조건 |
|---|---|---|
| `aws-icon-converted` | error | `data-aws-icon` 요소 안에서 손그림 변환 결과(`data-doodle-shape`)가 발견됨 — `data-doodle-skip` 누락 |
| `screenshot-scale` | warning | `#console-shot`(content-console) 렌더링 배율이 원본 대비 1.0 미만 — crop 사용 권장 |
| `sensitive-account-id` / `sensitive-access-key` / `sensitive-ipv4` | warning | 슬라이드 텍스트·코드 필드에 12자리 숫자 / `AKIA`·`ASIA` 키 패턴 / IPv4가 그대로 있음 |

`sensitive-*`는 CIDR(`0.0.0.0/0`)처럼 정상적인 값도 IPv4 패턴에 걸릴 수 있다 — 경고이니 실제
민감정보인지 확인 후 넘어가면 된다. **이미지 내부(스크린샷 픽셀) 민감정보는 코드로 검출할 수
없다 — 평가자가 육안으로 확인한다** (`.claude/skills/card-news.md`의 aws 평가 체크리스트 참고).

## 색 토큰

배경(`#232F3E`) 위 대비를 Node에서 WCAG 공식으로 직접 계산해 전부 4.5:1 이상을 확인했다.

| 토큰 | 역할 | 값 | 대비 |
|---|---|---|---|
| `--paper` | 카드 배경 | `#232F3E` | — |
| `--ink` | 기본 텍스트 | `#F6F2EA` | 12.15:1 |
| `--ink-soft` | 보조 텍스트 | `#B9C2CE` | 7.54:1 |
| `--rule` | 구분선(장식, 대비 기준 대상 아님) | `rgba(246,242,234,0.3)` | — |
| `--accent` | 마커·진행바·series-mark 전용(런타임 `--accent` 인자로 덮어씀, 기본 `#FF9900`) | `#FF9900` | 6.34:1 |
| `--k-pub` | 퍼블릭 서브넷 · 공개 영역 | `#FFC875` | 8.90:1 |
| `--k-priv` | 프라이빗 서브넷 | `#8FD19E` | 7.61:1 |
| `--k-compute` | 컴퓨트(EC2 등), 코드 주석 배지 | `#FFB066` | 7.53:1 |
| `--k-data` | 데이터 · 스토리지 | `#8FC1F2` | 7.16:1 |
| `--k-sec` | 보안 · 권한(IAM, SG, NACL) | `#D2AEEF` | 7.13:1 |
| `--k-danger` | 실패 · 위협 · 비용 경고 | `#FF9C90` | 6.73:1 |

클래스는 `k-pub`/`k-priv`/`k-compute`/`k-data`/`k-sec`/`k-danger`로 cs-doodle과 같은 `class="k-*"`
관례를 따른다(값만 다르다). `visual`의 도형·텍스트에 그대로 쓰면 된다: `<rect class='k-pub' .../>`.

## 슬라이드 타입 (18종)

cs-doodle과 같은 16종(`cover`, `content`, `content-diagram`, `content-steps`, `content-list`,
`content-split`, `content-highlight`, `content-stat`, `content-bigdata`, `content-quote`,
`content-badge`, `content-image`, `content-grid`, `content-fullimage`, `content-cheatsheet`, `cta`)
— 필드와 레이아웃 규칙은 `style-cs-v2.md`를 그대로 따른다 — 에 aws 전용 2종을 더한다.

### content-code

Terraform/CLI/코드 스니펫 전용. 필드: `headline`, `lead`(선택), `code_filename`, `code_body`,
`highlight_lines`(선택, 배열), `annotations`(선택, 배열), `body`(선택, 캡션).

- `code_body`: One Dark Pro HTML 토큰(`t-kw`/`t-fn`/`t-str`/`t-num`/`t-cm`/`t-var`/`t-op`/`t-type`/
  `t-plain`)을 직접 삽입한다. 줄바꿈은 실제 개행 문자(`\n`)로 쓴다 — 렌더러가 줄마다
  `<span class="code-line">`으로 자동으로 감싼다. **줄 사이에 빈 줄을 넣으면 그 자체가 한 줄로
  카운트되어 세로 공간을 많이 먹는다** — 데모용이 아니면 군더더기 빈 줄은 빼는 걸 권장.
- `highlight_lines: [3, 5]`: 해당 줄을 손그림 아웃라인(오렌지)으로 두른다. **배경색을 칠하지
  않는다** — One Dark Pro 9개 토큰 색 전부가 어두운 배경 위 4.5:1을 넘도록 검증했는데, 반투명
  배경을 얹으면 그 검증이 깨지기 때문이다(실측: `rgba(255,153,0,.22)` 배경 위에서 `t-cm`/`t-var`
  등 여러 토큰이 4.5:1 미만으로 떨어짐).
- `annotations: [{"line": 3, "text": "여기가 핵심"}]`: 번호 배지를 그 줄 왼쪽 여백에 손그림 원으로
  그리고, 패널 아래 번호 목록에 전체 문장을 적는다. **`highlight_lines`/`annotations`/`body`를
  전부 채우면 코드가 길 때 카드 하단 영역을 넘칠 수 있다** — lint의 `overflow` error로 걸리면
  코드나 주석 수를 줄이거나 슬라이드를 나눈다.
- 코드 최소 크기는 다른 텍스트와 같은 28px 하한이 그대로 적용된다(별도 예외 없음). 흔들림
  필터·변환은 코드 글자에 전혀 적용하지 않는다 — 코드는 패널 안에서 또렷하게 그대로 렌더링되고,
  패널 테두리만 손그림이다(`data-doodle-box` 메커니즘 재사용).
- One Dark Pro 토큰 표(값 갱신됨 — `t-cm`은 원래 `#5c6370`이었는데 다크 패널(`#1B1E24`) 대비
  2.76:1로 lint 기준 미달이라 밝게 올렸다):

  | 클래스 | 색상 | 용도 |
  |---|---|---|
  | `t-kw` | `#c678dd` | 키워드: resource, const, if, return |
  | `t-fn` | `#61afef` | 함수/참조명: aws_eip, create |
  | `t-str` | `#98c379` | 문자열: `"aws_nat_gateway"` |
  | `t-num` | `#d19a66` | 숫자 |
  | `t-cm` | `#8891A0` (italic) | 주석: `// ...` |
  | `t-var` | `#e06c75` | 변수/프로퍼티: allocation_id, subnet_id |
  | `t-op` | `#56b6c2` | 연산자: `=`, `=>` |
  | `t-type` | `#e5c07b` | 타입/리소스명: aws_subnet |
  | `t-plain` | `#abb2bf` | 일반 텍스트 |

### content-console

콘솔 스크린샷 + 주석 전용. 필드: `headline`, `lead`(선택), `screenshot`(로컬 이미지 경로, base64로
자동 변환됨 — `render.js`의 `IMAGE_FIELDS`), `alt`, `crop`(선택), `callouts`(선택, 배열),
`redact`(선택, 배열), `subtext`(선택).

**좌표계**: `crop`/`callouts`/`redact`는 전부 **원본 이미지 픽셀 좌표**로 쓴다. 렌더러가 브라우저에서
`img.naturalWidth/naturalHeight`를 읽어 실제 표시 배율로 자동 환산하므로, 스크린샷 원본 해상도를
그대로 쓰면 된다.

- `crop: {"x": 40, "y": 20, "w": 800, "h": 500}`: 지정한 사각형만 확대해서 보여준다. **콘솔 UI
  글씨는 원본 그대로 축소하면 폰에서 안 읽히므로 crop을 기본으로 쓸 것** — 생략하면 전체 이미지가
  카드 폭에 맞춰 줄어들고, 배율이 1.0 미만이면 lint가 `screenshot-scale` warning을 띄운다.
- `callouts`: `{"type": "circle", "x": .., "y": .., "r": 40}` / `{"type": "arrow", "x1": .., "y1": ..,
  "x2": .., "y2": ..}` / `{"type": "number", "x": .., "y": .., "n": 1}` — 손그림 동그라미·화살표·번호
  마커를 오렌지로 그린다.
- `redact: [{"x": .., "y": .., "w": .., "h": ..}]`: 사각형을 **완전 불투명**하게 덮어 가린다(원본
  픽셀이 비치지 않음 — 반투명 해칭이 아니라 solid fill). 계정 ID(12자리), 액세스 키, ARN 속 계정
  번호, 퍼블릭 IP, 이메일, 도메인, 키 페어 이름은 반드시 가릴 것.
- 스크린샷 자체가 없으면(`screenshot` 비어있음) 프레임 전체가 사라진다.

## 아키텍처 그룹 경계

`scripts/doodle/helpers.js`의 `H.group(x, y, w, h, { cls, dash, label })`로 VPC/AZ/서브넷/보안 그룹
같은 중첩 영역을 그린다. 라벨은 테두리에서 24/40px 안쪽에 자동으로 앉혀서 손그림 흔들림과
겹치는 걸 방지한다 — 그래도 라벨을 박스 맨 위 가장자리에 바짝 붙이면(`content-diagram` 스테이지가
좁을 때) doodle-overlap 경고가 뜰 수 있으니 라벨과 다음 요소 사이에 최소 56px는 띄운다.

```js
const H = require('./scripts/doodle/helpers.js');
H.group(0, 0, 936, 640, { dash: true, cls: 'ink', label: 'AWS Cloud' });
H.group(88, 176, 350, 420, { cls: 'k-pub', label: 'Public Subnet' });
H.group(486, 176, 350, 420, { cls: 'k-priv', label: 'Private Subnet' });
```

화살표/막힘 표시는 cs-doodle과 동일하게 `H.arrow()`/`H.curvedArrow()`/`H.blockedArrow()`를 쓴다.
서비스 아이콘은 아래 오브젝트 라이브러리를 쓰고, 서비스명은 텍스트 라벨로 옆에 적는다.

## 낙서 오브젝트 라이브러리

cs-doodle 공통 17종(`assets/doodle/objects/sprite.svg`, `<use href='#doodle-key'/>` 등)에 aws 확장
10종(`assets/doodle/objects/sprite-aws.svg`)이 더해진다. 두 스프라이트 모두 템플릿에 이미
심어져 있으니 별도 import 없이 바로 쓴다. aws 확장 심볼은 전부 `doodle-aws-` 접두사다:

| 심볼 | 의미(예시 용도) |
|---|---|
| `doodle-aws-user` | 사용자 · 클라이언트 |
| `doodle-aws-globe` | 인터넷 · 퍼블릭 영역 |
| `doodle-aws-instance` | EC2 인스턴스(칩 달린 서버) |
| `doodle-aws-bucket` | S3 버킷 |
| `doodle-aws-loadbalancer` | 로드 밸런서(분기 화살표) |
| `doodle-aws-function` | Lambda 함수 |
| `doodle-aws-queue` | SQS 큐 |
| `doodle-aws-cdn` | CloudFront(지구본 + 번개) |
| `doodle-aws-shield` | IAM · 보안 |
| `doodle-aws-gateway` | 게이트웨이(NAT/IGW 등, 문 모양) |

전부 일반적인 사물로 새로 그린 원작이며 AWS 공식 아이콘의 모양·구도를 참고하지 않았다. **서비스
정체성은 오브젝트가 아니라 옆의 서비스명 라벨(공식 표기, 예: "Amazon S3", "AWS Lambda")로
전달한다.** 라벨은 Pretendard, 손글씨 폰트는 쓰지 않는다.

새 오브젝트가 더 필요하면 `scripts/doodle/build-objects-aws.js`에 추가하고
`node scripts/doodle/build-objects-aws.js`로 다시 굽는다. **`scripts/doodle/build-objects.js`(공통
17종, `sprite.svg`)는 건드리지 않는다** — cs-doodle 템플릿 바이트 동일성이 거기 걸려 있다.

## 공식 AWS Architecture Icons

**기본값은 낙서 오브젝트 + 서비스명 라벨이며, 지금은 공식 아이콘을 전혀 섞어 쓰지 않는다**
(Phase 1에서 "그림체 일관성"을 "정확한 서비스 식별"보다 우선하기로 확정 — 10여 종이 함께 등장하는
복잡한 아키텍처 다이어그램에서도 낙서만 쓴다).

향후 필요해지면(예: 특정 서비스 식별이 꼭 필요한 자료) 아래 규칙으로 제한적으로 쓴다:

- AWS는 공식 아이콘을 아키텍처 다이어그램·발표자료·백서·포스터에 쓰는 걸 허용한다
  ("We allow customers and partners to use these toolkits and assets to create architecture
  diagrams." — [aws.amazon.com/architecture/icons](https://aws.amazon.com/architecture/icons/)).
  다만 **변형 없이(색·비율·모양 그대로) 그려진 대로 쓰라**는 것이 공식 안내의 취지이며, 상세
  조건은 다운로드하는 자산 패키지 안의 사용 지침 문서를 실제로 열어 확인할 것 — 이 요약만으로
  판단하지 않는다.
- 쓸 경우 컨테이너에 `data-doodle-skip`과 `data-aws-icon`을 같이 붙인다. `data-doodle-skip`은
  `convert-client.js`가 이미 지원하는 메커니즘으로, 이 속성이 있으면 안의 도형을 손그림으로 바꾸지
  않는다. `data-aws-icon`만 있고 `data-doodle-skip`이 빠지면 lint가 `aws-icon-converted` error로
  잡는다.
- 색, 비율, 모양을 변형하지 않는다. 크롭·회전·반전하지 않는다.
- AWS 로고(스마일 화살표 워드마크)는 절대 쓰지 않는다. 헤더의 시리즈명 "AWS"는 텍스트로만 쓴다.

## 카피 규칙

`/card-news` 스킬의 "cs-v2 카피 규칙"을 기본으로 따르되(장당 핵심 1 + 보조 1, 훅 헤드라인,
마지막 장 `content-cheatsheet` 고정, `cta` 미사용, `caption.md`), aws는 아래를 더한다:

- 요금·프리 티어·서비스 한도·콘솔 UI처럼 자주 바뀌는 정보는 작성 시점에 공식 문서로 확인하고
  `caption.md`에 확인 기준일을 적는다.
- 콘솔 스크린샷 장은 캡처 시점을 캡션에 적는다.
- 서비스명 첫 등장은 공식 전체 명칭(예: "Amazon EC2", "AWS Lambda")으로 쓰고, 이후는 약칭 가능.
- 마지막 장 `content-cheatsheet`는 주제에 맞게 "설정 체크리스트" / "CLI 한 장 요약" / "서비스
  비교표" 중 하나로 쓴다.

## 금지 사항

cs-doodle의 금지 사항(캐릭터·말풍선·스토리 연출 기본값 금지, 이미지 생성 모델로 그림 만들기 금지,
손글씨 폰트를 핵심 정보에 쓰기 금지, 28px 미만 텍스트 금지 등)에 더해:

- AWS 공식 아이콘을 변형하거나 손그림으로 따라 그리기
- AWS 로고(스마일 화살표) 사용
- 코드 글자에 흔들림 필터·변환 적용
- `highlight_lines`에 반투명 배경색 칠하기(대비 검증이 깨짐 — 아웃라인만 쓸 것)
- 가림 처리 없이 계정 ID·액세스 키·IP·이메일이 보이는 스크린샷 사용
- 격자 오버레이·방사형 글로우·그라데이션 바 등 구버전 aws의 장식 되살리기
