'use strict';

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Load config
const configPath = path.join(__dirname, '..', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

/**
 * Convert a local image file path to a base64 data URL.
 * External URLs are returned as-is. Relative paths are resolved from cwd.
 */
function localImageToDataUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  const absPath = path.isAbsolute(imagePath) ? imagePath : path.join(process.cwd(), imagePath);
  if (!fs.existsSync(absPath)) return '';
  const ext = path.extname(absPath).slice(1).toLowerCase();
  const mimeMap = { gif: 'image/gif', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml' };
  const mime = mimeMap[ext] || 'image/png';
  const data = fs.readFileSync(absPath).toString('base64');
  return `data:${mime};base64,${data}`;
}

// Fields where \n should NOT be converted to <br> (raw HTML insertion)
const RAW_FIELDS = new Set(['code_body', 'visual']);

// Fields that contain local image paths and need base64 conversion
const IMAGE_FIELDS = new Set(['left_image', 'right_image']);

// Fields that contain URLs (no conversion, pass through as-is)
const URL_FIELDS = new Set(['image_url', 'logo_url']);

// Metadata fields that are not template placeholders
const SKIP_FIELDS = new Set(['slide', 'type', 'style_override', 'bleed_right', 'bleed_y', 'bleed_color', 'bleed_from', 'bleed_to', 'alt']);

/**
 * Normalize a slide's bleed_right spec into [{ y, color, from }].
 * bleed_right: true uses bleed_y / bleed_color / bleed_from; an array lists several lines.
 */
function normalizeBleed(slide) {
  if (!slide || !slide.bleed_right) return [];
  const list = Array.isArray(slide.bleed_right)
    ? slide.bleed_right
    : [{ y: slide.bleed_y, color: slide.bleed_color, from: slide.bleed_from }];
  return list.map((b) => ({ y: Number(b.y) || 760, color: b.color || 'ink', from: b.from || '' }));
}

function toScriptJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/**
 * Replace all template placeholders in HTML content.
 * Dynamically processes all fields from the slide object — no need to
 * register new fields here when adding new slide types.
 * @param {string} html - Raw HTML template string
 * @param {object} slide - Slide data object
 * @param {object} opts - Rendering options
 * @param {number} index - 0-based slide index
 * @param {number} total - Total slide count
 * @returns {string} Processed HTML
 */
function applyPlaceholders(html, slide, opts, index, total) {
  let result = html;

  // 1. System placeholders (not from slide data)
  const accentColor = opts.accent || config.defaults.accent_color;
  const bleedTo = [].concat(slide.bleed_to || []);
  const systemReplacements = {
    '{{slide_number}}': String(index + 1).padStart(2, '0'),
    '{{total_slides}}': String(total).padStart(2, '0'),
    '{{accent_color}}': accentColor,
    '{{account_name}}': opts.account || config.defaults.account_name,
    '{{progress_pct}}': (((index + 1) / total) * 100).toFixed(2),
    '{{series}}': opts.series || '',
    '{{bleed_out}}': toScriptJson(normalizeBleed(slide)),
    '{{bleed_in}}': toScriptJson(normalizeBleed(opts.prevSlide).map((b, k) => ({ y: b.y, color: b.color, to: bleedTo[k] || '' }))),
  };

  for (const [placeholder, value] of Object.entries(systemReplacements)) {
    result = result.split(placeholder).join(value);
  }

  // 2. Dynamic slide field placeholders
  for (const [key, value] of Object.entries(slide)) {
    if (SKIP_FIELDS.has(key)) continue;

    const placeholder = `{{${key}}}`;
    let processed;

    if (IMAGE_FIELDS.has(key)) {
      processed = localImageToDataUrl(value);
    } else if (URL_FIELDS.has(key) || RAW_FIELDS.has(key)) {
      processed = value || '';
    } else {
      processed = (value || '').toString().replace(/\n/g, '<br>');
    }

    result = result.split(placeholder).join(processed);
  }

  // 3. Second pass: replace {{accent_color}} that may exist inside injected data (e.g. SVG icons)
  result = result.split('{{accent_color}}').join(accentColor);

  // 3.5. Inject per-slide style_override CSS
  if (slide.style_override) {
    const processedOverride = slide.style_override.split('{{accent_color}}').join(accentColor);
    const overrideStyle = `<style>/* slide override */\n${processedOverride}\n</style>`;
    if (result.includes('</head>')) {
      result = result.replace('</head>', `${overrideStyle}\n</head>`);
    } else {
      result = result.replace('</html>', `${overrideStyle}\n</html>`);
    }
  }

  // 4. Clean up any remaining unreplaced placeholders
  result = result.replace(/\{\{[^}]+\}\}/g, '');

  return result;
}

/**
 * Wait for web fonts before taking a screenshot.
 * networkidle0 alone does not guarantee that font files have been applied.
 * Templates may list required families in <body data-fonts="Family A|Family B">;
 * if none of a family's faces finished loading, the render fails instead of
 * silently producing a fallback-font PNG.
 */
async function waitForFonts(page, slideNo) {
  const missing = await page.evaluate(async () => {
    await document.fonts.ready;
    // Let callbacks registered by the template (e.g. layout fitting after fonts.ready) run.
    // setTimeout rather than requestAnimationFrame: rAF never fires in a background tab.
    await new Promise((resolve) => setTimeout(resolve, 50));
    const required = ((document.body && document.body.getAttribute('data-fonts')) || '').split('|').filter(Boolean);
    const faces = Array.from(document.fonts);
    return required.filter((family) => !faces.some(
      (face) => face.family.replace(/["']/g, '') === family && face.status === 'loaded'
    ));
  });
  if (missing.length > 0) {
    throw new Error(`slide ${slideNo}: required font not applied: ${missing.join(', ')}`);
  }
}

const PREVIEW_WIDTH = 360;

/**
 * Write phone-size previews to <outputDir>/preview/:
 * - slide_XX.png: each slide scaled to 360px wide
 * - grid_cover.png: the cover center-cropped to 3:4 as shown in the profile grid
 */
async function writePreviews(browser, files, dimensions, outputDir) {
  const previewDir = path.join(outputDir, 'preview');
  fs.mkdirSync(previewDir, { recursive: true });
  const toDataUrl = (file) => `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
  const page = await browser.newPage();

  const scale = PREVIEW_WIDTH / dimensions.width;
  const previewHeight = Math.round(dimensions.height * scale);
  await page.setViewport({ width: PREVIEW_WIDTH, height: previewHeight });
  for (const file of files) {
    await page.setContent(
      `<body style="margin:0"><img src="${toDataUrl(file)}" style="display:block;width:${PREVIEW_WIDTH}px;height:${previewHeight}px"></body>`
    );
    await page.screenshot({
      path: path.join(previewDir, path.basename(file)),
      clip: { x: 0, y: 0, width: PREVIEW_WIDTH, height: previewHeight },
    });
  }

  if (files.length > 0) {
    let cropWidth = dimensions.width;
    let cropHeight = dimensions.height;
    if (cropWidth / cropHeight > 3 / 4) cropWidth = cropHeight * 3 / 4;
    else cropHeight = cropWidth * 4 / 3;
    const gridScale = PREVIEW_WIDTH / cropWidth;
    const gridHeight = Math.round(cropHeight * gridScale);
    const offsetX = ((dimensions.width - cropWidth) / 2) * gridScale;
    const offsetY = ((dimensions.height - cropHeight) / 2) * gridScale;
    await page.setViewport({ width: PREVIEW_WIDTH, height: gridHeight });
    await page.setContent(
      `<body style="margin:0;overflow:hidden"><img src="${toDataUrl(files[0])}" style="display:block;width:${dimensions.width * gridScale}px;margin:${-offsetY}px 0 0 ${-offsetX}px"></body>`
    );
    await page.screenshot({
      path: path.join(previewDir, 'grid_cover.png'),
      clip: { x: 0, y: 0, width: PREVIEW_WIDTH, height: gridHeight },
    });
  }

  await page.close();
  console.log(`  Previews: ${previewDir}`);
}

/**
 * Main render function.
 * @param {object} opts - Options
 * @param {string} opts.slidesPath - Path to slides.json
 * @param {string} opts.style - Template style (minimal|bold|elegant)
 * @param {string} opts.outputDir - Output directory path
 * @param {string} opts.accent - Accent color hex
 * @param {string} opts.account - Account name string
 */
/**
 * Build processed HTML for every slide. Shared by render() and scripts/lint-slides.js.
 * @param {object} opts - Same options as render() (slidesPath, style, accent, account, series)
 * @returns {{ slides: object[], style: string, dimensions: {width: number, height: number},
 *             pages: Array<{ index: number, type: string, html: string }> }}
 */
function buildSlidePages(opts = {}) {
  const slidesPath = opts.slidesPath || path.join(process.cwd(), config.workspace_dir, 'slides.json');
  const style = opts.style || config.defaults.template;
  const accent = opts.accent || config.defaults.accent_color;
  const account = opts.account || config.defaults.account_name;
  const styleDim = (config.style_dimensions || {})[style];
  const dimensions = styleDim || config.dimensions;

  // Read slides
  if (!fs.existsSync(slidesPath)) {
    throw new Error(`slides.json not found at: ${slidesPath}`);
  }
  const slides = JSON.parse(fs.readFileSync(slidesPath, 'utf8'));

  const templateDir = path.join(__dirname, '..', 'templates', style);
  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template directory not found: ${templateDir}`);
  }

  const total = slides.length;
  const seriesSource = slides.find((s) => s.series);
  const series = opts.series || (seriesSource ? seriesSource.series : '');

  // Pre-validate templates and prepare HTML for all slides
  const pages = [];
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideType = slide.type || 'content';
    const templateFile = path.join(templateDir, `${slideType}.html`);

    if (!fs.existsSync(templateFile)) {
      console.warn(`  Warning: template not found for type "${slideType}", skipping slide ${i + 1}`);
      continue;
    }

    const rawHtml = fs.readFileSync(templateFile, 'utf8');
    const html = applyPlaceholders(
      rawHtml, slide, { accent, account, series, prevSlide: slides[i - 1] }, i, total
    );
    pages.push({ index: i, type: slideType, html });
  }

  return { slides, style, dimensions, pages };
}

async function render(opts = {}) {
  const outputDir = opts.outputDir || path.join(process.cwd(), config.output_dir);
  const { slides, dimensions, pages } = buildSlidePages(opts);

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const total = slides.length;
    const tasks = pages.map((p) => {
      const slideNum = String(p.index + 1).padStart(2, '0');
      return { index: p.index, processedHtml: p.html, outputFile: path.join(outputDir, `slide_${slideNum}.png`), slideNum };
    });

    // Render slides in parallel using separate pages
    const CONCURRENCY = Math.min(tasks.length, 4);
    let nextTask = 0;

    async function worker() {
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(30000);
      await page.setViewport({
        width: dimensions.width,
        height: dimensions.height,
      });

      while (nextTask < tasks.length) {
        const taskIndex = nextTask++;
        const task = tasks[taskIndex];

        console.log(`Rendering slide ${task.index + 1}/${total}...`);

        await page.setContent(task.processedHtml, { waitUntil: 'networkidle0' });
        await waitForFonts(page, task.index + 1);

        await page.screenshot({
          path: task.outputFile,
          clip: {
            x: 0,
            y: 0,
            width: dimensions.width,
            height: dimensions.height,
          },
        });

        console.log(`  Saved: ${task.outputFile}`);
      }

      await page.close();
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

    if (opts.preview) {
      await writePreviews(browser, tasks.map((t) => t.outputFile), dimensions, outputDir);
    }
  } finally {
    await browser.close();
  }

  console.log(`\nDone. ${slides.length} slide(s) rendered to: ${outputDir}`);
}

// Parse CLI arguments
function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--slides':
        opts.slidesPath = args[++i];
        break;
      case '--style':
        opts.style = args[++i];
        break;
      case '--output':
        opts.outputDir = args[++i];
        break;
      case '--accent':
        opts.accent = args[++i];
        break;
      case '--account':
        opts.account = args[++i];
        break;
      case '--series':
        opts.series = args[++i];
        break;
      case '--preview':
        opts.preview = true;
        break;
      default:
        console.warn(`Unknown argument: ${args[i]}`);
    }
  }
  return opts;
}

// Run as CLI if executed directly
if (require.main === module) {
  const opts = parseArgs(process.argv);
  render(opts).catch((err) => {
    console.error('Render failed:', err.message);
    process.exit(1);
  });
}

module.exports = { render, buildSlidePages, applyPlaceholders, waitForFonts };
