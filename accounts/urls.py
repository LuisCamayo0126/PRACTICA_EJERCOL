from django.urls import path, reverse_lazy
from django.contrib.auth import views as auth_views
from .views_login import RoleLoginView
from . import views

app_name = "accounts"

urlpatterns = [
    path("login/", RoleLoginView.as_view(), name="login"),
    # Ensure logout redirects immediately to the app's login page
    path("logout/", auth_views.LogoutView.as_view(next_page=reverse_lazy('accounts:login')), name="logout"),

    path("admin/", views.admin_home, name="admin_home"),
    path("dashboard/", views.instructor_dashboard, name="instructor_dashboard"),
    path("", views.soldado_home, name="soldado_home"),
    # Rutas Soldado
    path("soldado/cursos/", views.cursos, name="cursos"),
    path("soldado/evaluacion-instructores/", views.evaluacion_instructores, name="evaluacion_instructores"),
    path("register/", views.register, name="register"),
    path("crear-usuarios/", views.crear_usuarios, name="crear_usuarios"),
    # Endpoint para procesamiento masivo desde JS (JSON)
    path("crear-usuarios-bulk/", views.crear_usuarios_bulk, name="crear_usuarios_bulk"),
    path("crear-usuarios-credentials-pdf/", views.crear_usuarios_credentials_pdf, name="crear_usuarios_credentials_pdf"),
    path("crear-cursos/", views.crear_cursos, name="crear_cursos"),
    path("set-role/<str:role>/", views.set_role, name="set_role"),
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
    path("calificacion-soldados/", views.calificacion_soldados, name="calificacion_soldados"),
    path("boletines/download/", views.boletines_download, name="boletines_download"),
    # API endpoints for asistencia (AJAX)
    path("api/asistencia/", views.api_get_asistencia, name="api_get_asistencia"),
    path("api/asistencia/save/", views.api_save_asistencia, name="api_save_asistencia"),
    path("formularios/", views.formularios, name="formularios"),
    # Grupos de usuarios (lista + descarga CSV)
    path("grupos-usuarios/", views.grupos_usuarios, name="grupos_usuarios"),
    path("grupos-download/<str:role>/", views.grupos_download, name="grupos_download"),
]
