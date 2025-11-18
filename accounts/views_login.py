from django.conf import settings
from django.contrib.auth.views import LoginView
from django.urls import reverse
 

ALLOWED_EMAIL_DOMAIN = getattr(settings, "ALLOWED_EMAIL_DOMAIN", "ejercito.mil.co")
ROLE_CHOICES = {"admin", "instructor", "soldado"}

class RoleLoginView(LoginView):
    template_name = "registration/login.html"
    redirect_authenticated_user = True

    def form_valid(self, form):
        username = (form.cleaned_data.get("username") or "").strip()
        if "@" in username:
            local, domain = username.split("@", 1)
            if domain.lower() != ALLOWED_EMAIL_DOMAIN.lower():
                form.add_error("username", f"El correo debe ser del dominio @{ALLOWED_EMAIL_DOMAIN}.")
                return self.form_invalid(form)

        # Determine requested role (default to 'soldado')
        role = (self.request.POST.get("role") or "").lower()
        if role not in ROLE_CHOICES:
            role = "soldado"

        # Ensure the authenticated user's stored role is respected.
        # form.get_user() returns the authenticated user object.
        user = form.get_user()
        if user is not None:
            # If the user account is admin/staff, they MUST login as admin
            if (user.is_staff or user.is_superuser) and role != 'admin':
                form.add_error(None, "Este usuario está registrado como administrador y debe ingresar con el rol 'admin'.")
                return self.form_invalid(form)
            # If the user selected admin role but account is not admin, deny
            if role == 'admin' and not (user.is_staff or user.is_superuser):
                form.add_error(None, "No tienes permisos administrativos para ingresar como 'admin'.")
                return self.form_invalid(form)

        # Persist selected role in session
        self.request.session["role_selected"] = role
        return super().form_valid(form)

    def get_success_url(self):
        # Redirigir según el rol seleccionado en sesión.
        # admin -> admin_home, instructor -> admin_home (instructors use admin interface), soldado -> soldado_home
        role = self.request.session.get('role_selected', 'soldado')
        if role == 'admin':
            return reverse('accounts:admin_home')
        if role == 'instructor':
            # Instructors should access admin_home per requirements
            return reverse('accounts:admin_home')
        # Default: soldado — redirect to admin_home per new requirement
        return reverse('accounts:admin_home')
