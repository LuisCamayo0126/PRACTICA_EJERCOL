"""Utilidades compartidas de la app accounts.

Incluye image_mapper para compatibilidad con vistas que esperen un mapeo
de nombres de brigada a íconos dentro de static/. Si alguna vista antigua
intenta `from .utils import image_mapper`, esta función evitará errores
de importación.
"""

from __future__ import annotations

from django.conf import settings

_ICON_MAP = {
	# Normalizados sin tildes ni mayúsculas estrictas
	'TERCERA BRIGADA': 'images/IMG/ICONOS_BRIGADAS/tercera_brigada.png',
	'VIGESIMA NOVENA BRIGADA': 'images/IMG/ICONOS_BRIGADAS/vigesima_novena_brigada.gif',
	'VIGESIMA TERCERA BRIGADA': 'images/IMG/ICONOS_BRIGADAS/vigesima_tercera_brigada.png',
	'FUDRA 2': 'images/IMG/ICONOS_BRIGADAS/FUDRA_2.png',
	'FUDRA 4': 'images/IMG/ICONOS_BRIGADAS/FUDRA_4.png',
	'FUERZA DE TAREA HERCULES': 'images/IMG/ICONOS_BRIGADAS/fuerza_de_tarea_hercules.png',
}


def _canon(text: str) -> str:
	import unicodedata, re
	s = (text or '').strip()
	s = unicodedata.normalize('NFKD', s)
	s = ''.join(ch for ch in s if not unicodedata.combining(ch))
	s = re.sub(r"\s+", " ", s).strip().upper()
	# Unificar alias de FUDRA
	if 'FUERZA DE DESPLIEGUE RAPIDO' in s:
		if ' 2' in s or ' N° 2' in s or ' NO 2' in s:
			return 'FUDRA 2'
		if ' 4' in s or ' N° 4' in s or ' NO 4' in s:
			return 'FUDRA 4'
	return s


def image_mapper(nombre_brigada: str) -> str | None:
	"""Devuelve la URL absoluta (incluye STATIC_URL) del ícono para la brigada.

	Si no hay coincidencia exacta, intenta con alias conocidos de FUDRA y
	retorna None si no encuentra nada.
	"""
	key = _canon(nombre_brigada)
	rel = _ICON_MAP.get(key)
	if not rel:
		return None
	base = settings.STATIC_URL.rstrip('/')
	return f"{base}/{rel}"


__all__ = [
	'image_mapper',
]

