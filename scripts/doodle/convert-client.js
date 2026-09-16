'use strict';

/**
 * cs-doodle 브라우저용 변환 스크립트의 소스(문자열)를 내보낸다.
 * build-cs-doodle.js가 이 문자열을 roughjs 번들 텍스트 뒤에 이어붙여 <script> 태그로
 * 템플릿에 주입한다(build-cs-v2.js가 SHARED_SCRIPT를 주입하는 방식과 동일). Node 모듈이
 * 아니라 순수 문자열인 이유: 브라우저에는 require()가 없고, roughjs도 로컬 파일 텍스트를
 * 그대로 inline해야 네트워크 의존이 생기지 않기 때문이다.
 *
 * 하는 일:
 *   1) window.__doodleConvert() — `.visual svg`, `[data-doodle] svg` 안의 기본 도형
 *      (circle/ellipse/rect/line/path/polygon)을 rough.js로 그린 손그림 <path>로 치환한다.
 *      cs-v2용으로 이미 쓴 raw SVG(class="k-a" fill="currentColor" 관례)를 거의 그대로
 *      재사용할 수 있도록, stroke-dasharray/class는 보존하고 seed는 각 svg 안에서
 *      도형 등장 순서로 결정적으로 부여한다(문서 순서는 항상 같으므로 재렌더링해도 동일).
 *   2) window.__doodleEmphasize() — `[data-doodle-mark]`가 붙은 텍스트 요소 주위에
 *      손그림 동그라미/밑줄을 그린다. 레이아웃(getBoundingClientRect)에 의존하므로
 *      폰트 로딩이 끝난 뒤, 배치가 끝난 뒤에 호출해야 한다.
 *
 * 방향 A(볼펜 낙서) 규칙: 원본에 fill이 있어도 기본은 아웃라인만 그리고 칠하지 않는다
 * (색은 있어도 채색은 최소로 — cs-doodle 스타일 가이드 참고). 화살촉처럼 작은 도형을
 * 꼭 채워야 읽히면 원본 엘리먼트에 data-doodle-fill="solid"를 달아 예외로 둔다.
 */

const PEN_STYLE_JS = `{ roughness: 1.4, bowing: 0.9, strokeWidth: 6.5 }`;

const SOURCE = `
(function () {
  var PEN = ${PEN_STYLE_JS};
  var NS = 'http://www.w3.org/2000/svg';

  function opsToPathSets(drawable, gen) {
    var out = '';
    (drawable.sets || []).forEach(function (set) {
      var d = gen.opsToPath(set, 1);
      if (!d) return;
      var o = drawable.options || {};
      if (set.type === 'path') {
        out += "<path d='" + d + "' stroke='" + o.stroke + "' stroke-width='" + o.strokeWidth + "' fill='none' stroke-linecap='round' stroke-linejoin='round'></path>";
      } else if (set.type === 'fillPath') {
        out += "<path d='" + d + "' stroke='none' fill='" + o.fill + "'></path>";
      } else if (set.type === 'fillSketch') {
        var w = o.fillWeight < 0 ? o.strokeWidth / 2 : o.fillWeight;
        out += "<path d='" + d + "' stroke='" + o.fill + "' stroke-width='" + w + "' fill='none' stroke-linecap='round'></path>";
      }
    });
    return out;
  }

  function seedOf(el, fallback) {
    var override = el.getAttribute('data-doodle-seed');
    return override ? parseInt(override, 10) : fallback;
  }

  function convertShape(el, seed) {
    var gen = rough.generator();
    var tag = el.tagName.toLowerCase();
    var solid = el.getAttribute('data-doodle-fill') === 'solid';
    var origFill = el.getAttribute('fill');
    var hasFill = origFill && origFill !== 'none' && origFill !== 'transparent';
    var penColor = hasFill ? origFill : (el.getAttribute('stroke') || 'currentColor');
    var strokeWidth = parseFloat(el.getAttribute('stroke-width')) || PEN.strokeWidth;
    var opts = {
      seed: seedOf(el, seed),
      roughness: PEN.roughness,
      bowing: PEN.bowing,
      stroke: penColor,
      strokeWidth: strokeWidth,
      fill: solid && hasFill ? origFill : 'none',
      fillStyle: 'solid',
    };
    var drawable = null;
    if (tag === 'circle') {
      drawable = gen.circle(+el.getAttribute('cx'), +el.getAttribute('cy'), 2 * +el.getAttribute('r'), opts);
    } else if (tag === 'ellipse') {
      drawable = gen.ellipse(+el.getAttribute('cx'), +el.getAttribute('cy'), 2 * +el.getAttribute('rx'), 2 * +el.getAttribute('ry'), opts);
    } else if (tag === 'rect') {
      drawable = gen.rectangle(+el.getAttribute('x'), +el.getAttribute('y'), +el.getAttribute('width'), +el.getAttribute('height'), opts);
    } else if (tag === 'line') {
      drawable = gen.line(+el.getAttribute('x1'), +el.getAttribute('y1'), +el.getAttribute('x2'), +el.getAttribute('y2'), opts);
    } else if (tag === 'polygon') {
      var pts = el.getAttribute('points').trim().split(/\\s+/).map(function (p) { return p.split(',').map(Number); });
      drawable = gen.polygon(pts, opts);
    } else if (tag === 'path') {
      drawable = gen.path(el.getAttribute('d'), opts);
    } else {
      return;
    }
    var g = document.createElementNS(NS, 'g');
    if (el.getAttribute('class')) g.setAttribute('class', el.getAttribute('class'));
    g.innerHTML = opsToPathSets(drawable, gen);
    var dash = el.getAttribute('stroke-dasharray');
    if (dash) {
      Array.prototype.forEach.call(g.querySelectorAll("path[fill='none']"), function (p) {
        p.setAttribute('stroke-dasharray', dash);
      });
    }
    el.replaceWith(g);
  }

  function run() {
    var containers = document.querySelectorAll('.visual svg, [data-doodle] svg');
    Array.prototype.forEach.call(containers, function (svg) {
      var seed = 1;
      var shapes = svg.querySelectorAll('circle, ellipse, rect, line, path, polygon');
      Array.prototype.forEach.call(shapes, function (el) {
        if (el.closest('[data-doodle-skip]')) return;
        convertShape(el, seed);
        seed += 11;
      });
    });
  }

  function emphasizeOne(el, seed) {
    var kind = el.getAttribute('data-doodle-mark');
    var colorAttr = el.getAttribute('data-doodle-color');
    var color = colorAttr ? 'var(--' + colorAttr + ')' : 'currentColor';
    var overlay = el.closest('.card') && el.closest('.card').querySelector('.bleed-layer');
    if (!overlay) return;
    var card = el.closest('.card').getBoundingClientRect();
    var r = el.getBoundingClientRect();
    var x0 = r.left - card.left, y0 = r.top - card.top, w = r.width, h = r.height;
    var gen = rough.generator();
    var drawable;
    if (kind === 'underline') {
      drawable = gen.line(x0 - 6, y0 + h + 8, x0 + w + 6, y0 + h + 8, { seed: seedOf(el, seed), roughness: PEN.roughness, bowing: PEN.bowing, stroke: color, strokeWidth: 6 });
    } else {
      drawable = gen.ellipse(x0 + w / 2, y0 + h / 2, w + 48, h + 40, { seed: seedOf(el, seed), roughness: PEN.roughness, bowing: PEN.bowing, stroke: color, strokeWidth: 6, fill: 'none' });
    }
    var g = document.createElementNS(NS, 'g');
    g.innerHTML = opsToPathSets(drawable, gen);
    overlay.appendChild(g);
  }

  function emphasize() {
    var marks = document.querySelectorAll('[data-doodle-mark]');
    Array.prototype.forEach.call(marks, function (el, i) { emphasizeOne(el, i * 13 + 3); });
  }

  window.__doodleConvert = run;
  window.__doodleEmphasize = emphasize;
})();
`;

module.exports = { SOURCE };
