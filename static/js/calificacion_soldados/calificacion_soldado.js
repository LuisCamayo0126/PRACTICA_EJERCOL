// Datos de materias y evaluaciones
const materias = {
  materia1: {
    nombre: "TAREAS OFENSIVAS",
    items: [
      "Ejecutar técnicas en Movimiento al Contacto",
      "Ejecutar técnicas en Ataque",
      "Ejecutar técnicas en Explotación",
      "Ejecutar técnicas en Persecución"
    ]
  },
  materia2: {
    nombre: "CONTROL DE AMENAZA HIBRIDA",
    items: [
      "Identificar tareas defensivas",
      "Desarrollar técnica de defensa de área",
      "Desarrollar técnica de defensa móvil",
      "Desarrollar técnica retrógrada"
    ]
  },
  materia3: {
    nombre: "DRILES DE COMBATE PROACTIVOS",
    items: [
      "Reaccionar ante ataque de francotirador",
      "Reaccionar ante ataque de fuego indirecto",
      "Reaccionar ante área minada encontrada",
      "Reaccionar ante área minada activada",
      "Reaccionar ante hostigamiento lejano",
      "Reaccionar ante fuerza superior",
      "Ejecutar contraemboscada"
    ]
  },
  materia4: {
    nombre: "PISTA DE CONDUCCION DE OPERACIONES",
    items: [
      "Efectuar paso de PCUO (procedimiento comando)"
    ]
  },
  materia5: {
    nombre: "FORMACIONES DE EQUIPOS Y PELOTON",
    items: [
      "Ejecutar formaciones tácticas con voz de mando",
      "Ejecutar formaciones tácticas con señales"
    ]
  }
};

// Datos de soldados por materia
let datos = {
  materia1: [
    {
      numero: 1,
      nombre: "Martin Lopez",
      cedula: "13873184",
      calificaciones: [5, 4, 5, 3],
      prom: 4.2,

      obs: "Excelente en formaciones"
    }
  ]
};

function cambiarVista(vista) {
  const vistaPrincipal = document.getElementById("vista-principal");
  const vistaCalificaciones = document.getElementById("vista-calificaciones");
  const vistaAsistencia = document.getElementById("vista-asistencia");
  const controlesPrincipal = document.getElementById("controles-principal");
  const tituloPrincipal = document.getElementById("titulo-principal");

  if (!vistaPrincipal || !vistaCalificaciones || !vistaAsistencia || !controlesPrincipal || !tituloPrincipal) {
    console.warn('cambiarVista: algunos elementos del DOM no existen, abortando cambio de vista');
    return;
  }

  // Limpiar buscador global al cambiar de vista
  const bpEl = document.getElementById('buscador-principal'); if (bpEl) bpEl.value = '';

  // Ocultar todas las vistas primero
  vistaPrincipal.classList.add("vista-oculta");
  vistaCalificaciones.classList.add("vista-oculta");
  vistaAsistencia.classList.add("vista-oculta");
  controlesPrincipal.classList.add("vista-oculta");

  if (vista === 'calificaciones') {
    // Load latest asistencia/calificaciones for the selected materia, then render
    controlesPrincipal.classList.remove('vista-oculta');
    fetchAsistencia(materiaActual).then(() => {
      vistaCalificaciones.classList.remove('vista-oculta');
      actualizarEncabezadosTabla();
      inicializarTablaCalificaciones();
      tituloPrincipal.textContent = 'CALIFICACIÓN Y ASISTENCIA SOLDADOS';
    }).catch(e => {
      console.warn('cambiarVista(calificaciones) fetch failed', e);
      vistaCalificaciones.classList.remove('vista-oculta');
      actualizarEncabezadosTabla();
      inicializarTablaCalificaciones();
      tituloPrincipal.textContent = 'CALIFICACIÓN Y ASISTENCIA SOLDADOS';
    });

  } else if (vista === 'asistencia') {
    controlesPrincipal.classList.remove('vista-oculta');
    // Fetch latest asistencia before showing the view to avoid stale data
    fetchAsistencia(materiaActual).then(() => {
      vistaAsistencia.classList.remove('vista-oculta');
      inicializarTablaAsistencia();
      tituloPrincipal.textContent = 'ASISTENCIA SOLDADOS';
    }).catch(e => {
      console.warn('cambiarVista(asistencia) fetch failed', e);
      vistaAsistencia.classList.remove('vista-oculta');
      inicializarTablaAsistencia();
      tituloPrincipal.textContent = 'ASISTENCIA SOLDADOS';
    });

  } else {
    // Principal view
    vistaPrincipal.classList.remove('vista-oculta');
    controlesPrincipal.classList.remove('vista-oculta');
    inicializarTabla();
    tituloPrincipal.textContent = 'CALIFICACIÓN Y ASISTENCIA SOLDADOS';
  }
}

let materiaActual = '';
let indiceActual = null;
let datosTemporales = [];
let previousVista = null;

// Normalize existing data: detect if values are in 0-5 scale and convert to 0-100
function normalizeMateriaData(clave) {
  if (!datos || !datos[clave]) return;
  try {
    const registros = datos[clave];
    // Find the maximum calificacion in this materia
    let maxVal = 0;
    registros.forEach(r => {
      if (Array.isArray(r.calificaciones)) {
        r.calificaciones.forEach(v => { if (typeof v === 'number' && v > maxVal) maxVal = v; });
      }
    });

    // If maxVal <= 5 assume 0-5 scale and convert by multiplying by 20
    if (maxVal > 0 && maxVal <= 5) {
      registros.forEach(r => {
        if (Array.isArray(r.calificaciones)) {
          r.calificaciones = r.calificaciones.map(v => {
            const num = Number(v) || 0;
            return Math.round(num * 20);
          });
          // Recalculate promedio for the converted values
          const suma = r.calificaciones.reduce((a, b) => a + b, 0);
          r.prom = r.calificaciones.length > 0 ? Math.round((suma / r.calificaciones.length) * 10) / 10 : 0;
        }
      });
    }
  } catch (e) {
    console.warn('normalizeMateriaData failed for', clave, e);
  }
}

function normalizeAllDatos() {
  if (!datos) return;
  Object.keys(datos).forEach(k => normalizeMateriaData(k));
}

// Inicializar la aplicación
function inicializarAplicacion() {
  try {
    const selectMateria = document.getElementById('select-materia');
    if (selectMateria) {
      selectMateria.addEventListener('change', function() {
        materiaActual = this.value;
        if (materiaActual) {
          // Load server-stored asistencia/calificaciones for the selected materia
          fetchAsistencia(materiaActual).then(() => {
            actualizarEncabezadosTabla();
            inicializarTabla();
          }).catch(e => { console.warn('fetchAsistencia error', e); actualizarEncabezadosTabla(); inicializarTabla(); });
        }
      });

      // Inicializar con primera materia por defecto
      materiaActual = 'materia1';
      selectMateria.value = materiaActual;
      // Normalize sample data on load (convert 0-5 -> 0-100 if needed)
      normalizeAllDatos();
      // Try to load persisted asistencia for the initial materia, then init UI
      fetchAsistencia(materiaActual).then(() => {
        // Ensure fetched data is normalized as well
        normalizeMateriaData(materiaActual);
        actualizarEncabezadosTabla();
        inicializarTabla();
      }).catch(e => { console.warn('fetchAsistencia error', e); normalizeMateriaData(materiaActual); actualizarEncabezadosTabla(); inicializarTabla(); });
    } else {
      // If the select isn't present, initialize as best-effort with default materia
      materiaActual = 'materia1';
      normalizeAllDatos();
      actualizarEncabezadosTabla();
      inicializarTabla();
    }
  } catch (err) {
    console.error('Error inicializando la aplicación', err);
  }
  // Recalculate column widths when window resizes (debounced)
  try {
    window.addEventListener('resize', debounce(() => { ajustarColumnasPorEncabezado(); }, 150));
    // initial adjustment
    setTimeout(() => { try { ajustarColumnasPorEncabezado(); } catch(e){} }, 80);
  } catch(e) { /* noop */ }
}


// Fetch asistencia data for a materia from the server (if any) and merge
async function fetchAsistencia(materia) {
  if (!materia) return;
  try {
    const res = await fetch(`/accounts/api/asistencia/?materia=${encodeURIComponent(materia)}`, { credentials: 'same-origin' });
    if (!res.ok) return;
    const j = await res.json();
    if (j && j.success && Array.isArray(j.data) && j.data.length > 0) {
      // Replace local datos for this materia with persisted data
      datos[materia] = j.data;
      // Normalize persisted data in case it was stored in 0-5 scale
      try { normalizeMateriaData(materia); } catch (e) { console.warn('normalize after fetch failed', e); }
    }
  } catch (e) {
    console.warn('fetchAsistencia failed', e);
  }
}

// Save asistencia data to server for a materia
async function saveAsistenciaToServer(materia, payload) {
  try {
    const res = await fetch('/accounts/api/asistencia/save/', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materia: materia, data: payload })
    });
    const j = await res.json();
    return j;
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Función para filtrar datos por nombre o cédula
function filtrarDatos(datos, terminoBusqueda) {
  if (!terminoBusqueda || !datos) return datos;
  
  return datos.filter(soldado => {
    if (!soldado) return false;
    
    const nombreMatch = soldado.nombre && 
                       soldado.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase());
    const cedulaMatch = soldado.cedula && 
                       soldado.cedula.includes(terminoBusqueda);
    
    return nombreMatch || cedulaMatch;
  });
}

// Función para aplicar filtro a la tabla principal
function aplicarFiltroPrincipal() {
  if (!materiaActual || !datos[materiaActual]) return;
  
  const bpEl = document.getElementById('buscador-principal');
  const termino = bpEl ? bpEl.value : '';
  const datosFiltrados = filtrarDatos(datos[materiaActual], termino);
  actualizarTablaConFiltro('tabla-principal', datosFiltrados, false);
}

// Función para aplicar filtro a la tabla de calificaciones
function aplicarFiltroCalificaciones() {
  if (!materiaActual) return;
  
  const datosBase = datosTemporales || datos[materiaActual];
  // Use specific buscador if present, otherwise fallback to the global buscador-principal
  const terminoEl = document.getElementById('buscador-calificaciones') || document.getElementById('buscador-principal');
  const termino = terminoEl ? terminoEl.value : '';
  const datosFiltrados = filtrarDatos(datosBase, termino);
  actualizarTablaCalificacionesConFiltro(datosFiltrados);
}

// Función para aplicar filtro a la tabla de asistencia
function aplicarFiltroAsistencia() {
  if (!materiaActual) return;
  
  const datosBase = datosTemporales || datos[materiaActual];
  // Use specific buscador if present, otherwise fallback to the global buscador-principal
  const terminoEl = document.getElementById('buscador-asistencia') || document.getElementById('buscador-principal');
  const termino = terminoEl ? terminoEl.value : '';
  const datosFiltrados = filtrarDatos(datosBase, termino);
  actualizarTablaAsistenciaConFiltro(datosFiltrados);
}

// Actualizar tabla principal con datos filtrados
function actualizarTablaConFiltro(idTabla, datosFiltrados, esEditable = false) {
  const tabla = document.getElementById(idTabla);
  if (!tabla) return;
  
  // Limpiar tabla (excepto encabezado)
  const filas = tabla.querySelectorAll("tr:not(.encabezado)");
  if (filas && filas.forEach) filas.forEach(tr => tr.remove());

  if (!datosFiltrados || datosFiltrados.length === 0) {
    const bpEl = document.getElementById('buscador-principal');
    const termino = bpEl ? bpEl.value : '';
    let mensaje = termino ? 
      `No se encontraron resultados para "${termino}"` : 
      "No hay datos disponibles para esta materia";
    
    let fila = tabla.insertRow();
    fila.innerHTML = `<td colspan="100%" style="text-align: center; padding: 20px; color: #666; font-style: italic;">${mensaje}</td>`;
    return;
  }

  // Agregar filas según datos filtrados
  datosFiltrados.forEach((d, index) => {
    let fila = tabla.insertRow();
    
    let celdasHTML = `
      <td>${d.numero}</td>
      <td>${d.nombre}</td>
      <td>${d.cedula}</td>
    `;
    
    // Agregar calificaciones según cantidad de items
    d.calificaciones.forEach(calificacion => { celdasHTML += `<td>${calificacion}</td>`; });
    
    celdasHTML += `
      <td>${d.prom}</td>
      <td>${d.faltas}</td>
      <td>${d.obs}</td>
    `;
    
    fila.innerHTML = celdasHTML;
  });
}

// Actualizar tabla de calificaciones con datos filtrados
function actualizarTablaCalificacionesConFiltro(datosFiltrados) {
  const tabla = document.getElementById("tabla-calificaciones");
  if (!tabla) return;
  
  // Limpiar tabla (excepto encabezado)
  const filas = tabla.querySelectorAll("tr:not(.encabezado)");
  if (filas && filas.forEach) filas.forEach(tr => tr.remove());

  if (!datosFiltrados || datosFiltrados.length === 0) {
    const terminoEl = (document.getElementById && (document.getElementById('buscador-calificaciones') || document.getElementById('buscador-principal')));
    const termino = terminoEl ? terminoEl.value : '';
    let mensaje = termino ? 
      `No se encontraron resultados para "${termino}"` : 
      "No hay datos disponibles para esta materia";
    
    let fila = tabla.insertRow();
    fila.innerHTML = `<td colspan="100%" style="text-align: center; padding: 20px; color: #666; font-style: italic;">${mensaje}</td>`;
    return;
  }

  const materia = materias[materiaActual];

  // Agregar filas según datos filtrados
  datosFiltrados.forEach((d, index) => {
    let fila = tabla.insertRow();
    
    let celdasHTML = `
      <td>${d.numero}</td>
      <td>${d.nombre}</td>
      <td>${d.cedula}</td>
    `;
    
    // Agregar inputs para calificaciones (escala 0-100)
    d.calificaciones.forEach((calificacion, calIndex) => { celdasHTML += `<td><input type="number" min="0" max="100" step="1" class="input-calificacion" data-index="${index}" data-field="m${calIndex+1}" value="${calificacion}"></td>`; });
    
    celdasHTML += `
      <td class="promedio" data-index="${index}">${d.prom}</td>
      <td><input type="text" value="${d.obs}" data-index="${index}" data-field="obs" class="input-observacion"></td>
      <td>
        <button class="btn-editar" onclick="abrirEdicion(${index})" title="Editar" aria-label="Editar registro">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
          </svg>
        </button>
      </td>
    `;
    
    fila.innerHTML = celdasHTML;
    
    // Agregar event listeners para inputs
    fila.querySelectorAll('.input-calificacion').forEach(input => { input.addEventListener('input', function(){ actualizarDatoTemporal(this); }); });
    
    fila.querySelectorAll('.input-observacion').forEach(input => { input.addEventListener('input', function(){ actualizarDatoTemporal(this); }); });
  });
  // After populating rows, ensure column widths match header lengths
  try { ajustarColumnasPorEncabezado(); } catch (e) { /* noop */ }
}

// Actualizar tabla de asistencia con datos filtrados
function actualizarTablaAsistenciaConFiltro(datosFiltrados) {
  const tabla = document.getElementById("tabla-asistencia");
  if (!tabla) return;
  
  // Limpiar tabla (excepto encabezado)
  const filas = tabla.querySelectorAll("tr:not(.encabezado)");
  if (filas && filas.forEach) filas.forEach(tr => tr.remove());

  if (!datosFiltrados || datosFiltrados.length === 0) {
    const terminoEl = (document.getElementById && (document.getElementById('buscador-asistencia') || document.getElementById('buscador-principal')));
    const termino = terminoEl ? terminoEl.value : '';
    let mensaje = termino ? 
      `No se encontraron resultados para "${termino}"` : 
      "No hay datos disponibles para esta materia";
    
    let fila = tabla.insertRow();
    fila.innerHTML = `<td colspan="100%" style="text-align: center; padding: 20px; color: #666; font-style: italic;">${mensaje}</td>`;
    return;
  }

  // Agregar filas según datos filtrados
  datosFiltrados.forEach((d, index) => {
    let fila = tabla.insertRow();
    fila.innerHTML = `
      <td>${d.numero}</td>
      <td>${d.nombre}</td>
      <td>${d.cedula}</td>
      <td><input type="number" value="${d.faltas}" data-index="${index}" data-field="faltas" class="input-faltas"></td>
      <td><input type="text" value="${d.obs}" data-index="${index}" data-field="obs" class="input-observacion"></td>
      <td>
        <button class="btn-editar" onclick="abrirEdicion(${index})" title="Editar" aria-label="Editar registro">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
          </svg>
        </button>
      </td>
    `;
    
    // Agregar event listeners para inputs
    fila.querySelectorAll('.input-faltas').forEach(input => { input.addEventListener('input', function(){ actualizarDatoTemporal(this); }); });
    
    fila.querySelectorAll('.input-observacion').forEach(input => { input.addEventListener('input', function(){ actualizarDatoTemporal(this); }); });
  });
  // Ajustar columnas según encabezados
  try { ajustarColumnasPorEncabezado(); } catch(e) { /* noop */ }
}

// Actualizar encabezados de la tabla según la materia seleccionada
function actualizarEncabezadosTabla() {
  const tabla = document.getElementById("tabla-principal");
  const encabezado = tabla.querySelector('.encabezado');
  const materia = materias[materiaActual];
  
  if (materia) {
    let encabezadosHTML = `
      <th>N°</th>
      <th>NOMBRE</th>
      <th>CÉDULA</th>
    `;
    
    // Agregar items específicos de la materia
    materia.items.forEach(item => { encabezadosHTML += `<th>${item}</th>`; });
    
    encabezadosHTML += `
      <th>PROMEDIO</th>
      <th>FALTAS</th>
      <th>OBSERVACIONES</th>
    `;
    
    encabezado.innerHTML = encabezadosHTML;
    // Evitar orfandades en los encabezados: forzar NBSP antes de la última palabra
    try { ensureNoOrphansInHeaders(); } catch(e) { /* noop */ }
    // Ajustar columnas inmediatamente después de reconstruir encabezados
    try { ajustarColumnasPorEncabezado(); } catch(e) { /* noop */ }
  }
}

// Reemplaza el último espacio en cada TH por NBSP para evitar líneas con una sola letra
function ensureNoOrphansInHeaders() {
  try {
    const ths = document.querySelectorAll('.tabla-container th');
    ths.forEach(th => {
      // Only alter plain text headers; preserve if there are child elements
      const text = (th.textContent || '').trim();
      if (!text) return;
      // If already contains NBSP, skip to avoid repeated changes
      if (text.indexOf('\u00A0') !== -1) return;

      // Attach short prepositions/particles to the following word (avoid orphans)
      const smallWords = ['en','al','de','la','el','y','a','con','sin','por','para','ante','del','los','las'];
      const smallRegex = new RegExp('\\b(' + smallWords.join('|') + ')\\s+', 'gi');
      let replaced = text.replace(smallRegex, function(match, p1){
        // keep original casing for the small word, add NBSP instead of space
        return p1 + '\u00A0';
      });

      // Finally ensure the last space is NBSP so the last word doesn't orphan
      replaced = replaced.replace(/\s+([^\s]+)$/, '\u00A0$1');

      if (replaced !== text) {
        // Set as HTML-safe text (we're not inserting other markup)
        th.innerHTML = replaced;
      }
    });
  } catch (e) {
    console.warn('ensureNoOrphansInHeaders failed', e);
  }
}

// Debounce helper
function debounce(fn, wait) {
  let t = null;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Ajusta el ancho de las columnas basándose en el ancho natural de los encabezados
function ajustarColumnasPorEncabezado() {
  try {
    document.querySelectorAll('.tabla-container table').forEach(table => {
      // find header row: either thead th or tr.encabezado th
      let ths = table.querySelectorAll('thead th');
      if (!ths || ths.length === 0) {
        const encabezadoRow = table.querySelector('tr.encabezado');
        ths = encabezadoRow ? encabezadoRow.querySelectorAll('th') : table.querySelectorAll('th');
      }
      if (!ths || ths.length === 0) return;

      // measure each header natural width and consider some cell content width too
      const rows = Array.from(table.querySelectorAll('tr:not(.encabezado)'));
      const widths = Array.from(ths).map((th, colIndex) => {
        const style = window.getComputedStyle(th);
        const minW = parseFloat(style.minWidth) || 0;
        let measured = th.scrollWidth + 12; // header content
        // also inspect up to first 20 body rows to avoid under-sizing
        for (let r = 0; r < Math.min(rows.length, 20); r++) {
          const cells = rows[r].querySelectorAll('td');
          if (cells && cells[colIndex]) {
            measured = Math.max(measured, cells[colIndex].scrollWidth + 12);
          }
        }
        return Math.max(measured, minW);
      });

      // remove existing colgroup if present
      const existing = table.querySelector('colgroup.adjusted');
      if (existing) existing.remove();

      const colgroup = document.createElement('colgroup');
      colgroup.className = 'adjusted';
      widths.forEach(w => {
        const c = document.createElement('col');
        c.style.width = w + 'px';
        colgroup.appendChild(c);
      });

      // insert colgroup as first child
      table.insertBefore(colgroup, table.firstChild);
    });
  } catch (e) {
    console.warn('ajustarColumnasPorEncabezado failed', e);
  }
}

// Inicializar tabla principal (solo visualización - SIN edición)
function inicializarTabla() {
  const bpEl = document.getElementById('buscador-principal');
  const termino = bpEl ? bpEl.value : '';
  if (datos[materiaActual] && datos[materiaActual].length > 0) {
    const datosMostrar = termino ? filtrarDatos(datos[materiaActual], termino) : datos[materiaActual];
    actualizarTablaConFiltro('tabla-principal', datosMostrar, false);
  } else {
    // Mostrar mensaje de no datos disponibles
    const tabla = document.getElementById("tabla-principal");
    tabla.querySelectorAll("tr:not(.encabezado)").forEach(tr => tr.remove());
    let fila = tabla.insertRow();
    fila.innerHTML = `<td colspan="100%" style="text-align: center; padding: 20px; color: #666; font-style: italic;">No hay datos disponibles para esta materia</td>`;
  }
}

// Inicializar tabla de calificaciones (sin FALTAS - con edición directa Y botón edición)
function inicializarTablaCalificaciones() {
  // CORRECCIÓN: Inicializar datosTemporales si no existen
  if (!datosTemporales || datosTemporales.length === 0) {
    datosTemporales = JSON.parse(JSON.stringify(datos[materiaActual] || []));
  }
  
  const terminoEl = document.getElementById('buscador-calificaciones');
  const termino = terminoEl ? terminoEl.value : '';
  const datosBase = datosTemporales || datos[materiaActual];
  
  if (datosBase && datosBase.length > 0) {
    const datosMostrar = termino ? filtrarDatos(datosBase, termino) : datosBase;
    actualizarTablaCalificacionesConFiltro(datosMostrar);
  } else {
    const tabla = document.getElementById("tabla-calificaciones");
    tabla.querySelectorAll("tr:not(.encabezado)").forEach(tr => tr.remove());
    let fila = tabla.insertRow();
    fila.innerHTML = `<td colspan="100%" style="text-align: center; padding: 20px; color: #666; font-style: italic;">No hay datos disponibles para esta materia</td>`;
  }
}

// Inicializar tabla de asistencia (solo FALTAS editables)
function inicializarTablaAsistencia() {
  // CORRECCIÓN: Inicializar datosTemporales si no existen
  if (!datosTemporales || datosTemporales.length === 0) {
    datosTemporales = JSON.parse(JSON.stringify(datos[materiaActual] || []));
  }
  
  const terminoEl = document.getElementById('buscador-asistencia');
  const termino = terminoEl ? terminoEl.value : '';
  const datosBase = datosTemporales || datos[materiaActual];
  
  if (datosBase && datosBase.length > 0) {
    const datosMostrar = termino ? filtrarDatos(datosBase, termino) : datosBase;
    actualizarTablaAsistenciaConFiltro(datosMostrar);
  } else {
    const tabla = document.getElementById("tabla-asistencia");
    tabla.querySelectorAll("tr:not(.encabezado)").forEach(tr => tr.remove());
    let fila = tabla.insertRow();
    fila.innerHTML = `<td colspan="100%" style="text-align: center; padding: 20px; color: #666; font-style: italic;">No hay datos disponibles para esta materia</td>`;
  }
}

// Actualizar datos temporales cuando se modifica un input
function actualizarDatoTemporal(input) {
  const index = input.getAttribute('data-index');
  const field = input.getAttribute('data-field');
  let value = input.value;
  
  if (field === 'faltas') { value = Number(value) || 0; } else { /* dejar original */ }
  
  if (field === 'obs' || field === 'faltas') { datosTemporales[index][field] = value; } else { // campos de calificacion
    const match = field.match(/^m(\d+)$/);
    if (match) {
      const calIndex = Number(match[1]) - 1;
      datosTemporales[index].calificaciones[calIndex] = Number(value) || 0;
      recalcularPromedioTabla(index);
    }
  }
}

// Recalcular promedio para un registro específico en la tabla
function recalcularPromedioTabla(index) {
  const d = datosTemporales[index];
  const suma = d.calificaciones.reduce((a, b) => a + b, 0);
  // Average on 0-100 scale; keep one decimal and store as Number
  d.prom = d.calificaciones.length > 0 ? Math.round((suma / d.calificaciones.length) * 10) / 10 : 0;
  
  // Actualizar el promedio en la tabla
  const celdaPromedio = document.querySelector(`.promedio[data-index="${index}"]`);
  if (celdaPromedio) { celdaPromedio.textContent = d.prom; }
}

// Guardar cambios desde la tabla de calificaciones
function guardarCambiosTabla() {
  if (!materiaActual) return;
  
  // Copiar datos temporales a datos principales
  // Ensure values are clamped to 0-100 and prom recalculated before saving
  clampAndRecalculate(datosTemporales);
  datos[materiaActual] = JSON.parse(JSON.stringify(datosTemporales));
  
  // Actualizar todas las vistas
  inicializarTabla();
  inicializarTablaCalificaciones();
  inicializarTablaAsistencia();
  
  // Mostrar mensaje de confirmación
  alert('Cambios guardados exitosamente');
}

// Guardar cambios desde la tabla de asistencia
function guardarCambiosAsistencia() {
  if (!materiaActual) return;
  
  // Copiar datos temporales a datos principales
  clampAndRecalculate(datosTemporales);
  datos[materiaActual] = JSON.parse(JSON.stringify(datosTemporales));
  
  // Actualizar todas las vistas
  inicializarTabla();
  inicializarTablaCalificaciones();
  inicializarTablaAsistencia();
  
  // Enviar al servidor
  saveAsistenciaToServer(materiaActual, datos[materiaActual]).then(res => {
    if (res && res.success) {
      alert('Asistencias guardadas exitosamente');
    } else {
      console.error('Guardar asistencia falló', res && res.error);
      alert('Error guardando asistencias en el servidor. Revisa la consola.');
    }
  }).catch(err => { console.error(err); alert('Error de red al guardar asistencias'); });
}
// (La función `cambiarVista` actualizada y asíncrona está definida más arriba —
// eliminada la versión antigua que forzaba recargas para evitar throttling.)

// Funciones existentes para la vista de edición (solo desde vistas específicas)
function abrirEdicion(i) {
  if (!materiaActual) return;
  
  indiceActual = i;
  let d = datos[materiaActual][i];
  const materia = materias[materiaActual];

  document.getElementById("edit-num").value = d.numero;
  document.getElementById("edit-nombre").value = d.nombre;
  document.getElementById("edit-cedula").value = d.cedula;
  
  // Actualizar labels y inputs según la materia
  const formulario = document.querySelector('.formulario');
  let inputsHTML = `
    <label>N°</label>
    <input id="edit-num" disabled>
    <label>Nombre</label>
    <input id="edit-nombre" disabled>
    <label>Cédula</label>
    <input id="edit-cedula" disabled>
  `;
  
  // Agregar inputs para cada item de la materia (escala 0-100)
  materia.items.forEach((item, index) => { inputsHTML += `<label>${item}</label><input id="edit-m${index+1}" type="number" min="0" max="100" step="1" value="${d.calificaciones[index] || 0}">`; });
  
  inputsHTML += `
    <label>Promedio</label>
    <input id="edit-prom" type="number" step="0.1" disabled value="${d.prom}">
    <label>Observaciones</label>
    <input id="edit-obs" type="text" value="${d.obs}">
    <button onclick="guardarCambios()" class="btn-guardar">GUARDAR</button>
    <button onclick="cerrarEdicion()" class="btn-cancelar">CANCELAR</button>
  `;
  
  formulario.innerHTML = inputsHTML;
  
  // Re-agregar event listeners a los nuevos inputs
  for (let i = 1; i <= materia.items.length; i++) { const el = document.getElementById(`edit-m${i}`); if (el) el.addEventListener('input', recalcularPromedioEdicion); }

  const editEl = document.getElementById("vista-edicion");
  if (editEl) editEl.classList.remove('vista-oculta');

  // Record which view was active so we can restore it on cancel
  const vistaCalificacionesEl = document.getElementById("vista-calificaciones");
  const vistaAsistenciaEl = document.getElementById("vista-asistencia");
  if (vistaCalificacionesEl && !vistaCalificacionesEl.classList.contains('vista-oculta')) {
    previousVista = 'calificaciones';
    vistaCalificacionesEl.classList.add('vista-oculta');
  } else if (vistaAsistenciaEl && !vistaAsistenciaEl.classList.contains('vista-oculta')) {
    previousVista = 'asistencia';
    vistaAsistenciaEl.classList.add('vista-oculta');
  } else {
    previousVista = 'principal';
  }
}

function recalcularPromedioEdicion() {
  const materia = materias[materiaActual];
  let suma = 0;
  
  for (let i = 1; i <= materia.items.length; i++) { const v = Number(document.getElementById(`edit-m${i}`).value) || 0; suma += v; }
  
  // Average on 0-100 scale; keep one decimal
  let prom = 0;
  if (materia.items.length > 0) prom = Math.round((suma / materia.items.length) * 10) / 10;
  document.getElementById("edit-prom").value = prom;
}

function guardarCambios() {
  if (!materiaActual) return;
  
  let d = datos[materiaActual][indiceActual];
  const materia = materias[materiaActual];

  // Actualizar calificaciones según cantidad de items
  for (let i = 0; i < materia.items.length; i++) { d.calificaciones[i] = Math.min(100, Math.max(0, Number(document.getElementById(`edit-m${i+1}`).value) || 0)); }

  // Recalculate and clamp prom from current calificaciones
  const suma = d.calificaciones.reduce((a,b) => a + b, 0);
  d.prom = d.calificaciones.length > 0 ? Math.round((suma / d.calificaciones.length) * 10) / 10 : 0;
  d.obs = document.getElementById("edit-obs").value;

  inicializarTabla();
  inicializarTablaCalificaciones();
  inicializarTablaAsistencia();
  cerrarEdicion();
}

// Clamp array of registros' calificaciones to 0-100 and recalc prom
function clampAndRecalculate(registros) {
  if (!Array.isArray(registros)) return;
  registros.forEach(r => {
    if (Array.isArray(r.calificaciones)) {
      r.calificaciones = r.calificaciones.map(v => {
        const num = Number(v) || 0;
        return Math.min(100, Math.max(0, Math.round(num)));
      });
      const suma = r.calificaciones.reduce((a,b) => a + b, 0);
      r.prom = r.calificaciones.length > 0 ? Math.round((suma / r.calificaciones.length) * 10) / 10 : 0;
    }
  });
}

function cerrarEdicion() {
  const editEl = document.getElementById("vista-edicion");
  if (editEl) editEl.classList.add('vista-oculta');

  const vistaCalificaciones = document.getElementById("vista-calificaciones");
  const vistaAsistencia = document.getElementById("vista-asistencia");
  const vistaPrincipal = document.getElementById("vista-principal");
  const tituloPrincipal = document.getElementById("titulo-principal");

  // Restore the previously active view recorded when opening the editor
  if (previousVista === 'calificaciones') {
    if (vistaCalificaciones) vistaCalificaciones.classList.remove('vista-oculta');
    if (vistaPrincipal) vistaPrincipal.classList.add('vista-oculta');
    inicializarTablaCalificaciones();
    tituloPrincipal.textContent = 'CALIFICACIÓN Y ASISTENCIA SOLDADOS';
  } else if (previousVista === 'asistencia') {
    if (vistaAsistencia) vistaAsistencia.classList.remove('vista-oculta');
    if (vistaPrincipal) vistaPrincipal.classList.add('vista-oculta');
    inicializarTablaAsistencia();
    tituloPrincipal.textContent = 'ASISTENCIA SOLDADOS';
  } else {
    // default to principal
    if (vistaPrincipal) vistaPrincipal.classList.remove('vista-oculta');
    if (vistaCalificaciones) vistaCalificaciones.classList.add('vista-oculta');
    if (vistaAsistencia) vistaAsistencia.classList.add('vista-oculta');
    inicializarTabla();
    tituloPrincipal.textContent = 'CALIFICACIÓN Y ASISTENCIA SOLDADOS';
  }

  previousVista = null;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  try {
    // Inicializar aplicación
    inicializarAplicacion();
    
    // Botón CALIFICACIÓN en vista principal (bind by ID for robustness)
    const btnCal = document.getElementById('btn-calificacion') || document.querySelector('#controles-principal .grupo-botones .btn:nth-child(1)');
    if (btnCal) btnCal.addEventListener('click', function() { cambiarVista('calificaciones'); });

    // Botón ASISTENCIA en vista principal (bind by ID for robustness)
    const btnAsis = document.getElementById('btn-asistencia') || document.querySelector('#controles-principal .grupo-botones .btn:nth-child(2)');
    if (btnAsis) btnAsis.addEventListener('click', function() { cambiarVista('asistencia'); });
    
    // Eventos de búsqueda
    // Use the single global buscador-principal for filtering across views
    const bp = document.getElementById('buscador-principal');
    if (bp) bp.addEventListener('input', function() {
      aplicarFiltroPrincipal();
      aplicarFiltroCalificaciones();
      aplicarFiltroAsistencia();
    });
  } catch (err) {
    console.error('Error en DOMContentLoaded init handlers', err);
  }
});

// Support loading a specific view after a reload using ?view=calificaciones or ?view=asistencia
document.addEventListener('DOMContentLoaded', function() {
  try {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const skip = sessionStorage.getItem('skipReloadOnce');

    // If view param present and we haven't just skipped a reload, activate view
    if (view) {
      // Remove the query param from the URL (clean) without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      window.history.replaceState({}, document.title, url.toString());

      // If skip flag is set, clear it and just change view
      if (skip) {
        sessionStorage.removeItem('skipReloadOnce');
        cambiarVista(view);
      } else {
        // If no skip flag, just change view (no reload needed on direct entry)
        cambiarVista(view);
      }
    }
  } catch (e) {
    // ignore
    console.warn('view param handling failed', e);
  }
});

// Helper to force a single reload that retains requested view via ?view=
function reloadToViewOnce(view) {
  try {
    // Prevent rapid repeated navigations which trigger Chromium's
    // "Throttling navigation to prevent the browser from hanging" protection.
    // Use a timestamp guard in sessionStorage so subsequent calls within
    // a short window are ignored.
    const now = Date.now();
    const last = parseInt(sessionStorage.getItem('lastReloadAttempt') || '0', 10);
    if (last && (now - last) < 2000) {
      // If a reload was attempted less than 2s ago, skip this request.
      console.warn('reloadToViewOnce: throttled duplicate reload request');
      return;
    }
    sessionStorage.setItem('lastReloadAttempt', String(now));

    // mark that next load should not trigger another reload
    sessionStorage.setItem('skipReloadOnce', '1');
    const u = new URL(window.location.href);
    u.searchParams.set('view', view);
    // Use replace to avoid stacking history entries and to be a bit kinder to the navigation stack
    window.location.replace(u.toString());
  } catch (e) {
    // fallback: simple reload
    window.location.reload();
  }
}

/* Ensure titles don't leave single letters alone on a new line.
   Walk text nodes under title-like elements and replace a space
   following a single-letter word with a non-breaking space. */
function fixOrphanLettersInTitles() {
  const selectors = 'th, th * , h1, h2, h3, .titulo, .title';
  const nodes = document.querySelectorAll(selectors);

  function replaceInTextNode(text) {
    return text.replace(/(^|\s)([A-Za-zÁÉÍÓÚáéíóúÑñÜü])\s+/g, function(match, p1, p2) {
      return p1 + p2 + '\u00A0';
    });
  }

  nodes.forEach(function(node) {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let tn;
    while (tn = walker.nextNode()) {
      textNodes.push(tn);
    }
    textNodes.forEach(function(t) {
      const original = t.nodeValue;
      const replaced = replaceInTextNode(original);
      if (replaced !== original) t.nodeValue = replaced;
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  try {
    fixOrphanLettersInTitles();
  } catch (err) {
    console.error('Error aplicando fix de letras huérfanas:', err);
  }
});
