/**
 * Apple Store India — Interactive JavaScript
 * Handles: Navbar scroll, search, hamburger menu,
 *          shopping bag sidebar, scroll-reveal, toast.
 */

/* ═══════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════ */

/** Safely get element by ID (logs warning if missing) */
function qs(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`[Apple Store] Element #${id} not found.`);
    return el;
}

/** Format INR rupee string → number */
function parsePrice(str) {
    return parseInt(str.replace(/[^0-9]/g, ''), 10) || 0;
}

/** Format number → ₹ string */
function formatPrice(num) {
    return '₹' + num.toLocaleString('en-IN');
}

/* ═══════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════ */
const state = {
    cart: [],      // [{ product, price, img, qty }]
    isBagOpen: false,
    isSearchOpen: false,
    isMobileMenuOpen: false,
};

/* ═══════════════════════════════════════════════════════
   DOM REFERENCES
   ═══════════════════════════════════════════════════════ */
const navbar            = document.getElementById('navbar');
const bagSidebar        = document.getElementById('bag-sidebar');
const bagCloseBtn       = qs('bag-close-btn');
const bagToggleBtn      = qs('bag-toggle-btn');
const bagCount          = qs('bag-count');
const bagItemsWrap      = qs('bag-items-wrap');
const bagEmptyState     = qs('bag-empty-state');
const bagTotal          = qs('bag-total');
const overlay           = qs('overlay');
const searchToggleBtn   = qs('search-toggle-btn');
const searchBar         = qs('search-bar');
const searchCancelBtn   = qs('search-cancel-btn');
const searchInput       = qs('search-input');
const hamburgerBtn      = qs('hamburger-btn');
const mobileMenu        = qs('mobile-menu');
const checkoutBtn       = qs('checkout-btn');
const continueBtn       = qs('continue-shopping-btn');
const toast             = qs('toast');
const toastMsg          = qs('toast-msg');

/* ═══════════════════════════════════════════════════════
   NAVBAR: scroll effect
   ═══════════════════════════════════════════════════════ */
let ticking = false;

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            if (window.scrollY > 8) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            ticking = false;
        });
        ticking = true;
    }
}, { passive: true });

/* ═══════════════════════════════════════════════════════
   SEARCH BAR
   ═══════════════════════════════════════════════════════ */
function openSearch() {
    state.isSearchOpen = true;
    searchBar.classList.add('open');
    searchBar.setAttribute('aria-hidden', 'false');
    searchToggleBtn.setAttribute('aria-expanded', 'true');
    // wait for transition then focus
    setTimeout(() => { if (searchInput) searchInput.focus(); }, 310);
}

function closeSearch() {
    state.isSearchOpen = false;
    searchBar.classList.remove('open');
    searchBar.setAttribute('aria-hidden', 'true');
    searchToggleBtn.setAttribute('aria-expanded', 'false');
    if (searchInput) searchInput.value = '';
}

searchToggleBtn?.addEventListener('click', () => {
    if (state.isSearchOpen) { closeSearch(); } else { openSearch(); }
});

searchCancelBtn?.addEventListener('click', closeSearch);

searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
});

/* ═══════════════════════════════════════════════════════
   HAMBURGER / MOBILE MENU
   ═══════════════════════════════════════════════════════ */
function toggleMobileMenu() {
    state.isMobileMenuOpen = !state.isMobileMenuOpen;
    hamburgerBtn.classList.toggle('open', state.isMobileMenuOpen);
    mobileMenu.classList.toggle('open', state.isMobileMenuOpen);
    hamburgerBtn.setAttribute('aria-expanded', state.isMobileMenuOpen.toString());
    mobileMenu.setAttribute('aria-hidden', (!state.isMobileMenuOpen).toString());

    if (state.isMobileMenuOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

hamburgerBtn?.addEventListener('click', toggleMobileMenu);

// Close mobile menu when a link is clicked
document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (state.isMobileMenuOpen) toggleMobileMenu();
    });
});

/* ═══════════════════════════════════════════════════════
   SHOPPING BAG SIDEBAR
   ═══════════════════════════════════════════════════════ */
function openBag() {
    state.isBagOpen = true;
    bagSidebar.classList.add('open');
    bagSidebar.setAttribute('aria-hidden', 'false');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    bagToggleBtn.setAttribute('aria-expanded', 'true');
}

function closeBag() {
    state.isBagOpen = false;
    bagSidebar.classList.remove('open');
    bagSidebar.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
    bagToggleBtn.setAttribute('aria-expanded', 'false');
}

bagToggleBtn?.addEventListener('click', () => {
    if (state.isBagOpen) { closeBag(); } else { openBag(); }
});

bagCloseBtn?.addEventListener('click', closeBag);
overlay?.addEventListener('click', closeBag);
continueBtn?.addEventListener('click', closeBag);

// Keyboard: close sidebar on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (state.isBagOpen)      closeBag();
        if (state.isSearchOpen)   closeSearch();
        if (state.isMobileMenuOpen) toggleMobileMenu();
    }
});

/* ── Render Bag ── */
function renderBag() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = state.cart.reduce((sum, item) => sum + parsePrice(item.price) * item.qty, 0);

    // Badge
    if (totalItems > 0) {
        bagCount.textContent = totalItems > 99 ? '99+' : totalItems;
        bagCount.classList.add('show');
    } else {
        bagCount.textContent = '0';
        bagCount.classList.remove('show');
    }

    // Total
    bagTotal.textContent = totalPrice > 0 ? formatPrice(totalPrice) : '₹0';

    // Items
    if (!bagItemsWrap) return;

    if (state.cart.length === 0) {
        bagItemsWrap.innerHTML = '';
        if (bagEmptyState) {
            bagEmptyState.style.display = 'flex';
            bagItemsWrap.appendChild(bagEmptyState);
        }
        return;
    }

    // Remove empty state
    if (bagEmptyState) bagEmptyState.style.display = 'none';

    // Re-render items
    // Remove old items but keep empty state node
    Array.from(bagItemsWrap.querySelectorAll('.bag-item')).forEach(el => el.remove());

    state.cart.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'bag-item';
        itemEl.setAttribute('data-index', index);
        itemEl.innerHTML = `
            <img
                class="bag-item-img"
                src="${item.img}"
                alt="${item.product}"
                loading="lazy"
            >
            <div class="bag-item-info">
                <p class="bag-item-name">${item.product}</p>
                <p class="bag-item-price">${item.price}</p>
                <div class="bag-item-qty">
                    <button class="qty-btn qty-minus" data-index="${index}" aria-label="Decrease quantity">−</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-btn qty-plus"  data-index="${index}" aria-label="Increase quantity">+</button>
                </div>
            </div>
            <button class="bag-item-remove" data-index="${index}" aria-label="Remove ${item.product}">✕</button>
        `;
        bagItemsWrap.appendChild(itemEl);
    });

    // Quantity & remove events
    bagItemsWrap.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = parseInt(btn.dataset.index, 10);
            if (state.cart[i].qty > 1) {
                state.cart[i].qty--;
            } else {
                state.cart.splice(i, 1);
            }
            renderBag();
        });
    });

    bagItemsWrap.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = parseInt(btn.dataset.index, 10);
            state.cart[i].qty++;
            renderBag();
        });
    });

    bagItemsWrap.querySelectorAll('.bag-item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = parseInt(btn.dataset.index, 10);
            state.cart.splice(i, 1);
            renderBag();
        });
    });
}

/* ═══════════════════════════════════════════════════════
   ADD TO BAG — buttons
   ═══════════════════════════════════════════════════════ */
let toastTimer = null;

function showToast(message) {
    if (!toast || !toastMsg) return;
    toastMsg.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.classList.remove('show'); }, 2800);
}

function addToBag(btn) {
    const product = btn.dataset.product || 'Product';
    const price   = btn.dataset.price   || '₹0';
    const img     = btn.dataset.img     || '';

    // Check if already in cart
    const existing = state.cart.find(item => item.product === product);
    if (existing) {
        existing.qty++;
    } else {
        state.cart.push({ product, price, img, qty: 1 });
    }

    renderBag();

    // Button feedback
    const originalText = btn.textContent;
    btn.textContent = '✓ Added!';
    btn.style.color = '#34c759';
    btn.disabled = true;
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.color = '';
        btn.disabled = false;
    }, 1400);

    // Toast + open sidebar after short delay
    showToast(`${product} added to Bag`);
    setTimeout(() => { openBag(); }, 600);
}

// Attach to all Add to Bag buttons
document.querySelectorAll('.add-to-bag-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        addToBag(btn);
    });
});

/* ═══════════════════════════════════════════════════════
   CHECKOUT
   ═══════════════════════════════════════════════════════ */
checkoutBtn?.addEventListener('click', () => {
    if (state.cart.length === 0) {
        showToast('Your bag is empty — add items first!');
        return;
    }
    const total = state.cart.reduce((s, item) => s + parsePrice(item.price) * item.qty, 0);
    alert(`🛍️ Proceeding to checkout\n\nItems: ${state.cart.map(i => `${i.qty}× ${i.product} (${i.price})`).join('\n')}\n\nTotal: ${formatPrice(total)}\n\n(Secure Apple Pay checkout — India)`);
});

/* ═══════════════════════════════════════════════════════
   SCROLL REVEAL
   ═══════════════════════════════════════════════════════ */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px',
});

document.querySelectorAll('.reveal-section').forEach((el) => {
    revealObserver.observe(el);
});

/* ═══════════════════════════════════════════════════════
   SMOOTH ANCHOR SCROLL (with navbar offset)
   ═══════════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'), 10) || 52;
        const top = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top, behavior: 'smooth' });
    });
});

/* ═══════════════════════════════════════════════════════
   INITIAL RENDER
   ═══════════════════════════════════════════════════════ */
renderBag();

console.log('%c🍎 Apple Store India', 'font-size:18px; font-weight:bold; color:#0071e3;');
console.log('%cHigh-fidelity clone — Built with ❤️', 'color:#6e6e73; font-size:13px;');