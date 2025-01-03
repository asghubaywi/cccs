// Initialize Supabase Client
const supabaseClient = supabase.createClient(
    'https://xguxveuvqnejmdwryhjc.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndXh2ZXV2cW5lam1kd3J5aGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MzQ2MTQsImV4cCI6MjA1MDAxMDYxNH0.RIbDi05WTn77ROJBoOgmtAR2G06_5tnhYF0adJ1MU5Q'
);

// متغيرات عامة
let currentView = 'grid'; // 'grid' or 'table'
let clients = []; // تخزين العملاء

// تهيئة التطبيق
async function initialize() {
    loadThemePreference();
    await loadLabs();
    await loadClients();
}

// تحميل المختبرات
async function loadLabs() {
    const { data: labs, error } = await supabaseClient
        .from('labs')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error loading labs:', error);
        return;
    }

    const labSelect = document.getElementById('searchLab');
    labSelect.innerHTML = '<option value="">جميع المختبرات</option>';
    
    labs.forEach(lab => {
        const option = document.createElement('option');
        option.value = lab.id;
        option.textContent = lab.name;
        labSelect.appendChild(option);
    });
}

// تحميل العملاء
async function loadClients() {
    const { data, error } = await supabaseClient
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

    clients = data;
    displayClients(clients);
    updateStatistics(clients);
}

// عرض العملاء
function displayClients(clientsToDisplay) {
    if (currentView === 'grid') {
        displayClientsGrid(clientsToDisplay);
    } else {
        displayClientsTable(clientsToDisplay);
    }
}

// عرض العملاء في شكل بطاقات
function displayClientsGrid(clientsToDisplay) {
    const container = document.getElementById('gridView');
    container.innerHTML = '';

    if (!clientsToDisplay || clientsToDisplay.length === 0) {
        showNoDataMessage(container);
        return;
    }

    clientsToDisplay.forEach(client => {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-lg-3';
        
        const statusImage = client.status === 'completed' ? 'completed.svg' : 
                           client.status === 'pending' ? 'pending.svg' : '';
        
        col.innerHTML = `
            <div class="card client-card h-100">
                <div class="card-body d-flex flex-column">
                    ${statusImage ? `
                        <div class="text-center mb-3">
                            <img src="images/${statusImage}" alt="${getStatusText(client.status)}" 
                                 class="status-image" style="width: 60px; height: 60px;">
                        </div>
                    ` : ''}
                    <div class="badges mb-3">
                        <span class="badge status-badge bg-${getStatusBadgeColor(client.status)}">
                            ${getStatusText(client.status)}
                        </span>
                        <span class="badge lab-badge bg-info">
                            ${client.labs.name}
                        </span>
                    </div>
                    
                    <h5 class="card-title mb-3">${client.name}</h5>
                    
                    <div class="client-info mt-auto">
                        <div class="amount mb-2">
                            <i class="fa-solid fa-coins"></i>
                            ${formatNumber(client.amount)} ريال
                        </div>
                        
                        <div class="date mb-3">
                            <i class="fa-solid fa-calendar"></i>
                            ${formatDate(client.created_at)}
                        </div>

                        ${client.status === 'pending' ? `
                            <button class="btn btn-success btn-sm w-100" 
                                    onclick="updateClientStatus(${client.id}, 'completed')">
                                <i class="fa-solid fa-check-circle"></i>
                                تأكيد الدفع
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(col);
    });

    // إظهار عرض البطاقات وإخفاء الجدول
    document.getElementById('gridView').style.display = 'flex';
    document.getElementById('tableView').style.display = 'none';
}

// عرض العملاء في شكل جدول
function displayClientsTable(clientsToDisplay) {
    const tableView = document.getElementById('tableView');
    
    if (!clientsToDisplay || clientsToDisplay.length === 0) {
        showNoDataMessage(tableView);
        return;
    }

    tableView.innerHTML = `
        <table class="table table-hover">
            <thead>
                <tr>
                    <th>الاسم</th>
                    <th>المختبر</th>
                    <th>المبلغ</th>
                    <th>الحالة</th>
                    <th>التاريخ</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody id="clientsTable"></tbody>
        </table>
    `;

    const tbody = document.getElementById('clientsTable');
    clientsToDisplay.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.name}</td>
            <td>${client.labs.name}</td>
            <td>${formatNumber(client.amount)} ريال</td>
            <td>
                <span class="badge bg-${getStatusBadgeColor(client.status)}">
                    ${getStatusText(client.status)}
                </span>
            </td>
            <td>${formatDate(client.created_at)}</td>
            <td>
                ${client.status === 'pending' ? `
                    <button class="btn btn-success btn-sm" 
                            onclick="updateClientStatus(${client.id}, 'completed')">
                        <i class="bi bi-check-circle"></i>
                        تأكيد الدفع
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });

    // إظهار الجدول وإخفاء عرض البطاقات
    document.getElementById('gridView').style.display = 'none';
    document.getElementById('tableView').style.display = 'block';
}

// عرض رسالة عدم وجود بيانات
function showNoDataMessage(container) {
    container.innerHTML = `
        <div class="col-12">
            <div class="no-data-message text-center">
                <img src="images/empty-state.svg" alt="لا توجد بيانات" class="img-fluid mb-4" style="max-width: 300px;">
                <h3>لا توجد بيانات للعرض</h3>
                <p class="text-muted">لم يتم العثور على أي عملاء يطابقون معايير البحث</p>
                <button class="btn btn-primary mt-3" onclick="resetSearch()">
                    <i class="fa-solid fa-rotate"></i>
                    عرض جميع العملاء
                </button>
            </div>
        </div>
    `;
}

// البحث في العملاء
async function searchClients(event) {
    if (event) event.preventDefault();
    
    const name = document.getElementById('searchName').value.toLowerCase();
    const labId = document.getElementById('searchLab').value;
    const status = document.getElementById('searchStatus').value;
    const amount = document.getElementById('searchAmount').value;

    let filteredClients = clients.filter(client => {
        let matches = true;

        // البحث بالاسم
        if (name && !client.name.toLowerCase().includes(name)) {
            matches = false;
        }

        // البحث بالمختبر
        if (labId && client.lab_id !== parseInt(labId)) {
            matches = false;
        }

        // البحث بالحالة
        if (status && client.status !== status) {
            matches = false;
        }

        // البحث بالمبلغ
        if (amount && client.amount !== parseFloat(amount)) {
            matches = false;
        }

        return matches;
    });

    displayClients(filteredClients);
    updateStatistics(filteredClients);
}

// إعادة تعيين البحث
function resetSearch() {
    document.getElementById('searchName').value = '';
    document.getElementById('searchLab').value = '';
    document.getElementById('searchStatus').value = '';
    document.getElementById('searchAmount').value = '';
    
    displayClients(clients);
    updateStatistics(clients);
}

// تحديث حالة العميل
async function updateClientStatus(clientId, newStatus) {
    try {
        const { data, error } = await supabaseClient
            .from('clients')
            .update({ status: newStatus })
            .eq('id', clientId)
            .select()
            .single();

        if (error) throw error;

        // تحديث العميل في المصفوفة المحلية
        const index = clients.findIndex(c => c.id === clientId);
        if (index !== -1) {
            clients[index] = { ...clients[index], ...data };
        }

        // تحديث العرض والإحصائيات
        displayClients(clients);
        updateStatistics(clients);

        // إظهار رسالة نجاح
        showToast('success', 'تم تحديث حالة العميل بنجاح');
    } catch (error) {
        console.error('Error updating client status:', error);
        showToast('error', 'حدث خطأ أثناء تحديث حالة العميل');
    }
}

// تحديث الإحصائيات
function updateStatistics(clientsData) {
    // إجمالي العملاء
    document.getElementById('totalClients').textContent = 
        clientsData.length.toLocaleString('ar-SA');

    // المدفوعات المكتملة
    const completedCount = clientsData.filter(c => c.status === 'completed').length;
    document.getElementById('completedPayments').textContent = 
        completedCount.toLocaleString('ar-SA');

    // المدفوعات قيد الانتظار
    const pendingCount = clientsData.filter(c => c.status === 'pending').length;
    document.getElementById('pendingPayments').textContent = 
        pendingCount.toLocaleString('ar-SA');

    // إجمالي المبالغ
    const totalAmount = clientsData.reduce((sum, client) => 
        sum + (parseFloat(client.amount) || 0), 0);
    document.getElementById('totalAmount').textContent = 
        formatNumber(totalAmount) + ' ريال';
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

// تبديل نوع العرض
function toggleView(view) {
    if (currentView === view) return;
    
    currentView = view;
    const gridButton = document.querySelector('button[onclick="toggleView(\'grid\')"]');
    const tableButton = document.querySelector('button[onclick="toggleView(\'table\')"]');
    
    if (view === 'grid') {
        gridButton.classList.add('active');
        tableButton.classList.remove('active');
    } else {
        gridButton.classList.remove('active');
        tableButton.classList.add('active');
    }
    
    displayClients(clients);
}

// تنسيق الأرقام
function formatNumber(number) {
    return new Intl.NumberFormat('ar-SA').format(number);
}

// تنسيق التاريخ
function formatDate(date) {
    return new Date(date).toLocaleDateString('ar-SA');
}

// الحصول على لون الحالة
function getStatusBadgeColor(status) {
    switch (status) {
        case 'completed': return 'success';
        case 'pending': return 'warning';
        case 'cancelled': return 'danger';
        default: return 'secondary';
    }
}

// الحصول على نص الحالة
function getStatusText(status) {
    switch (status) {
        case 'completed': return 'مكتمل';
        case 'pending': return 'قيد الانتظار';
        case 'cancelled': return 'ملغي';
        default: return 'غير معروف';
    }
}

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

// تحميل تفضيل الوضع
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const systemTheme = savedTheme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-bs-theme', systemTheme);
    updateThemeIcon(systemTheme);
}

// تحميل البيانات عند فتح الصفحة
document.addEventListener('DOMContentLoaded', initialize);

// تهيئة الوضع المحفوظ
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    // إضافة زر تبديل الوضع في القائمة
    const navbarNav = document.querySelector('.navbar-nav');
    const themeToggle = document.createElement('li');
    themeToggle.className = 'nav-item dropdown';
    themeToggle.innerHTML = `
        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
            <i class="fa-solid fa-palette"></i>
            المظهر
        </a>
        <ul class="dropdown-menu">
            <li>
                <a class="dropdown-item" href="#" onclick="setTheme('light')">
                    <i class="fa-solid fa-sun"></i>
                    فاتح
                </a>
            </li>
            <li>
                <a class="dropdown-item" href="#" onclick="setTheme('dark')">
                    <i class="fa-solid fa-moon"></i>
                    داكن
                </a>
            </li>
        </ul>
    `;
    navbarNav.appendChild(themeToggle);
});

// تغيير الوضع
function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
    
    // إضافة تأثيرات حركية عند تغيير الوضع
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 200);
    
    // تحديث الأيقونات حسب الوضع
    const icons = {
        light: 'fa-sun',
        dark: 'fa-moon'
    };
    
    document.querySelectorAll('.theme-icon').forEach(icon => {
        icon.className = `theme-icon fa-solid ${icons[theme]}`;
    });
}
