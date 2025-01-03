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
        
        col.innerHTML = `
            <div class="card client-card h-100">
                <div class="card-body d-flex flex-column">
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
                            <i class="bi bi-currency-dollar"></i>
                            ${formatNumber(client.amount)} ريال
                        </div>
                        
                        <div class="date mb-3">
                            <i class="bi bi-calendar3"></i>
                            ${formatDate(client.created_at)}
                        </div>

                        ${client.status === 'pending' ? `
                            <button class="btn btn-success btn-sm w-100" 
                                    onclick="updateClientStatus(${client.id}, 'completed')">
                                <i class="bi bi-check-circle"></i>
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
            <div class="no-data-message">
                <i class="bi bi-inbox"></i>
                <h3>لا توجد بيانات للعرض</h3>
                <p>لم يتم العثور على أي عملاء يطابقون معايير البحث</p>
                <button class="btn btn-primary" onclick="resetSearch()">
                    <i class="bi bi-arrow-clockwise"></i>
                    عرض جميع العملاء
                </button>
            </div>
        </div>
    `;
}

// البحث في العملاء
function searchClients(event) {
    event.preventDefault();
    
    const searchName = document.getElementById('searchName').value.toLowerCase();
    const searchLab = document.getElementById('searchLab').value;
    const searchStatus = document.getElementById('searchStatus').value;
    const searchAmount = document.getElementById('searchAmount').value;

    const filteredClients = clients.filter(client => {
        const nameMatch = !searchName || client.name.toLowerCase().includes(searchName);
        const labMatch = !searchLab || client.lab_id.toString() === searchLab;
        const statusMatch = !searchStatus || client.status === searchStatus;
        const amountMatch = !searchAmount || client.amount === parseFloat(searchAmount);

        return nameMatch && labMatch && statusMatch && amountMatch;
    });

    displayClients(filteredClients);
    updateStatistics(filteredClients);
}

// إعادة تعيين البحث
function resetSearch() {
    document.querySelector('form').reset();
    displayClients(clients);
    updateStatistics(clients);
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

    await loadClients();
}

// تحديث الإحصائيات
function updateStatistics(clientsData) {
    document.getElementById('totalClients').textContent = formatNumber(clientsData.length);
    
    const completed = clientsData.filter(c => c.status === 'completed').length;
    document.getElementById('completedPayments').textContent = formatNumber(completed);
    
    const pending = clientsData.filter(c => c.status === 'pending').length;
    document.getElementById('pendingPayments').textContent = formatNumber(pending);
    
    const total = clientsData.reduce((sum, client) => sum + (client.amount || 0), 0);
    document.getElementById('totalAmount').textContent = formatNumber(total);
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

// تبديل الوضع الليلي
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-bs-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    html.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const icon = document.getElementById('themeIcon');
    icon.className = `bi bi-${isDark ? 'moon-stars' : 'sun'}`;
}

// تحميل تفضيل الوضع الليلي
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    
    const icon = document.getElementById('themeIcon');
    icon.className = `bi bi-${savedTheme === 'dark' ? 'sun' : 'moon-stars'}`;
}

// تحميل البيانات عند فتح الصفحة
document.addEventListener('DOMContentLoaded', initialize);
