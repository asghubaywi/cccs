// تهيئة Supabase
const supabase = supabaseClient;

// تحميل وعرض العملاء
async function loadClients() {
    try {
        const { data: clients, error } = await supabase
            .from('clients')
            .select(`
                *,
                labs (
                    name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tableBody = document.getElementById('clientsTableBody');
        if (!tableBody) {
            console.error('Client table body not found');
            return;
        }

        tableBody.innerHTML = '';

        if (!clients || clients.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">لا يوجد عملاء</td>
                </tr>`;
            return;
        }

        for (const client of clients) {
            const row = document.createElement('tr');
            const statusBadge = client.status === 'completed' 
                ? '<span class="badge bg-success">مكتمل</span>'
                : '<span class="badge bg-warning">قيد الانتظار</span>';

            row.innerHTML = `
                <td>${client.name}</td>
                <td>${client.labs ? client.labs.name : 'غير محدد'}</td>
                <td>
                    <span class="badge bg-secondary">
                        ${formatNumber(client.amount)} ريال
                    </span>
                </td>
                <td>${statusBadge}</td>
                <td>${formatDate(client.created_at)}</td>
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
        }

        // تحديث الإحصائيات
        updateStatistics();
    } catch (error) {
        console.error('Error loading clients:', error);
        showToast('error', 'حدث خطأ أثناء تحميل العملاء');
    }
}

// تنسيق الأرقام
function formatNumber(number) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
}

// تنسيق التاريخ
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).replace(',', '');
}

// إظهار رسائل التنبيه
function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
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
    
    document.getElementById('toastContainer').appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// تحديث الإحصائيات
async function updateStatistics() {
    try {
        const { data: labs, error: labsError } = await supabase
            .from('labs')
            .select('*');
        
        if (labsError) throw labsError;

        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('*');
            
        if (clientsError) throw clientsError;

        // تحديث إحصائيات المختبرات
        document.getElementById('totalLabs').textContent = 
            new Intl.NumberFormat('en-US').format(labs.length);

        // تحديث إحصائيات العملاء
        document.getElementById('totalAdminClients').textContent = 
            new Intl.NumberFormat('en-US').format(clients.length);

        // تحديث إحصائيات المدفوعات
        const pendingPayments = clients.filter(client => client.status === 'pending').length;
        document.getElementById('pendingAdminPayments').textContent = 
            new Intl.NumberFormat('en-US').format(pendingPayments);

        // تحديث إجمالي المبالغ
        const totalAmount = clients.reduce((sum, client) => sum + (parseFloat(client.amount) || 0), 0);
        document.getElementById('totalAdminAmount').textContent = formatNumber(totalAmount);

    } catch (error) {
        console.error('Error updating statistics:', error);
        showToast('error', 'حدث خطأ أثناء تحديث الإحصائيات');
    }
}

// تحديث الإحصائيات
async function updateStats() {
    try {
        // تحميل بيانات المختبرات
        const { data: labs, error: labsError } = await supabase
            .from('labs')
            .select('*');
        
        if (labsError) throw labsError;

        // تحميل بيانات العملاء
        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('*');
            
        if (clientsError) throw clientsError;

        // تحديث إحصائيات المختبرات
        document.getElementById('totalLabs').textContent = 
            new Intl.NumberFormat('en-US').format(labs.length);

        // تحديث إحصائيات العملاء
        document.getElementById('totalAdminClients').textContent = 
            new Intl.NumberFormat('en-US').format(clients.length);

        // تحديث إحصائيات المدفوعات
        const pendingPayments = clients.filter(client => client.status === 'pending').length;
        document.getElementById('pendingAdminPayments').textContent = 
            new Intl.NumberFormat('en-US').format(pendingPayments);

        // تحديث إجمالي المبالغ
        const totalAmount = clients.reduce((sum, client) => sum + (parseFloat(client.amount) || 0), 0);
        document.getElementById('totalAdminAmount').textContent = formatNumber(totalAmount);

    } catch (error) {
        console.error('Error updating statistics:', error);
        showToast('error', 'حدث خطأ أثناء تحديث الإحصائيات');
    }
}

// التحقق من وجود جدول سجل العمليات
async function checkAuditLogTable() {
    try {
        // محاولة إنشاء الجدول إذا لم يكن موجوداً
        const { error } = await supabase.rpc('create_audit_log_table');
        if (error) {
            console.error('Error creating audit_log table:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error checking audit_log table:', error);
        return false;
    }
}

// تسجيل العملية في السجل
async function logAction(action, details) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('User not authenticated');
            return;
        }

        const { error } = await supabase
            .from('audit_log')
            .insert([{
                action: action,
                details: {
                    ...details,
                    timestamp: new Date().toISOString(),
                    browser: navigator.userAgent
                },
                user_id: user.id,
                created_at: new Date().toISOString()
            }]);

        if (error) {
            console.error('Error logging action:', error);
            throw error;
        }

        console.log('Action logged successfully:', action);
    } catch (error) {
        console.error('Error in logAction:', error);
        showToast('error', 'حدث خطأ أثناء تسجيل العملية');
    }
}

// تحميل سجل النسخ الاحتياطي
async function loadBackupHistory() {
    console.log('بدء تحميل سجل النسخ الاحتياطي');
    
    try {
        const tableBody = document.getElementById('backupHistoryTable');
        if (!tableBody) {
            throw new Error('لم يتم العثور على جدول سجل النسخ الاحتياطي');
        }

        showLoadingSpinner(tableBody);

        // التحقق من حالة المصادقة
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
            throw new Error('خطأ في المصادقة: ' + authError.message);
        }
        if (!user) {
            throw new Error('لم يتم تسجيل الدخول');
        }

        // جلب سجلات النسخ الاحتياطي
        const { data: logs, error: logsError } = await supabase
            .from('audit_log')
            .select('*')
            .eq('action', 'create_backup')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (logsError) {
            throw new Error('خطأ في جلب السجلات: ' + logsError.message);
        }

        // تحديث الجدول
        tableBody.innerHTML = '';
        
        if (!logs || logs.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="4" class="text-center">
                    <div class="alert alert-info mb-0">
                        لا توجد نسخ احتياطية حتى الآن
                    </div>
                </td>
            `;
            tableBody.appendChild(emptyRow);
            return;
        }
        
        logs.forEach(log => {
            const row = document.createElement('tr');
            const details = log.details || {};
            row.innerHTML = `
                <td>${formatDate(log.created_at)}</td>
                <td>${details.type || 'يدوي'}</td>
                <td>${formatFileSize(details.size || 0)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="downloadBackupFile('${details.filename || ''}')">
                        <i class="bi bi-download"></i> تحميل
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        console.log('تم تحميل سجل النسخ الاحتياطي بنجاح');
    } catch (error) {
        console.error('خطأ في تحميل سجل النسخ الاحتياطي:', error);
        showToast('error', error.message);
        
        const tableBody = document.getElementById('backupHistoryTable');
        if (tableBody) {
            const errorRow = document.createElement('tr');
            errorRow.innerHTML = `
                <td colspan="4" class="text-center">
                    <div class="alert alert-danger mb-0">
                        ${error.message}
                        <button class="btn btn-sm btn-outline-danger ms-2" onclick="loadBackupHistory()">
                            <i class="bi bi-arrow-clockwise"></i> إعادة المحاولة
                        </button>
                    </div>
                </td>
            `;
            tableBody.innerHTML = '';
            tableBody.appendChild(errorRow);
        }
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
            <td>${formatDate(lab.created_at)}</td>
            <td>
                <span class="badge bg-info">
                    ${new Intl.NumberFormat('en-US').format(clientCount)}
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
                        ${formatNumber(client.amount)} ريال
                    </span>
                </td>
                <td>${statusBadge}</td>
                <td>${formatDate(client.created_at)}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="editClient(${client.id})" title="تعديل">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteClient(${client.id}, '${client.name}')" title="حذف">
                            <i class="bi bi-trash"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="copyClientMessage(${client.id})" title="نسخ الرسالة">
                            <i class="bi bi-clipboard"></i>
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
            <td>${formatDate(log.created_at)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// وظائف النسخ الاحتياطي
async function downloadBackup() {
    try {
        showToast('info', 'جاري تحضير النسخة الاحتياطية...');
        
        // جلب البيانات من جميع الجداول
        const [
            { data: clients }, 
            { data: labs }, 
            { data: auditLog }
        ] = await Promise.all([
            supabase.from('clients').select('*'),
            supabase.from('labs').select('*'),
            supabase.from('audit_log').select('*')
        ]);

        // تجهيز البيانات
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {
                clients,
                labs,
                audit_log: auditLog
            }
        };

        // تحويل البيانات إلى ملف
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const filename = `backup_${new Date().toISOString().split('T')[0]}.json`;

        // إنشاء رابط التحميل
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // تسجيل عملية النسخ الاحتياطي
        await logBackup('manual', blob.size);
        
        showToast('success', 'تم تحميل النسخة الاحتياطية بنجاح');
    } catch (error) {
        console.error('Error creating backup:', error);
        showToast('error', 'حدث خطأ أثناء إنشاء النسخة الاحتياطية');
    }
}

async function toggleAutoBackup(switchElement) {
    try {
        const isEnabled = switchElement.checked;
        
        if (isEnabled) {
            // تخزين وقت آخر نسخ احتياطي
            localStorage.setItem('lastAutoBackup', new Date().toISOString());
            localStorage.setItem('autoBackupEnabled', 'true');
            
            // بدء المؤقت للنسخ الاحتياطي التلقائي
            startAutoBackupTimer();
            
            showToast('success', 'تم تفعيل النسخ الاحتياطي التلقائي');
        } else {
            localStorage.removeItem('autoBackupEnabled');
            showToast('info', 'تم إيقاف النسخ الاحتياطي التلقائي');
        }
        
        updateLastBackupInfo();
    } catch (error) {
        console.error('Error toggling auto backup:', error);
        showToast('error', 'حدث خطأ أثناء تغيير إعدادات النسخ الاحتياطي التلقائي');
        switchElement.checked = false;
    }
}

function startAutoBackupTimer() {
    // التحقق كل ساعة
    setInterval(async () => {
        if (localStorage.getItem('autoBackupEnabled') !== 'true') return;
        
        const lastBackup = localStorage.getItem('lastAutoBackup');
        const now = new Date();
        const hoursSinceLastBackup = (now - lastBackup) / (1000 * 60 * 60);
        
        // إجراء نسخ احتياطي إذا مر 24 ساعة
        if (hoursSinceLastBackup >= 24) {
            await performAutoBackup();
        }
    }, 60 * 60 * 1000); // فحص كل ساعة
}

async function performAutoBackup() {
    try {
        const { data: backupData, error } = await supabase.rpc('create_backup');
        if (error) throw error;
        
        localStorage.setItem('lastAutoBackup', new Date().toISOString());
        await logBackup('auto', JSON.stringify(backupData).length);
        
        updateLastBackupInfo();
        showToast('success', 'تم إجراء نسخ احتياطي تلقائي بنجاح');
    } catch (error) {
        console.error('Error performing auto backup:', error);
        showToast('error', 'حدث خطأ أثناء النسخ الاحتياطي التلقائي');
    }
}

async function logBackup(type, size) {
    try {
        const { error } = await supabase
            .from('audit_log')
            .insert([{
                action: 'create_backup',
                details: `تم إنشاء نسخة احتياطية (${type}) - الحجم: ${formatFileSize(size)}`,
                user_id: (await supabase.auth.getUser()).data.user?.id
            }]);
        
        if (error) throw error;
        
        // تحديث جدول النسخ الاحتياطية
        await loadBackupHistory();
    } catch (error) {
        console.error('Error logging backup:', error);
    }
}

async function loadBackupHistory() {
    console.log('بدء تحميل سجل النسخ الاحتياطي');
    
    try {
        const tableBody = document.getElementById('backupHistoryTable');
        if (!tableBody) {
            throw new Error('لم يتم العثور على جدول سجل النسخ الاحتياطي');
        }

        showLoadingSpinner(tableBody);
        console.log('جاري جلب البيانات من Supabase...');
        
        // التحقق من حالة المصادقة
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
            throw new Error('خطأ في المصادقة: ' + authError.message);
        }
        if (!user) {
            throw new Error('لم يتم تسجيل الدخول');
        }

        // جلب سجلات النسخ الاحتياطي
        const { data: logs, error: logsError } = await supabase
            .from('audit_log')
            .select('*')
            .eq('action', 'create_backup')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (logsError) {
            throw new Error('خطأ في جلب السجلات: ' + logsError.message);
        }

        console.log('تم جلب السجلات:', logs);
        
        // تحديث الجدول
        tableBody.innerHTML = '';
        
        if (!logs || logs.length === 0) {
            console.log('لا توجد سجلات للعرض');
            showEmptyBackupHistory(tableBody);
            return;
        }
        
        // عرض السجلات
        logs.forEach((log, index) => {
            try {
                console.log(`معالجة السجل ${index + 1}:`, log);
                const row = createBackupHistoryRow(log);
                tableBody.appendChild(row);
            } catch (rowError) {
                console.error(`خطأ في معالجة السجل ${index + 1}:`, rowError);
                // استمر في معالجة باقي السجلات
            }
        });

        console.log('تم تحميل سجل النسخ الاحتياطي بنجاح');
    } catch (error) {
        console.error('خطأ في تحميل سجل النسخ الاحتياطي:', error);
        showToast('error', 'حدث خطأ أثناء تحميل سجل النسخ الاحتياطي: ' + error.message);
        
        const tableBody = document.getElementById('backupHistoryTable');
        if (tableBody) {
            showErrorMessage(tableBody, error.message);
        }
    }
}

// إظهار رسالة الخطأ
function showErrorMessage(container, errorMessage = '') {
    container.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-4">
                <div class="text-danger">
                    <i class="bi bi-exclamation-triangle fs-4 d-block mb-2"></i>
                    حدث خطأ أثناء تحميل سجل النسخ الاحتياطي
                    ${errorMessage ? `<div class="small text-muted mb-2">${errorMessage}</div>` : ''}
                    <button class="btn btn-sm btn-outline-primary mt-2" onclick="loadBackupHistory()">
                        <i class="bi bi-arrow-clockwise me-1"></i>
                        إعادة المحاولة
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// إعادة محاولة تحميل السجل
async function retryLoadBackupHistory() {
    const button = event.target;
    const originalText = button.innerHTML;
    
    try {
        button.disabled = true;
        button.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            جاري إعادة المحاولة...
        `;
        
        await loadBackupHistory();
    } catch (error) {
        console.error('فشلت إعادة المحاولة:', error);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// إنشاء صف في جدول سجل النسخ الاحتياطي
function createBackupHistoryRow(log) {
    if (!log || !log.created_at || !log.details) {
        console.error('بيانات السجل غير صالحة:', log);
        throw new Error('بيانات السجل غير صالحة');
    }

    const row = document.createElement('tr');
    try {
        const backupType = log.details.includes('auto') ? 'تلقائي' : 'يدوي';
        const badgeClass = log.details.includes('auto') ? 'info' : 'primary';
        const size = log.details.split('الحجم: ')[1] || 'غير معروف';
        const date = new Date(log.created_at);
        
        if (isNaN(date.getTime())) {
            throw new Error('تاريخ غير صالح');
        }
        
        row.innerHTML = `
            <td>${formatDate(log.created_at)}</td>
            <td>
                <span class="badge bg-${badgeClass}">
                    ${backupType}
                </span>
            </td>
            <td dir="ltr">${formatFileSize(size)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" 
                        onclick="downloadBackup('${log.id}')" 
                        title="تحميل النسخة الاحتياطية">
                    <i class="bi bi-download"></i>
                </button>
            </td>
        `;
    } catch (error) {
        console.error('خطأ في إنشاء صف السجل:', error);
        row.innerHTML = `
            <td colspan="4" class="text-center text-danger">
                <i class="bi bi-exclamation-circle-fill me-1"></i>
                خطأ في عرض هذا السجل
            </td>
        `;
    }
    
    return row;
}

// إظهار رسالة التحميل
function showLoadingSpinner(container) {
    container.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">جاري التحميل...</span>
                </div>
            </td>
        </tr>
    `;
}

// إظهار رسالة عند عدم وجود نسخ احتياطية
function showEmptyBackupHistory(container) {
    container.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-4">
                <div class="text-muted">
                    <i class="bi bi-inbox fs-4 d-block mb-2"></i>
                    لا توجد نسخ احتياطية سابقة
                </div>
            </td>
        </tr>
    `;
}

// إظهار رسالة الخطأ
function showErrorMessage(container, errorMessage = '') {
    if (!container) return;
    
    container.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-4">
                <div class="text-danger">
                    <i class="bi bi-exclamation-triangle fs-4 d-block mb-2"></i>
                    حدث خطأ أثناء تحميل سجل النسخ الاحتياطي
                    ${errorMessage ? `<div class="small text-muted mb-2">${errorMessage}</div>` : ''}
                    <button class="btn btn-sm btn-outline-primary mt-2" onclick="loadBackupHistory()">
                        <i class="bi bi-arrow-clockwise me-1"></i>
                        إعادة المحاولة
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// تهيئة زر النسخ الاحتياطي التلقائي
function initAutoBackupSwitch() {
    const autoBackupSwitch = document.getElementById('autoBackupSwitch');
    if (autoBackupSwitch) {
        autoBackupSwitch.checked = localStorage.getItem('autoBackupEnabled') === 'true';
        
        // بدء المؤقت إذا كان النسخ التلقائي مفعل
        if (autoBackupSwitch.checked) {
            startAutoBackupTimer();
        }
    }
}

// تحديث معلومات النسخة الاحتياطية الأخيرة
function updateLastBackupInfo() {
    const lastBackup = localStorage.getItem('lastAutoBackup');
    const infoElement = document.getElementById('lastBackupInfo');
    
    if (lastBackup) {
        const lastBackupDate = new Date(lastBackup);
        infoElement.textContent = `آخر نسخة احتياطية: ${formatDate(lastBackupDate)}`;
    } else {
        infoElement.textContent = 'آخر نسخة احتياطية: لم يتم إجراء نسخ احتياطي بعد';
    }
}

// تحميل سجل النسخ الاحتياطي عند فتح القسم
document.querySelector('a[href="#backupSection"]').addEventListener('shown.bs.tab', () => {
    loadBackupHistory();
    updateLastBackupInfo();
    
    // تحديث حالة زر التفعيل التلقائي
    const autoBackupSwitch = document.getElementById('autoBackupSwitch');
    autoBackupSwitch.checked = localStorage.getItem('autoBackupEnabled') === 'true';
});

// وظائف العملاء
async function loadClients() {
    try {
        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select(`
                *,
                labs (
                    name
                )
            `)
            .order('created_at', { ascending: false });

        if (clientsError) throw clientsError;

        const tableBody = document.getElementById('clientsTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';
        
        for (const client of clients) {
            const row = document.createElement('tr');
            
            // تحديد لون الحالة
            let statusBadge = '';
            if (client.status === 'pending') {
                statusBadge = '<span class="badge bg-warning">قيد الانتظار</span>';
            } else if (client.status === 'completed') {
                statusBadge = '<span class="badge bg-success">مكتمل</span>';
            }

            row.innerHTML = `
                <td>${client.name}</td>
                <td>${client.labs?.name || 'غير محدد'}</td>
                <td>
                    <span class="badge bg-secondary">
                        ${formatNumber(client.amount)} ريال
                    </span>
                </td>
                <td>${statusBadge}</td>
                <td>${formatDate(client.created_at)}</td>
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
        }

        // تحديث إجمالي المبالغ والإحصائيات
        updateStatistics();

    } catch (error) {
        console.error('Error loading clients:', error);
        showToast('error', 'حدث خطأ أثناء تحميل العملاء');
    }
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

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatNumber(number) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).replace(',', '');
}

// إنشاء نص الرسالة الموحدة للعميل
function createClientMessage(client, lab) {
    return `السلام عليكم ورحمة الله وبركاته
عزيزي العميل ${client.name}
نأمل سداد مستحقات مختبر ${lab.name} بمبلغ ${formatNumber(client.amount)} ريال
مع خالص الشكر والتقدير
قسم عمليات الفسح المركزي`;
}

// نسخ الرسالة إلى الحافظة وإظهار إشعار
async function copyClientMessage(clientId) {
    try {
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select(`
                *,
                labs (
                    name
                )
            `)
            .eq('id', clientId)
            .single();

        if (clientError) throw clientError;

        const message = createClientMessage(client, client.labs);
        await navigator.clipboard.writeText(message);
        showToast('success', 'تم نسخ الرسالة بنجاح');
    } catch (error) {
        console.error('Error copying message:', error);
        showToast('error', 'حدث خطأ أثناء نسخ الرسالة');
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

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    // تهيئة الوضع المظلم
    initTheme();
    
    // التحقق من المصادقة
    await checkAuth();

    // إضافة مستمعي الأحداث لتبديل الأقسام
    const tabLinks = document.querySelectorAll('.list-group-item[data-bs-toggle="list"]');
    tabLinks.forEach(link => {
        link.addEventListener('shown.bs.tab', async (event) => {
            const targetId = event.target.getAttribute('href');
            try {
                switch(targetId) {
                    case '#labsSection':
                        await loadLabs();
                        break;
                    case '#clientsSection':
                        await loadAdminClients();
                        break;
                    case '#auditLogSection':
                        await loadAuditLog();
                        break;
                    case '#backupSection':
                        await loadBackupHistory();
                        await updateLastBackupInfo();
                        initAutoBackupSwitch();
                        break;
                }
            } catch (error) {
                console.error('Error loading section:', error);
                showToast('error', 'حدث خطأ أثناء تحميل البيانات');
            }
        });
    });

    // تحميل البيانات الأولية للقسم النشط
    const activeTab = document.querySelector('.list-group-item.active');
    if (activeTab) {
        activeTab.click();
    } else {
        document.querySelector('.list-group-item').click();
    }
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

// تهيئة القوائم
document.addEventListener('DOMContentLoaded', function() {
    const tabList = document.querySelectorAll('[data-bs-toggle="list"]');
    tabList.forEach(function(tabEl) {
        new bootstrap.Tab(tabEl);
    });
});

// تحديث الأقسام النشطة
function updateActiveSection() {
    const hash = window.location.hash || '#labsSection';
    const tab = document.querySelector(`[href="${hash}"]`);
    if (tab) {
        const bsTab = new bootstrap.Tab(tab);
        bsTab.show();
    }
}

// استمع لتغييرات الهاش في URL
window.addEventListener('hashchange', updateActiveSection);

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    checkAuth();
    updateActiveSection();
});