'use strict';

/**
 * 슬라이드 가독성 자동 검사.
 *
 *   node scripts/lint-slides.js --slides workspace/slides.json --style cs-v2 \
 *     [--accent "#16171B"] [--account name] [--series Security]
 *
 * render.js와 같은 방식으로 HTML을 만들어 Puppeteer로 열고 다음을 검사한다.
 * - font-size   : 보이는 텍스트의 실제 크기 < 28px             → error
 * - hand-font   : 손글씨 폰트(HAND_FONTS)로 쓴 텍스트가 그 폰트의
 *                 최소 크기 미만                                → error
 * - contrast    : 글자색 vs 실제 뒤 배경(픽셀 샘플) < 4.5:1      → error
 * - safe-area   : 텍스트가 좌우 72px 여백 침범                   → warning
 *                 좌우 34px 그리드 크롭 영역에 걸침               → error
 * - overflow    : 요소가 캔버스 밖, 텍스트 잘림,
 *                 [data-lint-region] 영역 밖으로 넘친 콘텐츠      → error
 * - doodle-overlap : 손그림 도형([data-doodle-shape], 오브젝트
 *                 스프라이트 <use>)이 텍스트 위를 덮음            → warning
 * - determinism : cs-doodle처럼 rough.js 변환기를 쓰는 템플릿에서
 *                 같은 슬라이드를 2회 렌더링한 PNG가 다름          → error
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

// cs-doodle이 짧은 주석용으로 쓰는 손글씨 폰트의 최소 권장 크기.
// cs-doodle-prompt Phase 1 비교: 두꺼운 서체는 36px, 얇은 서체(Nanum Pen Script류)는 44px.
const HAND_FONTS = { 'Gamja Flower': 36 };

/** In-page: collect visible text runs and layout problems. */
function collectInPage({ minFont, tolerance, handFonts }) {
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
  // cs-doodle은 "실제 크기를 알 수 없는 구분선"을 넉넉히 길게 그린 뒤 overflow:hidden인
  // 조상으로 잘라서 보여준다(예: content-steps의 step-connector). 그 안쪽 SVG의
  // getBoundingClientRect()는 여전히 잘리기 전 원래 크기를 그대로 돌려주므로, 조상들의
  // clip 영역과 교집합을 구해야 "화면에 실제로 보이는" 영역을 알 수 있다.
  const visibleRect = (el) => {
    let r = el.getBoundingClientRect();
    for (let anc = el.parentElement; anc && anc !== document.documentElement; anc = anc.parentElement) {
      const acs = getComputedStyle(anc);
      if (!/(hidden|clip|scroll|auto)/.test(acs.overflowX + acs.overflowY)) continue;
      const ar = anc.getBoundingClientRect();
      r = {
        left: Math.max(r.left, ar.left), top: Math.max(r.top, ar.top),
        right: Math.min(r.right, ar.right), bottom: Math.min(r.bottom, ar.bottom),
      };
      if (r.right <= r.left || r.bottom <= r.top) return null; // 조상 클립 밖으로 완전히 잘려 안 보임
    }
    return r;
  };

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

    for (const [family, minPx] of Object.entries(handFonts || {})) {
      if (cs.fontFamily.indexOf(family) === -1) continue;
      if (fontPx < minPx - tolerance && !symbolOnly) {
        issues.push({ level: 'error', rule: 'hand-font', message: `${family} ${fontPx.toFixed(1)}px < ${minPx}px`, text: item.text });
      }
      break;
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
    const r = visibleRect(el);
    if (!r || r.right - r.left <= 0 || r.bottom - r.top <= 0) continue;
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
      const r = visibleRect(el);
      if (!r || r.right - r.left <= 0 || r.bottom - r.top <= 0) continue;
      if (r.bottom > rr.bottom + 1 || r.top < rr.top - 1) {
        issues.push({ level: 'error', rule: 'overflow', message: `content exceeds layout region by ${Math.round(Math.max(r.bottom - rr.bottom, rr.top - r.top))}px`, text: snippet(el.textContent || '') });
        break;
      }
    }
  }

  // --- doodle shapes covering text ------------------------------------------
  // [data-doodle-shape]: convert-client.js가 만든 <g>, build-cs-doodle.js의 bleed 곡선.
  // use[href^="#doodle-"]: 오브젝트 스프라이트 아이콘. 배지/박스 아웃라인(drawBoxes)은
  // 자기 라벨을 감싸는 게 정상이라 일부러 마커를 안 붙였으니 여기 안 걸린다.
  const doodleEls = document.querySelectorAll('[data-doodle-shape], use[href^="#doodle-"]');
  for (const el of doodleEls) {
    if (ignored(el) || !visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    for (const t of texts) {
      const b = t.box;
      const overlapX = Math.min(r.right, b.right) - Math.max(r.left, b.left);
      const overlapY = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
      if (overlapX > 4 && overlapY > 4) {
        issues.push({ level: 'warning', rule: 'doodle-overlap', message: `doodle shape overlaps text by ${Math.round(Math.min(overlapX, overlapY))}px`, text: t.text });
      }
    }
  }

  // --- aws: 공식 아이콘 컨테이너가 손그림 변환기를 통과했는지 -----------------
  // data-aws-icon은 "변형 없이 그대로 쓴다"는 표시이므로 data-doodle-skip이 같이
  // 없으면 convert-client.js가 안의 도형을 낙서로 바꿔버린다 — 그 결과물인
  // data-doodle-shape가 안쪽에서 발견되면 스킵 속성이 빠진 것.
  for (const icon of document.querySelectorAll('[data-aws-icon]')) {
    if (icon.querySelector('[data-doodle-shape]')) {
      issues.push({ level: 'error', rule: 'aws-icon-converted', message: 'data-aws-icon 요소 안에서 손그림 변환 결과(data-doodle-shape)가 발견됨 — data-doodle-skip 누락 의심' });
    }
  }

  // --- aws: 콘솔 스크린샷이 원본보다 작게 렌더링되면 크롭 권장 -----------------
  const consoleShot = document.getElementById('console-shot');
  if (consoleShot && consoleShot.naturalWidth && visible(consoleShot)) {
    const scale = consoleShot.clientWidth / consoleShot.naturalWidth;
    if (scale < 1) {
      issues.push({ level: 'warning', rule: 'screenshot-scale', message: `렌더링 배율 ${scale.toFixed(2)}x < 1.0 — 원본을 축소해서 보여주는 중, crop으로 필요한 영역만 확대하는 걸 권장` });
    }
  }

  return { issues, texts, width: W, height: H };
}

/**
 * In-page: count pixels that differ by more than `channelTolerance` on any RGB channel
 * between two base64 PNG screenshots of the same size. Used for the determinism check —
 * a tolerant pixel diff instead of an exact byte hash, since Chromium's own text
 * antialiasing isn't bit-for-bit reproducible even for an identical render.
 */
async function pixelDiffCount({ a, b, width, height, channelTolerance }) {
  function toImageData(base64) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, width, height).data);
      };
      img.onerror = reject;
      img.src = `data:image/png;base64,${base64}`;
    });
  }
  const [d1, d2] = await Promise.all([toImageData(a), toImageData(b)]);
  let diff = 0;
  for (let i = 0; i < d1.length; i += 4) {
    const dr = Math.abs(d1[i] - d2[i]);
    const dg = Math.abs(d1[i + 1] - d2[i + 1]);
    const db = Math.abs(d1[i + 2] - d2[i + 2]);
    if (dr > channelTolerance || dg > channelTolerance || db > channelTolerance) diff++;
  }
  return diff;
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

// aws: 계정 ID/액세스 키/IP 같은 민감정보가 가림 처리 없이 텍스트·코드 필드에 그대로
// 남아 있는지 의심 패턴으로 훑는다. 이미지 내부 픽셀은 코드로 읽을 수 없어서 대상이
// 아니다(평가자 체크리스트로 처리 — style-aws.md 참고).
const SENSITIVE_PATTERNS = [
  { rule: 'sensitive-account-id', re: /(?<!\d)\d{12}(?!\d)/, hint: '12자리 숫자(계정 ID 패턴)' },
  { rule: 'sensitive-access-key', re: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/, hint: 'AKIA/ASIA로 시작하는 액세스 키 패턴' },
  { rule: 'sensitive-ipv4', re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/, hint: 'IPv4 주소 패턴' },
];
const SENSITIVE_SKIP_FIELDS = new Set(['slide', 'type', 'style_override']);

function sensitivePatternIssues(slide) {
  const issues = [];
  for (const [key, value] of Object.entries(slide || {})) {
    if (SENSITIVE_SKIP_FIELDS.has(key) || typeof value !== 'string') continue;
    for (const pat of SENSITIVE_PATTERNS) {
      if (pat.re.test(value)) {
        issues.push({ level: 'warning', rule: pat.rule, message: `"${key}" 필드에 ${pat.hint} 의심 문자열 — 가림 처리했는지 확인`, text: value.slice(0, 40) });
      }
    }
  }
  return issues;
}

const HIDE_GLYPHS_CSS = `
* { -webkit-text-fill-color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; caret-color: transparent !important; }
svg text, svg tspan { fill-opacity: 0 !important; stroke-opacity: 0 !important; }
/* bleed 곡선과 cs-doodle 강조(동그라미/밑줄)는 .bleed-layer에 그려진다. 대비는
   "글자 뒤에 실제로 있는 배경(종이, 채움)"을 재는 것이지, 글자 위/옆을 지나가는
   장식성 손그림 선까지 배경으로 치면 안 되므로 숨긴다. */
.bleed-layer { display: none !important; }
`;

async function lint(opts) {
  const { style, dimensions, pages, slides } = buildSlidePages(opts);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const report = [];
  try {
    // A single page only: requestAnimationFrame-based template code would stall in a background tab
    const page = await browser.newPage();
    await page.setViewport({ width: dimensions.width, height: dimensions.height });

    for (const p of pages) {
      await page.setContent(p.html, { waitUntil: 'networkidle0' });
      await waitForFonts(page, p.index + 1);

      const collected = await page.evaluate(collectInPage, { minFont: MIN_FONT_PX, tolerance: TOLERANCE, handFonts: HAND_FONTS });

      // cs-doodle처럼 rough.js로 렌더링 시점에 도형을 그리는 템플릿은, 같은 입력을 다시
      // 렌더링해도 항상 같은 PNG가 나와야 한다(고정 seed). 페이지를 한 번 더 새로 열어
      // 픽셀까지 비교한다 — DOM을 그대로 두고 다시 찍으면 이미 변환된 결과만 비교하게
      // 되어 무의미하므로 반드시 setContent를 다시 호출해 변환기를 재실행시킨다.
      //
      // 정확한 바이트 해시 비교는 쓰지 않는다: 같은 HTML을 같은 Chromium에서 두 번 찍어도
      // 글자 가장자리 안티앨리어싱이 1~2 밝기값 수준에서 미세하게 달라질 수 있다(눈으로는
      // 절대 안 보임, aws 다크 배경 텍스트에서 실측 확인됨 — ImageMagick fuzz 2%로는 diff 0).
      // 그래서 채널당 24 이상 차이 나는 픽셀만 세고, 그 개수가 전체의 0.05%를 넘을 때만
      // "진짜 흔들린 도형"으로 본다 — 시드 미고정처럼 도형이 눈에 띄게 움직이면 수천~수만
      // 픽셀 단위로 차이가 나서 이 문턱을 가뿐히 넘는다.
      const usesDoodleEngine = p.html.includes('__doodleConvert');
      const determinismIssues = [];
      if (usesDoodleEngine) {
        const shot1 = await page.screenshot({ encoding: 'base64', clip: { x: 0, y: 0, width: dimensions.width, height: dimensions.height } });
        await page.setContent(p.html, { waitUntil: 'networkidle0' });
        await waitForFonts(page, p.index + 1);
        const shot2 = await page.screenshot({ encoding: 'base64', clip: { x: 0, y: 0, width: dimensions.width, height: dimensions.height } });
        const diffPixels = await page.evaluate(pixelDiffCount, {
          a: shot1, b: shot2, width: dimensions.width, height: dimensions.height, channelTolerance: 24,
        });
        const totalPixels = dimensions.width * dimensions.height;
        if (diffPixels / totalPixels > 0.0005) {
          determinismIssues.push({
            level: 'error', rule: 'determinism',
            message: `같은 입력을 2회 렌더링한 결과가 다름 (${diffPixels}px, ${((diffPixels / totalPixels) * 100).toFixed(2)}% — seed가 고정되지 않은 도형이 있을 수 있음)`,
          });
        }
      }

      // Screenshot with glyphs hidden = the real background behind each text run
      await page.addStyleTag({ content: HIDE_GLYPHS_CSS });
      const shot = await page.screenshot({ encoding: 'base64', clip: { x: 0, y: 0, width: dimensions.width, height: dimensions.height } });
      const contrast = await page.evaluate(contrastInPage, {
        dataUrl: `data:image/png;base64,${shot}`, texts: collected.texts,
        width: dimensions.width, height: dimensions.height, minContrast: MIN_CONTRAST,
      });

      const issues = [
        ...collected.issues, ...contrast, ...safeAreaIssues(collected.texts, dimensions.width),
        ...determinismIssues, ...sensitivePatternIssues(slides[p.index]),
      ];
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
