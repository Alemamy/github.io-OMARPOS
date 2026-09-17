# تشغيل خادم تراخيص OmarPOS سحابيًا

الخادم جاهز للتشغيل كحاوية Docker ويستخدم PostgreSQL حتى تبقى الاشتراكات محفوظة بعد إعادة تشغيل خدمة الاستضافة. لا تضع ملف `.env` أو بيانات الدخول أو قاعدة البيانات داخل GitHub.

## متغيرات البيئة

- `DATABASE_URL=postgresql://...` رابط PostgreSQL مع SSL.
- `DATABASE_SSL=true`
- `ADMIN_USERNAME=اسم_مدير_تختاره`
- `ADMIN_PASSWORD_HASH=هاش_bcrypt_لكلمة_مرور_مدير`
- `CORS_ORIGIN=*` للاختبار؛ يفضّل تقييده لاحقًا.
- `PORT` تتركه منصة الاستضافة إن كانت تضبطه تلقائيًا.

بعد التشغيل افتح:

`/health` لفحص الخادم.

`/admin` للوصول إلى لوحة إدارة الاشتراكات.

## نقاط API

- `POST /api/auth/login` لتسجيل دخول أجهزة OmarPOS.
- `GET /api/admin/subscriptions` لعرض الاشتراكات.
- `POST /api/admin/subscriptions` لإنشاء اشتراك.
- `PATCH /api/admin/subscriptions/:id` للتعديل أو التمديد أو تغيير الحالة/كلمة المرور.
- `DELETE /api/admin/subscriptions/:id` للحذف.

## النشر

يوجد ملف `render.yaml` كنقطة بداية لخدمة Docker. يمكن أيضًا نشر مجلد `license-server` على أي منصة تدعم Docker.

أنشئ قاعدة PostgreSQL سحابية، ثم ضع `DATABASE_URL` في Environment Variables لدى منصة الاستضافة. لا تضع كلمة المرور أو رابط قاعدة البيانات داخل ملفات المشروع.

يجب استخدام HTTPS في الإنتاج. كلمات مرور العملاء تحفظ كـ bcrypt hashes فقط.
