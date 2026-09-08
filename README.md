# jkl-lunch

Machine-readable lunch menus for Jyväskylä restaurants, scraped on a schedule and
committed back into this repo so consumers only ever need a plain HTTP GET.

The point of committing the JSON rather than scraping on demand: the scrape needs a
headless browser (the menu is rendered client-side into hidden per-day tab panes), which
is far too heavy for a consumer that just wants today's dishes. GitHub Actions pays that
cost once a week and everyone else reads a static file.

## Feeds

| Restaurant | File | Raw URL |
|---|---|---|
| Shalimar, Jyväskylä Matkakeskus | `shalimar.json` | `https://raw.githubusercontent.com/pieterterberg/jkl-lunch/main/shalimar.json` |

The repo is public on purpose — `raw.githubusercontent.com` serves public repos without
authentication, so a consumer needs no token.

## Shape

```json
{
  "source": "https://shalimar.fi/jyvaskyla/matkakeskus/lunchmenu/",
  "scraped_at": "2026-09-08T10:00:00.000Z",
  "days": {
    "monday": {
      "label": "Maanantai",
      "items": [
        { "name": "Chicken Tikka Masala", "price": "12.90", "description": "" }
      ]
    }
  }
}
```

Day keys are English lowercase (`monday`…`friday`); `label` carries the Finnish name the
site itself uses. `price` is euros as a decimal string.

## Scraping

`.github/workflows/scrape-shalimar.yml` runs Mondays at 03:00 UTC and on manual dispatch,
then commits `shalimar.json` if it changed. Run it locally with:

```bash
npm i -D playwright && npx playwright install --with-deps chromium
node scrape.js
```

`scrape.js` exits 1 with `No dishes parsed` when it finds no prices at all, so a silent
selector rot fails the workflow instead of committing an empty menu.
