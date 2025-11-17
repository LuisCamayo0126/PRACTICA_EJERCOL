// Pelotones JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // If there are no peloton cards rendered by server, create 4 default green peloton cards
    (function createFallbackPelotones(){
        const grid = document.getElementById('pelotones-grid');
        if(!grid) return;
        if(grid.querySelectorAll('.peloton-card').length > 0) return; // server rendered
        const brigada = grid.dataset.brigada || '';
        const batallon = grid.dataset.batallon || '';
        const compania = grid.dataset.compania || '';
        const names = ['Pelotón 1','Pelotón 2','Pelotón 3','Pelotón 4'];
        names.forEach(name => {
            const card = document.createElement('div'); card.className = 'peloton-card';
            const header = document.createElement('div'); header.className = 'peloton-header';
            const icon = document.createElement('div'); icon.className = 'peloton-icon'; icon.textContent = '🎖️';
            const titleWrap = document.createElement('div'); titleWrap.className = 'peloton-title';
            const h3 = document.createElement('h3'); h3.className = 'peloton-name'; h3.textContent = name;
            titleWrap.appendChild(h3);
            header.appendChild(icon); header.appendChild(titleWrap);

            const actions = document.createElement('div'); actions.className = 'peloton-actions';
            const details = document.createElement('a'); details.className = 'action-button'; details.href = '#'; details.textContent = 'Ver Detalles';
            const exportBtn = document.createElement('a'); exportBtn.className = 'action-button export';
            const params = new URLSearchParams();
            if(brigada) params.set('brigada', brigada);
            if(batallon) params.set('batallon', batallon);
            if(compania) params.set('compania', compania);
            params.set('peloton', name);
            exportBtn.href = '/accounts/export_peloton_csv/?' + params.toString();
            exportBtn.textContent = 'Exportar';
            actions.appendChild(details); actions.appendChild(exportBtn);

            card.appendChild(header); card.appendChild(actions);
            grid.appendChild(card);
        });
    })();
    // Animación de entrada para tarjetas de pelotones
    const platoonCards = document.querySelectorAll('.peloton-card');
    platoonCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px) scale(0.9)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
        }, index * 120);
    });
    
    // Efectos de hover para pelotones
    platoonCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
            this.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15), 0 0 15px rgba(71, 89, 107, 0.2)';
            
            // Efecto en el icono
            const icon = this.querySelector('.peloton-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(10deg)';
                icon.style.color = '#47596b';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            
            const icon = this.querySelector('.peloton-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
                icon.style.color = '#2c3d4a';
            }
        });
    });
    
    // Animación del breadcrumb
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
        breadcrumb.style.transform = 'translateY(-12px)';
        breadcrumb.style.opacity = '0';
        
        setTimeout(() => {
            breadcrumb.style.transition = 'all 0.4s ease';
            breadcrumb.style.transform = 'translateY(0)';
            breadcrumb.style.opacity = '1';
        }, 100);
    }
    
    // Inicializar datos de pelotones
    initializePlatoonData();
    animatePlatoonStats();
    setupPlatoonActions();
    setupExportFunctionality();
    
    // Crear funcionalidad adicional
    createQuickActions();
});

function initializePlatoonData() {
    // Datos de ejemplo para pelotones
    const platoonTypes = ['1º Pelotón', '2º Pelotón', '3º Pelotón', '4º Pelotón', '5º Pelotón'];
    const platoonData = {
        '1º Pelotón': { number: '001', personnel: 28, equipment: 95, status: 'Operativo' },
        '2º Pelotón': { number: '002', personnel: 26, equipment: 88, status: 'Entrenamiento' },
        '3º Pelotón': { number: '003', personnel: 30, equipment: 92, status: 'Operativo' },
        '4º Pelotón': { number: '004', personnel: 24, equipment: 85, status: 'Mantenimiento' },
        '5º Pelotón': { number: '005', personnel: 27, equipment: 90, status: 'Operativo' }
    };
    
    // Actualizar información en las tarjetas
    document.querySelectorAll('.peloton-card').forEach((card, index) => {
        const platoonName = platoonTypes[index % platoonTypes.length];
        const data = platoonData[platoonName];
        
        if (data) {
            // Actualizar título
            const nameElement = card.querySelector('.peloton-name');
            if (nameElement) {
                nameElement.textContent = platoonName;
            }
            
            const numberElement = card.querySelector('.peloton-number');
            if (numberElement) {
                numberElement.textContent = `Código: ${data.number}`;
            }
            
            // Actualizar información
            const infoElement = card.querySelector('.peloton-info');
            if (infoElement) {
                infoElement.textContent = `Estado: ${data.status} | Equipamiento al ${data.equipment}%`;
            }
            
            // Actualizar estadísticas
            const stats = card.querySelectorAll('.stat-number');
            if (stats.length >= 2) {
                stats[0].textContent = data.personnel;
                stats[1].textContent = data.equipment + '%';
            }
        }
    });
}

function animatePlatoonStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stat = entry.target;
                const text = stat.textContent;
                const finalValue = parseInt(text);
                const isPercentage = text.includes('%');
                
                if (!isNaN(finalValue) && finalValue > 0) {
                    animateCounter(stat, finalValue, isPercentage);
                }
                observer.unobserve(stat);
            }
        });
    }, { threshold: 0.3 });
    
    statNumbers.forEach(stat => observer.observe(stat));
}

function animateCounter(element, finalValue, isPercentage = false) {
    let currentValue = 0;
    const increment = finalValue / 30;
    
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= finalValue) {
            currentValue = finalValue;
            clearInterval(timer);
        }
        
        element.textContent = Math.floor(currentValue) + (isPercentage ? '%' : '');
    }, 20);
}

function setupPlatoonActions() {
    // Configurar botones principales
    document.querySelectorAll('.action-button:not(.export)').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const card = this.closest('.peloton-card');
            const platoonName = card.querySelector('.peloton-name').textContent;
            
            // Efecto visual del clic
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 100);
            
            showPlatoonDetails(platoonName);
        });
    });
}

function setupExportFunctionality() {
    // Configurar botones de exportación
    document.querySelectorAll('.action-button.export').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const card = this.closest('.peloton-card');
            const platoonName = card.querySelector('.peloton-name').textContent;
            
            // Mostrar/ocultar opciones de exportación
            toggleExportOptions(card);
        });
    });
}

function toggleExportOptions(card) {
    let exportOptions = card.querySelector('.export-options');
    
    if (exportOptions) {
        // Si ya existe, removerlo
        exportOptions.remove();
    } else {
        // Crear opciones de exportación
        exportOptions = document.createElement('div');
        exportOptions.className = 'export-options';
        exportOptions.innerHTML = `
            <div class="export-title">Exportar Datos</div>
            <div class="export-buttons">
                <button class="export-btn csv-btn" data-format="csv">CSV</button>
                <button class="export-btn excel-btn" data-format="excel">Excel</button>
                <button class="export-btn pdf-btn" data-format="pdf">PDF</button>
            </div>
        `;
        
        card.appendChild(exportOptions);
        
        // Animación de entrada
        exportOptions.style.opacity = '0';
        exportOptions.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            exportOptions.style.transition = 'all 0.3s ease';
            exportOptions.style.opacity = '1';
            exportOptions.style.transform = 'translateY(0)';
        }, 10);
        
        // Configurar botones de exportación
        exportOptions.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const format = this.getAttribute('data-format');
                const platoonName = card.querySelector('.peloton-name').textContent;
                exportPlatoonData(platoonName, format);
                
                // Remover opciones después de la exportación
                setTimeout(() => {
                    if (exportOptions.parentNode) {
                        exportOptions.remove();
                    }
                }, 1000);
            });
        });
    }
}

function exportPlatoonData(platoonName, format) {
    showNotification(`Exportando ${platoonName} en formato ${format.toUpperCase()}...`, 'info');
    
    // Simular proceso de exportación
    setTimeout(() => {
        // En un proyecto real, aquí se realizaría la exportación real
        console.log(`Exportando ${platoonName} en formato ${format}`);
        
        // Simular descarga
        const link = document.createElement('a');
        link.download = `${platoonName.replace(/\s+/g, '_')}.${format}`;
        link.href = '#'; // En proyecto real sería la URL del archivo generado
        
        showNotification(`${platoonName} exportado exitosamente`, 'success');
    }, 1500);
}

function showPlatoonDetails(platoonName) {
    const modal = document.createElement('div');
    modal.className = 'platoon-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Detalles de ${platoonName}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="detail-tabs">
                    <button class="tab-btn active" data-tab="personal">Personal</button>
                    <button class="tab-btn" data-tab="equipment">Equipamiento</button>
                    <button class="tab-btn" data-tab="missions">Misiones</button>
                </div>
                
                <div class="tab-content active" data-tab="personal">
                    <h4>Composición del Personal</h4>
                    <div class="personnel-grid">
                        <div class="personnel-item">
                            <span class="rank">Teniente</span>
                            <span class="name">Juan Pérez</span>
                            <span class="role">Comandante</span>
                        </div>
                        <div class="personnel-item">
                            <span class="rank">Sargento</span>
                            <span class="name">Carlos López</span>
                            <span class="role">Segundo</span>
                        </div>
                        <div class="personnel-item">
                            <span class="rank">Soldados</span>
                            <span class="name">26 efectivos</span>
                            <span class="role">Tropa</span>
                        </div>
                    </div>
                </div>
                
                <div class="tab-content" data-tab="equipment">
                    <h4>Inventario de Equipamiento</h4>
                    <div class="equipment-list">
                        <div class="equipment-item">
                            <span class="item-name">Fusiles M16</span>
                            <span class="item-count">28/30</span>
                            <span class="item-status operational">Operativo</span>
                        </div>
                        <div class="equipment-item">
                            <span class="item-name">Radios</span>
                            <span class="item-count">8/10</span>
                            <span class="item-status warning">Reparación</span>
                        </div>
                        <div class="equipment-item">
                            <span class="item-name">Vehículos</span>
                            <span class="item-count">2/2</span>
                            <span class="item-status operational">Operativo</span>
                        </div>
                    </div>
                </div>
                
                <div class="tab-content" data-tab="missions">
                    <h4>Historial de Misiones</h4>
                    <div class="missions-timeline">
                        <div class="mission-item">
                            <div class="mission-date">Nov 10, 2024</div>
                            <div class="mission-name">Patrullaje Sector A</div>
                            <div class="mission-status completed">Completada</div>
                        </div>
                        <div class="mission-item">
                            <div class="mission-date">Nov 8, 2024</div>
                            <div class="mission-name">Entrenamiento Táctico</div>
                            <div class="mission-status completed">Completada</div>
                        </div>
                        <div class="mission-item">
                            <div class="mission-date">Nov 15, 2024</div>
                            <div class="mission-name">Ejercicio Conjunto</div>
                            <div class="mission-status pending">Programada</div>
                        </div>
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
        background: rgba(0,0,0,0.8);
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
        border-radius: 8px;
        padding: 20px;
        max-width: 700px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        transform: scale(0.9);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(modal);
    
    // Animación de entrada
    setTimeout(() => {
        modal.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    }, 10);
    
    // Funcionalidad de tabs
    setupModalTabs(modal);
    
    // Funcionalidad de cerrar
    function closeModal() {
        modal.style.opacity = '0';
        modalContent.style.transform = 'scale(0.9)';
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
    
    // Agregar estilos del modal si no existen
    addPlatoonModalStyles();
}

function setupModalTabs(modal) {
    const tabButtons = modal.querySelectorAll('.tab-btn');
    const tabContents = modal.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remover active de todos los tabs
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Activar tab seleccionado
            this.classList.add('active');
            modal.querySelector(`.tab-content[data-tab="${targetTab}"]`).classList.add('active');
        });
    });
}

function addPlatoonModalStyles() {
    if (!document.getElementById('platoon-modal-style')) {
        const style = document.createElement('style');
        style.id = 'platoon-modal-style';
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
                color: #2c3d4a;
                font-size: 1.4em;
            }
            
            .close-modal {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #999;
                transition: color 0.3s ease;
            }
            
            .close-modal:hover {
                color: #333;
            }
            
            .detail-tabs {
                display: flex;
                gap: 2px;
                margin-bottom: 20px;
                background: #f0f0f0;
                border-radius: 6px;
                padding: 4px;
            }
            
            .tab-btn {
                flex: 1;
                background: none;
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.9em;
            }
            
            .tab-btn.active {
                background: #2c3d4a;
                color: white;
            }
            
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
                animation: fadeInTab 0.3s ease;
            }
            
            @keyframes fadeInTab {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .personnel-grid {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .personnel-item {
                display: grid;
                grid-template-columns: 1fr 1.5fr 1fr;
                gap: 10px;
                padding: 8px 12px;
                background: rgba(44, 61, 74, 0.1);
                border-radius: 6px;
                align-items: center;
            }
            
            .personnel-item .rank {
                font-weight: bold;
                color: #2c3d4a;
            }
            
            .equipment-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .equipment-item {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr;
                gap: 10px;
                padding: 8px 12px;
                background: rgba(44, 61, 74, 0.1);
                border-radius: 6px;
                align-items: center;
            }
            
            .item-status.operational {
                color: #4CAF50;
                font-weight: bold;
            }
            
            .item-status.warning {
                color: #FF9800;
                font-weight: bold;
            }
            
            .missions-timeline {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .mission-item {
                display: grid;
                grid-template-columns: 1fr 2fr 1fr;
                gap: 10px;
                padding: 10px 12px;
                background: rgba(44, 61, 74, 0.1);
                border-radius: 6px;
                align-items: center;
            }
            
            .mission-status.completed {
                color: #4CAF50;
                font-weight: bold;
            }
            
            .mission-status.pending {
                color: #2196F3;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }
}

function createQuickActions() {
    const container = document.querySelector('.pelotones-container');
    if (container) {
        const quickActionsBar = document.createElement('div');
        quickActionsBar.innerHTML = `
            <div class="quick-actions">
                <button class="quick-btn" onclick="selectAllPlatoons()">
                    <span>Seleccionar Todos</span>
                </button>
                <button class="quick-btn" onclick="exportAllPlatoons()">
                    <span>Exportar Todos</span>
                </button>
                <button class="quick-btn" onclick="generateReport()">
                    <span>Generar Reporte</span>
                </button>
            </div>
        `;
        
        quickActionsBar.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 100;
        `;
        
        container.appendChild(quickActionsBar);
        
        // Agregar estilos para quick actions
        if (!document.getElementById('quick-actions-style')) {
            const style = document.createElement('style');
            style.id = 'quick-actions-style';
            style.textContent = `
                .quick-actions {
                    display: flex;
                    gap: 10px;
                    background: rgba(255,255,255,0.95);
                    padding: 10px;
                    border-radius: 25px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                
                .quick-btn {
                    background: linear-gradient(45deg, #2c3d4a, #47596b);
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 18px;
                    cursor: pointer;
                    font-size: 0.8em;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }
                
                .quick-btn:hover {
                    background: linear-gradient(45deg, #1e2a34, #2c3d4a);
                    transform: scale(1.05);
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Funciones globales para quick actions
function selectAllPlatoons() {
    showNotification('Seleccionando todos los pelotones...', 'info');
    // Implementar selección múltiple
}

function exportAllPlatoons() {
    showNotification('Exportando todos los pelotones...', 'info');
    // Implementar exportación masiva
}

function generateReport() {
    showNotification('Generando reporte general...', 'info');
    // Implementar generación de reporte
}

// Función de utilidad para notificaciones
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 16px;
        border-radius: 6px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        transition: all 0.3s ease;
        transform: translateX(100%);
        font-size: 0.85em;
    `;
    
    const colors = {
        'info': 'linear-gradient(45deg, #47596b, #2c3d4a)',
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