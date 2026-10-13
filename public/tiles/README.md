# Map Tiles Guide / دليل بلاطات الخرائط

## English
This application loads map tiles from:
`/public/tiles/{terrain}/{z}/{x}/{y}.png`
Where `{terrain}` is either `everon` or `arland`.

### How to extract and add authentic game tiles:
1. **Using Arma Reforger Workbench**:
   - Open World Editor in Arma Reforger Tools.
   - Open the Everon (`Everon.world`) or Arland (`Arland.world`) map.
   - Use the Topographic Map Exporter / Satellite Tile Export utility to generate standard 256x256 Slippy Map / TMS tiles.
2. **Directory Structure**:
   Place tiles in the following structure:
   ```
   public/tiles/
   ├── everon/
   │   ├── 0/0/0.png
   │   ├── 1/0/0.png
   │   └── ...
   └── arland/
       ├── 0/0/0.png
       └── ...
   ```
3. **No Copyrighted Game Assets Bundled**:
   In compliance with Bohemia Interactive guidelines, proprietary game textures are not pre-packaged. The application uses a built-in high-precision vector grid canvas and procedural coordinates overlay by default.

---

## العربية
يقوم هذا التطبيق بتحميل بلاطات الخرائط من المسار:
`/public/tiles/{terrain}/{z}/{x}/{y}.png`
حيث يكون `{terrain}` إما `everon` أو `arland`.

### كيفية استخراج وإضافة بلاطات اللعبة الحقيقية:
1. **باستخدام Arma Reforger Workbench**:
   - افتح World Editor من خلال أدوات Arma Reforger Tools.
   - افتح خريطة Everon أو Arland.
   - استخدم أداة تصدير الخريطة الطبوغرافية أو بلاطات القمر الصناعي بدقة 256×256.
2. **هيكلية المجلدات**:
   ضع البلاطات داخل المجلد بالشكل التالي:
   `public/tiles/everon/{z}/{x}/{y}.png`
   `public/tiles/arland/{z}/{x}/{y}.png`
3. **حماية حقوق النشر**:
   التطبيق لا يدمج صور اللعبة المحمية افتراضياً، ويعتمد على شبكة إحداثيات هندسية عالية الدقة مدمجة جاهزة للعمل فوراً.
