// ==========================================================
// MEXICAN HEAT - SHARED JAVASCRIPT & FULL CART ENGINE
// ==========================================================

// Global Cart State (persisted with LocalStorage)
let cart = [];

function loadCart() {
  try {
    const saved = localStorage.getItem('mexican_heat_cart');
    if (saved) {
      cart = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading cart from localStorage', e);
    cart = [];
  }
}

function saveCart() {
  try {
    localStorage.setItem('mexican_heat_cart', JSON.stringify(cart));
  } catch (e) {
    console.error('Error saving cart to localStorage', e);
  }
}

// Show Pop-up Side Toast Notification with Product Details
function showToast(message, icon = 'check-circle', itemData = null) {
  let container = document.querySelector('.cart-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'cart-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'cart-toast popup-card';
  
  if (itemData) {
    toast.innerHTML = `
      <img src="${itemData.img}" alt="${itemData.name}" class="toast-item-thumb">
      <div class="toast-content">
        <div class="toast-title-row">
          <span class="toast-badge">✓ Added to Cart</span>
          <span class="toast-time">Just now</span>
        </div>
        <div class="toast-name">${itemData.name}</div>
        <div class="toast-price">₹${itemData.price}</div>
      </div>
      <button class="toast-view-cart-btn" onclick="openCartDrawer()" title="View Cart">
        <i data-lucide="arrow-right" style="width:16px; height:16px;"></i>
      </button>
    `;
  } else {
    toast.innerHTML = `
      <div class="cart-toast-icon"><i data-lucide="${icon}"></i></div>
      <div class="cart-toast-msg">${message}</div>
    `;
  }

  container.appendChild(toast);

  if (window.lucide) {
    lucide.createIcons();
  }

  // Trigger popup slide animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto dismiss after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

function openCartDrawer() {
  const overlay = document.getElementById('cart-drawer-overlay');
  const drawer = document.getElementById('cart-drawer');
  if (overlay && drawer) {
    overlay.classList.add('open');
    drawer.classList.add('open');
  }
}

// Add Item To Cart
function addToCart(name, price, img, qty = 1) {
  // Normalize price to number (strips currency symbol)
  const numPrice = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0;
  const itemImg = img || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&auto=format&fit=crop&q=80';
  
  const existingIndex = cart.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
  if (existingIndex > -1) {
    cart[existingIndex].qty += qty;
  } else {
    cart.push({
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: name.trim(),
      price: numPrice,
      img: itemImg,
      qty: qty
    });
  }

  saveCart();
  updateCartUI();
  
  // Show rich side popup message
  showToast(`Added <strong>${name}</strong> to cart!`, 'check-circle', {
    name: name.trim(),
    price: numPrice,
    img: itemImg
  });

  // Animate badges
  document.querySelectorAll('.cart-count-badge, .floating-badge').forEach(badge => {
    badge.classList.remove('bump');
    void badge.offsetWidth; // trigger reflow
    badge.classList.add('bump');
    setTimeout(() => badge.classList.remove('bump'), 300);
  });
}

// Update Item Quantity
function updateItemQty(index, change) {
  if (!cart[index]) return;
  cart[index].qty += change;
  if (cart[index].qty <= 0) {
    const removedName = cart[index].name;
    cart.splice(index, 1);
    showToast(`Removed <strong>${removedName}</strong>`, 'trash-2');
  }
  saveCart();
  updateCartUI();
}

// Remove Item Directly
function removeItem(index) {
  if (!cart[index]) return;
  const removedName = cart[index].name;
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
  showToast(`Removed <strong>${removedName}</strong> from cart`, 'trash-2');
}

// Clear entire cart
function clearCart() {
  if (cart.length === 0) return;
  if (confirm('Are you sure you want to empty your order cart?')) {
    cart = [];
    saveCart();
    updateCartUI();
    showToast('Cart cleared', 'info');
  }
}

// Calculate totals
function getCartSummary() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const taxes = Math.round(subtotal * 0.05); // 5% GST
  const delivery = subtotal > 0 ? (subtotal > 500 ? 0 : 40) : 0;
  const grandTotal = subtotal + taxes + delivery;
  return { count, subtotal, taxes, delivery, grandTotal };
}

// Update Cart Modal / Badges UI
function updateCartUI() {
  const summary = getCartSummary();

  // Badges
  document.querySelectorAll('.cart-count-badge').forEach(el => {
    el.textContent = summary.count;
  });
  document.querySelectorAll('.floating-badge').forEach(el => {
    el.textContent = summary.count;
  });

  // Cart List in Drawer
  const itemsContainer = document.getElementById('cart-items-list');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const cartTaxEl = document.getElementById('cart-tax');
  const cartDeliveryEl = document.getElementById('cart-delivery');
  const cartTotalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('cart-checkout-btn');

  if (!itemsContainer) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <i data-lucide="shopping-bag"></i>
        <h3>Your Cart is Empty</h3>
        <p>Explore our spicy tacos, burritos, and cocktails to fill it up!</p>
      </div>
    `;
    if (cartSubtotalEl) cartSubtotalEl.textContent = '₹0';
    if (cartTaxEl) cartTaxEl.textContent = '₹0';
    if (cartDeliveryEl) cartDeliveryEl.textContent = '₹0';
    if (cartTotalEl) cartTotalEl.textContent = '₹0';
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.style.opacity = '0.5';
      checkoutBtn.style.cursor = 'not-allowed';
    }
  } else {
    itemsContainer.innerHTML = cart.map((item, index) => `
      <div class="cart-item-card">
        <img src="${item.img}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">₹${item.price}</div>
          <div class="cart-item-qty-controls">
            <button class="qty-btn" onclick="updateItemQty(${index}, -1)" title="Decrease">-</button>
            <span class="qty-number">${item.qty}</span>
            <button class="qty-btn" onclick="updateItemQty(${index}, 1)" title="Increase">+</button>
          </div>
        </div>
        <button class="cart-item-remove-btn" onclick="removeItem(${index})" title="Remove item">
          <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
        </button>
      </div>
    `).join('');

    if (cartSubtotalEl) cartSubtotalEl.textContent = `₹${summary.subtotal}`;
    if (cartTaxEl) cartTaxEl.textContent = `₹${summary.taxes}`;
    if (cartDeliveryEl) cartDeliveryEl.textContent = summary.delivery === 0 ? 'FREE' : `₹${summary.delivery}`;
    if (cartTotalEl) cartTotalEl.textContent = `₹${summary.grandTotal}`;
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.style.opacity = '1';
      checkoutBtn.style.cursor = 'pointer';
    }
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

// Setup Cart Elements (Drawer, Floating Button, etc.) in DOM
function injectCartDOM() {
  if (document.getElementById('cart-drawer')) return;

  const cartHTML = `
    <!-- Floating Cart Button -->
    <button class="floating-cart-btn" id="floating-cart-btn" title="View Cart">
      <i data-lucide="shopping-bag" style="width:24px; height:24px;"></i>
      <span class="floating-badge">0</span>
    </button>

    <!-- Cart Overlay -->
    <div class="cart-drawer-overlay" id="cart-drawer-overlay"></div>

    <!-- Cart Drawer -->
    <aside class="cart-drawer" id="cart-drawer">
      <div class="cart-header">
        <h3><i data-lucide="shopping-bag" style="color:var(--primary); width:22px;"></i> Your Order Cart</h3>
        <button class="cart-close-btn" id="cart-close-btn" title="Close">
          <i data-lucide="x" style="width:18px; height:18px;"></i>
        </button>
      </div>
      
      <div class="cart-items-list" id="cart-items-list">
        <!-- Injected dynamically -->
      </div>

      <div class="cart-footer">
        <div class="cart-summary-row">
          <span>Subtotal</span>
          <span id="cart-subtotal">₹0</span>
        </div>
        <div class="cart-summary-row">
          <span>GST (5%)</span>
          <span id="cart-tax">₹0</span>
        </div>
        <div class="cart-summary-row">
          <span>Delivery</span>
          <span id="cart-delivery">₹0</span>
        </div>
        <div class="cart-summary-row total">
          <span>Grand Total</span>
          <span id="cart-total">₹0</span>
        </div>
        <button class="btn-checkout" id="cart-checkout-btn">
          <i data-lucide="check-circle" style="width:18px;"></i> Place Order Now
        </button>
        <button class="btn-clear-cart" id="btn-clear-cart" onclick="clearCart()">
          <i data-lucide="trash-2" style="width:14px;"></i> Clear Cart
        </button>
      </div>
    </aside>
  `;

  const container = document.createElement('div');
  container.innerHTML = cartHTML;
  document.body.appendChild(container);

  // Bind Drawer Open/Close Events
  const overlay = document.getElementById('cart-drawer-overlay');
  const drawer = document.getElementById('cart-drawer');
  const closeBtn = document.getElementById('cart-close-btn');
  const floatingBtn = document.getElementById('floating-cart-btn');

  function openCart() {
    overlay.classList.add('open');
    drawer.classList.add('open');
  }

  function closeCart() {
    overlay.classList.remove('open');
    drawer.classList.remove('open');
  }

  floatingBtn.addEventListener('click', openCart);
  closeBtn.addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);

  // Checkout Action
  document.getElementById('cart-checkout-btn').addEventListener('click', () => {
    const summary = getCartSummary();
    if (summary.count === 0) return;
    
    alert(`🎉 Order Placed Successfully!\n\nTotal Items: ${summary.count}\nTotal Payable: ₹${summary.grandTotal}\n\nThank you for ordering with Mexican Heat! Your fiery dishes are being prepared.`);
    cart = [];
    saveCart();
    updateCartUI();
    closeCart();
  });
}

// Attach Event Listeners to all "Add to Cart" and "Order Now" buttons on any page
function attachCardButtonListeners() {
  const buttons = document.querySelectorAll('.card-action-btn, .btn-hero-primary');
  
  buttons.forEach(btn => {
    // If it's a link or already configured, handle appropriately
    if (btn.tagName === 'A' && btn.getAttribute('href') && !btn.getAttribute('href').startsWith('#')) {
      return; // Skip normal page links
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const card = btn.closest('.slider-card');
      if (card) {
        const titleEl = card.querySelector('.slider-card-title');
        const priceEl = card.querySelector('.price-tag');
        const imgEl = card.querySelector('.slider-card-img img');

        const name = titleEl ? titleEl.textContent.trim() : 'Mexican Specialty';
        const price = priceEl ? priceEl.textContent.trim() : '₹350';
        const img = imgEl ? imgEl.getAttribute('src') : '';

        addToCart(name, price, img);
      } else {
        // Fallback generic item
        addToCart('Special Chef Dish', 399, '');
      }
    });
  });
}

// Injects Cart Button in Navbar if present
function setupNavbarCartButton() {
  const navActions = document.querySelector('.nav-actions');
  if (navActions && !document.getElementById('nav-cart-btn')) {
    // QR Menu Scanner Button in Navbar
    const qrBtn = document.createElement('button');
    qrBtn.id = 'nav-qr-btn';
    qrBtn.className = 'btn-qr-menu';
    qrBtn.innerHTML = `
      <i data-lucide="qr-code" style="width:16px;"></i> Scan Menu
    `;
    qrBtn.addEventListener('click', openQrModal);

    const cartBtn = document.createElement('button');
    cartBtn.id = 'nav-cart-btn';
    cartBtn.className = 'btn-cart';
    cartBtn.innerHTML = `
      <i data-lucide="shopping-bag" style="width:16px;"></i> Cart
      <span class="cart-count-badge">0</span>
    `;
    cartBtn.addEventListener('click', () => {
      document.getElementById('cart-drawer-overlay').classList.add('open');
      document.getElementById('cart-drawer').classList.add('open');
    });

    navActions.insertBefore(qrBtn, navActions.firstChild);
    navActions.insertBefore(cartBtn, qrBtn.nextSibling);
  }
}

// Open & Close QR Modal
function openQrModal() {
  const modal = document.getElementById('qr-modal-overlay');
  if (modal) {
    modal.classList.add('open');
  }
}

function closeQrModal() {
  const modal = document.getElementById('qr-modal-overlay');
  if (modal) {
    modal.classList.remove('open');
  }
}

// Inject QR Scanner Modal & Floating Scanner Button
function injectQrModalDOM() {
  if (document.getElementById('qr-modal-overlay')) return;

  // Determine current directory URL / tacos menu link
  const currentOrigin = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
  const targetMenuUrl = currentOrigin + 'tacos.html';
  // Use public high-res QR code API to encode the exact menu link
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetMenuUrl)}&margin=10&color=000000&bgcolor=ffffff`;

  const qrHTML = `
    <!-- Floating QR Scanner Button on bottom right -->
    <button class="floating-qr-btn" id="floating-qr-btn" title="Scan Digital Menu QR" onclick="openQrModal()">
      <i data-lucide="qr-code" style="width:24px; height:24px;"></i>
    </button>

    <!-- QR Scanner Modal Overlay -->
    <div class="qr-modal-overlay" id="qr-modal-overlay">
      <div class="qr-modal-card">
        <button class="qr-modal-close-btn" id="qr-modal-close-btn" onclick="closeQrModal()" title="Close">
          <i data-lucide="x" style="width:18px; height:18px;"></i>
        </button>

        <div class="qr-modal-badge">
          <i data-lucide="scan" style="width:14px;"></i> Contactless Digital Menu
        </div>

        <h3>Scan To <span>Open Menu</span></h3>
        <p>Use your phone's camera or Google Lens to scan and view the complete authentic Mexican Heat menu instantly!</p>

        <div class="qr-code-frame">
          <div class="qr-scan-line"></div>
          <img src="${qrApiUrl}" alt="Scan QR Code to Open Menu">
        </div>

        <div class="qr-instruction-box">
          <div class="qr-instruction-icon">📱</div>
          <div>
            <strong>Point Google Lens or Camera</strong>
            <span>Directly opens the full Tacos, Burritos & Drinks menu on your mobile phone.</span>
          </div>
        </div>

        <div class="qr-action-row">
          <a href="tacos.html" class="btn-qr-open-menu">
            <i data-lucide="book-open" style="width:16px;"></i> View Full Menu Online
          </a>
        </div>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = qrHTML;
  document.body.appendChild(container);

  // Close modal when clicking on overlay background
  const overlay = document.getElementById('qr-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeQrModal();
      }
    });
  }

  // Bind any elements with .open-qr-scanner class
  document.querySelectorAll('.open-qr-scanner').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openQrModal();
    });
  });
}


// ==========================================================
// SMOOTH ULTRA-FLUID CONTINUOUS AUTO-SCROLL (INVISIBLE ENGINE)
// ==========================================================
let autoScrollActive = true;
let scrollDirection = 1; // 1 = down, -1 = up
let scrollSpeed = 0.8; // pixels per frame (ultra-smooth)
let userInteracting = false;
let userInteractionTimeout = null;

function initAutoScroll() {
  // Pause briefly only when user manually touches/wheels, then resume automatically
  const handleUserScroll = () => {
    userInteracting = true;
    clearTimeout(userInteractionTimeout);
    userInteractionTimeout = setTimeout(() => {
      userInteracting = false;
    }, 1800);
  };

  window.addEventListener('wheel', handleUserScroll, { passive: true });
  window.addEventListener('touchstart', handleUserScroll, { passive: true });

  // Continuous Seamless Animation Loop
  function autoScrollLoop() {
    if (autoScrollActive && !userInteracting) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      
      if (maxScroll > 10) {
        let current = window.pageYOffset || document.documentElement.scrollTop;

        // When reaching bottom or top, gently pause and reverse
        if (current >= maxScroll - 2 && scrollDirection === 1) {
          scrollDirection = -1;
          userInteracting = true;
          setTimeout(() => { userInteracting = false; }, 2000); // 2s pause at bottom
        } else if (current <= 2 && scrollDirection === -1) {
          scrollDirection = 1;
          userInteracting = true;
          setTimeout(() => { userInteracting = false; }, 1500); // 1.5s pause at top
        } else {
          window.scrollBy(0, scrollDirection * scrollSpeed);
        }
      }
    }
    requestAnimationFrame(autoScrollLoop);
  }

  // Start continuous loop
  setTimeout(() => {
    requestAnimationFrame(autoScrollLoop);
  }, 1000);
}

// ==========================================================
// ULTRA-PREMIUM INTERACTIVE ANIMATION & FX ENGINES
// ==========================================================

// 1. Ambient Mexican Ember Particles Canvas
function initEmberParticles() {
  const canvas = document.createElement('canvas');
  canvas.id = 'fiery-ember-canvas';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const emberColors = ['#FF4500', '#FF6B00', '#FFB703', '#FF2E00', '#FFA500'];
  const particles = [];
  const particleCount = Math.min(width > 768 ? 40 : 18, 45);

  class Ember {
    constructor() {
      this.reset(true);
    }
    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 20;
      this.size = Math.random() * 2.8 + 1.2;
      this.speedY = Math.random() * 0.8 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.6;
      this.opacity = Math.random() * 0.55 + 0.2;
      this.color = emberColors[Math.floor(Math.random() * emberColors.length)];
      this.fadeSpeed = Math.random() * 0.003 + 0.001;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = Math.random() * 0.02 + 0.01;
    }
    update() {
      this.y -= this.speedY;
      this.wobble += this.wobbleSpeed;
      this.x += Math.sin(this.wobble) * 0.5 + this.speedX;
      this.opacity -= this.fadeSpeed;
      if (this.y < -20 || this.opacity <= 0) {
        this.reset();
      }
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(this.opacity, 0);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Ember());
  }

  function animateEmbers() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animateEmbers);
  }
  requestAnimationFrame(animateEmbers);
}

// 2. Interactive Fiery Cursor Follower Glow
function initCursorGlow() {
  const glow = document.createElement('div');
  glow.className = 'custom-cursor-glow';
  document.body.appendChild(glow);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function renderCursor() {
    currentX += (mouseX - currentX) * 0.12;
    currentY += (mouseY - currentY) * 0.12;
    glow.style.left = `${currentX}px`;
    glow.style.top = `${currentY}px`;
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);
}

// 3. 3D Card Parallax Tilt Effect
function init3DTiltCards() {
  const cards = document.querySelectorAll('.slider-card, .info-card, .hero-image-box');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -9;
      const rotateY = ((x - centerX) / centerX) * 9;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  });
}

// 4. Scroll Reveal Animations
function initScrollReveal() {
  const elements = document.querySelectorAll('.section-header, .content-grid-3, .salsa-about-section, .footer-container, .hero-banner');
  
  elements.forEach(el => el.classList.add('reveal-on-scroll'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => observer.observe(el));
}

// 5. Celebration Particle Burst on Cart Add
function createParticleBurst(x, y) {
  const colors = ['#FF4500', '#FFB703', '#FF6B00', '#10B981', '#FFF'];
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('div');
    p.className = 'cart-ripple-particle';
    
    const size = Math.random() * 8 + 6;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const angle = (Math.PI * 2 / 14) * i + (Math.random() - 0.5) * 0.5;
    const dist = Math.random() * 60 + 35;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;

    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.background = color;
    p.style.boxShadow = `0 0 10px ${color}`;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.setProperty('--tx', `${tx}px`);
    p.style.setProperty('--ty', `${ty}px`);
    p.style.setProperty('--target-size', `${size * 0.4}px`);

    document.body.appendChild(p);
    setTimeout(() => p.remove(), 850);
  }
}

// Global Click particle listener for action buttons
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.card-action-btn, .btn-reserve, .btn-hero-primary');
  if (btn) {
    createParticleBurst(e.clientX, e.clientY);
  }
});

// ==========================================================
// INITIALIZATION
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  injectCartDOM();
  injectQrModalDOM();
  setupNavbarCartButton();
  attachCardButtonListeners();
  updateCartUI();
  initAutoScroll();
  
  // Launch Luxury Next-Gen Visual FX
  initEmberParticles();
  initCursorGlow();
  init3DTiltCards();
  initScrollReveal();

  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Active Navigation Link Highlighter based on current filename
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Handle Reservation Forms
  const reservationForm = document.querySelector('form');
  if (reservationForm) {
    reservationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('🎉 Congratulations! Your reservation at Mexican Heat has been confirmed.');
      reservationForm.reset();
    });
  }
});


