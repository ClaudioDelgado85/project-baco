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

// ===== Image Upload Helper =====
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/dashboard/upload', { method: 'POST', body: formData });
    return await res.json();
}

// ===== Image Preview Helpers =====
function setupFilePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;
    input.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
            preview.src = '';
        }
    });
}

function clearFileInput(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (input) input.value = '';
    if (preview) { preview.style.display = 'none'; preview.src = ''; }
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
    if (tab === 'categories') renderCategories();
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

    // Set up file input previews
    setupFilePreview('productImageFile', 'productImagePreview');
    setupFilePreview('logoFile', 'logoPreview');
    setupFilePreview('coverFile', 'coverPreview');

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
            <td class="product-name-cell" data-label="Producto">${escapeHtml(p.name)}</td>
            <td class="product-category-cell" data-label="Categoría">${escapeHtml(p.category_name || '—')}</td>
            <td class="product-price-cell" data-label="Precio">$${(p.price || 0).toLocaleString()}</td>
            <td class="actions-cell" data-label="">
                <button class="btn btn-secondary btn-sm" onclick="editProduct(${p.id})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete(${p.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// ===== Categories List =====
function renderCategories() {
    const tbody = document.getElementById('categoriesTableBody');
    const empty = document.getElementById('categoriesEmpty');
    if (!tbody) return;

    if (categories.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = categories.map(c => `
        <tr>
            <td data-label="Nombre">${escapeHtml(c.name)}</td>
            <td data-label="Orden">${c.order_index || 0}</td>
            <td class="actions-cell" data-label="">
                <button class="btn btn-secondary btn-sm" onclick="editCategory(${c.id})">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCategory(${c.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// ===== Category Modal =====
function openCategoryModal(data) {
    const isEdit = !!data;
    document.getElementById('categoryModalTitle').textContent = isEdit ? 'Editar categoría' : 'Nueva categoría';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryIdField').value = data ? data.id : '';
    document.getElementById('categoryName').value = data ? data.name : '';
    document.getElementById('categoryOrder').value = data ? (data.order_index || 0) : 0;
    document.getElementById('categoryModal').classList.add('open');
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('open');
}

// ===== Category Edit =====
function editCategory(id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    openCategoryModal(cat);
}

// ===== Category Save =====
document.getElementById('categoryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('categoryIdField').value;
    const isEdit = !!id;

    const body = {
        name: document.getElementById('categoryName').value.trim(),
        order_index: parseInt(document.getElementById('categoryOrder').value) || 0
    };

    if (!body.name) { showToast('El nombre de la categoría es obligatorio', 'error'); return; }

    const url = isEdit ? `/api/dashboard/categories/${id}` : '/api/dashboard/categories';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await api(url, { method, body });

    if (res.success) {
        showToast(isEdit ? 'Categoría actualizada' : 'Categoría creada');
        closeCategoryModal();
        const fresh = await api('/api/dashboard/categories');
        if (fresh.success) categories = fresh.data;
        renderCategories();
    } else {
        showToast(res.error || 'Error al guardar la categoría', 'error');
    }
});

// ===== Category Delete =====
async function deleteCategory(id) {
    const cat = categories.find(c => c.id === id);
    if (!confirm(`¿Eliminar la categoría "${cat ? cat.name : ''}"? Los productos no se borrarán, pero quedarán sin categoría.`)) return;

    const res = await api(`/api/dashboard/categories/${id}`, { method: 'DELETE' });

    if (res.success) {
        showToast('Categoría eliminada');
        const fresh = await api('/api/dashboard/categories');
        if (fresh.success) categories = fresh.data;
        renderCategories();
    } else {
        showToast(res.error || 'Error al eliminar', 'error');
    }
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
    clearFileInput('productImageFile', 'productImagePreview');

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
    clearFileInput('productImageFile', 'productImagePreview');

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
        <div class="variant-row" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;flex-wrap:wrap;">
            <input type="text" class="variant-name" value="${escapeHtml(v.name)}" placeholder="Ej: Simple" style="flex:1;min-width:100px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:inherit;outline:none;">
            <input type="number" class="variant-price" value="${v.price}" placeholder="$$$" style="width:90px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:inherit;outline:none;">
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
    row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;flex-wrap:wrap;';
    row.innerHTML = `
        <input type="text" class="variant-name" placeholder="Ej: Simple" style="flex:1;min-width:100px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:inherit;outline:none;">
        <input type="number" class="variant-price" placeholder="$$$" style="width:90px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:inherit;outline:none;">
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

    const fileInput = document.getElementById('productImageFile');
    const imageFile = fileInput.files[0];
    let imageUrl = document.getElementById('productImageUrl').value.trim();

    if (imageFile) {
        const up = await uploadFile(imageFile);
        if (!up.success) {
            showToast(up.error || 'Error al subir la imagen', 'error');
            return;
        }
        imageUrl = up.url;
    }

    const body = {
        name: document.getElementById('productName').value.trim(),
        description: document.getElementById('productDesc').value.trim(),
        price: parseInt(document.getElementById('productPrice').value),
        category_id: document.getElementById('categorySelect').value || null,
        image_url: imageUrl,
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

    // Load theme selector
    populateThemeSelect(document.getElementById('storeTheme'), store.theme_id);
}

document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const logoFileInput = document.getElementById('logoFile');
    const coverFileInput = document.getElementById('coverFile');
    let logoUrl = document.getElementById('storeLogoUrl').value.trim();
    let coverUrl = document.getElementById('storeCoverUrl').value.trim();

    if (logoFileInput.files[0]) {
        const up = await uploadFile(logoFileInput.files[0]);
        if (!up.success) {
            showToast(up.error || 'Error al subir el logo', 'error');
            return;
        }
        logoUrl = up.url;
    }

    if (coverFileInput.files[0]) {
        const up = await uploadFile(coverFileInput.files[0]);
        if (!up.success) {
            showToast(up.error || 'Error al subir la portada', 'error');
            return;
        }
        coverUrl = up.url;
    }

    const themeSelect = document.getElementById('storeTheme');

    const body = {
        name: document.getElementById('storeName').value.trim(),
        slug: document.getElementById('storeSlug').value.trim(),
        address: document.getElementById('storeAddress').value.trim(),
        whatsapp_number: document.getElementById('storeWhatsapp').value.trim(),
        instagram_url: document.getElementById('storeInstagram').value.trim(),
        delivery_fee: document.getElementById('storeDeliveryFee').value ? parseInt(document.getElementById('storeDeliveryFee').value) : null,
        logo_url: logoUrl,
        cover_url: coverUrl,
        theme_id: themeSelect ? parseInt(themeSelect.value) : 0
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

// ===== Theme Selector (same themes as catalog) =====
const DASHBOARD_THEMES = [
  { name: 'Naranja clásico', bg: '#1a1a1a', primary: '#FF6B35' },
  { name: 'Verde fresco', bg: '#1a3320', primary: '#2ecc71' },
  { name: 'Azul marino', bg: '#1a2744', primary: '#3498db' },
  { name: 'Borgoña', bg: '#2c1010', primary: '#c0392b' },
  { name: 'Dark Tiffany', bg: '#171717', primary: '#21F1A8' },
  { name: 'White Pink', bg: '#FFF9FA', primary: '#FD1843' },
  { name: 'Sand Cyprus', bg: '#F0EDE4', primary: '#004741' },
  { name: 'Mantis Milky', bg: '#FFFDF1', primary: '#59C759' },
  { name: 'Malt Turmeric', bg: '#2A2312', primary: '#FFBE0B' },
  { name: 'Bridal Tone', bg: '#FFC6A8', primary: '#741A2F' }
];

function populateThemeSelect(select, selectedId) {
  select.innerHTML = DASHBOARD_THEMES.map((t, i) =>
    `<option value="${i}" ${i === selectedId ? 'selected' : ''}>${t.name}</option>`
  ).join('');
  previewTheme(selectedId ?? 0);
}

function previewTheme(themeId) {
  const theme = DASHBOARD_THEMES[themeId] || DASHBOARD_THEMES[0];
  const header = document.getElementById('tpHeader');
  const card = document.getElementById('tpCard');
  const btn = document.getElementById('tpBtn');
  if (header) {
    header.style.background = theme.bg;
    header.style.color = isLight(theme.bg) ? '#1a1a1a' : '#ffffff';
  }
  if (card) {
    card.style.background = isLight(theme.bg) ? '#ffffff' : '#2a2a3e';
  }
  if (btn) {
    btn.style.background = theme.primary;
    btn.style.color = isLight(theme.primary) ? '#1a1a1a' : '#ffffff';
  }
}

function isLight(hex) {
  if (!hex) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 150;
}

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
