/* ============================================
   AMERO — Premium Brand Website
   JavaScript — Cart, Checkout, Interactions
   ============================================ */

// ---------- PRODUCT DATA ----------
const products = [
  {
    id: 1,
    name: 'Premium Old Money Seersucker Striped Shirt',
    desc: 'Chest 46 · Length 28 · Old-money striped seersucker weave. Quality 9.5/10.',
    price: 750,
    icon: 'fa-solid fa-shirt',
    img: 'images/product-1/front.jpg.jpeg',
    images: [
      'images/product-1/front.jpg.jpeg',
      'images/product-1/back.jpg.jpeg',
      'images/product-1/side.jpg.jpeg'
    ],
    sizes: [
      { size: 'L/XXL', stock: 1 }
    ],
  },
  {
    id: 2,
    name: 'Premium Puff-Printed T-Shirt',
    desc: '280 GSM · 100% premium feel puff-print tee.',
    price: 450,
    icon: 'fa-solid fa-shirt',
    img: 'images/product-2/front.jpg.jpeg',
    images: [
      'images/product-2/front.jpg.jpeg',
      'images/product-2/back.jpg.jpeg',
      'images/product-2/side.jpg.jpeg'
    ],
    sizes: [
      { size: 'M', stock: 1 },
      { size: 'L', stock: 1 },
      { size: 'XL', stock: 1 }
    ],
  },
  {
    id: 3,
    name: 'Premium Puff-Printed T-Shirt — Design II',
    desc: '280 GSM · 100% premium feel puff-print tee.',
    price: 450,
    icon: 'fa-solid fa-shirt',
    img: 'images/product-3/front.jpg.jpeg',
    images: [
      'images/product-3/front.jpg.jpeg',
      'images/product-3/back.jpg.jpeg',
      'images/product-3/side.jpg.jpeg'
    ],
    sizes: [
      { size: 'M', stock: 1 },
      { size: 'L', stock: 1 },
      { size: 'XL', stock: 1 }
    ],
  },
  {
    id: 4,
    name: 'Premium Puff-Printed T-Shirt — Spider-Man',
    desc: '280 GSM · 100% premium feel puff-print tee, Spider-Man design.',
    price: 450,
    icon: 'fa-solid fa-shirt',
    img: 'images/product-4/front.jpg.jpg',
    images: [
      'images/product-4/front.jpg.jpg',
      'images/product-4/back.jpg.jpg',
      'images/product-4/side.jpg.jpg'
    ],
    sizes: [
      { size: 'M', stock: 1 },
      { size: 'L', stock: 1 },
      { size: 'XL', stock: 1 }
    ],
  },
  {
    id: 5,
    name: 'Premium Old Money Waffle-Knit Shirt',
    desc: 'Chest 44 · Length 27 · Old-money knitted weave. Quality top notch.',
    price: 800,
    icon: 'fa-solid fa-shirt',
    img: 'images/product-5/front.jpg.jpeg',
    images: [
      'images/product-5/front.jpg.jpeg',
      'images/product-5/close.jpg.jpeg',
      'images/product-5/side.jpg.jpeg'
    ],
    sizes: [
      { size: 'L/XL', stock: 1 }
    ],
  },
  {
    id: 6,
    name: 'Premium Old Money Knitted Shirt',
    desc: 'Chest 42 · Length 26 · Old-money waffle-knit weave. Quality top notch.',
    price: 800,
    icon: 'fa-solid fa-shirt',
    img: 'images/product-6/front.jpg.jpg',
    images: [
      'images/product-6/front.jpg.jpg',
      'images/product-6/close.jpg.jpg',
      'images/product-6/side.jpg.jpg'
    ],
    sizes: [
      { size: 'M/L', stock: 1 }
    ],
  },
];

const CURRENCY = '৳';

// Delivery fees by area — used for the cart's displayed total.
// Matches the options in the checkout form's "Delivery Area" select.
const DELIVERY_FEES = {
  '': 0,
  chittagong: 70,
  outside: 120,
};

// Manual payment methods — customer sends money to this number and
// enters the Transaction ID for you to verify against your bKash/Nagad app.
const PAYMENT_NUMBER = '01880471287';
const PAYMENT_LABELS = {
  cod: 'Cash on Delivery',
  bkash: 'bKash',
  nagad: 'Nagad',
};

// Telegram order notifications — sends you a message the instant
// someone checks out. Note: since this is a public static site, the
// bot token below is technically visible to anyone who views the
// source. Worst case is someone spamming your bot chat; they can't
// access anything else of yours.
const TELEGRAM_BOT_TOKEN = '8892072526:AAE-BrLlQT8Dq0OucJKFIFcNiGTmNhGLhm4';
const TELEGRAM_CHAT_ID = '8623285080';

function sendTelegramNotification(message) {
  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
    }),
  }).catch(err => {
    // Fail silently for the customer — the order confirmation still
    // shows either way. Log it so you can debug from the browser console.
    console.error('Telegram notification failed:', err);
  });
}

// ---------- STATE ----------
let cart = [];
const selectedSizes = {};
let selectedDeliveryArea = ''; // kept in sync with the checkout form's select

// ---------- STOCK ----------
function stockRemaining(productId, size) {
  const product = products.find(p => p.id === productId);
  if (!product) return 0;

  const sizeInfo = product.sizes.find(s => s.size === size);
  if (!sizeInfo) return 0;

  const inCart = cart
    .filter(item => item.id === productId && item.size === size)
    .reduce((sum, item) => sum + item.qty, 0);

  return sizeInfo.stock - inCart;
}

// ---------- DOM REFERENCES ----------
const productsGrid    = document.getElementById('productsGrid');
const cartItemsEl     = document.getElementById('cartItems');
const cartEmptyEl     = document.getElementById('cartEmpty');
const navCartCount    = document.getElementById('navCartCount');
const billingSubtotal = document.getElementById('billingSubtotal');
const billingShipping = document.getElementById('billingShipping');
const billingTotal    = document.getElementById('billingTotal');
const checkoutForm    = document.getElementById('checkoutForm');
const menuToggle      = document.getElementById('menuToggle');
const navLinks        = document.getElementById('navLinks');
const navbar          = document.getElementById('navbar');

// ============================================
// PRODUCT IMAGE GALLERY
// ============================================

let galleryProductId = null;
let galleryIndex = 0;

const galleryModal = document.createElement('div');
galleryModal.id = 'productGalleryModal';
galleryModal.style.cssText = `
  display: none;
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(58, 42, 29, 0.9);
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
`;

galleryModal.innerHTML = `
  <div style="position: relative; width: min(900px, 95vw); max-height: 95vh; text-align: center;">
    <button id="galleryClose" style="position: absolute; right: 0; top: -50px; width: 42px; height: 42px; border: 3px solid #3A2A1D; border-radius: 50%; background: #C1502E; color: #F3E7CE; font-size: 22px; font-weight: 700; line-height: 1; cursor: pointer; box-shadow: 3px 3px 0 #3A2A1D;">&times;</button>
    <button id="galleryPrev" style="position: absolute; left: -16px; top: 45%; width: 46px; height: 46px; border: 3px solid #3A2A1D; border-radius: 50%; background: #E0A73D; color: #3A2A1D; font-size: 22px; line-height: 1; cursor: pointer; box-shadow: 3px 3px 0 #3A2A1D;">&#10094;</button>
    <div style="background: #EFE1C2; border: 4px solid #3A2A1D; border-radius: 8px; padding: 14px; box-shadow: 8px 8px 0 rgba(0,0,0,0.35);">
      <img id="galleryMain" src="" alt="" style="display:block; max-width: 100%; max-height: 68vh; object-fit: contain; margin: 0 auto;">
    </div>
    <button id="galleryNext" style="position: absolute; right: -16px; top: 45%; width: 46px; height: 46px; border: 3px solid #3A2A1D; border-radius: 50%; background: #E0A73D; color: #3A2A1D; font-size: 22px; line-height: 1; cursor: pointer; box-shadow: 3px 3px 0 #3A2A1D;">&#10095;</button>
    <div id="galleryThumbs" style="display: flex; gap: 8px; justify-content: center; overflow-x: auto; margin-top: 18px; padding: 4px;"></div>
    <div id="galleryName" style="color: #F3E7CE; margin-top: 14px; font-size: 18px; font-family: 'Alfa Slab One', serif; letter-spacing: 0.03em; text-shadow: 2px 2px 0 #3A2A1D;"></div>
  </div>
`;

document.body.appendChild(galleryModal);

function updateGallery() {
  const product = products.find(p => p.id === galleryProductId);
  if (!product || !product.images || product.images.length === 0) return;

  const main = document.getElementById('galleryMain');
  const thumbs = document.getElementById('galleryThumbs');
  const name = document.getElementById('galleryName');

  main.src = product.images[galleryIndex];
  main.alt = product.name;
  name.textContent = product.name;

  thumbs.innerHTML = product.images.map((src, i) => `
    <button onclick="selectGalleryImage(${i})" style="width:64px; height:64px; padding:0; border:3px solid ${i === galleryIndex ? '#E0A73D' : 'rgba(58,42,29,0.5)'}; background:#EFE1C2; border-radius:6px; overflow:hidden; cursor:pointer; flex:none;">
      <img src="${src}" alt="" style="width:100%; height:100%; object-fit:cover;">
    </button>
  `).join('');
}

function openGallery(productId) {
  const product = products.find(p => p.id === productId);
  if (!product || !product.images || !product.images.length) return;

  galleryProductId = productId;
  galleryIndex = 0;
  updateGallery();
  galleryModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeGallery() {
  galleryModal.style.display = 'none';
  document.body.style.overflow = '';
}

function selectGalleryImage(index) {
  const product = products.find(p => p.id === galleryProductId);
  if (!product) return;
  if (index < 0 || index >= product.images.length) return;
  galleryIndex = index;
  updateGallery();
}

function nextGalleryImage() {
  const product = products.find(p => p.id === galleryProductId);
  if (!product || !product.images.length) return;
  galleryIndex = (galleryIndex + 1) % product.images.length;
  updateGallery();
}

function previousGalleryImage() {
  const product = products.find(p => p.id === galleryProductId);
  if (!product || !product.images.length) return;
  galleryIndex = (galleryIndex - 1 + product.images.length) % product.images.length;
  updateGallery();
}

document.getElementById('galleryClose').addEventListener('click', closeGallery);
document.getElementById('galleryNext').addEventListener('click', nextGalleryImage);
document.getElementById('galleryPrev').addEventListener('click', previousGalleryImage);

galleryModal.addEventListener('click', function (e) {
  if (e.target === galleryModal) closeGallery();
});

document.addEventListener('keydown', function (e) {
  if (galleryModal.style.display !== 'flex') return;
  if (e.key === 'Escape') closeGallery();
  if (e.key === 'ArrowRight') nextGalleryImage();
  if (e.key === 'ArrowLeft') previousGalleryImage();
});

// ============================================
// RENDER PRODUCTS
// ============================================
function renderProducts() {
  productsGrid.innerHTML = products.map(p => {
    if (!selectedSizes[p.id]) {
      const firstAvailable = p.sizes.find(s => stockRemaining(p.id, s.size) > 0);
      selectedSizes[p.id] = firstAvailable ? firstAvailable.size : p.sizes[0].size;
    }

    const chips = p.sizes.map(s => {
      const remaining = stockRemaining(p.id, s.size);
      const isSelected = selectedSizes[p.id] === s.size;
      return `<button class="size-chip${isSelected ? ' selected' : ''}" onclick="selectSize(${p.id}, '${s.size}')" ${remaining <= 0 ? 'disabled' : ''}>${s.size}</button>`;
    }).join('');

    const anyStockLeft = p.sizes.some(s => stockRemaining(p.id, s.size) > 0);
    const media = p.img ? `<img src="${p.img}" alt="${p.name}" loading="lazy">` : `<i class="${p.icon}"></i>`;
    const imageCount = p.images ? p.images.length : 0;

    return `
      <div class="product-card" data-id="${p.id}">
        <div class="product-img" ${imageCount ? `onclick="openGallery(${p.id})" style="cursor:pointer;"` : ''}>
          ${media}
          ${imageCount > 1 ? `<span style="position:absolute; left:50%; bottom:10px; transform:translateX(-50%); background:rgba(58,42,29,0.8); color:#F3E7CE; padding:6px 10px; border-radius:20px; font-size:12px; font-weight:700; white-space:nowrap; border:1px solid #E0A73D;">View ${imageCount} photos</span>` : ''}
        </div>
        <div class="product-info">
          <span class="stock-badge">Only 1 piece per size</span>
          <h3 class="product-name">${p.name}</h3>
          <p class="product-desc">${p.desc}</p>
          <span class="size-label">Size</span>
          <div class="size-chips">${chips}</div>
          <div class="product-bottom">
            <span class="product-price">${CURRENCY}${p.price.toFixed(0)}</span>
            <button class="btn btn-primary btn-sm" onclick="addToCart(${p.id})" ${anyStockLeft ? '' : 'disabled'}>
              ${anyStockLeft ? 'Add to Cart' : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function selectSize(productId, size) {
  selectedSizes[productId] = size;
  renderProducts();
}

// ============================================
// ADD TO CART
// ============================================
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const size = selectedSizes[productId];
  if (stockRemaining(productId, size) <= 0) return;

  const existing = cart.find(item => item.id === productId && item.size === size);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      size: size,
      name: product.name,
      desc: product.desc,
      price: product.price,
      icon: product.icon,
      img: product.img,
      qty: 1,
    });
  }

  updateCart();
  renderProducts();

  document.getElementById('cart').scrollIntoView({ behavior: 'smooth' });
}

function removeFromCart(productId, size) {
  cart = cart.filter(item => !(item.id === productId && item.size === size));
  updateCart();
  renderProducts();
}

function changeQty(productId, size, delta) {
  const item = cart.find(i => i.id === productId && i.size === size);
  if (!item) return;

  if (delta > 0 && stockRemaining(productId, size) <= 0) return;

  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId, size);
    return;
  }

  updateCart();
  renderProducts();
}

// ============================================
// UPDATE CART
// ============================================
function updateCart() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  navCartCount.textContent = totalItems;

  if (cart.length === 0) {
    cartEmptyEl.classList.add('visible');
    cartItemsEl.style.display = 'none';
  } else {
    cartEmptyEl.classList.remove('visible');
    cartItemsEl.style.display = 'flex';
  }

  cartItemsEl.innerHTML = cart.map(item => {
    const media = item.img
      ? `<img src="${item.img}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`
      : `<i class="${item.icon}"></i>`;
    const canIncrease = stockRemaining(item.id, item.size) > 0;

    return `
      <div class="cart-item" data-id="${item.id}" data-size="${item.size}">
        <div class="cart-item-img">${media}</div>
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name} — Size ${item.size}</div>
          <div class="cart-item-price">${CURRENCY}${item.price.toFixed(0)} each</div>
          <div class="cart-item-subtotal">Subtotal: ${CURRENCY}${(item.price * item.qty).toFixed(0)}</div>
        </div>
        <div class="cart-item-actions">
          <button class="qty-btn" onclick="changeQty(${item.id}, '${item.size}', -1)" aria-label="Decrease quantity">&minus;</button>
          <span class="cart-item-qty">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, '${item.size}', 1)" aria-label="Increase quantity" ${canIncrease ? '' : 'disabled'}>+</button>
          <button class="remove-btn" onclick="removeFromCart(${item.id}, '${item.size}')" aria-label="Remove item">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  updateBilling();
}

// ============================================
// UPDATE BILLING (no tax — subtotal + delivery only)
// ============================================
function updateBilling() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = subtotal > 0 ? (DELIVERY_FEES[selectedDeliveryArea] || 0) : 0;
  const total = subtotal + deliveryFee;

  billingSubtotal.textContent = `${CURRENCY}${subtotal.toFixed(0)}`;
  billingShipping.textContent = deliveryFee > 0 ? `${CURRENCY}${deliveryFee}` : 'Free';
  billingTotal.textContent = `${CURRENCY}${total.toFixed(0)}`;
}

// Keep the cart's shipping/total in sync as soon as the customer
// picks a delivery area on the checkout form below.
const deliveryAreaEl = document.getElementById('deliveryArea');
if (deliveryAreaEl) {
  deliveryAreaEl.addEventListener('change', () => {
    selectedDeliveryArea = deliveryAreaEl.value;
    updateBilling();
  });
}

// Show bKash/Nagad payment instructions + Transaction ID field
// only when one of those methods is selected.
const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
const paymentInstructions = document.getElementById('paymentInstructions');
const paymentInstructionsText = document.getElementById('paymentInstructionsText');

function updatePaymentInstructions() {
  const selected = document.querySelector('input[name="paymentMethod"]:checked');
  const method = selected ? selected.value : 'cod';

  if (method === 'bkash' || method === 'nagad') {
    const label = PAYMENT_LABELS[method];
    paymentInstructionsText.innerHTML = `Send the total amount to <strong>${PAYMENT_NUMBER}</strong> (${label} — Personal/Send Money), then enter the Transaction ID below.`;
    paymentInstructions.style.display = 'block';
  } else {
    paymentInstructions.style.display = 'none';
  }
}

paymentRadios.forEach(radio => radio.addEventListener('change', updatePaymentInstructions));

// ============================================
// CHECKOUT FORM — simple confirmation, no WhatsApp
// ============================================
checkoutForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('custName');
  const phone = document.getElementById('custPhone');
  const address = document.getElementById('custAddress');
  const deliveryArea = document.getElementById('deliveryArea');

  let valid = true;

  // Name
  if (name.value.trim() === '') {
    name.classList.add('error');
    document.getElementById('errName').classList.add('visible');
    valid = false;
  } else {
    name.classList.remove('error');
    document.getElementById('errName').classList.remove('visible');
  }

  // Phone
  const phonePattern = /^01[3-9]\d{8}$/;
  const cleanPhone = phone.value.trim().replace(/\s+/g, '');
  if (!phonePattern.test(cleanPhone)) {
    phone.classList.add('error');
    document.getElementById('errPhone').classList.add('visible');
    valid = false;
  } else {
    phone.classList.remove('error');
    document.getElementById('errPhone').classList.remove('visible');
  }

  // Address
  if (address.value.trim() === '') {
    address.classList.add('error');
    document.getElementById('errAddress').classList.add('visible');
    valid = false;
  } else {
    address.classList.remove('error');
    document.getElementById('errAddress').classList.remove('visible');
  }

  // Delivery area
  if (!deliveryArea || deliveryArea.value === '') {
    if (deliveryArea) deliveryArea.classList.add('error');
    valid = false;
  } else if (deliveryArea) {
    deliveryArea.classList.remove('error');
  }

  // Payment method + Transaction ID (only required for bKash/Nagad)
  const paymentSelected = document.querySelector('input[name="paymentMethod"]:checked');
  const paymentMethod = paymentSelected ? paymentSelected.value : 'cod';
  const txnId = document.getElementById('txnId');

  if (paymentMethod === 'bkash' || paymentMethod === 'nagad') {
    if (!txnId.value.trim()) {
      txnId.classList.add('error');
      document.getElementById('errTxnId').classList.add('visible');
      valid = false;
    } else {
      txnId.classList.remove('error');
      document.getElementById('errTxnId').classList.remove('visible');
    }
  } else if (txnId) {
    txnId.classList.remove('error');
    document.getElementById('errTxnId').classList.remove('visible');
  }

  if (!valid) return;

  if (cart.length === 0) {
    alert('Your cart is empty. Please add a product first.');
    return;
  }

  // Build and send the order notification to Telegram
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = DELIVERY_FEES[deliveryArea.value] || 0;
  const total = subtotal + deliveryFee;
  const deliveryAreaLabel = deliveryArea.value === 'chittagong' ? 'Inside Chittagong' : 'Outside Chittagong';

  const itemLines = cart.map((item, i) =>
    `${i + 1}. ${item.name} — Size ${item.size} × ${item.qty} = ${CURRENCY}${(item.price * item.qty).toFixed(0)}`
  ).join('\n');

  const notesEl = document.getElementById('custNotes');
  const notesLine = notesEl && notesEl.value.trim() ? `\n📝 Notes: ${notesEl.value.trim()}` : '';
  const paymentLine = (paymentMethod === 'bkash' || paymentMethod === 'nagad')
    ? `${PAYMENT_LABELS[paymentMethod]} (Txn ID: ${txnId.value.trim()})`
    : PAYMENT_LABELS[paymentMethod];

  const message =
`🛍️ <b>NEW AMERO ORDER</b>

👤 ${name.value.trim()}
📞 ${cleanPhone}
📍 ${address.value.trim()}
🚚 ${deliveryAreaLabel} (${CURRENCY}${deliveryFee})

🛒 Items:
${itemLines}

💰 Subtotal: ${CURRENCY}${subtotal.toFixed(0)}
💰 Total: ${CURRENCY}${total.toFixed(0)}
💳 Payment: ${paymentLine}${notesLine}`;

  sendTelegramNotification(message);

  // Show a plain thank-you confirmation to the customer.
  document.getElementById('confirmName').textContent = name.value.trim();
  document.getElementById('confirmPhone').textContent = cleanPhone;

  const detailEl = document.getElementById('confirmDetailText');
  if (paymentMethod === 'cod') {
    detailEl.innerHTML = `You'll pay <strong>Cash on Delivery</strong>. We'll contact you at <span id="confirmPhone">${cleanPhone}</span> to confirm delivery details.`;
  } else {
    detailEl.innerHTML = `We've noted your <strong>${PAYMENT_LABELS[paymentMethod]}</strong> payment (Txn ID: ${txnId.value.trim()}). We'll verify it and contact you at <span id="confirmPhone">${cleanPhone}</span> shortly.`;
  }

  checkoutForm.style.display = 'none';
  document.getElementById('orderConfirmation').classList.add('visible');

  cart = [];
  updateCart();
});

// ============================================
// RESET CHECKOUT
// ============================================
function resetCheckout() {
  checkoutForm.reset();
  checkoutForm.style.display = 'flex';
  selectedDeliveryArea = '';
  paymentInstructions.style.display = 'none';
  document.getElementById('orderConfirmation').classList.remove('visible');
  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// MOBILE MENU
// ============================================
menuToggle.addEventListener('click', function () {
  this.classList.toggle('active');
  navLinks.classList.toggle('open');
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', function () {
    menuToggle.classList.remove('active');
    navLinks.classList.remove('open');
  });
});

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================
window.addEventListener('scroll', function () {
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ============================================
// ACTIVE NAV LINK
// ============================================
const sections = document.querySelectorAll('section[id]');

function setActiveNav() {
  const scrollY = window.scrollY + 100;

  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    const link = document.querySelector(`.nav-link[href="#${id}"]`);

    if (link) {
      if (scrollY >= top && scrollY < top + height) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    }
  });
}

window.addEventListener('scroll', setActiveNav);

// ============================================
// MOTION ENHANCEMENTS — scroll reveal + interaction feedback
// (everything below is new; nothing above was changed)
// ============================================

// Track which cart line was just touched, so only that one pulses
// instead of every item flashing on every cart update.
let lastTouchedKey = null;
function markTouched(id, size) {
  lastTouchedKey = `${id}::${size}`;
}

// Scroll-reveal: fade/rise sections and cards into view once,
// the first time they cross into the viewport.
function initScrollReveal() {
  const revealTargets = document.querySelectorAll(
    '.section-header, .product-card, .billing-card, .checkout-form, .brand-quote'
  );

  revealTargets.forEach(el => el.classList.add('reveal'));

  // Stagger the product cards left-to-right, top-to-bottom —
  // one deliberate sequence, not scattered per-element timing.
  document.querySelectorAll('.product-card').forEach((card, i) => {
    card.style.setProperty('--stagger', i);
  });

  if (!('IntersectionObserver' in window)) {
    // Fallback for very old browsers: just show everything.
    revealTargets.forEach(el => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach(el => observer.observe(el));
}

// Re-wrap renderProducts so every re-render (size change, stock
// update) re-applies the reveal/stagger setup to the fresh cards.
const _renderProducts = renderProducts;
renderProducts = function () {
  _renderProducts();
  initScrollReveal();
};

// Re-wrap addToCart to mark which line changed, and to give the
// clicked button a brief success flash instead of an instant cart jump.
const _addToCart = addToCart;
addToCart = function (productId) {
  markTouched(productId, selectedSizes[productId]);
  const btn = document.querySelector(`.product-card[data-id="${productId}"] .btn-primary`);
  _addToCart(productId);
  if (btn) {
    btn.classList.add('added');
    setTimeout(() => btn.classList.remove('added'), 600);
  }
};

// Re-wrap changeQty so quantity edits also mark the touched line.
const _changeQty = changeQty;
changeQty = function (productId, size, delta) {
  markTouched(productId, size);
  _changeQty(productId, size, delta);
};

// Re-wrap updateCart to pulse only the most recently touched line,
// and give its quantity number a quick pop.
const _updateCart = updateCart;
updateCart = function () {
  _updateCart();
  if (lastTouchedKey) {
    const [id, size] = lastTouchedKey.split('::');
    const row = document.querySelector(`.cart-item[data-id="${id}"][data-size="${size}"]`);
    if (row) {
      row.classList.add('just-touched');
      setTimeout(() => row.classList.remove('just-touched'), 450);
      const qtyEl = row.querySelector('.cart-item-qty');
      if (qtyEl) {
        qtyEl.classList.add('pulse');
        setTimeout(() => qtyEl.classList.remove('pulse'), 280);
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', initScrollReveal);

// ============================================
// INIT
// ============================================
renderProducts();
updateCart();
