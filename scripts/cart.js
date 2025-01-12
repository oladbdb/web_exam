async function displayCartProducts() {
    const productList = document.querySelector('.product-list');
    const cartEmpty = document.querySelector('.cart-empty');
    
    if (!productList) {
        console.error('Контейнер корзины не найден');
        return;
    }

    const products = await getCartProducts();
    
    if (cartEmpty && products.length === 0) {
        cartEmpty.style.display = 'block';
    }
    
    if (products.length === 0) {
        productList.innerHTML = '';
        return;
    }
    
    productList.innerHTML = '';
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}" class="product-image" />
            <h3 class="product-title">${product.name}</h3>
            <div class="product-rating">${'⭐'.repeat(Math.round(product.rating))}</div>
            <div class="product-price">
                <span class="price-current">₽${product.discount_price || product.actual_price}</span>
                ${product.discount_price ? `<span class="price-old">₽${product.actual_price}</span>` : ''}
            </div>
            <button class="delete-btn" onclick="removeFromCart(${product.id})">Удалить</button>
        `;
        productList.appendChild(card);
    });
}

function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(id => id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartProducts();
    showNotification('Товар удален из корзины');
}

document.addEventListener('DOMContentLoaded', displayCartProducts); 