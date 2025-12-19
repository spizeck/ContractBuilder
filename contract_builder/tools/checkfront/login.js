const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const BASE_URL = process.env.CHECKFRONT_BASE_URL || 'https://seasaba.checkfront.com';
const STORAGE_STATE_PATH = path.resolve(__dirname, 'storageState.json');

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

async function main() {
  ensureDirExists(__dirname);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Opening Checkfront. Please sign in and navigate to the Document page.');
  console.log(`Target: ${BASE_URL}/document/`);

  await page.goto(`${BASE_URL}/document/`, { waitUntil: 'domcontentloaded' });

  console.log('\nWhen you are fully signed in and can see the Document page, come back to this terminal.');
  console.log('Then press ENTER to save the session.');

  await new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', () => resolve());
  });

  await context.storageState({ path: STORAGE_STATE_PATH });
  console.log(`Saved session to: ${STORAGE_STATE_PATH}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
