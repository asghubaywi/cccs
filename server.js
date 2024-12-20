const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// إعداد Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://xguxveuvqnejmdwryhjc.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndXh2ZXV2cW5lam1kd3J5aGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MzQ2MTQsImV4cCI6MjA1MDAxMDYxNH0.RIbDi05WTn77ROJBoOgmtAR2G06_5tnhYF0adJ1MU5Q';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// الحصول على قائمة المختبرات
app.get('/labs', async (req, res) => {
    try {
        const { data: labs, error } = await supabase
            .rpc('get_labs');

        if (error) throw error;

        res.json({ success: true, data: labs });
    } catch (error) {
        console.error('Error fetching labs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// البحث عن العملاء
app.post('/search', async (req, res) => {
    const { clientName } = req.body;
    console.log('Searching for client:', clientName);

    try {
        const { data: clients, error } = await supabase
            .rpc('search_clients', { search_query: clientName || '' });

        if (error) throw error;

        res.json({ success: true, data: clients });
    } catch (error) {
        console.error('Error searching clients:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// إضافة عميل جديد
app.post('/clients', async (req, res) => {
    const { name, lab_id, amount, status } = req.body;

    try {
        const { data: client, error } = await supabase
            .from('clients')
            .insert([
                { name, lab_id, amount, status }
            ])
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data: client });
    } catch (error) {
        console.error('Error adding client:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// تحديث حالة العميل
app.put('/clients/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const { data: client, error } = await supabase
            .rpc('update_client_status', { 
                client_id: parseInt(id), 
                new_status: status 
            });

        if (error) throw error;

        res.json({ success: true, data: client });
    } catch (error) {
        console.error('Error updating client status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// مسار تحديث حالة الدفعة
app.post('/mark-as-paid/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('payments')
            .update({ 
                status: 'تم التحصيل',
                paid_date: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking payment as paid:', error);
        res.status(500).json({ error: error.message });
    }
});

// الحصول على إحصائيات العملاء
app.get('/statistics', async (req, res) => {
    try {
        const { data: stats, error } = await supabase
            .rpc('get_client_statistics');

        if (error) throw error;

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
