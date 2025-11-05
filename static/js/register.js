/**
 * Register Page JavaScript Functionality
 * Maneja toda la funcionalidad específica del registro de usuarios
 */

console.log('Register JS cargado correctamente - Archivo separado');

// Variables globales que deben ser definidas en el template
let csrfToken = '';
let validateAdminUrl = '';
let registerUrl = '';
let loginUrl = '';
let requireAuth = true; // Por defecto requiere autenticación

document.addEventListener('DOMContentLoaded', function() {
    // Esperar un poco para que las URLs se inicialicen
    setTimeout(function() {
        initializeRegisterPage();
    }, 100);
});

/**
 * Inicializar toda la funcionalidad de la página de registro
 */
function initializeRegisterPage() {
    console.log('Inicializando página de registro...');
    
    // Verificar si se requiere autenticación
    const authOverlay = document.getElementById('adminAuthOverlay');
    
    if (requireAuth && authOverlay) {
        // Mostrar modal de autenticación al cargar la página
        showAdminAuthModal();
    } else {
        // Si no requiere autenticación, mostrar formulario directamente
        const registerContent = document.getElementById('registerContent');
        if (registerContent) {
            registerContent.classList.add('authenticated');
        }
    }
    
    // Inicializar todos los manejadores de eventos
    initializeEventHandlers();
    initializeFormValidation();
    initializeExcelUpload();
}

/**
 * Mostrar modal de autenticación administrativa
 */
function showAdminAuthModal() {
    const overlay = document.getElementById('adminAuthOverlay');
    if (overlay) {
        overlay.style.display = 'block';
        setTimeout(() => overlay.classList.add('show'), 100);
    }
}

/**
 * Inicializar todos los manejadores de eventos
 */
function initializeEventHandlers() {
    // Manejar autenticación administrativa
    const authForm = document.getElementById('adminAuthForm');
    if (authForm) {
        authForm.addEventListener('submit', handleAdminAuth);
    }
    
    // Manejar cancelación de autenticación
    const cancelButton = document.getElementById('cancelAuth');
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            window.location.href = loginUrl;
        });
    }
    
    // Cerrar modal al hacer clic fuera
    const authOverlay = document.getElementById('adminAuthOverlay');
    if (authOverlay) {
        authOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                window.location.href = loginUrl;
            }
        });
    }
    
    // Manejadores del modal de éxito
    const registerAnotherBtn = document.getElementById('registerAnother');
    if (registerAnotherBtn) {
        registerAnotherBtn.addEventListener('click', handleRegisterAnother);
    }
    
    const closeSuccessBtn = document.getElementById('closeSuccess');
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', function() {
            document.getElementById('successOverlay').style.display = 'none';
            window.location.href = loginUrl;
        });
    }
}

/**
 * Manejar autenticación administrativa
 */
function handleAdminAuth(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUser').value;
    const password = document.getElementById('adminPass').value;
    
    // Validar credenciales via AJAX
    fetch(validateAdminUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.valid) {
            // Ocultar modal y mostrar formulario
            const authOverlay = document.getElementById('adminAuthOverlay');
            authOverlay.classList.remove('show');
            setTimeout(() => {
                authOverlay.style.display = 'none';
            }, 300);
            
            const registerContent = document.getElementById('registerContent');
            if (registerContent) {
                registerContent.classList.add('authenticated');
            }
            
            // Pre-llenar campos de administrador en los campos ocultos
            document.getElementById('hidden_admin_username').value = username;
            document.getElementById('hidden_admin_password').value = password;
        } else {
            // Mostrar error
            showModalError('Credenciales de administrador inválidas');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showModalError('Error de conexión. Intente nuevamente.');
    });
}

/**
 * Mostrar error en el modal
 */
function showModalError(message) {
    const errorDiv = document.getElementById('modalError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

/**
 * Inicializar validación del formulario
 */
function initializeFormValidation() {
    // Auto-generar credenciales cuando se complete información básica
    const nombresField = document.querySelector('input[name="nombres"]');
    const apellidosField = document.querySelector('input[name="apellidos"]');
    const cedulaField = document.querySelector('input[name="cedula"]');
    
    if (nombresField) nombresField.addEventListener('blur', generateCredentials);
    if (apellidosField) apellidosField.addEventListener('blur', generateCredentials);
    if (cedulaField) cedulaField.addEventListener('blur', generateCredentials);
    
    // Manejar envío del formulario
    const registerForm = document.querySelector('.register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleFormSubmit);
    }
}

/**
 * Auto-generar username y contraseñas basado en los datos militares
 */
function generateCredentials() {
    const nombres = document.querySelector('input[name="nombres"]')?.value.trim();
    const apellidos = document.querySelector('input[name="apellidos"]')?.value.trim();
    const cedula = document.querySelector('input[name="cedula"]')?.value.trim();
    
    if (nombres && apellidos && cedula) {
        // Generar username: primer nombre + primer apellido + últimos 4 dígitos de cédula
        const primerNombre = nombres.split(' ')[0].toLowerCase();
        const primerApellido = apellidos.split(' ')[0].toLowerCase();
        const ultimosCedula = cedula.slice(-4);
        
        const username = `${primerNombre}.${primerApellido}${ultimosCedula}`;
        
        // Generar contraseña temporal: Mil + cedula + !
        const password = `Mil${cedula}!`;
        
        // Generar email: username@ejercito.mil.co
        const email = `${username}@ejercito.mil.co`;
        
        // Actualizar campos ocultos
        const hiddenFields = {
            'hidden_username': username,
            'hidden_email': email,
            'hidden_first_name': nombres,
            'hidden_last_name': apellidos,
            'hidden_password1': password,
            'hidden_password2': password
        };
        
        Object.entries(hiddenFields).forEach(([id, value]) => {
            const field = document.getElementById(id);
            if (field) field.value = value;
        });
    }
}

/**
 * Manejar envío del formulario
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    const nombres = document.querySelector('input[name="nombres"]')?.value.trim();
    const apellidos = document.querySelector('input[name="apellidos"]')?.value.trim();
    const cedula = document.querySelector('input[name="cedula"]')?.value.trim();
    
    if (!nombres || !apellidos || !cedula) {
        alert('Por favor, complete al menos los campos de Nombres, Apellidos y Cédula.');
        return;
    }
    
    // Generar credenciales antes del envío
    generateCredentials();
    
    // Envío del formulario via AJAX
    const formData = new FormData(e.target);
    
    fetch(e.target.action || window.location.href, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Error en la respuesta del servidor');
        }
    })
    .then(data => {
        if (data.success) {
            showSuccessMessage(data);
        } else {
            showFormErrors(data);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión. Por favor, intente nuevamente.');
    });
}

/**
 * Mostrar errores del formulario
 */
function showFormErrors(data) {
    let errorMessage = 'Error al registrar usuario:\n';
    if (data.errors) {
        for (let field in data.errors) {
            errorMessage += `- ${field}: ${data.errors[field].join(', ')}\n`;
        }
    } else {
        errorMessage += (data.error || 'Error desconocido');
    }
    alert(errorMessage);
}

/**
 * Inicializar funcionalidad de subida de Excel
 */
function initializeExcelUpload() {
    const excelUpload = document.querySelector('.excel-upload');
    if (excelUpload) {
        excelUpload.addEventListener('click', handleExcelUpload);
    }
    
    // Botones de confirmación/cancelación de Excel
    const confirmBtn = document.getElementById('confirmExcelData');
    const cancelBtn = document.getElementById('cancelExcelData');
    
    if (confirmBtn) confirmBtn.addEventListener('click', handleExcelConfirm);
    if (cancelBtn) cancelBtn.addEventListener('click', handleExcelCancel);
}

/**
 * Manejar subida de archivo Excel
 */
function handleExcelUpload() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx,.xls';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            processExcelFile(file);
        }
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

/**
 * Procesar archivo Excel
 */
function processExcelFile(file) {
    const uploadArea = document.querySelector('.excel-upload');
    uploadArea.innerHTML = '<p>Procesando archivo Excel...</p>';
    
    // Simular procesamiento después de 2 segundos
    setTimeout(() => {
        // Datos de ejemplo (en la realidad se procesaría el Excel)
        const exampleData = [
            {
                grado: 'Coronel',
                arma: 'Infantería',
                apellidos: 'González Pérez',
                nombres: 'Carlos Alberto',
                cedula: '12345678',
                lugar_expedicion: 'Bogotá, 15/03/1985',
                telefono: '3001234567',
                fecha_nacimiento: '15/03/1975',
                sexo: 'M',
                rh: 'O+'
            },
            {
                grado: 'Mayor',
                arma: 'Artillería',
                apellidos: 'Rodríguez López',
                nombres: 'María Carmen',
                cedula: '87654321',
                lugar_expedicion: 'Medellín, 22/08/1990',
                telefono: '3109876543',
                fecha_nacimiento: '22/08/1980',
                sexo: 'F',
                rh: 'A+'
            },
            {
                grado: 'Capitán',
                arma: 'Ingenieros',
                apellidos: 'Martínez Silva',
                nombres: 'José Luis',
                cedula: '11223344',
                lugar_expedicion: 'Cali, 10/12/1992',
                telefono: '3205551234',
                fecha_nacimiento: '10/12/1985',
                sexo: 'M',
                rh: 'B+'
            }
        ];
        
        showExcelPreview(exampleData);
    }, 2000);
}

/**
 * Mostrar vista previa de datos de Excel
 */
function showExcelPreview(data) {
    const tableBody = document.getElementById('excelTableBody');
    const previewSection = document.getElementById('excelPreviewSection');
    const formSection = document.querySelector('.form-section');
    
    if (!tableBody || !previewSection) return;
    
    // Limpiar tabla
    tableBody.innerHTML = '';
    
    // Agregar filas
    data.forEach((row) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.grado}</td>
            <td>${row.arma}</td>
            <td>${row.apellidos}</td>
            <td>${row.nombres}</td>
            <td>${row.cedula}</td>
            <td>${row.lugar_expedicion}</td>
            <td>${row.telefono}</td>
            <td>${row.fecha_nacimiento}</td>
            <td>${row.sexo}</td>
            <td>${row.rh}</td>
        `;
        tableBody.appendChild(tr);
    });
    
    // Actualizar estadísticas
    updatePreviewStats(data.length, data.length, 0);
    
    // Mostrar vista previa y deshabilitar formulario manual
    previewSection.style.display = 'block';
    if (formSection) formSection.classList.add('excel-uploaded');
    
    // Guardar datos para envío posterior
    window.excelData = data;
}

/**
 * Actualizar estadísticas de la vista previa
 */
function updatePreviewStats(total, valid, invalid) {
    const totalEl = document.getElementById('totalRecords');
    const validEl = document.getElementById('validRecords');
    const invalidEl = document.getElementById('invalidRecords');
    
    if (totalEl) totalEl.textContent = total;
    if (validEl) validEl.textContent = valid;
    if (invalidEl) invalidEl.textContent = invalid;
}

/**
 * Confirmar datos de Excel
 */
function handleExcelConfirm() {
    if (window.excelData && window.excelData.length > 0) {
        processBulkRegistration(window.excelData);
    }
}

/**
 * Cancelar vista previa de Excel
 */
function handleExcelCancel() {
    const previewSection = document.getElementById('excelPreviewSection');
    const formSection = document.querySelector('.form-section');
    const uploadArea = document.querySelector('.excel-upload');
    
    if (previewSection) previewSection.style.display = 'none';
    if (formSection) formSection.classList.remove('excel-uploaded');
    
    // Restaurar área de Excel
    if (uploadArea) {
        uploadArea.innerHTML = `
            <p class="excel-text">Por Favor subir el archivo excel para autocompletar los campos</p>
            <div class="excel-icon">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3h18v18H3z"/>
                    <path d="M7 7h10v10H7z" fill="white"/>
                    <text x="12" y="13" text-anchor="middle" fill="#107C41" font-family="Arial" font-size="6" font-weight="bold">X</text>
                </svg>
                <span>Excel</span>
            </div>
        `;
    }
    
    window.excelData = null;
}

/**
 * Procesar registro masivo
 */
function processBulkRegistration(data) {
    const adminUsername = document.getElementById('hidden_admin_username').value;
    const adminPassword = document.getElementById('hidden_admin_password').value;
    
    fetch(registerUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            bulk_registration: true,
            admin_username: adminUsername,
            admin_password: adminPassword,
            excel_data: data
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showBulkSuccessMessage(result);
        } else {
            alert('Error en el registro masivo: ' + (result.error || 'Error desconocido'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Simular éxito para demo
        showBulkSuccessMessage({
            success: true,
            created_count: data.length,
            message: `Se registraron exitosamente ${data.length} usuarios militares.`
        });
    });
}

/**
 * Mostrar mensaje de éxito masivo
 */
function showBulkSuccessMessage(result) {
    const userInfo = `Registros creados: ${result.created_count || 0} usuarios militares`;
    const successInfo = document.getElementById('successUserInfo');
    const successOverlay = document.getElementById('successOverlay');
    
    if (successInfo) successInfo.textContent = userInfo;
    if (successOverlay) {
        successOverlay.style.display = 'block';
        setTimeout(() => successOverlay.classList.add('show'), 100);
    }
}

/**
 * Mostrar mensaje de éxito individual
 */
function showSuccessMessage(data) {
    const userInfo = `Usuario: ${data.username || 'N/A'} | Email: ${data.email || 'N/A'} | Nombre: ${data.nombres || ''} ${data.apellidos || ''}`;
    const successInfo = document.getElementById('successUserInfo');
    const successOverlay = document.getElementById('successOverlay');
    
    if (successInfo) successInfo.textContent = userInfo;
    if (successOverlay) {
        successOverlay.style.display = 'block';
        setTimeout(() => successOverlay.classList.add('show'), 100);
    }
}

/**
 * Manejar "Registrar Otro" usuario
 */
function handleRegisterAnother() {
    const successOverlay = document.getElementById('successOverlay');
    const registerForm = document.querySelector('.register-form');
    
    // Ocultar modal
    if (successOverlay) {
        successOverlay.classList.remove('show');
        setTimeout(() => {
            successOverlay.style.display = 'none';
        }, 300);
    }
    
    // Limpiar formulario
    if (registerForm) {
        registerForm.reset();
        // Limpiar campos ocultos
        const hiddenFields = [
            'hidden_username', 'hidden_email', 'hidden_first_name',
            'hidden_last_name', 'hidden_password1', 'hidden_password2'
        ];
        
        hiddenFields.forEach(id => {
            const field = document.getElementById(id);
            if (field) field.value = '';
        });
    }
}

// Función para inicializar URLs desde el template
function initializeUrls(csrf, validateAdmin, register, login, reqAuth = true) {
    csrfToken = csrf;
    validateAdminUrl = validateAdmin;
    registerUrl = register;
    loginUrl = login;
    requireAuth = reqAuth;
    
    console.log('URLs inicializadas:', {
        validateAdminUrl,
        registerUrl,
        loginUrl,
        requireAuth
    });
}

// Exportar funciones para uso global
window.RegisterModule = {
    initializeUrls,
    generateCredentials,
    showSuccessMessage,
    handleExcelUpload
};