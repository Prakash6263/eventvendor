const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1366, height: 768 });
  
  // First check localStorage/sessionStorage for auth token
  console.log('Loading page...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Check if we're on login page or dashboard
  const url = page.url();
  console.log('Current URL:', url);
  
  // Get all class names on the page to understand structure
  const classes = await page.evaluate(() => {
    const allEls = document.querySelectorAll('[class]');
    const classSet = new Set();
    allEls.forEach(el => {
      el.className.split(' ').forEach(c => c && classSet.add(c));
    });
    return Array.from(classSet).slice(0, 50);
  });
  console.log('Available classes:', classes);
  
  // Get page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Get visible text
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('Body text preview:', bodyText);

  // Screenshot to see what we get
  await page.screenshot({ path: 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\3603ecdc-5a09-4aab-8c38-ce198972c4ff\\page_state.png' });
  console.log('Screenshot saved: page_state.png');
  
  await browser.close();
})();
