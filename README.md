# QUIZVERSE — The Ultimate Quiz Experience

منصة اختبارات وتحديات تفاعلية بتصميم مستقبلي وتجربة سؤال واحد في كل مرة، مع لوحة تحكم سرية للإدارة (الأقسام، تعدد الاختبارات، مستويات الصعوبة، استيراد/تصدير JSON، وتقارير المشاركين).

## الجاهزية للنشر على GitHub و Vercel

المشروع مهيّأ بالكامل للعمل مباشرة على **Vercel** مع أي قاعدة بيانات **PostgreSQL** (مثل Neon أو Supabase أو Vercel Postgres أو Prisma Postgres)، وتقوم المنصة تلقائياً بإنشاء الجداول وتعبئة بيانات **CHAPTER 7** (3 اختبارات بإجمالي 60 سؤالاً) عند أول تشغيل.

### 1. قاعدة البيانات (PostgreSQL)
عند ربط المشروع بـ Vercel، أنشئ قاعدة بيانات PostgreSQL (مثلاً من **Vercel Storage -> Neon** أو **Supabase**) وأضف متغير البيئة التالي في إعدادات Vercel:
- `DATABASE_URL`: رابط اتصال PostgreSQL الكامل.

*(اختياري محلياً)* لمزامنة المخطط يدوياً عبر Drizzle:
```bash
npm run db:push
```

### 2. متغيرات البيئة في Vercel (Environment Variables)
أضف المتغيرات التالية في **Vercel -> Project Settings -> Environment Variables**:
- `DATABASE_URL`: رابط قاعدة بيانات PostgreSQL.
- `SESSION_SECRET`: نص عشوائي طويل (32+ حرفاً) لتوقيع جلسات لوحة الإدارة بثبات عبر Serverless Functions.
- `ADMIN_PASSCODE`: كلمة مرور الإدارة (إن تركته فارغاً سيتم تعيينها من واجهة الدخول في أول مرة).
- `ADMIN_EMAIL`: البريد الإلكتروني لحساب Google المصرّح له بالإدارة.

### 3. تفعيل تسجيل دخول الإدارة على نطاق Vercel
بعد نشر الموقع والحصول على رابط `https://your-app.vercel.app`:
1. افتح **Firebase Console** -> مشروعك -> **Authentication** -> **Settings** -> **Authorized domains**.
2. أضف نطاق Vercel الخاص بك (مثل `your-app.vercel.app`).

### 4. فحص الجاهزية بعد النشر
زر الرابط التالي للتأكد من اتصال الخادم وقاعدة البيانات:
`https://your-app.vercel.app/api/health`
