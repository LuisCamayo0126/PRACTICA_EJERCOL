/**
 * Instructor Dashboard JavaScript Functionality
 * Maneja el carrusel y funcionalidad específica del dashboard de instructor
 */

console.log('Instructor Dashboard JS cargado correctamente - Archivo separado');

document.addEventListener('DOMContentLoaded', function() {
    initializeCarousel();
    initializeInstructorFeatures();
});

/**
 * Inicializar el carrusel de imágenes
 */
function initializeCarousel() {
    const carousel = document.querySelector('.admin-carrusel');
    if (!carousel) return;
    
    const track = carousel.querySelector('.carrusel-track');
    const slides = Array.from(carousel.querySelectorAll('.carrusel-slide'));
    const prev = carousel.querySelector('.carrusel-prev');
    const next = carousel.querySelector('.carrusel-next');
    const viewport = carousel.querySelector('.carrusel-viewport');

    let index = 0;
    const slideWidth = 250; // Ancho de cada slide
    let autoplayId = null;
    const delay = 3000; // 3 segundos entre cambios

    /**
     * Esperar a que todas las imágenes se carguen
     */
    function imagesLoaded(callback) {
        const imgs = Array.from(track.querySelectorAll('img'));
        let loaded = 0;
        
        if (imgs.length === 0) return callback();
        
        imgs.forEach(img => {
            if (img.complete) {
                loaded++;
            } else {
                img.addEventListener('load', () => {
                    loaded++;
                    if (loaded === imgs.length) callback();
                });
                img.addEventListener('error', () => {
                    loaded++;
                    if (loaded === imgs.length) callback();
                });
            }
        });
        
        if (loaded === imgs.length) callback();
    }

    /**
     * Establecer tamaños del carrusel
     */
    function setSizes() {
        slides.forEach(slide => {
            slide.style.width = slideWidth + 'px';
            slide.style.height = slideWidth + 'px';
        });
        
        if (track) {
            track.style.width = (slideWidth * slides.length) + 'px';
        }
        
        moveTo(index, false);
    }

    /**
     * Mover el carrusel a un índice específico
     */
    function moveTo(i, animate = true) {
        if (slides.length === 0) return;
        
        index = (i + slides.length) % slides.length;
        
        if (!animate) {
            track.style.transition = 'none';
        } else {
            track.style.transition = 'transform 600ms ease';
        }
        
        track.style.transform = `translate3d(${-index * slideWidth}px, 0, 0)`;
        
        // Actualizar clases active
        slides.forEach((slide, idx) => {
            slide.classList.toggle('active', idx === index);
        });
        
        if (!animate) {
            requestAnimationFrame(() => {
                track.style.transition = 'transform 600ms ease';
            });
        }
    }

    /**
     * Ir al siguiente slide
     */
    function nextSlide() {
        moveTo(index + 1);
    }

    /**
     * Ir al slide anterior
     */
    function prevSlide() {
        moveTo(index - 1);
    }

    /**
     * Iniciar autoplay
     */
    function startAutoplay() {
        stopAutoplay();
        if (slides.length > 1) {
            autoplayId = setInterval(() => nextSlide(), delay);
        }
    }

    /**
     * Detener autoplay
     */
    function stopAutoplay() {
        if (autoplayId) {
            clearInterval(autoplayId);
            autoplayId = null;
        }
    }

    // Event listeners
    if (next) {
        next.addEventListener('click', () => {
            stopAutoplay();
            nextSlide();
            startAutoplay();
        });
    }

    if (prev) {
        prev.addEventListener('click', () => {
            stopAutoplay();
            prevSlide();
            startAutoplay();
        });
    }

    // Responsive resize
    window.addEventListener('resize', setSizes);

    // Pausar autoplay en hover
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);

    // Soporte para teclado
    carousel.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                stopAutoplay();
                prevSlide();
                startAutoplay();
                break;
            case 'ArrowRight':
                e.preventDefault();
                stopAutoplay();
                nextSlide();
                startAutoplay();
                break;
        }
    });

    // Hacer el carrusel focusable para teclado
    carousel.setAttribute('tabindex', '0');

    // Inicializar cuando las imágenes estén listas
    imagesLoaded(function() {
        setSizes();
        
        // Ocultar flechas si solo hay una imagen
        if (slides.length <= 1) {
            carousel.classList.add('hide-arrows');
        }
        
        // Iniciar autoplay si hay múltiples slides
        if (slides.length > 1) {
            startAutoplay();
        }
    });
}

/**
 * Inicializar características específicas del instructor
 */
function initializeInstructorFeatures() {
    // Añadir efectos hover a las tarjetas de herramientas
    const toolCards = document.querySelectorAll('.tool-card');
    
    toolCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
        
        // Añadir funcionalidad click (placeholder)
        card.addEventListener('click', function() {
            const title = this.querySelector('h3').textContent;
            InstructorDashboard.showNotification(`Funcionalidad "${title}" en desarrollo`, 'info');
        });
    });
    
    // Animación de entrada para las tarjetas
    setTimeout(() => {
        toolCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }, 500);
}

/**
 * Módulo de funcionalidades del Dashboard de Instructor
 */
const InstructorDashboard = {
    /**
     * Mostrar notificación
     */
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `instructor-notification ${type}`;
        notification.textContent = message;
        
        // Estilos para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
            font-family: 'Montserrat', sans-serif;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        // Animación de entrada
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Animación de salida
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    },
    
    /**
     * Navegar a una herramienta específica
     */
    navigateToTool: function(toolName) {
        console.log(`Navegando a: ${toolName}`);
        // Implementar navegación específica aquí
        this.showNotification(`Abriendo ${toolName}...`, 'info');
    },
    
    /**
     * Actualizar estadísticas del instructor
     */
    updateStats: function() {
        // Implementar actualización de estadísticas
        this.showNotification('Estadísticas actualizadas', 'success');
    }
};

// Exportar para uso global
window.InstructorDashboard = InstructorDashboard;