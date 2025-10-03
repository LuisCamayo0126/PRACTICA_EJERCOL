import os
from django.conf import settings
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import redirect


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
	return render(request, 'accounts/instructor_dashboard.html')


@login_required
def soldado_home(request):
	return render(request, 'accounts/soldado_home.html')


def register(request):
	if request.method == 'POST':
		form = UserCreationForm(request.POST)
		if form.is_valid():
			form.save()
			return redirect('login')
	else:
		form = UserCreationForm()
	return render(request, 'accounts/register.html', { 'form': form })


def password_reset(request):
	# placeholder simple page
	return render(request, 'accounts/password_reset.html')
