const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const gyazoToken = '7PzEIcS3B2pRB1sMOOjtzBrGR4PX04ZH0ZfMc9bxRmk';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to the web page you want to take a screenshot of
  await page.goto('https://example.com');

  // Take a screenshot of the page using Puppeteer
  const screenshotBuffer = await page.screenshot({ fullPage: true });

  // Upload the screenshot to Gyazo using the Gyazo API
  const gyazoResponse = await fetch('https://upload.gyazo.com/api/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${gyazoToken}`,
      'Content-Type': 'application/octet-stream',
    },
    body: screenshotBuffer,
  });
  
  const gyazoData = await gyazoResponse.json();
  console.log(`Screenshot uploaded to Gyazo: ${gyazoData.url}`);

  await browser.close();
})();