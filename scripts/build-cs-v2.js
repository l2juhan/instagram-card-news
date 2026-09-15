'use strict';

/**
 * cs-v2 템플릿 빌더.
 *
 * templates/cs-v2/*.html 은 이 스크립트가 생성한다. 각 HTML은 render.js 규칙대로
 * 외부 CSS 없이 독립 문서지만, 헤더·푸터·색 토큰·공용 스크립트를 공유하므로
 * 템플릿을 고칠 때는 생성된 HTML이 아니라 이 파일을 수정한 뒤 다시 실행한다.
 *
 *   node scripts/build-cs-v2.js
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'templates', 'cs-v2');

const PRETENDARD_CSS =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
const MONO_CSS = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap';

// ---------------------------------------------------------------------------
// 공용 CSS
// ---------------------------------------------------------------------------
const BASE_CSS = `
*, *::before, *::after { box-sizing: border-box; }
:root {
  /* 베이스 */
  --paper: #F6F2EA;
  --surface: #ECE5D8;
  --ink: #16171B;
  --ink-soft: #4A4B53;
  --rule: #CFC6B6;
  /* 내비게이션 전용 (진행바, 시리즈 마크) */
  --accent: {{accent_color}};
  /* 개념 토큰: 주체 A/B + 공개 + 결합 + 위협 */
  --k-pub: #7A5800;
  --k-a: #AE3226;
  --k-b: #1F5FA8;
  --k-a2: #9E4A0E;
  --k-b2: #2A6A3B;
  --k-ab: #6B4226;
  --k-threat: #6A3491;
  --sans: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, monospace;
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

/* 개념 토큰 — HTML은 글자색, SVG 도형은 fill/stroke="currentColor"와 함께 */
.k-pub { color: var(--k-pub); } .k-a { color: var(--k-a); } .k-b { color: var(--k-b); }
.k-a2 { color: var(--k-a2); } .k-b2 { color: var(--k-b2); } .k-ab { color: var(--k-ab); }
.k-threat { color: var(--k-threat); } .ink { color: var(--ink); } .soft { color: var(--ink-soft); }
strong, b { font-weight: 800; }

/* 수식: 위첨자는 0.6em → 기본 크기 48px 이상이어야 28px 하한을 지킨다 */
.eq { font-size: 48px; font-variant-numeric: tabular-nums; white-space: nowrap; font-weight: 700; }
.eq-lg { font-size: 60px; }
sup { font-size: 0.6em; line-height: 0; position: relative; top: -0.62em; vertical-align: baseline; }
.mod { font-weight: 500; color: var(--ink-soft); }
code, .mono { font-family: var(--mono); font-weight: 500; }

/* 헤더 */
.hd {
  position: absolute; top: 56px; left: 72px; right: 72px; height: 40px;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 30px; line-height: 40px; font-weight: 600;
}
.series { display: flex; align-items: center; gap: 14px; color: var(--ink); }
.series-mark { display: block; width: 16px; height: 16px; border-radius: 3px; background: var(--accent); }
.page { color: var(--ink-soft); font-weight: 500; font-variant-numeric: tabular-nums; margin-left: auto; }
.page b { color: var(--ink); font-weight: 700; }

/* 콘텐츠 영역: x 72–1008, y 150–1180 */
.main { position: absolute; top: 150px; left: 72px; right: 72px; bottom: 170px; display: flex; flex-direction: column; }

/* 진행바 + 푸터 */
.progress { position: absolute; top: 1206px; left: 72px; right: 72px; height: 6px; border-radius: 3px; background: var(--rule); overflow: hidden; }
.progress i { display: block; height: 100%; background: var(--accent); }
.ft {
  position: absolute; top: 1234px; left: 72px; right: 72px; height: 44px;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 30px; line-height: 44px; font-weight: 500; color: var(--ink-soft);
}
.next-arrow { display: block; color: var(--ink); }

/* 타입 스케일 */
.title { font-size: 68px; font-weight: 800; line-height: 1.25; letter-spacing: -0.02em; }
.lead { font-size: 44px; font-weight: 700; line-height: 1.4; letter-spacing: -0.01em; margin-top: 28px; }
.body { font-size: 38px; font-weight: 500; line-height: 1.5; }
.caption { font-size: 30px; font-weight: 500; line-height: 1.45; color: var(--ink-soft); margin-top: 28px; }

/* 본문 스테이지 */
.stage { flex: 1; min-height: 0; display: flex; flex-direction: column; margin-top: 48px; }
.stage-top { justify-content: flex-start; }
.stage-center { justify-content: center; }

/* 다이어그램: SVG는 viewBox를 픽셀과 1:1로 (width 936) */
.visual { width: 100%; }
.visual > svg { display: block; overflow: visible; max-width: none; }
.visual svg text:not([font-family]) { font-family: var(--sans); }
.visual svg text:not([font-size]) { font-size: 32px; }
.visual svg text:not([font-weight]) { font-weight: 600; }
.visual svg text:not([fill]) { fill: currentColor; }
.visual svg .sup { font-size: 0.6em; baseline-shift: super; }

/* my_note: 작성자 한 줄 */
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

/* bleed 선 레이어 */
.bleed-layer { position: absolute; inset: 0; pointer-events: none; z-index: 5; overflow: visible; }

/* 어두운 배경 슬라이드 */
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

const FOOTER = `<div class="progress"><i style="width: {{progress_pct}}%"></i></div>
  <footer class="ft">
    <span class="account">@{{account_name}}</span>
    <svg class="next-arrow" width="52" height="28" viewBox="0 0 52 28" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h44M36 4l11 10-11 10"/></svg>
  </footer>`;

const NOTE = `<aside class="note" data-opt="my_note"><span class="note-mark">{{note_mark}}</span><p class="note-text" data-slot="my_note">{{my_note}}</p></aside>`;

const SHARED_SCRIPT = `
(function () {
  var W = 1080;

  // 1) 선택 영역 제거: data-opt="x" 요소 안의 data-slot="x"가 비어 있으면 통째로 제거
  Array.prototype.slice.call(document.querySelectorAll('[data-opt]')).forEach(function (el) {
    if (!el.isConnected) return;
    var name = el.getAttribute('data-opt');
    var slot = el.getAttribute('data-slot') === name ? el : el.querySelector('[data-slot="' + name + '"]');
    if (slot && !slot.innerHTML.replace(/<br\\s*\\/?>/gi, '').trim()) el.remove();
  });

  // 2) 이미지가 없으면 img 제거
  Array.prototype.slice.call(document.querySelectorAll('img[data-optional-src]')).forEach(function (img) {
    if (!img.getAttribute('src')) img.remove();
  });

  // 3) my_note 마크 기본값
  var mark = document.querySelector('.note-mark');
  if (mark && !mark.textContent.trim()) mark.textContent = '나';

  // 4) 마지막 장에는 다음 화살표 없음
  var cur = parseInt(document.body.getAttribute('data-slide'), 10);
  var tot = parseInt(document.body.getAttribute('data-total'), 10);
  if (cur >= tot) { var arrow = document.querySelector('.next-arrow'); if (arrow) arrow.remove(); }

  // 5) data-fit: 가로로 넘치면 글자 크기를 줄인다 (data-fit-min 하한)
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

  // 6) bleed: 이전/다음 장과 같은 y에서 이어지는 선
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
    var NS = 'http://www.w3.org/2000/svg';
    function anchor(id, side) {
      var el = id && document.getElementById(id);
      if (!el) return null;
      var r = el.getBoundingClientRect();
      return { x: (side === 'right' ? r.right : r.left) - card.left, y: r.top + r.height / 2 - card.top };
    }
    function add(tag, attrs, color) {
      var node = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
      node.style.color = paint(color);
      layer.appendChild(node);
      return node;
    }
    outs.forEach(function (b) {
      var a = anchor(b.from, 'right') || { x: 1008, y: b.y };
      var sx = a.x + 14, ex = W + 10, mx = sx + (ex - sx) * 0.5;
      add('path', { d: 'M' + sx + ' ' + a.y + ' C' + mx + ' ' + a.y + ' ' + mx + ' ' + b.y + ' ' + ex + ' ' + b.y,
        fill: 'none', stroke: 'currentColor', 'stroke-width': 6, 'stroke-linecap': 'round' }, b.color);
    });
    ins.forEach(function (b) {
      var a = anchor(b.to, 'left') || { x: 72, y: b.y };
      var tip = a.x - 14, ex = tip - 22, sx = -10, mx = sx + (ex - sx) * 0.5;
      add('path', { d: 'M' + sx + ' ' + b.y + ' C' + mx + ' ' + b.y + ' ' + mx + ' ' + a.y + ' ' + ex + ' ' + a.y,
        fill: 'none', stroke: 'currentColor', 'stroke-width': 6, 'stroke-linecap': 'round' }, b.color);
      add('path', { d: 'M' + (tip - 30) + ' ' + (a.y - 17) + ' L' + tip + ' ' + a.y + ' L' + (tip - 30) + ' ' + (a.y + 17) + ' Z',
        fill: 'currentColor' }, b.color);
    });
  }

  function afterFonts() { fit(); drawBleed(); document.body.setAttribute('data-ready', '1'); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(afterFonts); else afterFonts();
})();
`;

// ---------------------------------------------------------------------------
// 슬라이드 타입별 정의 { css, main, bodyClass? }
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

const step = (n) => `<li class="step" data-opt="step${n}">
        <span class="step-num">${n}</span>
        <div class="step-main">
          <p class="step-title" data-opt="step${n}_title" data-slot="step${n}_title">{{step${n}_title}}</p>
          <div class="step-text" data-slot="step${n}">{{step${n}}}</div>
        </div>
      </li>`;

TYPES['content-steps'] = {
  css: `
.steps { list-style: none; flex: 1; display: flex; flex-direction: column; }
.step { flex: 1; display: grid; grid-template-columns: 88px 1fr; column-gap: 36px; position: relative; padding-bottom: 40px; }
.step:last-child { flex: none; padding-bottom: 0; }
.step:not(:last-child)::before { content: ''; position: absolute; left: 42px; top: 88px; bottom: 0; width: 4px; background: var(--rule); }
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
.list { list-style: none; flex: 1; display: flex; flex-direction: column; border-bottom: 2px solid var(--rule); }
.item { flex: 1; display: grid; grid-template-columns: 64px 1fr; column-gap: 24px; align-items: center; padding: 24px 0; border-top: 2px solid var(--rule); }
.item-num { font-size: 44px; font-weight: 800; color: var(--ink-soft); font-variant-numeric: tabular-nums; }
.item-text { font-size: 38px; font-weight: 600; line-height: 1.45; }
`,
  main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <p class="lead" data-opt="lead" data-slot="lead">{{lead}}</p>
    <div class="stage">
      <ol class="list">
      ${[1, 2, 3, 4, 5].map(listItem).join('\n      ')}
      </ol>
    </div>
    ${NOTE}
  </main>`,
};

TYPES['content-split'] = {
  css: `
.split { flex: 1; display: grid; grid-template-columns: 1fr 1fr; column-gap: 56px; position: relative; }
.split::before { content: ''; position: absolute; left: 50%; top: 40px; bottom: 0; width: 2px; margin-left: -1px; background: var(--rule); }
.col { color: var(--ink); border-top: 10px solid currentColor; padding-top: 32px; display: flex; flex-direction: column; gap: 22px; }
.col-title { font-size: 48px; font-weight: 800; line-height: 1.25; letter-spacing: -0.01em; }
.col-body { font-size: 36px; font-weight: 500; line-height: 1.5; color: var(--ink); }
`,
  main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <p class="lead" data-opt="lead" data-slot="lead">{{lead}}</p>
    <div class="stage">
      <div class="split">
        <section class="col {{left_color}}"><p class="col-title">{{left_title}}</p><div class="col-body">{{left_body}}</div></section>
        <section class="col {{right_color}}"><p class="col-title">{{right_title}}</p><div class="col-body">{{right_body}}</div></section>
      </div>
    </div>
    <p class="caption" data-opt="subtext" data-slot="subtext">{{subtext}}</p>
    ${NOTE}
  </main>`,
};

TYPES['content-highlight'] = {
  css: `
.hl { border-left: 12px solid var(--ink); padding: 8px 0 8px 44px; }
.hl-em { font-size: 76px; font-weight: 800; line-height: 1.2; letter-spacing: -0.02em; }
.hl-body { margin-top: 32px; }
`,
  main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <div class="stage stage-center">
      <div class="hl">
        <p class="hl-em">{{emphasis}}</p>
        <div class="body hl-body" data-opt="body" data-slot="body">{{body}}</div>
      </div>
    </div>
    <p class="caption" data-opt="subtext" data-slot="subtext">{{subtext}}</p>
    ${NOTE}
  </main>`,
};

TYPES['content-stat'] = {
  css: `
.stat { margin-top: 0; }
.stat-num { font-size: 220px; font-weight: 800; line-height: 1; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; }
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
.big { display: flex; align-items: baseline; gap: 20px; white-space: nowrap; overflow: hidden; }
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
.quote-by::before { content: ''; width: 48px; height: 4px; background: var(--ink-soft); flex: none; }
`,
  main: `<main class="main">
    <div class="stage stage-center" style="margin-top: 0">
      <svg class="quote-mark" width="120" height="96" viewBox="0 0 120 96" fill="currentColor"><path d="M0 96V58C0 26 16 5 48 0v20C32 25 26 37 26 52h22v44H0zM68 96V58c0-32 16-53 48-58v20c-16 5-22 17-22 32h22v44H68z"/></svg>
      <blockquote class="quote-text">{{body}}</blockquote>
      <p class="quote-by" data-opt="headline" data-slot="headline">{{headline}}</p>
    </div>
    ${NOTE}
  </main>`,
};

TYPES['content-badge'] = {
  css: `
.badge { align-self: flex-start; font-size: 30px; font-weight: 700; line-height: 1.3; padding: 10px 26px; border: 3px solid var(--ink); border-radius: 999px; }
.badge-title { margin-top: 44px; font-size: 84px; line-height: 1.2; letter-spacing: -0.03em; }
.badge-body { margin-top: 44px; }
`,
  main: `<main class="main">
    <div class="stage stage-center" style="margin-top: 0">
      <span class="badge" data-opt="badge_text" data-slot="badge_text">{{badge_text}}</span>
      <h2 class="title badge-title">{{headline}}</h2>
      <div class="body badge-body" data-opt="body" data-slot="body">{{body}}</div>
    </div>
    <p class="caption" data-opt="subtext" data-slot="subtext">{{subtext}}</p>
    ${NOTE}
  </main>`,
};

TYPES['content-image'] = {
  css: `
.img-box { position: relative; flex: 1; min-height: 360px; border-radius: 12px; overflow: hidden; background: var(--surface); display: flex; align-items: center; justify-content: center; }
.img-box img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.img-empty { font-size: 30px; font-weight: 600; color: var(--ink-soft); }
.img-body { margin-top: 36px; }
`,
  main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <div class="stage">
      <figure class="img-box"><span class="img-empty">이미지 영역</span><img data-optional-src src="{{image_url}}" alt=""></figure>
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
.grid::before { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: var(--rule); }
.grid::after { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 2px; margin-top: -1px; background: var(--rule); }
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
.fi-badge { display: inline-block; font-size: 30px; font-weight: 700; line-height: 1.3; padding: 8px 24px; border: 3px solid var(--ink); border-radius: 999px; margin-bottom: 18px; }
`,
  main: `<div class="fi-bg"><img data-optional-src src="{{image_url}}" alt=""></div>
  <div class="fi-shade"></div>
  <main class="main fi">
    <h2 class="title">{{headline}}</h2>
    <section class="fi-sec" data-opt="body">
      <span class="fi-badge" data-opt="badge_text" data-slot="badge_text">{{badge_text}}</span>
      <div class="body" data-slot="body">{{body}}</div>
    </section>
    <section class="fi-sec" data-opt="body2">
      <span class="fi-badge" data-opt="badge2_text" data-slot="badge2_text">{{badge2_text}}</span>
      <div class="body" data-slot="body2">{{body2}}</div>
    </section>
  </main>`,
};

const row = (n) =>
  `<div class="row" data-opt="row${n}_value"><dt>{{row${n}_label}}</dt><dd data-slot="row${n}_value">{{row${n}_value}}</dd></div>`;

TYPES['content-cheatsheet'] = {
  css: `
.sheet { flex: 1; display: flex; flex-direction: column; margin-top: 40px; border-top: 4px solid var(--ink); border-bottom: 4px solid var(--ink); }
.row { flex: 1; display: grid; grid-template-columns: 196px 1fr; column-gap: 28px; align-items: center; padding: 16px 0; }
.row + .row { border-top: 2px solid var(--rule); }
.row dt { font-size: 30px; font-weight: 700; line-height: 1.35; color: var(--ink-soft); }
.row dd { font-size: 36px; font-weight: 600; line-height: 1.4; }
.save { margin-top: 28px; display: flex; align-items: center; gap: 16px; font-size: 30px; font-weight: 600; line-height: 1.4; }
.save svg { flex: none; }
`,
  main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <dl class="sheet">
      ${[1, 2, 3, 4, 5, 6].map(row).join('\n      ')}
    </dl>
    <p class="save" data-opt="save_hint"><svg width="30" height="36" viewBox="0 0 30 36" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"><path d="M3 3h24v30L15 24 3 33z"/></svg><span data-slot="save_hint">{{save_hint}}</span></p>
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
.next { align-self: stretch; text-align: left; display: flex; align-items: baseline; gap: 28px; padding: 32px 40px; border-radius: 12px; background: var(--surface); }
.next-label { flex: none; font-size: 30px; font-weight: 700; color: var(--ink-soft); }
.next-topic { font-size: 36px; font-weight: 700; line-height: 1.4; }
.is-cta .ft .account { font-size: 36px; font-weight: 700; color: var(--ink); }
`,
  main: `<main class="main cta">
    <div class="cta-core">
      <div class="cta-art">
        <div class="visual" data-opt="visual" data-slot="visual">{{visual}}</div>
        <svg class="cta-plane" width="220" height="220" viewBox="0 0 240 240" fill="none" stroke="currentColor" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"><path d="M226 16 12 104l86 36 36 86z"/><path d="M226 16 98 140"/></svg>
      </div>
      <h2 class="cta-title">{{headline}}</h2>
      <p class="cta-text" data-opt="cta_text" data-slot="cta_text">{{cta_text}}</p>
    </div>
    <div class="next" data-opt="next_topic"><span class="next-label">다음 편</span><span class="next-topic" data-slot="next_topic">{{next_topic}}</span></div>
  </main>`,
};

// ---------------------------------------------------------------------------
function buildHtml(type, def) {
  return `<!DOCTYPE html>
<!-- GENERATED by scripts/build-cs-v2.js: 이 파일을 직접 고치지 말고 빌더를 수정한 뒤 다시 생성할 것 -->
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080">
  <title>cs-v2 ${type}</title>
  <link rel="stylesheet" crossorigin href="${PRETENDARD_CSS}">
  <link rel="stylesheet" href="${MONO_CSS}">
  <style>${BASE_CSS}${def.css}</style>
</head>
<body class="${def.bodyClass || ''}" data-type="${type}" data-slide="{{slide_number}}" data-total="{{total_slides}}">
<div class="card">
  ${HEADER}
  ${def.main}
  ${FOOTER}
  <svg class="bleed-layer" width="1080" height="1350" viewBox="0 0 1080 1350"></svg>
</div>
<script type="application/json" id="bleed-out">{{bleed_out}}</script>
<script type="application/json" id="bleed-in">{{bleed_in}}</script>
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
  console.log(`cs-v2: ${Object.keys(TYPES).length} templates written to ${OUT_DIR}`);
}

if (require.main === module) main();

module.exports = { TYPES };
