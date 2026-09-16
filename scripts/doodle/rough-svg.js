'use strict';

/**
 * rough.generator()의 Drawable(ops)을 정적 SVG 문자열로 직렬화한다.
 *
 * rough.svg()는 실제 DOM(ownerDocument)이 있어야 동작하지만, generator()는 순수 계산이라
 * Node에서 브라우저/네트워크 없이 결정적으로 돌아간다 — 같은 seed는 항상 같은 path를 낸다.
 * 색은 여기서 실제 hex를 계산하지 않고 그대로 흘려보내므로 stroke/fill에 'currentColor'를
 * 넘기면 cs-v2 방식(class="k-a" + fill="currentColor")과 동일하게 CSS로 색을 입힐 수 있다.
 */
const rough = require('roughjs');

const gen = rough.generator();

function drawableToSvg(drawable, { decimals = 1 } = {}) {
  const sets = drawable.sets || [];
  const o = drawable.options || {};
  let out = '';
  for (const set of sets) {
    const d = gen.opsToPath(set, decimals);
    if (!d) continue;
    if (set.type === 'path') {
      out += `<path d='${d}' stroke='${o.stroke}' stroke-width='${o.strokeWidth}' fill='none' stroke-linecap='round' stroke-linejoin='round'/>`;
    } else if (set.type === 'fillPath') {
      const rule = ['curve', 'polygon', 'path'].includes(drawable.shape) ? 'evenodd' : 'nonzero';
      out += `<path d='${d}' stroke='none' fill='${o.fill}' fill-rule='${rule}'/>`;
    } else if (set.type === 'fillSketch') {
      const w = o.fillWeight < 0 ? o.strokeWidth / 2 : o.fillWeight;
      out += `<path d='${d}' stroke='${o.fill}' stroke-width='${w}' fill='none' stroke-linecap='round'/>`;
    }
  }
  return out;
}

module.exports = {
  gen,
  drawableToSvg,
  circle: (x, y, d, opts) => drawableToSvg(gen.circle(x, y, d, opts)),
  ellipse: (x, y, w, h, opts) => drawableToSvg(gen.ellipse(x, y, w, h, opts)),
  rectangle: (x, y, w, h, opts) => drawableToSvg(gen.rectangle(x, y, w, h, opts)),
  line: (x1, y1, x2, y2, opts) => drawableToSvg(gen.line(x1, y1, x2, y2, opts)),
  path: (d, opts) => drawableToSvg(gen.path(d, opts)),
  curve: (points, opts) => drawableToSvg(gen.curve(points, opts)),
  arc: (x, y, w, h, start, stop, closed, opts) => drawableToSvg(gen.arc(x, y, w, h, start, stop, closed, opts)),
  polygon: (points, opts) => drawableToSvg(gen.polygon(points, opts)),
  linearPath: (points, opts) => drawableToSvg(gen.linearPath(points, opts)),
};
