// ===== Admin Panel State =====
let stores = [];

// ===== Toast System (same pattern as dashboard.js) =====
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== View Switching =====
function showLogin() {
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('adminLogin').style.display = 'flex';
}

function showPanel() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
}

// ===== Session Check =====
// On load: GET /api/admin/session — 401/403 means no admin session -> show the inline login form.
async function checkAdminSession() {
    try {
        const res = await fetch('/api/admin/session');
        if (res.ok) {
            const data = await res.json();
            if (data.success) {
                document.getElementById('adminEmailLabel').textContent = data.email || '';
                showPanel();
                await loadStores();
                return;
            }
        }
        showLogin();
    } catch (_) {
        showLogin();
    }
}

// ===== Login / Logout =====
async function login(event) {
    event.preventDefault();

    const btn = document.getElementById('loginSubmitBtn');
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;

    const errorBox = document.getElementById('loginError');
    errorBox.classList.remove('show');

    if (!email || !password) {
        errorBox.textContent = 'Completá email y contraseña';
        errorBox.classList.add('show');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Ingresando...';

    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            document.getElementById('adminEmailLabel').textContent = data.user?.email || email;
            document.getElementById('adminPassword').value = '';
            showPanel();
            await loadStores();
        } else {
            errorBox.textContent = data.error || 'Email o contraseña incorrectos';
            errorBox.classList.add('show');
        }
    } catch (err) {
        errorBox.textContent = 'Error de conexión. Intentalo de nuevo.';
        errorBox.classList.add('show');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Iniciar sesión';
    }
}

async function logout() {
    try {
        await fetch('/api/admin/logout', { method: 'POST' });
    } catch (_) { /* session is local anyway */ }
    stores = [];
    document.getElementById('adminEmailLabel').textContent = '';
    showLogin();
}

// ===== Stores =====
async function loadStores() {
    const loading = document.getElementById('storesLoading');
    const empty = document.getElementById('storesEmpty');
    loading.style.display = 'block';
    empty.style.display = 'none';

    try {
        const res = await fetch('/api/admin/stores');
        if (res.status === 401 || res.status === 403) {
            // Session expired or revoked — back to the login form
            showLogin();
            return;
        }
        const data = await res.json();
        if (data.success) {
            stores = data.data;
            renderStores();
        } else {
            showToast(data.error || 'Error al cargar las tiendas', 'error');
        }
    } catch (err) {
        showToast('Error de conexión al cargar las tiendas', 'error');
    } finally {
        loading.style.display = 'none';
    }
}

// Derived status labels (server sends 'active'|'warning'|'expired'|'inactive' in subscription.status)
const STATUS_LABELS = {
    active: 'Activa',
    warning: 'Por vencer',
    expired: 'Vencida',
    inactive: 'Sin fecha'
};

function renderStores() {
    const tbody = document.getElementById('storesTableBody');
    const empty = document.getElementById('storesEmpty');
    tbody.innerHTML = '';

    if (!stores.length) {
        empty.style.display = 'block';
        return;
    }

    for (const store of stores) {
        const sub = store.subscription || {};
        const status = sub.status || 'inactive';
        const label = STATUS_LABELS[status] || status;
        const expiresAt = sub.expires_at || '—';
        const days = sub.days_remaining;
        const daysText = status === 'expired'
            ? '0'
            : (days === null || days === undefined ? '—' : String(days));

        const tr = document.createElement('tr');
        // Red highlight: expired or <=3 days left (design R8; filter arrives in PR3)
        if (status === 'expired' || (days !== null && days !== undefined && days <= 3)) {
            tr.className = 'row-danger';
        }

        tr.innerHTML = `
            <td data-label="Tienda">${escapeHtml(store.name)}</td>
            <td data-label="Slug">${escapeHtml(store.slug)}</td>
            <td data-label="Email dueño">${escapeHtml(store.owner_email || '—')}</td>
            <td data-label="Estado"><span class="status-chip ${status}">${label}</span></td>
            <td data-label="Vence">${escapeHtml(expiresAt)}</td>
            <td data-label="Días restantes">${daysText}</td>
            <td class="actions-cell"><button class="btn btn-secondary btn-sm" disabled title="Disponible próximamente">Activar</button></td>
        `;
        tbody.appendChild(tr);
    }
}

// ===== Init =====
document.getElementById('adminLoginForm').addEventListener('submit', login);
document.addEventListener('DOMContentLoaded', checkAdminSession);
