import csv
import json
import os
import argparse
from django.core.management.base import BaseCommand
from django.conf import settings


def _normalize(s: str) -> str:
    if s is None:
        return ''
    return ' '.join(str(s).split()).strip()


class Command(BaseCommand):
    help = 'Importa un CSV de boletín y genera data/boletin.json (deduplicado por cédula)'

    def add_arguments(self, parser):
        parser.add_argument('csv_path', type=str, help='Ruta al archivo CSV a importar (delimitador ; )')
        parser.add_argument('--course', type=str, help='Nombre del curso (opcional)', default='Curso')

    def handle(self, *args, **options):
        csv_path = options['csv_path']
        course_name = options.get('course') or 'Curso'
        outdir = os.path.join(settings.BASE_DIR, 'data')
        os.makedirs(outdir, exist_ok=True)
        out_path = os.path.join(outdir, 'boletin.json')

        if not os.path.exists(csv_path):
            self.stderr.write(self.style.ERROR(f'Archivo no encontrado: {csv_path}'))
            return

        rows = []
        with open(csv_path, 'r', encoding='utf-8', errors='ignore', newline='') as f:
            reader = csv.reader(f, delimiter=';')
            lines = list(reader)

        if not lines:
            self.stderr.write(self.style.ERROR('CSV vacío'))
            return

        # Try to find header row (first row with some expected column names)
        header_idx = None
        header = None
        for i, r in enumerate(lines[:10]):
            joined = ' '.join([c.upper() for c in r if c])
            if 'APELL' in joined or 'CEDULA' in joined or 'NOMBRE' in joined or 'APELLIDOS' in joined:
                header_idx = i
                header = [c.upper() for c in r]
                break

        start_idx = 0
        if header_idx is not None:
            start_idx = header_idx + 1
        else:
            # fallback: assume first row is header
            header = [c.upper() for c in lines[0]]
            start_idx = 1

        # Map columns
        name_col = None
        ced_col = None
        estado_col = None
        promedio_col = None
        notas_cols = []
        obs_col = None

        for idx, col in enumerate(header):
            c = col or ''
            if 'APELL' in c or 'NOMB' in c:
                name_col = idx
            if 'CEDULA' in c or 'CÉDULA' in c or 'IDENT' in c:
                ced_col = idx
            if 'PROMED' in c:
                promedio_col = idx
            if 'ESTADO' in c:
                estado_col = idx
            if 'OBSERV' in c or 'OBSERVACIONES' in c:
                obs_col = idx
            if 'MATERIA' in c or 'MATERIA' in c or ('NOTA' in c and 'MATERIA' in c):
                notas_cols.append(idx)
            # Heuristic: columns like 'MATERIA 1', 'MATERIA 2' or many unnamed columns with numeric values
        # If no explicit notas columns found, attempt to detect numeric columns after the name/cedula
        if not notas_cols:
            # find first data row and locate numeric-looking columns
            for r in lines[start_idx:start_idx+5]:
                for idx, val in enumerate(r):
                    v = val.strip() if val else ''
                    if v.replace('.', '', 1).replace(',', '', 1).isdigit():
                        if idx not in notas_cols and idx not in (name_col, ced_col):
                            notas_cols.append(idx)

        # Process rows
        dedup = {}
        for r in lines[start_idx:]:
            if not any(cell.strip() for cell in r):
                continue
            name = _normalize(r[name_col]) if name_col is not None and name_col < len(r) else ''
            ced = _normalize(r[ced_col]) if ced_col is not None and ced_col < len(r) else ''
            estado = _normalize(r[estado_col]) if estado_col is not None and estado_col < len(r) else ''
            promedio = _normalize(r[promedio_col]) if promedio_col is not None and promedio_col < len(r) else ''
            obs = _normalize(r[obs_col]) if obs_col is not None and obs_col < len(r) else ''
            notas = []
            for idx in notas_cols:
                if idx < len(r):
                    v = r[idx].strip()
                    if v == '':
                        notas.append(None)
                    else:
                        # normalize comma decimal
                        v2 = v.replace(',', '.')
                        try:
                            n = float(v2)
                        except Exception:
                            n = v
                        notas.append(n)
            key = ced or name
            if not key:
                # skip rows without any identifier
                continue
            # avoid duplicates: prefer earlier entries
            if key in dedup:
                continue
            dedup[key] = {
                'cedula': ced,
                'nombre': name,
                'curso': course_name,
                'notas': notas,
                'promedio': promedio,
                'faltas': None,
                'observaciones': obs,
                'estado': estado,
            }

        out = list(dedup.values())
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(out, f, ensure_ascii=False, indent=2)

        self.stdout.write(self.style.SUCCESS(f'Importado {len(out)} filas a {out_path}'))
