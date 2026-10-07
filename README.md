# United Vision – unitedvision.be

Landing page for **United Vision**, a corporate gifting company in Belgium. It presents the brands and catalogues and links visitors to the B2B shop at [unitedvision.b2b.gift](https://unitedvision.b2b.gift).

It's a static site with no build step and no dependencies, hosted on **GitHub Pages** with the custom domain from `CNAME`.

## Structure

```
index.html               Home page (all sections)
404.html                 Not-found page (served by GitHub Pages)
CNAME                    Custom domain: unitedvision.be
robots.txt, sitemap.xml  Search engine files
assets/
  css/tokens.css         Colors, fonts, spacing for light and dark themes
  css/base.css           Reset, typography, layout helpers
  css/components.css     Header, hero, tiles, brands, catalogues, form, footer
  js/i18n.js             English + Dutch (nl-BE) translations
  js/main.js             Theme/language settings, mobile menu, quote form
  img/logo.png           Logo with transparent background (used on the site)
  img/logo-original.png  Original logo file (white background), source for the above
  img/                   Also favicons and the social preview image (og-image.png)
```

## Common edits

**Change text:** English is written in `index.html` and repeated in `assets/js/i18n.js` (`en`). Dutch is only in `i18n.js` (`nl`). Each translatable element has a `data-i18n="key"` attribute that matches a key in that file. When you change a sentence, update both places.

**Add a brand or catalogue:** copy an existing `<li>` in the *Brands* or *Catalogues* section of `index.html` and change the name and link. Always use the `/en/` shop URL and keep `?ref=2e7b22cbbe36ef7b`. When a visitor picks Dutch, the site rewrites `/en/` to `/nl/` automatically. If the brand has a tagline, add a key for it to both languages in `i18n.js`.

**Colors and fonts:** edit `assets/css/tokens.css`. The light theme matches the B2B shop (Montserrat font, black buttons). The dark theme is under `[data-theme="dark"]`.

## Settings

The settings button in the header lets visitors choose:

- **Theme:** Light, Dark or Auto (follows the device setting)
- **Language:** English or Nederlands. By default the site uses the browser language, and `?lang=nl` forces Dutch.

The choice is saved in the visitor's browser.

## Quote form

The form sends submissions to **waddah@unitedvision.be** through [FormSubmit](https://formsubmit.co), a free form-to-email service, so no server is needed.

- **One-time activation:** the first time the form is submitted, FormSubmit emails waddah@unitedvision.be with an activation link. Click it, and every submission after that arrives as a normal email. Until then, visitors see an error with a direct email link.
- Spam protection: a hidden honeypot field.
- If sending fails, visitors are shown a `mailto:` link as a fallback.
- Without JavaScript the form still works. It posts directly and comes back to `/?sent=1`.

To change the address, replace `waddah@unitedvision.be` in `index.html` (form `action`, contact card, footer, JSON-LD) and in `assets/js/main.js` (`CONFIG`).

## Run locally

The site uses root paths (`/assets/...`), so serve it from a local server instead of opening the file directly:

```sh
python -m http.server 8000
# open http://localhost:8000
```

## Deploy

Push to the branch GitHub Pages publishes from (Settings → Pages). The changes go live on unitedvision.be within a minute or two.
