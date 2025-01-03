const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');

// تعيين المجلد الحالي كمجلد ثابت مع تحديد أنواع MIME
app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        if (path.endsWith('.svg')) {
            res.setHeader('Content-Type', 'image/svg+xml');
        }
    }
}));

// تمكين CORS
app.use(cors());

// التعامل مع الطلبات إلى الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// التعامل مع الطلبات إلى صفحة الإدارة
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// تشغيل السيرفر
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
