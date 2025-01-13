let notificationTimeout;

function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    const notificationText = notification.querySelector('.notification-text');
    const closeBtn = notification.querySelector('.close-btn');
    
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }
    
    notificationText.textContent = message;
    
    if (isError) {
        notification.style.backgroundColor = '#f8d7da';
        notification.style.borderColor = '#f5c6cb';
        notification.style.color = '#721c24';
        closeBtn.style.color = '#721c24';
    } else {
        notification.style.backgroundColor = '#d4edda';
        notification.style.borderColor = '#c3e6cb';
        notification.style.color = '#155724';
        closeBtn.style.color = '#155724';
    }
    
    notification.style.display = 'flex';
    
    notificationTimeout = setTimeout(() => {
        notification.style.display = 'none';
        notificationTimeout = null;
    }, 5000);
}

function closeNotification() {
    const notification = document.getElementById('notification');
    notification.style.display = 'none';
    
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }
} 