// Batallones JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Animación de entrada para tarjetas de batallones
    const battalionCards = document.querySelectorAll('.batallon-card');
    battalionCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-50px) rotateY(15deg)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            card.style.opacity = '1';
            card.style.transform = 'translateX(0) rotateY(0deg)';
        }, index * 250);
    });
    
    // Efectos de hover para batallones
    battalionCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
            this.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15), 0 0 25px rgba(90, 107, 71, 0.2)';
            
            // Efecto en el icono
            const icon = this.querySelector('.batallon-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.color = '#5a6b47';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
            
            const icon = this.querySelector('.batallon-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
                icon.style.color = '#3d4a2c';
            }
        });
    });
    
    // Animación del breadcrumb
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
        breadcrumb.style.transform = 'translateY(-20px)';
        breadcrumb.style.opacity = '0';
        
        setTimeout(() => {
            breadcrumb.style.transition = 'all 0.6s ease';
            breadcrumb.style.transform = 'translateY(0)';
            breadcrumb.style.opacity = '1';
        }, 200);
    }
    
    // Inicializar contadores y datos
    initializeBattalionData();
    animateBattalionStats();
    
    // Configurar botones de acción
    setupActionButtons();
});

function initializeBattalionData() {
    // Datos de ejemplo para batallones
    const battalionData = {
        'BR3': { name: 'Batallón BR3', companies: 4, personnel: 320, status: 'Operativo' },
        'BR23': { name: 'Batallón BR23', companies: 3, personnel: 280, status: 'Operativo' },
        'FUDRA2': { name: 'Batallón FUDRA2', companies: 5, personnel: 400, status: 'Entrenamiento' },
        'FUHER': { name: 'Batallón FUHER', companies: 4, personnel: 350, status: 'Operativo' }
    };
    
    // Actualizar información en las tarjetas
    document.querySelectorAll('.batallon-card').forEach(card => {
        const codeElement = card.querySelector('.batallon-code');
        if (codeElement) {
            const code = codeElement.textContent.trim();
            if (battalionData[code]) {
                const data = battalionData[code];
                
                // Actualizar estadísticas
                const stats = card.querySelectorAll('.stat-number');
                if (stats.length >= 3) {
                    stats[0].textContent = data.companies;
                    stats[1].textContent = data.personnel;
                    stats[2].textContent = data.status === 'Operativo' ? '100%' : '85%';
                }
            }
        }
    });
}

function animateBattalionStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stat = entry.target;
                const finalValue = parseInt(stat.textContent);
                
                if (!isNaN(finalValue) && finalValue > 0) {
                    animateCounter(stat, finalValue);
                }
                observer.unobserve(stat);
            }
        });
    });
    
    statNumbers.forEach(stat => observer.observe(stat));
}

function animateCounter(element, finalValue) {
    let currentValue = 0;
    const increment = finalValue / 40;
    const isPercentage = element.textContent.includes('%');
    
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= finalValue) {
            currentValue = finalValue;
            clearInterval(timer);
        }
        
        element.textContent = Math.floor(currentValue) + (isPercentage ? '%' : '');
    }, 30);
}

function setupActionButtons() {
    // Configurar botones de ver compañías
    document.querySelectorAll('.action-button:not(.secondary)').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const card = this.closest('.batallon-card');
            const battalionName = card.querySelector('.batallon-name').textContent;
            
            // Efecto de clic
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Mostrar loading
            showBattalionLoading(card);
            
            // Simular navegación
            setTimeout(() => {
                navigateToCompanies(battalionName);
            }, 800);
        });
    });
    
    // Configurar botones secundarios
    document.querySelectorAll('.action-button.secondary').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const card = this.closest('.batallon-card');
            const battalionName = card.querySelector('.batallon-name').textContent;
            
            showBattalionDetails(battalionName);
        });
    });
}

function showBattalionLoading(card) {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'battalion-loading';
    loadingOverlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Cargando compañías...</p>
    `;
    
    loadingOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255,255,255,0.95);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        z-index: 10;
    `;
    
    card.style.position = 'relative';
    card.appendChild(loadingOverlay);
    
    // Añadir estilos del spinner si no existen
    if (!document.getElementById('battalion-loading-style')) {
        const style = document.createElement('style');
        style.id = 'battalion-loading-style';
        style.textContent = `
            .loading-spinner {
                width: 30px;
                height: 30px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #3d4a2c;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 10px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

function navigateToCompanies(battalionName) {
    console.log(`Navegando a compañías del ${battalionName}`);
    showNotification(`Accediendo a compañías del ${battalionName}`, 'success');
    
    // Aquí se realizaría la navegación real
    // window.location.href = `/accounts/tercedivi/companias/?batallon=${encodeURIComponent(battalionName)}`;
}

function showBattalionDetails(battalionName) {
    const modal = document.createElement('div');
    modal.className = 'battalion-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${battalionName}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <h4>Información Detallada</h4>
                <p><strong>Estado:</strong> Operativo</p>
                <p><strong>Comandante:</strong> Coronel [Nombre]</p>
                <p><strong>Ubicación:</strong> [Base Militar]</p>
                <p><strong>Especialidad:</strong> Infantería</p>
                <h4>Estadísticas Recientes</h4>
                <div class="detail-stats">
                    <div class="detail-stat">
                        <span class="stat-label">Entrenamientos</span>
                        <span class="stat-value">15</span>
                    </div>
                    <div class="detail-stat">
                        <span class="stat-label">Misiones</span>
                        <span class="stat-value">8</span>
                    </div>
                    <div class="detail-stat">
                        <span class="stat-label">Eficiencia</span>
                        <span class="stat-value">96%</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    const modalContent = modal.querySelector('.modal-content');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 25px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        transform: scale(0.7);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(modal);
    
    // Animación de entrada
    setTimeout(() => {
        modal.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    }, 10);
    
    // Cerrar modal
    function closeModal() {
        modal.style.opacity = '0';
        modalContent.style.transform = 'scale(0.7)';
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
    
    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
    
    // Agregar estilos del modal
    if (!document.getElementById('battalion-modal-style')) {
        const style = document.createElement('style');
        style.id = 'battalion-modal-style';
        style.textContent = `
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #eee;
            }
            
            .modal-header h3 {
                margin: 0;
                color: #3d4a2c;
            }
            
            .close-modal {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #999;
                transition: color 0.3s ease;
            }
            
            .close-modal:hover {
                color: #333;
            }
            
            .detail-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-top: 15px;
            }
            
            .detail-stat {
                text-align: center;
                padding: 15px;
                background: rgba(61, 74, 44, 0.1);
                border-radius: 8px;
            }
            
            .detail-stat .stat-label {
                display: block;
                font-size: 0.9em;
                color: #666;
                margin-bottom: 5px;
            }
            
            .detail-stat .stat-value {
                display: block;
                font-size: 1.5em;
                font-weight: bold;
                color: #3d4a2c;
            }
        `;
        document.head.appendChild(style);
    }
}

// Función de utilidad para notificaciones
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
        'info': 'linear-gradient(45deg, #5a6b47, #3d4a2c)',
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