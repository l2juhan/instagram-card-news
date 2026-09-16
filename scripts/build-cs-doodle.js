'use strict';

/**
 * cs-doodle 템플릿 빌더.
 *
 * templates/cs-doodle/*.html 은 이 스크립트가 생성한다. cs-v2와 같은 프레임·타입·토큰을
 * 쓰되(스타일만 다르다), 손그림 방향은 Phase 1에서 정한 A안(볼펜 낙서: 색펜 아웃라인 +
 * 채색 최소)이다. 두 군데에서 "러프"해진다:
 *
 *   1) 슬라이드마다 고정인 chrome(진행바, 구분선, 배지 테두리, 화살표 아이콘 등)은
 *      여기서 Node 시점에 한 번만 rough.js로 구워 정적 SVG로 박아 넣는다. 위치는
 *      cs-v2와 똑같이 두고 모양만 바꾼다.
 *   2) 슬라이드마다 다른 `visual` 필드(원, 화살표 등 raw SVG)는 빌드 시점엔 평범한
 *      SVG 그대로 두고, scripts/doodle/convert-client.js를 인라인해 렌더링(Puppeteer)
 *      시점에 브라우저에서 손그림으로 바꾼다 — cs-v2용으로 쓴 visual을 그대로 재사용
 *      할 수 있게 하기 위해서다.
 *
 *   node scripts/build-cs-doodle.js
 */

const fs = require('fs');
const path = require('path');
const R = require('./doodle/rough-svg.js');
const PEN = require('./doodle/pen-style.js');
const { doodleScriptTag, objectSpriteMarkup } = require('./doodle/inline.js');

const OUT_DIR = path.join(__dirname, '..', 'templates', 'cs-doodle');

const PRETENDARD_CSS =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
const MONO_CSS = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap';
const HAND_CSS = 'https://fonts.googleapis.com/css2?family=Gamja+Flower&display=swap';

// ---------------------------------------------------------------------------
// 정적 chrome: Node 시점에 한 번 구워서 고정한다 (seed 고정 → 항상 같은 모양).
// ---------------------------------------------------------------------------
let seedCounter = 5000; // 오브젝트 스프라이트(0~) / 슬라이드별 visual(1~) seed와 겹치지 않게 큰 값에서 시작
const nextSeed = () => seedCounter++;

// fill 키는 기본값에 넣지 않는다: circle/ellipse/rectangle/polygon은 fill:'none' 문자열도
// "채워라"로 읽어 해쳐 세트를 만든다(line()은 fill을 안 쓰고, path()/curve()만 'none'을
// 예외로 걷어낸다). 지금은 line()/path()에만 쓰지만 나중에 다른 도형에 재사용될 수 있으니
// 아예 기본값에서 빼 둔다.
const chromeOpts = (seed, extra) => Object.assign(
  { seed, roughness: PEN.roughness, bowing: PEN.bowing, maxRandomnessOffset: PEN.maxRandomnessOffset, stroke: 'currentColor', strokeWidth: PEN.strokeWidth },
  extra
);

// 긴 직선에 disableMultiStroke 없이 큰 maxRandomnessOffset을 주면 두 겹선이 양 끝에서만
// 만나고 가운데서 벌어져 "렌즈" 모양이 된다. 구분선처럼 길고 얇은 선은 한 겹만 그린다.
const RULE_OPTS = { disableMultiStroke: true };

/** 가로 손그림 선. 진행바, 구분선 등 고정폭 라인용. */
function hRuleSvg(w, h, weight = PEN.strokeWidth) {
  return `<svg width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' style='display:block;overflow:visible'>${R.line(0, h / 2, w, h / 2, chromeOpts(nextSeed(), Object.assign({ strokeWidth: weight }, RULE_OPTS)))}</svg>`;
}

/** 세로 손그림 선. */
function vRuleSvg(w, h, weight = PEN.strokeWidth) {
  return `<svg width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' style='display:block;overflow:visible'>${R.line(w / 2, 0, w / 2, h, chromeOpts(nextSeed(), Object.assign({ strokeWidth: weight }, RULE_OPTS)))}</svg>`;
}

const QUOTE_MARK_SVG = `<svg class="quote-mark" width="120" height="96" viewBox="0 0 120 96">${R.path(
  'M0 96V58C0 26 16 5 48 0v20C32 25 26 37 26 52h22v44H0zM68 96V58c0-32 16-53 48-58v20c-16 5-22 17-22 32h22v44H68z',
  chromeOpts(nextSeed(), { fill: 'currentColor', stroke: 'none', fillStyle: 'solid' })
)}</svg>`;

const NEXT_ARROW_SVG = `<svg class="next-arrow" width="52" height="28" viewBox="0 0 52 28">${R.path(
  'M3 14h44M36 4l11 10-11 10',
  chromeOpts(nextSeed())
)}</svg>`;

const CTA_PLANE_SVG = `<svg class="cta-plane" width="220" height="220" viewBox="0 0 240 240">${R.path(
  'M226 16 12 104l86 36 36 86z',
  chromeOpts(nextSeed())
)}${R.path('M226 16 98 140', chromeOpts(nextSeed()))}</svg>`;

// ---------------------------------------------------------------------------
// 공용 CSS — cs-v2와 같은 토큰. 페이퍼/개념색은 그대로 둔다(스타일 차이는 그림체에서
// 나오게 하려는 의도적 선택 — 계정 내 스타일 간 색 언어를 통일해 둔다).
// ---------------------------------------------------------------------------
const BASE_CSS = `
*, *::before, *::after { box-sizing: border-box; }
:root {
  --paper: #F6F2EA;
  --surface: #ECE5D8;
  --ink: #16171B;
  --ink-soft: #4A4B53;
  --rule: #CFC6B6;
  --accent: {{accent_color}};
  --k-pub: #7A5800;
  --k-a: #AE3226;
  --k-b: #1F5FA8;
  --k-a2: #9E4A0E;
  --k-b2: #2A6A3B;
  --k-ab: #6B4226;
  --k-threat: #6A3491;
  --sans: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, monospace;
  --hand: 'Gamja Flower', var(--sans);
}
html, body { margin: 0; padding: 0; width: 1080px; height: 1350px; overflow: hidden; background: var(--paper); }
body {
  font-family: var(--sans); color: var(--ink);
  font-size: 38px; line-height: 1.5; font-weight: 500;
  word-break: keep-all; overflow-wrap: break-word;
  -webkit-font-smoothing: antialiased;
}
p, h1, h2, h3, figure, blockquote, dl, dd, ol, ul { margin: 0; padding: 0; }
.card { position: relative; width: 1080px; height: 1350px; overflow: hidden; background: var(--paper); }

.k-pub { color: var(--k-pub); } .k-a { color: var(--k-a); } .k-b { color: var(--k-b); }
.k-a2 { color: var(--k-a2); } .k-b2 { color: var(--k-b2); } .k-ab { color: var(--k-ab); }
.k-threat { color: var(--k-threat); } .ink { color: var(--ink); } .soft { color: var(--ink-soft); }
strong, b { font-weight: 800; }

.eq { font-size: 48px; font-variant-numeric: tabular-nums; white-space: nowrap; font-weight: 700; }
.eq-lg { font-size: 60px; }
sup { font-size: 0.6em; line-height: 0; position: relative; top: -0.62em; vertical-align: baseline; }
.mod { font-weight: 500; color: var(--ink-soft); }
code, .mono { font-family: var(--mono); font-weight: 500; }
.hand { font-family: var(--hand); font-weight: 700; }

.hd {
  position: absolute; top: 56px; left: 72px; right: 72px; height: 40px;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 30px; line-height: 40px; font-weight: 600;
}
.series { display: flex; align-items: center; gap: 14px; color: var(--ink); }
.series-mark { display: block; width: 16px; height: 16px; border-radius: 3px; background: var(--accent); }
.page { color: var(--ink-soft); font-weight: 500; font-variant-numeric: tabular-nums; margin-left: auto; }
.page b { color: var(--ink); font-weight: 700; }

.main { position: absolute; top: 150px; left: 72px; right: 72px; bottom: 170px; display: flex; flex-direction: column; }

.progress { position: absolute; top: 1196px; left: 72px; right: 72px; height: 22px; }
.progress .rule-track, .progress .rule-fill { position: absolute; top: 0; left: 0; height: 100%; overflow: hidden; }
.progress .rule-fill { color: var(--accent); }
.progress .rule-track { color: var(--rule); }
.ft {
  position: absolute; top: 1234px; left: 72px; right: 72px; height: 44px;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 30px; line-height: 44px; font-weight: 500; color: var(--ink-soft);
}
.next-arrow { display: block; color: var(--ink); }

.title { font-size: 68px; font-weight: 800; line-height: 1.25; letter-spacing: -0.02em; }
.lead { font-size: 44px; font-weight: 700; line-height: 1.4; letter-spacing: -0.01em; margin-top: 28px; }
.body { font-size: 38px; font-weight: 500; line-height: 1.5; }
.caption { font-size: 30px; font-weight: 500; line-height: 1.45; color: var(--ink-soft); margin-top: 28px; }
.annot { font-family: var(--hand); font-weight: 700; font-size: 40px; }

.stage { flex: 1; min-height: 0; display: flex; flex-direction: column; margin-top: 48px; }
.stage-top { justify-content: flex-start; }
.stage-center { justify-content: center; }

.visual { width: 100%; }
.visual > svg { display: block; overflow: visible; max-width: none; }
.visual svg text:not([font-family]) { font-family: var(--sans); }
.visual svg text:not([font-size]) { font-size: 32px; }
.visual svg text:not([font-weight]) { font-weight: 600; }
.visual svg text:not([fill]) { fill: currentColor; }
.visual svg .sup { font-size: 0.6em; baseline-shift: super; }

.note {
  display: flex; gap: 20px; align-items: flex-start; margin-top: 32px;
  padding: 22px 28px; border-radius: 10px; background: var(--surface);
}
.note-mark {
  flex: none; width: 48px; height: 48px; border-radius: 50%;
  background: var(--ink); color: var(--paper);
  font-size: 28px; font-weight: 700; line-height: 48px; text-align: center;
}
.note-text { font-size: 30px; font-weight: 500; line-height: 1.45; color: var(--ink); padding-top: 2px; }

.bleed-layer { position: absolute; inset: 0; pointer-events: none; z-index: 5; overflow: visible; }

.on-dark { --ink: #F6F2EA; --ink-soft: #D6CFC2; --rule: rgba(246, 242, 234, 0.3); --surface: rgba(246, 242, 234, 0.12); }
.on-dark .card { background: #16171B; }
.on-dark .note-mark { background: #F6F2EA; color: #16171B; }
`;

// ---------------------------------------------------------------------------
// 공용 마크업
// ---------------------------------------------------------------------------
const HEADER = `<header class="hd">
    <span class="series" data-opt="series"><i class="series-mark"></i><span data-slot="series">{{series}}</span></span>
    <span class="page"><b>{{slide_number}}</b> / {{total_slides}}</span>
  </header>`;

const PROGRESS_W = 1080 - 144; // 72px 여백 좌우
const FOOTER = `<div class="progress">
    <div class="rule-track" style="width:${PROGRESS_W}px">${hRuleSvg(PROGRESS_W, 22, 5)}</div>
    <div class="rule-fill" style="width: {{progress_pct}}%; max-width:${PROGRESS_W}px">${hRuleSvg(PROGRESS_W, 22, 9)}</div>
  </div>
  <footer class="ft">
    <span class="account">@{{account_name}}</span>
    ${NEXT_ARROW_SVG}
  </footer>`;

const NOTE = `<aside class="note" data-opt="my_note"><span class="note-mark">{{note_mark}}</span><p class="note-text" data-slot="my_note">{{my_note}}</p></aside>`;

/**
 * cs-v2의 SHARED_SCRIPT와 같은 자리를 하되, 손그림 변환/강조를 배치가 끝난 뒤에 얹고
 * bleed 곡선도 rough.js로 그린다. roughjs 번들과 변환기 소스는 build-cs-doodle.js가
 * 별도 <script>로 앞에 인라인해 두므로(아래 buildHtml 참고) 여기서는 rough/전역
 * __doodleConvert 등을 바로 쓸 수 있다.
 */
const SHARED_SCRIPT = `
(function () {
  var W = 1080;

  Array.prototype.slice.call(document.querySelectorAll('[data-opt]')).forEach(function (el) {
    if (!el.isConnected) return;
    var name = el.getAttribute('data-opt');
    var slot = el.getAttribute('data-slot') === name ? el : el.querySelector('[data-slot="' + name + '"]');
    if (slot && !slot.innerHTML.replace(/<br\\s*\\/?>/gi, '').trim()) el.remove();
  });

  Array.prototype.slice.call(document.querySelectorAll('img[data-optional-src]')).forEach(function (img) {
    if (!img.getAttribute('src')) img.remove();
  });

  var mark = document.querySelector('.note-mark');
  if (mark && !mark.textContent.trim()) mark.textContent = '나';

  var cur = parseInt(document.body.getAttribute('data-slide'), 10);
  var tot = parseInt(document.body.getAttribute('data-total'), 10);
  if (cur >= tot) { var arrow = document.querySelector('.next-arrow'); if (arrow) arrow.remove(); }

  function fit() {
    Array.prototype.slice.call(document.querySelectorAll('[data-fit]')).forEach(function (el) {
      var min = parseFloat(el.getAttribute('data-fit-min')) || 96;
      var size = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > el.clientWidth + 1 && size > min) {
        size -= 4;
        el.style.fontSize = size + 'px';
      }
    });
  }

  function readJson(id) {
    try { return JSON.parse(document.getElementById(id).textContent || '[]'); } catch (e) { return []; }
  }
  function paint(c) {
    if (!c || c === 'ink') return 'var(--ink)';
    if (/^k-/.test(c)) return 'var(--' + c + ')';
    return c;
  }
  function drawBleed() {
    var outs = readJson('bleed-out');
    var ins = readJson('bleed-in');
    if (!outs.length && !ins.length) return;
    var layer = document.querySelector('.bleed-layer');
    var card = document.querySelector('.card').getBoundingClientRect();
    var gen = window.rough && window.rough.generator();
    var NS = 'http://www.w3.org/2000/svg';
    function anchor(id, side) {
      var el = id && document.getElementById(id);
      if (!el) return null;
      var r = el.getBoundingClientRect();
      return { x: (side === 'right' ? r.right : r.left) - card.left, y: r.top + r.height / 2 - card.top };
    }
    function roughPath(d, color, seed) {
      var drawable = gen.path(d, { seed: seed, roughness: 1.4, bowing: 0.9, maxRandomnessOffset: 7, stroke: 'currentColor', strokeWidth: 6 });
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('data-doodle-shape', '1'); // 캡션/라벨 위로 bleed 선이 지나가면 lint가 경고하도록
      (drawable.sets || []).forEach(function (set) {
        var dd = gen.opsToPath(set, 1);
        if (!dd) return;
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', dd);
        p.setAttribute('stroke', 'currentColor');
        p.setAttribute('stroke-width', '6');
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke-linecap', 'round');
        g.appendChild(p);
      });
      g.style.color = paint(color);
      layer.appendChild(g);
    }
    function roughTriangle(pts, color, seed) {
      var drawable = gen.polygon(pts, { seed: seed, roughness: 1.4, bowing: 0.9, maxRandomnessOffset: 7, stroke: 'none', fill: 'currentColor', fillStyle: 'solid' });
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('data-doodle-shape', '1');
      (drawable.sets || []).forEach(function (set) {
        var dd = gen.opsToPath(set, 1);
        if (!dd) return;
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', dd);
        p.setAttribute('fill', 'currentColor');
        p.setAttribute('stroke', 'none');
        g.appendChild(p);
      });
      g.style.color = paint(color);
      layer.appendChild(g);
    }
    outs.forEach(function (b, i) {
      var a = anchor(b.from, 'right') || { x: 1008, y: b.y };
      var sx = a.x + 14, ex = W + 10, mx = sx + (ex - sx) * 0.5;
      roughPath('M' + sx + ' ' + a.y + ' C' + mx + ' ' + a.y + ' ' + mx + ' ' + b.y + ' ' + ex + ' ' + b.y, b.color, 900 + i * 7);
    });
    ins.forEach(function (b, i) {
      var a = anchor(b.to, 'left') || { x: 72, y: b.y };
      var tip = a.x - 14, ex = tip - 22, sx = -10, mx = sx + (ex - sx) * 0.5;
      roughPath('M' + sx + ' ' + b.y + ' C' + mx + ' ' + b.y + ' ' + mx + ' ' + a.y + ' ' + ex + ' ' + a.y, b.color, 950 + i * 7);
      roughTriangle([[tip - 30, a.y - 17], [tip, a.y], [tip - 30, a.y + 17]], b.color, 960 + i * 7);
    });
  }

  // 배지 테두리, 이미지 placeholder, cta 다음 편 박스처럼 텍스트 길이에 따라 크기가
  // 달라지는 상자는 미리 구울 수 없다 — 배치가 끝난 뒤 실제 크기를 재서 그린다.
  // 레이아웃(폭/높이)이 늘 같은 입력에 대해 결정적이므로 seed도 순서 기반으로 고정하면
  // 재렌더링 결과가 항상 같다.
  function drawBoxes() {
    var boxes = document.querySelectorAll('[data-doodle-box]');
    if (!boxes.length) return;
    var layer = document.querySelector('.bleed-layer');
    var card = document.querySelector('.card').getBoundingClientRect();
    var gen = window.rough && window.rough.generator();
    var NS = 'http://www.w3.org/2000/svg';
    Array.prototype.forEach.call(boxes, function (el, i) {
      var r = el.getBoundingClientRect();
      var pad = 4;
      // 주의: rough.js의 rectangle()/polygon()/circle()/ellipse()는 fill 옵션을 "값이
      // 있으면 채운다"로 판단해서, 문자열 'none'도 참으로 보고 해쳐 채움 세트를 만들어
      // 버린다(path()/curve()만 'none'을 예외로 걸러준다). 그래서 fill 자체를 안 넘겨야
      // 안 채워진다 — 여기서 fill 키를 아예 생략한다.
      var drawable = gen.rectangle(r.left - card.left + pad, r.top - card.top + pad, r.width - pad * 2, r.height - pad * 2,
        { seed: 2000 + i * 11, roughness: 1.4, bowing: 0.9, maxRandomnessOffset: 7, stroke: 'currentColor', strokeWidth: 5 });
      var g = document.createElementNS(NS, 'g');
      (drawable.sets || []).forEach(function (set) {
        if (set.type !== 'path') return; // fill을 안 넘겼으니 fillPath/fillSketch는 안 나오지만 방어적으로 한 번 더 확인
        var d = gen.opsToPath(set, 1);
        if (!d) return;
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        p.setAttribute('stroke', 'currentColor');
        p.setAttribute('stroke-width', '5');
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke-linecap', 'round');
        g.appendChild(p);
      });
      g.style.color = paint(el.getAttribute('data-doodle-box'));
      layer.appendChild(g);
    });
  }

  function afterFonts() {
    fit();
    if (window.__doodleConvert) window.__doodleConvert();
    if (window.__doodleEmphasize) window.__doodleEmphasize();
    drawBleed();
    drawBoxes();
    document.body.setAttribute('data-ready', '1');
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(afterFonts); else afterFonts();
})();
`;

// ---------------------------------------------------------------------------
// 슬라이드 타입별 정의 — cs-v2와 같은 필드/구조. chrome만 rough SVG로 바꾼다.
// ---------------------------------------------------------------------------
const TYPES = {};

TYPES['cover'] = {
  css: `
.cover { justify-content: flex-end; }
.cover-visual { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; margin-bottom: 48px; }
.cover-visual .visual { display: flex; justify-content: center; }
.cover-title { font-size: 104px; font-weight: 800; line-height: 1.2; letter-spacing: -0.03em; }
.cover:not(:has(.cover-visual)) .cover-title { font-size: 120px; }
.cover-sub { margin-top: 40px; font-size: 36px; font-weight: 600; line-height: 1.4; color: var(--ink-soft); }
`,
  main: `<main class="main cover">
    <div class="cover-visual" data-opt="visual"><div class="visual" data-slot="visual">{{visual}}</div></div>
    <h1 class="cover-title">{{headline}}</h1>
    <p class="cover-sub" data-opt="subtext" data-slot="subtext">{{subtext}}</p>
  </main>`,
};

TYPES['content'] = {
  css: ``,
  main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <p class="lead" data-opt="lead" data-slot="lead">{{lead}}</p>
    <div class="stage stage-top"><div class="body">{{body}}</div></div>
    <p class="caption" data-opt="subtext" data-slot="subtext">{{subtext}}</p>
    ${NOTE}
  </main>`,
};

TYPES['content-diagram'] = {
  css: `
.stage-visual { justify-content: center; }
`,
  main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <p class="lead" data-opt="lead" data-slot="lead">{{lead}}</p>
    <div class="stage stage-visual"><div class="visual">{{visual}}</div></div>
    <p class="caption" data-opt="caption" data-slot="caption">{{caption}}</p>
    ${NOTE}
  </main>`,
};

// step-connector는 실제 높이가 콘텐츠 길이에 따라 달라지므로(고정 불가) 넉넉히 길게
// 구워서 overflow:hidden으로 실제 칸 높이만큼만 보이게 자른다. 같은 트릭을
// split-rule/hl-rule/grid-rule-v에도 쓴다.
const STEP_CONNECTOR = vRuleSvg(4, 1200, 5);
const step = (n) => `<li class="step" data-opt="step${n}">
        <span class="step-num">${n}</span>
        <div class="step-main">
          <p class="step-title" data-opt="step${n}_title" data-slot="step${n}_title">{{step${n}_title}}</p>
          <div class="step-text" data-slot="step${n}">{{step${n}}}</div>
        </div>
        ${n < 4 ? `<div class="step-connector">${STEP_CONNECTOR}</div>` : ''}
      </li>`;

TYPES['content-steps'] = {
  css: `
.steps { list-style: none; flex: 1; display: flex; flex-direction: column; }
.step { flex: 1; display: grid; grid-template-columns: 88px 1fr; column-gap: 36px; position: relative; padding-bottom: 40px; }
.step:last-child { flex: none; padding-bottom: 0; }
.step-connector { position: absolute; left: 42px; top: 88px; bottom: 0; width: 4px; overflow: hidden; }
.step-connector svg { position: absolute; left: 50%; top: 0; transform: translateX(-50%); }
.step-num {
  width: 88px; height: 88px; border-radius: 50%; border: 4px solid var(--ink); background: var(--paper);
  font-size: 44px; font-weight: 800; line-height: 80px; text-align: center; font-variant-numeric: tabular-nums;
}
.step-main { padding-top: 12px; }
.step-title { font-size: 44px; font-weight: 800; line-height: 1.3; letter-spacing: -0.01em; margin-bottom: 10px; }
.step-text { font-size: 38px; font-weight: 500; line-height: 1.5; }
`,
  main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <p class="lead" data-opt="lead" data-slot="lead">{{lead}}</p>
    <div class="stage">
      <ol class="steps">
      ${[1, 2, 3, 4].map(step).join('\n      ')}
      </ol>
    </div>
    <p class="caption" data-opt="body" data-slot="body">{{body}}</p>
    ${NOTE}
  </main>`,
};

const listItem = (n) =>
  `<li class="item" data-opt="item${n}"><span class="item-num">${n}</span><div class="item-text" data-slot="item${n}">{{item${n}}}</div></li>`;

TYPES['content-list'] = {
  css: `
.list { list-style: none; flex: 1; display: flex; flex-direction: column; }
.list-rule { overflow: visible; }
.item { flex: 1; display: grid; grid-template-columns: 64px 1fr; column-gap: 24px; align-items: center; padding: 24px 0; }
.item-num { font-size: 44px; font-weight: 800; color: var(--ink-soft); font-variant-numeric: tabular-nums; }
.item-text { font-size: 38px; font-weight: 600; line-height: 1.45; }
`,
  main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <p class="lead" data-opt="lead" data-slot="lead">{{lead}}</p>
    <div class="stage">
      <div class="list-rule">${hRuleSvg(PROGRESS_W, 12, 5)}</div>
      <ol class="list">
      ${[1, 2, 3, 4, 5].map((n) => `${listItem(n)}\n      <li class="list-rule">${hRuleSvg(PROGRESS_W, 12, 5)}</li>`).join('\n      ')}
      </ol>
    </div>
    ${NOTE}
  </main>`,
};

TYPES['content-split'] = {
  css: `
.split { flex: 1; display: grid; grid-template-columns: 1fr 1fr; column-gap: 56px; position: relative; }
.split-rule { position: absolute; left: 50%; top: 40px; bottom: 0; width: 6px; margin-left: -3px; overflow: hidden; }
/* color를 여기서 지정하지 않는다: {{left_color}}/{{right_color}}(k-a 등)와 같은 요소에
   같은 우선순위로 걸리면 나중에 선언된 쪽(이 규칙)이 이겨서 제목이 늘 잉크색으로만
   보인다. 색을 안 주면 .k-a 같은 개념 토큰 class가 그대로 이기고, col-title은 부모
   색을 상속해 제목에 범례색이 실제로 입혀진다(본문은 아래 .col-body가 잉크로 고정). */
.col { padding-top: 32px; display: flex; flex-direction: column; gap: 22px; }
.col-rule { overflow: visible; margin-bottom: 4px; }
.col-title { font-size: 48px; font-weight: 800; line-height: 1.25; letter-spacing: -0.01em; }
.col-body { font-size: 36px; font-weight: 500; line-height: 1.5; color: var(--ink); }
`,
  main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <p class="lead" data-opt="lead" data-slot="lead">{{lead}}</p>
    <div class="stage">
      <div class="split">
        <div class="split-rule">${vRuleSvg(6, 1200, 5)}</div>
        <section class="col {{left_color}}"><div class="col-rule">${hRuleSvg(420, 12, 8)}</div><p class="col-title">{{left_title}}</p><div class="col-body">{{left_body}}</div></section>
        <section class="col {{right_color}}"><div class="col-rule">${hRuleSvg(420, 12, 8)}</div><p class="col-title">{{right_title}}</p><div class="col-body">{{right_body}}</div></section>
      </div>
    </div>
    <p class="caption" data-opt="subtext" data-slot="subtext">{{subtext}}</p>
    ${NOTE}
  </main>`,
};

TYPES['content-highlight'] = {
  css: `
.hl { display: flex; gap: 44px; }
.hl-rule { flex: none; position: relative; overflow: hidden; }
.hl-rule svg { position: absolute; top: 0; left: 0; }
.hl-body-wrap { padding: 8px 0; }
.hl-em { font-size: 76px; font-weight: 800; line-height: 1.2; letter-spacing: -0.02em; }
.hl-body { margin-top: 32px; }
`,
  main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <div class="stage stage-center">
      <div class="hl">
        <div class="hl-rule">${vRuleSvg(12, 900, 10)}</div>
        <div class="hl-body-wrap">
          <p class="hl-em">{{emphasis}}</p>
          <div class="body hl-body" data-opt="body" data-slot="body">{{body}}</div>
        </div>
      </div>
    </div>
    <p class="caption" data-opt="subtext" data-slot="subtext">{{subtext}}</p>
    ${NOTE}
  </main>`,
};

TYPES['content-stat'] = {
  css: `
.stat { margin-top: 0; }
.stat-num { font-size: 220px; font-weight: 800; line-height: 1; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; white-space: nowrap; }
.stat-title { margin-top: 44px; font-size: 60px; }
.stat-body { margin-top: 28px; }
`,
  main: `<main class="main">
    <div class="stage stage-center stat">
      <p class="stat-num" data-fit data-fit-min="120">{{emphasis}}</p>
      <h2 class="title stat-title">{{headline}}</h2>
      <div class="body stat-body" data-opt="body" data-slot="body">{{body}}</div>
    </div>
    ${NOTE}
  </main>`,
};

TYPES['content-bigdata'] = {
  css: `
.big { display: flex; align-items: baseline; gap: 20px; white-space: nowrap; }
.big-num { font-size: 240px; font-weight: 800; line-height: 1.05; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; }
.big-unit { font-size: 72px; font-weight: 700; }
.big-body { margin-top: 40px; }
`,
  main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <div class="stage stage-center">
      <div class="big" data-fit data-fit-min="120"><span class="big-num">{{bigdata_number}}</span><span class="big-unit">{{bigdata_unit}}</span></div>
      <div class="body big-body" data-opt="body" data-slot="body">{{body}}</div>
    </div>
    <p class="caption" data-opt="subtext" data-slot="subtext">{{subtext}}</p>
    ${NOTE}
  </main>`,
};

TYPES['content-quote'] = {
  css: `
.quote-mark { display: block; color: var(--rule); margin-bottom: 40px; }
.quote-text { font-size: 52px; font-weight: 700; line-height: 1.45; letter-spacing: -0.01em; }
.quote-by { margin-top: 48px; display: flex; align-items: center; gap: 20px; font-size: 32px; font-weight: 600; color: var(--ink-soft); }
.quote-rule { flex: none; overflow: visible; }
`,
  main: `<main class="main">
    <div class="stage stage-center" style="margin-top: 0">
      ${QUOTE_MARK_SVG}
      <blockquote class="quote-text">{{body}}</blockquote>
      <p class="quote-by" data-opt="headline" data-slot="headline"><span class="quote-rule">${hRuleSvg(48, 10, 6)}</span><span data-slot="headline">{{headline}}</span></p>
    </div>
    ${NOTE}
  </main>`,
};

TYPES['content-badge'] = {
  css: `
.badge-wrap { align-self: flex-start; display: inline-flex; }
.badge { font-size: 30px; font-weight: 700; line-height: 1.3; padding: 10px 26px; }
.badge-title { margin-top: 44px; font-size: 84px; line-height: 1.2; letter-spacing: -0.03em; }
.badge-body { margin-top: 44px; }
`,
  main: `<main class="main">
    <div class="stage stage-center" style="margin-top: 0">
      <span class="badge-wrap" data-opt="badge_text" data-doodle-box="ink"><span class="badge" data-slot="badge_text">{{badge_text}}</span></span>
      <h2 class="title badge-title">{{headline}}</h2>
      <div class="body badge-body" data-opt="body" data-slot="body">{{body}}</div>
    </div>
    <p class="caption" data-opt="subtext" data-slot="subtext">{{subtext}}</p>
    ${NOTE}
  </main>`,
};

TYPES['content-image'] = {
  css: `
.img-box { position: relative; flex: 1; min-height: 360px; display: flex; align-items: center; justify-content: center; }
.img-box img { position: relative; width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }
.img-empty { position: relative; font-size: 30px; font-weight: 600; color: var(--ink-soft); }
.img-body { margin-top: 36px; }
`,
  main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <div class="stage">
      <figure class="img-box" data-doodle-box="soft"><span class="img-empty">이미지 영역</span><img data-optional-src src="{{image_url}}" alt=""></figure>
      <div class="body img-body" data-opt="body" data-slot="body">{{body}}</div>
    </div>
    <p class="caption" data-opt="subtext" data-slot="subtext">{{subtext}}</p>
    ${NOTE}
  </main>`,
};

const cell = (n) => `<div class="cell">
          <div class="cell-icon" data-opt="grid${n}_icon" data-slot="grid${n}_icon">{{grid${n}_icon}}</div>
          <p class="cell-title">{{grid${n}_title}}</p>
          <p class="cell-desc" data-opt="grid${n}_desc" data-slot="grid${n}_desc">{{grid${n}_desc}}</p>
        </div>`;

TYPES['content-grid'] = {
  css: `
.grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; position: relative; }
.grid-rule-v { position: absolute; left: 50%; top: 0; bottom: 0; width: 6px; margin-left: -3px; overflow: hidden; }
.grid-rule-h { position: absolute; top: 50%; left: 0; right: 0; height: 6px; margin-top: -3px; overflow: visible; }
.cell { display: flex; flex-direction: column; justify-content: center; padding: 32px 40px 32px 0; }
.cell:nth-child(2n) { padding: 32px 0 32px 44px; }
.cell-icon { height: 72px; margin-bottom: 24px; font-size: 60px; line-height: 72px; color: var(--ink); }
.cell-icon svg { display: block; width: 72px; height: 72px; }
.cell-title { font-size: 40px; font-weight: 800; line-height: 1.3; }
.cell-desc { margin-top: 12px; font-size: 32px; font-weight: 500; line-height: 1.45; color: var(--ink-soft); }
`,
  main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <div class="stage">
      <div class="grid">
        <div class="grid-rule-v">${vRuleSvg(6, 900, 5)}</div>
        <div class="grid-rule-h">${hRuleSvg(936, 6, 5)}</div>
        ${[1, 2, 3, 4].map(cell).join('\n        ')}
      </div>
    </div>
    ${NOTE}
  </main>`,
};

TYPES['content-fullimage'] = {
  bodyClass: 'on-dark',
  css: `
.fi-bg { position: absolute; inset: 0; }
.fi-bg img { width: 100%; height: 100%; object-fit: cover; display: block; }
.fi-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(22, 23, 27, 0.72) 0%, rgba(22, 23, 27, 0.8) 45%, rgba(22, 23, 27, 0.94) 100%); }
.fi { justify-content: flex-end; }
.fi-sec { margin-top: 44px; }
.fi-badge-wrap { display: inline-flex; }
.fi-badge { font-size: 30px; font-weight: 700; line-height: 1.3; padding: 8px 24px; margin-bottom: 18px; }
`,
  main: `<div class="fi-bg"><img data-optional-src src="{{image_url}}" alt=""></div>
  <div class="fi-shade"></div>
  <main class="main fi">
    <h2 class="title">{{headline}}</h2>
    <section class="fi-sec" data-opt="body">
      <span class="fi-badge-wrap" data-opt="badge_text" data-doodle-box="ink"><span class="fi-badge" data-slot="badge_text">{{badge_text}}</span></span>
      <div class="body" data-slot="body">{{body}}</div>
    </section>
    <section class="fi-sec" data-opt="body2">
      <span class="fi-badge-wrap" data-opt="badge2_text" data-doodle-box="ink"><span class="fi-badge" data-slot="badge2_text">{{badge2_text}}</span></span>
      <div class="body" data-slot="body2">{{body2}}</div>
    </section>
  </main>`,
};

const row = (n) =>
  `<div class="row" data-opt="row${n}_value"><dt>{{row${n}_label}}</dt><dd data-slot="row${n}_value">{{row${n}_value}}</dd></div>`;

TYPES['content-cheatsheet'] = {
  css: `
.sheet { flex: 1; display: flex; flex-direction: column; margin-top: 40px; }
.sheet-rule { overflow: visible; }
.row { flex: 1; display: grid; grid-template-columns: 196px 1fr; column-gap: 28px; align-items: center; padding: 16px 0; }
.row dt { font-size: 30px; font-weight: 700; line-height: 1.35; color: var(--ink-soft); }
.row dd { font-size: 36px; font-weight: 600; line-height: 1.4; }
.save { margin-top: 28px; display: flex; align-items: center; gap: 16px; font-size: 30px; font-weight: 600; line-height: 1.4; }
.save svg { flex: none; }
`,
  main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <dl class="sheet">
      <div class="sheet-rule">${hRuleSvg(PROGRESS_W, 12, 8)}</div>
      ${[1, 2, 3, 4, 5, 6].map((n) => `${row(n)}\n      <div class="sheet-rule">${hRuleSvg(PROGRESS_W, 12, n === 6 ? 8 : 5)}</div>`).join('\n      ')}
    </dl>
    <p class="save" data-opt="save_hint"><svg width="30" height="36" viewBox="0 0 30 36">${R.path('M3 3h24v30L15 24 3 33z', chromeOpts(nextSeed()))}</svg><span data-slot="save_hint">{{save_hint}}</span></p>
    ${NOTE}
  </main>`,
};

TYPES['cta'] = {
  bodyClass: 'is-cta',
  css: `
.cta { align-items: center; text-align: center; }
.cta-core { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.cta-art { color: var(--ink); margin-bottom: 64px; }
.cta-art:has(.visual) .cta-plane { display: none; }
.cta-title { font-size: 72px; font-weight: 800; line-height: 1.25; letter-spacing: -0.02em; }
.cta-text { margin-top: 32px; font-size: 38px; font-weight: 500; line-height: 1.5; color: var(--ink-soft); }
.next-wrap { align-self: stretch; }
.next { text-align: left; display: flex; align-items: baseline; gap: 28px; padding: 32px 40px; }
.next-label { flex: none; font-size: 30px; font-weight: 700; color: var(--ink-soft); }
.next-topic { font-size: 36px; font-weight: 700; line-height: 1.4; }
.is-cta .ft .account { font-size: 36px; font-weight: 700; color: var(--ink); }
`,
  main: `<main class="main cta">
    <div class="cta-core">
      <div class="cta-art">
        <div class="visual" data-opt="visual" data-slot="visual">{{visual}}</div>
        ${CTA_PLANE_SVG}
      </div>
      <h2 class="cta-title">{{headline}}</h2>
      <p class="cta-text" data-opt="cta_text" data-slot="cta_text">{{cta_text}}</p>
    </div>
    <div class="next-wrap" data-opt="next_topic" data-doodle-box="ink"><div class="next"><span class="next-label">다음 편</span><span class="next-topic" data-slot="next_topic">{{next_topic}}</span></div></div>
  </main>`,
};

// ---------------------------------------------------------------------------
function buildHtml(type, def) {
  return `<!DOCTYPE html>
<!-- GENERATED by scripts/build-cs-doodle.js: 이 파일을 직접 고치지 말고 빌더를 수정한 뒤 다시 생성할 것 -->
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080">
  <title>cs-doodle ${type}</title>
  <link rel="stylesheet" crossorigin href="${PRETENDARD_CSS}">
  <link rel="stylesheet" href="${MONO_CSS}">
  <link rel="stylesheet" href="${HAND_CSS}">
  <style>${BASE_CSS}${def.css}</style>
</head>
<body class="${def.bodyClass || ''}" data-type="${type}" data-fonts="Pretendard Variable|Gamja Flower" data-slide="{{slide_number}}" data-total="{{total_slides}}">
${objectSpriteMarkup()}
<span aria-hidden="true" style="position:absolute;opacity:0;pointer-events:none;font-family:'Gamja Flower'">가</span>
<div class="card">
  ${HEADER}
  ${def.main.replace('<main class="main', '<main data-lint-region class="main')}
  ${FOOTER}
  <svg class="bleed-layer" width="1080" height="1350" viewBox="0 0 1080 1350"></svg>
</div>
<script type="application/json" id="bleed-out">{{bleed_out}}</script>
<script type="application/json" id="bleed-in">{{bleed_in}}</script>
${doodleScriptTag()}
<script>${SHARED_SCRIPT}</script>
</body>
</html>
`;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [type, def] of Object.entries(TYPES)) {
    fs.writeFileSync(path.join(OUT_DIR, `${type}.html`), buildHtml(type, def));
  }
  console.log(`cs-doodle: ${Object.keys(TYPES).length} templates written to ${OUT_DIR}`);
}

if (require.main === module) main();

module.exports = { TYPES };
