import os
import json
from django.conf import settings
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm
from django import forms
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


def home_redirect(request):
	"""Vista inteligente que redirije según el estado del usuario"""
	if not request.user.is_authenticated:
		return redirect('login')
	
	# Todos los usuarios autenticados van a la misma página principal (admin_home)
	return redirect('admin_home')


def _collect_carousel_images():
	images = []
	static_dir = os.path.join(settings.BASE_DIR, 'static', 'images', 'carrusel')
	if os.path.isdir(static_dir):
		# recorrer recursivamente para incluir archivos en subcarpetas
		for root, dirs, files in os.walk(static_dir):
			for name in sorted(files):
				if name.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg', '.tif', '.tiff', '.avif')):
					full_path = os.path.join(root, name)
					# calcular la ruta relativa desde static/images para construir la URL
					rel_path = os.path.relpath(full_path, os.path.join(settings.BASE_DIR, 'static'))
					# normalizar separadores a '/'
					rel_path = rel_path.replace('\\', '/')
					images.append(f"{settings.STATIC_URL}{rel_path}")
	return images


@login_required
def admin_home(request):
	carousel_images = _collect_carousel_images()
	return render(request, 'accounts/admin_home.html', {'carousel_images': carousel_images})


@login_required
def instructor_dashboard(request):
	carousel_images = _collect_carousel_images()
	return render(request, 'accounts/instructor_dashboard.html', {'carousel_images': carousel_images})


@login_required
def soldado_home(request):
	return render(request, 'accounts/soldado_home.html')


class AdminAuthorizedRegistrationForm(forms.Form):
	# Datos del nuevo usuario
	username = forms.CharField(
		max_length=150, 
		label="Nombre de usuario",
		widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Nombre de usuario'})
	)
	first_name = forms.CharField(
		max_length=30, 
		label="Nombre",
		widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Nombre'})
	)
	last_name = forms.CharField(
		max_length=30, 
		label="Apellido",
		widget=forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Apellido'})
	)
	email = forms.EmailField(
		label="Correo electrónico",
		widget=forms.EmailInput(attrs={'class': 'form-input', 'placeholder': 'correo@ejemplo.com'})
	)
	password1 = forms.CharField(
		widget=forms.PasswordInput(attrs={'class': 'form-input', 'placeholder': 'Contraseña'}),
		label="Contraseña"
	)
	password2 = forms.CharField(
		widget=forms.PasswordInput(attrs={'class': 'form-input', 'placeholder': 'Confirmar contraseña'}),
		label="Confirmar contraseña"
	)
	
	# Campos de autorización administrativa
	admin_username = forms.CharField(
		max_length=150, 
		label="Usuario administrador",
		widget=forms.TextInput(attrs={'class': 'form-input admin-field', 'placeholder': 'Usuario del administrador'})
	)
	admin_password = forms.CharField(
		widget=forms.PasswordInput(attrs={'class': 'form-input admin-field', 'placeholder': 'Contraseña del administrador'}),
		label="Contraseña del administrador"
	)

	def clean(self):
		cleaned_data = super().clean()
		password1 = cleaned_data.get("password1")
		password2 = cleaned_data.get("password2")
		admin_username = cleaned_data.get("admin_username")
		admin_password = cleaned_data.get("admin_password")

		# Verificar que las contraseñas coincidan
		if password1 and password2 and password1 != password2:
			raise forms.ValidationError("Las contraseñas no coinciden.")

		# Verificar que el administrador existe y las credenciales son correctas
		if admin_username and admin_password:
			admin_user = authenticate(username=admin_username, password=admin_password)
			if not admin_user:
				raise forms.ValidationError("Las credenciales del administrador son incorrectas.")
			if not admin_user.is_superuser and not admin_user.is_staff:
				raise forms.ValidationError("El usuario no tiene permisos de administrador.")
		
		# Verificar que el nombre de usuario no existe
		username = cleaned_data.get("username")
		if username and User.objects.filter(username=username).exists():
			raise forms.ValidationError("Este nombre de usuario ya existe.")

		return cleaned_data


def register(request):
	if request.method == 'POST':
		# Verificar si es una request AJAX
		if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.content_type == 'application/json':
			try:
				form = AdminAuthorizedRegistrationForm(request.POST)
				if form.is_valid():
					# Crear el nuevo usuario
					user = User.objects.create_user(
						username=form.cleaned_data['username'],
						email=form.cleaned_data['email'],
						password=form.cleaned_data['password1'],
						first_name=form.cleaned_data['first_name'],
						last_name=form.cleaned_data['last_name']
					)
					return JsonResponse({
						'success': True,
						'username': user.username,
						'email': user.email,
						'nombres': user.first_name,
						'apellidos': user.last_name,
						'message': f'Usuario {user.username} creado exitosamente.'
					})
				else:
					return JsonResponse({
						'success': False,
						'errors': form.errors,
						'error': 'Error en la validación del formulario.'
					})
			except Exception as e:
				return JsonResponse({
					'success': False,
					'error': str(e)
				})
		else:
			# Procesamiento normal (no AJAX)
			form = AdminAuthorizedRegistrationForm(request.POST)
			if form.is_valid():
				# Crear el nuevo usuario
				user = User.objects.create_user(
					username=form.cleaned_data['username'],
					email=form.cleaned_data['email'],
					password=form.cleaned_data['password1'],
					first_name=form.cleaned_data['first_name'],
					last_name=form.cleaned_data['last_name']
				)
				messages.success(request, f'Usuario {user.username} creado exitosamente. Puede iniciar sesión ahora.')
				return redirect('login')
	else:
		form = AdminAuthorizedRegistrationForm()
	return render(request, 'accounts/register.html', {'form': form})


def password_reset(request):
	# placeholder simple page
	return render(request, 'accounts/password_reset.html')


@csrf_exempt
def validate_admin(request):
	"""Vista para validar credenciales de administrador via AJAX"""
	if request.method == 'POST':
		try:
			data = json.loads(request.body)
			username = data.get('username')
			password = data.get('password')
			
			# Autenticar usuario
			user = authenticate(username=username, password=password)
			
			# Verificar que el usuario existe y es staff o superuser
			if user is not None and (user.is_staff or user.is_superuser):
				return JsonResponse({'valid': True})
			else:
				return JsonResponse({'valid': False})
		except Exception as e:
			return JsonResponse({'valid': False, 'error': str(e)})
	
	return JsonResponse({'valid': False})


def crear_usuarios(request):
	"""Vista inteligente para crear usuarios con validación de permisos"""
	
	# Verificar si el usuario está autenticado
	if request.user.is_authenticated:
		# Si es admin, permitir acceso directo sin modal
		if request.user.is_staff or request.user.is_superuser:
			# Procesar como un admin autenticado (sin modal)
			if request.method == 'POST':
				# Si es una solicitud AJAX de validación de admin
				if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
					try:
						data = json.loads(request.body)
						if data.get('action') == 'validate_admin':
							# Como ya es admin, retornar válido automáticamente
							return JsonResponse({'valid': True})
						else:
							# Procesamiento normal del formulario via AJAX
							form = AdminAuthorizedRegistrationForm(request.POST)
							if form.is_valid():
								user = User.objects.create_user(
									username=form.cleaned_data['username'],
									email=form.cleaned_data['email'],
									password=form.cleaned_data['password1'],
									first_name=form.cleaned_data['first_name'],
									last_name=form.cleaned_data['last_name']
								)
								return JsonResponse({
									'success': True, 
									'message': f'Usuario {user.username} creado exitosamente.',
									'username': user.username
								})
							else:
								return JsonResponse({'success': False, 'errors': form.errors})
					except Exception as e:
						return JsonResponse({'success': False, 'error': str(e)})
				else:
					# Procesamiento normal (no AJAX)
					form = AdminAuthorizedRegistrationForm(request.POST)
					if form.is_valid():
						user = User.objects.create_user(
							username=form.cleaned_data['username'],
							email=form.cleaned_data['email'],
							password=form.cleaned_data['password1'],
							first_name=form.cleaned_data['first_name'],
							last_name=form.cleaned_data['last_name']
						)
						messages.success(request, f'Usuario {user.username} creado exitosamente.')
						return redirect('crear_usuarios')
			else:
				form = AdminAuthorizedRegistrationForm()
			
			# Renderizar sin modal (admin ya autenticado)
			return render(request, 'accounts/crear_usuarios.html', {
				'form': form,
				'require_auth': False,
				'user_role': 'admin'
			})
		else:
			# Si es instructor/soldado, mostrar modal de autenticación
			return render(request, 'accounts/crear_usuarios.html', {
				'require_auth': True,
				'user_role': 'instructor_soldado'
			})
	else:
		# Si no está autenticado, mostrar modal de autenticación
		return render(request, 'accounts/crear_usuarios.html', {
			'require_auth': True,
			'user_role': 'anonymous'
		})
