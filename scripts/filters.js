let filteredProducts = [];
let isFiltered = false;
let allLoadedProducts = [];

async function initializeFilters() {
    const filterForm = document.querySelector('.filter-form');
    filterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        currentPage = 1;
        applyFilters();
    });

    const loadMoreBtn = document.querySelector('.load-more-btn');
    loadMoreBtn.addEventListener('click', loadMore);

    await loadAllProducts();
    allProducts = allLoadedProducts.slice(0, ITEMS_PER_PAGE);
    displayProducts();
    updateLoadMoreButton();
}

async function loadAllProducts() {
    try {
        let allProducts = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const response = await fetch(`${API_URL}/goods?api_key=${API_KEY}&page=${page}&per_page=50`);
            const data = await response.json();
            
            allProducts = [...allProducts, ...data.goods];
            totalProducts = data._pagination.total_count;
            
            if (data.goods.length < 50) {
                hasMore = false;
            }
            page++;
        }

        allLoadedProducts = allProducts;
        return allProducts;
    } catch (error) {
        console.error('Ошибка при загрузке всех товаров:', error);
    }
}

function applyFilters() {
    const categories = Array.from(document.querySelectorAll('input[name="category"]:checked'))
        .map(input => input.value);
    
    const minPrice = document.querySelector('input[name="price-min"]').value;
    const maxPrice = document.querySelector('input[name="price-max"]').value;
    
    const discountFilters = Array.from(document.querySelectorAll('input[name="discount"]:checked'))
        .map(input => input.value);
    
    filteredProducts = allLoadedProducts.filter(product => {
        if (categories.length > 0 && !categories.includes(product.main_category)) {
            return false;
        }
        
        const price = product.discount_price || product.actual_price;
        if (minPrice && price < parseFloat(minPrice)) {
            return false;
        }
        if (maxPrice && price > parseFloat(maxPrice)) {
            return false;
        }
        
        if (discountFilters.length > 0) {
            if (discountFilters.includes('with-discount') && !product.discount_price) {
                return false;
            }
            if (discountFilters.includes('without-discount') && product.discount_price) {
                return false;
            }
        }
        
        return true;
    });
    
    isFiltered = true;
    
    sortProducts(currentSortType, false);
    
    if (filteredProducts.length <= ITEMS_PER_PAGE) {
        displayAllFilteredProducts();
    } else {
        displayFilteredProducts();
    }
    updateLoadMoreButton();
}

function displayAllFilteredProducts() {
    const productList = document.querySelector('.product-list');
    productList.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        productList.innerHTML = '<p class="no-products">Товары не найдены</p>';
        return;
    }
    
    filteredProducts.forEach(product => {
        const card = cardTemplate.cloneNode(true);
        displayProductCard(card, product);
        productList.appendChild(card);
    });
}

async function loadProducts(replace = true) {
    if (replace) {
        allProducts = allLoadedProducts.slice(0, ITEMS_PER_PAGE);
        displayProducts();
    } else {
        const endIndex = (currentPage + 1) * ITEMS_PER_PAGE;
        allProducts = allLoadedProducts.slice(0, endIndex);
        displayProducts(false);
    }
    updateLoadMoreButton();
}

function displayFilteredProducts() {
    const productList = document.querySelector('.product-list');
    
    if (filteredProducts.length === 0) {
        productList.innerHTML = '<p class="no-products">Товары не найдены</p>';
        return;
    }
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    
    if (currentPage === 1) {
        productList.innerHTML = '';
    }
    
    productsToShow.forEach(product => {
        const card = cardTemplate.cloneNode(true);
        displayProductCard(card, product);
        productList.appendChild(card);
    });
}

function updateLoadMoreButton() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    const totalCount = isFiltered ? filteredProducts.length : totalProducts;
    const hasMoreProducts = currentPage * ITEMS_PER_PAGE < totalCount;
    
    loadMoreBtn.style.display = hasMoreProducts ? 'block' : 'none';
}

function loadMore() {
    currentPage++;
    if (isFiltered) {
        displayFilteredProducts();
    } else {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = currentPage * ITEMS_PER_PAGE;
        const productsToShow = allLoadedProducts.slice(startIndex, endIndex);
        
        productsToShow.forEach(product => {
            const card = cardTemplate.cloneNode(true);
            displayProductCard(card, product);
            document.querySelector('.product-list').appendChild(card);
        });
    }
    updateLoadMoreButton();
}

function sortProducts(sortType, display = true) {
    currentSortType = sortType;
    const productsToSort = isFiltered ? filteredProducts : allProducts;
    
    switch(sortType) {
        case 'rating-asc':
            productsToSort.sort((a, b) => a.rating - b.rating);
            break;
        case 'rating-desc':
            productsToSort.sort((a, b) => b.rating - a.rating);
            break;
        case 'price-asc':
            productsToSort.sort((a, b) => {
                const priceA = a.discount_price || a.actual_price;
                const priceB = b.discount_price || b.actual_price;
                return priceA - priceB;
            });
            break;
        case 'price-desc':
            productsToSort.sort((a, b) => {
                const priceA = a.discount_price || a.actual_price;
                const priceB = b.discount_price || b.actual_price;
                return priceB - priceA;
            });
            break;
        default:
            productsToSort.sort((a, b) => a.id - b.id);
    }
    
    if (display) {
        currentPage = 1;
        if (isFiltered) {
            displayFilteredProducts();
        } else {
            displayProducts();
        }
        updateLoadMoreButton();
    }
}

document.addEventListener('DOMContentLoaded', initializeFilters); 