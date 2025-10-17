from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from accounts.views import home_redirect

urlpatterns = [
    path("admin/", admin.site.urls),
    path("accounts/", include("accounts.urls")),
    path("", home_redirect, name="home"),  # 👈 vista inteligente de redirección
]
