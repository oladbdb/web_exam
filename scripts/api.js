const API_KEY = '54609f39-c7ad-4a93-ace6-5a3fb046d4bd';
const API_URL = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api';

let allProducts = []; 
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/goods?api_key=${API_KEY}`);
        allProducts = await response.json();
        
        displayProducts();
        updateLoadMoreButton();
        
    } catch (error) {
        console.error('Ошибка при загрузке товаров:', error);
    }
}

function sortProducts(sortType) {
    switch(sortType) {
        case 'price-asc':
            allProducts.sort((a, b) => {
                const priceA = a.discount_price || a.actual_price;
                const priceB = b.discount_price || b.actual_price;
                return priceA - priceB;
            });
            break;
        case 'price-desc':
            allProducts.sort((a, b) => {
                const priceA = a.discount_price || a.actual_price;
                const priceB = b.discount_price || b.actual_price;
                return priceB - priceA;
            });
            break;
        case 'popular':
            allProducts.sort((a, b) => b.rating - a.rating);
            break;
        case 'new':
            allProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        default:
            // По умолчанию сортируем по id
            allProducts.sort((a, b) => a.id - b.id);
    }
    
    currentPage = 1;
    displayProducts();
    updateLoadMoreButton();
}

function displayProducts(replace = true) {
    const productList = document.querySelector('.product-list');
    const template = document.querySelector('.product-card');
    
    if (replace) {
        productList.innerHTML = '';
    }
    
    const startIndex = 0;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    
    const productsToShow = allProducts.slice(startIndex, endIndex);
    
    productsToShow.forEach(product => {
        const card = template.cloneNode(true);
        
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
        
        productList.appendChild(card);
    });
}

function updateLoadMoreButton() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    const hasMoreProducts = currentPage * ITEMS_PER_PAGE < allProducts.length;
    
    loadMoreBtn.style.display = hasMoreProducts ? 'block' : 'none';
}

function loadMore() {
    currentPage++;
    displayProducts(false);
    updateLoadMoreButton();
}

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    
    const loadMoreBtn = document.querySelector('.load-more-btn');
    loadMoreBtn.addEventListener('click', loadMore);
    
    const sortSelect = document.querySelector('.sort-select');
    sortSelect.addEventListener('change', (event) => {
        sortProducts(event.target.value);
    });
}); 