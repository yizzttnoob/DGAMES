// ==================== KERANJANG TERPUSAT ====================
if (typeof CART_STORAGE_KEY === 'undefined') {
    var CART_STORAGE_KEY = 'shopping_cart';
}

function getCart() {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch(e) {
            return [];
        }
    }
    return [];
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartBadge();
    // Trigger event untuk halaman lain
    window.dispatchEvent(new Event('cart-updated'));
    try {
        window.dispatchEvent(new StorageEvent('storage', { key: CART_STORAGE_KEY, newValue: JSON.stringify(cart) }));
    } catch(e) {}
}

function updateCartBadge() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
        if (totalItems > 0) {
            badge.textContent = totalItems;
            badge.style.display = 'flex';
            badge.classList.add('pop');
            setTimeout(() => badge.classList.remove('pop'), 200);
        } else {
            badge.style.display = 'none';
        }
    });
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    const bgColor = type === 'success' ? '#10b981' : '#ef4444';
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        border-left: 4px solid #3b82f6;
        z-index: 9999;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function addToCart(id, name, price, image) {
    let cart = getCart();
    const existing = cart.find(item => item.id === id);
    const safePrice = typeof price === 'number' ? price : 0;
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({ id, name, price: safePrice, image, quantity: 1 });
    }
    saveCart(cart);
    showToast(`✅ ${name} ditambahkan ke keranjang`);
}

// ========== OTOMATIS ATTACH KE SEMUA TOMBOL ==========
function attachCartEvents() {
    const cards = document.querySelectorAll('.group');
    cards.forEach(card => {
        const btn = card.querySelector('.bg-blue-600, .bg-blue-500, .game-btn');
        if (!btn || btn.hasAttribute('data-cart-attached')) return;

        const nameEl = card.querySelector('h3');
        const priceEl = card.querySelector('.text-green-400, .text-orange-400');
        const imgEl = card.querySelector('img');
        if (!nameEl || !imgEl) return;

        const gameName = nameEl.innerText.trim();
        let priceValue = 0;
        if (priceEl) {
            let priceText = priceEl.innerText.trim();
            if (priceText !== 'Free') {
                const match = priceText.match(/[\d.]+/);
                if (match) priceValue = parseFloat(match[0]);
            }
        }
        const gameImage = imgEl.src;
        const gameId = gameName.toLowerCase().replace(/[^a-z0-9]/g, '_');

        btn.setAttribute('data-game-id', gameId);
        btn.setAttribute('data-game-name', gameName);
        btn.setAttribute('data-game-price', priceValue);
        btn.setAttribute('data-game-image', gameImage);
        btn.setAttribute('data-cart-attached', 'true');

        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = newBtn.getAttribute('data-game-id');
            const name = newBtn.getAttribute('data-game-name');
            const price = parseFloat(newBtn.getAttribute('data-game-price')) || 0;
            const image = newBtn.getAttribute('data-game-image');
            addToCart(id, name, price, image);
        });
    });
}

// Jalankan saat halaman siap
document.addEventListener('DOMContentLoaded', () => {
    attachCartEvents();
    updateCartBadge();

    document.querySelectorAll('.cart-button, .bi-cart').forEach(btn => {
        const clickable = btn.closest('button') || btn;
        clickable.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'cart.html';
        });
    });
});

// Untuk card yang dimuat kemudian
setInterval(attachCartEvents, 1500);

if (!document.querySelector('#cart-sync-style')) {
    const style = document.createElement('style');
    style.id = 'cart-sync-style';
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes badgePop {
            0% { transform: scale(1); }
            50% { transform: scale(1.3); }
            100% { transform: scale(1); }
        }
        .cart-badge.pop {
            animation: badgePop 0.2s ease;
        }
    `;
    document.head.appendChild(style);
}