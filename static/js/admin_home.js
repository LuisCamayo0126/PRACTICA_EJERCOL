/**
 * Admin Home JavaScript Functionality
 * Maneja la funcionalidad específica de la página de administración
 */

console.log('Admin Home JS cargado correctamente - Archivo separado');

document.addEventListener('DOMContentLoaded', function() {
    // Mostrar/ocultar logout al tocar el saludo (para móviles)
    const greeting = document.querySelector('.admin-greeting');
    if (greeting) {
        const text = greeting.querySelector('.greeting-text');
        if (text) {
            text.addEventListener('click', function(e) {
                greeting.classList.toggle('show-logout');
            });
        }
    }

    // Animación adicional para el título principal
    animateMainTitle();
    
    // Inicializar efectos visuales
    initializeVisualEffects();
});

/**
 * Anima el título principal con efectos adicionales
 */
function animateMainTitle() {
    const titleElement = document.querySelector('.main-title-text');
    if (titleElement) {
        // Añadir clase para animación inicial
        titleElement.classList.add('title-loaded');
        
        // Efecto de aparición gradual
        setTimeout(() => {
            titleElement.style.opacity = '1';
            titleElement.style.transform = 'translateY(0)';
        }, 100);
    }
}

/**
 * Inicializa efectos visuales adicionales
 */
function initializeVisualEffects() {
    // Efecto parallax suave en el fondo
    if (window.innerWidth > 768) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            const adminPage = document.querySelector('.admin-page');
            if (adminPage) {
                adminPage.style.backgroundPosition = `center ${rate}px`;
            }
        });
    }
    
    // Efecto hover en elementos interactivos
    addHoverEffects();
}

/**
 * Añade efectos hover a elementos interactivos
 */
function addHoverEffects() {
    const interactiveElements = document.querySelectorAll('.admin-card, .tool-card, .btn-back');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

/**
 * Funciones utilitarias para la página admin
 */
const AdminHome = {
    /**
     * Mostrar notificación temporal
     */
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.textContent = message;
        
        // Estilos inline para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar animación
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    },
    
    /**
     * Alternar modo de pantalla completa para el admin
     */
    toggleFullscreen: function() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
};

// Exportar funciones para uso global
window.AdminHome = AdminHome;