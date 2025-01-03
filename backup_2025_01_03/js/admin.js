// Initialize Supabase Client
const supabase = window.supabase.createClient(
    'https://xguxveuvqnejmdwryhjc.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndXh2ZXV2cW5lam1kd3J5aGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MzQ2MTQsImV4cCI6MjA1MDAxMDYxNH0.RIbDi05WTn77ROJBoOgmtAR2G06_5tnhYF0adJ1MU5Q'
);

// تبديل الوضع
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

// تحديث أيقونة الوضع
function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
    }
}

// تهيئة الوضع
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

// تعيين الوضع
function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    updateThemeIcon(theme);
}

// تحديث الإحصائيات
async function updateStats() {
    const { data: labs } = await supabase
        .from('labs')
        .select('*');
    
    const { data: clients } = await supabase
        .from('clients')
        .select('amount, status');

    if (labs && clients) {
        const totalLabs = labs.length;
        const totalClients = clients.length;
        const pendingPayments = clients.filter(c => c.status === 'pending').length;
        const totalAmount = clients.reduce((sum, client) => sum + (parseFloat(client.amount) || 0), 0);

        document.getElementById('totalLabs').textContent = totalLabs.toLocaleString('ar-SA');
        document.getElementById('totalAdminClients').textContent = totalClients.toLocaleString('ar-SA');
        document.getElementById('pendingAdminPayments').textContent = pendingPayments.toLocaleString('ar-SA');
        document.getElementById('totalAdminAmount').textContent = totalAmount.toLocaleString('ar-SA') + ' ريال';
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    checkAuth();
});

// التحقق من المصادقة
async function checkAuth() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (user) {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('adminContent').style.display = 'block';
            document.getElementById('logoutBtn').style.display = 'block';
            
            // تحميل البيانات فقط بعد تأكيد تسجيل الدخول
            await loadLabs();
            await loadAdminClients();
            await loadAuditLog();
            await updateStats();
        } else {
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('adminContent').style.display = 'none';
            document.getElementById('logoutBtn').style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        showToast('error', 'حدث خطأ أثناء التحقق من المصادقة');
    }
}

// تسجيل الدخول
async function login(event) {
    event.preventDefault();
    
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        await checkAuth();
        showToast('success', 'تم تسجيل الدخول بنجاح');
    } catch (error) {
        console.error('Error logging in:', error);
        showToast('error', 'خطأ في تسجيل الدخول: ' + error.message);
    }
}

// تسجيل الخروج
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        await checkAuth();
        showToast('success', 'تم تسجيل الخروج بنجاح');
    } catch (error) {
        console.error('Error logging out:', error);
        showToast('error', 'خطأ في تسجيل الخروج: ' + error.message);
    }
}

// Load labs
async function loadLabs() {
    const { data: labs, error } = await supabase
        .from('labs')
        .select(`
            *,
            clients:clients(id)
        `);

    if (error) {
        console.error('Error loading labs:', error);
        return;
    }

    // Update labs table
    const tableBody = document.getElementById('labsTable');
    tableBody.innerHTML = '';

    labs.forEach(lab => {
        const clientCount = lab.clients ? lab.clients.length : 0;
        const row = document.createElement('tr');
        row.setAttribute('data-lab-id', lab.id); // إضافة معرف المختبر للصف
        row.innerHTML = `
            <td>${lab.name}</td>
            <td>${new Date(lab.created_at).toLocaleDateString('ar-SA')}</td>
            <td>
                <span class="badge bg-info">
                    ${clientCount}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editLab(${lab.id}, '${lab.name}')" title="تعديل">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteLab(${lab.id}, '${lab.name}')" title="حذف">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Update lab select in client form
    const labSelect = document.getElementById('labSelect');
    labSelect.innerHTML = '<option value="">اختر المختبر</option>';
    
    labs.forEach(lab => {
        const option = document.createElement('option');
        option.value = lab.id;
        option.textContent = lab.name;
        labSelect.appendChild(option);
    });

    updateStats();
}

// Add new lab
async function addLab(event) {
    event.preventDefault();
    
    const name = document.getElementById('labName').value;

    const { data, error } = await supabase
        .from('labs')
        .insert([{ name }]);

    if (error) {
        alert('خطأ في إضافة المختبر: ' + error.message);
        return;
    }

    document.getElementById('labName').value = '';
    await logAction('add_lab', `تم إضافة مختبر: ${name}`);
    loadLabs();
}

// Edit lab
async function editLab(labId, currentName) {
    const newName = prompt('أدخل الاسم الجديد للمختبر:', currentName);
    
    if (newName && newName !== currentName) {
        const { error } = await supabase
            .from('labs')
            .update({ name: newName })
            .eq('id', labId);

        if (error) {
            alert('خطأ في تعديل المختبر: ' + error.message);
            return;
        }

        await logAction('edit_lab', `تم تعديل اسم المختبر من "${currentName}" إلى "${newName}"`);
        loadLabs();
    }
}

// Delete lab
async function deleteLab(labId, labName) {
    // عرض رسالة تأكيد
    if (!confirm(`هل أنت متأكد من حذف المختبر "${labName}"؟`)) {
        return;
    }

    try {
        // التحقق من وجود عملاء مرتبطين
        const { data: clients } = await supabase
            .from('clients')
            .select('id')
            .eq('lab_id', labId);

        if (clients && clients.length > 0) {
            alert('لا يمكن حذف المختبر لوجود عملاء مرتبطين به');
            return;
        }

        // حذف المختبر
        const { error } = await supabase
            .from('labs')
            .delete()
            .eq('id', labId);

        if (error) throw error;

        // حذف المختبر من العرض مباشرة
        const row = document.querySelector(`#labsTable tr[data-lab-id="${labId}"]`);
        if (row) {
            row.remove();
        }

        // حذف المختبر من قائمة المختبرات في نموذج العملاء
        const labOption = document.querySelector(`#labSelect option[value="${labId}"]`);
        if (labOption) {
            labOption.remove();
        }

        // تحديث الإحصائيات
        updateStats();
        
        showToast('success', 'تم حذف المختبر بنجاح');
    } catch (error) {
        console.error('Error deleting lab:', error);
        showToast('error', 'حدث خطأ أثناء حذف المختبر');
    }
}

// Load admin clients
async function loadAdminClients() {
    try {
        const { data: clients, error } = await supabase
            .from('clients')
            .select(`
                *,
                lab:lab_id (
                    name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tableBody = document.getElementById('adminClientsTable');
        tableBody.innerHTML = '';

        if (!clients || clients.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="6" class="text-center py-4">
                    <div class="text-muted">
                        <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                        لا يوجد عملاء حالياً
                    </div>
                </td>
            `;
            tableBody.appendChild(emptyRow);
            return;
        }

        clients.forEach(client => {
            const statusBadge = getStatusBadge(client.status, client.id);
            const row = document.createElement('tr');
            row.setAttribute('data-client-id', client.id);
            row.innerHTML = `
                <td>${client.name}</td>
                <td>
                    <span class="badge bg-info">
                        ${client.lab?.name || 'غير محدد'}
                    </span>
                </td>
                <td>
                    <span class="badge bg-secondary">
                        ${client.amount} ريال
                    </span>
                </td>
                <td>${statusBadge}</td>
                <td>${new Date(client.created_at).toLocaleDateString('ar-SA')}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="editClient(${client.id})" title="تعديل">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteClient(${client.id}, '${client.name}')" title="حذف">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // تحديث الإحصائيات
        updateStats();
    } catch (error) {
        console.error('Error loading clients:', error);
        showToast('error', 'حدث خطأ أثناء تحميل العملاء');
    }
}

// Add new client
async function addClient(event) {
    event.preventDefault();
    
    const name = document.getElementById('clientName').value;
    const labId = document.getElementById('labSelect').value;
    const amount = document.getElementById('amount').value;
    const status = document.getElementById('status').value;

    const { data, error } = await supabase
        .from('clients')
        .insert([{
            name,
            lab_id: labId,
            amount,
            status
        }]);

    if (error) {
        alert('خطأ في إضافة العميل: ' + error.message);
        return;
    }

    // Reset form
    document.getElementById('clientName').value = '';
    document.getElementById('labSelect').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('status').value = 'pending';

    await logAction('add_client', `تم إضافة عميل جديد: ${name}`);
    loadAdminClients();
}

// Update client status
async function updateClientStatus(clientId, currentStatus) {
    try {
        const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
        
        const { data, error } = await supabase
            .from('clients')
            .update({ status: newStatus })
            .eq('id', clientId);

        if (error) throw error;

        // تحديث العرض في الجدول
        const row = document.querySelector(`tr[data-client-id="${clientId}"]`);
        if (row) {
            const statusCell = row.querySelector('td:nth-child(4)');
            statusCell.innerHTML = getStatusBadge(newStatus, clientId);
        }

        // تسجيل العملية
        const actionText = newStatus === 'completed' ? 'اكتمال الدفع' : 'إعادة للانتظار';
        await logAction('update_status', `تم ${actionText} للعميل رقم ${clientId}`);

        // تحديث الإحصائيات
        updateStats();
        
        showToast('success', `تم ${actionText} بنجاح`);
    } catch (error) {
        console.error('Error updating client status:', error);
        showToast('error', 'حدث خطأ أثناء تحديث حالة العميل');
    }
}

// Delete client
async function deleteClient(clientId, clientName) {
    // عرض رسالة تأكيد
    if (!confirm(`هل أنت متأكد من حذف العميل "${clientName}"؟`)) {
        return;
    }

    try {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', clientId);

        if (error) throw error;

        // حذف العميل من العرض مباشرة
        const row = document.querySelector(`#adminClientsTable tr[data-client-id="${clientId}"]`);
        if (row) {
            row.remove();
        }

        // تحديث الإحصائيات
        updateStats();
        
        showToast('success', 'تم حذف العميل بنجاح');
    } catch (error) {
        console.error('Error deleting client:', error);
        showToast('error', 'حدث خطأ أثناء حذف العميل');
    }
}

// Load audit log
async function loadAuditLog() {
    const { data: logs, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error loading audit log:', error);
        return;
    }

    const tableBody = document.getElementById('auditLogTable');
    tableBody.innerHTML = '';

    logs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="badge ${getActionBadgeColor(log.action)}">
                    ${getActionText(log.action)}
                </span>
            </td>
            <td>${log.details}</td>
            <td>${log.user_email || 'نظام'}</td>
            <td>${new Date(log.created_at).toLocaleString('ar-SA')}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Log action
async function logAction(action, details) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
        .from('audit_log')
        .insert([{
            action,
            details,
            user_email: user?.email
        }]);

    if (error) {
        console.error('Error logging action:', error);
    }

    loadAuditLog();
}

// Helper functions
function getStatusBadge(status, clientId) {
    const statusInfo = {
        pending: { color: 'warning', text: 'قيد الانتظار', icon: 'hourglass-split' },
        completed: { color: 'success', text: 'مكتمل', icon: 'check-circle' },
        cancelled: { color: 'danger', text: 'ملغي', icon: 'x-circle' }
    };

    const info = statusInfo[status] || { color: 'secondary', text: 'غير معروف', icon: 'question-circle' };
    
    return `
        <div class="d-flex align-items-center gap-2">
            <span class="badge bg-${info.color} status-badge" 
                  style="cursor: pointer;" 
                  onclick="updateClientStatus(${clientId}, '${status}')">
                <i class="bi bi-${info.icon} me-1"></i>
                ${info.text}
            </span>
        </div>
    `;
}

function getActionBadgeColor(action) {
    const colors = {
        add_lab: 'bg-success',
        edit_lab: 'bg-primary',
        delete_lab: 'bg-danger',
        add_client: 'bg-success',
        edit_client: 'bg-primary',
        delete_client: 'bg-danger',
        update_status: 'bg-warning'
    };

    return colors[action] || 'bg-secondary';
}

function getActionText(action) {
    const texts = {
        add_lab: 'إضافة مختبر',
        edit_lab: 'تعديل مختبر',
        delete_lab: 'حذف مختبر',
        add_client: 'إضافة عميل',
        edit_client: 'تعديل عميل',
        delete_client: 'حذف عميل',
        update_status: 'تحديث حالة'
    };

    return texts[action] || action;
}

// إظهار رسالة للمستخدم
function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.appendChild(toast);
    document.body.appendChild(container);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        container.remove();
    });
}
