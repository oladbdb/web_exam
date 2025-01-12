const API_KEY = '54609f39-c7ad-4a93-ace6-5a3fb046d4bd';
const API_URL = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api';

let allProducts = []; 
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let cardTemplate;
let totalProducts = 0;
let currentSortType = 'default';

document.addEventListener('DOMContentLoaded', () => {
    const productCard = document.querySelector('.product-card');
    if (productCard) {
        cardTemplate = productCard.cloneNode(true);
    }
    
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (event) => {
            sortProducts(event.target.value);
        });
    }
}); 

function displayProducts(replace = true) {
    const productList = document.querySelector('.product-list');
    
    if (replace) {
        productList.innerHTML = '';
    }
    
    allProducts.forEach(product => {
        const card = cardTemplate.cloneNode(true);
        displayProductCard(card, product);
        productList.appendChild(card);
    });
}

function displayProductCard(card, product) {
    card.querySelector('.product-image').src = product.image_url;
    card.querySelector('.product-title').textContent = product.name;
    card.querySelector('.product-rating').textContent = '⭐'.repeat(Math.round(product.rating));
    
    const currentPrice = card.querySelector('.price-current');
    const oldPrice = card.querySelector('.price-old');
    
    if (product.discount_price) {
        currentPrice.textContent = `₽${product.discount_price}`;
        oldPrice.textContent = `₽${product.actual_price}`;
        oldPrice.style.display = 'inline';
    } else {
        currentPrice.textContent = `₽${product.actual_price}`;
        oldPrice.style.display = 'none';
    }

    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    addToCartBtn.onclick = () => addToCart(product.id);
} 

async function getProductById(productId) {
    try {
        const response = await fetch(`${API_URL}/goods/${productId}?api_key=${API_KEY}`);
        if (!response.ok) {
            throw new Error('Не удалось получить данные о товаре');
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка при получении данных о товаре:', error);
        return null;
    }
}

function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (!cart.includes(productId)) {
        cart.push(productId);
        localStorage.setItem('cart', JSON.stringify(cart));
        showNotification('Товар добавлен в корзину');
    } else {
        showNotification('Товар уже в корзине', true);
    }
}

async function getCartProducts() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const products = [];
    
    for (const productId of cart) {
        const product = await getProductById(productId);
        if (product) {
            products.push(product);
        }
    }
    
    return products;
}

async function createOrder(orderData) {
    try {
        const response = await fetch(`${API_URL}/orders?api_key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error('Ошибка при создании заказа');
        }

        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        throw error;
    }
}



