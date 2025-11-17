from django.db import models
from django.conf import settings


class Formulario(models.Model):
	title = models.CharField(max_length=255)
	role = models.CharField(max_length=64, blank=True)
	estado = models.BooleanField(default=True)
	created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Formulario: {self.title}"


class Pregunta(models.Model):
	FORM_TYPES = [
		('texto', 'Respuesta corta'),
		('parrafo', 'Párrafo'),
		('opcion', 'Opción única'),
		('multiple', 'Opción múltiple'),
	]
	formulario = models.ForeignKey(Formulario, related_name='preguntas', on_delete=models.CASCADE)
	text = models.TextField()
	tipo = models.CharField(max_length=20, choices=FORM_TYPES)
	required = models.BooleanField(default=False)
	orden = models.PositiveIntegerField(default=0)

	def __str__(self):
		return f"Pregunta [{self.id}] {self.text[:40]}"


class Opcion(models.Model):
	pregunta = models.ForeignKey(Pregunta, related_name='opciones', on_delete=models.CASCADE)
	text = models.CharField(max_length=255)
	orden = models.PositiveIntegerField(default=0)

	def __str__(self):
		return f"Opcion: {self.text[:40]}"
