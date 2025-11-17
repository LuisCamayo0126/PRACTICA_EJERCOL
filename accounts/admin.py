from django.contrib import admin
from .models import Formulario, Pregunta, Opcion


class OpcionInline(admin.TabularInline):
    model = Opcion
    extra = 1
    fields = ('text', 'orden')


class PreguntaInline(admin.StackedInline):
    model = Pregunta
    extra = 1
    fields = ('text', 'tipo', 'required', 'orden')
    show_change_link = True


@admin.register(Formulario)
class FormularioAdmin(admin.ModelAdmin):
    list_display = ('title', 'role', 'estado', 'created_by', 'created_at')
    list_filter = ('estado', 'role')
    search_fields = ('title', 'role')
    date_hierarchy = 'created_at'
    inlines = [PreguntaInline]


@admin.register(Pregunta)
class PreguntaAdmin(admin.ModelAdmin):
    list_display = ('text', 'tipo', 'formulario', 'required', 'orden')
    list_filter = ('tipo', 'required')
    search_fields = ('text',)
    inlines = [OpcionInline]


@admin.register(Opcion)
class OpcionAdmin(admin.ModelAdmin):
    list_display = ('text', 'pregunta', 'orden')
    search_fields = ('text',)
from django.contrib import admin

# Register your models here.
