# نظام إدارة المدفوعات

نظام لإدارة مدفوعات العملاء في المختبرات، مبني باستخدام HTML و JavaScript مع Supabase كقاعدة بيانات.

## المميزات

- تسجيل دخول المسؤولين
- إدارة العملاء والمدفوعات
- البحث عن العملاء
- عرض الإحصائيات
- تتبع حالة المدفوعات

## التكنولوجيا المستخدمة

- Frontend: HTML, JavaScript, Bootstrap 5
- Backend: Supabase
- Database: PostgreSQL (Supabase)

## معلومات Supabase

- URL: `https://xguxveuvqnejmdwryhjc.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndXh2ZXV2cW5lam1kd3J5aGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MzQ2MTQsImV4cCI6MjA1MDAxMDYxNH0.RIbDi05WTn77ROJBoOgmtAR2G06_5tnhYF0adJ1MU5Q`

## هيكل قاعدة البيانات

### جدول العملاء (clients)
```sql
create table clients (
  id bigint primary key generated always as identity,
  name text not null,
  lab_id bigint references labs(id),
  amount integer not null,
  status text not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### جدول المختبرات (labs)
```sql
create table labs (
  id bigint primary key generated always as identity,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

## الصفحات

### الصفحة الرئيسية (index.html)
- عرض الإحصائيات
- البحث عن العملاء
- عرض قائمة العملاء
- تحديث حالة المدفوعات

### صفحة الإدارة (admin.html)
- تسجيل دخول المسؤولين
- إضافة عملاء جدد
- إدارة المختبرات

## كيفية الاستخدام

1. تشغيل الخادم المحلي:
```bash
npx serve
```

2. فتح الصفحة الرئيسية:
```
http://localhost:3000
```

3. فتح صفحة الإدارة:
```
http://localhost:3000/admin.html
```

## الأمان

- تم تفعيل Row Level Security (RLS) في Supabase
- يتطلب تسجيل الدخول لإضافة أو تعديل العملاء
- يمكن للجميع عرض العملاء والبحث

## الوظائف الرئيسية

### البحث
```javascript
async function searchClients() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const { data: clients, error } = await supabaseClient
        .from('clients')
        .select(`
            *,
            labs (
                name
            )
        `)
        .or(`name.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false });
}
```

### إضافة عميل
```javascript
async function addClient(event) {
    const formData = {
        name: document.getElementById('clientName').value,
        lab_id: parseInt(document.getElementById('labSelect').value),
        amount: parseInt(document.getElementById('amount').value),
        status: document.getElementById('status').value
    };
    
    const { data, error } = await supabaseClient
        .from('clients')
        .insert([formData]);
}
```

### تحديث حالة العميل
```javascript
async function updateStatus(clientId, newStatus) {
    const { data, error } = await supabaseClient
        .from('clients')
        .update({ status: newStatus })
        .eq('id', clientId);
}
```

## التخصيص

يمكن تخصيص النظام من خلال:
1. تعديل الألوان والتصميم في CSS
2. إضافة حقول جديدة في قاعدة البيانات
3. تعديل وظائف البحث والفلترة
4. إضافة تقارير وإحصائيات جديدة

## الدعم

لأي استفسارات أو مشاكل، يرجى:
1. التأكد من تشغيل الخادم المحلي
2. التحقق من اتصال الإنترنت
3. التأكد من صحة بيانات Supabase
4. مراجعة سجلات الأخطاء في وحدة تحكم المتصفح
