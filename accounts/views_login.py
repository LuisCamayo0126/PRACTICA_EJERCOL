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

        role = (self.request.POST.get("role") or "").lower()
        if role not in ROLE_CHOICES:
            role = "soldado"
        self.request.session["role_selected"] = role
        return super().form_valid(form)

    def get_success_url(self):
        # Todos los roles van a la misma página principal (admin_home)
        # El rol se mantiene en la sesión para otros usos pero todos ven la misma interfaz
        return reverse('admin_home')
