// empty
const uploadIcon = document.getElementById("uploadExcel");
const modal = document.getElementById("uploadModal");
const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("excelFile");
const tableContainer = document.getElementById("tableContainer");
const form = document.getElementById("infoForm");
const uploadSection = document.querySelector(".upload-section");

// Mostrar modal al hacer clic en el icono
if (uploadIcon) uploadIcon.addEventListener("click", () => { modal.style.display = "flex"; });

// Cerrar modal al hacer clic fuera del contenido
if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

// Abrir selector de archivos al hacer clic dentro del modal
if (dropArea) dropArea.addEventListener("click", () => fileInput.click());

// Soporte de arrastrar y soltar
if (dropArea) {
	dropArea.addEventListener("dragover", (e) => { e.preventDefault(); dropArea.classList.add("dragover"); });
	dropArea.addEventListener("dragleave", () => { dropArea.classList.remove("dragover"); });
	dropArea.addEventListener("drop", (e) => {
		e.preventDefault(); dropArea.classList.remove("dragover");
		const file = e.dataTransfer.files[0]; if (file) handleFile(file);
	});
}

// Al elegir archivo manualmente
if (fileInput) fileInput.addEventListener("change", (e) => { const file = e.target.files[0]; if (file) handleFile(file); });

function handleFile(file) {
	const reader = new FileReader();
	reader.onload = function (e) {
		const data = new Uint8Array(e.target.result);
		const workbook = XLSX.read(data, { type: "array" });
		const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
		const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

		modal.style.display = "none"; // Cierra modal
		renderTable(rows); // Genera la tabla
	};
	reader.readAsArrayBuffer(file);
}

function renderTable(rows) {
	if (!rows || rows.length === 0) return;

	// Oculta el formulario y la sección de carga
	if (form) form.style.display = "none";
	if (uploadSection) uploadSection.style.display = "none";

	// Crea tabla dinámica con los datos del Excel
	let html = `
		<h3>El archivo ha sido cargado con éxito, por favor verifique los datos</h3>
		<table>
			<thead><tr>${rows[0].map(h => `<th>${h}</th>`).join('')}</tr></thead>
			<tbody>
				${rows.slice(1).map(r => `<tr>${r.map(c => `<td>${c || ""}</td>`).join('')}</tr>`).join('')}
			</tbody>
		</table>
		<button id="sendDataBtn" class="submit-btn">Enviar Información</button>
	`;

	// Keep a copy of parsed rows for later POST
	window.__crearUsuarios_lastRows = rows;

	if (tableContainer) {
		tableContainer.innerHTML = html;
		tableContainer.scrollIntoView({ behavior: "smooth" });

		// Acción del botón “Enviar Información”
		const sendButton = document.getElementById("sendDataBtn");
		if (sendButton) sendButton.addEventListener("click", async () => {
			try {
				const records = excelRowsToRecords(window.__crearUsuarios_lastRows);
				if (!records || !records.length) {
					alert('No se pudieron mapear registros. Verifica los encabezados del Excel.');
					return;
				}

				// Enviar a endpoint bulk
				await postRecords(records);
			} catch (err) {
				console.error(err);
				alert('Error al enviar registros: ' + (err.message || err));
			}
		});
	}
}

async function postRecords(records) {
  try {
    const resp = await fetch('/accounts/crear-usuarios-bulk/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ records })
    });
    const result = await resp.json();
    renderBulkResult(result);
  } catch (e) {
    console.error(e);
    alert('Error enviando registros: ' + (e.message || e));
  }
}

function collectFormRecord() {
  const names = ['grado','arma','apellidos','nombres','cedula','lugar_expedicion','fecha_expedicion','telefono','lugar_nacimiento','fecha_nacimiento','sexo','rh','tiempo_servicio','aptitud_fisica','brigada','batallon','compania','peloton'];
  const obj = {};
  names.forEach(n => {
    const el = document.querySelector(`[name="${n}"]`);
    if (!el) { obj[n] = ''; return; }
    if (el.tagName === 'SELECT') obj[n] = el.value || '';
    else obj[n] = el.value || '';
  });
  return obj;
}

function normalizeHeader(h) {
	if (!h && h !== 0) return '';
	const s = String(h).toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').trim();
	return s;
}

function mapHeaderToKey(h) {
	const s = normalizeHeader(h);
	if (s.includes('grado')) return 'grado';
	if (s.includes('arma')) return 'arma';
	if (s.includes('apell')) return 'apellidos';
	if (s.includes('nombre')) return 'nombres';
	if (s.includes('ced') || s.includes('document')) return 'cedula';
	if (s.includes('telefono') || s.includes('tel')) return 'telefono';
 	if (s.includes('fecha') && s.includes('nac')) return 'fecha_nacimiento';
	if (s.includes('lugar') && s.includes('nac')) return 'lugar_nacimiento';
	if (s.includes('fecha') && (s.includes('exped') || s.includes('exp'))) return 'fecha_expedicion';
	if (s.includes('lugar') && (s.includes('exped') || s.includes('exp'))) return 'lugar_expedicion';
	if (s.includes('sexo')) return 'sexo';
	// fallback: use safe ascii header
	return s.replace(/[^a-z0-9_]/g, '_') || null;
}

function excelRowsToRecords(rows) {
	if (!rows || rows.length < 2) return [];
	const headers = rows[0].map(h => mapHeaderToKey(h));
	// require at minimum apellidos, nombres, cedula
	const required = ['apellidos', 'nombres', 'cedula'];
	const hasAll = required.every(r => headers.includes(r));
	if (!hasAll) {
		alert('El archivo debe contener al menos las columnas: Apellidos, Nombres, Cédula');
		return [];
	}

	const out = [];
	for (let i = 1; i < rows.length; i++) {
		const row = rows[i];
		if (!row || row.length === 0) continue;
		const obj = {};
		for (let j = 0; j < headers.length; j++) {
			const key = headers[j];
			if (!key) continue;
			obj[key] = row[j] == null ? '' : String(row[j]).trim();
		}
		out.push(obj);
	}
	return out;
}

function renderBulkResult(result) {
	if (!result) return;
	let html = `<h3>Resultados</h3>`;
	if (result.success) html += `<p style="color:green">Usuarios creados: ${result.created} — Fallidos: ${result.failed}</p>`;
	else html += `<p style="color:orange">Operación finalizada. Usuarios creados: ${result.created || 0} — Fallidos: ${result.failed || 0}</p>`;

	if (Array.isArray(result.results)) {
		html += `<table><thead><tr><th>Fila</th><th>Resultado</th><th>Detalle</th></tr></thead><tbody>`;
		result.results.forEach(r => {
			html += `<tr><td>${r.row || ''}</td><td>${r.success ? 'OK' : 'ERROR'}</td><td>${r.success ? (r.username + (r.password ? (' / ' + r.password) : '')) : (r.error || '')}</td></tr>`;
		});
		html += `</tbody></table>`;
	}

	// Mostrar opción para descargar PDF si hay credenciales
	const createdCreds = (result.results || []).filter(r => r.success && r.username && r.password).map(r => ({ username: r.username, password: r.password }));
	if (createdCreds.length) {
		html += `<p><button id="downloadCreds" class="submit-btn">Descargar credenciales (PDF)</button></p>`;
	}

	if (tableContainer) tableContainer.innerHTML = html;

	if (createdCreds.length) {
		const btn = document.getElementById('downloadCreds');
		btn.addEventListener('click', async () => {
			try {
				const resp = await fetch('/accounts/crear-usuarios-credentials-pdf/', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
					body: JSON.stringify({ credentials: createdCreds })
				});
				if (!resp.ok) {
					const txt = await resp.text();
					alert('Error generando PDF: ' + txt);
					return;
				}
				const blob = await resp.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'credenciales_registro_masivo.pdf';
				document.body.appendChild(a);
				a.click();
				a.remove();
				URL.revokeObjectURL(url);
			} catch (e) {
				console.error(e);
				alert('Error al solicitar PDF: ' + e.message);
			}
		});
	}
}

// Soporte básico: si el usuario cancela el formulario nativo, volver a mostrar
if (form) {
	form.addEventListener('submit', async function (e) {
		e.preventDefault();
		// Si hay un Excel cargado, usarlo; si no, recopilar los campos del formulario
		if (window.__crearUsuarios_lastRows && Array.isArray(window.__crearUsuarios_lastRows) && window.__crearUsuarios_lastRows.length > 1) {
			const records = excelRowsToRecords(window.__crearUsuarios_lastRows);
			if (!records || !records.length) { alert('No se pudieron mapear registros.'); return; }
			await postRecords(records);
			return;
		}

		// Si no hay Excel, enviar un único registro basado en los campos del form
		const rec = collectFormRecord();
		// Validación mínima
		if (!rec.apellidos || !rec.nombres || !rec.cedula) {
			alert('Complete al menos Apellidos, Nombres y Cédula antes de enviar.');
			return;
		}
		await postRecords([rec]);
	});
}

