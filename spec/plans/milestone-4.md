# תוכנית – Milestone 4: PWA, Offline ופרסום אוטומטי

> מבוסס על `MILESTONES.md` (Milestone 4), `PRD.md` (4.5, Edge Cases), `ARCHITECTURE.md` (2.3, 2.6–2.7, 2.9–2.11), `DESIGN.md` (2.3 – אייקון האפליקציה), והקוד הקיים אחרי Milestone 3.
> תאריך: 21.10.2026

## 0. מטרה בקצרה

להפוך את המשחק הקיים לאתר שאפשר להתקין במסך הבית ולשחק בו גם בלי אינטרנט (אחרי טעינה ראשונה), ולפרסם אותו אוטומטית ב-GitHub Pages בכתובת `https://danielordan.github.io/simon/` בכל Push ל-`main`.

**לא בתחום:** שינוי בלוגיקת המשחק, במסכים או בעיצוב. אין הודעת ״גרסה חדשה״, אין כפתור התקנה בתוך האפליקציה, ואין שמירת ניקוד/מצב משחק (`ARCHITECTURE.md` 2.3, 2.7). התנהגות המעבר לרקע ו״הקש להמשך״ **נבדקת** בלבד, לא נבנית מחדש.

---

## 1. תלויות חדשות (devDependencies)

| חבילה | למה |
|---|---|
| `vite-plugin-pwa` (2.x, תומך ב-Vite 8) | Manifest, Service Worker (`generateSW`) ו-Precache |
| `@vite-pwa/assets-generator` (2.x) | הפקת אייקוני ה-PNG מקובץ SVG אחד |

`workbox-build` / `workbox-window` מגיעות כתלויות של הפלאגין. אם `npm install` מתלונן על התאמת גרסאות (peer) — עצירה ודיווח, בלי `--force`.

---

## 2. אייקוני האפליקציה (`DESIGN.md` 2.3)

### 2.1 מקור: `public/icon.svg` (חדש)

SVG מרובע (viewBox `0 0 512 512`) שמצייר את לוח Simon כמו במשחק: ארבעה רבעי עיגול סביב דיסקה מרכזית כהה, **בלי טקסט**.
- צבעים — אותם ערכים של משתני הצבע ב-`src/styles.css` (ירוק למעלה־שמאל, אדום למעלה־ימין, צהוב למטה־שמאל, כחול למטה־ימין).
- רקע: שקוף בקובץ המקור; הרקע `#0B141A` מתווסף בשלב ההפקה לגרסאות שצריכות רקע מלא.
- הלוח ממלא כמעט את כל ה-SVG; הריווח נקבע בהגדרות ההפקה (2.2).

### 2.2 הפקה: `pwa-assets.config.ts` (חדש) + סקריפט

הגדרה מותאמת (על בסיס `minimal2023Preset`):

| קובץ | גודל | רקע | ריווח |
|---|---|---|---|
| `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png` | 64/192/512 | `#0B141A` | קטן (~5%) |
| `maskable-icon-512x512.png` | 512 | `#0B141A` | הלוח בתוך ~80% מהשטח המרכזי (ריווח 10% מכל צד) |
| `apple-touch-icon-180x180.png` | 180 | `#0B141A` | ~10% |
| `favicon.ico` | 48 | — | — |

- סקריפט ב-`package.json`: `"generate-pwa-assets": "pwa-assets-generator"`. מריצים אותו פעם אחת, והקבצים שנוצרו ב-`public/` נשמרים ב-Git (כך ה-Build וה-CI לא צריכים להפיק אותם שוב).
- בדיקה חזותית של האייקונים (פתיחת ה-PNG) לפני שממשיכים — בעיקר שהגרסה ה-maskable לא נחתכת בעיגול.

---

## 3. הגדרת PWA ונתיב `/simon/`

### 3.1 `vite.config.ts`

```ts
export default defineConfig(({ command }) => ({
  // GitHub Pages serves the site under /simon/; dev and tests stay at /
  base: command === 'build' ? '/simon/' : '/',
  plugins: [react(), VitePWA({ ... })],
  test: { ...ללא שינוי },
}));
```

- `base` מותנה: ה-Build (וגם `npm run preview`) עובדים תחת `/simon/`, ושרת הפיתוח נשאר ב-`http://localhost:5173` כפי שמתועד ב-`CLAUDE.md`. Vitest לא מושפע.

הגדרות `VitePWA`:
- `registerType: 'autoUpdate'`, `injectRegister: 'script'` — הפלאגין מוסיף ל-`index.html` סקריפט רישום קטן. **אין שינוי ב-`main.tsx`** ואין רענון כפוי: גרסה חדשה נכנסת לתוקף בפתיחה הבאה (`ARCHITECTURE.md` 2.7). כיוון שכל קוד המשחק נטען פעם אחת בפתיחה, החלפת Service Worker ברקע לא קוטעת משחק פעיל.
- `manifest`:
  - `name: 'Simon – משחק זיכרון'`, `short_name: 'Simon'`, `description` בעברית (משפט קצר מתוך ה-PRD)
  - `lang: 'he'`, `dir: 'rtl'`, `display: 'standalone'`, `orientation: 'portrait'`
  - `start_url: '/simon/'`, `scope: '/simon/'`, `id: '/simon/'`
  - `theme_color` ו-`background_color`: `#0B141A`
  - `icons`: 64, 192, 512 (`purpose: 'any'`) ו-maskable 512 (`purpose: 'maskable'`)
- `workbox`:
  - `globPatterns: ['**/*.{js,css,html,woff2,png,svg,ico}']` — ברירת המחדל לא כוללת את קובצי הגופן; כך Rubik נכנס ל-Precache (`ARCHITECTURE.md` 2.6). קובצי `.woff` הישנים לא נכללים (כל דפדפן נייד מודרני משתמש ב-`woff2`).
  - `navigateFallback` נשאר ברירת המחדל (`index.html`) — רענון Offline מגיש את האפליקציה מה-Cache.
  - **אין `runtimeCaching`** — אין משאבים חיצוניים, ואין Cache של שום דבר מלבד קובצי האפליקציה.
- `devOptions` לא מופעל — ה-Service Worker קיים רק ב-Build, כדי לא להפריע לפיתוח ולבדיקות.

### 3.2 `index.html`

```html
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" href="/icon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
<meta name="description" content="..." />
```

`theme-color` כבר קיים. Vite מוסיף את `/simon/` לנתיבים האלה ב-Build — לוודא זאת ב-`dist/index.html`.

### 3.3 `.gitignore`

הוספת `dev-dist/` (תיקייה שהפלאגין עלול ליצור). `dist/` כבר קיים.

---

## 4. פרסום אוטומטי – `.github/workflows/deploy.yml` (חדש)

לפי `ARCHITECTURE.md` 2.10:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - actions/checkout
      - actions/setup-node (node-version: 22, cache: npm)
      - npm ci
      - npm run typecheck
      - npm test
      - npx vite build          # typecheck already ran above
      - actions/configure-pages
      - actions/upload-pages-artifact (path: dist)
  deploy:
    needs: build
    environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }
    runs-on: ubuntu-latest
    steps:
      - actions/deploy-pages (id: deployment)
```

- הגרסאות של ה-Actions הרשמיים (`checkout`, `setup-node`, `configure-pages`, `upload-pages-artifact`, `deploy-pages`) — הגרסה הראשית העדכנית של כל אחת, שתיבדק בזמן הבנייה.
- הפרסום (`deploy`) רץ רק אם כל שלבי `build` הצליחו.
- אין Secrets ואין משתני סביבה — לכן אין צורך ב-`.env.example`.

---

## 5. בדיקות אוטומטיות מסכמות – `src/test/summary.test.tsx` (חדש)

בסגנון הבדיקות הקיימות (Fake Timers, `rng` קבוע, `tap`):
1. **משחק מלא:** ״התחל״ → עשרה שלבים → כרטיס ניצחון `10 / 10`, ניקוד 10.
2. **ניווט באמצע משחק מלא:** מעבר לאודות בשלב באמצע, חזרה, והמשך עד הסוף — הניקוד והשלב נכונים.
3. **איפוס ברענון:** אחרי משחק (שיא > 0) — פירוק ה-App ורינדור מחדש (מדמה רענון) מציג ״התחל״, ניקוד 0 ושיא 0 באודות.
4. **אין אחסון מתמשך:** במהלך משחק שלם ומעבר לאודות, `localStorage` / `sessionStorage` לא נכתבים (spy על `Storage.prototype.setItem`).

כל הבדיקות הקיימות ממשיכות לעבור; `npm run typecheck` ו-`npm run build` נקיים.

---

## 6. בדיקה מקומית לפני הפרסום (שלי)

1. `npm run build` → בדיקת `dist/`: `manifest.webmanifest`, `sw.js`, האייקונים, וכל הנתיבים ב-`index.html` מתחילים ב-`/simon/`; ברשימת ה-Precache שב-`sw.js` מופיעים קובצי ה-JS/CSS, ה-`woff2` של Rubik והאייקונים.
2. `npm run preview` (נפתח ב-`http://localhost:4173/simon/`) בדפדפן המובנה, בגודל נייד:
   - אין שגיאות בקונסול ואין בקשות 404.
   - ה-Manifest נטען וה-Service Worker רשום ושולט בדף.
   - **Offline:** עצירת שרת ה-preview ← רענון הדף ← המשחק נטען מה-Cache, אפשר לשחק, ״אודות״ עובד, והניקוד מתחיל מ-0.
3. סגירת שרת ה-preview בסיום.

---

## 7. פרסום – צעדים שדורשים אותך

לפי `CLAUDE.md`, את חיבור ה-Hosting מבצע המשתמש, ו-Push דורש אישור. הסדר:

1. **הגדרת GitHub Pages (אתה, צעד אחר צעד):** ב-`github.com/danielordan/simon` ← `Settings` ← `Pages` ← תחת `Build and deployment` ← `Source: GitHub Actions`. (בנוסף לוודא שה-Repository ציבורי.)
2. **אישור Push:** אחרי שהבדיקות המקומיות עוברות — עצירה ובקשת אישור ל-commit + push ל-`main` (הפרסום לא יכול לקרות בלעדיו).
3. **מעקב:** בדיקת תוצאת ה-Workflow בדף `Actions` של ה-Repository (או דרך ה-API הציבורי של GitHub — `gh` אינו מותקן). אם נכשל — תיקון, ושוב בקשת אישור ל-Push.
4. **בדיקת הגרסה הפרוסה** בדפדפן המובנה, בגודל נייד: הכתובת נטענת ב-HTTPS, CSS/JS/Manifest/אייקונים נטענים בלי 404, משחק מלא / הפסד / ניצחון / ״משחק חדש״ / אודות והשהיה עובדים, וה-Service Worker פעיל.
5. סימון 🟡 ליד Milestone 4 ב-`MILESTONES.md`. (ה-commit של הסימון עצמו ייכלל בדחיפה הבאה, כשתאשר.)

> הערה: בניגוד ל-Milestones קודמים, כאן ה-Push קורה **לפני** האישור שלך, כי בלעדיו אין גרסה פרוסה לבדוק. ה-✅ עדיין ניתן רק אחרי שתבדוק.

### בדיקות שרק אתה יכול לעשות (בטלפון אמיתי)

- **התקנה:** Android/Chrome — ״התקן אפליקציה״ / ״הוסף למסך הבית״; iPhone/Safari — כפתור השיתוף ← ״הוספה למסך הבית״. האייקון מופיע, והאפליקציה נפתחת במסך מלא, לאורך.
- **Offline:** אחרי פתיחה ראשונה עם אינטרנט — מצב טיסה ← פתיחת האפליקציה ← משחק עובד.
- **צלילים ומגע** אחרי ״התחל״.
- **רקע:** באמצע הצגת רצף — מעבר לאפליקציה אחרת וחזרה ← ״הקש להמשך״ ← הרצף מוצג מתחילתו עם צליל.
- **רענון** מאפס ניקוד ושיא (גם Offline).

---

## 8. סיכום קבצים

| קובץ | פעולה |
|---|---|
| `package.json`, `package-lock.json` | שתי תלויות פיתוח + סקריפט `generate-pwa-assets` |
| `vite.config.ts` | `base` מותנה + `VitePWA` |
| `index.html` | favicon, apple-touch-icon, description |
| `public/icon.svg` | חדש – מקור האייקון |
| `public/*.png`, `public/favicon.ico` | חדשים – אייקונים מופקים |
| `pwa-assets.config.ts` | חדש – הגדרות הפקת האייקונים |
| `tsconfig.json` | הוספת `pwa-assets.config.ts` ל-`include` (כדי שייבדק ב-Typecheck) |
| `.github/workflows/deploy.yml` | חדש – בדיקות, Build ופרסום |
| `.gitignore` | הוספת `dev-dist/` |
| `src/test/summary.test.tsx` | חדש – בדיקות מסכמות |
| `CLAUDE.md` | הוספת `npm run preview` (בדיקת גרסת Build מקומית ב-`http://localhost:4173/simon/`) וכתובת האתר הפרוס |
| `spec/MILESTONES.md` | 🟡 בסיום |

אין שינוי בקוד המשחק (`src/game`, `src/hooks`, `src/components`) — אם יתגלה צורך בכזה בבדיקות, אדווח לפני.

---

## 9. Definition of Done – איך כל תנאי ייבדק

| תנאי | אימות |
|---|---|
| Push ל-`main` מריץ Workflow שמפרסם בהצלחה | ריצה ירוקה בדף Actions, שלבי `build` ו-`deploy` הצליחו |
| האתר נטען ומשאבי CSS/JS/Manifest נטענים בנתיב `/simon/` | בדיקת רשת בדפדפן המובנה על הכתובת הפרוסה – ללא 404 |
| ה-PWA ניתן להתקנה; התקנה נבדקת במכשיר תומך | Manifest תקין + Service Worker פעיל (אני); התקנה בטלפון (אתה) |
| טעינה מחדש ומשחק Offline אחרי טעינה ראשונה | preview מקומי עם שרת כבוי (אני); מצב טיסה בטלפון (אתה) |
| רענון מאפס משחק וניקוד גם Offline; Cache לקובצי האפליקציה בלבד | בדיקת רענון + רשימת ה-Precache ב-`sw.js` + בדיקה 4 ב-5 |
| משחק מלא, הפסד, ניצחון, ״משחק חדש״, אודות והשהיה בגרסה הפרוסה | מעבר ידני בדפדפן המובנה בגודל נייד |
| בדיקות אוטומטיות עוברות; מובייל ו-RTL | `npm test` מקומית וב-CI; צילום מסך בגודל `360×640` |
| המשתמש מקבל כתובת ותוצאות | סיכום בסוף הבנייה |
