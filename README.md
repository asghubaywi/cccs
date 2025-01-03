# نظام إدارة المدفوعات المخبرية

## نظرة عامة
نظام متكامل لإدارة المدفوعات المخبرية يتيح للعملاء تسجيل طلباتهم ومتابعة حالتها، مع لوحة تحكم للإدارة تمكن من متابعة وإدارة جميع الطلبات والمختبرات.

## المميزات الرئيسية

### 1. واجهة العملاء
- تسجيل طلبات جديدة
- متابعة حالة الطلبات
- عرض تفاصيل المختبرات المتاحة
- واجهة سهلة الاستخدام باللغة العربية
- تصميم متجاوب يعمل على جميع الأجهزة

### 2. لوحة التحكم الإدارية
- إدارة المختبرات (إضافة، تعديل، حذف)
- إدارة العملاء وطلباتهم
- متابعة حالة الطلبات وتحديثها
- عرض إحصائيات وتقارير
- نظام نسخ احتياطي متكامل
- سجل العمليات لتتبع جميع الإجراءات

## التقنيات المستخدمة

### الواجهة الأمامية (Frontend)
- **HTML5** و **CSS3** للهيكلة والتصميم
- **Bootstrap 5** لتصميم متجاوب
- **JavaScript** للتفاعلات وإدارة الحالة
- **Bootstrap Icons** للأيقونات
- **Font Awesome** لبعض الأيقونات الإضافية

### الخدمات الخلفية (Backend)
- **Supabase** لقاعدة البيانات وإدارة المستخدمين
- خدمات المصادقة المدمجة
- تخزين البيانات في قواعد بيانات PostgreSQL

## هيكل المشروع

### الملفات الرئيسية
```
/
├── index.html          # الصفحة الرئيسية
├── admin.html          # لوحة التحكم
├── css/
│   └── styles.css      # أنماط التصميم
├── js/
│   ├── main.js         # الوظائف الرئيسية
│   ├── admin.js        # وظائف لوحة التحكم
│   └── animations.js   # التأثيرات الحركية
└── backup/            # مجلد النسخ الاحتياطية
```

### قاعدة البيانات
#### جدول المختبرات (labs)
- id: معرف المختبر
- name: اسم المختبر
- description: وصف المختبر
- created_at: تاريخ الإنشاء

#### جدول العملاء (clients)
- id: معرف العميل
- name: اسم العميل
- lab_id: معرف المختبر المرتبط
- status: حالة الطلب (pending/completed)
- created_at: تاريخ الإنشاء

#### جدول سجل العمليات (audit_log)
- id: معرف العملية
- action: نوع العملية
- details: تفاصيل العملية
- user_id: معرف المستخدم
- created_at: تاريخ العملية

## الوظائف الرئيسية

### 1. إدارة المختبرات
- إضافة مختبرات جديدة
- تعديل بيانات المختبرات
- حذف المختبرات
- عرض قائمة المختبرات

### 2. إدارة العملاء
- عرض قائمة العملاء
- تحديث حالة الطلبات
- البحث وتصفية العملاء
- عرض تفاصيل العميل

### 3. النسخ الاحتياطي
- نسخ احتياطي يدوي للبيانات
- نسخ احتياطي تلقائي كل 24 ساعة
- استعادة النسخ الاحتياطية
- سجل النسخ الاحتياطية

### 4. سجل العمليات
- تسجيل جميع العمليات
- عرض سجل العمليات
- تصفية وبحث في السجل
- تصدير السجل

## الأمان

### المصادقة
- تسجيل دخول آمن
- إدارة الجلسات
- حماية نقاط النهاية
- تشفير البيانات

### الصلاحيات
- مستويات وصول مختلفة
- التحقق من الصلاحيات
- تقييد الوصول للبيانات

## التثبيت والإعداد

### المتطلبات
1. متصفح حديث يدعم JavaScript
2. اتصال بالإنترنت
3. حساب Supabase

### خطوات التثبيت
1. استنساخ المستودع
2. تكوين متغيرات البيئة
3. إعداد قاعدة البيانات
4. تشغيل التطبيق

### متغيرات البيئة
```env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

## الصيانة

### النسخ الاحتياطي
- جدولة نسخ احتياطي منتظم
- التحقق من سلامة النسخ
- تنظيف النسخ القديمة

### المراقبة
- مراقبة الأداء
- تتبع الأخطاء
- تحليل الاستخدام

## حل المشكلات الشائعة

### مشاكل المصادقة
- التحقق من صحة بيانات الاعتماد
- تجديد الجلسة
- إعادة تعيين كلمة المرور

### مشاكل البيانات
- التحقق من الاتصال بقاعدة البيانات
- استعادة البيانات المفقودة
- إصلاح تناسق البيانات

## التحديثات المستقبلية المخطط لها
1. إضافة لوحة تحكم للتقارير
2. دعم الإشعارات
3. تحسين واجهة المستخدم
4. إضافة المزيد من التخصيص
5. دعم تصدير البيانات بتنسيقات مختلفة

## المساهمة
نرحب بالمساهمات! يرجى اتباع الخطوات التالية:
1. انشئ fork للمشروع
2. أنشئ فرع للميزة الجديدة
3. قم بعمل التغييرات
4. أرسل pull request

## الترخيص
هذا المشروع مرخص تحت [اسم الترخيص]. انظر ملف LICENSE للمزيد من التفاصيل.

## الاتصال والدعم
- البريد الإلكتروني: support@example.com
- الموقع: https://example.com
- تويتر: @example
