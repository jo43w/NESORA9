# NESORA Air Conditioning

## تشغيل الموقع

لا تفتح `index.html` مباشرة من File Explorer، لأن المشروع يعمل بواسطة React وVite ويحتاج خادمًا محليًا.

شغّل:

```bash
npm install
npm run dev
```

ثم افتح: http://localhost:5173

أو اضغط مرتين على `run-site.bat` لتشغيل الخادم وفتح الموقع تلقائيًا.

## النشر

ارفع محتويات مجلد `dist` بعد تشغيل `npm run build`، وليس مجلد المشروع الخام. إعدادات `vercel.json` و`public/_redirects` مضافة لمنع الشاشة البيضاء عند فتح الروابط مباشرة.
