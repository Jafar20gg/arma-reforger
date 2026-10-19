# نظام التحكم في نيران الهاون – Arma Reforger | Fire Control System (FCS)

[العربية](#العربية) | [English](#english)

---

<a name="العربية"></a>
## العربية 🇸🇦

تطبيق ويب تكتيكي احترافي مجاني وخفيف يعمل بالكامل داخل المتصفح (Static Web App) بدون خوادم، مخصص لحساب إحداثيات الهاون والرمي الدقيق للعبة **Arma Reforger**. تم تصميمه بواجهة عربية كاملة بنظام RTL مع إمكانية التبديل إلى الإنجليزية بضغطة زر، ومتوافق تماماً مع النشر التلقائي عبر GitHub Actions على **GitHub Pages**.

### المميزات الرئيسية:
1. **الخرائط التكتيكية التفاعلية:**
   - دعم خرائط مسارح العمليات الأصلية للعبة: **Everon (إيفرون)**، **Arland (آرلاند)**، و **Kolguyev (كولغويف)** بإحداثيات مطابقة تماماً لمحرك Enfusion (1:1).
   - شبكة إحداثيات عسكرية (Military Grid) بدقة 6 و 8 أرقام، مقياس رسم تفاعلي، وبوصلة تكتيكية موجهة للشمال الحقيقي.
   - معالم استراتيجية موثقة وقابلة للتعديل والتعيين الفوري كمواقع للهاون أو أهداف.
   - مسطرة قياس المسافات والزوايا (Tactical Ruler) لحساب المسافة الأفقية والمائلة (3D Slant Range).

2. **حاسبة المقذوفات وحلول الرماية (Ballistic Solutions):**
   - دعم كامل لمنظومة **M252 81mm (NATO 6400 MIL)** ومنظومة **2B14 Podnos 82mm (Warsaw Pact 6000 MIL)**.
   - حساب زوايا الارتفاع (Elevation) بالدرجات والميل، وتحديد عدد الحلقات الدافعة المطلوبة (Charge Rings).
   - حساب زمن الطيران (TOF)، ذروة الارتفاع (Apex)، زاوية السقوط، وتصحيح فرق الارتفاع (ΔH).
   - حاسبة تصحيح الرياح العرضية والطولية (Crosswind & Headwind).

3. **استرداد وحفظ البيانات (Backup & Restore):**
   - إمكانية تصدير واستيراد النسخ الاحتياطية بصيغة **JSON** لحفظ أو استرجاع الأهداف المحفوظة (TRPs)، إحداثيات المعالم المخصصة، وإعدادات الواجهة.
   - حفظ تلقائي مستمر في التخزين المحلي للمتصفح (LocalStorage).

4. **تخصيص الواجهة (UI Customizer):**
   - محرر تخطيط تفاعلي لتغيير أماكن وأحجام لوحات التحكم على الشاشة وسحبها وتخصيصها.
   - واجهة ثنائية اللغة تدعم **العربية (RTL)** والإنجليزية (LTR) بتبديل فوري وسلس.

---

<a name="english"></a>
## English 🇬🇧

**Arma Reforger Fire Control System (FCS)** is a tactical ballistic fire control system and interactive grid map for **Arma Reforger**. Built with React 19, Vite, TypeScript, and Leaflet using authentic Enfusion engine coordinates, featuring dual Arabic (RTL) and English (LTR) language support.

### Key Features:
1. **Interactive Tactical Maps:**
   - Authentic island theaters: **Everon (Eden)**, **Arland**, and **Kolguyev (Cain)** with high-detail Enfusion terrain tiles.
   - 1:1 metric coordinate alignment, 6 and 8-digit military grid systems, responsive scale bar, and compass rose.
   - Verified strategic points of interest (Bases, Settlements, Vehicle spawns, Observation peaks).
   - Rangefinder ruler tool computing both 2D horizontal distance and 3D slant range.

2. **Ballistics & Firing Solutions:**
   - Full support for **M252 81mm (NATO 6400 MIL)** and **2B14 Podnos 82mm (Warsaw Pact 6000 MIL)**.
   - Real-time tube elevation calculation displayed in both degrees and mils, with exact propellant ring counts.
   - Time of flight (TOF), max ordinate (apex), angle of fall, and elevation delta (ΔH) corrections.
   - Tactical wind deflection compensation (crosswind and headwind/tailwind).

3. **Data Backup & Target Management:**
   - Target Reference Points (TRPs) manager to save, organize, and engage priority firing positions.
   - Full JSON export and import for user targets, landmark overrides, and customized layout profiles.

4. **Interactive UI Customizer:**
   - Drag-and-drop HUD widget layout editor with scaling from 70% to 135%.

---

## Deployment to GitHub Pages

1. Push your code to the `main` branch:
   ```bash
   git push origin main
   ```
2. In your repository on GitHub:
   - Navigate to **Settings > Pages**
   - Under **Build and deployment > Source**, select **GitHub Actions**
3. The included workflow (`.github/workflows/main.yml`) will automatically build and deploy the app to GitHub Pages!
