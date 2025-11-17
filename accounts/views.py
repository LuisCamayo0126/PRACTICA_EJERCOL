import os
import json
from django.conf import settings
from django.shortcuts import render, redirect
from .utils import image_mapper
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm
from django import forms
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
import csv
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.db.models import Q
import secrets
import unicodedata
from io import BytesIO
import unicodedata as _unic
try:
	from reportlab.lib.pagesizes import letter
	from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
	from reportlab.lib import colors
	from reportlab.lib.styles import getSampleStyleSheet
	_REPORTLAB_AVAILABLE = True
except Exception:
	_REPORTLAB_AVAILABLE = False


def home_redirect(request):
	"""Vista inteligente que redirije según el estado del usuario"""
	if not request.user.is_authenticated:
		# `login` está definido en el namespace `accounts` (accounts:login)
		return redirect('accounts:login')
	
	# Todos los usuarios autenticados van a la misma página principal (admin_home)
	return redirect('accounts:admin_home')


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
def brigadas(request):
	"""Vista principal de brigadas (alias más claro para Tercera División)."""
	return render(request, 'tercera_division/brigadas.html')


@login_required
def tercedivi_excel(request):
	"""Vista para la gestión de archivos Excel de TERCEDIVI"""
	return render(request, 'accounts/tercedivi_excel.html')


def _normalize_text(s: str) -> str:
	s = s or ''
	s = ' '.join(str(s).split())
	s = _unic.normalize('NFKD', s)
	s = ''.join(ch for ch in s if not _unic.combining(ch))
	return s.strip()

def _csv_path():
	return os.path.join(settings.BASE_DIR, 'static', 'images', 'tercedivi', 'terdivexc', 'FORMATO PRESENTACION.csv')

def _load_estructura():
	"""Carga el CSV de estructura (DIVISION;BRIGADA;BATALLÓN;COMPAÑÍA) y devuelve lista de dicts."""
	rows = []
	path = _csv_path()
	if not os.path.exists(path):
		return rows
	import csv as _csv
	with open(path, 'r', encoding='utf-8-sig', newline='') as f:
		reader = _csv.DictReader(f, delimiter=';')
		for r in reader:
			# Normalizar campos y colapsar saltos de línea en BATALLÓN
			div = _normalize_text(r.get('DIVISION', ''))
			bri = _normalize_text(r.get('BRIGADA', ''))
			bat = _normalize_text(r.get('BATALLÓN', r.get('BATALLON', '')))
			com = _normalize_text(r.get('COMPAÑÍA', r.get('COMPANIA', '')))
			if bri and bat:
				rows.append({'division': div, 'brigada': bri, 'batallon': bat, 'compania': com})
	return rows

def _match_key(s: str) -> str:
	"""Clave canónica para comparar (mayúsculas sin tildes/espacios extra)."""
	s = _normalize_text(s).upper()
	return s

def _canonical_brigada_name(s: str) -> str:
	"""Normaliza nombres de brigada y unifica alias.
	Ejemplos: "FUERZA DE DESPLIEGUE RAPIDO N° 2" -> "FUDRA 2"
			  "FUERZA DE DESPLIEGUE RAPIDO No 4" -> "FUDRA 4"
	El resto retorna la clave en mayúsculas sin tildes.
	"""
	k = _match_key(s)
	if 'FUERZA DE DESPLIEGUE RAPIDO' in k:
		nums = _extract_numbers(k)
		if '2' in nums:
			return 'FUDRA 2'
		if '4' in nums:
			return 'FUDRA 4'
	if 'FUDRA 2' in k:
		return 'FUDRA 2'
	if 'FUDRA 4' in k:
		return 'FUDRA 4'
	return k

def _brigada_to_folder(brigada: str) -> str | None:
	key = _canonical_brigada_name(brigada)
	# Mapeos explícitos (claves normalizadas esperadas)
	mapping = {
		'TERCERA BRIGADA': 'BATALLONES_BRIGADA_3',
		'BRIGADA 3': 'BATALLONES_BRIGADA_3',
		'VIGESIMA NOVENA BRIGADA': 'BATALLONES_BRIGADA_29',
		'BRIGADA 29': 'BATALLONES_BRIGADA_29',
		'VIGESIMA TERCERA BRIGADA': 'BATALLONES_BRIGRADA_23',
		'BRIGADA 23': 'BATALLONES_BRIGRADA_23',
		'FUDRA 2': 'BATALLONES_FUDRA_2',
		'FUDRA 4': 'BATALLONES_FUDRA_4',
		'FUERZA DE TAREA HERCULES': 'BATALLONES_FUERZA_DE_TAREA_HERCULES',
	}
	# Primero intentar mapeo directo
	if key in mapping:
		return mapping.get(key)

	# Heurística: buscar por número en el nombre (p.ej. '3', '29', '23')
	nums = _extract_numbers(brigada)
	base = os.path.join(settings.BASE_DIR, 'static', 'images', 'tercedivi')
	try:
		candidates = [d for d in os.listdir(base) if os.path.isdir(os.path.join(base, d))]
	except Exception:
		candidates = []

	# Si hay números, priorizar carpetas que contengan ese número
	for n in nums:
		for d in candidates:
			if n in d:
				return d

	# Intentar buscar coincidencias por fragmentos de palabras (excluyendo 'BRIGADA')
	fragments = [w for w in key.split() if w and w not in ('BRIGADA', 'BRIG', 'THE')]
	if fragments:
		for d in candidates:
			du = d.upper()
			if all(f in du for f in fragments):
				return d

	# Fallbacks simples: nombre corto que contenga el número '3' o '29' etc.
	short_map = {
		'3': 'BATALLONES_BRIGADA_3',
		'29': 'BATALLONES_BRIGADA_29',
		'23': 'BATALLONES_BRIGRADA_23',
	}
	for n in nums:
		if n in short_map:
			return short_map[n]

	return None

def _first_icon_for_brigada(brigada: str) -> str | None:
	folder = _brigada_to_folder(brigada)
	if not folder:
		return None
	base = os.path.join(settings.BASE_DIR, 'static', 'images', 'tercedivi', folder)
	if not os.path.isdir(base):
		return None
	for name in sorted(os.listdir(base)):
		if name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg')):
			rel = f"images/tercedivi/{folder}/{name}"
			return settings.STATIC_URL.rstrip('/') + '/' + rel
	return None

def _icons_for_brigada(brigada: str, limit: int = 2) -> list[str]:
	"""Devuelve hasta `limit` URLs de íconos encontrados en la carpeta de la brigada."""
	folder = _brigada_to_folder(brigada)
	if not folder:
		return []
	base = os.path.join(settings.BASE_DIR, 'static', 'images', 'tercedivi', folder)
	if not os.path.isdir(base):
		return []
	urls: list[str] = []
	for name in sorted(os.listdir(base)):
		if name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg')):
			rel = f"images/tercedivi/{folder}/{name}"
			urls.append(settings.STATIC_URL.rstrip('/') + '/' + rel)
			if len(urls) >= limit:
				break
	return urls

def _extract_numbers(text: str) -> list[str]:
	import re
	return re.findall(r"\d+", text or "")

def _icon_for_batallon(brigada: str, batallon: str) -> str | None:
	"""Intenta encontrar un ícono específico para el batallón dentro de la carpeta de su brigada.
	Heurística: buscar por números dentro del nombre del batallón (p.ej. 10, 8, 3, 53...).
	Si no encuentra coincidencias, retorna el primero disponible.
	"""
	folder = _brigada_to_folder(brigada)
	if not folder:
		return None
 
	base = os.path.join(settings.BASE_DIR, 'static', 'images', 'tercedivi', folder)
	if not os.path.isdir(base):
		return None
	# 1) Mapeos explícitos por nombre (más específicos que la heurística)
	key = _match_key(batallon)
	nums = _extract_numbers(batallon)
	def file_url(fname: str) -> str | None:
		path = os.path.join(base, fname)
		if os.path.exists(path):
			rel = f"images/tercedivi/{folder}/{fname}"
			return settings.STATIC_URL.rstrip('/') + '/' + rel
		return None

	# BIVEN -> BIVEN23.png
	if 'BIVEN' in key:
		url = file_url('BIVEN23.png')
		if url:
			return url
	# Batallón de Ingenieros de Combate No. 3 Coronel "AGUSTIN CODAZZI" -> BICOD3.png
	if 'INGENIEROS' in key and 'CODAZZI' in key:
		url = file_url('BICOD3.png')
		if url:
			return url
	# Batallón de Policía Militar No. 3 General "EUSEBIO BORRERO ACOSTA" -> BAPOM3.png
	if 'POLICIA' in key and 'MILITAR' in key:
		url = file_url('BAPOM3.png')
		if url:
			return url
	# Batallón de Montaña No. 3 "RODRIGO LLOREDA CAICEDO" -> BAMRO#.png (# = primer número encontrado, por defecto 3)
	if ('MONTANA' in key or 'MONTAÑA' in key) and 'RODRIGO' in key:
		n = (nums[0] if nums else '3')
		url = file_url(f'BAMRO{n}.png')
		if url:
			return url
	# Batallón de Artillería de Campaña No. 3 "BATALLA DE PALACE" -> BAACA#.png (usa primer número; por defecto 3)
	if 'ARTILLERIA' in key and 'CAMPANA' in key:
		n = (nums[0] if nums else '3')
		url = file_url(f'BAACA{n}.png')
		if url:
			return url
	candidates = sorted(os.listdir(base))
	# Priorizar por coincidencia de números
	for n in nums:
		for name in candidates:
			low = name.lower()
			if n in low and low.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg')):
				rel = f"images/tercedivi/{folder}/{name}"
				return settings.STATIC_URL.rstrip('/') + '/' + rel
	# Fallback: primero disponible
	for name in candidates:
		if name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg')):
			rel = f"images/tercedivi/{folder}/{name}"
			return settings.STATIC_URL.rstrip('/') + '/' + rel
	return None


@login_required
def formularios(request):
	"""Página principal de formularios (lista + constructor)."""
	from .models import Formulario
	forms = Formulario.objects.all().order_by('-created_at')
	return render(request, 'formularios/formularios.html', {'formularios': forms})


@login_required
def guardar_formulario(request):
	"""Guardar o actualizar un formulario enviado desde el constructor (JSON).

	Si el payload incluye `form_id` se intentará actualizar el formulario existente,
	eliminando preguntas previas y recreándolas. Si no, crea uno nuevo.
	"""
	if request.method != 'POST':
		return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)

	try:
		payload = json.loads(request.body.decode('utf-8'))
	except Exception:
		return JsonResponse({'success': False, 'error': 'JSON inválido'}, status=400)

	form_id = payload.get('form_id')
	title = payload.get('title') or 'Sin título'
	role = payload.get('role') or ''
	estado = bool(payload.get('estado', True))
	questions = payload.get('questions', []) or []

	if not isinstance(questions, list):
		return JsonResponse({'success': False, 'error': 'questions debe ser una lista'}, status=400)

	from .models import Formulario, Pregunta, Opcion

	try:
		with transaction.atomic():
			if form_id:
				# intentar actualizar
				try:
					form = Formulario.objects.get(id=form_id)
				except Formulario.DoesNotExist:
					return JsonResponse({'success': False, 'error': 'Formulario no encontrado'}, status=404)
				# simple autorización: sólo el creador o staff puede actualizar
				if hasattr(form, 'created_by') and form.created_by and form.created_by != request.user and not request.user.is_staff:
					return JsonResponse({'success': False, 'error': 'No autorizado para editar'}, status=403)
				# actualizar metadatos
				form.title = title
				form.role = role
				form.estado = estado
				form.save()
				# eliminar preguntas previas (y sus opciones)
				Pregunta.objects.filter(formulario=form).delete()
			else:
				form = Formulario.objects.create(title=title, role=role, estado=estado, created_by=request.user)

			for idx, q in enumerate(questions, start=1):
				text = (q.get('text') or '').strip()
				tipo = q.get('type') or q.get('tipo') or ''
				required = bool(q.get('required', False))
				if not text:
					continue
				pregunta = Pregunta.objects.create(formulario=form, text=text, tipo=tipo or 'texto', required=required, orden=idx)
				opts = q.get('options') or q.get('opciones') or []
				if isinstance(opts, list):
					for j, otext in enumerate(opts, start=1):
						if otext and str(otext).strip():
							Opcion.objects.create(pregunta=pregunta, text=str(otext).strip(), orden=j)

		return JsonResponse({'success': True, 'form_id': form.id})
	except Exception as e:
		return JsonResponse({'success': False, 'error': str(e)}, status=500)


@login_required
def get_formulario_json(request, form_id):
	"""Devuelve un formulario con sus preguntas y opciones en formato JSON."""
	from .models import Formulario, Pregunta, Opcion
	try:
		form = Formulario.objects.get(id=form_id)
	except Formulario.DoesNotExist:
		return JsonResponse({'success': False, 'error': 'Formulario no encontrado'}, status=404)

	# autorización básica: si quiere ajustarla, puede añadir más reglas
	if hasattr(form, 'created_by') and form.created_by and form.created_by != request.user and not request.user.is_staff:
		return JsonResponse({'success': False, 'error': 'No autorizado'}, status=403)

	questions = []
	for p in Pregunta.objects.filter(formulario=form).order_by('orden'):
		opts = [o.text for o in Opcion.objects.filter(pregunta=p).order_by('orden')]
		questions.append({'text': p.text, 'type': p.tipo, 'required': p.required, 'options': opts})

	return JsonResponse({'success': True, 'form': {'id': form.id, 'title': form.title, 'role': form.role, 'estado': form.estado, 'questions': questions}})


@login_required
def eliminar_formulario(request):
	"""Eliminar un formulario. Espera POST JSON con {'form_id': id} o form_id en POST form-data."""
	if request.method != 'POST':
		return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)

	try:
		payload = json.loads(request.body.decode('utf-8'))
	except Exception:
		payload = {}

	form_id = payload.get('form_id') or request.POST.get('form_id')
	if not form_id:
		return JsonResponse({'success': False, 'error': 'form_id requerido'}, status=400)

	from .models import Formulario
	try:
		form = Formulario.objects.get(id=form_id)
	except Formulario.DoesNotExist:
		return JsonResponse({'success': False, 'error': 'Formulario no encontrado'}, status=404)

	if hasattr(form, 'created_by') and form.created_by and form.created_by != request.user and not request.user.is_staff:
		return JsonResponse({'success': False, 'error': 'No autorizado'}, status=403)

	# eliminamos completamente
	form.delete()
	return JsonResponse({'success': True})


@login_required
def grupos_usuarios(request):
	"""Vista que muestra los grupos y usuarios: administradores, instructores y soldados."""
	from django.contrib.auth.models import User, Group

	# Administradores: staff o superuser
	admins = User.objects.filter(is_active=True).filter(Q(is_staff=True) | Q(is_superuser=True)).order_by('last_name', 'first_name')

	# Instructores: usuarios que pertenecen al Group named 'Instructor'
	try:
		instructor_group = Group.objects.get(name__iexact='Instructor')
		instructors = User.objects.filter(groups=instructor_group, is_active=True).order_by('last_name', 'first_name')
	except Group.DoesNotExist:
		instructors = User.objects.none()

	# Soldados: usuarios no staff and not in instructor group
	if instructors.exists():
		soldados = User.objects.filter(is_active=True).exclude(Q(is_staff=True) | Q(groups__name__iexact='Instructor')).order_by('last_name', 'first_name')
	else:
		soldados = User.objects.filter(is_active=True).exclude(is_staff=True).order_by('last_name', 'first_name')

	def _to_row(u):
		prof = getattr(u, 'profile', None)
		telefono = ''
		try:
			telefono = getattr(prof, 'telefono', '') or ''
		except Exception:
			telefono = ''
		return {'first_name': u.first_name, 'last_name': u.last_name, 'email': u.email, 'telefono': telefono}

	admins_list = [_to_row(u) for u in admins]
	instr_list = [_to_row(u) for u in instructors]
	soldados_list = [_to_row(u) for u in soldados]

	return render(request, 'grupos_usuarios/grupos_usuarios.html', {'admins': admins_list, 'instructors': instr_list, 'soldados': soldados_list})


@login_required
def grupos_usuarios_json(request):
	"""Devuelve JSON con arrays: admins, instructors, soldados"""
	from django.contrib.auth.models import User, Group

	admins_qs = User.objects.filter(is_active=True).filter(Q(is_staff=True) | Q(is_superuser=True)).order_by('last_name', 'first_name')
	try:
		instructor_group = Group.objects.get(name__iexact='Instructor')
		instructors_qs = User.objects.filter(groups=instructor_group, is_active=True).order_by('last_name', 'first_name')
	except Group.DoesNotExist:
		instructors_qs = User.objects.none()

	if instructors_qs.exists():
		soldados_qs = User.objects.filter(is_active=True).exclude(Q(is_staff=True) | Q(groups__name__iexact='Instructor')).order_by('last_name', 'first_name')
	else:
		soldados_qs = User.objects.filter(is_active=True).exclude(is_staff=True).order_by('last_name', 'first_name')

	def _to_row(u):
		prof = getattr(u, 'profile', None)
		telefono = ''
		try:
			telefono = getattr(prof, 'telefono', '') or ''
		except Exception:
			telefono = ''
		return {'first_name': u.first_name or '', 'last_name': u.last_name or '', 'email': u.email or '', 'telefono': telefono}

	data = {
		'admins': [_to_row(u) for u in admins_qs],
		'instructors': [_to_row(u) for u in instructors_qs],
		'soldados': [_to_row(u) for u in soldados_qs],
	}
	return JsonResponse({'success': True, 'data': data})


@login_required
def grupos_download(request, group: str):
	"""Genera y descarga un PDF con la lista de usuarios del grupo solicitado.
	`group` puede ser: 'admins', 'instructors', 'soldados'.
	"""
	from django.contrib.auth.models import User, Group

	# Determinar queryset según el parámetro
	if group == 'admins':
		qs = User.objects.filter(is_active=True).filter(Q(is_staff=True) | Q(is_superuser=True)).order_by('last_name', 'first_name')
		title = 'Administradores'
		filename = 'administradores.pdf'
	elif group == 'instructors':
		try:
			instructor_group = Group.objects.get(name__iexact='Instructor')
			qs = User.objects.filter(groups=instructor_group, is_active=True).order_by('last_name', 'first_name')
		except Group.DoesNotExist:
			qs = User.objects.none()
		title = 'Instructores'
		filename = 'instructores.pdf'
	elif group == 'soldados':
		try:
			instructor_group = Group.objects.get(name__iexact='Instructor')
			instructors_exist = User.objects.filter(groups=instructor_group, is_active=True).exists()
		except Group.DoesNotExist:
			instructors_exist = False
		if instructors_exist:
			qs = User.objects.filter(is_active=True).exclude(Q(is_staff=True) | Q(groups__name__iexact='Instructor')).order_by('last_name', 'first_name')
		else:
			qs = User.objects.filter(is_active=True).exclude(is_staff=True).order_by('last_name', 'first_name')
		title = 'Soldados'
		filename = 'soldados.pdf'
	else:
		return redirect('accounts:grupos_usuarios')

	# Preparar filas: encabezado + datos
	rows = [['APELLIDO', 'NOMBRE', 'EMAIL', 'TELEFONO']]
	for u in qs:
		prof = getattr(u, 'profile', None)
		telefono = ''
		try:
			telefono = getattr(prof, 'telefono', '') or ''
		except Exception:
			telefono = ''
		rows.append([u.last_name or '', u.first_name or '', u.email or '', telefono])

	# Intentar importar reportlab en tiempo de ejecución (evita depender de la variable global)
	try:
		from reportlab.lib.pagesizes import letter
		from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
		from reportlab.lib import colors as rl_colors
		from reportlab.lib.styles import getSampleStyleSheet
		REPORTLAB_AVAILABLE = True
	except Exception:
		REPORTLAB_AVAILABLE = False

	if not REPORTLAB_AVAILABLE:
		# Fallback: informar que PDF no está disponible y devolver TXT con la lista
		text = title + '\n\n'
		for r in rows[1:]:
			text += f"{r[0]}\t{r[1]}\t{r[2]}\t{r[3]}\n"
		resp = HttpResponse(text, content_type='text/plain; charset=utf-8')
		resp['Content-Disposition'] = f'attachment; filename="{filename.replace(".pdf", ".txt")}"'
		return resp

	# Generar PDF en memoria
	buffer = BytesIO()
	doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=18)
	elements = []
	styles = getSampleStyleSheet()
	title_style = styles.get('Title', styles['Heading1'])
	title_style.alignment = 1
	elements.append(Paragraph(title, title_style))
	elements.append(Spacer(1, 12))

	# Tabla
	table = Table(rows, repeatRows=1, hAlign='LEFT')
	tbl_style = TableStyle([
		('BACKGROUND', (0,0), (-1,0), rl_colors.HexColor('#124638')),
		('TEXTCOLOR', (0,0), (-1,0), rl_colors.HexColor('#ffffff')),
		('ALIGN', (0,0), (-1,-1), 'LEFT'),
		('GRID', (0,0), (-1,-1), 0.25, rl_colors.HexColor('#dddddd')),
		('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
		('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
		('FONTSIZE', (0,0), (-1,0), 11),
		('FONTSIZE', (0,1), (-1,-1), 10),
		('BOTTOMPADDING', (0,0), (-1,0), 8),
		('TOPPADDING', (0,0), (-1,0), 6),
	])
	table.setStyle(tbl_style)
	elements.append(table)

	doc.build(elements)
	pdf = buffer.getvalue()
	buffer.close()

	response = HttpResponse(pdf, content_type='application/pdf')
	response['Content-Disposition'] = f'attachment; filename="{filename}"'
	return response

@login_required
def batallones(request):
	"""Lista de batallones para una brigada (usa batallon.html)."""
	brigada = _normalize_text(request.GET.get('brigada') or '')
	data = _load_estructura()
	# Unificar alias de brigada en comparación (FUDRA 2/4)
	canon_input = _canonical_brigada_name(brigada)
	batallones = sorted({row['batallon'] for row in data if _canonical_brigada_name(row['brigada']) == canon_input})
	items = []
	for b in batallones:
		icon = _icon_for_batallon(brigada, b) or _first_icon_for_brigada(brigada)
		items.append({'name': b, 'icon': icon})

	# Obtener hasta dos emblemas desde la carpeta de la brigada (si existen)
	icons = _icons_for_brigada(brigada, limit=2)
	emblem_left = icons[0] if len(icons) > 0 else None
	emblem_right = icons[1] if len(icons) > 1 else None

	# Imagen principal de la brigada (primer ícono disponible en su carpeta)
	brigada_main = _first_icon_for_brigada(brigada)

	# Preferir el mapeo explícito en `accounts.utils.image_mapper` (ICONOS_BRIGADAS),
	# luego emblem_left y finalmente brigada_main.
	try:
		mapped = image_mapper(brigada)
	except Exception:
		mapped = None
	brigada_icon = mapped or emblem_left or brigada_main

	context = {
		'brigada': brigada,
		'batallones': items,
		'emblem_left': emblem_left,
		'emblem_right': emblem_right,
		'brigada_main': brigada_main,
		'brigada_icon': brigada_icon,
	}

	return render(request, 'tercera_division/batallon.html', context)

@login_required
def companias(request):
	"""Lista de compañías para un batallón específico."""
	brigada = _normalize_text(request.GET.get('brigada') or '')
	batallon = _normalize_text(request.GET.get('batallon') or '')
	data = _load_estructura()
	canon_bri = _canonical_brigada_name(brigada)
	companias = sorted({row['compania'] for row in data if _canonical_brigada_name(row['brigada']) == canon_bri and _match_key(row['batallon']) == _match_key(batallon) and row['compania']})
	# Obtener hasta dos emblemas desde la carpeta de la brigada (si existen)
	icons = _icons_for_brigada(brigada, limit=2)
	emblem_left = icons[0] if len(icons) > 0 else None
	emblem_right = icons[1] if len(icons) > 1 else None

	# Imagen principal de la brigada (primer ícono disponible en su carpeta)
	brigada_main = _first_icon_for_brigada(brigada)

	# Buscar logo central en CARD_BRIGADAS (si existe) con fallback al brigada_main
	center_icon = None
	card_folder = os.path.join(settings.BASE_DIR, 'static', 'images', 'tercedivi', 'CARD_BRIGADAS')
	key = _match_key(brigada)
	if os.path.isdir(card_folder):
		for fname in sorted(os.listdir(card_folder)):
			if fname.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg')):
				if key and key.replace(' ', '') in fname.upper().replace(' ', ''):
					center_icon = settings.STATIC_URL.rstrip('/') + '/images/tercedivi/CARD_BRIGADAS/' + fname
					break
		if not center_icon:
			for fname in sorted(os.listdir(card_folder)):
				if fname.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg')):
					center_icon = settings.STATIC_URL.rstrip('/') + '/images/tercedivi/CARD_BRIGADAS/' + fname
					break

	if not center_icon:
		center_icon = brigada_main

	# Icono del batallón (heurística existente con fallback a la brigada)
	batallon_icon = _icon_for_batallon(brigada, batallon) or brigada_main

	# Icono representativo de la brigada (izquierda).
	# Preferir el mapeo explícito en `accounts.utils.image_mapper` (ICONOS_BRIGADAS),
	# luego emblem_left (íconos localizados en la carpeta de la brigada) y finalmente brigada_main.
	try:
		mapped = image_mapper(brigada)
	except Exception:
		mapped = None
	brigada_icon = mapped or emblem_left or brigada_main

	# Si no hay compañías listadas en el CSV (p. ej. brigadas especiales),
	# generar un fallback de compañías para mantener la navegación coherente.
	fallback_generated = False
	if not companias:
		# Nombres de compañía por defecto (cuatro pelotones esperado)
		companias = ['COMPAÑÍA A', 'COMPAÑÍA B', 'COMPAÑÍA C', 'COMPAÑÍA D']
		fallback_generated = True

	context = {
		'brigada': brigada,
		'batallon': batallon,
		'companias': companias,
		'emblem_left': emblem_left,
		'emblem_right': emblem_right,
		'brigada_main': brigada_main,
		'center_icon': center_icon,
		'batallon_icon': batallon_icon,
		'brigada_icon': brigada_icon,
		'fallback_companias': fallback_generated,
	}

	return render(request, 'tercera_division/companias.html', context)

@login_required
def pelotones(request):
	"""Vista de Pelotones.

	Añade al contexto varias URLs de emblemas para que la plantilla pueda
	mostrar los íconos correctamente sin depender exclusivamente de la
	heurística del cliente.
	"""
	brigada = _normalize_text(request.GET.get('brigada') or '')
	batallon = _normalize_text(request.GET.get('batallon') or '')
	compania = _normalize_text(request.GET.get('compania') or '')

	# Hasta tener datos reales de pelotones en el CSV, mostramos 4 placeholders
	pelotones = [f"Pelotón {i}" for i in range(1, 5)]

	# Emblemas relacionados a la brigada/batallón
	icons = _icons_for_brigada(brigada, limit=2)
	emblem_left = icons[0] if len(icons) > 0 else None
	emblem_right = icons[1] if len(icons) > 1 else None

	# Imagen principal de la brigada (primer ícono disponible en su carpeta)
	brigada_main = _first_icon_for_brigada(brigada)

	# Intentar obtener un 'card' o logo central más representativo desde una
	# carpeta común `CARD_BRIGADAS` si existe; si no, caer al `brigada_main`.
	center_icon = None
	card_folder = os.path.join(settings.BASE_DIR, 'static', 'images', 'tercedivi', 'CARD_BRIGADAS')
	key = _match_key(brigada)
	if os.path.isdir(card_folder):
		for fname in sorted(os.listdir(card_folder)):
			if fname.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg')):
				if key and key.replace(' ', '') in fname.upper().replace(' ', ''):
					center_icon = settings.STATIC_URL.rstrip('/') + '/images/tercedivi/CARD_BRIGADAS/' + fname
					break
		# Si no hubo coincidencia por nombre, usar el primero disponible
		if not center_icon:
			for fname in sorted(os.listdir(card_folder)):
				if fname.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg')):
					center_icon = settings.STATIC_URL.rstrip('/') + '/images/tercedivi/CARD_BRIGADAS/' + fname
					break

	if not center_icon:
		center_icon = brigada_main

	# Icono del batallón (heurística existente con fallback a la brigada)
	batallon_icon = _icon_for_batallon(brigada, batallon) or brigada_main

	# Icono representativo de la brigada (izquierda).
	try:
		mapped = image_mapper(brigada)
	except Exception:
		mapped = None
	brigada_icon = mapped or emblem_left or brigada_main

	context = {
		'brigada': brigada,
		'batallon': batallon,
		'compania': compania,
		'pelotones': pelotones,
		'emblem_left': emblem_left,
		'emblem_right': emblem_right,
		'brigada_icon': brigada_icon,
		'brigada_main': brigada_main,
		'center_icon': center_icon,
		'batallon_icon': batallon_icon,
	}

	return render(request, 'tercera_division/pelotones.html', context)


@login_required
def export_peloton_csv(request):
	"""Exporta un CSV del personal del pelotón indicado.

	Por ahora no hay modelo de personal en la BD, así que devolvemos una plantilla CSV
	con los encabezados y metadatos de la selección. Cuando exista el modelo, aquí se
	hará la consulta y se rellenarán las filas reales.
	"""
	brigada = (request.GET.get('brigada') or '').strip()
	batallon = (request.GET.get('batallon') or '').strip()
	compania = (request.GET.get('compania') or '').strip()
	peloton = (request.GET.get('peloton') or '').strip()

	# Construir nombre de archivo seguro
	def slugify(s):
		return ''.join(ch for ch in s.replace(' ', '_') if ch.isalnum() or ch in ('_', '-')).strip('_') or 'seleccion'

	filename = f"personal_{slugify(brigada)}_{slugify(batallon)}_{slugify(compania)}_{slugify(peloton)}.csv"

	# Preparar respuesta CSV
	response = HttpResponse(content_type='text/csv; charset=utf-8')
	response['Content-Disposition'] = f'attachment; filename="{filename}"'

	writer = csv.writer(response)
	# Encabezados típicos para personal; ajustar cuando se conozca el modelo real
	writer.writerow([
		'Documento', 'Apellidos', 'Nombres', 'Grado', 'Pelotón', 'Compañía', 'Batallón', 'Brigada'
	])

	# Datos mock para facilitar las pruebas manuales en tanto no exista el modelo real
	# Nota: Los valores de Pelotón/Compañía/Batallón/Brigada reflejan la selección recibida por querystring
	mock_rows = [
		('1001001001', 'Pérez Gómez', 'Juan Carlos', 'SL', peloton, compania, batallon, brigada),
		('1001001002', 'Rodríguez López', 'María Fernanda', 'SL', peloton, compania, batallon, brigada),
		('1001001003', 'García Martínez', 'Luis Alberto', 'CB', peloton, compania, batallon, brigada),
		('1001001004', 'Hernández Díaz', 'Ana Lucía', 'CB', peloton, compania, batallon, brigada),
		('1001001005', 'Sánchez Torres', 'Carlos Andrés', 'SG', peloton, compania, batallon, brigada),
		('1001001006', 'Ramírez Castillo', 'Diana Paola', 'SG', peloton, compania, batallon, brigada),
		('1001001007', 'Torres Ríos', 'Jorge Enrique', 'TC', peloton, compania, batallon, brigada),
		('1001001008', 'Vargas Ortiz', 'Camila Alejandra', 'TC', peloton, compania, batallon, brigada),
		('1001001009', 'Flores Medina', 'Oscar Eduardo', 'ST', peloton, compania, batallon, brigada),
		('1001001010', 'Castillo Niño', 'Valentina', 'ST', peloton, compania, batallon, brigada),
	]
	for row in mock_rows:
		writer.writerow(row)

	return response


@login_required
def crear_cursos(request):
	"""Vista para crear cursos - Solo Admin e Instructor"""
	# Verificar permisos
	role = request.session.get("role_selected", "soldado")
	is_authorized = (request.user.is_staff or request.user.is_superuser or 
					role in ['admin', 'instructor'])
	
	if not is_authorized:
		messages.error(request, "No tienes permisos para acceder a esta sección.")
		# Redirigir usando el namespace 'accounts' para coincidir con `accounts/urls.py`
		return redirect('accounts:admin_home')
	
	# Por ahora, mostrar una página simple - después se puede expandir
	return render(request, 'accounts/crear_cursos.html', {
		'user_role': role
	})


@login_required
def soldado_home(request):
	return render(request, 'accounts/soldado_home.html')



class SimpleRegistrationForm(forms.Form):
	"""Formulario simplificado para administradores ya autenticados"""
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

	def clean(self):
		cleaned_data = super().clean()
		password1 = cleaned_data.get("password1")
		password2 = cleaned_data.get("password2")

		# Verificar que las contraseñas coincidan
		if password1 and password2 and password1 != password2:
			raise forms.ValidationError("Las contraseñas no coinciden.")
		
		# Verificar que el nombre de usuario no existe
		username = cleaned_data.get("username")
		if username and User.objects.filter(username=username).exists():
			raise forms.ValidationError("Este nombre de usuario ya existe.")

		# Enforce allowed email domain
		email = cleaned_data.get('email')
		if email:
			allowed = getattr(settings, 'ALLOWED_EMAIL_DOMAIN', 'ejercito.mil.co')
			if '@' in email:
				_local, domain = email.split('@', 1)
				if domain.lower() != allowed.lower():
					raise forms.ValidationError(f"El correo debe ser del dominio @{allowed}.")
			else:
				raise forms.ValidationError("Correo electrónico inválido.")

		return cleaned_data


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
	"""Vista de registro que requiere autenticación de administrador y redirige a crear usuarios"""
	
	if request.method == 'POST':
		# Manejar solicitud AJAX para validación de admin
		if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
			try:
				data = json.loads(request.body)
				username = data.get('username', '').strip()
				password = data.get('password', '').strip()
				
				if not username or not password:
					return JsonResponse({'valid': False, 'error': 'Credenciales requeridas'})
				
				# Autenticar usuario
				admin_user = authenticate(username=username, password=password)
				
				if admin_user and (admin_user.is_staff or admin_user.is_superuser):
					# Autenticación exitosa - redirigir a crear usuarios
					return JsonResponse({
						'valid': True, 
						'redirect_url': '/accounts/crear-usuarios/'
					})
				else:
					return JsonResponse({'valid': False, 'error': 'Credenciales de administrador inválidas'})
			except Exception as e:
				return JsonResponse({'valid': False, 'error': f'Error: {str(e)}'})
	
	# Redirigir directamente a crear usuarios sin mostrar formulario intermedio
	return redirect('crear_usuarios')


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
			return render(request, 'crear-usuarios/crear_usuarios.html', {
				'form': form,
				'require_auth': False,
				'user_role': 'admin'
			})
		else:
			# Si es instructor/soldado, mostrar modal de autenticación
			return render(request, 'crear-usuarios/crear_usuarios.html', {
				'require_auth': True,
				'user_role': 'instructor_soldado'
			})
	else:
		# Si no está autenticado, mostrar modal de autenticación
		return render(request, 'crear-usuarios/crear_usuarios.html', {
			'require_auth': True,
			'user_role': 'anonymous'
		})


@csrf_exempt
def crear_usuarios_bulk(request):
	"""Endpoint para registro masivo de usuarios desde Excel.

	Autoriza de dos maneras:
	- Si el usuario autenticado es admin/staff.
	- O si provee credenciales admin válidas en el payload (admin_username/admin_password).

	Espera JSON con estructura:
	{
	  "records": [
		{"grado": "", "arma": "", "apellidos": "", "nombres": "", "cedula": "", ...}
	  ],
	  "admin_username": "opcional",
	  "admin_password": "opcional"
	}
	"""
	if request.method != 'POST':
		return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)

	try:
		data = json.loads(request.body or '{}')
	except Exception:
		return JsonResponse({'success': False, 'error': 'JSON inválido'}, status=400)

	# Autorización
	authorized = False
	if request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
		authorized = True
	else:
		admin_username = (data.get('admin_username') or '').strip()
		admin_password = (data.get('admin_password') or '').strip()
		if admin_username and admin_password:
			admin_user = authenticate(username=admin_username, password=admin_password)
			if admin_user and (admin_user.is_staff or admin_user.is_superuser):
				authorized = True

	if not authorized:
		return JsonResponse({'success': False, 'error': 'No autorizado. Se requieren credenciales administrativas.'}, status=403)

	records = data.get('records') or []
	if not isinstance(records, list) or not records:
		return JsonResponse({'success': False, 'error': 'No se recibieron registros válidos.'}, status=400)

	def _norm(s):
		if s is None:
			return ''
		s = str(s).strip()
		s = unicodedata.normalize('NFKD', s)
		s = ''.join(ch for ch in s if not unicodedata.combining(ch))
		return s

	def _gen_username(base):
		base = ''.join(ch for ch in base if ch.isalnum()).lower() or 'user'
		candidate = base
		i = 1
		while User.objects.filter(username=candidate).exists():
			i += 1
			candidate = f"{base}{i}"
		return candidate

	results = []
	created_count = 0
	errors_count = 0

	with transaction.atomic():
		for idx, rec in enumerate(records, start=1):
			try:
				apellidos = _norm(rec.get('apellidos', ''))
				nombres = _norm(rec.get('nombres', ''))
				cedula = _norm(rec.get('cedula', ''))

				if not apellidos or not nombres or not cedula:
					raise ValueError('Fila incompleta: se requieren NOMBRES, APELLIDOS y CÉDULA')

				# username base: inicial nombre + apellido + últimos 3 de cédula
				parts = nombres.split()
				inicial = parts[0][0] if parts else 'u'
				apellido_base = apellidos.split()[0] if apellidos else 'user'
				ced_tail = cedula[-3:] if len(cedula) >= 3 else cedula
				uname_base = f"{inicial}{apellido_base}{ced_tail}"
				username = _gen_username(uname_base)

				password = secrets.token_urlsafe(10)

				user = User.objects.create_user(
					username=username,
					email='',
					password=password,
					first_name=nombres,
					last_name=apellidos
				)

				created_count += 1
				results.append({
					'row': idx,
					'success': True,
					'username': username,
					'password': password
				})
			except Exception as e:
				errors_count += 1
				results.append({
					'row': idx,
					'success': False,
					'error': str(e)
				})

	return JsonResponse({
		'success': errors_count == 0,
		'created': created_count,
		'failed': errors_count,
		'results': results
	})


@csrf_exempt
def crear_usuarios_credentials_pdf(request):
	"""Genera un PDF con las credenciales ya creadas (username/password) enviadas en JSON.

	Seguridad: requiere admin autenticado o credenciales admin en payload.
	Payload esperado:
	{
	  "credentials": [ {"username": "u1", "password": "p1"}, ... ],
	  "admin_username": "opcional",
	  "admin_password": "opcional"
	}
	"""
	if request.method != 'POST':
		return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)

	try:
		data = json.loads(request.body or '{}')
	except Exception:
		return JsonResponse({'success': False, 'error': 'JSON inválido'}, status=400)

	# Autorización
	authorized = False
	if request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
		authorized = True
	else:
		admin_username = (data.get('admin_username') or '').strip()
		admin_password = (data.get('admin_password') or '').strip()
		if admin_username and admin_password:
			admin_user = authenticate(username=admin_username, password=admin_password)
			if admin_user and (admin_user.is_staff or admin_user.is_superuser):
				authorized = True

	if not authorized:
		return JsonResponse({'success': False, 'error': 'No autorizado.'}, status=403)

	credentials = data.get('credentials') or []
	if not isinstance(credentials, list) or not credentials:
		return JsonResponse({'success': False, 'error': 'Lista de credenciales vacía.'}, status=400)

	if not _REPORTLAB_AVAILABLE:
		return JsonResponse({'success': False, 'error': 'ReportLab no está instalado en el servidor.'}, status=500)

	# Generar PDF en memoria
	buffer = BytesIO()
	doc = SimpleDocTemplate(buffer, pagesize=letter)
	styles = getSampleStyleSheet()
	story = []

	title = Paragraph('Credenciales Generadas - Registro Masivo', styles['Title'])
	story.append(title)
	story.append(Spacer(1, 12))
	story.append(Paragraph(f'Total credenciales: {len(credentials)}', styles['Normal']))
	story.append(Spacer(1, 12))

	# Tabla de credenciales
	data_table = [['#', 'Usuario', 'Contraseña']]
	for i, cred in enumerate(credentials, start=1):
		data_table.append([str(i), cred.get('username', ''), cred.get('password', '')])

	table = Table(data_table, colWidths=[40, 200, 200])
	table.setStyle(TableStyle([
		('BACKGROUND', (0,0), (-1,0), colors.HexColor('#143a33')),
		('TEXTCOLOR', (0,0), (-1,0), colors.white),
		('ALIGN', (0,0), (-1,-1), 'CENTER'),
		('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
		('BOTTOMPADDING', (0,0), (-1,0), 8),
		('BACKGROUND', (0,1), (-1,-1), colors.whitesmoke),
		('GRID', (0,0), (-1,-1), 0.5, colors.gray),
	]))
	story.append(table)

	doc.build(story)
	pdf_bytes = buffer.getvalue()
	buffer.close()

	response = HttpResponse(pdf_bytes, content_type='application/pdf')
	response['Content-Disposition'] = 'attachment; filename="credenciales_registro_masivo.pdf"'
	return response
