// Califi.js - adapted version
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector(".btn-enviar");
  if (!btn) return;
  if (localStorage.getItem("eval_enviada") === "true") { cargarResultados(); desactivarFormulario(); }
  btn.addEventListener("click", (e) => { e.preventDefault(); manejarEnvio(); });
});

function manejarEnvio() {
  const ths = document.querySelectorAll(".tabla-principal thead th");
  const nInstructores = Math.max(1, ths.length - 2);
  const filas = Array.from(document.querySelectorAll(".tabla-principal tbody tr"));
  const selectsAll = Array.from(document.querySelectorAll(".tabla-principal tbody select"));
  const incompletos = selectsAll.filter(s => s.value === "" || s.value === "-" || s.value == null);
  document.querySelectorAll(".incomplete-highlight").forEach(el => el.classList.remove("incomplete-highlight"));
  if (incompletos.length > 0) { alert("Por favor complete todas las calificaciones antes de enviar."); incompletos.forEach(s => s.classList.add("incomplete-highlight")); return; }
  const sumas = new Array(nInstructores).fill(0);
  const cuentas = new Array(nInstructores).fill(0);
  filas.forEach((fila, idxFila) => {
    const selectsFila = Array.from(fila.querySelectorAll("select"));
    for (let i = 0; i < nInstructores; i++) {
      const s = selectsFila[i];
      const v = s ? parseInt(s.value, 10) : NaN;
      if (!isNaN(v)) { sumas[i] += v; cuentas[i] += 1; }
    }
  });
  const promedios = sumas.map((suma, i) => (cuentas[i] ? (suma / cuentas[i]).toFixed(1) : "0.0"));
  const objetoGuardar = { fecha: new Date().toISOString(), promedios };
  try { localStorage.setItem("resultados_instructores", JSON.stringify(objetoGuardar)); localStorage.setItem("eval_enviada", "true"); } catch (e) { alert("No se pudieron guardar los resultados en el navegador."); return; }
  actualizarResumen(promedios); desactivarFormulario(); alert("Evaluación enviada correctamente.");
}

function actualizarResumen(promediosArray) {
  const celdasClase = document.querySelectorAll(".calif-res");
  if (celdasClase && celdasClase.length >= promediosArray.length) { for (let i = 0; i < promediosArray.length; i++) celdasClase[i].textContent = promediosArray[i]; return; }
  const filasResumen = document.querySelectorAll(".tabla-resumen tr");
  if (filasResumen && filasResumen.length >= (promediosArray.length + 1)) { for (let i = 0; i < promediosArray.length; i++) { try { filasResumen[i + 1].children[1].textContent = promediosArray[i]; } catch (e) {} } return; }
}

function cargarResultados() { const raw = localStorage.getItem("resultados_instructores"); if (!raw) return; try { const obj = JSON.parse(raw); if (obj && obj.promedios) actualizarResumen(obj.promedios); } catch (e) {} }
function desactivarFormulario() { document.querySelectorAll(".tabla-principal tbody select").forEach(s => s.disabled = true); const btn = document.querySelector(".btn-enviar"); if (btn) { btn.disabled = true; btn.classList.add("disabled"); } }
