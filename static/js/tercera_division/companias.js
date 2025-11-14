// Compañías JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Animación de entrada para tarjetas de compañías
    const companyCards = document.querySelectorAll('.compania-card');
    companyCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8) rotateZ(5deg)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
            card.style.opacity = '1';
            card.style.transform = 'scale(1) rotateZ(0deg)';
        }, index * 180);
    });
    
    // Efectos de hover para compañías
    companyCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px) scale(1.02)';
            this.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15), 0 0 20px rgba(107, 90, 71, 0.2)';
            
            // Efecto en el icono
            const icon = this.querySelector('.compania-icon');
            if (icon) {
                icon.style.transform = 'scale(1.15) rotate(-5deg)';
                icon.style.color = '#6b5a47';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
            
            const icon = this.querySelector('.compania-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
                icon.style.color = '#4a3d2c';
            }
        });
    });
    
    // Animación del breadcrumb
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
        breadcrumb.style.transform = 'translateY(-15px)';
        breadcrumb.style.opacity = '0';
        
        setTimeout(() => {
            breadcrumb.style.transition = 'all 0.5s ease';
            breadcrumb.style.transform = 'translateY(0)';
            breadcrumb.style.opacity = '1';
        }, 150);
    }
    
    // Inicializar datos de compañías
    initializeCompanyData();
    animateCompanyStats();
    setupCompanyActions();
    
    // Agregar funcionalidad de filtro
    createCompanyFilter();
});

function initializeCompanyData() {
    // Datos de ejemplo para compañías
    const companyTypes = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'];
    const companyData = {
        'Alpha': { designation: '1ª Cía', platoons: 4, personnel: 85, specialty: 'Asalto' },
        'Bravo': { designation: '2ª Cía', platoons: 3, personnel: 72, specialty: 'Apoyo' },
        'Charlie': { designation: '3ª Cía', platoons: 4, personnel: 88, specialty: 'Reconocimiento' },
        'Delta': { designation: '4ª Cía', platoons: 3, personnel: 75, specialty: 'Logística' },
        'Echo': { designation: '5ª Cía', platoons: 4, personnel: 90, specialty: 'Comunicaciones' },
        'Foxtrot': { designation: '6ª Cía', platoons: 3, personnel: 68, specialty: 'Ingeniería' }
    };
    
    // Actualizar información en las tarjetas
    document.querySelectorAll('.compania-card').forEach((card, index) => {
        const companyName = companyTypes[index % companyTypes.length];
        const data = companyData[companyName];
        
        if (data) {
            // Actualizar título
            const nameElement = card.querySelector('.compania-name');
            if (nameElement) {
                nameElement.textContent = `Compañía ${companyName}`;
            }
            
            const designationElement = card.querySelector('.compania-designation');
            if (designationElement) {
                designationElement.textContent = data.designation;
            }
            
            // Actualizar información
            const infoElement = card.querySelector('.compania-info');
            if (infoElement) {
                infoElement.textContent = `Especialidad: ${data.specialty}`;
            }
            
            // Actualizar estadísticas
            const stats = card.querySelectorAll('.stat-number');
            if (stats.length >= 2) {
                stats[0].textContent = data.platoons;
                stats[1].textContent = data.personnel;
            }
        }
    });
}

function animateCompanyStats() {
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
    }, { threshold: 0.5 });
    
    statNumbers.forEach(stat => observer.observe(stat));
}

function animateCounter(element, finalValue) {
    let currentValue = 0;
    const increment = finalValue / 35;
    
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= finalValue) {
            currentValue = finalValue;
            clearInterval(timer);
        }
        
        element.textContent = Math.floor(currentValue);
    }, 25);
}

function setupCompanyActions() {
    // Configurar botones principales
    document.querySelectorAll('.action-button:not(.secondary)').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const card = this.closest('.compania-card');
            const companyName = card.querySelector('.compania-name').textContent;
            
            // Efecto visual del clic
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 120);
            
            // Mostrar loading y navegar
            showCompanyLoading(card);
            setTimeout(() => {
                navigateToPlatoons(companyName);
            }, 600);
        });
    });
    
    // Configurar botones secundarios
    document.querySelectorAll('.action-button.secondary').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const card = this.closest('.compania-card');
            const companyName = card.querySelector('.compania-name').textContent;
            
            showCompanyReport(companyName);
        });
    });
}

function showCompanyLoading(card) {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'company-loading';
    loadingOverlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Cargando pelotones...</p>
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
        border-radius: 10px;
        z-index: 10;
    `;
    
    card.style.position = 'relative';
    card.appendChild(loadingOverlay);
    
    // Añadir estilos del spinner si no existen
    if (!document.getElementById('company-loading-style')) {
        const style = document.createElement('style');
        style.id = 'company-loading-style';
        style.textContent = `
            .loading-spinner {
                width: 25px;
                height: 25px;
                border: 2px solid #f3f3f3;
                border-top: 2px solid #4a3d2c;
                border-radius: 50%;
                animation: companySpan 1s linear infinite;
                margin-bottom: 8px;
            }
            
            @keyframes companySpan {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

function navigateToPlatoons(companyName) {
    console.log(`Navegando a pelotones de ${companyName}`);
    showNotification(`Accediendo a pelotones de ${companyName}`, 'success');
    
    // Aquí se realizaría la navegación real
    // window.location.href = `/accounts/tercedivi/pelotones/?compania=${encodeURIComponent(companyName)}`;
}

function showCompanyReport(companyName) {
    const modal = document.createElement('div');
    modal.className = 'company-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Reporte de ${companyName}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="report-section">
                    <h4>Personal Asignado</h4>
                    <div class="report-grid">
                        <div class="report-item">
                            <span class="report-label">Oficiales:</span>
                            <span class="report-value">8</span>
                        </div>
                        <div class="report-item">
                            <span class="report-label">Suboficiales:</span>
                            <span class="report-value">15</span>
                        </div>
                        <div class="report-item">
                            <span class="report-label">Soldados:</span>
                            <span class="report-value">62</span>
                        </div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h4>Estado Operacional</h4>
                    <div class="status-indicators">
                        <div class="status-item operational">
                            <span class="status-dot"></span>
                            <span>Equipamiento: 98%</span>
                        </div>
                        <div class="status-item operational">
                            <span class="status-dot"></span>
                            <span>Personal: 95%</span>
                        </div>
                        <div class="status-item warning">
                            <span class="status-dot"></span>
                            <span>Entrenamiento: 87%</span>
                        </div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h4>Próximas Actividades</h4>
                    <ul class="activity-list">
                        <li>Ejercicio de Campo - 15/Nov</li>
                        <li>Inspección General - 20/Nov</li>
                        <li>Entrenamiento Táctico - 25/Nov</li>
                    </ul>
                </div>
            </div>
            <div class="modal-footer">
                <button class="export-report-btn">Exportar Reporte</button>
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
        border-radius: 10px;
        padding: 20px;
        max-width: 600px;
        width: 90%;
        max-height: 85vh;
        overflow-y: auto;
        transform: scale(0.8);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(modal);
    
    // Animación de entrada
    setTimeout(() => {
        modal.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    }, 10);
    
    // Funcionalidad de cerrar
    function closeModal() {
        modal.style.opacity = '0';
        modalContent.style.transform = 'scale(0.8)';
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
    
    // Funcionalidad del botón exportar
    modal.querySelector('.export-report-btn').addEventListener('click', function() {
        showNotification('Exportando reporte...', 'info');
        setTimeout(() => {
            showNotification('Reporte exportado exitosamente', 'success');
        }, 1500);
    });
    
    // Agregar estilos del modal si no existen
    if (!document.getElementById('company-modal-style')) {
        const style = document.createElement('style');
        style.id = 'company-modal-style';
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
                color: #4a3d2c;
            }
            
            .close-modal {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #999;
                transition: color 0.3s ease;
            }
            
            .close-modal:hover {
                color: #333;
            }
            
            .report-section {
                margin-bottom: 20px;
            }
            
            .report-section h4 {
                color: #4a3d2c;
                margin-bottom: 10px;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            }
            
            .report-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
            }
            
            .report-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 12px;
                background: rgba(74, 61, 44, 0.1);
                border-radius: 6px;
            }
            
            .report-label {
                font-weight: bold;
                color: #4a3d2c;
            }
            
            .status-indicators {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .status-item {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
            }
            
            .status-item.operational .status-dot {
                background: #4CAF50;
            }
            
            .status-item.warning .status-dot {
                background: #FF9800;
            }
            
            .activity-list {
                list-style: none;
                padding: 0;
            }
            
            .activity-list li {
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            
            .modal-footer {
                text-align: center;
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #eee;
            }
            
            .export-report-btn {
                background: linear-gradient(45deg, #4a3d2c, #6b5a47);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 20px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .export-report-btn:hover {
                background: linear-gradient(45deg, #3d322a, #4a3d2c);
                transform: scale(1.05);
            }
        `;
        document.head.appendChild(style);
    }
}

function createCompanyFilter() {
    const header = document.querySelector('.companias-header');
    if (header) {
        const filterContainer = document.createElement('div');
        filterContainer.innerHTML = `
            <input type="text" 
                   id="company-filter" 
                   placeholder="Buscar compañía..." 
                   style="
                       padding: 8px 15px;
                       border: 2px solid rgba(255,255,255,0.3);
                       border-radius: 20px;
                       background: rgba(255,255,255,0.9);
                       color: #4a3d2c;
                       margin-top: 10px;
                       width: 250px;
                       text-align: center;
                   ">
        `;
        
        header.appendChild(filterContainer);
        
        const filterInput = document.getElementById('company-filter');
        filterInput.addEventListener('input', function() {
            filterCompanies(this.value);
        });
    }
}

function filterCompanies(searchTerm) {
    const cards = document.querySelectorAll('.compania-card');
    
    cards.forEach(card => {
        const companyName = card.querySelector('.compania-name').textContent.toLowerCase();
        const companyInfo = card.querySelector('.compania-info').textContent.toLowerCase();
        
        if (companyName.includes(searchTerm.toLowerCase()) || 
            companyInfo.includes(searchTerm.toLowerCase())) {
            card.style.display = 'block';
            card.style.animation = 'fadeInCompany 0.4s ease';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Agregar animación de filtro
    if (!document.getElementById('company-filter-style')) {
        const style = document.createElement('style');
        style.id = 'company-filter-style';
        style.textContent = `
            @keyframes fadeInCompany {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
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
        padding: 12px 18px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        transition: all 0.3s ease;
        transform: translateX(100%);
        font-size: 0.9em;
    `;
    
    const colors = {
        'info': 'linear-gradient(45deg, #6b5a47, #4a3d2c)',
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