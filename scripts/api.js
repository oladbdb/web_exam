const API_KEY = '54609f39-c7ad-4a93-ace6-5a3fb046d4bd';
const API_URL = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api';

let allProducts = []; 
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let cardTemplate;
let totalProducts = 0;
let currentSortType = 'default';

document.addEventListener('DOMContentLoaded', () => {
    cardTemplate = document.querySelector('.product-card').cloneNode(true);
    
    const sortSelect = document.querySelector('.sort-select');
    sortSelect.addEventListener('change', (event) => {
        sortProducts(event.target.value);
    });
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
} 



