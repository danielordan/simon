# ARCHITECTURE – Simon: משחק זיכרון עם אורות וצלילים

> מבוסס על PRD.md | מחקר טכנולוגי: 20.10.2026

## 1. Technology Stack שנבחר

| רכיב | טכנולוגיה | תפקיד |
|---|---|---|
| Frontend | React + TypeScript | בניית שני המסכים, חיווי ו-State של המשחק עם טיפוסים מוגדרים |
| Build ושרת פיתוח | Vite | פיתוח מקומי, Build סטטי ונתיבי Assets |
| עיצוב | CSS רגיל | לוח Simon, Mobile-first, RTL, אנימציות הארה, ללא ספריית UI |
| צלילים | Web Audio API (Native) | הפקת ארבעה צלילים נבדלים וצליל שגיאה ללא קבצים חיצוניים |
| PWA ו-Offline | vite-plugin-pwa, אסטרטגיית generateSW המבוססת על Workbox | Manifest, Service Worker ו-Precache למשאבי האפליקציה |
| מצב משחק | React useReducer + useRef | State בזיכרון הדף בלבד; ניהול timers ומשאבים מחוץ ל-State |
| ניווט | State פנימי של React | מעבר בין Home ו-About ללא Router |
| אקראיות | Web Crypto API: crypto.getRandomValues | בחירת צבעים ללא AI או שירות חיצוני |
| בדיקות | Vitest + React Testing Library | בדיקות חוקי משחק, תזמון וזרימות UI |
| ניהול גרסאות | Git + GitHub | Repository לקוד ולתצורת הפריסה |
| CI/CD | GitHub Actions | בדיקות, Build ופרסום אוטומטי אחרי Push ל-main |
| Hosting | GitHub Pages | הגשת קבצים סטטיים ב-HTTPS |

### נימוקים ובחינת חלופות

- **Frontend:** נבחנו React, Vue ו-Vanilla TypeScript. אף ש-Vanilla עשוי להיות קטן יותר למשחק פשוט, React נבחר בזכות מודל State צפוי, תיעוד רחב, בדיקות נוחות ואקוסיסטם מוכר לכלי AI. אין צורך ב-Next.js או SSR כי אין Backend, SEO דינמי או נתונים מרוחקים.
- **Build:** נבחנו Vite, Webpack ופתרון ללא Bundler. Vite נבחר בשל הגדרה קצרה, תמיכה רשמית בפריסה סטטית ובסביבת TypeScript/React, והתאמה ל-PWA Plugin.
- **PWA:** נבחנו Service Worker ידני, vite-plugin-pwa ופתרון ללא Offline. vite-plugin-pwa עם generateSW נבחר לצמצום תחזוקה; אין צורך ב-Service Worker מותאם אישית.
- **Audio:** נבחנו Web Audio API, קובצי Audio עם HTMLAudioElement וספריית Howler. Web Audio API מאפשר ליצור צלילים קצרים מקומית ללא Assets או תלות נוספת, אך מחייב הפעלה בעקבות מחוות משתמש.
- **Hosting:** נבחנו GitHub Pages, Cloudflare Pages ו-Netlify. GitHub Pages נבחר כי האתר סטטי לחלוטין, מתאים להעדפת הפרויקט ולפריסה מתוך GitHub Actions. אין צורך ב-Vercel או Supabase.
- **בדיקות:** נבחנו Vitest ו-Jest; Vitest נבחר בשל השילוב הישיר עם Vite. React Testing Library מסייעת לבחון התנהגות משתמש בלי להיצמד למימוש פנימי.
- **עיצוב:** CSS רגיל עדיף כאן על Tailwind או ספריית Components, כי מדובר בשני מסכים ובלוח משחק ייחודי; כך נמנעות תלויות מיותרות.

### מגבלות וסיכונים

- GitHub Pages מתאים לאתר ציבורי סטטי. בתוכנית GitHub Free, פרסום Pages זמין ל-Repository ציבורי; יש לבדוק זכאות אם בוחרים Repository פרטי. קיימות מגבלות נפח ותעבורה, שאינן צפויות להכביד על משחק קטן; התנאים עשויים להשתנות.
- התקנת PWA אינה אחידה בין דפדפנים ומערכות הפעלה. במכשירי iPhone התקנה עשויה להתבצע דרך פעולת הוספה למסך הבית בדפדפן ולא באמצעות Prompt אוטומטי. אין להבטיח הופעת כפתור התקנה מובנה בכל מכשיר.
- Offline עובד לאחר טעינה מוצלחת ושמירת משאבי ה-App Shell ב-Cache. ניקוי נתוני אתר, הסרת ה-PWA או פינוי Cache על ידי מערכת ההפעלה עשויים לחייב חיבור מחודש.
- דפדפנים מגבילים Autoplay: יצירת/חידוש AudioContext תתבצע בעת לחיצה על ״התחל״ או ״משחק חדש״. גם כשהצלילים מוגדרים כפעילים תמיד במשחק, הגדרות מערכת/דפדפן עשויות להשתיקם.
- תזמון JavaScript עשוי להשתנות כאשר האפליקציה עוברת לרקע; יש להשהות השמעה ואינטראקציה שאינן בחזית כדי למנוע רצפים מקוטעים.
- עלויות: לא נדרש שירות Backend או Database בתשלום. GitHub Pages עשוי להתאים ללא עלות במסגרת זכאות ומכסות החשבון; דומיין מותאם אישית, אם יירכש בעתיד, אינו כלול.

## 2. ארכיטקטורת המערכת

### 2.1 מבט על

```text
GitHub Repository
    └─ GitHub Actions → Typecheck + Tests + Vite Build → GitHub Pages (HTTPS)
                                                           │
                                                           ▼
Mobile Browser / Installed PWA
    ├─ Service Worker + Cache Storage (קובצי App Shell בלבד)
    └─ React App (זיכרון זמני)
         ├─ Home / Simon Board
         ├─ About / Score Summary
         ├─ Game Controller + Pure Game Rules
         ├─ Sequence Playback Scheduler
         └─ Web Audio Adapter
```

כל הלוגיקה מתבצעת במכשיר המשתמש. GitHub Pages מגיש קבצים סטטיים בלבד. אין Runtime של שרת, API עסקי, Authentication, Database או תקשורת עם שירות AI.

### 2.2 Modules ואחריות

| Module | אחריות | תלות מרכזית |
|---|---|---|
| App Shell / Navigation | הצגת אחד משני המסכים ושמירת מצב המשחק במעבר ביניהם | React State |
| Game Rules | יצירת צבע חדש, בדיקת קלט מול הרצף, ניקוד וניצחון/הפסד | TypeScript טהור |
| Game Controller | State machine של שלבי המשחק, טיפול באירועים ומעברי מצב | Game Rules |
| Sequence Scheduler | תזמון הארה וצליל, עצירה/השהיה/חידוש וניקוי timers | Game Controller, Audio Adapter |
| Audio Adapter | AudioContext, ארבעה תדרים מובחנים וצליל שגיאה | Web Audio API |
| Simon Board | ארבעה כפתורי צבע בצורת רבעי עיגול, הארה, מגע וחסימת קלט | Game Controller |
| Home Screen | לחצני ״התחל״/״משחק חדש״, מצב ״צפה ברצף״/״תורך!״, שלב וניקוד | Game Controller |
| About Screen | שם המשחק, תיאור, הוראות, ניקוד נוכחי, שיא הסשן וחזרה | App State |
| PWA Layer | Manifest, רישום Service Worker, Precache ומשאבי Offline | vite-plugin-pwa |

לא להשתמש ב-Redux, Zustand, React Router, שרת HTTP ייעודי או שכבת API מלאכותית: אין לכך צורך ב-PRD.

### 2.3 Data Model וזיכרון

```ts
type Color = 'green' | 'red' | 'yellow' | 'blue';
type Phase = 'idle' | 'showing' | 'input' | 'success' | 'lost' | 'won';
type Screen = 'home' | 'about';

type GameState = {
  sequence: Color[];           // אורך 0 לפני התחלה, 1–10 במהלך המשחק
  // currentStep אינו נשמר: הוא נגזר תמיד כ-sequence.length, כדי שלא ייצא מסנכרון
  inputIndex: number;          // מיקום הצבע הבא הנדרש
  score: number;               // 0–10, שלבים שהושלמו
  sessionBest: number;         // 0–10, שיא מאז טעינת הדף
  phase: Phase;
  screen: Screen;
  awaitingResume: boolean;     // true אחרי חזרה מהרקע ב-showing/success: מוצג ״הקש להמשך״ והקלט חסום
};
```

מצב `paused` מיוצג בנפרד כמצב נגזר כאשר `screen === 'about'` ומשחק פעיל; יש לשמר את `phase` ואת `inputIndex`. אין צורך לשמור את המיקום בתוך הצגת הרצף — בחזרה ההצגה מתחילה מהצבע הראשון (ראה 2.5). State משותף ברמת App ולא בתוך מסך Home, כדי שהמעבר ל-About לא יאפס את המשחק. Timers, AudioContext ו-Tokens לביטול פעולות אסינכרוניות נשמרים ב-Refs, ולא ב-React State.

**שמירה:** זיכרון JavaScript בלבד. אין שימוש ב-localStorage, sessionStorage, IndexedDB או Cookies לצורך ניקוד, רצף או מצב משחק. `Cache Storage` של Service Worker משמש אך ורק לקבצי האפליקציה, ולא לנתוני השחקן. רענון מאתחל את GameState, כולל `sessionBest=0`. ״משחק חדש״ מאפס רצף, שלב, קלט וניקוד, אך משמר את `sessionBest` כל עוד הדף טעון.

### 2.4 State Machine וחוקי מעבר

| מצב | אירוע | תוצאה |
|---|---|---|
| idle | ״התחל״ | יצירת צבע ראשון (שלב 1), מעבר ל-showing |
| showing | הסתיימה השמעת הרצף | מעבר ל-input, הצגת ״תורך!״ |
| showing | לחיצת צבע | התעלמות מוחלטת |
| input | לחיצה נכונה שאינה אחרונה | קידום `inputIndex` |
| input | לחיצה נכונה אחרונה | `score += 1`, עדכון `sessionBest`; מעבר ל-success, או ל-won אם זה שלב 10 (בלי success ביניים) |
| input | לחיצה שגויה | מעבר ל-lost, עצירת רצף, צליל שגיאה והבהוב; כרטיס הסיום מוצג רק בסוף ההבהוב |
| success | הסתיימה השהיה קצרה | הוספת צבע אקראי (השלב גדל ב-1), איפוס `inputIndex`, מעבר ל-showing |
| won/lost | ״משחק חדש״ | משחק חדש; שיא הסשן נשמר |
| כל מצב פעיל | מעבר ל-About | ביטול כל ה-Timers, עצירת צליל, חסימת קלט, שימור State |
| About | ״חזרה למשחק״ | showing → הצגת אותו רצף מחדש מהצבע הראשון; success → השלמת המעבר לשלב הבא (הוספת הצבע) והצגת הרצף החדש מתחילתו; input → המשך מאותו `inputIndex`; idle/won/lost → אותה תצוגה |
| showing/success (במסך Home) | האפליקציה עוברת לרקע | ביטול Timers ועצירת צליל; בחזרה לחזית `awaitingResume=true` |
| lost (באמצע ההבהוב) | מעבר ל-About או לרקע | ביטול Timers; בחזרה מוצג ישירות כרטיס ההפסד |
| `awaitingResume` | לחיצה על ״הקש להמשך״ | חידוש AudioContext, `awaitingResume=false`; showing → הצגת אותו רצף מתחילתו; success → הוספת צבע (השלב הבא) והצגה מתחילתו |
| כל מצב | Reload | איפוס מלא למצב idle |

**כללי עקביות:**
- צבע חדש נבחר באופן בלתי תלוי מתוך ארבעת הצבעים; מותר שאותו צבע יופיע ברצף מספר פעמים, גם ברציפות.
- רצף קיים אינו משתנה בין שלבים; בכל מעבר נוסף איבר אחד בלבד לסוף המערך.
- `score` מתעדכן רק לאחר שחזור מלא של שלב. אחרי הצלחת שלב `n` הציון הוא `n`; בתחילת שלב `n+1` הציון נשאר `n`.
- ניצחון אחרי שחזור שלב 10 מעניק ציון 10 ואינו מייצר שלב 11.
- קלט יתקבל רק ב-phase=input וכאשר מסך Home פעיל. לחיצות מהירות/כפולות אינן רשאיות לעקוף בדיקת סדר או לגרום למעברי State כפולים.
- הודעת ״כל הכבוד!״ והשהיה קצרה יופיעו לפני הצגת השלב הבא. כל הזמנים לקוחים מטבלת התזמונים ב-`DESIGN.md` (סעיף 2.4.1) ומוגדרים כקבועים בקובץ אחד.
- צבע נוסף **רק** במעבר מ-success ל-showing (כולל כשהמעבר הזה הושלם בחזרה מ-About/רקע). הצגה חוזרת של showing אחרי About/רקע אינה מוסיפה צבע.
- מחולל האקראיות מוזרק כפונקציה (ברירת מחדל: `crypto.getRandomValues`), כדי שבבדיקות אפשר יהיה להשתמש ברצף ידוע מראש.

### 2.5 Scheduler, השהיה וצלילים

- לכל צבע ברצף יש הארה במשך 600ms, עם הפסקה של 250ms בין צבעים (כל הזמנים — `DESIGN.md` 2.4.1). משתמשים ב-Scheduler יחיד לסנכרון UI וצליל.
- הפקת צליל באמצעות `OscillatorNode` ו-`GainNode` ב-Web Audio API; לכל צבע תדר מובחן וקבוע, ולשגיאה צליל מובחן. יש למנוע Clicks באמצעות Gain Envelope קצר.
- AudioContext מופעל או מחודש ישירות מאירוע לחיצה של המשתמש, ולא בטעינת הדף. אם חידוש הצליל נכשל, המשחק אינו קורס; יש לשמור על התנהגות חזותית תקינה, בלי להוסיף מתג השתקה.
- עם מעבר ל-About: מבטלים את כל ה-Timers ועוצרים הארה וצליל. בחזרה: אם היינו ב-showing — מציגים את **אותו** רצף מחדש מהצבע הראשון; אם היינו ב-success — משלימים את המעבר לשלב הבא (מוסיפים את הצבע) ומציגים את הרצף החדש מתחילתו (הלחיצה על ״חזרה למשחק״ היא מחוות משתמש, ולכן מחדשים בה את ה-AudioContext); אם היינו ב-input — ממשיכים מאותו `inputIndex`. המעבר ל-About עצמו אינו מוסיף צבע ואינו משנה ניקוד; ב-success רק משלימים את המעבר לשלב הבא שכבר הגיע. כך אין צורך לשמור ״זמן שנותר״ באמצע הצגה.
- **יציאה בזמן הבהוב השגיאה:** `phase` כבר `lost`, ולכן כרטיס ההפסד מוצג לפי `phase` ולא לפי סיום ה-Timer. אם עזבו (ל-About או לרקע) באמצע ההבהוב, בחזרה מוצג ישירות כרטיס ההפסד, בלי להשמיע שוב את צליל השגיאה.
- הטיפול במעבר לרקע פועל **רק כש-`screen === 'home'`**. אם האפליקציה עוברת לרקע כשמסך About פתוח — לא עושים דבר; בחזרה ממשיכים לראות את About, ו״חזרה למשחק״ מטפלת בהמשך כרגיל.
- שינוי `visibilityState` לרקע בזמן showing/success (במסך המשחק): מבטלים Timers ועוצרים הצגה. בחזרה לחזית מציגים כפתור ״הקש להמשך״ (`DESIGN.md` 1.1); רק הלחיצה עליו מחדשת את ה-AudioContext ומציגה את הרצף מתחילתו (אם עזבו ב-success — קודם משלימים את המעבר לשלב הבא ומוסיפים את הצבע, בדיוק כמו בחזרה מ-About). הסיבה: ב-iOS ה-AudioContext מושעה ברקע ואפשר לחדש אותו רק ממחוות משתמש — בלי זה הרצף היה מוצג ללא צליל. ב-input — אין עצירה וממשיכים כרגיל; את ה-AudioContext מחדשים בלחיצה הבאה של השחקן.
- **מגבלה ידועה:** ב-iPhone עם מתג שקט פעיל, Web Audio עלול להיות מושתק. לא מוסיפים פתרון עוקף; המשחק פועל עם משוב חזותי.
- כל התחלת משחק חדש, הפסד, ניצחון או פירוק רכיב מבטלים Timers ופעולות מתוזמנות ישנות. שימוש ב-Cancellation Token/Generation ID מונע אירועים מאוחרים ממשחק קודם.

### 2.6 UI ו-RTL

- `html lang="he" dir="rtl"`; כל טקסט ממשק בעברית.
- מסך Home כולל לוח Simon בעל ארבעה רבעי עיגול בצבעים ירוק, אדום, צהוב וכחול, אזור מרכזי, שלב מתוך 10, ניקוד והודעות מצב.
- מסך About כולל תיאור, הוראות, ניקוד משחק נוכחי, שיא הסשן וכפתור ״חזרה למשחק״.
- צבעים הם כפתורי `<button>` סמנטיים עם שמות נגישים בעברית, אזורי מגע גדולים ומשוב חזותי שאינו תלוי בצליל בלבד. אין צורך להוסיף מסכים או תכונות מעבר ל-PRD.
- פריסה מותאמת למסכי טלפון בעזרת CSS יחסי (`min`, `clamp`, `aspect-ratio`) והתחשבות ב-Safe Areas; אין דרישת התאמה ייעודית לטאבלט או Desktop. מסך מינימלי נתמך: `360×640`, לאורך בלבד.
- **RTL ולוח המשחק:** הלוח ממוקם במיקומים פיזיים (למשל קונטיינר עם `dir="ltr"` או מיקום מפורש לכל רבע), כדי ש-`dir="rtl"` של הדף לא יהפוך את מיקומי הצבעים. כך גם האייקונים בפס העליון (`DESIGN.md` 2.5).
- **מגע:** הלחיצה על צבע נקלטת ב-`pointerdown` (מיידית, בלי עיכוב של click). נקלטת נגיעה אחת בכל פעם; נגיעה נוספת בזמן שאצבע אחרת לוחצת — מתעלמים. לחיצה חדשה (אחרי הרמת האצבע) בזמן שהארת הלחיצה הקודמת (300ms) עדיין פעילה — נקלטת ונבדקת כרגיל; ההארה והצליל הקודמים נקטעים ומתחילים הארה וצליל של הצבע החדש. על הלוח: `touch-action: manipulation` (אין זום בהקשה כפולה), `user-select: none` ו-`-webkit-touch-callout: none` (אין סימון טקסט ואין תפריט בלחיצה ארוכה). אין לחסום זום של הדף כולו.
- **נגישות:** אזור הודעת המצב מסומן `aria-live="polite"`; אפקטי זוהר ומעברים מונפשים מכבדים `prefers-reduced-motion`.
- **גופן:** Rubik נארז בתוך ה-Build (למשל דרך החבילה `@fontsource/rubik`, משקלים 400 ו-700 בלבד) ונכלל ב-Precache. אין טעינה מ-Google Fonts.

### 2.7 PWA, Offline ונתיבים

- `vite-plugin-pwa` עם `generateSW` ו-Manifest הכולל `name`, `short_name`, `lang: 'he'`, `dir: 'rtl'`, `display: 'standalone'`, `orientation: 'portrait'`, `start_url`, `scope`, `theme_color` ו-`background_color` (`#0B141A`), ואייקונים 192, 512 ו-maskable לפי `DESIGN.md`. בנוסף, ב-`index.html`: `apple-touch-icon` (180×180) ו-`theme-color`.
- Precache יכלול את `index.html`, קובצי JS/CSS, Manifest, Icons ומשאבים מקומיים הנדרשים למשחק. אין תלות ב-CDN, Google Fonts או Audio חיצוני בזמן משחק.
- `start_url` ו-`scope` חייבים להתאים לנתיב שבו האתר מפורסם. ה-Repository הוא `danielordan/simon` (ציבורי), ולכן כתובת הפרסום היא `https://danielordan.github.io/simon/` והגדרת `base` של Vite היא `/simon/`; נתיבי ה-Manifest וה-Assets ייגזרו מאותו Base.
- ניווט בין Home ל-About מתבצע בתוך React ללא URL Routes, כדי למנוע 404 ברענון ב-GitHub Pages.
- אסטרטגיית Cache: Precache של App Shell עם גרסאות Build. עדכון גרסה: `registerType: 'autoUpdate'` **בלי** רענון כפוי של הדף — הגרסה החדשה נטענת בפתיחה הבאה של האפליקציה. אין הודעת ״גרסה חדשה״ ואין כפתור עדכון (אינם ב-PRD).
- אין Cache של נתוני משתמש. יש לבדוק התקנה והפעלה Offline במכשיר נייד אמיתי אחרי טעינה ראשונה מחוברת.

### 2.8 Data Flow

1. המשתמש טוען את האתר מ-GitHub Pages; ה-Service Worker מגיש משאבים שמורים כאשר הם זמינים.
2. React מאתחל State ריק, ומציג Home עם ״התחל״.
3. לחיצה על ״התחל״ מפעילה את AudioContext, מגרילה צבע ומתחילה Scheduler.
4. Scheduler מעדכן הארה ומשמיע צליל; בזמן showing אין קלט שחקן.
5. בסיום הרצף Game Controller מאפשר קלט ומציג ״תורך!״.
6. כל לחיצה נבדקת מול `sequence[inputIndex]`. לחיצה נכונה מקדמת אינדקס; טעות מפעילה סיום ושגיאה.
7. בסיום רצף תקין מתעדכנים `score` ו-`sessionBest`; מתחיל שלב נוסף או מוצג ניצחון.
8. מעבר ל-About משהה Playback אך אינו משמיד את State; חזרה משחזרת אותו.

### 2.9 APIs, אבטחה ופרטיות

- אין API חיצוני, REST, GraphQL או אינטגרציה עם שירות צד שלישי בזמן המשחק.
- Browser APIs בשימוש: Web Audio API, Web Crypto API, Service Worker API, Cache Storage ו-Page Visibility API.
- אין Authentication או Authorization כי אין משתמשים רשומים או נתונים משותפים.
- אין איסוף או שליחת מידע אישי; הניקוד נשאר בזיכרון הדף בלבד. שירות ה-Hosting עשוי לעבד נתוני גישה טכניים בהתאם למדיניותו.
- HTTPS מסופק על ידי GitHub Pages. אין Secrets ב-Frontend, ב-Repository או בקובצי Build. יש להימנע מהטמעת קוד צד שלישי שאינו נדרש, ולהשתמש בתלויות מעודכנות.

### 2.10 GitHub, Hosting, Build ו-Deployment

**Source Control:** Repository אחד ב-GitHub, ענף `main` לפרסום. יש לשמור קוד, Assets, בדיקות, `package.json`, `package-lock.json`, תצורת Vite/PWA וקובץ Workflow ב-Git. אין לשמור `node_modules`, `dist` או Secrets ב-Repository.

**Build:** `npm ci` להתקנה שחזורית, בדיקת טיפוסים (`tsc --noEmit` או סקריפט Typecheck שקול), `vitest run`, ולבסוף `vite build` שמייצר `dist/`.

**Deployment אוטומטי:**
1. Push ל-`main` מפעיל GitHub Actions.
2. Workflow מבצע Checkout, מתקין Node 22 LTS, מריץ `npm ci`, בדיקת טיפוסים, בדיקות ו-Build.
3. רק אם הכול הצליח, Workflow מעלה את `dist/` כ-Pages Artifact ומפרסם ל-GitHub Pages באמצעות Actions הרשמיים.
4. הגדרת Repository: `Settings → Pages → Build and deployment → Source: GitHub Actions`. הרשאות Workflow מצומצמות: `contents: read`, `pages: write`, `id-token: write`.
5. האתר נגיש ב-HTTPS בכתובת Pages. לאחר פריסה חדשה, Service Worker יעדכן Cache בצורה שאינה קוטעת משחק פעיל.

אין משתני סביבה סודיים או הגדרות Production Database. יש להגדיר רק `base`/נתיב פרסום לפי שם ה-Repository. סביבת Development משתמשת בשרת Vite מקומי; Production היא Build סטטי ב-GitHub Pages.

**דרישות מקדימות במחשב הפיתוח:** Node.js 22 LTS ו-npm. נכון ל-21.10.2026 Node אינו מותקן במחשב — בתחילת Milestone 1 יש לעצור ולהדריך את המשתמש בהתקנתו, צעד אחר צעד.

### 2.11 בדיקות ואימות טכני

- Unit Tests: יצירת רצף, תוספת צבע יחיד, חזרות על צבע, בדיקת קלט, ניקוד, טעות אחת, ניצחון בשלב 10 ואיפוס משחק מול שימור שיא.
- בדיקות תזמון עם Fake Timers: הזמנים שבטבלת התזמונים, חסימת קלט בזמן showing, מעבר אוטומטי, חזרה מ-About או מהרקע לפי טבלת המעברים (showing → אותו רצף מההתחלה בלי צבע חדש; success → בדיוק צבע אחד נוסף; input → המשך הקלט; באמצע הבהוב שגיאה → כרטיס הפסד; רקע כשמסך About פתוח → ללא שינוי), ״הקש להמשך״, ביטול timers אחרי סיום.
- בדיקות UI: עברית/RTL, מסך Home ו-About, הצגת ניקוד ושיא, הודעות ״צפה ברצף״/״תורך!״/״המשחק הסתיים״/״כל הכבוד! ניצחת!״.
- בדיקות במכשירי מובייל אמיתיים: מגע, שמע לאחר ״התחל״, PWA Install, Offline לאחר טעינה ראשונה, רענון שמאפס נתונים, חזרה מ-About ופעילות לאחר מעבר לרקע.
- בדיקות Build/Deploy: נתיבי Assets נכונים תחת `/simon/`, טעינת Manifest/Icons, אין 404, HTTPS ו-Cache של כל משאבי המשחק.

## 3. החלטות שאינן נדרשות

לא נבחרו Backend, Database, Supabase, Vercel, Authentication, Cloud Storage, שירות AI, Analytics, Router או State Management חיצוני. אין צורך ב-Database Migrations, בהפרדת פרויקטי Database ל-Development/Production או בסודות שרת. הוספתם תסתור את עקרון הפשטות ואת ה-PRD.

## 4. מקורות רשמיים

1. React – TypeScript: https://react.dev/learn/typescript
2. Vite – פריסה סטטית ב-GitHub Pages: https://vite.dev/guide/static-deploy.html
3. vite-plugin-pwa – תיעוד: https://vite-pwa-org.netlify.app/
4. MDN – התקנת PWA: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
5. MDN – Web Audio API best practices: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
6. MDN – Autoplay: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
7. GitHub – GitHub Pages limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
8. GitHub – Pages quickstart וזכאות: https://docs.github.com/en/pages/quickstart
9. Vitest – Getting Started: https://vitest.dev/guide/

הבחירות לעיל נועדו לממש את ה-PRD ללא שינוי בדרישות המוצר. אין במסמך זה Milestones או תוכנית עבודה.

## החלטות מרכזיות (ADRs)

### ADR-1: השהיה דרך תנאי ״מותר לרוץ״ אחד
**הקשר:** במעבר לאודות או לרקע צריך לעצור את הצגת הרצף ואת השהיית ״כל הכבוד!״, ובחזרה להציג את הרצף מתחילתו — בלי לשמור ״זמן שנותר״.
**החלטה:** הצגת הרצף וטיימר ההצלחה רצים רק כשמוצג מסך המשחק ולא ממתינים ל״הקש להמשך״ (`screen === 'home' && !awaitingResume`). כשהתנאי נהיה שקר, ה-cleanup של ה-effect מבטל את כל ה-Timers ועוצר צליל; כשהוא חוזר להיות אמת, ה-effect רץ מחדש ומציג את הרצף מהצבע הראשון.
**השלכות:** מנגנון אחד לאודות ולרקע, בלי Timers כפולים. הוספת הצבע בחזרה מהשהיית ההצלחה נעשית ב-reducer (`CLOSE_ABOUT`/`RESUME`) דרך אותה פונקציה של `SUCCESS_DONE`.

### ADR-2: `awaitingResume` נדלק ברגע היציאה לרקע
**הקשר:** טבלת המעברים (2.4) מתארת הדלקת `awaitingResume` בחזרה לחזית. דפדפנים מאטים Timers ברקע, כך שהצגה שממשיכה ״לרוץ״ עד החזרה עלולה להיות מקוטעת.
**החלטה:** `awaitingResume=true` נקבע כבר באירוע `visibilitychange` ל-`hidden` (רק במסך המשחק וב-`showing`/`success`). באותו רגע גם מסתיימים מיד הארת לחיצה או הבהוב שגיאה פעילים.
**השלכות:** למשתמש ההתנהגות זהה — בחזרה מוצג ״הקש להמשך״ — וה-Timers נעצרים מיד. אין צורך בטיפול נפרד באירוע החזרה לחזית.
