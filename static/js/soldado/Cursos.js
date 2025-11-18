// Cursos.js (adapted)document.addEventListener("DOMContentLoaded", () => {

    const filas = document.querySelectorAll("#tablaBoletin tbody tr");

    filas.forEach((fila) => {

        const inputs = fila.querySelectorAll("input");
        const selects = fila.querySelectorAll("select");
        const promedioInput = fila.querySelector(".promedio");
        const notas = fila.querySelectorAll(".notaInput");
        const estadoSelect = fila.querySelector(".estado");
        const iconosDescarga = fila.querySelectorAll(".iconoDescarga");

        // bloquear inputs
        inputs.forEach(inp => { inp.setAttribute("readonly", true); inp.style.backgroundColor = "#f0f0f0"; });
        selects.forEach(sel => { sel.setAttribute("disabled", true); sel.style.backgroundColor = "#e8e8e8"; });
        calcularPromedio(notas, promedioInput);
        actualizarDescargas(estadoSelect.value, iconosDescarga);
    });

});

function calcularPromedio(notas, output) {
    let suma = 0; let cantidad = 0;
    notas.forEach((n) => { let val = parseFloat(n.value); if (!isNaN(val)) { suma += val; cantidad++; } });
    let promedio = cantidad > 0 ? (suma / cantidad).toFixed(1) : "";
    output.value = promedio;
}

function actualizarDescargas(estado, iconos) {
    const aprobado = (estado === "TERMINADO APROBADO");
    iconos.forEach(icono => {
        const img = icono.querySelector("img");
        const anchor = icono.querySelector('a');
        if (!img) return;
        if (aprobado) {
            img.classList.remove("bloqueado");
            img.title = "Descargar certificado";
            if (anchor) anchor.classList.remove('bloqueado');
        } else {
            img.classList.add("bloqueado");
            img.title = "Disponible solo cuando el curso esté aprobado";
            if (anchor) anchor.classList.add('bloqueado');
        }
    });
}

// PDF generation: simulate certificate download using jsPDF
document.addEventListener('click', function (e) {
    const a = e.target.closest('a.download-individual, a.download-group');
    if (!a) return;
    e.preventDefault();
    // if anchor is blocked, ignore
    if (a.classList.contains('bloqueado')) return;
    const row = a.closest('tr');
    if (!row) return;
    // gather data from the row
    const courseEl = row.querySelector('.course-name');
    const course = (courseEl && courseEl.value) ? courseEl.value : (row.cells[1] ? row.cells[1].innerText : 'Curso');
    const soldierEl = row.querySelector('.soldado-nombre');
    const soldier = (soldierEl && soldierEl.value) ? soldierEl.value : (row.cells[1] ? row.cells[1].innerText : 'Soldado');
    const promedio = (row.querySelector('.promedio') || {}).value || '';
    const notas = Array.from(row.querySelectorAll('.notaInput')).map(n => n.value || '-');

    // Build a simple PDF using jsPDF
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const marginLeft = 40;
        let y = 60;
        doc.setFontSize(18);
        doc.text('Certificado (Simulado)', marginLeft, y);
        y += 30;
        doc.setFontSize(12);
        doc.text(`Curso: ${course}`, marginLeft, y);
        y += 18;
        doc.text(`Promedio: ${promedio}`, marginLeft, y);
        y += 18;
        doc.text('Calificaciones (por materia):', marginLeft, y);
        y += 16;
        notas.forEach((val, idx) => {
            doc.text(`${idx + 1}. ${val}`, marginLeft + 8, y);
            y += 14;
        });

        // small footer
        y += 20;
        doc.setFontSize(10);
        doc.text('Documento generado de forma simulada. Este PDF contiene la información del curso.', marginLeft, y);

        const filename = `${(soldier || 'soldado').replace(/\s+/g,'_')}_${(course || 'curso').replace(/\s+/g,'_')}_certificado.pdf`;
        doc.save(filename);
    } catch (err) {
        console.error('Error generating PDF', err);
        // fallback: download JSON with the same data
        const payload = { course, promedio, notas };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const tmp = document.createElement('a');
        tmp.href = url;
        tmp.download = `${course.replace(/\s+/g,'_')}_certificado.json`;
        document.body.appendChild(tmp);
        tmp.click();
        tmp.remove();
        URL.revokeObjectURL(url);
    }
});
