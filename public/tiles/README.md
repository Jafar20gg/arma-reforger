# دليل بلاطات الخرائط التلقائية | Automatic Map Tiles Guide

---

## العربية (Arabic)

يدعم تطبيق **Reforger Mortar Map** الكشف والتحميل التلقائي لبلاطات الخرائط المخزنة محلياً في مجلد الموقع دون الحاجة لأي رفع يدوي أو اتصال بمواقع خارجية.

### 1. آلية العمل
عند فتح أي خريطة (Everon أو Arland أو Kolguyev)، يتحقق التطبيق من وجود ملف البيانات الوصفية:
`./tiles/{terrain}/meta.json`

إذا وُجد الملف، يتم تحميل طبقة البلاطات تلقائياً عبر Leaflet من المسار:
`./tiles/{terrain}/{z}/{x}/{y}.{format}`
مع تطبيق الأبعاد ودقة البلاطة وترتيب المحاور وحقوق النسبة تلقائياً على واجهة الخريطة.

إذا لم تكن البلاطات موجودة، ينتقل التطبيق تلقائياً وبسلاسة إلى صورة الخريطة المحلية المرفوعة (إن وجدت) أو الشبكة التكتيكية الرياضية عالية الدقة المدمجة.

---

### 2. هيكل المجلدات المطلوب

```text
public/tiles/
├── README.md
├── everon/
│   ├── meta.json
│   ├── 0/0/0.webp
│   └── 1/...
├── arland/
│   ├── meta.json
│   └── ...
└── kolguyev/
    ├── meta.json
    └── ...
```

---

### 3. بنية ملف `meta.json`

يجب أن يحتوي كل مجلد تضاريس على ملف `meta.json`. مثال:

```json
{
  "terrain": "everon",
  "sizeMeters": 12800,
  "tileSize": 256,
  "minZoom": 0,
  "maxZoom": 6,
  "format": "webp",
  "yOrder": "xyz",
  "attribution": "Map tiles generated with EnfusionMapMaker (APL-SA)"
}
```

#### الحقول المدعومة:
- `terrain`: معرف التضاريس (`everon` أو `arland` أو `kolguyev`).
- `sizeMeters`: طول ضلع الخريطة بالمتر (إيفرون 12800، أرلاند 4000، كولغوييف 12800).
- `tileSize`: مقاس البلاطة بالبكسل (عادة 256).
- `minZoom`: أدنى مستوى تكبير (عادة 0).
- `maxZoom`: أقصى مستوى تكبير (عادة من 4 إلى 6).
- `format`: صيغة البلاطات (`webp` أو `png` أو `jpg`). يُنصح بـ `webp` لتوفير الحجم وسرعة التحميل.
- `yOrder`: ترتيب محور Y (إما `"xyz"` القياسي أو `"tms"` المعكوس).
- `attribution`: نص النسبة والحقوق المعروض على الخريطة.

---

### 4. كيفية توليد البلاطات باستخدام EnfusionMapMaker
1. ثبّت أداة **EnfusionMapMaker** على جهاز الكمبيوتر الخاص بك.
2. صدّر تضاريس الخريطة المطلوبة من Arma Reforger Workbench.
3. شغّل الأداة لتوليد مجلد البلاطات بمستويات التكبير المناسبة (مثلاً 0 إلى 5 أو 6).

---

### 5. ضغط البلاطات إلى صيغة WebP
لتقليل حجم المستودع وملاءمة استضافة GitHub Pages (الحد الأقصى الموصى به للمستودع ~1 غيغابايت)، يُنصح بتحويل البلاطات الناتجة من PNG إلى WebP:

#### باستخدام أداة `cwebp` في سطر الأوامر (Bash / Linux / macOS):
```bash
find public/tiles/everon -type f -name "*.png" | while read file; do
  cwebp -q 80 "$file" -o "${file%.png}.webp" && rm "$file"
done
```

#### باستخدام PowerShell (Windows):
```powershell
Get-ChildItem -Path "public\tiles\everon" -Filter "*.png" -Recurse | ForEach-Object {
    $out = $_.FullName -replace '\.png$', '.webp'
    & cwebp -q 80 $_.FullName -o $out
    Remove-Item $_.FullName
}
```

---

### 6. الحقوق والترخيص | Credits & License
- **EnfusionMapMaker**: من تطوير Nick Ludlam ومجتمع Arma Reforger.
- **الترخيص**: مرخصة بموجب ترخيص Bohemia Interactive (APL-SA - Arma Public License Share Alike).
- **ملاحظة الخصوصية**: هذا التطبيق لا يتصل بأي خوادم خارجية ولا يسحب بلاطات من مواقع طرف ثالث (No hotlinking). جميع الملفات تُحمّل من خادمك المحلي الخاص.

---

## English

### Automatic Map Tiles Loading
**Reforger Mortar Map** automatically looks for local tiles at `./tiles/{terrain}/meta.json`.

If present, it mounts an automated Leaflet tile layer in CRS.Simple from:
`./tiles/{terrain}/{z}/{x}/{y}.{format}`
configured with the parameters in `meta.json`.

If tiles are absent, it cleanly falls back to any user-uploaded image overlay or the procedural vector tactical grid.

### Example `meta.json`:
```json
{
  "terrain": "everon",
  "sizeMeters": 12800,
  "tileSize": 256,
  "minZoom": 0,
  "maxZoom": 6,
  "format": "webp",
  "yOrder": "xyz",
  "attribution": "Map tiles generated with EnfusionMapMaker (APL-SA)"
}
```

### Credits & Attribution:
- Tool: EnfusionMapMaker by Nick Ludlam.
- License: Bohemia Interactive Arma Public License Share Alike (APL-SA).
