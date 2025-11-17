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
        if (!img) return;
        if (aprobado) { img.classList.remove("bloqueado"); img.title = "Descargar certificado"; }
        else { img.classList.add("bloqueado"); img.title = "Disponible solo cuando el curso esté aprobado"; }
    });
}
