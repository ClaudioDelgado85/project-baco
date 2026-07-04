// ===== STORE DATA =====
let storeData = null;

// ===== THEMES =====
const THEMES = [
  { // 0 — Naranja clásico
    name: 'Naranja clásico',
    bg: '#1a1a1a', bgCard: '#2a2a3e', bgElevated: '#353555',
    text: '#ffffff', textMuted: '#a0a0b8', textDim: '#6b6b8a',
    primary: '#FF6B35', primaryDark: '#E55A2B'
  },
  { // 1 — Verde fresco
    name: 'Verde fresco',
    bg: '#1a3320', bgCard: '#24442a', bgElevated: '#2e5535',
    text: '#ffffff', textMuted: '#a0b8a8', textDim: '#6b8a76',
    primary: '#2ecc71', primaryDark: '#27ae60'
  },
  { // 2 — Azul marino
    name: 'Azul marino',
    bg: '#1a2744', bgCard: '#243658', bgElevated: '#2e456c',
    text: '#ffffff', textMuted: '#a0b0c0', textDim: '#6b7a90',
    primary: '#3498db', primaryDark: '#2980b9'
  },
  { // 3 — Borgoña
    name: 'Borgoña',
    bg: '#2c1010', bgCard: '#3c1a1a', bgElevated: '#4c2424',
    text: '#ffffff', textMuted: '#b8a0a0', textDim: '#8a6b6b',
    primary: '#c0392b', primaryDark: '#a93226'
  },
  { // 4 — Dark Tiffany
    name: 'Dark Tiffany',
    bg: '#171717', bgCard: '#252535', bgElevated: '#303050',
    text: '#ffffff', textMuted: '#a0a0b8', textDim: '#6b6b8a',
    primary: '#21F1A8', primaryDark: '#1ad096'
  },
  { // 5 — White Pink
    name: 'White Pink',
    bg: '#FFF9FA', bgCard: '#ffffff', bgElevated: '#f5eef0',
    text: '#1a1a1a', textMuted: '#6b6b7a', textDim: '#a0a0b0',
    primary: '#FD1843', primaryDark: '#e0153a'
  },
  { // 6 — Sand Cyprus
    name: 'Sand Cyprus',
    bg: '#F0EDE4', bgCard: '#ffffff', bgElevated: '#e6e2d8',
    text: '#1a1a1a', textMuted: '#6b6b6b', textDim: '#a0a0a0',
    primary: '#004741', primaryDark: '#003530'
  },
  { // 7 — Mantis Milky
    name: 'Mantis Milky',
    bg: '#FFFDF1', bgCard: '#ffffff', bgElevated: '#f8f4e8',
    text: '#1a1a1a', textMuted: '#6b6b6b', textDim: '#a0a0a0',
    primary: '#59C759', primaryDark: '#4ab04a'
  },
  { // 8 — Malt Turmeric
    name: 'Malt Turmeric',
    bg: '#2A2312', bgCard: '#3a3322', bgElevated: '#4a4332',
    text: '#ffffff', textMuted: '#b0a890', textDim: '#8a826a',
    primary: '#FFBE0B', primaryDark: '#e0a800'
  },
  { // 9 — Bridal Tone
    name: 'Bridal Tone',
    bg: '#FFC6A8', bgCard: '#ffffff', bgElevated: '#f5ba9a',
    text: '#1a1a1a', textMuted: '#6b5a50', textDim: '#a09080',
    primary: '#741A2F', primaryDark: '#601527'
  }
];

function applyTheme(themeId) {
  const theme = THEMES[themeId] || THEMES[0];
  const root = document.documentElement;
  root.style.setProperty('--bg', theme.bg);
  root.style.setProperty('--bg-card', theme.bgCard);
  root.style.setProperty('--bg-elevated', theme.bgElevated);
  root.style.setProperty('--text', theme.text);
  root.style.setProperty('--text-muted', theme.textMuted);
  root.style.setProperty('--text-dim', theme.textDim);
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--primary-dark', theme.primaryDark);
}

let cart = [];
let currentProduct = null;
let currentVariant = 0;
let modalQty = 1;
let selectedExtras = [];
let orderType = 'delivery';
let paymentMethod = 'efectivo';

// ===== STORE INIT =====
async function initStore() {
    const pathParts = window.location.pathname.split('/');
    const slug = pathParts[2]; // /s/:slug → index 2

    if (!slug) {
        document.body.innerHTML = '<div style="padding:2rem;text-align:center;"><h2>Tienda no encontrada</h2><p>El enlace que ingresaste no corresponde a ninguna tienda.</p></div>';
        return;
    }

    const skeleton = document.getElementById('loading-skeleton');

    try {
        const res = await fetch(`/api/public/store/${slug}`);
        if (!res.ok) {
            throw new Error('Store not found');
        }
        const data = await res.json();
        storeData = data;

        applyTheme(data.store.theme_id);
        renderStoreProfile(data.store);
        renderHours(data.store.hours_json);
        renderCategories(data.categories);
        renderProducts(data.categories, data.products);

        if (skeleton) skeleton.style.display = 'none';

        // Re-attach IntersectionObserver after dynamic render
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
                    const activePill = document.querySelector(`[data-cat="cat-${entry.target.dataset.catId}"]`);
                    if (activePill) activePill.classList.add('active');
                }
            });
        }, { threshold: 0.3 });
        document.querySelectorAll('section[data-cat-id]').forEach(s => observer.observe(s));

    } catch (err) {
        if (skeleton) skeleton.style.display = 'none';
        document.body.innerHTML = '<div style="padding:2rem;text-align:center;font-family:sans-serif;"><h2>Tienda no encontrada</h2><p>El enlace que ingresaste no corresponde a ninguna tienda disponible.</p></div>';
    }
}

// ===== RENDER STORE PROFILE =====
function renderStoreProfile(store) {
    const heroImage = document.getElementById('heroImage');
    if (heroImage) {
        heroImage.src = store.cover_url || store.logo_url || heroImage.src;
    }

    const profileLogo = document.querySelector('.profile-logo');
    if (profileLogo) {
        profileLogo.src = store.logo_url || 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Flogo_512x512?alt=media';
    }

    const profileName = document.querySelector('.profile-name');
    if (profileName) profileName.textContent = store.name || '';

    const profileAddress = document.querySelector('.profile-address');
    if (profileAddress) {
        profileAddress.innerHTML = `
            <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${store.address || ''}
        `;
    }

    const deliveryPrice = document.querySelector('.delivery-price');
    if (deliveryPrice) {
        deliveryPrice.textContent = store.delivery_fee ? '$' + store.delivery_fee.toLocaleString() : 'Gratis';
    }

    const whatsappBtn = document.querySelector('.action-btn.primary');
    if (whatsappBtn && store.whatsapp_number) {
        whatsappBtn.href = `https://api.whatsapp.com/send?phone=${store.whatsapp_number}`;
    }

    const instagramBtn = document.querySelector('.action-btn.secondary');
    if (instagramBtn && store.instagram_url) {
        instagramBtn.href = store.instagram_url;
    }
}

// ===== RENDER CATEGORIES =====
function renderCategories(categories) {
    const scroll = document.querySelector('.category-scroll');
    if (!scroll) return;

    scroll.innerHTML = categories.map((cat, i) => `
        <button class="category-pill ${i === 0 ? 'active' : ''}" data-cat="cat-${cat.id}" onclick="scrollToCategory('cat-${cat.id}')">${cat.name}</button>
    `).join('');
}

// ===== RENDER PRODUCTS =====
function renderProducts(categories, products) {
    const container = document.getElementById('products-container');
    if (!container) return;

    const catIds = categories.map(c => c.id);
    const grouped = categories.map(cat => {
        const catProducts = products.filter(p => p.category_id === cat.id);
        return { ...cat, products: catProducts };
    });

    // Products whose category doesn't exist in this store (orphans)
    const orphans = products.filter(p => !catIds.includes(p.category_id));

    const sections = grouped
        .filter(g => g.products.length > 0)
        .map(g => `
            <section id="cat-${g.id}" data-cat-id="${g.id}">
                <h2 class="section-title">${g.name}</h2>
                <div class="products-grid">
                    ${g.products.map((p, idx) => renderProductCard(p, idx)).join('')}
                </div>
            </section>
        `);

    // Show orphan products in their own section if any exist
    if (orphans.length > 0) {
        sections.push(`
            <section>
                <h2 class="section-title">Productos</h2>
                <div class="products-grid">
                    ${orphans.map((p, idx) => renderProductCard(p, idx)).join('')}
                </div>
            </section>
        `);
    }

    container.innerHTML = sections.join('') || '<p style="text-align:center;padding:2rem;color:#888;">No hay productos disponibles</p>';
}

function renderProductCard(p, idx) {
    const stagger = (idx % 4) + 1;
    const disabledClass = p.is_disabled ? ' disabled' : '';
    const onClickAttr = p.is_disabled ? 'onclick="event.preventDefault()"' : `onclick="openProductModal(${p.id})"`;

    const discountBadge = p.has_discount ? `<span class="discount-badge">OFERTA</span>` : '';

    const variantsRow = p.variants && p.variants.length > 0
        ? `<div class="variants-row">${p.variants.map(v => `<span class="variant-chip">${v.name} <strong>$${v.price.toLocaleString()}</strong></span>`).join('')}</div>`
        : '';

    const priceBlock = p.has_discount && p.original_price
        ? `<div class="price-block"><span class="price-original">$${p.original_price.toLocaleString()}</span><span class="price-current">$${p.price.toLocaleString()}</span></div>`
        : `<span class="price-current dark">$${p.price.toLocaleString()}</span>`;

    const addButton = p.is_disabled
        ? `<span class="out-of-stock">Sin stock</span>`
        : `<button class="add-btn" onclick="event.stopPropagation(); quickAdd(${p.id})"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>`;

    const imageStyle = p.is_disabled ? ' style="filter: grayscale(0.6);"' : '';

    return `
        <div class="product-card${disabledClass} fade-in stagger-${stagger}" ${onClickAttr}>
            <div class="product-image-wrap">
                <img src="${p.image_url || ''}" alt="${p.name}" class="product-image"${imageStyle}>
                ${discountBadge}
            </div>
            <div class="product-info">
                <div>
                    <h3 class="product-name">${p.name}</h3>
                    ${p.description ? `<p class="product-desc">${p.description}</p>` : ''}
                    ${variantsRow}
                </div>
                <div class="product-footer">
                    ${priceBlock}
                    ${addButton}
                </div>
            </div>
        </div>
    `;
}

// ===== STATUS =====
function checkStatus() {
    const badge = document.getElementById('statusBadge');
    const text = document.getElementById('statusText');
    if (!badge || !text) return;
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();
    const time = hour * 100 + min;
    const isOpen = (time >= 900 && time <= 1630) || (time >= 1900 && time <= 100);
    if (isOpen) {
        badge.classList.add('open');
        text.textContent = 'ABIERTO';
    }
}

// ===== HOURS =====
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function renderHours(hoursJson) {
    const section = document.getElementById('hoursSection');
    const todayEl = document.getElementById('todayHours');
    const detail = document.getElementById('hoursDetail');
    if (!section || !todayEl || !detail) return;

    if (!hoursJson) { section.style.display = 'none'; return; }

    let hours;
    try { hours = typeof hoursJson === 'string' ? JSON.parse(hoursJson) : hoursJson; }
    catch (_) { section.style.display = 'none'; return; }

    const keys = Object.keys(hours);
    if (keys.length === 0) { section.style.display = 'none'; return; }

    section.style.display = 'block';

    // Today's hours
    const now = new Date();
    const todayKey = DAY_KEYS[now.getDay()];
    const todayStr = hours[todayKey];
    todayEl.textContent = todayStr || 'Cerrado';

    // Full detail
    detail.innerHTML = DAY_KEYS.map((key, i) => {
        const val = hours[key];
        if (!val) return '';
        return `<p><strong>${DAY_LABELS[i]}:</strong> ${val}</p>`;
    }).filter(Boolean).join('');
}

function toggleHours() {
    const detail = document.getElementById('hoursDetail');
    const arrow = document.getElementById('hoursArrow');
    if (!detail || !arrow) return;
    detail.classList.toggle('open');
    arrow.classList.toggle('open');
}

// ===== CATEGORY NAV =====
function scrollToCategory(cat) {
    document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
    const pill = document.querySelector(`[data-cat="${cat}"]`);
    if (pill) pill.classList.add('active');
    const section = document.getElementById(cat);
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== MODAL =====
function openProductModal(id) {
    if (!storeData) return;
    const p = storeData.products.find(prod => prod.id === id);
    if (!p) return;
    currentProduct = { ...p };
    currentVariant = 0;
    modalQty = 1;
    selectedExtras = [];

    document.getElementById('modalImage').src = p.image_url || '';
    document.getElementById('modalImage').alt = p.name;
    document.getElementById('modalTitle').textContent = p.name;
    document.getElementById('modalDesc').textContent = p.description || '';
    document.getElementById('modalDiscount').style.display = p.has_discount ? 'block' : 'none';

    // Variants
    const variantContainer = document.getElementById('variantOptions');
    if (p.variants && p.variants.length > 0) {
        document.getElementById('modalVariants').style.display = 'block';
        variantContainer.innerHTML = p.variants.map((v, i) => `
            <div class="selector-option ${i === 0 ? 'selected' : ''}" onclick="selectVariant(${i}, this)">
                <span class="option-name">${v.name}</span>
                <div style="display:flex;align-items:center;gap:10px">
                    <span class="option-price">$${v.price.toLocaleString()}</span>
                    <div class="option-check"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div>
                </div>
            </div>
        `).join('');
    } else {
        document.getElementById('modalVariants').style.display = 'none';
    }

    // Reset extras
    document.querySelectorAll('.extra-checkbox').forEach(c => c.classList.remove('checked'));

    updateModalTotal();
    document.getElementById('productModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeProductModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('productModal').classList.remove('open');
    document.body.style.overflow = '';
}

function selectVariant(index, el) {
    currentVariant = index;
    document.querySelectorAll('#variantOptions .selector-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    updateModalTotal();
}

function toggleExtra(el) {
    const checkbox = el.querySelector('.extra-checkbox');
    checkbox.classList.toggle('checked');
    const name = el.querySelector('.extra-name').textContent;
    const price = parseInt(el.querySelector('.extra-price').textContent.replace(/[^0-9]/g, ''));
    if (checkbox.classList.contains('checked')) {
        selectedExtras.push({ name, price });
    } else {
        selectedExtras = selectedExtras.filter(e => e.name !== name);
    }
    updateModalTotal();
}

function changeModalQty(delta) {
    modalQty = Math.max(1, modalQty + delta);
    document.getElementById('modalQty').textContent = modalQty;
    updateModalTotal();
}

function updateModalTotal() {
    let price = currentProduct.price;
    if (currentProduct.variants && currentProduct.variants[currentVariant]) {
        price = currentProduct.variants[currentVariant].price;
    }
    const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
    const total = (price + extrasTotal) * modalQty;
    document.getElementById('modalTotal').textContent = '$' + total.toLocaleString();
}

function addToCart() {
    let price = currentProduct.price;
    let variantName = '';
    if (currentProduct.variants && currentProduct.variants[currentVariant]) {
        price = currentProduct.variants[currentVariant].price;
        variantName = currentProduct.variants[currentVariant].name;
    }
    const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
    const item = {
        id: currentProduct.id + '_' + Date.now(),
        productId: currentProduct.id,
        name: currentProduct.name,
        img: currentProduct.image_url || '',
        variant: variantName,
        extras: [...selectedExtras],
        price: price + extrasTotal,
        qty: modalQty
    };
    cart.push(item);
    updateCart();
    closeProductModal();
    showToast('Producto agregado al carrito');
}

function quickAdd(id) {
    if (!storeData) return;
    const p = storeData.products.find(prod => prod.id === id);
    if (!p) return;
    let price = p.price;
    let variantName = '';
    if (p.variants && p.variants.length > 0) {
        price = p.variants[0].price;
        variantName = p.variants[0].name;
    }
    const item = {
        id: id + '_' + Date.now(),
        productId: id,
        name: p.name,
        img: p.image_url || '',
        variant: variantName,
        extras: [],
        price: price,
        qty: 1
    };
    cart.push(item);
    updateCart();
    showToast('Producto agregado al carrito');
}

// ===== CART =====
function updateCart() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const badge = document.getElementById('cartBadge');
    const barPrice = document.getElementById('cartBarPrice');
    const subtotal = document.getElementById('cartSubtotal');
    const total = document.getElementById('cartTotal');

    if (badge) badge.textContent = totalQty;
    if (barPrice) barPrice.textContent = '$' + totalPrice.toLocaleString();

    const cartBar = document.getElementById('cartBar');
    if (cartBar) {
        if (totalQty > 0) {
            cartBar.classList.add('visible');
        } else {
            cartBar.classList.remove('visible');
        }
    }

    // Render cart items
    const itemsContainer = document.getElementById('cartItems');
    const emptyState = document.getElementById('cartEmpty');
    const footer = document.getElementById('cartDrawerFooter');
    const orderForm = document.getElementById('orderForm');
    const deliveryRow = document.getElementById('deliveryRow');
    const deliveryCost = document.getElementById('deliveryCost');
    if (!itemsContainer || !emptyState || !footer) return;

    // Get delivery fee from store data or default to 0
    const deliveryFee = (storeData && storeData.store && storeData.store.delivery_fee) ? storeData.store.delivery_fee : 0;
    const delivery = orderType === 'delivery' ? deliveryFee : 0;
    if (deliveryRow) deliveryRow.style.display = orderType === 'delivery' ? 'flex' : 'none';
    if (deliveryCost) deliveryCost.textContent = '$' + delivery;

    if (cart.length === 0) {
        emptyState.style.display = 'block';
        itemsContainer.innerHTML = '';
        footer.style.display = 'none';
        if (orderForm) orderForm.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        footer.style.display = 'block';
        if (orderForm) orderForm.style.display = 'block';

        // Update totals with dynamic delivery
        const finalTotal = totalPrice + delivery;
        if (subtotal) subtotal.textContent = '$' + totalPrice.toLocaleString();
        if (total) total.textContent = '$' + finalTotal.toLocaleString();

        itemsContainer.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.img}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    ${item.variant ? `<div class="cart-item-variant">${item.variant}</div>` : ''}
                    ${item.extras.length > 0 ? `<div class="cart-item-extras">${item.extras.map(e => e.name).join(', ')}</div>` : ''}
                    <div class="cart-item-footer">
                        <div class="cart-item-qty">
                            <button class="cart-item-qty-btn" onclick="changeCartQty(${index}, -1)">−</button>
                            <span>${item.qty}</span>
                            <button class="cart-item-qty-btn" onclick="changeCartQty(${index}, 1)">+</button>
                        </div>
                        <span class="cart-item-price">$${(item.price * item.qty).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function changeCartQty(index, delta) {
    cart[index].qty = Math.max(1, cart[index].qty + delta);
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    updateCart();
}

function openCartDrawer() {
    const overlay = document.getElementById('cartDrawerOverlay');
    const drawer = document.getElementById('cartDrawer');
    if (overlay) overlay.classList.add('open');
    if (drawer) drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
    const overlay = document.getElementById('cartDrawerOverlay');
    const drawer = document.getElementById('cartDrawer');
    if (overlay) overlay.classList.remove('open');
    if (drawer) drawer.classList.remove('open');
    document.body.style.overflow = '';
}

// ===== ORDER TYPE =====
function setOrderType(type, el) {
    orderType = type;
    document.querySelectorAll('.radio-group .radio-option').forEach(r => r.classList.remove('selected'));
    el.classList.add('selected');

    const addressGroup = document.getElementById('addressGroup');
    const deliveryCost = document.getElementById('deliveryCost');
    const deliveryFee = (storeData && storeData.store && storeData.store.delivery_fee) ? storeData.store.delivery_fee : 0;

    if (type === 'delivery') {
        addressGroup.style.display = 'block';
        if (deliveryCost) deliveryCost.textContent = '$' + deliveryFee;
    } else {
        addressGroup.style.display = 'none';
        if (deliveryCost) deliveryCost.textContent = '$0';
    }
    updateCart();
}

// ===== PAYMENT METHOD =====
function setPayment(method, el) {
    paymentMethod = method;
    el.parentElement.querySelectorAll('.radio-option').forEach(r => r.classList.remove('selected'));
    el.classList.add('selected');
}

// ===== SEND ORDER =====
function sendOrder() {
    if (cart.length === 0) return;

    const name = document.getElementById('orderName').value.trim();
    const phone = document.getElementById('orderPhone').value.trim();
    const address = document.getElementById('orderAddress').value.trim();

    if (!name) { showToast('Decime tu nombre'); document.getElementById('orderName').focus(); return; }
    if (!phone) { showToast('Decime tu teléfono'); document.getElementById('orderPhone').focus(); return; }
    if (orderType === 'delivery' && !address) { showToast('Decime tu dirección'); document.getElementById('orderAddress').focus(); return; }

    let message = '¡Hola! Quiero hacer un pedido:\n\n';
    let total = 0;
    cart.forEach((item, i) => {
        message += `${i+1}. ${item.name}`;
        if (item.variant) message += ` (${item.variant})`;
        if (item.extras.length > 0) message += ` + ${item.extras.map(e => e.name).join(', ')}`;
        message += ` x${item.qty} - $${(item.price * item.qty).toLocaleString()}\n`;
        total += item.price * item.qty;
    });

    const deliveryFee = (storeData && storeData.store && storeData.store.delivery_fee) ? storeData.store.delivery_fee : 0;
    const delivery = orderType === 'delivery' ? deliveryFee : 0;
    message += `\nSubtotal: $${total.toLocaleString()}`;
    if (orderType === 'delivery') message += `\nDelivery: $${delivery}`;
    message += `\n*Total: $${(total + delivery).toLocaleString()}*`;

    message += `\n\n━━━ DATOS DEL PEDIDO ━━━`;
    message += `\nTipo: ${orderType === 'delivery' ? 'Delivery' : 'Retiro del local'}`;
    message += `\nNombre: ${name}`;
    message += `\nTeléfono: ${phone}`;
    if (orderType === 'delivery') message += `\nDirección: ${address}`;
    message += `\nPago: ${paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia'}`;

    const whatsappNumber = storeData && storeData.store && storeData.store.whatsapp_number
        ? storeData.store.whatsapp_number
        : '5491124091027';
    const url = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=` + encodeURIComponent(message);
    window.open(url, '_blank');
}

// ===== SHARE =====
function shareMenu() {
    const storeName = storeData && storeData.store ? storeData.store.name : 'este local';
    if (navigator.share) {
        navigator.share({
            title: storeName,
            text: `Mirá el menú de ${storeName}`,
            url: window.location.href
        });
    } else {
        const url = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(`Mirá el menú de ${storeName}: ` + window.location.href);
        window.open(url, '_blank');
    }
}

// ===== TOAST =====
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== INIT =====
checkStatus();
updateCart();

// Parallax hero
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroImg = document.getElementById('heroImage');
    if (heroImg && scrolled < 300) {
        heroImg.style.transform = `translateY(${scrolled * 0.3}px) scale(${1 + scrolled * 0.0005})`;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initStore();
});
