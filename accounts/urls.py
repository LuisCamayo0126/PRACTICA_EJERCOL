from django.urls import path
from django.contrib.auth import views as auth_views
from .views_login import RoleLoginView
from . import views

app_name = "accounts"

urlpatterns = [
    path("login/", RoleLoginView.as_view(), name="login"),
    path("logout/", auth_views.LogoutView.as_view(next_page='login'), name="logout"),

    path("admin/", views.admin_home, name="admin_home"),
    path("dashboard/", views.instructor_dashboard, name="instructor_dashboard"),
    path("", views.soldado_home, name="soldado_home"),
    path("register/", views.register, name="register"),
    path("crear-usuarios/", views.crear_usuarios, name="crear_usuarios"),
    path("crear-cursos/", views.crear_cursos, name="crear_cursos"),
    path("validate-admin/", views.validate_admin, name="validate_admin"),
    path("password-reset/", views.password_reset, name="password_reset"),

    # Tercera División
    path("tercedivi/excel/", views.tercedivi_excel, name="tercedivi_excel"),
    path("brigadas/", views.brigadas, name="brigadas"),

    # Navegación jerárquica
    path("batallones/", views.batallones, name="batallones"),
    path("companias/", views.companias, name="companias"),
    path("pelotones/", views.pelotones, name="pelotones"),
    path("export/peloton-csv/", views.export_peloton_csv, name="export_peloton_csv"),
]
