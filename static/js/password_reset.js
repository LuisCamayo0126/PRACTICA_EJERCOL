/**
 * Password Reset JavaScript Functionality
 * Maneja la funcionalidad específica de recuperación de contraseña
 */

console.log('Password Reset JS cargado correctamente - Archivo separado');

document.addEventListener('DOMContentLoaded', function() {
    initializePasswordReset();
});

/**
 * Inicializar funcionalidad de password reset
 */
function initializePasswordReset() {
    const resetForm = document.querySelector('.reset-form');
    const emailInput = document.querySelector('#id_email');
    const submitButton = document.querySelector('.btn-reset');
    
    if (resetForm) {
        resetForm.addEventListener('submit', handleFormSubmit);
    }
    
    if (emailInput) {
        // Auto-focus en el campo email
        emailInput.focus();
        
        // Validación en tiempo real solo para formato
        emailInput.addEventListener('input', validateEmailFormat);
        // Validación completa cuando sale del campo
        emailInput.addEventListener('blur', validateEmail);
        
        // Autocompletar común para emails militares
        emailInput.addEventListener('input', handleEmailAutocomplete);
    }
    
    // Mejorar UX del botón
    if (submitButton) {
        enhanceSubmitButton();
    }
    
    // Manejar navegación con teclado
    initializeKeyboardNavigation();
}

/**
 * Manejar envío del formulario
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    const emailInput = document.querySelector('#id_email');
    const submitButton = document.querySelector('.btn-reset');
    
    if (!validateEmail()) {
        return false;
    }
    
    // Mostrar estado de carga
    showLoadingState(submitButton);
    
    // Simular envío (en producción sería un fetch real)
    setTimeout(() => {
        // Simular éxito
        showSuccessState();
        hideLoadingState(submitButton);
    }, 2000);
    
    // En producción, aquí iría el fetch real:
    /*
    fetch(e.target.action, {
        method: 'POST',
        body: new FormData(e.target),
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingState(submitButton);
        if (data.success) {
            showSuccessState();
        } else {
            showErrorState(data.error || 'Error al enviar el correo');
        }
    })
    .catch(error => {
        hideLoadingState(submitButton);
        showErrorState('Error de conexión. Por favor, intente nuevamente.');
    });
    */
}

/**
 * Validar formato de email en tiempo real (sin mostrar iconos)
 */
function validateEmailFormat() {
    const emailInput = document.querySelector('#id_email');
    const email = emailInput.value.trim();
    
    // Limpiar errores previos
    clearFieldError(emailInput);
    
    // Solo validar silenciosamente el formato
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            // No mostrar iconos, solo marcar el campo
            emailInput.classList.add('invalid');
            return false;
        } else {
            emailInput.classList.remove('invalid');
        }
    }
    
    return true;
}

/**
 * Validar email completo (sin iconos)
 */
function validateEmail() {
    const emailInput = document.querySelector('#id_email');
    const email = emailInput.value.trim();
    
    // Limpiar errores previos
    clearFieldError(emailInput);
    
    if (!email) {
        // No mostrar iconos, solo marcar el campo
        emailInput.classList.add('invalid');
        return false;
    }
    
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        // No mostrar iconos, solo marcar el campo
        emailInput.classList.add('invalid');
        return false;
    } else {
        emailInput.classList.remove('invalid');
    }
    
    return true;
}

/**
 * Mostrar error en campo
 */
function showFieldError(field, message) {
    // Primero limpiar cualquier error existente
    clearFieldError(field);
    
    field.classList.add('error');
    field.parentNode.classList.add('error');
    
    const wrapper = field.closest('.input-wrapper');
    const parent = wrapper.parentNode;
    
    // Verificar si ya existe un mensaje de error
    if (parent.querySelector('.form-error')) {
        return; // Ya existe, no crear duplicado
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
        </svg>
        ${message}
    `;
    
    // Insertar después del input wrapper
    parent.insertBefore(errorDiv, wrapper.nextSibling);
}

/**
 * Mostrar advertencia en campo
 */
function showFieldWarning(field, message) {
    const wrapper = field.closest('.input-wrapper');
    const parent = wrapper.parentNode;
    
    // Verificar si ya existe un mensaje de advertencia
    if (parent.querySelector('.form-warning')) {
        return; // Ya existe, no crear duplicado
    }
    
    const warningDiv = document.createElement('div');
    warningDiv.className = 'form-warning';
    warningDiv.style.cssText = `
        color: #ffc107;
        font-size: 0.85rem;
        margin-top: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    warningDiv.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 16px; height: 16px;">
            <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" fill="currentColor"/>
        </svg>
        ${message}
    `;
    
    parent.insertBefore(warningDiv, wrapper.nextSibling);
}

/**
 * Limpiar errores del campo
 */
function clearFieldError(field) {
    field.classList.remove('error');
    field.parentNode.classList.remove('error');
    
    // Remover mensajes de error y advertencia existentes
    const wrapper = field.closest('.input-wrapper');
    const parent = wrapper.parentNode;
    
    const existingError = parent.querySelector('.form-error');
    const existingWarning = parent.querySelector('.form-warning');
    
    if (existingError) existingError.remove();
    if (existingWarning) existingWarning.remove();
}

/**
 * Autocompletar email militar
 */
function handleEmailAutocomplete(e) {
    const input = e.target;
    const value = input.value;
    
    // Sugerir dominio militar si el usuario está escribiendo
    if (value.includes('@') && !value.includes('ejercito.mil.co')) {
        const username = value.split('@')[0];
        if (username.length > 2) {
            // Mostrar sugerencia visual (opcional)
            showEmailSuggestion(input, `${username}@ejercito.mil.co`);
        }
    }
}

/**
 * Mostrar sugerencia de email
 */
function showEmailSuggestion(input, suggestion) {
    // Remover sugerencia existente
    const existingSuggestion = input.parentNode.querySelector('.email-suggestion');
    if (existingSuggestion) existingSuggestion.remove();
    
    const suggestionDiv = document.createElement('div');
    suggestionDiv.className = 'email-suggestion';
    suggestionDiv.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e9ecef;
        border-top: none;
        border-radius: 0 0 8px 8px;
        padding: 0.5rem 1rem;
        cursor: pointer;
        z-index: 10;
        font-size: 0.9rem;
        color: #6c757d;
    `;
    suggestionDiv.textContent = `¿Quiso decir: ${suggestion}?`;
    
    suggestionDiv.addEventListener('click', function() {
        input.value = suggestion;
        this.remove();
        validateEmail();
    });
    
    input.parentNode.appendChild(suggestionDiv);
    
    // Remover sugerencia después de 5 segundos
    setTimeout(() => {
        if (suggestionDiv.parentNode) {
            suggestionDiv.remove();
        }
    }, 5000);
}

/**
 * Mostrar estado de carga
 */
function showLoadingState(button) {
    button.classList.add('loading');
    button.disabled = true;
}

/**
 * Ocultar estado de carga
 */
function hideLoadingState(button) {
    button.classList.remove('loading');
    button.disabled = false;
}

/**
 * Mostrar estado de éxito
 */
function showSuccessState() {
    const form = document.querySelector('.reset-form');
    const card = document.querySelector('.reset-card');
    
    form.classList.add('success');
    
    // Mostrar mensaje de éxito
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.style.cssText = `
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
        border-radius: 8px;
        padding: 1rem;
        margin-top: 1rem;
        text-align: center;
        font-weight: 500;
    `;
    successMessage.innerHTML = `
        <strong>¡Correo enviado!</strong><br>
        Revise su bandeja de entrada y la carpeta de spam.
    `;
    
    form.appendChild(successMessage);
    
    // Actualizar botón
    const submitButton = document.querySelector('.btn-reset .btn-text');
    if (submitButton) {
        submitButton.textContent = 'Correo enviado ✓';
    }
    
    // Mostrar notificación
    PasswordReset.showNotification('Correo de recuperación enviado exitosamente', 'success');
}

/**
 * Mostrar estado de error
 */
function showErrorState(message) {
    const form = document.querySelector('.reset-form');
    form.classList.add('error');
    
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        border-radius: 8px;
        padding: 1rem;
        margin-top: 1rem;
        text-align: center;
    `;
    errorMessage.textContent = message;
    
    form.appendChild(errorMessage);
    
    // Remover mensaje después de 5 segundos
    setTimeout(() => {
        if (errorMessage.parentNode) {
            errorMessage.remove();
            form.classList.remove('error');
        }
    }, 5000);
}

/**
 * Navegación con teclado
 */
function initializeKeyboardNavigation() {
    const emailInput = document.querySelector('#id_email');
    const submitButton = document.querySelector('.btn-reset');
    
    if (emailInput) {
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (submitButton && !submitButton.disabled) {
                    submitButton.click();
                }
            }
        });
    }
}

/**
 * Mejorar UX del botón submit
 */
function enhanceSubmitButton() {
    const submitButton = document.querySelector('.btn-reset');
    
    if (submitButton) {
        // Efecto hover mejorado
        submitButton.addEventListener('mouseenter', function() {
            if (!this.disabled) {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 8px 20px rgba(0, 123, 255, 0.3)';
            }
        });
        
        submitButton.addEventListener('mouseleave', function() {
            if (!this.disabled) {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '';
            }
        });
    }
}

/**
 * Obtener token CSRF
 */
function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
}

/**
 * Módulo principal de Password Reset
 */
const PasswordReset = {
    /**
     * Mostrar notificación
     */
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `password-reset-notification ${type}`;
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
            font-family: 'Montserrat', sans-serif;
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
    },
    
    /**
     * Validar email específico
     */
    validateMilitaryEmail: function(email) {
        const militaryDomains = ['ejercito.mil.co', 'military.gov', 'mil.co'];
        return militaryDomains.some(domain => email.includes(domain));
    },
    
    /**
     * Reiniciar formulario
     */
    resetForm: function() {
        const form = document.querySelector('.reset-form');
        const emailInput = document.querySelector('#id_email');
        
        if (form) {
            form.classList.remove('success', 'error');
            form.reset();
        }
        
        if (emailInput) {
            clearFieldError(emailInput);
            emailInput.focus();
        }
        
        // Remover mensajes
        document.querySelectorAll('.success-message, .error-message').forEach(msg => msg.remove());
    }
};

// Exportar para uso global
window.PasswordReset = PasswordReset;