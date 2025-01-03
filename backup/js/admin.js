// Initialize Supabase Client
const supabaseClient = supabase.createClient(
    'https://xguxveuvqnejmdwryhjc.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndXh2ZXV2cW5lam1kd3J5aGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MzQ2MTQsImV4cCI6MjA1MDAxMDYxNH0.RIbDi05WTn77ROJBoOgmtAR2G06_5tnhYF0adJ1MU5Q'
);

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadLabs();
    loadAdminClients();
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
        .select('*, clients(count)');

    if (error) {
        console.error('Error loading labs:', error);
        return;
    }

    // Update labs table
    const tableBody = document.getElementById('labsTable');
    tableBody.innerHTML = '';

    labs.forEach(lab => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${lab.name}</td>
            <td>${new Date(lab.created_at).toLocaleDateString('ar-SA')}</td>
            <td>${lab.clients?.count || 0}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-primary" onclick="editLab(${lab.id}, '${lab.name}')" title="تعديل">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteLab(${lab.id})" title="حذف">
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
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.name}</td>
            <td>${client.labs?.name || 'غير محدد'}</td>
            <td>${client.amount} ريال</td>
            <td>
                <select class="form-select form-select-sm status-select" 
                        onchange="updateClientStatus(${client.id}, this.value)"
                        style="width: 150px">
                    <option value="pending" ${client.status === 'pending' ? 'selected' : ''}>
                        قيد الانتظار
                    </option>
                    <option value="completed" ${client.status === 'completed' ? 'selected' : ''}>
                        مكتمل
                    </option>
                    <option value="cancelled" ${client.status === 'cancelled' ? 'selected' : ''}>
                        ملغي
                    </option>
                </select>
            </td>
            <td>${new Date(client.created_at).toLocaleDateString('ar-SA')}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-primary" onclick="editClient(${client.id})">
                        <i class="bi bi-pencil"></i> تعديل
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteClient(${client.id})">
                        <i class="bi bi-trash"></i> حذف
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Add new client
async function addClient(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('clientName').value,
        lab_id: parseInt(document.getElementById('labSelect').value),
        amount: parseInt(document.getElementById('amount').value),
        status: document.getElementById('status').value
    };

    const { data, error } = await supabaseClient
        .from('clients')
        .insert([formData]);

    if (error) {
        alert('خطأ في إضافة العميل: ' + error.message);
        return;
    }

    // Clear form
    document.getElementById('clientName').value = '';
    document.getElementById('labSelect').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('status').value = 'pending';

    loadAdminClients();
    alert('تم إضافة العميل بنجاح');
}

// Edit client
async function editClient(clientId) {
    const { data: client, error: fetchError } = await supabaseClient
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

    if (fetchError) {
        alert('خطأ في جلب بيانات العميل: ' + fetchError.message);
        return;
    }

    // Show edit form in modal
    const modal = document.createElement('div');
    modal.className = 'modal fade show';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">تعديل بيانات العميل</h5>
                    <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                </div>
                <div class="modal-body">
                    <form id="editClientForm">
                        <div class="mb-3">
                            <label class="form-label">اسم العميل</label>
                            <input type="text" class="form-control" id="editClientName" value="${client.name}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">المختبر</label>
                            <select class="form-select" id="editLabSelect" required></select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">المبلغ</label>
                            <input type="number" class="form-control" id="editAmount" value="${client.amount}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">الحالة</label>
                            <select class="form-select" id="editStatus" required>
                                <option value="pending" ${client.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                                <option value="completed" ${client.status === 'completed' ? 'selected' : ''}>مكتمل</option>
                                <option value="cancelled" ${client.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">إلغاء</button>
                    <button type="button" class="btn btn-primary" onclick="saveClientEdit(${clientId})">حفظ التغييرات</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Load labs into select
    const { data: labs } = await supabaseClient
        .from('labs')
        .select('*')
        .order('name');

    const editLabSelect = document.getElementById('editLabSelect');
    editLabSelect.innerHTML = '<option value="">اختر المختبر</option>';
    
    labs.forEach(lab => {
        const option = document.createElement('option');
        option.value = lab.id;
        option.textContent = lab.name;
        option.selected = lab.id === client.lab_id;
        editLabSelect.appendChild(option);
    });
}

// Save client edit
async function saveClientEdit(clientId) {
    const formData = {
        name: document.getElementById('editClientName').value,
        lab_id: parseInt(document.getElementById('editLabSelect').value),
        amount: parseInt(document.getElementById('editAmount').value),
        status: document.getElementById('editStatus').value
    };

    const { error } = await supabaseClient
        .from('clients')
        .update(formData)
        .eq('id', clientId);

    if (error) {
        alert('خطأ في تحديث بيانات العميل: ' + error.message);
        return;
    }

    document.querySelector('.modal').remove();
    loadAdminClients();
    alert('تم تحديث بيانات العميل بنجاح');
}

// Delete client
async function deleteClient(clientId) {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) {
        return;
    }

    const { error } = await supabaseClient
        .from('clients')
        .delete()
        .eq('id', clientId);

    if (error) {
        alert('خطأ في حذف العميل: ' + error.message);
        return;
    }

    loadAdminClients();
}

// تحديث حالة العميل
async function updateClientStatus(clientId, status) {
    const { error } = await supabaseClient
        .from('clients')
        .update({ status })
        .eq('id', clientId);

    if (error) {
        console.error('Error updating client status:', error);
        return;
    }

    // تحديث البيانات
    await loadAdminClients();
}

// Helper functions
function getStatusBadgeColor(status) {
    switch (status) {
        case 'completed': return 'success';
        case 'pending': return 'warning';
        case 'cancelled': return 'danger';
        default: return 'secondary';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'completed': return 'مكتمل';
        case 'pending': return 'قيد الانتظار';
        case 'cancelled': return 'ملغي';
        default: return 'غير معروف';
    }
}
