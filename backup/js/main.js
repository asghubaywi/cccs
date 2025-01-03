// Initialize Supabase Client
const supabaseClient = supabase.createClient(
    'https://xguxveuvqnejmdwryhjc.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndXh2ZXV2cW5lam1kd3J5aGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MzQ2MTQsImV4cCI6MjA1MDAxMDYxNH0.RIbDi05WTn77ROJBoOgmtAR2G06_5tnhYF0adJ1MU5Q'
);

// متغيرات عامة
let currentPage = 1;
const itemsPerPage = 10;
let totalPages = 1;

// Load initial data
async function initialize() {
    loadThemePreference();
    await loadLabs();
    await loadClients();
    await loadStats();
}

document.addEventListener('DOMContentLoaded', initialize);

// Load statistics
async function loadStats() {
    const { data: clients, error } = await supabaseClient
        .from('clients')
        .select('*');

    if (error) {
        console.error('Error loading stats:', error);
        return;
    }

    const totalClients = clients.length;
    const completedPayments = clients.filter(c => c.status === 'completed').length;
    const pendingPayments = clients.filter(c => c.status === 'pending').length;
    const totalAmount = clients.reduce((sum, client) => sum + client.amount, 0);

    document.getElementById('totalClients').textContent = totalClients;
    document.getElementById('completedPayments').textContent = completedPayments;
    document.getElementById('pendingPayments').textContent = pendingPayments;
    document.getElementById('totalAmount').textContent = totalAmount.toLocaleString('ar-SA') + ' ريال';
}

// Load labs for search
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

// Load clients with pagination
async function loadClients(page = 1) {
    currentPage = page;
    
    let query = supabaseClient
        .from('clients')
        .select(`
            *,
            labs (
                name
            )
        `, { count: 'exact' });

    // إضافة الفلترة
    const name = document.getElementById('searchName')?.value;
    const lab = document.getElementById('searchLab')?.value;
    const status = document.getElementById('searchStatus')?.value;
    const amount = document.getElementById('searchAmount')?.value;

    if (name) query = query.ilike('name', `%${name}%`);
    if (lab) query = query.eq('lab_id', lab);
    if (status) query = query.eq('status', status);
    if (amount) query = query.eq('amount', parseInt(amount));

    query = query.order('created_at', { ascending: false })
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

    const { data: clients, error, count } = await query;

    if (error) {
        console.error('Error loading clients:', error);
        return;
    }

    const tableBody = document.getElementById('clientsTable');
    tableBody.innerHTML = '';

    clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.name}</td>
            <td>${client.labs?.name || 'غير محدد'}</td>
            <td>${client.amount} ريال</td>
            <td>
                <span class="badge bg-${getStatusBadgeColor(client.status)}">
                    ${getStatusText(client.status)}
                </span>
            </td>
            <td>${new Date(client.created_at).toLocaleDateString('ar-SA')}</td>
            <td>
                ${client.status === 'pending' ? `
                    <button class="btn btn-sm btn-success" onclick="updateClientStatus(${client.id}, 'completed')">
                        <i class="bi bi-check-circle"></i> تأكيد الدفع
                    </button>
                ` : ''}
            </td>
        `;
        tableBody.appendChild(row);
    });

    // تحديث ترقيم الصفحات
    totalPages = Math.ceil(count / itemsPerPage);
    updatePagination();
}

// Search clients
async function searchClients(event) {
    if (event) event.preventDefault();
    currentPage = 1;
    await loadClients(1);
}

// Reset search
function resetSearch() {
    document.getElementById('searchName').value = '';
    document.getElementById('searchLab').value = '';
    document.getElementById('searchStatus').value = '';
    document.getElementById('searchAmount').value = '';
    searchClients();
}

// Update client status
async function updateClientStatus(clientId, status) {
    // السماح فقط بتحديث الحالة من "قيد الانتظار" إلى "مكتمل"
    if (status !== 'completed') {
        return;
    }

    const { error } = await supabaseClient
        .from('clients')
        .update({ status })
        .eq('id', clientId);

    if (error) {
        console.error('Error updating client status:', error);
        return;
    }

    // إعادة تحميل البيانات
    await loadClients(currentPage);
    await loadStats();
}

// Update pagination
function updatePagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" onclick="loadClients(${currentPage - 1})">
            <i class="bi bi-chevron-right"></i>
        </a>
    `;
    pagination.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${currentPage === i ? 'active' : ''}`;
        li.innerHTML = `
            <a class="page-link" href="#" onclick="loadClients(${i})">${i}</a>
        `;
        pagination.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" onclick="loadClients(${currentPage + 1})">
            <i class="bi bi-chevron-left"></i>
        </a>
    `;
    pagination.appendChild(nextLi);
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

// تبديل الوضع الليلي
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-bs-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    const icon = document.getElementById('themeIcon');
    
    html.setAttribute('data-bs-theme', newTheme);
    icon.className = `bi bi-${isDark ? 'moon-stars' : 'sun'}`;
    
    // حفظ التفضيل في localStorage
    localStorage.setItem('theme', newTheme);
}

// تحميل تفضيل الوضع الليلي عند بدء التطبيق
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const icon = document.getElementById('themeIcon');
    
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    icon.className = `bi bi-${savedTheme === 'dark' ? 'sun' : 'moon-stars'}`;
}
