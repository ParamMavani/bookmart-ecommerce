/* ═══════════════════════════════════════════════════════
   BookMart — Frontend SPA  v2.0
   Features: Shop · Cart · Checkout · Orders ·
             Admin Dashboard · Wishlist · Hash Routing
═══════════════════════════════════════════════════════ */
'use strict';

// ── State ─────────────────────────────────────────────────
const state = {
  user:        null,
  cartCount:   0,
  wishlist:    JSON.parse(localStorage.getItem('bm_wishlist') || '[]'),
  currentPage: 'home',
  filters:     { category: '', search: '', sort: 'rating', page: 1, maxPrice: 50 },
  checkout:    { shipping: null, total: 0 },
};

// ── API Helper ─────────────────────────────────────────────
async function api(method, url, body = null) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include' };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(url, opts);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { message: 'Network error. Please try again.' } };
  }
}

// ── Toast ─────────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3200) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = 'toast'; }, duration);
}

// ── Modal ─────────────────────────────────────────────────
function openModal(html) {
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(e) {
  if (!e || e.target.id === 'modal') forceCloseModal();
}
function forceCloseModal() {
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Router ────────────────────────────────────────────────
function navigate(page, params = {}) {
  state.currentPage = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  forceCloseModal();
  window.location.hash = page;
  renderView(page, params);
}

function renderView(page, params = {}) {
  const map = { home: renderHome, shop: renderShop, cart: renderCart,
    checkout: renderCheckout, orders: renderOrders, wishlist: renderWishlist,
    admin: renderAdmin, settings: renderSettings, success: () => renderSuccess(params.orderId) };
  (map[page] || renderHome)();
}

// ── Helpers ───────────────────────────────────────────────
function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function fmtMoney(n) { return '$' + (+n).toFixed(2); }
function fmtDate(d)  { return new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); }
function stars(r)    { r=+r||0; return Array.from({length:5},(_,i)=>i<Math.floor(r)?'★':(i<r?'½':'☆')).join(''); }
function spin(n=8)   { return Array(n).fill('<div class="skeleton skeleton-card"></div>').join(''); }

// ── Auth ──────────────────────────────────────────────────
async function checkAuth() {
  const { data } = await api('GET', '/api/auth/me');
  state.user = data.loggedIn ? data : null;
  refreshNavUI();
  updateCartBadge();
  refreshWishlistBadge();
}

function refreshNavUI() {
  const u = state.user;
  document.getElementById('userLabel').textContent = u ? u.name.split(' ')[0] : 'Sign In';
  document.getElementById('guestLinks').style.display  = u ? 'none' : '';
  document.getElementById('memberLinks').style.display = u ? '' : 'none';
  document.getElementById('adminLink').style.display   = (u?.role === 'admin') ? '' : 'none';
}

async function updateCartBadge() {
  if (!state.user) { setBadge('cartBadge', 0); return; }
  const { data } = await api('GET', '/api/cart');
  const n = (data.items||[]).reduce((s,i)=>s+i.quantity,0);
  state.cartCount = n;
  setBadge('cartBadge', n);
}

function refreshWishlistBadge() { setBadge('wishlistBadge', state.wishlist.length); }

function setBadge(id, n) {
  const b = document.getElementById(id);
  if (!b) return;
  b.textContent  = n;
  b.style.display = n > 0 ? 'flex' : 'none';
}

// ── Auth Modal ────────────────────────────────────────────
function openAuthModal(mode = 'login') {
  const login = mode === 'login';
  openModal(`
    <button class="modal-close" onclick="forceCloseModal()">✕</button>
    <div class="auth-logo">📚 BookMart</div>
    <h2 class="auth-title">${login ? 'Welcome Back' : 'Create Account'}</h2>
    <p class="auth-subtitle">${login ? 'Sign in to access your cart & orders.' : 'Join thousands of book lovers.'}</p>
    <form id="authForm" onsubmit="submitAuth(event,'${mode}')">
      ${!login ? `<div class="form-group"><label>Full Name</label>
        <input type="text" id="authName" placeholder="Jane Doe" required /></div>` : ''}
      <div class="form-group"><label>Email</label>
        <input type="email" id="authEmail" placeholder="you@example.com" required /></div>
      <div class="form-group"><label>Password</label>
        <div class="pass-wrap">
          <input type="password" id="authPass" placeholder="••••••••" required />
          <button type="button" class="pass-toggle" onclick="togglePassVis()">👁</button>
        </div>
      </div>
      <button class="btn-primary" type="submit" id="authBtn">${login ? '→ Sign In' : '→ Create Account'}</button>
    </form>
    <p class="auth-switch">
      ${login ? `No account? <a href="#" onclick="openAuthModal('register')">Sign up free</a>`
              : `Have an account? <a href="#" onclick="openAuthModal('login')">Sign in</a>`}
    </p>
    ${login ? '<p class="auth-demo">Demo: <code>admin@bookmart.com</code> / <code>Admin@1234</code></p>' : ''}
  `);
}

function togglePassVis() {
  const inp = document.getElementById('authPass');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

async function submitAuth(e, mode) {
  e.preventDefault();
  const btn = document.getElementById('authBtn');
  btn.disabled = true; btn.textContent = 'Please wait…';
  const body = { email: document.getElementById('authEmail').value,
                 password: document.getElementById('authPass').value };
  if (mode === 'register') body.name = document.getElementById('authName').value;
  const { ok, status, data } = await api('POST', `/api/auth/${mode}`, body);
  
  if (ok) { 
    forceCloseModal(); await checkAuth(); showToast(data.message, 'success'); 
  } else if (status === 403) {
    btn.disabled = false; btn.textContent = mode === 'login' ? '→ Sign In' : '→ Create Account';
    if (confirm('Your account is currently deactivated. Would you like to reactivate it and log in?')) {
      const reactRes = await api('POST', '/api/auth/reactivate', body);
      if (reactRes.ok) { forceCloseModal(); await checkAuth(); showToast(reactRes.data.message, 'success'); }
      else { showToast(reactRes.data.message || 'Failed to reactivate.', 'error'); }
    }
  } else {
    const msg = data.errors ? data.errors.map(x=>x.msg).join(', ') : (data.message||'Failed.');
    showToast(msg, 'error');
    btn.disabled = false;
    btn.textContent = mode === 'login' ? '→ Sign In' : '→ Create Account';
  }
}

function logout() {
  openModal(`
    <button class="modal-close" onclick="forceCloseModal()">✕</button>
    <div style="text-align:center; padding: 1rem 0;">
      <h2 style="font-family:var(--font-serif); font-size:1.8rem; margin-bottom:0.75rem">Sign Out</h2>
      <p style="color:var(--muted); margin-bottom:2rem; font-size:1.05rem;">Are you sure you want to sign out?</p>
      <div style="display:flex; gap:1rem; justify-content:center">
        <button class="btn-primary" style="width:auto; padding:0.8rem 2.5rem; background:var(--cream); color:var(--ink)" onclick="forceCloseModal()">No</button>
        <button class="btn-primary" style="width:auto; padding:0.8rem 2.5rem" onclick="performLogout()">Yes</button>
      </div>
    </div>
  `);
}

async function performLogout() {
  forceCloseModal();
  await api('POST', '/api/auth/logout');
  state.user = null; state.cartCount = 0;
  refreshNavUI(); setBadge('cartBadge', 0);
  showToast('Signed out.', 'info'); navigate('home');
}

// ── Wishlist ──────────────────────────────────────────────
function toggleWishlist(e, id, title) {
  e.stopPropagation();
  if (!state.user) { openAuthModal('login'); return; }
  const i = state.wishlist.indexOf(id);
  if (i === -1) { state.wishlist.push(id); showToast(`"${title}" saved ♥`, 'success'); }
  else          { state.wishlist.splice(i,1); showToast('Removed from wishlist','info'); }
  localStorage.setItem('bm_wishlist', JSON.stringify(state.wishlist));
  refreshWishlistBadge();
  document.querySelectorAll(`.wish-btn[data-id="${id}"]`).forEach(b => {
    b.classList.toggle('active', state.wishlist.includes(id));
    b.textContent = state.wishlist.includes(id) ? '♥' : '♡';
  });
}

// ── HOME ──────────────────────────────────────────────────
function renderHome() {
  document.getElementById('appRoot').innerHTML = `
    <section class="hero">
      <div class="hero-content">
        <span class="hero-eyebrow">✦ 16 Curated Titles · 6 Categories</span>
        <h1>Books that <em>move</em><br/>the world forward</h1>
        <p>Discover fiction, science, history, and business titles — handpicked for curious minds.</p>
        <div class="hero-btns">
          <button class="btn-hero-primary" onclick="navigate('shop')">Browse Collection →</button>
          <button class="btn-hero-outline" onclick="filterCategory('self-help')">⭐ Best Sellers</button>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><strong>16+</strong><span>Titles</span></div>
          <div class="hero-stat"><strong>6</strong><span>Categories</span></div>
          <div class="hero-stat"><strong>4.5★</strong><span>Avg Rating</span></div>
        </div>
      </div>
    </section>
    <div class="category-strip"><div class="cat-strip-inner" id="catStrip"></div></div>
    <section class="home-section">
      <div class="home-section-header">
        <h2>Top <em>Rated Picks</em></h2>
        <a class="see-all" href="#" onclick="navigate('shop')">See all →</a>
      </div>
      <div class="product-grid" id="featuredGrid">${spin(4)}</div>
    </section>
    <div class="promo-banner">
      <div class="promo-inner">
        <div class="promo-text"><h3>Free shipping on every order</h3><p>No minimum. Always.</p></div>
        <div class="promo-badges"><span>🔒 PayPal Secured</span><span>📦 Free Shipping</span><span>↩️ Easy Returns</span></div>
      </div>
    </div>
    <section class="home-section">
      <div class="home-section-header">
        <h2>New in <em>Science & Tech</em></h2>
        <a class="see-all" href="#" onclick="filterCategory('science-tech')">See all →</a>
      </div>
      <div class="product-grid" id="sciGrid">${spin(4)}</div>
    </section>`;
  loadCatStrip();
  loadHomeSections();
}

async function loadCatStrip() {
  const { data } = await api('GET', '/api/products/categories');
  const strip = document.getElementById('catStrip');
  if (!strip) return;
  const all = document.createElement('button');
  all.className = 'cat-pill active'; all.textContent = 'All Books';
  all.onclick = () => navigate('shop');
  strip.appendChild(all);
  (data.categories||[]).forEach(c => {
    const b = document.createElement('button');
    b.className = 'cat-pill'; b.textContent = c.name;
    b.onclick = () => filterCategory(c.slug);
    strip.appendChild(b);
  });
}

async function loadHomeSections() {
  const [r1, r2] = await Promise.all([
    api('GET', '/api/products?limit=4&sort=rating'),
    api('GET', '/api/products?limit=4&sort=rating&category=science-tech'),
  ]);
  const g1 = document.getElementById('featuredGrid');
  const g2 = document.getElementById('sciGrid');
  if (g1) g1.innerHTML = (r1.data.products||[]).map(productCard).join('');
  if (g2) g2.innerHTML = (r2.data.products||[]).map(productCard).join('');
}

function filterCategory(slug) { state.filters.category = slug; state.filters.page = 1; navigate('shop'); }

// ── SHOP ──────────────────────────────────────────────────
async function renderShop() {
  document.getElementById('appRoot').innerHTML = `
    <div class="shop-wrap">
      <aside class="sidebar">
        <div class="sidebar-card">
          <h3 class="sidebar-title">Categories</h3>
          <ul class="cat-list" id="catList">${spin(1)}</ul>
        </div>
        <div class="sidebar-card">
          <h3 class="sidebar-title">Price Range</h3>
          <div class="price-range">
            <input type="range" min="5" max="50" value="${state.filters.maxPrice}" id="priceFilter"
              oninput="onPriceSlider(this.value)" />
            <div class="price-range-labels"><span>$5</span>
              <span id="priceLabel">Up to $${state.filters.maxPrice}</span></div>
          </div>
        </div>
        <div class="sidebar-card">
          <h3 class="sidebar-title">Wishlist</h3>
          <p style="font-size:.85rem;color:var(--muted)">${state.wishlist.length} saved item${state.wishlist.length!==1?'s':''}</p>
          <button class="btn-sm-outline" onclick="navigate('wishlist')" style="margin-top:.5rem;width:100%">View Wishlist →</button>
        </div>
      </aside>
      <div class="products-area">
        <div class="shop-search-bar">
          <i class="fas fa-search"></i>
          <input id="shopSearch" type="text" placeholder="Search by title, author…"
            value="${escHtml(state.filters.search)}" oninput="onShopSearch(this.value)" />
          ${state.filters.search?'<button class="clear-search" onclick="clearSearch()">✕</button>':''}
        </div>
        <div class="products-toolbar">
          <span class="results-count" id="resultsCount">Loading…</span>
          <select class="sort-select" onchange="changeSort(this.value)">
            <option value="rating"    ${state.filters.sort==='rating'    ?'selected':''}>Top Rated</option>
            <option value="title"     ${state.filters.sort==='title'     ?'selected':''}>A → Z</option>
            <option value="price_asc" ${state.filters.sort==='price_asc' ?'selected':''}>Price ↑</option>
            <option value="price_desc"${state.filters.sort==='price_desc'?'selected':''}>Price ↓</option>
          </select>
        </div>
        ${(state.filters.category||state.filters.search)?`
          <div class="active-filters">
            ${state.filters.category?`<span class="filter-tag">${state.filters.category}
              <button onclick="setCategory('')">✕</button></span>`:''}
            ${state.filters.search?`<span class="filter-tag">Search: "${escHtml(state.filters.search)}"
              <button onclick="clearSearch()">✕</button></span>`:''}
          </div>`:''}
        <div class="product-grid" id="productGrid">${spin(12)}</div>
        <div class="pagination" id="pagination"></div>
      </div>
    </div>`;
  loadCats(); loadProducts();
}

async function loadCats() {
  const { data } = await api('GET', '/api/products/categories');
  const el = document.getElementById('catList');
  if (!el) return;
  const all = [{ name:'All Books', slug:'' }, ...(data.categories||[])];
  el.innerHTML = all.map(c => `
    <li class="${state.filters.category===c.slug?'active':''}" onclick="setCategory('${c.slug}')">
      <span>${escHtml(c.name)}</span>
    </li>`).join('');
}

let priceTimer, shopTimer;
function onPriceSlider(v) {
  document.getElementById('priceLabel').textContent = `Up to $${v}`;
  clearTimeout(priceTimer);
  priceTimer = setTimeout(() => { state.filters.maxPrice = +v; loadProducts(); }, 400);
}
function onShopSearch(v) {
  clearTimeout(shopTimer);
  shopTimer = setTimeout(() => { state.filters.search = v.trim(); state.filters.page = 1; loadProducts(); }, 350);
}
function clearSearch() { state.filters.search = ''; state.filters.page = 1; renderShop(); }

async function loadProducts() {
  const { category, search, sort, page, maxPrice } = state.filters;
  let url = `/api/products?sort=${sort}&page=${page}&limit=12`;
  if (category) url += `&category=${encodeURIComponent(category)}`;
  if (search)   url += `&search=${encodeURIComponent(search)}`;

  const grid = document.getElementById('productGrid');
  const cnt  = document.getElementById('resultsCount');
  const pag  = document.getElementById('pagination');
  if (grid) grid.innerHTML = spin(12);

  const { ok, data } = await api('GET', url);
  if (!grid) return;

  let prods = (data.products||[]).filter(p => +p.price <= maxPrice);

  if (!ok || !prods.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="icon">📭</div><h3>No books found</h3>
      <p>Try different filters or search terms.</p>
      <button class="btn-secondary" onclick="state.filters.category='';clearSearch()" style="margin-top:1rem">Clear Filters</button>
    </div>`;
    if (cnt) cnt.textContent = '0 results';
    if (pag) pag.innerHTML  = '';
    return;
  }
  grid.innerHTML = prods.map(productCard).join('');
  if (cnt) cnt.textContent = `${data.total} book${data.total!==1?'s':''} found`;
  if (pag) {
    const pages = Math.ceil(data.total / 12);
    pag.innerHTML = pages > 1 ? Array.from({length:pages},(_,i)=>
      `<button class="page-btn ${i+1===page?'active':''}" onclick="setPage(${i+1})">${i+1}</button>`).join('') : '';
  }
}

function setCategory(slug) {
  state.filters.category = slug; state.filters.page = 1;
  if (state.currentPage !== 'shop') { navigate('shop'); return; }
  loadCats(); loadProducts();
}
function changeSort(v) { state.filters.sort = v; state.filters.page = 1; loadProducts(); }
function setPage(p)    { state.filters.page = p; loadProducts(); document.querySelector('.products-area')?.scrollIntoView({behavior:'smooth'}); }

// ── Product Card ──────────────────────────────────────────
function productCard(p) {
  const img = p.image_url || `https://placehold.co/240x320/f0ebe1/9a6518?text=${encodeURIComponent((p.title||'?')[0])}`;
  const wl  = state.wishlist.includes(p.id);
  return `
    <div class="product-card" onclick="openDetail(${p.id})">
      <div class="card-img-wrap">
        <img src="${escHtml(img)}" alt="${escHtml(p.title)}" loading="lazy"
          onerror="this.src='https://placehold.co/240x320/f0ebe1/9a6518?text=📚'" />
        ${+p.rating>=4.7?'<span class="card-badge">⭐ Top Pick</span>':''}
        <button class="wish-btn ${wl?'active':''}" data-id="${p.id}"
          onclick="toggleWishlist(event,${p.id},'${escHtml(p.title)}')">${wl?'♥':'♡'}</button>
      </div>
      <div class="card-body">
        <div class="card-category">${escHtml(p.category||'General')}</div>
        <div class="card-title">${escHtml(p.title)}</div>
        <div class="card-author">by ${escHtml(p.author||'Unknown')}</div>
        <div class="card-rating"><span class="stars">${stars(p.rating)}</span>
          <span class="rating-val">${p.rating}</span></div>
        <div class="card-footer">
          <span class="card-price">${fmtMoney(p.price)}</span>
          <button class="btn-add-cart" onclick="addToCart(event,${p.id})"><i class="fas fa-plus"></i></button>
        </div>
      </div>
    </div>`;
}

// ── Product Detail ────────────────────────────────────────
async function openDetail(id) {
  openModal('<div class="spinner-wrap"><div class="spinner"></div></div>');
  const { ok, data } = await api('GET', `/api/products/${id}`);
  if (!ok) { forceCloseModal(); showToast('Failed to load.', 'error'); return; }
  const p   = data.product;
  const img = p.image_url || 'https://placehold.co/200x280/f0ebe1/9a6518?text=📚';
  const wl  = state.wishlist.includes(p.id);
  document.getElementById('modalBox').innerHTML = `
    <button class="modal-close" onclick="forceCloseModal()">✕</button>
    <div class="detail-grid">
      <div class="detail-img-wrap">
        <img class="detail-img" src="${escHtml(img)}" alt="${escHtml(p.title)}"
          onerror="this.src='https://placehold.co/200x280/f0ebe1/9a6518?text=📚'" />
        <div class="detail-stock ${+p.stock>0?'in':'out'}">
          ${+p.stock>0?`✅ ${p.stock} in stock`:'❌ Out of stock'}</div>
      </div>
      <div class="detail-body">
        <div class="card-category">${escHtml(p.category||'')}</div>
        <h2 class="detail-title">${escHtml(p.title)}</h2>
        <p class="detail-author">by <strong>${escHtml(p.author||'Unknown')}</strong></p>
        <div class="card-rating" style="margin-bottom:1rem">
          <span class="stars">${stars(p.rating)}</span>
          <span class="rating-val">${p.rating} / 5</span></div>
        <div class="detail-price">${fmtMoney(p.price)}</div>
        <p class="detail-desc">${escHtml(p.description||'No description available.')}</p>
        ${p.isbn?`<p class="detail-meta">📖 ISBN: ${escHtml(p.isbn)}</p>`:''}
        <div class="detail-actions">
          <button class="btn-detail-cart" onclick="addToCart(event,${p.id})" ${+p.stock<1?'disabled':''}>
            <i class="fas fa-shopping-bag"></i> ${+p.stock>0?'Add to Cart':'Out of Stock'}
          </button>
          <button class="btn-detail-wish wish-btn ${wl?'active':''}" data-id="${p.id}"
            onclick="toggleWishlist(event,${p.id},'${escHtml(p.title)}')">${wl?'♥ Saved':'♡ Save'}</button>
        </div>
      </div>
    </div>`;
}

// ── Add to Cart ───────────────────────────────────────────
async function addToCart(e, id) {
  e.stopPropagation();
  if (!state.user) { openAuthModal('login'); return; }
  const btn = e.currentTarget; btn.disabled = true;
  const { ok, data } = await api('POST', '/api/cart', { product_id: id, quantity: 1 });
  if (ok) {
    showToast('Added to bag 🛍️', 'success');
    updateCartBadge();
    const badge = document.getElementById('cartBadge');
    badge.classList.add('pop'); setTimeout(() => badge.classList.remove('pop'), 300);
  } else showToast(data.message||'Could not add.', 'error');
  btn.disabled = false;
}

// ── CART ──────────────────────────────────────────────────
async function renderCart() {
  if (!state.user) { openAuthModal('login'); return; }
  document.getElementById('appRoot').innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  const { ok, data } = await api('GET', '/api/cart');
  if (!ok) { showToast('Failed to load cart.', 'error'); return; }
  const { items=[], subtotal=0 } = data;
  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  if (!items.length) {
    document.getElementById('appRoot').innerHTML = `
      <div class="cart-wrap"><h2 class="cart-title">Shopping Bag</h2>
        <div class="empty-state" style="margin-top:2rem">
          <div class="icon">🛍️</div><h3>Your bag is empty</h3><p>Add some books to get started!</p>
          <button class="btn-hero-primary" onclick="navigate('shop')" style="margin-top:1.5rem;border-radius:40px">Browse Books</button>
        </div></div>`; return;
  }

  document.getElementById('appRoot').innerHTML = `
    <div class="cart-wrap">
      <div class="cart-items-col">
        <div class="cart-heading">
          <h2 class="cart-title">Shopping Bag</h2>
          <span class="cart-count">${items.length} item${items.length!==1?'s':''}</span>
        </div>
        <div id="cartItemsList">${items.map(cartItemRow).join('')}</div>
        <button class="btn-clear-cart" onclick="clearCart()"><i class="fas fa-trash"></i> Clear cart</button>
      </div>
      <div class="cart-summary-col">
        <div class="cart-summary-card">
          <h3 class="summary-title">Order Summary</h3>
          <div class="summary-row"><span>Subtotal</span><span>${fmtMoney(subtotal)}</span></div>
          <div class="summary-row"><span>Tax (8%)</span><span>${fmtMoney(tax)}</span></div>
          <div class="summary-row"><span>Shipping</span><span class="free-badge">Free</span></div>
          <div class="summary-divider"></div>
          <div class="summary-row total"><span>Total</span><span>${fmtMoney(total)}</span></div>
          <button class="btn-checkout" onclick="navigate('checkout')">Proceed to Checkout →</button>
          <p class="secure-note">🔒 Secure checkout via PayPal</p>
        </div>
        <div class="cart-extras">
          <div class="cart-extra-item"><span>📦</span><span>Free shipping on all orders</span></div>
          <div class="cart-extra-item"><span>↩️</span><span>Easy 30-day returns</span></div>
          <div class="cart-extra-item"><span>🔒</span><span>SSL encrypted payment</span></div>
        </div>
      </div>
    </div>`;
}

function cartItemRow(item) {
  const img = item.image_url || 'https://placehold.co/72x100/f0ebe1/9a6518?text=📚';
  return `
    <div class="cart-item" id="cartItem-${item.id}">
      <img class="cart-item-img" src="${escHtml(img)}" alt="${escHtml(item.title)}"
        onerror="this.src='https://placehold.co/72x100/f0ebe1/9a6518?text=📚'"
        onclick="openDetail(${item.product_id})" style="cursor:pointer" />
      <div class="cart-item-info">
        <div class="cart-item-title">${escHtml(item.title)}</div>
        <div class="cart-item-author">by ${escHtml(item.author||'')}</div>
        <div class="cart-item-price">${fmtMoney(item.price)} each</div>
        <div class="cart-qty-row">
          <button class="qty-btn" onclick="updateQty(${item.id},${item.quantity-1})">−</button>
          <span class="qty-val">${item.quantity}</span>
          <button class="qty-btn" onclick="updateQty(${item.id},${item.quantity+1})">+</button>
          <span class="cart-line-total">${fmtMoney(+item.price * +item.quantity)}</span>
          <button class="btn-remove" onclick="removeItem(${item.id})"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
    </div>`;
}

async function updateQty(id, qty) {
  if (qty < 1) { removeItem(id); return; }
  const { ok, data } = await api('PUT', `/api/cart/${id}`, { quantity: qty });
  if (ok) { renderCart(); updateCartBadge(); }
  else showToast(data.message||'Update failed.', 'error');
}
async function removeItem(id) {
  const el = document.getElementById(`cartItem-${id}`);
  if (el) { el.style.opacity = '.4'; el.style.pointerEvents = 'none'; }
  await api('DELETE', `/api/cart/${id}`);
  showToast('Removed.', 'info'); renderCart(); updateCartBadge();
}
async function clearCart() {
  if (!confirm('Clear your entire cart?')) return;
  await api('DELETE', '/api/cart');
  showToast('Cart cleared.', 'info'); renderCart(); updateCartBadge();
}

// ── CHECKOUT ──────────────────────────────────────────────
async function renderCheckout() {
  if (!state.user) { openAuthModal('login'); return; }
  document.getElementById('appRoot').innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  const { ok, data } = await api('GET', '/api/cart');
  if (!ok || !data.items?.length) { showToast('Cart is empty.', 'error'); navigate('cart'); return; }

  const { items, subtotal } = data;
  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);
  state.checkout.total = total;

  document.getElementById('appRoot').innerHTML = `
    <div class="checkout-wrap">
      <div class="checkout-main">
        <div class="checkout-steps">
          <div class="step active">1 · Shipping</div>
          <div class="step-sep">→</div>
          <div class="step" id="step2lbl">2 · Payment</div>
        </div>

        <div class="checkout-card" id="shippingForm">
          <h3 class="checkout-card-title">📦 Shipping Information</h3>
          <div class="form-row-2">
            <div class="form-group"><label>Full Name</label>
              <input type="text" id="s_name" value="${escHtml(state.user.name)}" placeholder="Jane Doe" required /></div>
            <div class="form-group"><label>Email</label>
              <input type="email" id="s_email" placeholder="you@example.com" required /></div>
          </div>
          <div class="form-group"><label>Street Address</label>
            <input type="text" id="s_addr" placeholder="123 Main St, Apt 4B" required /></div>
          <div class="form-row-3">
            <div class="form-group"><label>City</label>
              <input type="text" id="s_city" placeholder="New York" required /></div>
            <div class="form-group"><label>ZIP</label>
              <input type="text" id="s_zip" placeholder="10001" required /></div>
            <div class="form-group"><label>Country</label>
              <select id="s_country" class="sort-select" style="width:100%">
                <option value="US">🇺🇸 United States</option>
                <option value="IN">🇮🇳 India</option>
                <option value="GB">🇬🇧 United Kingdom</option>
                <option value="CA">🇨🇦 Canada</option>
                <option value="AU">🇦🇺 Australia</option>
                <option value="DE">🇩🇪 Germany</option>
              </select></div>
          </div>
          <button class="btn-primary" onclick="goToPayment()">Continue to Payment →</button>
        </div>

        <div class="checkout-card" id="paymentSection" style="display:none">
          <h3 class="checkout-card-title">💳 Payment</h3>
          
          <div class="payment-method-selector" style="margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <label style="padding: .8rem; border: 1px solid var(--border, #ddd); border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: .5rem;">
              <input type="radio" name="payMethod" value="paypal" checked onchange="switchPayMethod('paypal')">
              <strong>PayPal / Credit Card</strong>
            </label>
            <label style="padding: .8rem; border: 1px solid var(--border, #ddd); border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: .5rem;">
              <input type="radio" name="payMethod" value="upi" onchange="switchPayMethod('upi')">
              <strong>UPI (GPay, Paytm, PhonePe)</strong>
            </label>
            <label style="padding: .8rem; border: 1px solid var(--border, #ddd); border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: .5rem;">
              <input type="radio" name="payMethod" value="cod" onchange="switchPayMethod('cod')">
              <strong>Cash on Delivery (COD)</strong>
            </label>
          </div>

          <div id="pay-paypal" class="pay-method-block">
            <div class="paypal-info">
              <p>Complete your purchase securely via PayPal.</p>
              <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg"
                alt="PayPal" style="height:36px;border-radius:4px;margin-top:.5rem" />
            </div>
            <div id="paypalBtnWrap"></div>
          </div>

          <div id="pay-upi" class="pay-method-block" style="display:none; padding: 1rem; background: var(--bg-alt, #f9f9f9); border: 1px solid var(--border, #ddd); border-radius: 6px; text-align: center;">
            <p style="margin-bottom: 1rem; font-size: 0.95rem;">Scan QR to pay <strong>${fmtMoney(total)}</strong></p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=bookmart@ybl&pn=BookMart&am=${total}&cu=INR`)}" alt="UPI QR Code" style="display: block; margin: 0 auto 1rem auto; border-radius: 8px; padding: 0.5rem; background: #fff; border: 1px solid var(--border, #ddd);" />
            <div class="form-group" style="text-align: left;"><label>Or Enter your UPI ID</label>
              <input type="text" id="upi_id" placeholder="username@upi" /></div>
            <button class="btn-primary" style="width:100%" onclick="processManualOrder('UPI')">Confirm Payment via UPI</button>
          </div>

          <div id="pay-cod" class="pay-method-block" style="display:none; padding: 1rem; background: var(--bg-alt, #f9f9f9); border: 1px solid var(--border, #ddd); border-radius: 6px;">
            <p style="margin-bottom: 1rem;">You will pay <strong>${fmtMoney(total)}</strong> in cash to the delivery agent.</p>
            <button class="btn-primary" style="width:100%" onclick="processManualOrder('COD')">Place Order (COD)</button>
          </div>

          <p class="secure-note" style="margin-top:.75rem">🔒 Your payment info is never stored on our servers.</p>
          <button class="btn-back" onclick="backToShipping()">← Back to Shipping</button>
        </div>
      </div>

      <div class="checkout-sidebar">
        <div class="cart-summary-card">
          <h3 class="summary-title">Your Order</h3>
          <div class="checkout-items-preview">
            ${items.map(i=>`
              <div class="checkout-preview-item">
                <img src="${escHtml(i.image_url||'https://placehold.co/48x64/f0ebe1/9a6518?text=📚')}"
                  alt="${escHtml(i.title)}" onerror="this.src='https://placehold.co/48x64/f0ebe1/9a6518?text=📚'" />
                <div>
                  <div style="font-size:.85rem;font-weight:600">${escHtml(i.title)}</div>
                  <div style="font-size:.78rem;color:var(--muted)">Qty: ${i.quantity}</div>
                </div>
                <span style="font-weight:700;font-size:.9rem;margin-left:auto">${fmtMoney(+i.price*+i.quantity)}</span>
              </div>`).join('')}
          </div>
          <div class="summary-divider"></div>
          <div class="summary-row"><span>Subtotal</span><span>${fmtMoney(subtotal)}</span></div>
          <div class="summary-row"><span>Tax (8%)</span><span>${fmtMoney(tax)}</span></div>
          <div class="summary-row"><span>Shipping</span><span class="free-badge">Free</span></div>
          <div class="summary-divider"></div>
          <div class="summary-row total"><span>Total</span><span>${fmtMoney(total)}</span></div>
        </div>
      </div>
    </div>`;
}

function goToPayment() {
  const name = document.getElementById('s_name')?.value?.trim();
  const email= document.getElementById('s_email')?.value?.trim();
  const addr = document.getElementById('s_addr')?.value?.trim();
  const city = document.getElementById('s_city')?.value?.trim();
  const zip  = document.getElementById('s_zip')?.value?.trim();
  const country = document.getElementById('s_country')?.value;
  if (!name||!email||!addr||!city||!zip) { showToast('Please fill in all shipping fields.', 'error'); return; }
  state.checkout.shipping = { name, email, address: addr, city, zip, country, state: '' };
  document.getElementById('shippingForm').style.display  = 'none';
  document.getElementById('paymentSection').style.display = '';
  document.getElementById('step2lbl').classList.add('active');
  mountPayPal();
}

function backToShipping() {
  document.getElementById('shippingForm').style.display  = '';
  document.getElementById('paymentSection').style.display = 'none';
  document.getElementById('paypalBtnWrap').innerHTML = '';
}

function switchPayMethod(method) {
  document.getElementById('pay-paypal').style.display = method === 'paypal' ? '' : 'none';
  document.getElementById('pay-upi').style.display = method === 'upi' ? '' : 'none';
  document.getElementById('pay-cod').style.display = method === 'cod' ? '' : 'none';
}

async function processManualOrder(method) {
  let paymentRef = '';
  if (method === 'UPI') {
    paymentRef = document.getElementById('upi_id').value.trim();
    if (!paymentRef || !paymentRef.includes('@')) { showToast('Please enter a valid UPI ID.', 'error'); return; }
  }
  
  const btn = event.currentTarget;
  btn.disabled = true; 
  btn.textContent = 'Processing...';

  const body = { method, paymentRef, shipping: state.checkout.shipping };
  const { ok, data } = await api('POST', '/api/orders', body);

  if (ok) {
    state.cartCount = 0; updateCartBadge();
    showToast('Order placed successfully!', 'success');
    navigate('success', { orderId: data.orderId });
  } else {
    showToast(data.message || 'Failed to place order.', 'error');
    btn.disabled = false;
    btn.textContent = method === 'UPI' ? 'Confirm Payment via UPI' : 'Place Order (COD)';
  }
}

// ── PayPal ────────────────────────────────────────────────
function mountPayPal() {
  const wrap = document.getElementById('paypalBtnWrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  wrap.style.opacity = '1';
  wrap.style.pointerEvents = 'auto';

  if (typeof paypal === 'undefined') {
    wrap.innerHTML = `
      <div class="paypal-missing">
        <p>⚠️ <strong>PayPal SDK not loaded.</strong><br/>
        Replace <code>YOUR_PAYPAL_CLIENT_ID</code> in <code>index.html</code>.</p>
      </div>
      <button class="btn-primary" style="margin-top:1rem;width:100%" onclick="devSimulate()">
        🧪 Simulate Payment (Dev Mode)
      </button>`;
    return;
  }

  paypal.Buttons({
    style: { layout:'vertical', color:'gold', shape:'rect', label:'pay', height:48 },
    createOrder: (data, actions) => {
      return actions.order.create({
        purchase_units: [{ amount: { currency_code: 'USD', value: state.checkout.total.toString() } }]
      });
    },
    onApprove: async (data, actions) => {
      try {
        showToast('Authorizing Payment…', 'info');
        wrap.style.opacity = '0.5';
        wrap.style.pointerEvents = 'none';
        const captureResult = await actions.order.capture();
        
        const res = await api('POST', '/api/orders/capture-paypal-order',
          { orderID: captureResult.id, shipping: state.checkout.shipping });
          
        if (res.ok) {
          state.cartCount = 0; updateCartBadge();
          navigate('success', { orderId: res.data.orderId });
        } else {
          showToast(res.data.message||'Capture failed.', 'error'); mountPayPal();
        }
      } catch (err) {
        console.error(err);
        showToast('Payment declined by PayPal.', 'error'); mountPayPal();
      }
    },
    onError:  (e) => { console.error(e); showToast('PayPal error. Try again.', 'error'); },
    onCancel: ()  => showToast('Payment cancelled.', 'info'),
  }).render('#paypalBtnWrap');
}

async function devSimulate() {
  const btn = document.querySelector('#paypalBtnWrap button');
  if (btn) { btn.disabled = true; btn.textContent = 'Simulating…'; }
  const { ok, data } = await api('POST', '/api/orders/create-paypal-order');
  if (ok) {
    await api('DELETE', '/api/cart');
    state.cartCount = 0; updateCartBadge();
    showToast('✅ Dev payment simulated', 'success');
    navigate('success', { orderId: 'DEV-' + Date.now() });
  } else {
    showToast(data.message||'Sim failed.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = '🧪 Simulate Payment (Dev Mode)'; }
  }
}

// ── SUCCESS ───────────────────────────────────────────────
function renderSuccess(orderId) {
  document.getElementById('appRoot').innerHTML = `
    <div class="success-wrap">
      <div class="success-anim"><div class="success-circle">✓</div></div>
      <h2>Order Confirmed!</h2>
      <p>Thank you, <strong>${escHtml(state.user?.name||'Reader')}</strong>!<br/>
         Your books are being prepared for dispatch.</p>
      <div class="order-ref">Reference: <code>#${escHtml(String(orderId))}</code></div>
      <div class="success-btns">
        <button class="btn-hero-primary" onclick="navigate('orders')">
          <i class="fas fa-box"></i> Track Orders</button>
        <button class="btn-hero-outline" onclick="navigate('shop')">
          <i class="fas fa-book-open"></i> Continue Shopping</button>
      </div>
    </div>`;
}

// ── ORDERS ────────────────────────────────────────────────
async function renderOrders() {
  if (!state.user) { openAuthModal('login'); return; }
  document.getElementById('appRoot').innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  const { ok, data } = await api('GET', '/api/orders');
  if (!ok) { showToast('Failed to load orders.', 'error'); return; }
  const orders = data.orders||[];
  const statusBg = {paid:'#d4edda',pending:'#fff3cd',cancelled:'#f8d7da',refunded:'#d1ecf1'};
  const statusFg = {paid:'#155724',pending:'#856404',cancelled:'#721c24',refunded:'#0c5460'};

  document.getElementById('appRoot').innerHTML = `
    <div class="orders-wrap">
      <h2 class="section-title">My Orders</h2>
      ${!orders.length ? `<div class="empty-state">
          <div class="icon">📭</div><h3>No orders yet</h3>
          <p>Your orders will appear here after you shop.</p>
          <button class="btn-hero-primary" onclick="navigate('shop')" style="margin-top:1.5rem">Shop Now</button>
        </div>` :
        orders.map(o => `
          <div class="order-card">
            <div class="order-header">
              <div>
                <div class="order-id">Order #${o.id}</div>
                <div class="order-date">${fmtDate(o.created_at)}</div>
              </div>
              <div style="text-align:right">
                <span class="status-badge status-${o.status}">
                  ${o.status.toUpperCase()}</span>
                <div class="order-total">${fmtMoney(o.total)}</div>
              </div>
            </div>
            <div class="order-detail-row">
              <span>Subtotal: ${fmtMoney(o.subtotal)}</span>
              <span>Tax: ${fmtMoney(o.tax)}</span>
              ${o.shipping_city?`<span>📍 ${escHtml(o.shipping_city)}, ${escHtml(o.shipping_country)}</span>`:''}
            </div>
            ${o.paypal_order_id?`<div class="paypal-ref">PayPal ID: <code>${escHtml(o.paypal_order_id)}</code></div>`:''}
          </div>`).join('')}
    </div>`;
}

// ── WISHLIST ──────────────────────────────────────────────
async function renderWishlist() {
  if (!state.user) { openAuthModal('login'); return; }
  document.getElementById('appRoot').innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  if (!state.wishlist.length) {
    document.getElementById('appRoot').innerHTML = `
      <div class="orders-wrap"><h2 class="section-title">My Wishlist</h2>
        <div class="empty-state">
          <div class="icon">♡</div><h3>Wishlist is empty</h3>
          <p>Click ♡ on any book to save it here.</p>
          <button class="btn-hero-primary" onclick="navigate('shop')" style="margin-top:1.5rem">Browse Books</button>
        </div></div>`; return;
  }
  const results  = await Promise.all(state.wishlist.map(id => api('GET', `/api/products/${id}`)));
  const products = results.filter(r => r.ok).map(r => r.data.product);
  document.getElementById('appRoot').innerHTML = `
    <div class="orders-wrap">
      <h2 class="section-title">My Wishlist <span style="font-size:1rem;color:var(--muted)">(${products.length})</span></h2>
      <div class="product-grid">${products.map(productCard).join('')}</div>
    </div>`;
}

// ── SETTINGS ──────────────────────────────────────────────
async function renderSettings() {
  if (!state.user) { openAuthModal('login'); return; }

  document.getElementById('appRoot').innerHTML = `
    <div class="settings-wrap">
        <h2 class="section-title">Settings</h2>
        <div class="settings-layout">
            <aside class="settings-nav">
                <a href="#" class="settings-nav-item active" onclick="switchSettingsTab('account', this)">
                    <i class="fas fa-user-circle"></i> Account
                </a>
                <a href="#" class="settings-nav-item" onclick="switchSettingsTab('appearance', this)">
                    <i class="fas fa-paint-brush"></i> Appearance
                </a>
                <a href="#" class="settings-nav-item" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
            </aside>
            <main class="settings-content" id="settingsContent">
                <div class="spinner-wrap"><div class="spinner"></div></div>
            </main>
        </div>
    </div>
  `;
  switchSettingsTab('account'); // Load the default tab
}

function switchSettingsTab(tab, el) {
  if (el) {
    document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
  }

  const container = document.getElementById('settingsContent');
  if (!container) return;

  if (tab === 'account')    renderSettingsAccount(container);
  if (tab === 'appearance') renderSettingsAppearance(container);
}

async function renderSettingsAccount(container) {
  container.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  const { ok, data } = await api('GET', '/api/user/profile');
  if (!ok) {
    container.innerHTML = `<div class="checkout-card" style="margin:0;"><p>Failed to load profile data.</p></div>`;
    showToast('Failed to load profile.', 'error');
    return;
  }
  const u = data.user || {};

  container.innerHTML = `
    <div class="checkout-card" style="margin:0;">
      <h3 class="checkout-card-title">👤 Edit Profile & Shipping Address</h3>
      <form id="settingsForm" onsubmit="saveSettings(event)">
        <div class="form-group"><label>Full Name</label>
          <input type="text" id="set_name" value="${escHtml(u.name)}" required /></div>
        <div class="form-group"><label>Email</label>
          <input type="email" id="set_email" value="${escHtml(u.email)}" required /></div>
        <div class="form-group"><label>New Password (leave blank to keep current)</label>
          <input type="password" id="set_pass" placeholder="••••••••" /></div>
        
        <h4 style="margin: 1.5rem 0 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">Default Shipping Address</h4>
        <div class="form-group"><label>Street Address</label>
          <input type="text" id="set_addr" value="${escHtml(u.address||'')}" placeholder="123 Main St" /></div>
        <div class="form-row-3">
          <div class="form-group"><label>City</label>
            <input type="text" id="set_city" value="${escHtml(u.city||'')}" placeholder="New York" /></div>
          <div class="form-group"><label>State</label>
            <input type="text" id="set_state" value="${escHtml(u.state||'')}" placeholder="NY" /></div>
          <div class="form-group"><label>ZIP</label>
            <input type="text" id="set_zip" value="${escHtml(u.zip||'')}" placeholder="10001" /></div>
        </div>
        <div class="form-group"><label>Country</label>
          <select id="set_country" class="sort-select" style="width:100%">
            <option value="US" ${u.country==='US'?'selected':''}>🇺🇸 United States</option>
            <option value="IN" ${u.country==='IN'?'selected':''}>🇮🇳 India</option>
            <option value="GB" ${u.country==='GB'?'selected':''}>🇬🇧 United Kingdom</option>
            <option value="CA" ${u.country==='CA'?'selected':''}>🇨🇦 Canada</option>
            <option value="AU" ${u.country==='AU'?'selected':''}>🇦🇺 Australia</option>
            <option value="DE" ${u.country==='DE'?'selected':''}>🇩🇪 Germany</option>
          </select>
        </div>
        <button class="btn-primary" type="submit" style="width:100%; margin-top: 1rem;">Save Changes</button>
      </form>
      <div style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
        <h4 style="color: var(--rust); margin-bottom: 0.5rem;">Danger Zone</h4>
        <p style="font-size: 0.85rem; color: var(--muted); margin-bottom: 1rem;">Deactivating your account will hide your profile and prevent you from logging in. This requires your password.</p>
        <div class="form-group">
          <input type="password" id="del_pass" placeholder="Enter your password to confirm" />
        </div>
        <button class="btn-danger" style="width: 100%;" onclick="deleteAccount(event)">Deactivate My Account</button>
      </div>
    </div>
  `;
}

function renderSettingsAppearance(container) {
  const currentTheme = localStorage.getItem('bm_theme') || 'system';
  container.innerHTML = `
    <div class="checkout-card" style="margin:0;">
      <h3 class="checkout-card-title">🎨 Appearance</h3>
      <div class="form-group">
          <label style="margin-bottom: 1rem; display:block;">Theme Preference</label>
          <div style="display:flex; flex-direction:column; gap:0.8rem; margin-top: 0.5rem;">
            <label style="display:flex; align-items:center; gap:1rem; cursor:pointer; padding: 1rem 1.25rem; border: 1px solid var(--border); border-radius: var(--r-lg);">
              <input type="radio" name="themeToggle" value="light" ${currentTheme === 'light' ? 'checked' : ''} onchange="setTheme('light')" style="width:1.1rem; height:1.1rem; margin:0;">
              <span style="font-weight:600; font-size: 0.95rem;">☀️ Light Mode</span>
            </label>
            <label style="display:flex; align-items:center; gap:1rem; cursor:pointer; padding: 1rem 1.25rem; border: 1px solid var(--border); border-radius: var(--r-lg);">
              <input type="radio" name="themeToggle" value="dark" ${currentTheme === 'dark' ? 'checked' : ''} onchange="setTheme('dark')" style="width:1.1rem; height:1.1rem; margin:0;">
              <span style="font-weight:600; font-size: 0.95rem;">🌙 Dark Mode</span>
            </label>
            <label style="display:flex; align-items:center; gap:1rem; cursor:pointer; padding: 1rem 1.25rem; border: 1px solid var(--border); border-radius: var(--r-lg);">
              <input type="radio" name="themeToggle" value="system" ${currentTheme === 'system' ? 'checked' : ''} onchange="setTheme('system')" style="width:1.1rem; height:1.1rem; margin:0;">
              <span style="font-weight:600; font-size: 0.95rem;">💻 System Default</span>
            </label>
          </div>
      </div>
    </div>
  `;
}

function setTheme(theme) {
  localStorage.setItem('bm_theme', theme);
  applyTheme();
}

function applyTheme() {
  const theme = localStorage.getItem('bm_theme') || 'system';
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) document.body.classList.add('dark-theme');
  else document.body.classList.remove('dark-theme');
}

async function deleteAccount(e) {
  const passInput = document.getElementById('del_pass');
  const password = passInput ? passInput.value : '';
  if (!password) { showToast('Please enter your password to confirm.', 'error'); return; }

  if (!confirm('Are you sure you want to deactivate your account?')) return;
  
  const btn = e.currentTarget;
  btn.disabled = true; btn.textContent = 'Deactivating...';

  const { ok, data } = await api('DELETE', '/api/user/profile', { password });
  if (ok) {
    state.user = null;
    state.cartCount = 0;
    refreshNavUI(); setBadge('cartBadge', 0);
    showToast('Account deactivated successfully.', 'info');
    navigate('home');
  } else {
    showToast(data.message || 'Failed to delete account.', 'error');
    btn.disabled = false; btn.textContent = 'Deactivate My Account';
  }
}

async function saveSettings(e) {
  e.preventDefault();
  const body = {
    name: document.getElementById('set_name').value, email: document.getElementById('set_email').value,
    password: document.getElementById('set_pass').value, address: document.getElementById('set_addr').value,
    city: document.getElementById('set_city').value, state: document.getElementById('set_state').value,
    zip: document.getElementById('set_zip').value, country: document.getElementById('set_country').value
  };
  const btn = e.target.querySelector('button');
  btn.disabled = true; btn.textContent = 'Saving...';
  const { ok, data } = await api('PUT', '/api/user/profile', body);
  if (ok) { showToast(data.message || 'Settings saved!', 'success'); await checkAuth(); } 
  else { showToast(data.message || 'Failed to update.', 'error'); }
  btn.disabled = false; btn.textContent = 'Save Changes';
}

// ── ADMIN ─────────────────────────────────────────────────
async function renderAdmin() {
  if (state.user?.role !== 'admin') { showToast('Admin only.', 'error'); navigate('home'); return; }
  document.getElementById('appRoot').innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  const { ok, data } = await api('GET', '/api/admin/dashboard');
  if (!ok) { showToast('Failed to load dashboard.', 'error'); return; }
  const { stats, recentOrders, topProducts } = data;

  document.getElementById('appRoot').innerHTML = `
    <div class="admin-wrap">
      <div class="admin-header">
        <h2 class="section-title" style="margin:0">⚙️ Admin Dashboard</h2>
        <div class="admin-tabs">
          <button class="admin-tab active" onclick="adminTab('overview',this)">Overview</button>
          <button class="admin-tab" onclick="adminTab('products',this)">Products</button>
          <button class="admin-tab" onclick="adminTab('orders',this)">Orders</button>
          <button class="admin-tab" onclick="adminTab('users',this)">Users</button>
        </div>
      </div>

      <div id="aTab-overview" class="admin-tab-content">
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-icon">📦</div>
            <div class="stat-val">${stats.totalOrders}</div><div class="stat-label">Total Orders</div></div>
          <div class="stat-card highlight"><div class="stat-icon">💰</div>
            <div class="stat-val">${fmtMoney(stats.totalRevenue)}</div><div class="stat-label">Revenue</div></div>
          <div class="stat-card"><div class="stat-icon">👥</div>
            <div class="stat-val">${stats.totalUsers}</div><div class="stat-label">Customers</div></div>
          <div class="stat-card"><div class="stat-icon">📚</div>
            <div class="stat-val">${stats.totalProducts}</div><div class="stat-label">Products</div></div>
        </div>
        <div class="admin-two-col">
          <div class="admin-card"><h4>⭐ Top Sellers</h4>
            <table class="admin-table"><thead><tr><th>Title</th><th>Units</th><th>Revenue</th></tr></thead>
            <tbody>${topProducts.map(p=>`<tr>
              <td>${escHtml(p.title)}</td><td>${p.units_sold}</td><td>${fmtMoney(p.revenue)}</td>
            </tr>`).join('')}</tbody></table></div>
          <div class="admin-card"><h4>🕐 Recent Orders</h4>
            <table class="admin-table"><thead><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>${recentOrders.slice(0,8).map(o=>`<tr>
              <td>#${o.id}</td><td>${escHtml(o.user_name||'Guest')}</td>
              <td>${fmtMoney(o.total)}</td>
              <td><span class="status-badge status-${o.status}">${o.status}</span></td>
            </tr>`).join('')}</tbody></table></div>
        </div>
      </div>

      <div id="aTab-products" class="admin-tab-content" style="display:none">
        <div class="admin-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:1rem">
            <h4>📚 All Products</h4>
            <div style="flex:1;max-width:300px">
              <input type="text" id="adminProdSearch" placeholder="Search titles, authors..." style="width:100%;padding:.5rem .8rem;border:1.5px solid var(--border);border-radius:40px;font-size:.85rem" oninput="debounceAdminSearch('products')" />
            </div>
            <div style="display:flex; align-items:center;">
              <div class="user-menu">
                <button class="btn-sm-outline">⇆ Import / Export</button>
                <div class="user-dropdown" style="right:0; min-width:160px; z-index:100; text-align:left;">
                  <a href="#" onclick="event.preventDefault(); document.getElementById('importCsvInput').click()">📤 Import CSV</a>
                  <a href="#" onclick="event.preventDefault(); exportProductsCSV()">📥 Export CSV</a>
                </div>
              </div>
              <input type="file" id="importCsvInput" accept=".csv" style="display:none" onchange="importProductsCSV(event)" />
              <button class="btn-sm-primary" onclick="openAddProd()" style="margin-left:.5rem">+ Add</button>
            </div>
          </div>
          <div id="adminBulkActions" style="display:none; margin-bottom: 1rem; padding: 0.75rem 1rem; background: var(--bg-alt); border-radius: var(--r-md); align-items: center; justify-content: space-between;">
             <span id="bulkSelectCount" style="font-size: 0.9rem; font-weight: 600;"></span>
             <button class="btn-sm-danger" onclick="bulkDeleteProducts()">Delete Selected</button>
          </div>
          <div id="adminProdsEl"><div class="spinner-wrap"><div class="spinner"></div></div></div>
        </div>
      </div>

      <div id="aTab-orders" class="admin-tab-content" style="display:none">
        <div class="admin-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:1rem">
            <h4>📦 All Orders</h4>
            <div style="flex:1;max-width:300px">
              <input type="text" id="adminOrdSearch" placeholder="Search orders, emails, names..." style="width:100%;padding:.5rem .8rem;border:1.5px solid var(--border);border-radius:40px;font-size:.85rem" oninput="debounceAdminSearch('orders')" />
            </div>
            <button class="btn-sm-outline" onclick="exportOrdersCSV()">📥 Export CSV</button>
          </div>
          <div id="adminOrdEl"><div class="spinner-wrap"><div class="spinner"></div></div></div>
        </div>
      </div>

      <div id="aTab-users" class="admin-tab-content" style="display:none">
        <div class="admin-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:1rem">
            <h4>👥 All Customers</h4>
            <div style="flex:1;max-width:300px">
              <input type="text" id="adminUsrSearch" placeholder="Search name or email..." style="width:100%;padding:.5rem .8rem;border:1.5px solid var(--border);border-radius:40px;font-size:.85rem" oninput="debounceAdminSearch('users')" />
            </div>
          </div>
          <div id="adminUsrEl"><div class="spinner-wrap"><div class="spinner"></div></div></div>
        </div>
      </div>
    </div>`;
}

async function adminTab(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
  document.getElementById(`aTab-${tab}`).style.display = '';
  if (tab === 'products') await loadAdminProds();
  if (tab === 'orders')   await loadAdminOrds();
  if (tab === 'users')    await loadAdminUsrs();
}

async function importProductsCSV(e) {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = ''; // Reset input

  const reader = new FileReader();
  reader.onload = async (ev) => {
    const text = ev.target.result;
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { showToast('CSV must have a header and data rows.', 'error'); return; }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    if (!headers.includes('title') || !headers.includes('price')) {
      showToast('CSV must contain at least "title" and "price" columns.', 'error'); return;
    }

    let success = 0, failed = 0;
    showToast('Importing products...', 'info');

    for (let i = 1; i < lines.length; i++) {
      const rowText = lines[i];
      const cols = [];
      let cur = '', inQuotes = false;
      for (let c = 0; c < rowText.length; c++) {
        const char = rowText[c];
        if (char === '"' && rowText[c+1] === '"') { cur += '"'; c++; } // escaped quotes
        else if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { cols.push(cur.trim()); cur = ''; }
        else { cur += char; }
      }
      cols.push(cur.trim());

      const getCol = (name) => cols[headers.indexOf(name)] || '';

      const body = {
        title: getCol('title'), author: getCol('author') || null, description: getCol('description') || null,
        price: parseFloat(getCol('price')) || 0, stock: parseInt(getCol('stock')) || 0, image_url: getCol('image_url') || null,
        isbn: getCol('isbn') || null, rating: parseFloat(getCol('rating')) || 4.0, category_id: parseInt(getCol('category_id')) || null
      };

      if (!body.title) continue;

      const { ok } = await api('POST', '/api/admin/products', body);
      if (ok) success++; else failed++;
    }
    showToast(`Import complete: ${success} added, ${failed} failed.`, success > 0 ? 'success' : 'error');
    if (success > 0) loadAdminProds();
  };
  reader.readAsText(file);
}

async function loadAdminProds() {
  const { data } = await api('GET', '/api/admin/products');
  const el = document.getElementById('adminProdsEl'); if (!el) return;
  updateBulkActionsUI(); // Hide bulk actions on reload
  el.innerHTML = `<div style="overflow-x:auto"><table class="admin-table">
    <thead><tr>
      <th><input type="checkbox" onchange="toggleAllProdCheck(this.checked)" title="Select all" /></th>
      <th>ID</th><th>Title</th><th>Author</th><th>Price</th><th>Stock</th><th>Actions</th>
    </tr></thead>
    <tbody>${(data.products||[]).map(p=>`<tr>
      <td><input type="checkbox" class="prod-check" data-id="${p.id}" onchange="updateBulkActionsUI()" /></td>
      <td>${p.id}</td><td>${escHtml(p.title)}</td><td>${escHtml(p.author||'—')}</td>
      <td>${fmtMoney(p.price)}</td>
      <td><span ${+p.stock<5?'class="low-stock"':''}>${p.stock}</span></td>
      <td>
        <button class="btn-tbl-edit" onclick="openEditProd(${p.id})">Edit</button>
        <button class="btn-tbl-del" onclick="deleteProd(${p.id})">Del</button>
      </td>
    </tr>`).join('')}</tbody></table></div>`;
}

function toggleAllProdCheck(checked) {
  document.querySelectorAll('.prod-check').forEach(c => c.checked = checked);
  updateBulkActionsUI();
}

function updateBulkActionsUI() {
  const selected = document.querySelectorAll('.prod-check:checked');
  const bulkActionsEl = document.getElementById('adminBulkActions');
  const countEl = document.getElementById('bulkSelectCount');
  
  if (!bulkActionsEl || !countEl) return;

  if (selected.length > 0) {
    bulkActionsEl.style.display = 'flex';
    countEl.textContent = `${selected.length} selected`;
  } else {
    bulkActionsEl.style.display = 'none';
  }
}

async function bulkDeleteProducts() {
  const selected = Array.from(document.querySelectorAll('.prod-check:checked')).map(c => c.dataset.id);
  if (selected.length === 0) {
    showToast('No products selected.', 'info');
    return;
  }
  if (!confirm(`Are you sure you want to delete ${selected.length} product(s)? This cannot be undone.`)) return;

  const { ok, data } = await api('DELETE', '/api/admin/products', { ids: selected });
  if (ok) {
    showToast(data.message || 'Products deleted.', 'success');
    loadAdminProds();
  } else {
    showToast(data.message || 'Failed to delete products.', 'error');
  }
}

async function exportProductsCSV() {
  const btn = document.querySelector('#aTab-products button[onclick="exportProductsCSV()"]');
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Exporting...'; }
  
  const { ok, data } = await api('GET', '/api/admin/products');
  
  if (btn) { btn.disabled = false; btn.innerHTML = '📥 Export'; }
  
  if (!ok || !data.products || data.products.length === 0) { 
    showToast('No products to export.', 'error'); 
    return; 
  }

  const headers = ['ID', 'Title', 'Author', 'Description', 'Price', 'Stock', 'Image URL', 'ISBN', 'Rating', 'Category ID', 'Category'];
  const rows = data.products.map(p => [ p.id, `"${(p.title || '').replace(/"/g, '""')}"`, `"${(p.author || '').replace(/"/g, '""')}"`, `"${(p.description || '').replace(/"/g, '""')}"`, p.price, p.stock, `"${(p.image_url || '').replace(/"/g, '""')}"`, `"${(p.isbn || '').replace(/"/g, '""')}"`, p.rating, p.category_id, `"${(p.category || '').replace(/"/g, '""')}"` ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `bookmart_products_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function loadAdminOrds() {
  const q = document.getElementById('adminOrdSearch')?.value || '';
  const { data } = await api('GET', `/api/admin/orders?search=${encodeURIComponent(q)}`);
  const el = document.getElementById('adminOrdEl'); if (!el) return;
  el.innerHTML = `<div style="overflow-x:auto"><table class="admin-table">
    <thead><tr><th>ID</th><th>Customer</th><th>Total</th><th>Date</th><th>Status</th></tr></thead>
    <tbody>${(data.orders||[]).map(o=>`<tr>
      <td>#${o.id}</td>
      <td>${escHtml(o.user_name||'Guest')}<br/><small style="color:var(--muted)">${escHtml(o.user_email||'')}</small></td>
      <td>${fmtMoney(o.total)}</td><td>${fmtDate(o.created_at)}</td>
      <td>
        <select class="sort-select" style="padding:.3rem .5rem;font-size:.8rem"
          onchange="patchStatus(${o.id},this.value)">
          ${['pending','paid','cancelled','refunded'].map(s=>
            `<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
    </tr>`).join('')}</tbody></table></div>`;
}

async function exportOrdersCSV() {
  const btn = document.querySelector('#aTab-orders button');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Exporting...'; }
  
  const { ok, data } = await api('GET', '/api/admin/orders');
  
  if (btn) { btn.disabled = false; btn.textContent = '📥 Export CSV'; }
  
  if (!ok || !data.orders || data.orders.length === 0) { 
    showToast('No orders to export.', 'error'); 
    return; 
  }

  const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Subtotal', 'Tax', 'Total', 'Status', 'Date'];
  const rows = data.orders.map(o => [
    o.id,
    `"${(o.user_name || 'Guest').replace(/"/g, '""')}"`,
    `"${(o.user_email || '').replace(/"/g, '""')}"`,
    o.subtotal,
    o.tax,
    o.total,
    o.status,
    `"${new Date(o.created_at).toISOString()}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `bookmart_orders_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function loadAdminUsrs() {
  const q = document.getElementById('adminUsrSearch')?.value || '';
  const { data } = await api('GET', `/api/admin/users?search=${encodeURIComponent(q)}`);
  const el = document.getElementById('adminUsrEl'); if (!el) return;
  el.innerHTML = `<div style="overflow-x:auto"><table class="admin-table">
    <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
    <tbody>${(data.users||[]).map(u=>`<tr>
      <td>${u.id}</td><td>${escHtml(u.name)}</td><td>${escHtml(u.email)}</td>
      <td><span class="role-badge role-${u.role}">${u.role}</span></td>
      <td>${fmtDate(u.created_at)}</td>
    </tr>`).join('')}</tbody></table></div>`;
}

async function patchStatus(id, status) {
  const { ok, data } = await api('PATCH', `/api/admin/orders/${id}/status`, { status });
  if (ok) showToast(`Order #${id} → ${status}`, 'success');
  else    showToast(data.message||'Failed.', 'error');
}

function prodFormHTML(p = {}) {
  return `
    <div class="form-row-2">
      <div class="form-group"><label>Title *</label>
        <input type="text" id="pf_t" value="${escHtml(p.title||'')}" placeholder="Book title" required /></div>
      <div class="form-group"><label>Author</label>
        <input type="text" id="pf_a" value="${escHtml(p.author||'')}" placeholder="Author" /></div>
    </div>
    <div class="form-group"><label>Description</label>
      <textarea id="pf_d" rows="3" style="width:100%;padding:.8rem;border:1.5px solid var(--border);border-radius:var(--r-lg);font-family:var(--font-sans);resize:vertical">${escHtml(p.description||'')}</textarea>
    </div>
    <div class="form-row-3">
      <div class="form-group"><label>Price ($) *</label>
        <input type="number" id="pf_p" value="${p.price||''}" step="0.01" min="0" required /></div>
      <div class="form-group"><label>Stock</label>
        <input type="number" id="pf_s" value="${p.stock||0}" min="0" /></div>
      <div class="form-group"><label>Rating</label>
        <input type="number" id="pf_r" value="${p.rating||4.0}" step="0.1" min="1" max="5" /></div>
    </div>
    <div class="form-row-2">
      <div class="form-group"><label>Category ID (1–6)</label>
        <input type="number" id="pf_c" value="${p.category_id||''}" /></div>
      <div class="form-group"><label>ISBN</label>
        <input type="text" id="pf_i" value="${escHtml(p.isbn||'')}" /></div>
    </div>
    <div class="form-group"><label>Cover Image URL</label>
      <input type="url" id="pf_u" value="${escHtml(p.image_url||'')}" placeholder="https://…" /></div>`;
}

function collectProd() {
  const t = document.getElementById('pf_t')?.value?.trim();
  const p = document.getElementById('pf_p')?.value;
  if (!t||!p) { showToast('Title and price required.', 'error'); return null; }
  return { title:t, price:+p, stock:+(document.getElementById('pf_s')?.value||0),
    author:document.getElementById('pf_a')?.value?.trim(),
    description:document.getElementById('pf_d')?.value?.trim(),
    rating:+(document.getElementById('pf_r')?.value||4.0),
    category_id:+(document.getElementById('pf_c')?.value)||null,
    isbn:document.getElementById('pf_i')?.value?.trim(),
    image_url:document.getElementById('pf_u')?.value?.trim() };
}

function openAddProd() {
  openModal(`<button class="modal-close" onclick="forceCloseModal()">✕</button>
    <h2 class="auth-title" style="text-align:left;font-size:1.4rem">Add Product</h2>
    ${prodFormHTML()}
    <button class="btn-primary" onclick="saveProd()">Save Product</button>`);
}

async function saveProd() {
  const body = collectProd(); if (!body) return;
  const { ok, data } = await api('POST', '/api/admin/products', body);
  if (ok) { forceCloseModal(); showToast('Created!', 'success'); loadAdminProds(); }
  else showToast(data.message||'Failed.', 'error');
}

async function openEditProd(id) {
  const { ok, data } = await api('GET', `/api/products/${id}`);
  if (!ok) { showToast('Load failed.', 'error'); return; }
  openModal(`<button class="modal-close" onclick="forceCloseModal()">✕</button>
    <h2 class="auth-title" style="text-align:left;font-size:1.4rem">Edit Product #${id}</h2>
    ${prodFormHTML(data.product)}
    <button class="btn-primary" onclick="updateProd(${id})">Update Product</button>`);
}

async function updateProd(id) {
  const body = collectProd(); if (!body) return;
  const { ok, data } = await api('PUT', `/api/admin/products/${id}`, body);
  if (ok) { forceCloseModal(); showToast('Updated!', 'success'); loadAdminProds(); }
  else showToast(data.message||'Failed.', 'error');
}

async function deleteProd(id) {
  if (!confirm('Delete this product?')) return;
  const { ok, data } = await api('DELETE', `/api/admin/products/${id}`);
  if (ok) { showToast('Deleted.', 'success'); loadAdminProds(); }
  else showToast(data.message||'Failed.', 'error');
}

// ── BOOT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize theme
  applyTheme();
  
  // Listen for OS theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if ((localStorage.getItem('bm_theme') || 'system') === 'system') applyTheme();
  });

  await checkAuth();

  // Hash routing
  const hash = (window.location.hash||'#home').replace('#','').split('/')[0];
  const validPages = ['home','shop','cart','checkout','orders','wishlist','admin','settings'];
  renderView(validPages.includes(hash) ? hash : 'home');

  // User button click
  document.getElementById('userBtn').addEventListener('click', () => {
    if (!state.user) openAuthModal('login');
  });

  // Logout
  document.getElementById('logoutLink')?.addEventListener('click', e => { e.preventDefault(); logout(); });

  // Nav search
  let nst;
  document.getElementById('navSearch').addEventListener('input', e => {
    clearTimeout(nst);
    nst = setTimeout(() => {
      state.filters.search = e.target.value.trim(); state.filters.page = 1;
      if (state.currentPage !== 'shop') navigate('shop'); else loadProducts();
    }, 350);
  });

  // Escape closes modal
  document.addEventListener('keydown', e => { if (e.key === 'Escape') forceCloseModal(); });
});
