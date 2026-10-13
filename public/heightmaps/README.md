# Heightmap Guide / دليل خرائط الارتفاع

## English
The application looks for heightmap images in:
- `/public/heightmaps/everon.png`
- `/public/heightmaps/arland.png`

### Format:
- Grayscale PNG (8-bit or 16-bit).
- Value 0 = Sea Level (0m ASL).
- Value 255 = Maximum terrain height (approx 350m for Everon, 150m for Arland).
- Top of image corresponds to North (max Y), bottom corresponds to South (Y=0).
- If the image is not present, the app automatically switches to the built-in mathematical topographical elevation model and allows manual altitude input.

---

## العربية
يبحث التطبيق عن صور خرائط الارتفاع الرقمية في المسار:
- `/public/heightmaps/everon.png`
- `/public/heightmaps/arland.png`

### الصيغة:
- صورة PNG بتدرج رمادي (Grayscale 8-bit أو 16-bit).
- القيمة 0 تمثل مستوى سطح البحر (0 متر).
- القيمة 255 تمثل أقصى ارتفاع (حوالي 350م لإيفرون، 150م لأرلاند).
- أعلى الصورة يمثل الشمال (أقصى Y) وأسفلها يمثل الجنوب (Y=0).
- في حال عدم وجود الصورة، يقوم التطبيق تلقائياً باستخدام نموذج تضاريسي رياضي مدمج مع إمكانية تعديل الارتفاع يدوياً بكل سهولة.
