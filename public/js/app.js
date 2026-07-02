// ===== DATA =====
const products = {
    cheeseburger: { name: 'Cheeseburger', desc: 'Medallón blend premium 120g x2, cheddar milkaut x6 & salsa secret y pan de papa', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2Fd416b7eb-a8ef-4101-bb92-8af3888c7dbc_500x500?alt=media', price: 1600, originalPrice: 2000, discount: true, variants: [{name:'Simple', price:1600}, {name:'Doble', price:1900}] },
    american: { name: 'American Burger', desc: 'Medallón blend premium 120g x2, cheddar milkaut x4, lechuga, tomate & Utah Fry Sauce', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2Fa23b0b08-c559-4e2a-92f1-0b8af3c2014d_500x500?alt=media', price: 1600, variants: [{name:'Simple', price:1600}, {name:'Doble', price:1900}] },
    crispy: { name: 'Crispy Burger', desc: 'Medallón blend premium 120g x2, cheddar milkaut x4, bacon alioli & cebolla crispy', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2F54978726-c181-417f-bc93-a2ac431b6b2f_500x500?alt=media', price: 1730, variants: [{name:'Simple', price:1730}, {name:'Doble', price:2030}] },
    bacon: { name: 'Bacon Burger', desc: 'Medallón blend premium 120g x2, cheddar milkaut x4, pan de papa, tira bacon crujiente x2 & salsa secret', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2F2d0d26bd-f29c-491b-92e1-6ac7c3f9e747_500x500?alt=media', price: 1630, disabled: true, variants: [{name:'Simple', price:1630}, {name:'Doble', price:1930}] },
    lomo: { name: 'Sanguche de Lomo Saltado', desc: 'Lomo saltado y flameado con ingredientes selectos, cebolla tomate salsa especial sobre una cama de queso y lechuga', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2F34446081-88f5-4666-805e-bf36ddae3667_500x500?alt=media', price: 8990, originalPrice: 11237, discount: true },
    chicharron: { name: 'Sanguche de Chicharrón Peruano', desc: 'Trozos de cerdo frito con dedicación equilibrando perfectamente la cebolla y tomate con camote', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2Ff73c0145-b15e-4563-93cf-ac25e07d4e41_500x500?alt=media', price: 8990 },
    pollo: { name: 'Sanguche de Pollo Deshilachado', desc: 'Delicioso pollo, queso, huevo frito, tocino y palta!', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2F274ff7cc-9709-429b-af79-d7547d57c916_500x500?alt=media', price: 6990 },
    salmon: { name: 'Sanguche de Salmón', desc: 'Sanguche que fusiona tradición japonesa y sabor peruano frito al panko sobre una sabrosa tartara', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2Fd4ec9a08-39b8-4601-baa2-f5ac021e1b1e_500x500?alt=media', price: 9990 },
    brasa: { name: 'Sanguche de Pollo a la Brasa', desc: 'Pollo a la brasa con lechuga tomate y salsa de la casa', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2F4a7a9d54-61bd-49a0-82f6-51036d9f55d3_500x500?alt=media', price: 7990 },
    chaufa: { name: 'Arroz Chaufa', desc: '(Pollo, carne o vegetales) Arroz frito salteado al wok cebollín y huevo', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2F34036568-682f-4144-bf50-b4e2e45b3809_500x500?alt=media', price: 6500 },
    fetuccini: { name: 'Fetuccini con Lomo Saltado', desc: 'Fetuccini a la huancaína con lomito saltado jugoso flameado', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2F89a89096-fb9c-4c3d-9e2a-c0f2638c2d5c_500x500?alt=media', price: 9500 },
    chicharron_pollo: { name: 'Chicharrón de Pollo', desc: 'Pollo empanizado y crocante con papas fritas', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2Ffaed2ca3-7934-46e5-88f7-d5a8c20b578f_500x500?alt=media', price: 7500 },
    lomo_saltado: { name: 'Lomo Saltado', desc: 'Deliciosos trozos de lomo flameados, tomate, cebolla, papas fritas, arroz', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2F687d98bd-9e37-478e-bc55-e0d2e5c91d68_500x500?alt=media', price: 8500 },
    muzzarella: { name: 'Pizza Muzzarella', desc: 'Mozzarella, salsa de tomate, orégano y aceitunas verdes.', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2F611ab50a-0f1b-4145-8943-f6d2e4929b20_500x500?alt=media', price: 980, variants: [{name:'Individual', price:980}, {name:'Grande', price:1900}] },
    jamon: { name: 'Pizza de Jamón y Mozzarella', desc: 'Mozzarella, salsa de tomate, jamón cocido en dados, orégano y aceitunas', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2F8efd63bc-e99a-4fc0-a9c1-cba111a7bf08_500x500?alt=media', price: 980, variants: [{name:'Individual', price:980}, {name:'Grande', price:1900}] },
    anchoas: { name: 'Pizza de Mozzarella y Anchoas', desc: 'Mozzarella, salsa de tomate, anchoas, orégano y aceitunas verdes.', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2Fb2123ab1-5de1-4fdf-8990-e0a8a505ee93_500x500?alt=media', price: 1200, variants: [{name:'Individual', price:1200}, {name:'Grande', price:2300}] },
    fugazza: { name: 'Pizza Fugazza', desc: 'Cebolla, aceite de oliva, parmesano en hebras, orégano y aceitunas negras.', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2F67587eb9-ac36-4e56-99f0-98b2c2a1001a_500x500?alt=media', price: 1400, variants: [{name:'Individual', price:1400}, {name:'Grande', price:2500}] },
    emp_jamon: { name: 'Empanada de Jamón y Queso', desc: 'Mozzarella y jamón cortado en dados', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2F5caf8079-e5c6-40bd-a0c6-975648e04b08_500x500?alt=media', price: 450 },
    emp_pollo: { name: 'Empanada de Pollo', desc: 'Pollo, cebolla, pimientos rojos, cebolla de verdeo y huevo duro', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2Fb88a9199-f85c-43c8-9d50-b0fa090539ca_500x500?alt=media', price: 380 },
    emp_carne: { name: 'Empanada de Carne', desc: 'Carne picada, cebolla, cebolla de verdeo, pimientos rojos, huevo duro y salsa', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2Fb5feae87-29a7-4542-ad36-3a7db8542157_500x500?alt=media', price: 380 },
    emp_mostaza: { name: 'Empanada Abierta de Jamón a la Mostaza', desc: 'Mozzarella, cebolla salteada con mostaza, jamón cocido y huevo duro.', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2Fed6528e9-6a6a-41cf-bda7-1aeacd62350b_500x500?alt=media', price: 400 },
    coca_15: { name: 'Coca 1.5L', desc: '', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2Ffa781025-492d-465d-bfc2-332c9b40a32d_500x500?alt=media', price: 450 },
    sprite_15: { name: 'Sprite 1.5L', desc: '', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2F8ea9b527-9541-4f2f-becb-ece644b32c99_500x500?alt=media', price: 450 },
    coca_500: { name: 'Coca 500ml', desc: '', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2F79029085-c734-435a-859c-78ace6e37479_500x500?alt=media', price: 300 },
    sprite_500: { name: 'Sprite 500ml', desc: '', img: 'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2Fa70ae484-d193-4e31-978e-9a723e605dba_500x500?alt=media', price: 350 }
};

let cart = [];
let currentProduct = null;
let currentVariant = 0;
let modalQty = 1;
let selectedExtras = [];
let orderType = 'delivery';
let paymentMethod = 'efectivo';
const DELIVERY_FEE = 100;

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

// Intersection Observer for active category
document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
                const activePill = document.querySelector(`[data-cat="${entry.target.id}"]`);
                if (activePill) activePill.classList.add('active');
            }
        });
    }, { threshold: 0.3 });
    document.querySelectorAll('section[id]').forEach(s => observer.observe(s));
});

// ===== MODAL =====
function openProductModal(id) {
    const p = products[id];
    if (!p) return;
    currentProduct = { ...p, id };
    currentVariant = 0;
    modalQty = 1;
    selectedExtras = [];

    document.getElementById('modalImage').src = p.img;
    document.getElementById('modalImage').alt = p.name;
    document.getElementById('modalTitle').textContent = p.name;
    document.getElementById('modalDesc').textContent = p.desc;
    document.getElementById('modalDiscount').style.display = p.discount ? 'block' : 'none';

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
        img: currentProduct.img,
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
    const p = products[id];
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
        img: p.img,
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

    // Update delivery cost based on order type
    const delivery = orderType === 'delivery' ? DELIVERY_FEE : 0;
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

    if (type === 'delivery') {
        addressGroup.style.display = 'block';
        if (deliveryCost) deliveryCost.textContent = '$' + DELIVERY_FEE;
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

    const delivery = orderType === 'delivery' ? DELIVERY_FEE : 0;
    message += `\nSubtotal: $${total.toLocaleString()}`;
    if (orderType === 'delivery') message += `\nDelivery: $${delivery}`;
    message += `\n*Total: $${(total + delivery).toLocaleString()}*`;

    message += `\n\n━━━ DATOS DEL PEDIDO ━━━`;
    message += `\nTipo: ${orderType === 'delivery' ? 'Delivery' : 'Retiro del local'}`;
    message += `\nNombre: ${name}`;
    message += `\nTeléfono: ${phone}`;
    if (orderType === 'delivery') message += `\nDirección: ${address}`;
    message += `\nPago: ${paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia'}`;

    const url = 'https://api.whatsapp.com/send?phone=5491124091027&text=' + encodeURIComponent(message);
    window.open(url, '_blank');
}

// ===== SHARE =====
function shareMenu() {
    if (navigator.share) {
        navigator.share({
            title: 'Comidas Demostración',
            text: 'Mirá el menú de Comidas Demostración',
            url: window.location.href
        });
    } else {
        const url = 'https://api.whatsapp.com/send?text=' + encodeURIComponent('Mirá el menú de Comidas Demostración: ' + window.location.href);
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
