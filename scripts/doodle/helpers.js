'use strict';

/**
 * `visual` 필드를 손으로 쓸 때 쓰는 저작 편의 헬퍼.
 *
 * 여기서 만드는 것은 아직 "평범한" SVG(circle/line/path/polygon)다 — 손그림 변환은
 * 렌더링 시점에 scripts/doodle/convert-client.js가 클라이언트에서 자동으로 한다.
 * 이 파일은 화살촉 각도 계산이나 점선 간격처럼 매번 손으로 하면 실수하기 쉬운 부분을
 * 표준화해 주는 용도다. 색은 개념 토큰 class(예: 'k-a')를 받아 그대로 붙인다.
 */

const attr = (cls) => (cls ? ` class='${cls}'` : '');

/** 직선 화살표: 몸통 line + 채워진 화살촉(작아서 아웃라인만이면 안 읽히므로 solid 고정). */
function arrow(x1, y1, x2, y2, { cls = '', width = 10, headSize = 26 } = {}) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const back = ang + Math.PI;
  const wing = Math.PI / 7;
  const hx1 = x2 + headSize * Math.cos(back + wing);
  const hy1 = y2 + headSize * Math.sin(back + wing);
  const hx2 = x2 + headSize * Math.cos(back - wing);
  const hy2 = y2 + headSize * Math.sin(back - wing);
  return (
    `<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}' stroke='currentColor' stroke-width='${width}' stroke-linecap='round'${attr(cls)}/>` +
    `<polygon points='${x2},${y2} ${hx1},${hy1} ${hx2},${hy2}' fill='currentColor' data-doodle-fill='solid'${attr(cls)}/>`
  );
}

/** 곡선 화살표: 2차 베지어 몸통 + 끝점에서의 접선 방향으로 화살촉. */
function curvedArrow(x1, y1, cx, cy, x2, y2, { cls = '', width = 10, headSize = 26 } = {}) {
  const tanX = x2 - cx, tanY = y2 - cy;
  const ang = Math.atan2(tanY, tanX);
  const back = ang + Math.PI;
  const wing = Math.PI / 7;
  const hx1 = x2 + headSize * Math.cos(back + wing);
  const hy1 = y2 + headSize * Math.sin(back + wing);
  const hx2 = x2 + headSize * Math.cos(back - wing);
  const hy2 = y2 + headSize * Math.sin(back - wing);
  return (
    `<path d='M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}' fill='none' stroke='currentColor' stroke-width='${width}' stroke-linecap='round'${attr(cls)}/>` +
    `<polygon points='${x2},${y2} ${hx1},${hy1} ${hx2},${hy2}' fill='currentColor' data-doodle-fill='solid'${attr(cls)}/>`
  );
}

/** 막힘 표시: 점선 화살표 + 도중에 가로막는 짧은 bar. "이 방향은 안 됨"을 형태로도 표시한다. */
function blockedArrow(x1, y1, x2, y2, { cls = '', width = 8, dash = '18 14', barAt = 0.55 } = {}) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const bx = x1 + (x2 - x1) * barAt;
  const by = y1 + (y2 - y1) * barAt;
  const bw = 8, bl = 34;
  const perp = ang + Math.PI / 2;
  const bx1 = bx + (bl / 2) * Math.cos(perp), by1 = by + (bl / 2) * Math.sin(perp);
  const bx2 = bx - (bl / 2) * Math.cos(perp), by2 = by - (bl / 2) * Math.sin(perp);
  return (
    `<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}' stroke='currentColor' stroke-width='${width}' stroke-linecap='round' stroke-dasharray='${dash}'${attr(cls)}/>` +
    `<line x1='${bx1}' y1='${by1}' x2='${bx2}' y2='${by2}' stroke='currentColor' stroke-width='${bw}' stroke-linecap='round'${attr(cls)}/>`
  );
}

/** 구분선: 그냥 직선이지만, 굵기/색 기본값을 표준화해 둔다. */
function divider(x1, y1, x2, y2, { cls = 'soft', width = 5 } = {}) {
  return `<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}' stroke='currentColor' stroke-width='${width}' stroke-linecap='round'${attr(cls)}/>`;
}

module.exports = { arrow, curvedArrow, blockedArrow, divider };
