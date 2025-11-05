/**
 * Login Page JavaScript Functionality - Archivo separado y específico
 * Maneja la funcionalidad específica de la página de login
 */

console.log('Login.js cargado correctamente - Archivo separado');

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del formulario
    const loginForm = document.querySelector('.login-form');
    const usernameField = document.getElementById('id_username');
    const passwordField = document.getElementById('id_password');
    const roleField = document.getElementById('id_role');
    const rememberField = document.getElementById('id_remember');
    const loginButton = document.querySelector('.btn-login');

    // Inicializar funcionalidades
    initializeFormValidation();
    initializeFormEnhancements();
    initializeAccessibility();

    /**
     * Inicializa la validación del formulario
     */
    function initializeFormValidation() {
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                if (!validateForm()) {
                    e.preventDefault();
                    return false;
                }
            });
        }
    }

    /**
     * Valida que todos los campos requeridos estén completos
     */
    function validateForm() {
        let isValid = true;
        const requiredFields = [usernameField, passwordField, roleField];

        requiredFields.forEach(field => {
            if (field && (!field.value || field.value.trim() === '')) {
                showFieldError(field, 'Este campo es requerido');
                isValid = false;
            } else {
                clearFieldError(field);
            }
        });

        return isValid;
    }

    /**
     * Muestra un error en un campo específico
     */
    function showFieldError(field, message) {
        clearFieldError(field);
        field.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    /**
     * Limpia el error de un campo específico
     */
    function clearFieldError(field) {
        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Inicializa mejoras del formulario
     */
    function initializeFormEnhancements() {
        // Enfoque automático en el primer campo
        if (usernameField) {
            usernameField.focus();
        }

        // Limpiar errores cuando el usuario empiece a escribir
        [usernameField, passwordField, roleField].forEach(field => {
            if (field) {
                field.addEventListener('input', function() {
                    clearFieldError(this);
                });
            }
        });

        // Enter en campos avanza al siguiente o envía el formulario
        if (usernameField) {
            usernameField.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && passwordField) {
                    e.preventDefault();
                    passwordField.focus();
                }
            });
        }

        if (passwordField) {
            passwordField.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && roleField) {
                    e.preventDefault();
                    roleField.focus();
                }
            });
        }

        if (roleField) {
            roleField.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && loginForm) {
                    e.preventDefault();
                    loginForm.submit();
                }
            });
        }

        // Animación del botón de login
        if (loginButton) {
            loginButton.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-6px) scale(1.02)';
            });

            loginButton.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        }

        // Recordar última selección de rol (opcional)
        if (roleField && localStorage.getItem('lastRole')) {
            roleField.value = localStorage.getItem('lastRole');
        }

        if (roleField) {
            roleField.addEventListener('change', function() {
                localStorage.setItem('lastRole', this.value);
            });
        }
    }

    /**
     * Inicializa mejoras de accesibilidad
     */
    function initializeAccessibility() {
        // Asegurar que los labels estén correctamente asociados
        const fields = document.querySelectorAll('.login-form input, .login-form select');
        fields.forEach(field => {
            const label = field.parentNode.querySelector('label');
            if (label && !label.getAttribute('for')) {
                label.setAttribute('for', field.id);
            }
        });

        // Añadir atributos ARIA para mejor accesibilidad
        if (loginForm) {
            loginForm.setAttribute('novalidate', 'true'); // Usamos validación custom
        }

        // Indicar campos requeridos
        [usernameField, passwordField, roleField].forEach(field => {
            if (field) {
                field.setAttribute('aria-required', 'true');
            }
        });
    }

    /**
     * Mostrar/ocultar contraseña (funcionalidad extensible)
     */
    function togglePasswordVisibility() {
        if (passwordField) {
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);
        }
    }

    /**
     * Limpiar el formulario
     */
    function clearForm() {
        if (loginForm) {
            loginForm.reset();
            // Limpiar errores
            document.querySelectorAll('.field-error').forEach(error => error.remove());
            document.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
        }
    }

    // Exportar funciones para uso externo si es necesario
    window.LoginModule = {
        clearForm: clearForm,
        togglePasswordVisibility: togglePasswordVisibility,
        validateForm: validateForm
    };
});

// CSS dinámico para errores (se inyecta si no existe)
if (!document.querySelector('#login-error-styles')) {
    const style = document.createElement('style');
    style.id = 'login-error-styles';
    style.textContent = `
        .login-form .error {
            border-color: #dc3545 !important;
            box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
        }
        .field-error {
            color: #dc3545;
            font-size: 12px;
            margin-top: 4px;
            display: block;
        }
    `;
    document.head.appendChild(style);
}