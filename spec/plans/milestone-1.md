# תוכנית – Milestone 1: בסיס האפליקציה ומשחק ראשון עובד

> מבוסס על `MILESTONES.md` (Milestone 1), `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md` והתמונות `wireframes.png`, `mockups.png`, `style-guide.png`.
> תאריך: 21.10.2026

## 0. מטרה בקצרה

פרויקט React + TypeScript + Vite שעולה מקומית ומציג את מסך המשחק (כהה, RTL, Mobile-first). לחיצה על ״התחל״ מגרילה צבע אחד, מאירה אותו ומשמיעה צליל; אחר כך ״תורך!״ והשחקן לוחץ. לחיצה נכונה ← ״כל הכבוד!״ ← השהיה ← ״התחל״ חוזר. לחיצה שגויה ← ״התחל״ חוזר מיד.

**לא בתחום Milestone 1** (נבנה בהמשך): שלבים 2–10 והוספת צבעים, ניקוד מצטבר ושיא סשן (M2), צליל שגיאה / הבהוב / כרטיס סיום (M2), מסך אודות, השהיה ומעבר לרקע / ״הקש להמשך״ (M3), PWA, אייקונים, `base: '/simon/'` ופריסה (M4).

---

## 1. צעד מקדים – Node.js (עצירה מחויבת)

נבדק ב-21.10.2026: `node` ו-`npm` **אינם מותקנים** במחשב.
בתחילת הבנייה: לבדוק שוב (`node -v`). אם עדיין חסר — **לעצור** ולהדריך את המשתמש בשפה פשוטה:
1. להיכנס ל-https://nodejs.org ולהוריד את המתקין של גרסה **22 LTS** ל-macOS (קובץ `.pkg`).
2. להריץ את המתקין וללחוץ ״המשך״ עד הסוף.
3. לסגור ולפתוח מחדש את חלון Claude / הטרמינל.
4. לאשר לי — ואני אבדוק `node -v` (מצופה `v22.x`) ו-`npm -v`.

רק אחרי אישור ממשיכים.

---

## 2. הקמת הפרויקט

הפרויקט נבנה **בשורש ה-Repository הקיים** (לא בתת-תיקייה). לא נוגעים ב-`spec/`, ב-`CLAUDE.md` (מלבד סעיף פקודות ההרצה) או ב-`.gitignore` (כבר כולל `node_modules/`, `dist/`, `coverage/`, `*.tsbuildinfo`).

הקמה ידנית (לא `npm create vite` — הוא מתנגש עם תיקייה לא ריקה), עם הקבצים:

| קובץ | תוכן |
|---|---|
| `package.json` | `"type": "module"`, `"engines": { "node": ">=22" }`, סקריפטים (למטה) |
| `tsconfig.json` | `strict: true`, `jsx: react-jsx`, `moduleResolution: bundler`, `noEmit`, כולל `src` ו-`vite.config.ts`; types: `vite/client`, `vitest/globals` |
| `vite.config.ts` | `@vitejs/plugin-react`; בלוק `test`: `environment: 'jsdom'`, `globals: true`, `setupFiles: './src/test/setup.ts'` |
| `index.html` | `<html lang="he" dir="rtl">`, `viewport` עם `width=device-width, initial-scale=1, viewport-fit=cover` (בלי חסימת זום), `<meta name="theme-color" content="#0B141A">`, כותרת `Simon` |

**תלויות:**
- רגילות: `react`, `react-dom`, `@fontsource/rubik`
- פיתוח: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`

**סקריפטים:**
- `dev` → `vite`
- `typecheck` → `tsc --noEmit`
- `build` → `tsc --noEmit && vite build`
- `test` → `vitest run`
- `preview` → `vite preview`

`package-lock.json` נוצר ונשמר (נדרש ל-`npm ci` ב-M4).

---

## 3. מבנה הקוד

```text
src/
  main.tsx                 // React root, imports fonts + styles
  App.tsx                  // App shell: holds useGame, renders HomeScreen
  styles.css               // all CSS: tokens, layout, board, buttons
  game/
    types.ts               // Color, Phase, GameState
    constants.ts           // TIMINGS, COLORS, tone frequencies – single source
    rules.ts               // pure functions (no React, no timers)
    reducer.ts             // Game Controller: state machine (useReducer)
    scheduler.ts           // Sequence Scheduler: timed playback + cancel
    random.ts              // default RNG via crypto.getRandomValues
  audio/
    audio.ts               // Audio Adapter: AudioContext, tones
  hooks/
    useGame.ts             // wires reducer + scheduler + audio + refs
  components/
    TopBar.tsx             // "SIMON" + info (i) icon (no action yet)
    StatBoxes.tsx          // "שלב" / "ניקוד" cards
    SimonBoard.tsx         // four quarter buttons + center disc
    StatusArea.tsx         // Start button OR status message
    icons.tsx              // inline SVG icons: info, bars, trophy, power
  test/
    setup.ts               // jest-dom + AudioContext / crypto mocks
    rules.test.ts
    reducer.test.ts
    App.test.tsx
```

### 3.1 `game/types.ts`
לפי `ARCHITECTURE.md` 2.3, כבר עכשיו במבנה המלא (כדי ש-M2/M3 רק ירחיבו):
```ts
type Color = 'green' | 'red' | 'yellow' | 'blue';
type Phase = 'idle' | 'showing' | 'input' | 'success' | 'lost' | 'won';
type GameState = { sequence: Color[]; inputIndex: number; score: number; sessionBest: number; phase: Phase };
```
`screen` ו-`awaitingResume` יתווספו ב-M3, כשיש בהם שימוש. ב-M1 בשימוש רק `idle | showing | input | success`.

### 3.2 `game/constants.ts`
- `TIMINGS` – בדיוק לפי `DESIGN.md` 2.4.1: `leadIn: 700`, `seqOn: 600`, `seqGap: 250`, `press: 300`, `successPause: 1000`, `errorFlash: 600` (האחרון לשימוש ב-M2).
- `COLORS: Color[] = ['green','red','yellow','blue']`.
- `TONES` – תדרים מובחנים (בהשראת Simon המקורי): green 415Hz, red 310Hz, yellow 252Hz, blue 209Hz. (צליל שגיאה — M2.)
- `TOTAL_STAGES = 10`.
- שמות נגישים בעברית: ירוק / אדום / צהוב / כחול.

### 3.3 `game/random.ts` + `game/rules.ts` (Game Rules – טהור)
- `type Rng = () => number` (מספר 0–3). ברירת מחדל: `crypto.getRandomValues(new Uint32Array(1))[0] % 4` (ההטיה זניחה; מותרות חזרות).
- `randomColor(rng): Color`
- `appendColor(sequence, rng): Color[]` – מחזיר מערך **חדש** עם איבר אחד נוסף בסוף.
- `checkInput(sequence, inputIndex, color): 'correct' | 'complete' | 'wrong'`.
- `currentStage(state)` – נגזר: `max(1, sequence.length)` (לתצוגת ״1 / 10״ גם במצב idle).

### 3.4 `game/reducer.ts` (Game Controller)
`useReducer` עם `initialState` (`phase: 'idle'`, רצף ריק, אפסים). ה-RNG מוזרק דרך ה-Action (`START` נושא את הצבע שהוגרל ב-hook), כך שה-reducer נשאר טהור ובר-בדיקה.

| Action | תנאי | תוצאה ב-M1 |
|---|---|---|
| `START { color }` | `phase === 'idle'` | `sequence=[color]`, `inputIndex=0`, `score=0`, `phase='showing'` |
| `SHOW_DONE` | `phase === 'showing'` | `phase='input'` |
| `PRESS { color }` | `phase === 'input'` בלבד (אחרת – state ללא שינוי) | נכון ולא אחרון → `inputIndex+1`; נכון ואחרון → `score+1`, עדכון `sessionBest`, `phase='success'`; שגוי → `phase='idle'` (**זמני ל-M1**; ב-M2 → `lost`) |
| `SUCCESS_DONE` | `phase === 'success'` | **זמני ל-M1:** `phase='idle'` (ב-M2 → הוספת צבע ו-`showing`) |

החזרת אותו אובייקט state כשהפעולה לא חוקית מבטיחה שלחיצות כפולות/מהירות לא יגרמו למעברים כפולים.

### 3.5 `game/scheduler.ts` (Sequence Scheduler)
`playSequence(sequence, { onLight, onDone }, timings): cancel`
- `setTimeout` בשרשרת: המתנה `leadIn` ← לכל צבע `onLight(color)` למשך `seqOn` ← `onLight(null)` ← `seqGap` ← … ← `onDone()`.
- מחזיר פונקציית `cancel` שמנקה את כל ה-timers. בנוסף, ב-hook נשמר **Generation ID** ב-Ref: כל callback בודק שה-generation לא השתנה, כדי שאירוע מאוחר לא ישפיע.

### 3.6 `audio/audio.ts` (Audio Adapter)
- `ensureAudio()` – יוצר `AudioContext` (או `resume()` אם מושעה). נקרא **רק** מתוך אירוע לחיצה של המשתמש (״התחל״ ולחיצות צבע). עטוף ב-`try/catch` — כשל לא מפיל את המשחק.
- `playTone(color, ms)` – `OscillatorNode` (`triangle`) + `GainNode` עם Envelope קצר (attack/release ~10ms) למניעת Clicks. עוצר צליל קודם שעדיין מתנגן (מונופוני).
- `stopAll()` – עוצר מיד את הצליל הנוכחי.
- אם אין `AudioContext` (למשל בבדיקות) – הפונקציות לא עושות דבר.

### 3.7 `hooks/useGame.ts`
מחבר הכול; מחזיר ל-UI: `state`, `litColor` (מואר כרגע: מהצגה או מלחיצה), `start()`, `press(color)`.
- **Refs:** cancel של ה-Scheduler, timer הארת הלחיצה, timer השהיית ההצלחה, Generation ID.
- `start()`: `ensureAudio()` → מגריל צבע → `dispatch(START)`.
- `useEffect` על `phase`:
  - `showing` → `playSequence` (בכל `onLight`: `setLitColor` + `playTone(color, 600)`); `onDone` → `SHOW_DONE`.
  - `success` → timer של `successPause` ← `SUCCESS_DONE`.
  - ניקוי (cleanup) מבטל timers בכל שינוי phase וב-unmount.
- `press(color)`: אם `phase !== 'input'` — מתעלמים לגמרי (אין הארה, אין צליל). אחרת: `ensureAudio()`, הארה + `playTone(color, 300)` (לחיצה חדשה קוטעת את הקודמת ומאפסת את ה-timer של 300ms), ו-`dispatch(PRESS)`.
- ״כל הכבוד!״ מוצג כבר ב-phase `success`, במקביל להארת הלחיצה האחרונה (300ms), וה-timer של 1000ms מתחיל מאותו רגע.

---

## 4. ממשק המשתמש

### 4.1 פריסה (`App.tsx`, `styles.css`)
- עמודה אחת ממורכזת: `TopBar` ← `StatBoxes` ← `SimonBoard` ← `StatusArea`.
- גובה: `min-height: 100dvh`, Flex אנכי, `padding` עם `env(safe-area-inset-*)`. רוחב תוכן מרבי ~480px (מראה טלפון גם במסך רחב; אין התאמה ייעודית ל-Desktop).
- **התאמה ל-360×640 בלי גלילה:** גודל הלוח `width: min(88vw, 52dvh, 400px)` עם `aspect-ratio: 1`. תקציב גובה משוער ב-640: פס עליון 56 + תיבות 72 + לוח ~333 + הודעה 60 + מרווחים ~80 ≈ 600.
- גופן: `@fontsource/rubik/400.css` ו-`700.css` מיובאים ב-`main.tsx`; `font-family: 'Rubik', system-ui, sans-serif`.

### 4.2 Design Tokens (`:root` ב-`styles.css`)
מתוך `DESIGN.md` 2.1 (הממשק כהה בלבד):
`--bg #0B141A`, `--header #1A2935`, `--card #13232C`, `--card-border #233540`, `--board #121618`, `--disc #1A1D1F`, `--text #FFFFFF`, `--muted #9CA3AF`, `--primary #3B82F6`, `--gold #FACC15`, `--green #22C55E`, `--red #EF4444`, `--yellow #FACC15`, `--blue #3B82F6`.
רדיוסים 8/12/24px, מרווחים 4–32px, צללים לפי `DESIGN.md` 2.4. טיפוגרפיה לפי 2.2 (H1 32, H3 20 להודעות, Body 16, Caption 14).

### 4.3 `TopBar`
פס כהה (`--header`), `SIMON` ממורכז (`dir="ltr"`, 700). כפתור אייקון **מידע (i)** ממוקם **בקצה השמאלי הפיזי** (`position: absolute; left: 16px` – לא `inset-inline-start`), `aria-label="אודות"`. ב-M1 הכפתור קיים ללא פעולה.

### 4.4 `StatBoxes`
שתי תיבות בשורה, בסדר RTL טבעי: ״שלב״ מימין (`1 / 10`, אייקון עמודות זהב) ו״ניקוד״ משמאל (`0`, אייקון גביע זהב), כמו ב-Mockup. כרטיס: `--card`, מסגרת `--card-border`, רדיוס 12px. הערך `1 / 10` עטוף ב-`dir="ltr"` כדי שלא יתהפך.

### 4.5 `SimonBoard`
- קונטיינר עגול עם `dir="ltr"` ו-CSS Grid 2×2 → ירוק למעלה־שמאל, אדום למעלה־ימין, צהוב למטה־שמאל, כחול למטה־ימין, **קבוע** בלי קשר ל-RTL.
- כל רבע הוא `<button>` עם `aria-label` בעברית; צורת רבע עיגול באמצעות `border-radius` על הפינה החיצונית (100%) ופינה פנימית קטנה; מסגרת והפרדות בצבע `--board` (gap עבה).
- דיסקה מרכזית `--disc` עגולה, ממוקמת absolute במרכז, עם `SIMON` ואייקון power דקורטיבי; `pointer-events: none`, `aria-hidden` — אינה לחיצה.
- **מצב רגיל:** הצבע מעט מעומעם (`filter: brightness(0.75)` + Highlight עדין). **מצב מואר** (`data-lit="true"`): בהירות מלאה + `box-shadow` זוהר בצבע הרבע, כמו ״Pressed State״ ב-Style Guide.
- `@media (prefers-reduced-motion: reduce)`: ללא זוהר וללא transition; שינוי הבהירות נשמר.
- בזמן `showing`: `aria-disabled="true"` על הכפתורים (הקלט נחסם ב-hook ובר-reducer; לא משתמשים ב-`disabled` כדי לא לשנות מראה).

### 4.6 קליטת מגע (לפי `ARCHITECTURE.md` 2.6)
- `onPointerDown` → `press(color)` מיד. `preventDefault()` כדי שלא ייווצר click/focus מאוחר.
- נגיעה אחת בכל פעם: Ref של `activePointerId`; `pointerdown` נוסף בזמן שיש מצביע פעיל — מתעלמים. איפוס ב-`pointerup` / `pointercancel` / `lostpointercapture` (עם `setPointerCapture`).
- מקלדת: `onClick` כש-`event.detail === 0` (הפעלה מ-Enter/Space) → `press(color)`; קליקים של עכבר/מגע מטופלים כבר ב-pointerdown.
- CSS על הלוח: `touch-action: manipulation; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent`. **לא** חוסמים זום בדף כולו.

### 4.7 `StatusArea`
אזור בגובה קבוע (כדי שהפריסה לא תקפוץ), `aria-live="polite"`:
- `idle` → כפתור ראשי רחב ״התחל״ (`--primary`, רדיוס 12px, 700, Button Shadow).
- `showing` → כרטיס הודעה ״צפה ברצף״ (H3, 20px).
- `input` → ״תורך!״.
- `success` → ״כל הכבוד!״.

---

## 5. בדיקות אוטומטיות (Vitest + RTL)

`src/test/setup.ts`: `@testing-library/jest-dom`; Mock ל-`AudioContext` (מעקב אחרי תדרים שהושמעו), ובמידת הצורך `crypto.getRandomValues`.

**`rules.test.ts`**
- `randomColor` עם RNG קבוע מחזיר את הצבע הצפוי; ברירת המחדל מחזירה תמיד אחד מ-4 הצבעים.
- `appendColor` מוסיף בדיוק איבר אחד ולא משנה את המערך המקורי.
- `checkInput`: correct / complete / wrong.

**`reducer.test.ts`**
- `START` → רצף באורך 1, `showing`.
- `PRESS` בזמן `showing` — state זהה (התעלמות).
- `SHOW_DONE` → `input`; `PRESS` נכון → `success` ו-`score=1`; `PRESS` שגוי → `idle`.
- `SUCCESS_DONE` → `idle`.

**`App.test.tsx`** (Fake Timers)
- המסך מוצג: `lang="he"`/RTL (ב-`index.html` – בדיקה על המסמך), כותרת, ״שלב 1 / 10״, ״ניקוד 0״, 4 כפתורי צבע עם שמות בעברית, ״התחל״.
- לחיצה על ״התחל״ ← ״צפה ברצף״; אחרי 700ms הצבע המוגרל (RNG מוזרק/מדומה) מסומן מואר והצליל המתאים הושמע.
- לחיצה על צבע בזמן ״צפה ברצף״ — אין שינוי.
- אחרי 700+600ms ← ״תורך!״; לחיצה נכונה ← ״כל הכבוד!״; אחרי 1000ms ← ״התחל״ חוזר.
- לחיצה שגויה ← ״התחל״ חוזר.

---

## 6. אימות עצמי בזמן הבנייה

1. `npm run typecheck`, `npm test`, `npm run build` — כולם ללא שגיאות.
2. `npm run dev` והצגה בדפדפן המובנה בגודל **360×640** (וגם 375×812):
   - בדיקה שאין גלילה (`scrollHeight <= innerHeight`), טקסטים בעברית ומיושרים נכון, מיקום ארבעת הצבעים, אייקון (i) משמאל.
   - צילום מסך והשוואה ל-Mockup.
   - מחזור משחק: התחל ← הארה ← תורך! ← לחיצה נכונה ← כל הכבוד! ← התחל; ולחיצה שגויה.
   - צלילים: אני לא יכול לשמוע — נבדק בבדיקות (Mock) ובקריאה לתדרים; את השמע בפועל יבדוק המשתמש.
3. סגירת שרת הפיתוח בסיום.

---

## 7. עדכונים במסמכים

- `CLAUDE.md`, סעיף **פקודות הרצה**: `npm run dev` (הרצה), `npm test` (בדיקות). אין שינוי אחר ב-`CLAUDE.md`.
- `MILESTONES.md`: סימון 🟡 ליד כותרת Milestone 1 בסיום הבנייה.
- ADR ב-`ARCHITECTURE.md` רק אם תתקבל במהלך הבנייה החלטה טכנית משמעותית שלא מכוסה כאן.
- לא נוצר `.env` / `.env.example` — אין לאפליקציה משתני סביבה.
- אין commit.

---

## 8. מיפוי ל-Definition of Done

| תנאי | איך מתקיים |
|---|---|
| עולה מקומית; Build ו-Typecheck ללא שגיאות | סעיפים 2, 6.1 |
| עברית, RTL, Smartphone, כהה, צבעים במיקומים, 360×640 בלי גלילה | סעיפים 4.1–4.5, 6.2 |
| ״התחל״ ← רצף באורך 1, הארה וצליל | 3.4–3.7, 4.7 |
| חסימה בזמן ״צפה ברצף״, ואז ״תורך!״ וקלט | 3.4, 3.7, 4.5–4.6 |
| הצלחה ← ״כל הכבוד!״ ← ״התחל״ חוזר; 4 צבעים וצלילים ניתנים לבדיקה | 3.4, 3.7 (שחקן יכול לחזור על משחקים עד שיצאו כל הצבעים) |
| `CLAUDE.md` מעודכן | סעיף 7 |
| בדיקות ליצירת צבע וזיהוי קלט נכון — עוברות | סעיף 5 |

## 9. הערות פתוחות

- כדי לבדוק את ארבעת הצלילים ב-M1 צריך לשחק כמה פעמים עד שכל צבע יוגרל (או ללחוץ על צבעים ב״תורך!״ — כל לחיצה משמיעה את הצליל שלה, גם אם שגויה, לפני חזרת ״התחל״). זה תואם את ה-Milestone ואין צורך במצב בדיקה מיוחד.
