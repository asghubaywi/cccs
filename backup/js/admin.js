// Initialize Supabase Client
const supabaseClient = supabase.createClient(
    'https://xguxveuvqnejmdwryhjc.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndXh2ZXV2cW5lam1kd3J5aGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MzQ2MTQsImV4cCI6MjA1MDAxMDYxNH0.RIbDi05WTn77ROJBoOgmtAR2G06_5tnhYF0adJ1MU5Q'
);

// تهيئة الوضع المظلم
function initTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', currentTheme);
    updateThemeIcon(currentTheme);
}

// تبديل الوضع المظلم
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// تحديث أيقونة الوضع المظلم
function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    icon.className = theme === 'light' ? 'bi bi-moon-stars' : 'bi bi-sun';
}

// تحديث الإحصائيات
async function updateStats() {
    const { data: labs } = await supabaseClient
        .from('labs')
        .select('*');
    
    const { data: clients } = await supabaseClient
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

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    checkAuth();
    loadLabs();
    loadAdminClients();
    loadAuditLog();
    updateStats();
});

// Check authentication
async function checkAuth() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (user) {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'block';
    } else {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('adminContent').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'none';
    }
}

// Login
async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert('خطأ في تسجيل الدخول: ' + error.message);
        return;
    }

    checkAuth();
}

// Logout
async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    
    if (error) {
        alert('خطأ في تسجيل الخروج: ' + error.message);
        return;
    }

    checkAuth();
}

// Load labs
async function loadLabs() {
    const { data: labs, error } = await supabaseClient
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
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteLab(${lab.id})" title="حذف">
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

    const { data, error } = await supabaseClient
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
        const { error } = await supabaseClient
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
async function deleteLab(labId) {
    if (!confirm('هل أنت متأكد من حذف هذا المختبر؟')) {
        return;
    }

    const { error } = await supabaseClient
        .from('labs')
        .delete()
        .eq('id', labId);

    if (error) {
        alert('خطأ في حذف المختبر: ' + error.message);
        return;
    }

    await logAction('delete_lab', `تم حذف المختبر`);
    loadLabs();
}

// Load admin clients
async function loadAdminClients() {
    const { data: clients, error } = await supabaseClient
        .from('clients')
        .select(`
            *,
            labs (
                name
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading clients:', error);
        return;
    }

    const tableBody = document.getElementById('adminClientsTable');
    tableBody.innerHTML = '';

    clients.forEach(client => {
        const statusBadge = getStatusBadge(client.status);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.name}</td>
            <td>
                <span class="badge bg-info">
                    ${client.labs?.name || 'غير محدد'}
                </span>
            </td>
            <td>
                <span class="badge bg-secondary">
                    ${client.amount} ريال
                </span>
            </td>
            <td>
                <div class="d-flex gap-2 align-items-center">
                    ${statusBadge}
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li>
                                <a class="dropdown-item ${client.status === 'pending' ? 'active' : ''}" href="#" onclick="updateClientStatus(${client.id}, 'pending'); return false;">
                                    <i class="bi bi-clock text-warning"></i> قيد الانتظار
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item ${client.status === 'completed' ? 'active' : ''}" href="#" onclick="updateClientStatus(${client.id}, 'completed'); return false;">
                                    <i class="bi bi-check-circle text-success"></i> مكتمل
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item ${client.status === 'cancelled' ? 'active' : ''}" href="#" onclick="updateClientStatus(${client.id}, 'cancelled'); return false;">
                                    <i class="bi bi-x-circle text-danger"></i> ملغي
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </td>
            <td>${new Date(client.created_at).toLocaleDateString('ar-SA')}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editClient(${client.id})" title="تعديل">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteClient(${client.id})" title="حذف">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updateStats();
}

// Add new client
async function addClient(event) {
    event.preventDefault();
    
    const name = document.getElementById('clientName').value;
    const labId = document.getElementById('labSelect').value;
    const amount = document.getElementById('amount').value;
    const status = document.getElementById('status').value;

    const { data, error } = await supabaseClient
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
async function updateClientStatus(clientId, newStatus) {
    const { error } = await supabaseClient
        .from('clients')
        .update({ status: newStatus })
        .eq('id', clientId);

    if (error) {
        alert('خطأ في تحديث حالة العميل: ' + error.message);
        return;
    }

    await logAction('update_status', `تم تحديث حالة العميل إلى: ${getStatusText(newStatus)}`);
    loadAdminClients();
}

// Load audit log
async function loadAuditLog() {
    const { data: logs, error } = await supabaseClient
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
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const { error } = await supabaseClient
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
function getStatusBadge(status) {
    const colors = {
        pending: 'bg-warning',
        completed: 'bg-success',
        cancelled: 'bg-danger'
    };

    const texts = {
        pending: 'قيد الانتظار',
        completed: 'مكتمل',
        cancelled: 'ملغي'
    };

    return `<span class="badge ${colors[status]}">${texts[status]}</span>`;
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
