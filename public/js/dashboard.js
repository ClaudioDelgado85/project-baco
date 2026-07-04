// ===== Dashboard State =====
let storeData = null;
let products = [];
let categories = [];
let editingProductId = null;

// ===== API Wrapper =====
async function api(path, options = {}) {
    const res = await fetch(path, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json();
    if (!res.ok && res.status === 401) {
        window.location.href = '/login';
        return data;
    }
    return { status: res.status, ...data };
}

// ===== Toast System =====
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

// ===== Tab Switching =====
function switchTab(tab) {
    document.querySelectorAll('.topbar-nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

    const btn = document.querySelector(`[data-tab="${tab}"]`);
    if (btn) btn.classList.add('active');

    const panel = document.getElementById(`${tab}Panel`);
    if (panel) panel.classList.add('active');

    if (tab === 'products') renderProducts();
    if (tab === 'settings') loadSettings();
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
    // Check auth
    const me = await api('/api/auth/me');
    if (!me.success) return;

    // Load data
    const [storeRes, productsRes, categoriesRes] = await Promise.all([
        api('/api/dashboard/store'),
        api('/api/dashboard/products'),
        api('/api/dashboard/categories')
    ]);

    if (storeRes.success) storeData = storeRes.data;
    if (productsRes.success) products = productsRes.data;
    if (categoriesRes.success) categories = categoriesRes.data;

    // Activate products tab by default
    switchTab('products');
});

// ===== Product List =====
function renderProducts() {
    const tbody = document.getElementById('productsTableBody');
    const empty = document.getElementById('productsEmpty');
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = products.map(p => `
        <tr>
            <td class="product-name-cell">${escapeHtml(p.name)}</td>
            <td class="product-category-cell">${escapeHtml(p.category_name || '—')}</td>
            <td class="product-price-cell">$${(p.price || 0).toLocaleString()}</td>
            <td class="actions-cell">
                <button class="btn btn-secondary btn-sm" onclick="editProduct(${p.id})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete(${p.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== Product Create Modal =====
function openCreateModal() {
    editingProductId = null;
    document.getElementById('modalTitle').textContent = 'Agregar producto';
    document.getElementById('productForm').reset();
    document.getElementById('productIdField').value = '';

    // Populate category dropdown
    populateCategorySelect(document.getElementById('categorySelect'));

    // Clear variants
    document.getElementById('variantsContainer').innerHTML = '';

    document.getElementById('productModal').classList.add('open');
}

function populateCategorySelect(select) {
    select.innerHTML = '<option value="">Seleccionar categoría</option>';
    categories.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${escapeHtml(c.name)}</option>`;
    });
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('open');
    editingProductId = null;
}

// ===== Product Edit =====
async function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;
    document.getElementById('modalTitle').textContent = 'Editar producto';
    document.getElementById('productIdField').value = id;
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productDesc').value = product.description || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productOriginalPrice').value = product.original_price || '';
    document.getElementById('productHasDiscount').checked = !!product.has_discount;
    document.getElementById('productImageUrl').value = product.image_url || '';

    populateCategorySelect(document.getElementById('categorySelect'));
    document.getElementById('categorySelect').value = product.category_id || '';

    // Render variants
    const variants = product.variants || [];
    renderVariants(variants);

    document.getElementById('productModal').classList.add('open');
}

// ===== Variants =====
function renderVariants(variants = []) {
    const container = document.getElementById('variantsContainer');
    if (variants.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Sin variantes. Agregá opciones como talle o tamaño.</p>';
        return;
    }
    container.innerHTML = variants.map((v, i) => `
        <div class="variant-row" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
            <input type="text" class="variant-name" value="${escapeHtml(v.name)}" placeholder="Ej: Simple" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:inherit;outline:none;">
            <input type="number" class="variant-price" value="${v.price}" placeholder="$$$" style="width:100px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:inherit;outline:none;">
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()" style="padding:6px 10px;">×</button>
        </div>
    `).join('');
}

function addVariant() {
    const container = document.getElementById('variantsContainer');
    const emptyText = container.querySelector('p');
    if (emptyText) container.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'variant-row';
    row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';
    row.innerHTML = `
        <input type="text" class="variant-name" placeholder="Ej: Simple" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:inherit;outline:none;">
        <input type="number" class="variant-price" placeholder="$$$" style="width:100px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:inherit;outline:none;">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()" style="padding:6px 10px;">×</button>
    `;
    container.appendChild(row);
    row.querySelector('.variant-name').focus();
}

function collectVariants() {
    const rows = document.querySelectorAll('.variant-row');
    const variants = [];
    rows.forEach(row => {
        const name = row.querySelector('.variant-name').value.trim();
        const price = parseInt(row.querySelector('.variant-price').value);
        if (name && !isNaN(price)) {
            variants.push({ name, price });
        }
    });
    return variants.length > 0 ? variants : null;
}

// ===== Product Save =====
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('productIdField').value;
    const isEdit = !!id;

    const body = {
        name: document.getElementById('productName').value.trim(),
        description: document.getElementById('productDesc').value.trim(),
        price: parseInt(document.getElementById('productPrice').value),
        category_id: document.getElementById('categorySelect').value || null,
        image_url: document.getElementById('productImageUrl').value.trim(),
        has_discount: document.getElementById('productHasDiscount').checked,
        original_price: document.getElementById('productOriginalPrice').value ? parseInt(document.getElementById('productOriginalPrice').value) : null,
        variants_json: collectVariants() ? JSON.stringify(collectVariants()) : null
    };

    if (!body.name) { showToast('El nombre del producto es obligatorio', 'error'); return; }
    if (!body.price || isNaN(body.price)) { showToast('El precio es obligatorio', 'error'); return; }

    const url = isEdit ? `/api/dashboard/products/${id}` : '/api/dashboard/products';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await api(url, { method, body });

    if (res.success) {
        showToast(isEdit ? 'Producto actualizado' : 'Producto creado');
        closeProductModal();
        // Refresh products
        const fresh = await api('/api/dashboard/products');
        if (fresh.success) products = fresh.data;
        renderProducts();
    } else if (res.status === 403) {
        showToast('No tenés permiso para modificar este producto', 'error');
    } else {
        showToast(res.error || 'Error al guardar el producto', 'error');
    }
});

// ===== Product Delete =====
let pendingDeleteId = null;

function confirmDelete(id) {
    pendingDeleteId = id;
    const product = products.find(p => p.id === id);
    document.getElementById('deleteProductName').textContent = product ? `"${product.name}"` : 'este producto';
    document.getElementById('deleteModal').classList.add('open');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('open');
    pendingDeleteId = null;
}

async function confirmDeleteAction() {
    if (!pendingDeleteId) return;

    const res = await api(`/api/dashboard/products/${pendingDeleteId}`, { method: 'DELETE' });

    if (res.success) {
        showToast('Producto eliminado');
        closeDeleteModal();
        const fresh = await api('/api/dashboard/products');
        if (fresh.success) products = fresh.data;
        renderProducts();
    } else if (res.status === 403) {
        showToast('No tenés permiso para eliminar este producto', 'error');
        closeDeleteModal();
    } else {
        showToast(res.error || 'Error al eliminar', 'error');
        closeDeleteModal();
    }
}

// ===== Settings =====
async function loadSettings() {
    const res = await api('/api/dashboard/store');
    if (!res.success) {
        showToast('Error al cargar los datos de la tienda', 'error');
        return;
    }

    const store = res.data;
    storeData = store;
    document.getElementById('storeName').value = store.name || '';
    document.getElementById('storeSlug').value = store.slug || '';
    document.getElementById('storeAddress').value = store.address || '';
    document.getElementById('storeWhatsapp').value = store.whatsapp_number || '';
    document.getElementById('storeInstagram').value = store.instagram_url || '';
    document.getElementById('storeDeliveryFee').value = store.delivery_fee || '';
    document.getElementById('storeLogoUrl').value = store.logo_url || '';
    document.getElementById('storeCoverUrl').value = store.cover_url || '';
}

document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const body = {
        name: document.getElementById('storeName').value.trim(),
        slug: document.getElementById('storeSlug').value.trim(),
        address: document.getElementById('storeAddress').value.trim(),
        whatsapp_number: document.getElementById('storeWhatsapp').value.trim(),
        instagram_url: document.getElementById('storeInstagram').value.trim(),
        delivery_fee: document.getElementById('storeDeliveryFee').value ? parseInt(document.getElementById('storeDeliveryFee').value) : null,
        logo_url: document.getElementById('storeLogoUrl').value.trim(),
        cover_url: document.getElementById('storeCoverUrl').value.trim()
    };

    const res = await api('/api/dashboard/store', {
        method: 'PUT',
        body
    });

    if (res.success) {
        showToast('Datos de la tienda actualizados');
        storeData = res.data;
    } else if (res.status === 409) {
        showToast('El slug ya está en uso por otra tienda', 'error');
    } else {
        showToast(res.error || 'Error al actualizar la tienda', 'error');
    }
});

// ===== Logout =====
async function logout() {
    const res = await api('/api/auth/logout', { method: 'POST' });
    if (res.success) {
        window.location.href = '/login';
    }
}

// ===== Modal click outside =====
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
    }
});

// ===== Keyboard Escape =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
});
