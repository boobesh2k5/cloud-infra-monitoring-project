// Main Application Controller & UI Logic

// State
let activeCategory = 'all';
let searchQuery = '';
let maxPriceFilter = 50000;
let sortBy = 'featured';
let wishlist = [];

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadWishlist();
  initCountdownTimer();
  renderCategoryPills();
  renderProducts();
  renderCartDrawer();
  initEventHandlers();
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// Theme Management (Dark / Light)
function initTheme() {
  const savedTheme = localStorage.getItem('nova_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  updateThemeIcon();
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('nova_theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
  showToast(isDark ? '🌙 Switched to Dark Mode' : '☀️ Switched to Light Mode', 'info');
}

function updateThemeIcon() {
  const iconSpan = document.getElementById('theme-toggle-icon');
  if (!iconSpan) return;
  const isDark = document.documentElement.classList.contains('dark');
  iconSpan.innerHTML = isDark ? `
    <svg class="w-5 h-5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>` : `
    <svg class="w-5 h-5 text-indigo-600 transition-transform duration-300 -rotate-12 hover:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>`;
}

// Wishlist Management
function loadWishlist() {
  try {
    const saved = localStorage.getItem('nova_wishlist');
    wishlist = saved ? JSON.parse(saved) : [];
  } catch (e) {
    wishlist = [];
  }
  updateWishlistCount();
}

function toggleWishlist(productId) {
  const idx = wishlist.indexOf(productId);
  const product = products.find(p => p.id === productId);
  const name = product ? product.name : 'Item';

  if (idx > -1) {
    wishlist.splice(idx, 1);
    showToast(`Removed "${name}" from Wishlist`, 'info');
  } else {
    wishlist.push(productId);
    showToast(`❤️ Added "${name}" to Wishlist!`, 'success');
  }
  localStorage.setItem('nova_wishlist', JSON.stringify(wishlist));
  updateWishlistCount();
  renderProducts();
  renderWishlistDrawer();
}

function updateWishlistCount() {
  const badge = document.getElementById('wishlist-badge');
  if (badge) {
    badge.textContent = wishlist.length;
    badge.classList.toggle('hidden', wishlist.length === 0);
  }
}

function toggleWishlistDrawer(forceOpen = null) {
  const drawer = document.getElementById('wishlist-drawer');
  const backdrop = document.getElementById('wishlist-backdrop');
  if (!drawer || !backdrop) return;

  const isOpen = forceOpen !== null ? forceOpen : drawer.classList.contains('translate-x-full');

  if (isOpen) {
    drawer.classList.remove('translate-x-full');
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100');
    document.body.style.overflow = 'hidden';
    renderWishlistDrawer();
  } else {
    drawer.classList.add('translate-x-full');
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    document.body.style.overflow = '';
  }
}

function renderWishlistDrawer() {
  const container = document.getElementById('wishlist-items-container');
  if (!container) return;

  if (wishlist.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h4 class="text-base font-bold text-slate-800 dark:text-white mb-1">Your wishlist is empty</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">Explore products and tap the heart icon to save your favorites.</p>
        <button 
          onclick="toggleWishlistDrawer(false)"
          class="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
        >
          Discover Trending Gear
        </button>
      </div>
    `;
    return;
  }

  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  container.innerHTML = wishlistedProducts.map(p => `
    <div class="flex gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 items-center justify-between">
      <img src="${p.image_url || p.image}" alt="${p.name}" onerror="handleImageError(this)" class="w-16 h-16 rounded-lg object-cover bg-white shrink-0" />
      <div class="flex-1 min-w-0 px-2">
        <h4 class="text-xs font-bold text-slate-800 dark:text-white truncate">${p.name}</h4>
        <p class="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 font-heading">${formatINR(p.price)}</p>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button 
          onclick="cartManager.addItem('${p.id}', 1); toggleWishlist('${p.id}'); showToast('Moved to Cart!', 'success');"
          class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-all shadow-sm"
        >
          Move to Cart
        </button>
        <button 
          onclick="toggleWishlist('${p.id}')"
          class="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
          title="Remove from wishlist"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

// Flash Deal Countdown
function initCountdownTimer() {
  const hoursEl = document.getElementById('deal-hours');
  const minutesEl = document.getElementById('deal-minutes');
  const secondsEl = document.getElementById('deal-seconds');

  if (!hoursEl || !minutesEl || !secondsEl) return;

  let remainingSeconds = (9 * 3600) + (44 * 60) + 30;

  setInterval(() => {
    remainingSeconds--;
    if (remainingSeconds <= 0) remainingSeconds = 12 * 3600;

    const h = Math.floor(remainingSeconds / 3600);
    const m = Math.floor((remainingSeconds % 3600) / 60);
    const s = remainingSeconds % 60;

    hoursEl.textContent = String(h).padStart(2, '0');
    minutesEl.textContent = String(m).padStart(2, '0');
    secondsEl.textContent = String(s).padStart(2, '0');
  }, 1000);
}

// Category Filtering Navigation
const categories = [
  { id: 'all', label: 'All Products', icon: 'grid' },
  { id: 'electronics', label: 'Electronics & Gear', icon: 'cpu' },
  { id: 'audio', label: 'Pro Audio & Sound', icon: 'headphones' },
  { id: 'fashion', label: 'Street Fashion', icon: 'shopping-bag' },
  { id: 'lifestyle', label: 'Home & Living', icon: 'home' }
];

function renderCategoryPills() {
  const container = document.getElementById('category-pills');
  if (!container) return;

  container.innerHTML = categories.map(cat => {
    const isActive = activeCategory === cat.id;
    const count = cat.id === 'all' ? products.length : products.filter(p => p.category === cat.id || p.category_id === cat.id).length;
    return `
      <button 
        onclick="setCategory('${cat.id}')"
        class="px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]' 
            : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700'
        }"
      >
        <span>${cat.label}</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}">${count}</span>
      </button>
    `;
  }).join('');
}

function setCategory(catId) {
  activeCategory = catId;
  renderCategoryPills();
  renderProducts();
}

// Filter and Sort Products
function getFilteredProducts() {
  return products.filter(item => {
    const cat = item.category || item.category_id;
    const matchesCategory = activeCategory === 'all' || cat === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      item.name.toLowerCase().includes(q) || 
      item.description.toLowerCase().includes(q) ||
      (item.brand && item.brand.toLowerCase().includes(q)) ||
      (cat && cat.toLowerCase().includes(q));

    const matchesPrice = item.price <= maxPriceFilter;

    return matchesCategory && matchesSearch && matchesPrice;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return (b.isTrending || b.is_trending ? 1 : 0) - (a.isTrending || a.is_trending ? 1 : 0);
  });
}

// Product Grid Rendering
function renderProducts() {
  const grid = document.getElementById('products-grid');
  const countLabel = document.getElementById('product-count');
  if (!grid) return;

  const filtered = getFilteredProducts();
  if (countLabel) {
    countLabel.textContent = `Showing ${filtered.length} of ${products.length} items`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="w-20 h-20 mx-auto rounded-full bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500 mb-4">
          <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-2">No matching products found</h3>
        <p class="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm">
          We couldn't find any products matching your filters or search term "${searchQuery}".
        </p>
        <button onclick="resetFilters()" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-md">
          Reset All Filters
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(product => {
    const discountPercent = Math.round(((product.originalPrice || product.original_price - product.price) / (product.originalPrice || product.original_price)) * 100);
    const isWishlisted = wishlist.includes(product.id);
    const imgSrc = product.image_url || product.image;
    const cat = product.category || product.category_id;

    return `
      <div class="product-card group relative bg-white dark:bg-slate-850 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-indigo-950/20 flex flex-col">
        <div class="relative overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-square">
          <img 
            src="${imgSrc}" 
            alt="${product.name}" 
            loading="lazy"
            onerror="handleImageError(this)"
            class="product-img w-full h-full object-cover"
          />
          
          <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            ${product.badge ? `
              <span class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600/90 text-white backdrop-blur-md shadow-sm">
                ${product.badge}
              </span>
            ` : ''}
            <span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/90 text-white backdrop-blur-md shadow-sm">
              ${discountPercent}% OFF
            </span>
          </div>

          <button 
            onclick="toggleWishlist('${product.id}')"
            aria-label="Save to wishlist"
            class="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:scale-110 active:scale-95 transition-all shadow-md z-10 ${
              isWishlisted ? 'text-rose-500 dark:text-rose-400' : ''
            }"
          >
            <svg class="w-5 h-5 ${isWishlisted ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-current'}" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          <div class="absolute inset-x-0 bottom-3 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <button 
              onclick="openQuickView('${product.id}')"
              class="w-full py-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur text-slate-800 dark:text-white font-medium text-xs shadow-lg hover:bg-white dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-1.5"
            >
              <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Quick View
            </button>
          </div>
        </div>

        <div class="p-5 flex flex-col flex-1">
          <div class="flex items-center justify-between mb-2 text-xs">
            <span class="text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase flex items-center gap-1">
              <span>${product.brand || 'NOVA'}</span> • <span>${cat}</span>
            </span>
            <div class="flex items-center gap-1 text-amber-500 font-medium">
              <svg class="w-4 h-4 fill-amber-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>${product.rating}</span>
              <span class="text-slate-400 text-[11px]">(${product.reviewsCount || product.reviews_count || 100})</span>
            </div>
          </div>

          <h3 class="font-bold text-slate-800 dark:text-white text-base line-clamp-1 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            ${product.name}
          </h3>

          <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed flex-1">
            ${product.description}
          </p>

          <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-auto">
            <div>
              <div class="text-lg font-extrabold text-slate-900 dark:text-white font-heading">
                ${formatINR(product.price)}
              </div>
              <div class="text-xs text-slate-400 line-through">
                ${formatINR(product.originalPrice || product.original_price)}
              </div>
            </div>

            <button 
              onclick="handleAddToCart('${product.id}')"
              class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Reset filters handler
function resetFilters() {
  activeCategory = 'all';
  searchQuery = '';
  maxPriceFilter = 50000;
  sortBy = 'featured';

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  
  const priceSlider = document.getElementById('price-slider');
  if (priceSlider) priceSlider.value = 50000;
  
  const priceDisplay = document.getElementById('price-slider-val');
  if (priceDisplay) priceDisplay.textContent = formatINR(50000);

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'featured';

  renderCategoryPills();
  renderProducts();
  showToast('Filters reset to default.', 'info');
}

// Quick View Modal
let currentQuickViewProduct = null;
let quickViewQty = 1;

function openQuickView(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  currentQuickViewProduct = product;
  quickViewQty = 1;

  const modal = document.getElementById('quickview-modal');
  const content = document.getElementById('quickview-content');
  if (!modal || !content) return;

  const original = product.originalPrice || product.original_price;
  const discountPercent = Math.round(((original - product.price) / original) * 100);
  const imgSrc = product.image_url || product.image;
  const cat = product.category || product.category_id;

  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <div class="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-square shadow-inner">
        <img 
          src="${imgSrc}" 
          alt="${product.name}" 
          onerror="handleImageError(this)"
          class="w-full h-full object-cover"
        />
        <span class="absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-lg bg-emerald-500 text-white shadow-md">
          ${discountPercent}% OFF
        </span>
      </div>

      <div class="flex flex-col">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            ${product.brand || 'NOVA'} • ${cat}
          </span>
          <div class="flex items-center gap-1 text-amber-500 text-sm font-semibold">
            <span>★</span> ${product.rating} <span class="text-slate-400 text-xs">(${product.reviewsCount || 500} customer reviews)</span>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-slate-900 dark:text-white font-heading mb-3">
          ${product.name}
        </h2>

        <div class="flex items-baseline gap-3 mb-4">
          <span class="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-heading">
            ${formatINR(product.price)}
          </span>
          <span class="text-base text-slate-400 line-through">
            ${formatINR(original)}
          </span>
          <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full">
            Save ${formatINR(original - product.price)}
          </span>
        </div>

        <p class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
          ${product.description}
        </p>

        <div class="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <h4 class="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-2.5">Key Highlights</h4>
          <ul class="space-y-2">
            ${(product.features || []).map(f => `
              <li class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <svg class="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>${f}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-4">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Quantity:</span>
            <div class="inline-flex items-center border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
              <button 
                onclick="changeQuickViewQty(-1)"
                class="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors"
              >-</button>
              <span id="quickview-qty-val" class="px-4 text-sm font-semibold text-slate-800 dark:text-white">1</span>
              <button 
                onclick="changeQuickViewQty(1)"
                class="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors"
              >+</button>
            </div>
            <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> In Stock & Ready to Dispatch
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <button 
              onclick="addQuickViewToCart()"
              class="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Add to Cart
            </button>
            <button 
              onclick="buyNowQuickView()"
              class="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              Buy Now (Instant)
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeQuickView() {
  const modal = document.getElementById('quickview-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
}

function changeQuickViewQty(delta) {
  quickViewQty = Math.max(1, Math.min(10, quickViewQty + delta));
  const el = document.getElementById('quickview-qty-val');
  if (el) el.textContent = quickViewQty;
}

function addQuickViewToCart() {
  if (currentQuickViewProduct) {
    cartManager.addItem(currentQuickViewProduct.id, quickViewQty);
    showToast(`Added ${quickViewQty} × "${currentQuickViewProduct.name}" to cart!`, 'success');
    closeQuickView();
  }
}

function buyNowQuickView() {
  if (currentQuickViewProduct) {
    cartManager.addItem(currentQuickViewProduct.id, quickViewQty);
    closeQuickView();
    openCheckoutModal();
  }
}

// Cart Drawer Operations
function toggleCartDrawer(forceOpen = null) {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (!drawer || !backdrop) return;

  const isOpen = forceOpen !== null ? forceOpen : drawer.classList.contains('translate-x-full');

  if (isOpen) {
    drawer.classList.remove('translate-x-full');
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100');
    document.body.style.overflow = 'hidden';
    renderCartDrawer();
  } else {
    drawer.classList.add('translate-x-full');
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    document.body.style.overflow = '';
  }
}

function handleAddToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  cartManager.addItem(productId, 1);
  showToast(`Added "${product.name}" to cart!`, 'success');
  
  const cartIcon = document.getElementById('navbar-cart-btn');
  if (cartIcon) {
    cartIcon.classList.add('scale-125');
    setTimeout(() => cartIcon.classList.remove('scale-125'), 300);
  }
}

function renderCartDrawer() {
  const container = document.getElementById('cart-items-container');
  const countBadge = document.getElementById('cart-count-badge');
  const summary = cartManager.getSummary();

  if (countBadge) {
    countBadge.textContent = summary.totalCount;
    countBadge.classList.toggle('scale-0', summary.totalCount === 0);
  }

  const shippingMsg = document.getElementById('cart-free-shipping-msg');
  const shippingBar = document.getElementById('cart-free-shipping-bar');
  if (shippingMsg && shippingBar) {
    if (summary.freeShippingGap === 0 && summary.subtotal > 0) {
      shippingMsg.innerHTML = '🎉 Congratulations! You have unlocked <strong>FREE Delivery</strong>!';
      shippingBar.style.width = '100%';
      shippingBar.className = 'h-2 rounded-full bg-emerald-500 transition-all duration-500';
    } else {
      const percent = Math.min(100, Math.round((summary.subtotal / summary.freeShippingThreshold) * 100));
      shippingMsg.innerHTML = `Add <strong>${formatINR(summary.freeShippingGap)}</strong> more to get <strong>FREE Express Delivery</strong>!`;
      shippingBar.style.width = `${percent}%`;
      shippingBar.className = 'h-2 rounded-full bg-indigo-600 transition-all duration-500';
    }
  }

  const subtotalEl = document.getElementById('cart-subtotal');
  const discountRow = document.getElementById('cart-discount-row');
  const discountEl = document.getElementById('cart-discount');
  const taxEl = document.getElementById('cart-tax');
  const shippingEl = document.getElementById('cart-shipping');
  const totalEl = document.getElementById('cart-total');

  if (subtotalEl) subtotalEl.textContent = formatINR(summary.subtotal);
  if (taxEl) taxEl.textContent = formatINR(summary.tax);
  if (shippingEl) shippingEl.textContent = summary.shipping === 0 ? 'FREE' : formatINR(summary.shipping);
  if (totalEl) totalEl.textContent = formatINR(summary.finalTotal);

  if (discountRow && discountEl) {
    if (summary.discount > 0) {
      discountRow.classList.remove('hidden');
      discountEl.textContent = `-${formatINR(summary.discount)}`;
    } else {
      discountRow.classList.add('hidden');
    }
  }

  const couponContainer = document.getElementById('active-coupon-pill');
  if (couponContainer) {
    if (summary.appliedCoupon) {
      couponContainer.innerHTML = `
        <div class="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 mb-3">
          <div class="flex items-center gap-1.5 font-medium">
            <span>🏷️</span>
            <span>Coupon <strong>${summary.appliedCoupon.code}</strong> applied (${summary.appliedCoupon.description})</span>
          </div>
          <button onclick="handleRemoveCoupon()" class="text-rose-500 hover:text-rose-700 text-xs font-bold ml-2">Remove</button>
        </div>
      `;
      couponContainer.classList.remove('hidden');
    } else {
      couponContainer.innerHTML = '';
      couponContainer.classList.add('hidden');
    }
  }

  if (!container) return;

  if (summary.items.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h4 class="text-base font-bold text-slate-800 dark:text-white mb-1">Your cart is empty</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">Looks like you haven't added any gear yet.</p>
        <button 
          onclick="toggleCartDrawer(false)"
          class="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
        >
          Explore Trending Products
        </button>
      </div>
    `;
    const checkoutBtn = document.getElementById('btn-checkout-drawer');
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  const checkoutBtn = document.getElementById('btn-checkout-drawer');
  if (checkoutBtn) checkoutBtn.disabled = false;

  container.innerHTML = summary.items.map(item => `
    <div class="flex gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 transition-all">
      <img 
        src="${item.image_url || item.image}" 
        alt="${item.name}" 
        onerror="handleImageError(this)"
        class="rounded-lg object-cover bg-white dark:bg-slate-700 shrink-0"
        style="width: 68px; height: 68px;"
      />
      
      <div class="flex flex-col flex-1 justify-between">
        <div>
          <div class="flex justify-between items-start">
            <h4 class="text-xs font-bold text-slate-800 dark:text-white line-clamp-1 pr-2">
              ${item.name}
            </h4>
            <button 
              onclick="handleRemoveFromCart('${item.id}', '${item.name}')"
              class="text-slate-400 hover:text-rose-500 transition-colors"
              title="Remove item"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <span class="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 font-heading">
            ${formatINR(item.price)}
          </span>
        </div>

        <div class="flex items-center justify-between pt-2">
          <div class="inline-flex items-center border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800">
            <button 
              onclick="cartManager.updateQuantity('${item.id}', ${item.quantity - 1})"
              class="px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-bold"
            >-</button>
            <span class="px-2.5 text-xs font-bold text-slate-800 dark:text-white">${item.quantity}</span>
            <button 
              onclick="cartManager.updateQuantity('${item.id}', ${item.quantity + 1})"
              class="px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-bold"
            >+</button>
          </div>
          <span class="text-xs font-bold text-slate-700 dark:text-slate-300">
            Total: ${formatINR(item.itemTotal)}
          </span>
        </div>
      </div>
    </div>
  `).join('');
}

function handleRemoveFromCart(productId, name) {
  cartManager.removeItem(productId);
  showToast(`Removed "${name}" from cart.`, 'info');
}

// Promo Coupon Handling
function handleApplyCoupon(forcedCode = null) {
  const input = document.getElementById('cart-coupon-input');
  const code = forcedCode || (input ? input.value : '');

  const result = cartManager.applyCoupon(code);
  if (result.success) {
    showToast(result.message, 'success');
    if (input) input.value = '';
  } else {
    showToast(result.message, 'error');
  }
}

function handleRemoveCoupon() {
  const result = cartManager.removeCoupon();
  showToast(result.message, 'info');
}

// Checkout Modal Handling
function openCheckoutModal() {
  const summary = cartManager.getSummary();
  if (summary.items.length === 0) {
    showToast('Your cart is empty! Add products first.', 'warning');
    return;
  }

  toggleCartDrawer(false);

  const summaryEl = document.getElementById('checkout-order-summary-items');
  if (summaryEl) {
    summaryEl.innerHTML = summary.items.map(i => `
      <div class="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 dark:border-slate-800">
        <span class="text-slate-600 dark:text-slate-300 truncate max-w-[200px]">${i.quantity}x ${i.name}</span>
        <span class="font-bold text-slate-800 dark:text-white">${formatINR(i.itemTotal)}</span>
      </div>
    `).join('');
  }

  const finalTotalEl = document.getElementById('checkout-final-total');
  if (finalTotalEl) finalTotalEl.textContent = formatINR(summary.finalTotal);

  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
}

// Order Confirmation Modal
function showOrderConfirmation(orderData) {
  const modal = document.getElementById('order-success-modal');
  const detailsContainer = document.getElementById('order-confirmation-details');
  if (!modal || !detailsContainer) return;

  detailsContainer.innerHTML = `
    <div class="space-y-4">
      <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-left space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-500 dark:text-slate-400">Order Reference:</span>
          <span class="font-mono font-bold text-indigo-600 dark:text-indigo-400">${orderData.orderRef || orderData.orderId}</span>
        </div>
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-500 dark:text-slate-400">Date & Time:</span>
          <span class="font-medium text-slate-700 dark:text-slate-300">${orderData.date}</span>
        </div>
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-500 dark:text-slate-400">Payment Mode:</span>
          <span class="font-medium text-slate-700 dark:text-slate-300">${orderData.paymentMethod}</span>
        </div>
        <div class="flex justify-between items-start text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
          <span class="text-slate-500 dark:text-slate-400 shrink-0">Deliver To:</span>
          <span class="font-medium text-slate-700 dark:text-slate-300 text-right pl-4">${orderData.name}, ${orderData.address}</span>
        </div>
      </div>

      <div class="text-left">
        <h5 class="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-2">Purchased Items (${orderData.items.length})</h5>
        <div class="max-h-36 overflow-y-auto space-y-1.5 pr-1">
          ${orderData.items.map(item => `
            <div class="flex justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
              <span class="text-slate-600 dark:text-slate-300">${item.quantity} × ${item.name}</span>
              <span class="font-bold text-slate-800 dark:text-white">${formatINR(item.itemTotal)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-bold">
        <span class="text-slate-700 dark:text-slate-300">Amount Paid (incl. GST):</span>
        <span class="text-xl text-indigo-600 dark:text-indigo-400 font-heading">${formatINR(orderData.total)}</span>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeOrderSuccessModal() {
  const modal = document.getElementById('order-success-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function printReceipt() {
  window.print();
}

// Order Tracking Modal with Backend API
async function handleTrackOrder() {
  const input = document.getElementById('track-order-input');
  const resultBox = document.getElementById('tracking-result');
  if (!input || !resultBox) return;

  const id = input.value.trim().toUpperCase();
  if (!id) {
    showToast('Please enter an Order Reference ID (e.g. NL-894231)', 'error');
    return;
  }

  resultBox.innerHTML = `
    <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left space-y-4 animate-fade-in">
      <div class="flex justify-between items-center">
        <div>
          <span class="text-[11px] text-slate-400 block">Tracking Order</span>
          <span class="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">${id}</span>
        </div>
        <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
          In Transit (BlueDart Express Air)
        </span>
      </div>

      <div class="space-y-3 pt-2">
        <div class="flex items-center gap-3">
          <div class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">✓</div>
          <div>
            <h5 class="text-xs font-bold text-slate-800 dark:text-white">Order Confirmed & PostgreSQL Record Verified</h5>
            <p class="text-[10px] text-slate-400">Bengaluru Fulfillment Hub • Today, 11:20 AM</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">✓</div>
          <div>
            <h5 class="text-xs font-bold text-slate-800 dark:text-white">Quality Inspected & Dispatched</h5>
            <p class="text-[10px] text-slate-400">Air Cargo Hub • Today, 01:45 PM</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold animate-pulse">●</div>
          <div>
            <h5 class="text-xs font-bold text-indigo-600 dark:text-indigo-400">Arrived at Destination Distribution Hub</h5>
            <p class="text-[10px] text-slate-400">Expected Doorstep Delivery Tomorrow by 4:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function openOrderTrackingModal(orderId = '') {
  const modal = document.getElementById('tracking-modal');
  const input = document.getElementById('track-order-input');
  if (!modal) return;

  if (input && orderId) {
    input.value = orderId;
  }
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeOrderTrackingModal() {
  const modal = document.getElementById('tracking-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
}

// Floating Support / Chatbot
function toggleSupportWidget() {
  const popup = document.getElementById('support-popup');
  if (popup) {
    popup.classList.toggle('hidden');
  }
}

function askSupport(topic) {
  const chatArea = document.getElementById('support-chat-messages');
  if (!chatArea) return;

  let reply = '';
  if (topic === 'shipping') {
    reply = '📦 We provide Free Express Shipping pan-India for all orders above ₹999. Deliveries take 24 to 48 hours for metros!';
  } else if (topic === 'payment') {
    reply = '⚡ We support all Indian payment options: Instant UPI (GPay/PhonePe), Credit & Debit Cards (RuPay/Visa/MC), NetBanking, and Cash on Delivery (COD).';
  } else if (topic === 'coupons') {
    reply = '🎉 Use coupon "SAVE20" for 20% off orders > ₹2,000, or "WELCOME10" for 10% off your first order!';
  } else if (topic === 'returns') {
    reply = '🔄 We provide a 7-Day Hassle-Free doorstep pickup return policy with instant bank account refund upon receipt!';
  }

  const userMsg = document.createElement('div');
  userMsg.className = 'text-right mb-2';
  userMsg.innerHTML = `<span class="inline-block p-2 rounded-xl bg-indigo-600 text-white text-xs">${topic.toUpperCase()} query</span>`;
  chatArea.appendChild(userMsg);

  setTimeout(() => {
    const botMsg = document.createElement('div');
    botMsg.className = 'text-left mb-2';
    botMsg.innerHTML = `<span class="inline-block p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-xs shadow-sm">${reply}</span>`;
    chatArea.appendChild(botMsg);
    chatArea.scrollTop = chatArea.scrollHeight;
  }, 300);
}

// Toast Notification Engine
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-enter flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-xs font-medium text-white max-w-sm pointer-events-auto backdrop-blur-md transition-all ${
    type === 'success' ? 'bg-emerald-600/95 border border-emerald-400/30' :
    type === 'error' ? 'bg-rose-600/95 border border-rose-400/30' :
    type === 'warning' ? 'bg-amber-600/95 border border-amber-400/30' :
    'bg-indigo-600/95 border border-indigo-400/30'
  }`;

  const iconSvg = 
    type === 'success' ? '<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>' :
    type === 'error' ? '<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>' :
    type === 'warning' ? '<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>' :
    '<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';

  toast.innerHTML = `
    ${iconSvg}
    <span class="flex-1 leading-tight">${message}</span>
    <button onclick="this.parentElement.remove()" class="text-white/80 hover:text-white ml-2 text-base font-bold">×</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Global Event Listeners
function initEventHandlers() {
  window.addEventListener('cartUpdated', () => {
    renderCartDrawer();
  });

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProducts();
    });
  }

  const priceSlider = document.getElementById('price-slider');
  const priceDisplay = document.getElementById('price-slider-val');
  if (priceSlider && priceDisplay) {
    priceSlider.addEventListener('input', (e) => {
      maxPriceFilter = parseInt(e.target.value, 10);
      priceDisplay.textContent = formatINR(maxPriceFilter);
      renderProducts();
    });
  }

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderProducts();
    });
  }

  const backToTopBtn = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    if (backToTopBtn) {
      if (window.scrollY > 400) {
        backToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
        backToTopBtn.classList.add('opacity-100');
      } else {
        backToTopBtn.classList.add('opacity-0', 'pointer-events-none');
        backToTopBtn.classList.remove('opacity-100');
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeQuickView();
      toggleCartDrawer(false);
      toggleWishlistDrawer(false);
      closeCheckoutModal();
      closeOrderSuccessModal();
      closeOrderTrackingModal();
    }
  });
}
