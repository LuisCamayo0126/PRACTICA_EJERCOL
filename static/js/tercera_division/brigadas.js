// Brigadas JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Animación de entrada para las tarjetas de brigadas
    const brigadeCards = document.querySelectorAll('.brigada-card');
    brigadeCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px) rotateX(10deg)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.7s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) rotateX(0deg)';
        }, index * 200);
    });
    
    // Efectos de hover mejorados para brigadas
    brigadeCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
            
            // Efecto de brillo
            this.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2), 0 0 20px rgba(74, 124, 89, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
        });
    });
    
    // Animación del título
    const title = document.querySelector('.brigadas-header h1');
    if (title) {
        title.style.transform = 'translateY(-20px)';
        title.style.opacity = '0';
        
        setTimeout(() => {
            title.style.transition = 'all 0.8s ease';
            title.style.transform = 'translateY(0)';
            title.style.opacity = '1';
        }, 300);
    }
    
    // Contadores animados para estadísticas
    animateStats();
    
    // Efecto de partículas para brigadas
    createBrigadeParticles();
});

function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const finalValue = parseInt(stat.textContent);
        if (isNaN(finalValue)) return;
        
        let currentValue = 0;
        const increment = finalValue / 30; // 30 frames de animación
        
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                currentValue = finalValue;
                clearInterval(timer);
            }
            stat.textContent = Math.floor(currentValue);
        }, 50);
    });
}

function createBrigadeParticles() {
    const container = document.querySelector('.brigadas-container');
    if (!container) return;
    
    // Crear partículas militares específicas para brigadas
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        const shapes = ['⭐', '▲', '●', '♦'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        particle.innerHTML = shape;
        particle.style.cssText = `
            position: absolute;
            font-size: ${8 + Math.random() * 6}px;
            color: rgba(255,255,255,0.2);
            pointer-events: none;
            animation: brigadeDrift ${4 + Math.random() * 6}s infinite ease-in-out;
            z-index: 1;
        `;
        
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 3 + 's';
        
        container.appendChild(particle);
    }
    
    // Agregar CSS para la animación de brigadas
    if (!document.getElementById('brigade-particles-style')) {
        const style = document.createElement('style');
        style.id = 'brigade-particles-style';
        style.textContent = `
            @keyframes brigadeDrift {
                0% { transform: translate(0, 0) rotate(0deg); opacity: 0.2; }
                25% { transform: translate(10px, -15px) rotate(90deg); opacity: 0.4; }
                50% { transform: translate(-5px, -25px) rotate(180deg); opacity: 0.6; }
                75% { transform: translate(-15px, -10px) rotate(270deg); opacity: 0.4; }
                100% { transform: translate(0, 0) rotate(360deg); opacity: 0.2; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Funciones específicas de navegación para brigadas
function navigateToBrigade(brigadeName, brigadeNumber) {
    console.log(`Navegando a Brigada: ${brigadeName} (${brigadeNumber})`);
    
    // Animación de selección
    const selectedCard = event.target.closest('.brigada-card');
    if (selectedCard) {
        selectedCard.style.transform = 'scale(1.05)';
        selectedCard.style.background = 'linear-gradient(45deg, rgba(74, 124, 89, 0.1), rgba(255,255,255,0.95))';
        
        // Efecto de pulso
        selectedCard.style.animation = 'pulse 0.6s ease-in-out';
        
        setTimeout(() => {
            // Proceder con la navegación
            showNotification(`Accediendo a ${brigadeName}`, 'info');
        }, 600);
    }
}

function getBrigadeData() {
    // Datos simulados de brigadas (en un proyecto real vendrían del servidor)
    return {
        'brigada3': {
            name: 'Brigada 3',
            batallones: 4,
            personal: 1200,
            ubicacion: 'Norte'
        },
        'brigada23': {
            name: 'Brigada 23',
            batallones: 3,
            personal: 950,
            ubicacion: 'Sur'
        },
        'fudra2': {
            name: 'FUDRA 2',
            batallones: 5,
            personal: 1500,
            ubicacion: 'Este'
        },
        'fudra4': {
            name: 'FUDRA 4',
            batallones: 3,
            personal: 850,
            ubicacion: 'Oeste'
        }
    };
}

// Función para actualizar información en tiempo real
function updateBrigadeInfo() {
    const brigadeData = getBrigadeData();
    
    document.querySelectorAll('.brigada-card').forEach(card => {
        const brigadeName = card.querySelector('.brigada-name')?.textContent.toLowerCase().replace(/\s+/g, '');
        
        if (brigadeData[brigadeName]) {
            const data = brigadeData[brigadeName];
            
            // Actualizar estadísticas si existen
            const statNumbers = card.querySelectorAll('.stat-number');
            if (statNumbers.length >= 2) {
                statNumbers[0].textContent = data.batallones;
                statNumbers[1].textContent = data.personal;
            }
        }
    });
}

// Manejo de errores específico para brigadas
function handleBrigadeError(error) {
    console.error('Error en brigadas:', error);
    showNotification('Error al cargar información de brigadas', 'error');
}

// Función de filtro/búsqueda
function filterBrigades(searchTerm) {
    const cards = document.querySelectorAll('.brigada-card');
    
    cards.forEach(card => {
        const brigadeName = card.querySelector('.brigada-name').textContent.toLowerCase();
        const brigadeInfo = card.querySelector('.brigada-info').textContent.toLowerCase();
        
        if (brigadeName.includes(searchTerm.toLowerCase()) || 
            brigadeInfo.includes(searchTerm.toLowerCase())) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.5s ease';
        } else {
            card.style.display = 'none';
        }
    });
}

// Agregar estilo para fadeIn
if (!document.getElementById('brigade-effects-style')) {
    const style = document.createElement('style');
    style.id = 'brigade-effects-style';
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}

// Función de utilidad para mostrar notificaciones (reutilizada del dashboard)
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        transition: all 0.3s ease;
        transform: translateX(100%);
    `;
    
    const colors = {
        'info': 'linear-gradient(45deg, #4a7c59, #2c5530)',
        'success': 'linear-gradient(45deg, #4CAF50, #45a049)',
        'warning': 'linear-gradient(45deg, #FF9800, #F57C00)',
        'error': 'linear-gradient(45deg, #f44336, #d32f2f)'
    };
    
    notification.style.background = colors[type] || colors['info'];
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}