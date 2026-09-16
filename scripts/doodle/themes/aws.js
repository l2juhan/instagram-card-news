'use strict';

/**
 * aws 테마 설정. Phase 1에서 사용자가 고른 방향 B(다크 배경 + 흰/오렌지 펜)를 따른다.
 * 카드 전체가 Squid Ink 다크라 cs-doodle의 .on-dark 오버라이드는 필요 없다(onDarkCss: '').
 *
 * 역할 기반 색 토큰(k-pub/k-priv/k-compute/k-data/k-sec/k-danger)은 모두 Node에서
 * WCAG 공식으로 배경(#232F3E) 대비 4.5:1 이상을 확인했다(workspace/aws-phase1 계산 기록).
 */
module.exports = {
  name: 'aws',
  generatedBy: 'scripts/build-aws.js',
  tokens: {
    paper: '#232F3E',
    surface: 'rgba(246, 242, 234, 0.12)',
    ink: '#F6F2EA',
    inkSoft: '#B9C2CE',
    rule: 'rgba(246, 242, 234, 0.3)',
  },
  cssRootExtra:
    '  --k-pub: #FFC875;\n' +
    '  --k-priv: #8FD19E;\n' +
    '  --k-compute: #FFB066;\n' +
    '  --k-data: #8FC1F2;\n' +
    '  --k-sec: #D2AEEF;\n' +
    '  --k-danger: #FF9C90;',
  cssRoleClasses:
    '.k-pub { color: var(--k-pub); } .k-priv { color: var(--k-priv); } .k-compute { color: var(--k-compute); }\n' +
    '.k-data { color: var(--k-data); } .k-sec { color: var(--k-sec); } .k-danger { color: var(--k-danger); }\n' +
    '.ink { color: var(--ink); } .soft { color: var(--ink-soft); }',
  onDarkCss: '',
  // 공통 17종(sprite.svg)에 aws 확장 10종(sprite-aws.svg)을 이어붙인다. sprite.svg 자체는
  // build-objects.js가 그대로 굽고 있어 cs-doodle 쪽 출력에는 영향이 없다.
  spriteFiles: ['sprite.svg', 'sprite-aws.svg'],

  extraTypes(ctx) {
    const { NOTE } = ctx;

    const contentCode = {
      css: `
.code-panel { position: relative; background: #1B1E24; border-radius: 18px; padding: 40px 44px; margin-top: 40px; }
.code-file { font-family: var(--mono); font-size: 28px; color: var(--ink-soft); margin-bottom: 20px; }
.code-body { font-family: var(--mono); font-size: 32px; line-height: 1.65; white-space: pre-wrap; word-break: break-word; }
.code-line { display: block; padding: 2px 14px; margin: 0 -14px; border-radius: 6px; }
.ann-list { margin-top: 18px; display: flex; flex-direction: column; gap: 14px; }
.ann-item { display: flex; gap: 16px; align-items: flex-start; font-size: 28px; line-height: 1.5; }
.ann-num {
  flex: none; width: 44px; height: 44px; border-radius: 50%; border: 3px solid var(--k-compute); color: var(--k-compute);
  font-size: 28px; font-weight: 800; text-align: center; line-height: 38px; font-family: var(--sans);
}
/* One Dark Pro 토큰. t-cm은 원래 문서값(#5c6370)이 다크 패널(#1B1E24) 대비 2.76:1로
   lint 기준(4.5:1) 미달이라 밝게 올렸다 — style-aws.md 표도 이 값으로 갱신할 것. */
.t-kw{color:#c678dd} .t-fn{color:#61afef} .t-str{color:#98c379} .t-num{color:#d19a66}
.t-cm{color:#8891A0;font-style:italic} .t-var{color:#e06c75} .t-op{color:#56b6c2} .t-type{color:#e5c07b} .t-plain{color:#abb2bf}
`,
      main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <p class="lead" data-opt="lead" data-slot="lead">{{lead}}</p>
    <div class="code-panel" data-doodle-box="ink">
      <p class="code-file" data-opt="code_filename" data-slot="code_filename">{{code_filename}}</p>
      <pre class="code-body">{{code_body}}</pre>
    </div>
    <div class="ann-list"></div>
    <p class="caption" data-opt="body" data-slot="body">{{body}}</p>
    ${NOTE}
  </main>
  <script type="application/json" id="code-hl">{{highlight_lines}}</script>
  <script type="application/json" id="code-ann">{{annotations}}</script>
  <script>
  (function () {
    function readJson(id) {
      var el = document.getElementById(id);
      try { return JSON.parse((el && el.textContent) || 'null'); } catch (e) { return null; }
    }
    function init() {
      var pre = document.querySelector('.code-body');
      if (!pre) return;
      var lines = pre.innerHTML.split('\\n');
      // 줄마다 display:block span으로 감싸므로 join에는 개행을 넣지 않는다 — 넣으면
      // white-space:pre-wrap이 그 개행 문자까지 별도 줄로 렌더링해서 줄 간격이 두 배가 된다.
      pre.innerHTML = lines.map(function (l, i) { return '<span class="code-line" data-ln="' + (i + 1) + '">' + l + '</span>'; }).join('');

      var panel = document.querySelector('.code-panel');
      var card = document.querySelector('.card').getBoundingClientRect();
      var pr = panel.getBoundingClientRect();
      var gen = window.rough && window.rough.generator();
      var layer = document.querySelector('.bleed-layer');
      var NS = 'http://www.w3.org/2000/svg';

      function strokePath(drawable, color, width) {
        var g = document.createElementNS(NS, 'g');
        (drawable.sets || []).forEach(function (set) {
          var dd = gen.opsToPath(set, 1); if (!dd) return;
          var p = document.createElementNS(NS, 'path');
          p.setAttribute('d', dd); p.setAttribute('stroke', 'currentColor'); p.setAttribute('stroke-width', String(width));
          p.setAttribute('fill', 'none'); p.setAttribute('stroke-linecap', 'round'); g.appendChild(p);
        });
        g.style.color = color;
        layer.appendChild(g);
        return g;
      }

      // 강조는 배경색 대신 손그림 아웃라인으로 두른다 — One Dark Pro 9개 토큰 색을 전부
      // 4.5:1 이상으로 유지하려면 패널 배경(#1B1E24)을 바꾸지 않는 편이 훨씬 안전하다.
      (readJson('code-hl') || []).forEach(function (n, i) {
        var el = pre.querySelector('.code-line[data-ln="' + n + '"]');
        if (!el || !gen) return;
        var r = el.getBoundingClientRect();
        var x = pr.left - card.left - 6, y = r.top - card.top - 4;
        var w = pr.width + 12, h = r.height + 8;
        var d = gen.rectangle(x, y, w, h, { seed: 4500 + i * 9, roughness: 1.3, bowing: 0.8, maxRandomnessOffset: 4, stroke: 'currentColor', strokeWidth: 4 });
        strokePath(d, 'var(--accent)', 4);
      });

      var anns = readJson('code-ann') || [];
      var list = document.querySelector('.ann-list');
      if (!anns.length) { if (list) list.remove(); return; }
      anns.forEach(function (a, i) {
        var num = i + 1;
        var el = pre.querySelector('.code-line[data-ln="' + a.line + '"]');
        if (el && layer && gen) {
          var r = el.getBoundingClientRect();
          var cx = pr.left - card.left + 26;
          var cy = r.top - card.top + r.height / 2;
          var d = gen.circle(cx, cy, 46, { seed: 4000 + i * 7, roughness: 1.4, bowing: 0.9, maxRandomnessOffset: 5, stroke: 'currentColor', strokeWidth: 5 });
          var g = strokePath(d, 'var(--k-compute)', 5);
          var t = document.createElementNS(NS, 'text');
          t.setAttribute('x', cx); t.setAttribute('y', cy + 9); t.setAttribute('text-anchor', 'middle');
          t.setAttribute('font-size', '28'); t.setAttribute('font-weight', '800'); t.setAttribute('font-family', "'Pretendard Variable'");
          t.textContent = String(num);
          g.appendChild(t);
        }
        if (list) {
          var item = document.createElement('div');
          item.className = 'ann-item';
          var numSpan = document.createElement('span');
          numSpan.className = 'ann-num'; numSpan.textContent = String(num);
          var textSpan = document.createElement('span');
          textSpan.textContent = a.text || '';
          item.appendChild(numSpan); item.appendChild(textSpan);
          list.appendChild(item);
        }
      });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else init();
  })();
  </script>`,
    };

    const contentConsole = {
      css: `
.console-frame { position: relative; margin-top: 40px; border-radius: 14px; overflow: hidden; background: #10131A; }
.console-viewport { position: relative; width: 100%; overflow: hidden; }
.console-viewport img { display: block; position: absolute; }
.console-anno { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
`,
      main: `<main class="main">
    <h2 class="title">{{headline}}</h2>
    <p class="lead" data-opt="lead" data-slot="lead">{{lead}}</p>
    <div class="stage">
      <div class="console-frame" data-doodle-box="ink">
        <div class="console-viewport" id="console-viewport">
          <img id="console-shot" data-optional-src src="{{screenshot}}" alt="{{alt}}">
          <svg class="console-anno" id="console-anno"></svg>
        </div>
      </div>
    </div>
    <p class="caption" data-opt="subtext" data-slot="subtext">{{subtext}}</p>
    ${NOTE}
  </main>
  <script type="application/json" id="console-crop">{{crop}}</script>
  <script type="application/json" id="console-callouts">{{callouts}}</script>
  <script type="application/json" id="console-redact">{{redact}}</script>
  <script>
  (function () {
    function readJson(id) {
      var el = document.getElementById(id);
      try { return JSON.parse((el && el.textContent) || 'null'); } catch (e) { return null; }
    }
    function init() {
      var img = document.getElementById('console-shot');
      var frame = document.querySelector('.console-frame');
      if (!img || !img.getAttribute('src')) { if (frame) frame.remove(); return; }
      var viewport = document.getElementById('console-viewport');
      var svg = document.getElementById('console-anno');
      function run() {
        var nw = img.naturalWidth, nh = img.naturalHeight;
        var crop = readJson('console-crop');
        var cropRect = (crop && crop.w) ? crop : { x: 0, y: 0, w: nw, h: nh };
        var dispW = viewport.clientWidth;
        var scale = dispW / cropRect.w;
        var dispH = Math.round(cropRect.h * scale);
        viewport.style.height = dispH + 'px';
        img.style.width = (nw * scale) + 'px';
        img.style.height = (nh * scale) + 'px';
        img.style.left = (-cropRect.x * scale) + 'px';
        img.style.top = (-cropRect.y * scale) + 'px';
        svg.setAttribute('viewBox', '0 0 ' + dispW + ' ' + dispH);
        svg.setAttribute('width', dispW); svg.setAttribute('height', dispH);
        function toDisp(px, py) { return [(px - cropRect.x) * scale, (py - cropRect.y) * scale]; }
        var gen = window.rough && window.rough.generator();
        var NS = 'http://www.w3.org/2000/svg';
        function paintPath(drawable, stroke, fill) {
          (drawable.sets || []).forEach(function (set) {
            var d = gen.opsToPath(set, 1); if (!d) return;
            var p = document.createElementNS(NS, 'path');
            p.setAttribute('d', d);
            if (set.type === 'path') {
              p.setAttribute('stroke', stroke); p.setAttribute('stroke-width', String(drawable.options.strokeWidth || 5));
              p.setAttribute('fill', 'none'); p.setAttribute('stroke-linecap', 'round');
            } else {
              p.setAttribute('stroke', 'none'); p.setAttribute('fill', fill || stroke);
            }
            svg.appendChild(p);
          });
        }
        (readJson('console-redact') || []).forEach(function (r, i) {
          var p1 = toDisp(r.x, r.y);
          var rw = r.w * scale, rh = r.h * scale;
          var solid = document.createElementNS(NS, 'rect');
          solid.setAttribute('x', p1[0]); solid.setAttribute('y', p1[1]);
          solid.setAttribute('width', rw); solid.setAttribute('height', rh);
          solid.setAttribute('fill', '#0B0C10');
          svg.appendChild(solid);
          var d = gen.rectangle(p1[0], p1[1], rw, rh, { seed: 3000 + i * 9, roughness: 1.4, bowing: 0.9, maxRandomnessOffset: 6, stroke: '#F6F2EA', strokeWidth: 5 });
          paintPath(d, '#F6F2EA');
        });
        (readJson('console-callouts') || []).forEach(function (c, i) {
          var seed = 3500 + i * 9;
          if (c.type === 'circle') {
            var p1 = toDisp(c.x, c.y);
            var d = gen.circle(p1[0], p1[1], (c.r || 40) * scale * 2, { seed: seed, roughness: 1.4, bowing: 0.9, maxRandomnessOffset: 6, stroke: '#FF9900', strokeWidth: 7 });
            paintPath(d, '#FF9900');
          } else if (c.type === 'arrow') {
            var a = toDisp(c.x1, c.y1), b = toDisp(c.x2, c.y2);
            var d = gen.line(a[0], a[1], b[0], b[1], { seed: seed, roughness: 1.4, bowing: 0.9, maxRandomnessOffset: 6, stroke: '#FF9900', strokeWidth: 7 });
            paintPath(d, '#FF9900');
          } else if (c.type === 'number') {
            var p2 = toDisp(c.x, c.y);
            var d2 = gen.circle(p2[0], p2[1], 56, { seed: seed, roughness: 1.4, bowing: 0.9, maxRandomnessOffset: 6, stroke: '#FF9900', strokeWidth: 6, fill: '#FF9900', fillStyle: 'solid' });
            paintPath(d2, '#FF9900', '#FF9900');
            var t = document.createElementNS(NS, 'text');
            t.setAttribute('x', p2[0]); t.setAttribute('y', p2[1] + 9);
            t.setAttribute('text-anchor', 'middle'); t.setAttribute('font-size', '30'); t.setAttribute('font-weight', '800');
            t.setAttribute('font-family', "'Pretendard Variable'"); t.setAttribute('fill', '#232F3E');
            t.textContent = String(c.n != null ? c.n : i + 1);
            svg.appendChild(t);
          }
        });
        document.body.setAttribute('data-console-ready', '1');
      }
      if (img.complete && img.naturalWidth) run(); else img.addEventListener('load', run);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else init();
  })();
  </script>`,
    };

    return { 'content-code': contentCode, 'content-console': contentConsole };
  },
};
