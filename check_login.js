const { chromium } = require('playwright');
const https = require('https');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1366, height: 768 });
  
  console.log('Going to login page...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  
  // Take screenshot of login page to see what fields are there
  await page.screenshot({ path: 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\3603ecdc-5a09-4aab-8c38-ce198972c4ff\\login_page.png' });
  
  // Get all inputs
  const inputs = await page.$$eval('input', els => els.map(el => ({ type: el.type, name: el.name, id: el.id, placeholder: el.placeholder })));
  console.log('Inputs found:', JSON.stringify(inputs));
  
  const buttons = await page.$$eval('button', els => els.map(el => ({ type: el.type, text: el.innerText?.trim()?.substring(0, 30) })));
  console.log('Buttons found:', JSON.stringify(buttons));
  
  await browser.close();
})();
