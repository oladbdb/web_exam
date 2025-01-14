async function displayOrders() {
    const tableBody = document.getElementById('orders-table-body');
    const ordersTable = document.querySelector('.orders-table');
    if (!tableBody || !ordersTable) return;

    try {
        const orders = await getOrders();

        if (!orders || orders.length === 0) {
            ordersTable.style.display = 'none';
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'orders-empty';
            emptyMessage.innerHTML = '<p>У вас нет заказов. Перейдите в <a href="index.html">каталог</a>, чтобы добавить товары.</p>';
            ordersTable.parentNode.insertBefore(emptyMessage, ordersTable);
            return;
        }

        ordersTable.style.display = 'table';
        const existingMessage = document.querySelector('.orders-empty');
        if (existingMessage) {
            existingMessage.remove();
        }

        tableBody.innerHTML = ''; 

        for (const order of orders) {
            const products = await Promise.all(
                order.good_ids.map(id => getProductById(id))
            );

            const totalPrice = products.reduce((sum, product) => {
                return sum + (product.discount_price || product.actual_price);
            }, 0);

            const productNames = products.map(product => product.name).join(', ');

            const orderDate = new Date(order.created_at);
            const formattedDate = orderDate.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const formattedTime = orderDate.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const [year, month, day] = order.delivery_date.split('-');
            const formattedDeliveryDate = `${day}.${month}.${year}`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id}</td>
                <td>
                    ${formattedDate}<br>
                    ${formattedTime}
                </td>
                <td>${productNames}</td>
                <td>${totalPrice.toFixed(2)}₽</td>
                <td>
                    ${formattedDeliveryDate}<br>
                    ${order.delivery_interval}
                </td>
                <td>
                    <button class="action-btn view-btn" data-order-id="${order.id}">👁️</button>
                    <button class="action-btn edit-btn" data-order-id="${order.id}">✏️</button>
                    <button class="action-btn dlt-btn" data-order-id="${order.id}">🗑️</button>
                </td>
            `;

            tableBody.appendChild(row);
        }

        document.querySelectorAll('.dlt-btn').forEach(button => {
            button.addEventListener('click', () => {
                const orderId = button.getAttribute('data-order-id');
                showDeleteModal(orderId);
            });
        });

        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const orderId = button.getAttribute('data-order-id');
                try {
                    const order = await getOrderById(orderId);
                    showViewModal(order);
                } catch (error) {
                    console.error('Ошибка при получении данных заказа:', error);
                    showNotification('Ошибка при получении данных заказа', true);
                }
            });
        });

        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const orderId = button.getAttribute('data-order-id');
                try {
                    const order = await getOrderById(orderId);
                    showEditModal(order);
                } catch (error) {
                    console.error('Ошибка при получении данных заказа:', error);
                    showNotification('Ошибка при получении данных заказа', true);
                }
            });
        });

    } catch (error) {
        console.error('Ошибка при загрузке заказов:', error);
        showNotification('Ошибка при загрузке заказов', true);
    }
}

function createDeleteModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'delete-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-name">
                <h2>Удаление заказа</h2>
                <span class="close-btn">&times;</span>
            </div>
            <p>Вы уверены, что хотите удалить этот заказ?</p>
            <button class="delete-confirm">Да</button>
            <button class="delete-cancel">Нет</button>
        </div>
    `;

    document.body.appendChild(modal);
    return modal;
}

function showDeleteModal(orderId) {
    let deleteModal = document.getElementById('delete-modal');
    if (!deleteModal) {
        deleteModal = createDeleteModal();
    }
    
    deleteModal.style.display = 'flex';

    const confirmButton = deleteModal.querySelector('.delete-confirm');
    const cancelButton = deleteModal.querySelector('.delete-cancel');
    const closeBtn = deleteModal.querySelector('.close-btn');

    const closeModal = () => {
        deleteModal.style.display = 'none';
    };

    confirmButton.onclick = async () => {
        try {
            await deleteOrder(orderId);
            showNotification('Заказ успешно удалён');
            closeModal();
            displayOrders();
        } catch (error) {
            console.error('Ошибка при удалении заказа:', error);
            showNotification('Ошибка при удалении заказа', true);
        }
    };

    cancelButton.onclick = closeModal;
    closeBtn.onclick = closeModal;
}

function createViewModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'view-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-name">
                <h2>Просмотр заказа</h2>
                <span class="close-btn">&times;</span>
            </div>
            <div class="modal-body">
                <div class="modal-row">
                    <div class="modal-label">Дата оформления:</div>
                    <div class="modal-value" id="order-date"></div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">Имя:</div>
                    <div class="modal-value" id="customer-name"></div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">Телефон:</div>
                    <div class="modal-value" id="customer-phone"></div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">Email:</div>
                    <div class="modal-value" id="customer-email"></div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">Адрес доставки:</div>
                    <div class="modal-value" id="delivery-address"></div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">Дата доставки:</div>
                    <div class="modal-value" id="delivery-date"></div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">Время доставки:</div>
                    <div class="modal-value" id="delivery-time"></div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">Состав заказа:</div>
                    <div class="modal-value" id="order-items"></div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">Стоимость:</div>
                    <div class="modal-value" id="order-price"></div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">Комментарий:</div>
                    <div class="modal-value" id="order-comment"></div>
                </div> 
            </div>
            <button class="ok-btn">Ок</button>
        </div>
    `;

    document.body.appendChild(modal);
    return modal;
}

function showViewModal(order) {
    let viewModal = document.getElementById('view-modal');
    if (!viewModal) {
        viewModal = createViewModal();
    }
    
    viewModal.style.display = 'flex';

    const createdDate = new Date(order.created_at);
    const formattedCreatedDate = createdDate.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    const [year, month, day] = order.delivery_date.split('-');
    const formattedDeliveryDate = `${day}.${month}.${year}`;

    Promise.all(order.good_ids.map(id => getProductById(id)))
        .then(products => {
            const productNames = products.map(product => product.name).join(', ');
            const orderItemsElement = viewModal.querySelector('#order-items');
            if (orderItemsElement) {
                orderItemsElement.textContent = productNames || 'Нет данных';
            }

            const totalPrice = products.reduce((sum, product) => {
                return sum + (product.discount_price || product.actual_price);
            }, 0);
            const orderPriceElement = viewModal.querySelector('#order-price');
            if (orderPriceElement) {
                orderPriceElement.textContent = `${totalPrice.toFixed(2)}₽`;
            }
        });

    const elements = {
        'order-date': formattedCreatedDate,
        'customer-name': order.full_name,
        'customer-phone': order.phone,
        'customer-email': order.email,
        'delivery-address': order.delivery_address,
        'delivery-date': formattedDeliveryDate,
        'delivery-time': order.delivery_interval,
        'order-comment': order.comment || 'Нет комментария'
    };

    for (const [id, value] of Object.entries(elements)) {
        const element = viewModal.querySelector(`#${id}`);
        if (element) {
            element.textContent = value || 'Нет данных';
        }
    }

    const closeModal = () => {
        viewModal.style.display = 'none';
    };

    const closeBtn = viewModal.querySelector('.close-btn');
    const okBtn = viewModal.querySelector('.ok-btn');
    closeBtn.onclick = closeModal;
    okBtn.onclick = closeModal;
}

function createEditModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'edit-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-name">
                <h2>Редактирование заказа</h2>
                <span class="close-btn">&times;</span>
            </div>
            <form class="edit-form">
                <div class="modal-row">
                    <div class="modal-label">Дата оформления:</div>
                    <div class="modal-value" id="order-date"></div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">
                        <label for="edit-name">Имя:</label>
                    </div>
                    <div class="modal-value" id="customer-name">
                        <input type="text" id="edit-name" name="name" required />
                    </div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">
                        <label for="edit-phone">Телефон:</label>
                    </div>
                    <div class="modal-value" id="customer-phone">
                        <input type="text" id="edit-phone" name="phone" required pattern="\\+7 \\(\\d{3}\\) \\d{3}-\\d{2}-\\d{2}" />
                    </div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">
                        <label for="edit-email">Email:</label>
                    </div>
                    <div class="modal-value" id="customer-email">
                        <input type="email" id="edit-email" name="email" required />
                    </div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">
                        <label for="edit-address">Адрес доставки:</label>
                    </div>
                    <div class="modal-value" id="delivery-address">
                        <input type="text" id="edit-address" name="address" required />
                    </div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">
                        <label for="edit-date">Дата доставки:</label>
                    </div>
                    <div class="modal-value" id="delivery-date">
                        <input type="date" id="edit-date" name="date" required />
                    </div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">
                        <label for="edit-time">Временной интервал:</label>
                    </div>
                    <div class="modal-value" id="delivery-time">
                        <select id="edit-time" name="time" required>
                            <option value="1">08:00-12:00</option>
                            <option value="2">12:00-14:00</option>
                            <option value="3">14:00-18:00</option>
                            <option value="4">18:00-22:00</option>
                        </select>
                    </div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">Состав заказа:</div>
                    <div class="modal-value" id="order-items"></div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">Стоимость:</div>
                    <div class="modal-value" id="order-price"></div>
                </div>
                <div class="modal-row">
                    <div class="modal-label">
                        <label for="edit-comment">Комментарий:</label>
                    </div>
                    <div class="modal-value" id="order-comment">
                        <input type="text" id="edit-comment" name="comment" />
                    </div>
                </div> 
            </form>
            <button type="submit">Сохранить</button>
            <button type="submit">Отмена</button>
        </div>
    `;

    document.body.appendChild(modal);
    return modal;
}

function showEditModal(order) {
    let editModal = document.getElementById('edit-modal');
    if (!editModal) {
        editModal = createEditModal();
    }
    
    editModal.style.display = 'flex';

    const createdDate = new Date(order.created_at);
    const formattedCreatedDate = createdDate.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    const dateInput = document.getElementById('edit-date');
    dateInput.min = minDate;

    document.getElementById('order-date').textContent = formattedCreatedDate;
    document.getElementById('edit-name').value = order.full_name;
    document.getElementById('edit-phone').value = order.phone;
    document.getElementById('edit-email').value = order.email;
    document.getElementById('edit-address').value = order.delivery_address;
    document.getElementById('edit-date').value = order.delivery_date;

    const timeSelect = document.getElementById('edit-time');
    const timeOptions = {
        '08:00-12:00': '1',
        '12:00-14:00': '2',
        '14:00-18:00': '3',
        '18:00-22:00': '4'
    };
    const selectedTime = Object.entries(timeOptions).find(([key]) => 
        order.delivery_interval === key
    )?.[1] || '1';
    timeSelect.value = selectedTime;

    Promise.all(order.good_ids.map(id => getProductById(id)))
        .then(products => {
            const productNames = products.map(product => product.name).join(', ');
            document.getElementById('order-items').textContent = productNames;

            const totalPrice = products.reduce((sum, product) => {
                return sum + (product.discount_price || product.actual_price);
            }, 0);
            document.getElementById('order-price').textContent = `₽${totalPrice.toFixed(2)}`;
        });

    const phoneInput = document.getElementById('edit-phone');
    phoneInput.addEventListener('input', function(e) {
        let phoneNumber = e.target.value.replace(/\D/g, '');
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
        e.target.value = phoneNumber;
    });

    const closeBtn = editModal.querySelector('.close-btn');
    const saveBtn = editModal.querySelector('button[type="submit"]:first-of-type');
    const cancelBtn = editModal.querySelector('button[type="submit"]:last-of-type');

    const closeModal = () => {
        editModal.style.display = 'none';
    };

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

    saveBtn.onclick = async (e) => {
        e.preventDefault();

        const form = editModal.querySelector('form');
        if (!form.checkValidity()) {
            showNotification('Пожалуйста, заполните все обязательные поля корректно', true);
            return;
        }

        try {
            const updatedFields = {};
            
            const newName = document.getElementById('edit-name').value;
            if (newName !== order.full_name) {
                updatedFields.full_name = newName;
            }

            const newPhone = document.getElementById('edit-phone').value;
            if (newPhone !== order.phone) {
                updatedFields.phone = newPhone;
            }

            const newEmail = document.getElementById('edit-email').value;
            if (newEmail !== order.email) {
                updatedFields.email = newEmail;
            }

            const newAddress = document.getElementById('edit-address').value;
            if (newAddress !== order.delivery_address) {
                updatedFields.delivery_address = newAddress;
            }

            const newDate = document.getElementById('edit-date').value;
            if (newDate !== order.delivery_date) {
                updatedFields.delivery_date = newDate;
            }

            const newInterval = document.getElementById('edit-time').options[
                document.getElementById('edit-time').selectedIndex
            ].text;
            if (newInterval !== order.delivery_interval) {
                updatedFields.delivery_interval = newInterval;
            }

            const newComment = document.getElementById('edit-comment').value.trim();
            if (newComment !== (order.comment || '')) {
                updatedFields.comment = newComment;
            }

            if (Object.keys(updatedFields).length > 0) {
                await updateOrder(order.id, updatedFields);
                showNotification('Заказ успешно обновлен');
            } else {
                showNotification('Нет изменений для сохранения');
            }

            closeModal();
            displayOrders();
        } catch (error) {
            console.error('Ошибка при обновлении заказа:', error);
            showNotification('Ошибка при обновлении заказа', true);
        }
    };
}

document.addEventListener('DOMContentLoaded', displayOrders); 