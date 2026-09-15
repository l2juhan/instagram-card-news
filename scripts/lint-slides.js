'use strict';

/**
 * 슬라이드 가독성 자동 검사.
 *
 *   node scripts/lint-slides.js --slides workspace/slides.json --style cs-v2 \
 *     [--accent "#16171B"] [--account name] [--series Security]
 *
 * render.js와 같은 방식으로 HTML을 만들어 Puppeteer로 열고 다음을 검사한다.
 * - font-size : 보이는 텍스트의 실제 크기 < 28px            → error
 * - contrast  : 글자색 vs 실제 뒤 배경(픽셀 샘플) < 4.5:1     → error
 * - safe-area : 텍스트가 좌우 72px 여백 침범                  → warning
 *               좌우 34px 그리드 크롭 영역에 걸침              → error
 * - overflow  : 요소가 캔버스 밖, 텍스트 잘림,
 *               [data-lint-region] 영역 밖으로 넘친 콘텐츠     → error
 *
 * 순수 장식 요소는 data-lint-ignore 로 제외할 수 있다.
 * error가 하나라도 있으면 exit code 1.
 */

const puppeteer = require('puppeteer');
const { buildSlidePages, waitForFonts } = require('./render.js');

const MIN_FONT_PX = 28;
const MIN_CONTRAST = 4.5;
const SAFE_MARGIN = 72;
const CROP_MARGIN = 34;
const TOLERANCE = 0.5;

/** In-page: collect visible text runs and layout problems. */
function collectInPage({ minFont, tolerance }) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const issues = [];
  const texts = [];

  const ignored = (el) => !!(el && el.closest && el.closest('[data-lint-ignore], .bleed-layer'));
  const snippet = (s) => {
    const t = s.replace(/\s+/g, ' ').trim();
    return t.length > 28 ? `${t.slice(0, 27)}…` : t;
  };
  const visible = (el) => {
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const cs = getComputedStyle(node);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    }
    return true;
  };
  const opacityOf = (el) => {
    let o = 1;
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) o *= parseFloat(getComputedStyle(node).opacity);
    return o;
  };
  const union = (rects) => rects.reduce((u, r) => ({
    left: Math.min(u.left, r.left), top: Math.min(u.top, r.top),
    right: Math.max(u.right, r.right), bottom: Math.max(u.bottom, r.bottom),
  }), { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });

  // --- text runs -----------------------------------------------------------
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!el || !node.textContent.trim()) continue;
    if (el.closest('script, style, title') || ignored(el) || !visible(el)) continue;

    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
    if (rects.length === 0) continue;

    const cs = getComputedStyle(el);
    const isSvg = el instanceof SVGElement;
    let fontPx = parseFloat(cs.fontSize);
    if (isSvg && el.getScreenCTM) {
      const m = el.getScreenCTM();
      if (m) fontPx *= Math.hypot(m.a, m.b);
    }

    const text = node.textContent;
    const symbolOnly = !/[\p{L}\p{N}]/u.test(text);
    const color = isSvg ? cs.fill : (cs.webkitTextFillColor || cs.color);
    const colorOpacity = isSvg ? parseFloat(cs.fillOpacity || '1') : 1;
    const box = union(rects);
    const item = {
      text: snippet(text), fontPx, color, alpha: opacityOf(el) * colorOpacity,
      rects: rects.map((r) => ({ left: r.left, top: r.top, width: r.width, height: r.height })),
      box, symbolOnly,
    };
    texts.push(item);

    if (fontPx < minFont - tolerance && !symbolOnly) {
      issues.push({ level: 'error', rule: 'font-size', message: `${fontPx.toFixed(1)}px < ${minFont}px`, text: item.text });
    }

    // clipped by an overflow container?
    for (let anc = el.parentElement; anc && anc !== document.documentElement; anc = anc.parentElement) {
      const acs = getComputedStyle(anc);
      const clips = /(hidden|clip|scroll|auto)/.test(acs.overflowX + acs.overflowY);
      if (!clips) continue;
      const ar = anc.getBoundingClientRect();
      if (box.left < ar.left - 1 || box.right > ar.right + 1 || box.top < ar.top - 1 || box.bottom > ar.bottom + 1) {
        issues.push({ level: 'error', rule: 'overflow', message: `text clipped by <${anc.tagName.toLowerCase()} class="${anc.className && anc.className.baseVal !== undefined ? anc.className.baseVal : anc.className}">`, text: item.text });
        break;
      }
    }
    if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) {
      issues.push({ level: 'error', rule: 'overflow', message: 'text truncated with ellipsis', text: item.text });
    }
  }

  // --- elements outside the canvas ----------------------------------------
  for (const el of document.body.querySelectorAll('*')) {
    if (ignored(el) || el.closest('script, style') || !visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.left < -tolerance || r.top < -tolerance || r.right > W + tolerance || r.bottom > H + tolerance) {
      const name = `<${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}>`;
      issues.push({ level: 'error', rule: 'overflow', message: `${name} outside canvas (${Math.round(r.left)},${Math.round(r.top)})–(${Math.round(r.right)},${Math.round(r.bottom)})`, text: snippet(el.textContent || '') });
    }
  }

  // --- content spilling out of its layout region ----------------------------
  for (const region of document.querySelectorAll('[data-lint-region]')) {
    const rr = region.getBoundingClientRect();
    for (const el of region.querySelectorAll('*')) {
      if (ignored(el) || !visible(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.bottom > rr.bottom + 1 || r.top < rr.top - 1) {
        issues.push({ level: 'error', rule: 'overflow', message: `content exceeds layout region by ${Math.round(Math.max(r.bottom - rr.bottom, rr.top - r.top))}px`, text: snippet(el.textContent || '') });
        break;
      }
    }
  }

  return { issues, texts, width: W, height: H };
}

/** In-page (on a blank page): sample background pixels behind each text run. */
async function contrastInPage({ dataUrl, texts, width, height, minContrast }) {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, width, height).data;

  const parse = (s) => {
    const m = String(s).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (c1, c2) => { const a = lum(c1), b = lum(c2); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
  const hex = ({ r, g, b }) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

  const results = [];
  for (const t of texts) {
    if (t.symbolOnly) continue;
    const fg = parse(t.color);
    if (!fg) continue;
    const alpha = fg.a * t.alpha;
    const samples = [];
    for (const r of t.rects) {
      const x0 = Math.max(0, Math.floor(r.left)), x1 = Math.min(width - 1, Math.ceil(r.left + r.width));
      const y0 = Math.max(0, Math.floor(r.top)), y1 = Math.min(height - 1, Math.ceil(r.top + r.height));
      const step = Math.max(2, Math.floor(Math.min(r.width, r.height) / 12));
      for (let y = y0; y <= y1; y += step) {
        for (let x = x0; x <= x1; x += step) {
          const i = (y * width + x) * 4;
          const bg = { r: px[i], g: px[i + 1], b: px[i + 2] };
          const shown = { r: fg.r * alpha + bg.r * (1 - alpha), g: fg.g * alpha + bg.g * (1 - alpha), b: fg.b * alpha + bg.b * (1 - alpha) };
          samples.push({ c: ratio(shown, bg), bg });
        }
      }
    }
    if (samples.length === 0) continue;
    samples.sort((a, b) => a.c - b.c);
    // 10th percentile: tolerate a few pixels of a neighbouring shape inside the bounding box
    const s = samples[Math.floor(samples.length * 0.1)];
    if (s.c < minContrast) {
      results.push({ level: 'error', rule: 'contrast', message: `${s.c.toFixed(2)}:1 < ${minContrast} (${hex(fg)} on ${hex(s.bg)})`, text: t.text });
    }
  }
  return results;
}

function safeAreaIssues(texts, width) {
  const issues = [];
  for (const t of texts) {
    const { left, right } = t.box;
    if (left < CROP_MARGIN - TOLERANCE || right > width - CROP_MARGIN + TOLERANCE) {
      issues.push({ level: 'error', rule: 'safe-area', message: `in ${CROP_MARGIN}px grid-crop zone (x ${Math.round(left)}–${Math.round(right)})`, text: t.text });
    } else if (left < SAFE_MARGIN - TOLERANCE || right > width - SAFE_MARGIN + TOLERANCE) {
      issues.push({ level: 'warning', rule: 'safe-area', message: `outside ${SAFE_MARGIN}px margin (x ${Math.round(left)}–${Math.round(right)})`, text: t.text });
    }
  }
  return issues;
}

const HIDE_GLYPHS_CSS = `
* { -webkit-text-fill-color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; caret-color: transparent !important; }
svg text, svg tspan { fill-opacity: 0 !important; stroke-opacity: 0 !important; }
`;

async function lint(opts) {
  const { style, dimensions, pages } = buildSlidePages(opts);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const report = [];
  try {
    // A single page only: requestAnimationFrame-based template code would stall in a background tab
    const page = await browser.newPage();
    await page.setViewport({ width: dimensions.width, height: dimensions.height });

    for (const p of pages) {
      await page.setContent(p.html, { waitUntil: 'networkidle0' });
      await waitForFonts(page, p.index + 1);

      const collected = await page.evaluate(collectInPage, { minFont: MIN_FONT_PX, tolerance: TOLERANCE });

      // Screenshot with glyphs hidden = the real background behind each text run
      await page.addStyleTag({ content: HIDE_GLYPHS_CSS });
      const shot = await page.screenshot({ encoding: 'base64', clip: { x: 0, y: 0, width: dimensions.width, height: dimensions.height } });
      const contrast = await page.evaluate(contrastInPage, {
        dataUrl: `data:image/png;base64,${shot}`, texts: collected.texts,
        width: dimensions.width, height: dimensions.height, minContrast: MIN_CONTRAST,
      });

      const issues = [...collected.issues, ...contrast, ...safeAreaIssues(collected.texts, dimensions.width)];
      report.push({ slide: p.index + 1, type: p.type, issues });
    }
  } finally {
    await browser.close();
  }
  return { style, report };
}

function print({ style, report }) {
  let errors = 0;
  let warnings = 0;
  console.log(`lint-slides: style=${style}, ${report.length} slide(s)\n`);
  for (const { slide, type, issues } of report) {
    const e = issues.filter((i) => i.level === 'error').length;
    const w = issues.length - e;
    errors += e;
    warnings += w;
    const status = e ? 'FAIL' : w ? 'WARN' : 'OK';
    console.log(`slide ${String(slide).padStart(2, '0')} (${type}) ${status}`);
    for (const i of issues) {
      const tag = i.level === 'error' ? 'ERROR' : 'WARN ';
      console.log(`  ${tag} ${i.rule.padEnd(9)} ${i.message}${i.text ? `  "${i.text}"` : ''}`);
    }
  }
  console.log(`\n${errors} error(s), ${warnings} warning(s)`);
  return errors;
}

function parseArgs(argv) {
  const opts = {};
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const key = { '--slides': 'slidesPath', '--style': 'style', '--accent': 'accent', '--account': 'account', '--series': 'series' }[args[i]];
    if (key) opts[key] = args[++i];
    else console.warn(`Unknown argument: ${args[i]}`);
  }
  return opts;
}

if (require.main === module) {
  lint(parseArgs(process.argv))
    .then((result) => process.exit(print(result) > 0 ? 1 : 0))
    .catch((err) => {
      console.error('Lint failed:', err.message);
      process.exit(2);
    });
}

module.exports = { lint };
