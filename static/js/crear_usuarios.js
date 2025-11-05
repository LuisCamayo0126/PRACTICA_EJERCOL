/**
 * Crear Usuarios JavaScript Functionality
 * Extiende la funcionalidad de register.js para crear usuarios
 */

console.log('Crear Usuarios JS cargado correctamente - Archivo separado');

// Variables globales que deben ser definidas en el template
let csrfToken = '';
let validateAdminUrl = '';
let crearUsuariosUrl = '';
let loginUrl = '';
let requireAuth = true; // Por defecto requiere autenticación

document.addEventListener('DOMContentLoaded', function() {
    // Esperar un poco para que las URLs se inicialicen
    setTimeout(function() {
        initializeCrearUsuariosPage();
    }, 100);
});

/**
 * Inicializar toda la funcionalidad de la página de crear usuarios
 */
function initializeCrearUsuariosPage() {
    console.log('Inicializando página de crear usuarios...');
    
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
    
    // Inicializar todas las funcionalidades
    initializeEventHandlers();
    initializeFormValidation();
    initializeExcelUpload();
    initializeCrearUsuariosFeatures();
    initializeSharedRegisterFeatures();
}

/**
 * Inicializar características específicas de crear usuarios
 */
function initializeCrearUsuariosFeatures() {
    // Detectar el rol del usuario para mostrar mensajes específicos
    const userRole = detectUserRole();
    
    if (userRole === 'instructor') {
        showInstructorMessage();
    }
    
    // Personalizar mensajes según el contexto
    personalizeMessages();
}

/**
 * Detectar rol del usuario actual
 */
function detectUserRole() {
    // Detectar desde el DOM o variables globales
    const modalSubtitle = document.querySelector('.modal-subtitle');
    if (modalSubtitle && modalSubtitle.textContent.includes('instructor')) {
        return 'instructor';
    }
    return 'admin';
}

/**
 * Mostrar mensaje específico para instructores
 */
function showInstructorMessage() {
    const authModal = document.querySelector('.admin-auth-modal .modal-header');
    if (authModal) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'instructor-auth-message';
        messageDiv.innerHTML = `
            <span class="icon">⚠️</span>
            <strong>Instructor autorizado:</strong> Necesitas validación administrativa adicional para crear usuarios.
        `;
        authModal.appendChild(messageDiv);
    }
}

/**
 * Personalizar mensajes para el contexto de crear usuarios
 */
function personalizeMessages() {
    // Cambiar títulos de éxito para crear usuarios
    const successTitle = document.querySelector('.success-title');
    if (successTitle) {
        successTitle.textContent = '¡Usuario Creado Exitosamente!';
    }
    
    const successMessage = document.querySelector('.success-message');
    if (successMessage) {
        successMessage.textContent = 'El nuevo usuario militar ha sido creado correctamente en el sistema.';
    }
}

/**
 * Reutilizar funcionalidades compartidas de register
 * (Esta función replicaría las funciones principales de register.js)
 */
function initializeSharedRegisterFeatures() {
    // Manejar autenticación administrativa
    const authForm = document.getElementById('adminAuthForm');
    if (authForm) {
        authForm.addEventListener('submit', handleAdminAuthCrearUsuarios);
    }
    
    // Auto-generar credenciales
    const nombresField = document.querySelector('input[name="nombres"]');
    const apellidosField = document.querySelector('input[name="apellidos"]');
    const cedulaField = document.querySelector('input[name="cedula"]');
    
    if (nombresField) nombresField.addEventListener('blur', generateCredentials);
    if (apellidosField) apellidosField.addEventListener('blur', generateCredentials);
    if (cedulaField) cedulaField.addEventListener('blur', generateCredentials);
    
    // Manejar envío del formulario
    const registerForm = document.querySelector('.register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleFormSubmitCrearUsuarios);
    }
    
    // Manejar Excel upload
    const excelUpload = document.querySelector('.excel-upload');
    if (excelUpload) {
        excelUpload.addEventListener('click', handleExcelUpload);
    }
    
    // Manejadores de modales
    initializeModalHandlers();
}

/**
 * Manejar autenticación administrativa específica para crear usuarios
 */
function handleAdminAuthCrearUsuarios(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUser').value;
    const password = document.getElementById('adminPass').value;
    
    // URL específica para validación en crear usuarios
    const validateUrl = '/accounts/validate-admin-crear-usuarios/'; // URL específica
    
    fetch(validateUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.valid) {
            hideAuthModal();
            showForm();
            storeAdminCredentials(username, password);
        } else {
            showModalError('Credenciales de administrador inválidas para crear usuarios');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showModalError('Error de conexión. Intente nuevamente.');
    });
}

/**
 * Manejar envío del formulario específico para crear usuarios
 */
function handleFormSubmitCrearUsuarios(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Añadir indicador de que es crear usuarios
    formData.append('action', 'crear_usuarios');
    
    fetch(window.location.href, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
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
 * Inicializar manejadores de modales
 */
function initializeModalHandlers() {
    // Botón cancelar
    const cancelButton = document.getElementById('cancelAuth');
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            window.location.href = '/accounts/admin/'; // Volver a admin home
        });
    }
    
    // Botones del modal de éxito
    const registerAnotherBtn = document.getElementById('registerAnother');
    const closeSuccessBtn = document.getElementById('closeSuccess');
    
    if (registerAnotherBtn) {
        registerAnotherBtn.addEventListener('click', handleRegisterAnother);
    }
    
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', function() {
            window.location.href = '/accounts/admin/';
        });
    }
}

/**
 * Funciones utilitarias reutilizadas
 */
function generateCredentials() {
    // Copiar lógica de register.js
    const nombres = document.querySelector('input[name="nombres"]')?.value.trim();
    const apellidos = document.querySelector('input[name="apellidos"]')?.value.trim();
    const cedula = document.querySelector('input[name="cedula"]')?.value.trim();
    
    if (nombres && apellidos && cedula) {
        const primerNombre = nombres.split(' ')[0].toLowerCase();
        const primerApellido = apellidos.split(' ')[0].toLowerCase();
        const ultimosCedula = cedula.slice(-4);
        
        const username = `${primerNombre}.${primerApellido}${ultimosCedula}`;
        const password = `Mil${cedula}!`;
        const email = `${username}@ejercito.mil.co`;
        
        updateHiddenFields({
            'hidden_username': username,
            'hidden_email': email,
            'hidden_first_name': nombres,
            'hidden_last_name': apellidos,
            'hidden_password1': password,
            'hidden_password2': password
        });
    }
}

function updateHiddenFields(fields) {
    Object.entries(fields).forEach(([id, value]) => {
        const field = document.getElementById(id);
        if (field) field.value = value;
    });
}

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
}

function showAuthModal() {
    const overlay = document.getElementById('adminAuthOverlay');
    if (overlay) {
        overlay.style.display = 'block';
    }
}

function hideAuthModal() {
    const overlay = document.getElementById('adminAuthOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function showForm() {
    const content = document.getElementById('registerContent');
    if (content) {
        content.classList.add('authenticated');
    }
}

function storeAdminCredentials(username, password) {
    const usernameField = document.getElementById('hidden_admin_username');
    const passwordField = document.getElementById('hidden_admin_password');
    
    if (usernameField) usernameField.value = username;
    if (passwordField) passwordField.value = password;
}

function showModalError(message) {
    const errorDiv = document.getElementById('modalError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function showSuccessMessage(data) {
    const userInfo = `Usuario creado: ${data.username || 'N/A'} | Email: ${data.email || 'N/A'}`;
    const successInfo = document.getElementById('successUserInfo');
    const successOverlay = document.getElementById('successOverlay');
    
    if (successInfo) successInfo.textContent = userInfo;
    if (successOverlay) successOverlay.style.display = 'block';
}

function showFormErrors(data) {
    let errorMessage = 'Error al crear usuario:\n';
    if (data.errors) {
        for (let field in data.errors) {
            errorMessage += `- ${field}: ${data.errors[field].join(', ')}\n`;
        }
    } else {
        errorMessage += (data.error || 'Error desconocido');
    }
    alert(errorMessage);
}

function handleRegisterAnother() {
    const successOverlay = document.getElementById('successOverlay');
    const registerForm = document.querySelector('.register-form');
    
    if (successOverlay) successOverlay.style.display = 'none';
    if (registerForm) {
        registerForm.reset();
        clearHiddenFields();
    }
}

function clearHiddenFields() {
    const hiddenFields = [
        'hidden_username', 'hidden_email', 'hidden_first_name',
        'hidden_last_name', 'hidden_password1', 'hidden_password2'
    ];
    
    hiddenFields.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
    });
}

function handleExcelUpload() {
    // Reutilizar lógica de register.js para Excel
    CrearUsuarios.showNotification('Funcionalidad de Excel en desarrollo para crear usuarios', 'info');
}

// Módulo específico para crear usuarios
const CrearUsuarios = {
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `crear-usuarios-notification ${type}`;
        notification.textContent = message;
        
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
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
};

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
            const hiddenAdminUsername = document.getElementById('hidden_admin_username');
            const hiddenAdminPassword = document.getElementById('hidden_admin_password');
            if (hiddenAdminUsername) hiddenAdminUsername.value = username;
            if (hiddenAdminPassword) hiddenAdminPassword.value = password;
        } else {
            // Mostrar error
            const errorDiv = document.getElementById('modalError');
            if (errorDiv) {
                errorDiv.textContent = 'Credenciales de administrador inválidas';
                errorDiv.style.display = 'block';
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        const errorDiv = document.getElementById('modalError');
        if (errorDiv) {
            errorDiv.textContent = 'Error de conexión. Intente nuevamente.';
            errorDiv.style.display = 'block';
        }
    });
}

/**
 * Inicializar validación del formulario
 */
function initializeFormValidation() {
    // Funcionalidad básica de validación
    const registerForm = document.querySelector('.register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            // Validación básica antes de envío
            console.log('Formulario enviado');
        });
    }
}

/**
 * Inicializar carga de Excel
 */
function initializeExcelUpload() {
    // Manejar subida de archivo Excel
    const excelUpload = document.querySelector('.excel-upload');
    if (excelUpload) {
        excelUpload.addEventListener('click', function() {
            // Crear input file temporal
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.xlsx,.xls';
            fileInput.style.display = 'none';
            
            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    console.log('Archivo Excel seleccionado:', file.name);
                    // Aquí se procesaría el archivo Excel
                }
            });
            
            document.body.appendChild(fileInput);
            fileInput.click();
            document.body.removeChild(fileInput);
        });
    }
}

/**
 * Función para inicializar URLs desde el template
 */
function initializeUrls(csrf, validateAdmin, crearUsuarios, login, reqAuth = true) {
    csrfToken = csrf;
    validateAdminUrl = validateAdmin;
    crearUsuariosUrl = crearUsuarios;
    loginUrl = login;
    requireAuth = reqAuth;
    
    console.log('URLs inicializadas para crear usuarios:', {
        validateAdminUrl,
        crearUsuariosUrl,
        loginUrl,
        requireAuth
    });
}

// Exportar funciones para uso global
window.CrearUsuariosModule = {
    initializeUrls,
    showAdminAuthModal,
    handleAdminAuth
};