# خريطة هاون ريفورجر | Reforger Mortar Map

[English](#english) | [العربية](#العربية)

---

<a name="العربية"></a>
## العربية 🇸🇦

تطبيق ويب تكتيكي مجاني وخفيف يعمل بالكامل داخل المتصفح (Static Web App) بدون خوادم، مخصص لحساب إحداثيات الهاون والرمي الدقيق للعبة **Arma Reforger**. تم تصميمه بواجهة عربية كاملة بنظام RTL مع إمكانية التبديل إلى الإنجليزية بضغطة زر، ومتوافق مع النشر المباشر والمجاني على GitHub Pages.

### المميزات والتحديثات الرئيسية:

1. **صورة الخريطة والمعايرة (IndexedDB)**:
   - زر **"رفع صورة الخريطة"** لكل تضاريس (Everon و Arland).
   - تُخزن الصورة (PNG, JPG, WebP) **محلياً فقط على جهاز المستخدم في IndexedDB** ولا تُرفع لأي خادم إطلاقاً.
   - تعرض الصورة عبر Leaflet `ImageOverlay` مع دعم الزووم والسحب بسلاسة.
   - **أداة معايرة بنقطتين**: في حال كانت الصورة مقصوصة جزئياً، يحدد المستخدم نقطتين ويدخل إحداثياتهما ليحسب التطبيق التكبير والإزاحة تلقائياً.
   - شريط شفافية، زر حذف الصورة، وخيار متقدم لاستخدام رابط بلاطات مخصص `{z}/{x}/{y}`.
   - عند عدم وجود صورة: خلفية تخطيطية داكنة مع خطوط 1 كم و 100 م وبوصلة وشريط تنبيه يتيح الرفع المباشر.
   - دليل **"كيف أجهّز صورة الخريطة"**: شرح تفصيلي لالتقاط لقطات الشاشة بالزر M والقص مع تنبيه الاستخدام الشخصي.

2. **الأماكن والمعالم (بدون إحداثيات مختلقة)**:
   - لا توجد إحداثيات عشوائية. ملف `src/data/pois.json` يحتوي على عينات أولية غير مؤكدة فقط.
   - **محرر الأماكن**: اضغط مطولاً على الخريطة لإضافة معلم جديد (الاسم بالإنجليزية كما في اللعبة، واسم عربي اختياري، ونوعه).
   - استيراد وتصدير الأماكن بصيغة JSON لمشاركة المعالم المؤكدة بين أفراد المجتمع.
   - تسمية الأهداف تلقائياً بأقرب معلم إذا كان ضمن مسافة محددة (مثل 500م)، وإلا استخدام إحداثي الشبكة.

3. **المحرك البالستي واختبار الدقة**:
   - هاون **M252 (81mm)** و **2B14 (82mm)** من ملف `src/data/ballistics.json`.
   - **شريط أحمر دائم**: "⚠️ بيانات تجريبية: لا تعتمد على النتائج" وشارة على كل بطاقة حل طالما أن البيانات تجريبية.
   - **محرر البيانات البالستية**: لإدخال وتصدير واستيراد أرقام الجداول الحقيقية من اللعبة مع خانة إصدار اللعبة.
   - **اختبار الدقة (Accuracy Test)**: صفحة تتيح إدخال مسافة وارتفاع معروفين من تجربة حقيقية في اللعبة ومقارنة الناتج مع الحاسبة لإظهار نسبة الانحراف.
   - حساب السمت وزاوية الارتفاع والاستيفاء الخطي وتصحيح فرق الارتفاع ($dElev$).
   - تصحيح الرمي المرصود من الراصد (Short/Over, Left/Right) مع الفروقات بالمل ($\Delta\text{Az}$, $\Delta\text{El}$).
   - تذكير دائم بإعادة فحص مؤشرات السبطانة بعد كل رمية بسبب الارتداد.

4. **تبويب السيرفرات (Servers Tab)**:
   - بطاقة رئيسية برابط مباشر إلى **ArmaHQ**: `https://www.armahq.com/servers` مع إشعار: *"قائمة السيرفرات الحية من ArmaHQ، موقع مستقل وغير تابع لـ Bohemia Interactive ولا لهذا المشروع"*.
   - بطاقات لسيرفرات اللعبة مع شارات المنصات (PC, Xbox, PS5)، الكروس بلاي، والمودات، وزر نسخ العنوان.
   - فلترة حسب المنصة ونوع المودات والمنطقة والبحث.
   - تنبيه الكونسول: أجهزة PS5 لا تدعم سيرفرات المودات حالياً وأجهزة Xbox تدعم فقط المودات المعتمدة.
   - نموذج لتوليد كود JSON للسيرفرات المجتمعية.
   - قراءة عدد اللاعبين الحي من `public/servers-status.json` مع إظهار "غير محدّث" إذا مر أكثر من 30 دقيقة، مع قالب سير عمل معطل في GitHub Actions.

---

<a name="english"></a>
## English 🇬🇧

**Reforger Mortar Map** is a free, static, browser-based tactical mortar calculator and interactive grid map for **Arma Reforger**. Built with React, Vite, TypeScript, and Leaflet using `CRS.Simple`, it features an Arabic RTL interface by default with an instant English toggle, and zero server dependencies for free GitHub Pages hosting.

### Key Features:

1. **User Map Image & Calibration (IndexedDB)**:
   - **"Upload Map Image"** button for each terrain (Everon 12.8 km, Arland 5.94 km).
   - Images are stored **locally in browser IndexedDB** and never uploaded anywhere.
   - Leaflet `ImageOverlay` with smooth zooming and panning.
   - **2-Point Calibration Tool**: If your image is cropped or covers a sub-sector, enter two reference coordinates to calculate exact scale and offsets.
   - Opacity slider, image deletion, and custom tile template `{z}/{x}/{y}` option.
   - Schematic grid fallback with axis labels and compass when no image is loaded.
   - **"How to prepare the map image"** guide explaining M key screenshots, stitching, and personal-use license scope.

2. **Places & POIs (No Invented Data)**:
   - No made-up locations. Ships with clean/unverified sample markers in `src/data/pois.json`.
   - **Place Editor**: Long press anywhere on the map to add a place (in-game English name, optional Arabic name, type, notes).
   - Export and import POIs as JSON to share verified community maps.
   - Target auto-naming based on nearest POI within configurable radius (e.g. 500m) or military grid reference.

3. **Calculator, Warnings & Accuracy Testing**:
   - Authentic models for **M252 (81mm)** and **2B14 Podnos (82mm)**.
   - **Permanent Red Banner & Badge**: Shows "PLACEHOLDER DATA" while default tables are active.
   - **Ballistics Editor**: Update, export, and import real game tables with game version and last-updated fields.
   - **Accuracy Test Tool**: Enter known in-game trial cases (range, height diff, elevation) to measure engine deviation and verify table accuracy.
   - Fire adjustment tool for spotter corrections with azimuth/elevation deltas.
   - Recoil tube shift warning.

4. **Servers Tab**:
   - Top card linking to `https://www.armahq.com/servers` credited to ArmaHQ (independent site).
   - Server cards with badges for PC, Xbox, PlayStation, Crossplay, and Mods.
   - Console warning regarding PS5 / Xbox mod limitations.
   - Filter by platform, mod status, and region.
   - Community server JSON generator.
   - Optional status reader from `public/servers-status.json` with outdated (>30 min) badge and disabled GitHub Actions workflow template.

---

## Deployment to GitHub Pages

1. Push to GitHub main branch.
2. In repository settings: **Settings > Pages > Build and deployment > Source: GitHub Actions**.
3. Built and deployed via `.github/workflows/deploy.yml`.

## Disclaimer
This project is an unofficial fan-made utility for Arma Reforger. It is not affiliated with, endorsed by, or associated with Bohemia Interactive a.s. Arma Reforger is a trademark of Bohemia Interactive a.s. Live server listings credit to ArmaHQ.

## License
MIT License for the application source code. Game assets and trademarks retain their respective licenses.
