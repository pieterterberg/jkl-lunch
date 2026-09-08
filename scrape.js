const { chromium } = require('playwright');
const fs = require('fs');

const URL = 'https://shalimar.fi/jyvaskyla/matkakeskus/lunchmenu/';
const DAYS = {
  monday: 'Maanantai',
  tuesday: 'Tiistai',
  wednesday: 'Keskiviikko',
  thursday: 'Torstai',
  friday: 'Perjantai',
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => document.body.textContent.includes('€'), null, { timeout: 30000 });

  const days = await page.evaluate((DAYS) => {
    const out = {};
    for (const [id, label] of Object.entries(DAYS)) {
      const pane = document.querySelector('#' + id);
      if (!pane) continue;
      pane.style.display = 'block';
      pane.style.visibility = 'visible';
      pane.style.opacity = '1';
      pane.classList.add('active', 'show', 'in');

      const lines = pane.innerText.split('\n').map(l => l.trim()).filter(Boolean);
      const items = [];
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^(\d+[.,]\d{2})\s*€$/);
        if (!m) continue;
        const name = lines[i + 1];
        if (!name || /^Lounas\b/i.test(name)) continue;
        const next = lines[i + 2] || '';
        const description = /^\d+[.,]\d{2}\s*€$|^Lisää ostoskoriin$|^Tilaa tästä$|^\*/.test(next) ? '' : next;
        items.push({ name: name.replace(/\s+/g, ' ').trim(), price: m[1].replace(',', '.'), description });
      }
      out[id] = { label, items };
    }
    return out;
  }, DAYS);

  await browser.close();

  const total = Object.values(days).reduce((n, d) => n + d.items.length, 0);
  if (total === 0) {
    console.error('No dishes parsed — page structure changed');
    process.exit(1);
  }

  fs.writeFileSync('shalimar.json', JSON.stringify({ source: URL, scraped_at: new Date().toISOString(), days }, null, 2) + '\n');
  console.log(`Wrote shalimar.json (${total} dishes)`);
})();
