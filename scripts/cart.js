function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    // Проверяем формат +7 (XXX) XXX-XX-XX
    const phoneRegex = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
    return phoneRegex.test(phone);
}

function validateDate(date) {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selectedDate >= today;
}

function formatPhoneNumber(input) {
    let phoneNumber = input.value.replace(/\D/g, '');
    
    if (phoneNumber.length > 0) {
        if (phoneNumber[0] === '7' || phoneNumber[0] === '8') {
            phoneNumber = '7' + phoneNumber.slice(1);
        } else {
            phoneNumber = '7' + phoneNumber;
        }
    }
    
    if (phoneNumber.length > 1) {
        phoneNumber = '+' + phoneNumber;
    }
    if (phoneNumber.length > 2) {
        phoneNumber = phoneNumber.slice(0, 2) + ' (' + phoneNumber.slice(2);
    }
    if (phoneNumber.length > 7) {
        phoneNumber = phoneNumber.slice(0, 7) + ') ' + phoneNumber.slice(7);
    }
    if (phoneNumber.length > 12) {
        phoneNumber = phoneNumber.slice(0, 12) + '-' + phoneNumber.slice(12);
    }
    if (phoneNumber.length > 15) {
        phoneNumber = phoneNumber.slice(0, 15) + '-' + phoneNumber.slice(15);
    }
    
    if (phoneNumber.length > 18) {
        phoneNumber = phoneNumber.slice(0, 18);
    }
    
    input.value = phoneNumber;
}

async function handleCheckoutSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart.length === 0) {
        showNotification('Корзина пуста');
        return;
    }

    const requiredFields = {
        'name': 'Имя',
        'email': 'Email',
        'phone': 'Телефон',
        'address': 'Адрес',
        'delivery-date': 'Дата доставки',
        'delivery-time': 'Время доставки'
    };

    for (const [fieldName, fieldLabel] of Object.entries(requiredFields)) {
        if (!form[fieldName].value.trim()) {
            showNotification(`Поле "${fieldLabel}" должно быть заполнено`);
            form[fieldName].focus();
            return;
        }
    }

    if (!validateEmail(form.email.value)) {
        showNotification('Введите корректный email адрес');
        form.email.focus();
        return;
    }

    if (!validatePhone(form.phone.value)) {
        showNotification('Введите корректный номер телефона');
        form.phone.focus();
        return;
    }

    if (!validateDate(form['delivery-date'].value)) {
        showNotification('Дата доставки не может быть раньше сегодняшнего дня');
        form['delivery-date'].focus();
        return;
    }

    const dateInput = form['delivery-date'].value;
    const [year, month, day] = dateInput.split('-');
    const formattedDate = `${day}.${month}.${year}`;

    const timeIntervals = {
        '1': '08:00-12:00',
        '2': '12:00-14:00',
        '3': '14:00-18:00',
        '4': '18:00-22:00'
    };
    const selectedTimeValue = form['delivery-time'].value;
    const deliveryInterval = timeIntervals[selectedTimeValue];

    const orderData = {
        full_name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        delivery_address: form.address.value.trim(),
        delivery_date: formattedDate,
        delivery_interval: deliveryInterval,
        comment: form.comment.value.trim(),
        subscribe: form.newsletter.checked ? 1 : 0,
        good_ids: cart
    };

    try {
        const response = await createOrder(orderData);
        showNotification('Заказ успешно создан!');
        localStorage.removeItem('cart');
        await displayCartProducts();
        form.reset();
    } catch (error) {
        showNotification('Ошибка при создании заказа');
    }
}

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
        await updateTotalPrice();
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

    await updateTotalPrice();
}

function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(id => id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartProducts();
    showNotification('Товар удален из корзины');
    updateTotalPrice();
}

async function updateTotalPrice() {
    const products = await getCartProducts();
    let total = 0;

    products.forEach(product => {
        const price = product.discount_price || product.actual_price;
        total += price;
    });

    const totalPriceElement = document.querySelector('.total-price');
    totalPriceElement.textContent = `₽${total.toFixed(2)}`;
}

function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push(product.id);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartProducts();
    showNotification('Товар добавлен в корзину');
    updateTotalPrice();
}

function updateQuantity(productId, newQuantity) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const index = cart.indexOf(productId);
    if (index !== -1) {
        cart[index] = newQuantity;
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartProducts();
    updateTotalPrice();
}

document.addEventListener('DOMContentLoaded', () => {
    displayCartProducts();
    updateTotalPrice();
    
    const checkoutForm = document.querySelector('.checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
        
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function() {
                formatPhoneNumber(this);
            });
        }
    }

    const dateInput = document.getElementById('delivery-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
}); 