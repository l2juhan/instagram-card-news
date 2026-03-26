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
const RAW_FIELDS = new Set(['code_body']);

// Fields that contain local image paths and need base64 conversion
const IMAGE_FIELDS = new Set(['left_image', 'right_image']);

// Fields that contain URLs (no conversion, pass through as-is)
const URL_FIELDS = new Set(['image_url', 'logo_url']);

// Metadata fields that are not template placeholders
const SKIP_FIELDS = new Set(['slide', 'type', 'style_override']);

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
  const systemReplacements = {
    '{{slide_number}}': String(index + 1).padStart(2, '0'),
    '{{total_slides}}': String(total).padStart(2, '0'),
    '{{accent_color}}': accentColor,
    '{{account_name}}': opts.account || config.defaults.account_name,
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
 * Main render function.
 * @param {object} opts - Options
 * @param {string} opts.slidesPath - Path to slides.json
 * @param {string} opts.style - Template style (minimal|bold|elegant)
 * @param {string} opts.outputDir - Output directory path
 * @param {string} opts.accent - Accent color hex
 * @param {string} opts.account - Account name string
 */
async function render(opts = {}) {
  const slidesPath = opts.slidesPath || path.join(process.cwd(), config.workspace_dir, 'slides.json');
  const style = opts.style || config.defaults.template;
  const outputDir = opts.outputDir || path.join(process.cwd(), config.output_dir);
  const accent = opts.accent || config.defaults.accent_color;
  const account = opts.account || config.defaults.account_name;
  const styleDim = (config.style_dimensions || {})[style];
  const dimensions = styleDim || config.dimensions;

  // Read slides
  if (!fs.existsSync(slidesPath)) {
    throw new Error(`slides.json not found at: ${slidesPath}`);
  }
  const slides = JSON.parse(fs.readFileSync(slidesPath, 'utf8'));

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  const templateDir = path.join(__dirname, '..', 'templates', style);
  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template directory not found: ${templateDir}`);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const total = slides.length;

    // Pre-validate templates and prepare HTML for all slides
    const tasks = [];
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const slideType = slide.type || 'content';
      const templateFile = path.join(templateDir, `${slideType}.html`);

      if (!fs.existsSync(templateFile)) {
        console.warn(`  Warning: template not found for type "${slideType}", skipping slide ${i + 1}`);
        continue;
      }

      const rawHtml = fs.readFileSync(templateFile, 'utf8');
      const processedHtml = applyPlaceholders(rawHtml, slide, { accent, account }, i, total);
      const slideNum = String(i + 1).padStart(2, '0');
      const outputFile = path.join(outputDir, `slide_${slideNum}.png`);

      tasks.push({ index: i, processedHtml, outputFile, slideNum });
    }

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

module.exports = { render };
