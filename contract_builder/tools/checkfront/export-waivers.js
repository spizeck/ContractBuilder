const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const BASE_URL = process.env.CHECKFRONT_BASE_URL || 'https://seasaba.checkfront.com';
const STORAGE_STATE_PATH = path.resolve(__dirname, 'storageState.json');
const DOWNLOADS_DIR = path.resolve(__dirname, 'downloads');

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function getArgValue(name) {
  const idx = process.argv.findIndex((a) => a === name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function clickExport(page) {
  const candidates = [
    'button:has-text("Export")',
    'a:has-text("Export")',
    'text=Export',
    '[title*="Export"]',
  ];

  for (const selector of candidates) {
    const loc = page.locator(selector).first();
    try {
      if (await loc.count()) {
        await loc.scrollIntoViewIfNeeded();
        await loc.click({ timeout: 5000 });
        return;
      }
    } catch (_) {
      // try next
    }
  }

  throw new Error('Could not find an Export button/link on the page. The UI may have changed.');
}

async function main() {
  const urlArg = getArgValue('--url') || process.env.CHECKFRONT_DOCUMENT_URL;
  if (!urlArg) {
    console.error('Missing required argument: --url');
    console.error('Example:');
    console.error('  npm run checkfront:export -- --url "https://seasaba.checkfront.com/document/?date_src=effective_date&date=T&start_date=18%20Dec%202025&end_date=18%20Dec%202025&status%5B%5D=COMPLETE&template_id%5B%5D=7&template_id%5B%5D=8"');
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(STORAGE_STATE_PATH)) {
    console.error(`Missing session file: ${STORAGE_STATE_PATH}`);
    console.error('Run: npm run checkfront:login');
    process.exitCode = 1;
    return;
  }

  ensureDirExists(DOWNLOADS_DIR);

  const url = urlArg.startsWith('http') ? urlArg : `${BASE_URL}${urlArg}`;

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: STORAGE_STATE_PATH,
    acceptDownloads: true,
  });

  const page = await context.newPage();

  console.log(`Opening: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const downloadPromise = page.waitForEvent('download', { timeout: 120000 });
  await clickExport(page);

  const download = await downloadPromise;
  const suggested = download.suggestedFilename();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const savePath = path.join(DOWNLOADS_DIR, `${timestamp}__${suggested}`);

  await download.saveAs(savePath);
  console.log(`Downloaded: ${savePath}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
