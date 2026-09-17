# تشغيل خادم تراخيص OmarPOS

الخادم يحتاج إلى استضافة Node.js عامة مع HTTPS. لا تضع ملف `.env` أو قاعدة `data/licenses.db` في GitHub.

## متغيرات البيئة

- `PORT=8787`
- `ADMIN_USERNAME=اسم_مدير_تختاره`
- `ADMIN_PASSWORD_HASH=هاش_bcrypt_لكلمة_مرور_مدير`
- `DB_FILE=./data/licenses.db`

بعد التشغيل افتح:

`/admin`

لتسجيل الدخول إلى لوحة إدارة الاشتراكات.

## نقاط API

- `POST /api/auth/login` لتسجيل دخول أجهزة OmarPOS.
- `GET /api/admin/subscriptions` لعرض الاشتراكات.
- `POST /api/admin/subscriptions` لإنشاء اشتراك.
- `PATCH /api/admin/subscriptions/:id` للتعديل أو التمديد أو تغيير الحالة/كلمة المرور.
- `DELETE /api/admin/subscriptions/:id` للحذف.
- `GET /health` لفحص الخادم.

يجب تشغيل الخادم خلف HTTPS في الإنتاج. كلمات مرور العملاء تحفظ كـ bcrypt hashes فقط.
