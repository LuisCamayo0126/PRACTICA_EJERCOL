document.addEventListener('DOMContentLoaded', function() {
  // Basic interactions for the Formularios page
  const btnCrear = document.getElementById('btnCrear');
  const btnEdit = document.getElementById('btnEdit');
  const btnDelete = document.getElementById('btnDelete');
  const constructorForm = document.getElementById('constructor-form');
  const vistaPrev = document.getElementById('vista-previa');
  const listado = document.getElementById('vista-listado');
  const tabla = document.getElementById('tablaFormularios');
  let selectedFormId = null;
  let editingFormId = null; // when editing an existing form

  function showConstructor() {
    constructorForm.classList.remove('vista-oculta');
    vistaPrev.classList.add('vista-oculta');
    if (listado) listado.classList.add('hidden');
    // scroll into view
    constructorForm.scrollIntoView({behavior:'smooth'});
  }

  function hideConstructor() {
    constructorForm.classList.add('vista-oculta');
    if (listado) listado.classList.remove('hidden');
  }

  if (btnCrear) btnCrear.addEventListener('click', function(){
    editingFormId = null;
    showConstructor();
    // move focus to the title input for faster data entry
    const titulo = document.getElementById('titulo-formulario');
    if (titulo) { setTimeout(()=> titulo.focus(), 120); }
  });

  function updateActionButtons(){
    if (selectedFormId){
      btnEdit.classList.remove('disabled');
      btnDelete.classList.remove('disabled');
    } else {
      btnEdit.classList.add('disabled');
      btnDelete.classList.add('disabled');
    }
  }

  // Cancel button inside constructor: close and return to listing
  const btnCancelar = document.getElementById('btn-cancelar');
  if (btnCancelar) btnCancelar.addEventListener('click', function(e){
    e.preventDefault();
    hideConstructor();
    // smooth scroll back to listing
    if (listado) listado.scrollIntoView({behavior:'smooth'});
  });

  const btnPreview = document.getElementById('btn-preview');
  const btnVolver = document.getElementById('btn-volver');
  if (btnPreview) btnPreview.addEventListener('click', function(){
    // simple preview: if there are questions, show preview content
    const previewContent = document.getElementById('preview-content');
    if (previewContent) previewContent.innerHTML = '<p>Vista previa del formulario (placeholder).</p>';
    vistaPrev.classList.remove('vista-oculta');
    constructorForm.classList.add('vista-oculta');
    if (listado) listado.classList.add('hidden');
  });
  if (btnVolver) btnVolver.addEventListener('click', function(){
    vistaPrev.classList.add('vista-oculta');
    constructorForm.classList.remove('vista-oculta');
    // keep listado hidden while editing/previewing; user can close constructor to return to table
  });

  // Simple storage for created forms: demo only
  function addDemoRow(name, estado, respuestas, asignaciones) {
    // remove empty placeholder row
    if (tabla) {
      if (tabla.querySelector('tr td.empty')) tabla.innerHTML = '';
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><input type="checkbox" class="select-form"/></td><td>${name}</td><td>${estado}</td><td>${respuestas}</td><td>${asignaciones}</td>`;
      tabla.appendChild(tr);
    }
  }

  // QUESTION MANAGEMENT
  const contenedorPreguntas = document.getElementById('contenedor-preguntas');
  let preguntaCounter = contenedorPreguntas ? contenedorPreguntas.querySelectorAll('.pregunta-card').length : 0;

  function createQuestionCard(id){
    const div = document.createElement('div');
    div.className = 'pregunta-card';
    div.innerHTML = `
      <div class="pregunta-row">
        <label>Pregunta:</label>
        <input type="text" id="pregunta-${id}" placeholder="Escribe la pregunta">
      </div>
      <div class="pregunta-row" style="margin-top:10px;">
        <label>Tipo de respuesta:</label>
        <select id="tipo-respuesta-${id}">
          <option value="" selected>Selecciona</option>
          <option value="texto">Respuesta corta</option>
          <option value="parrafo">Párrafo</option>
          <option value="opcion">Opción única</option>
          <option value="multiple">Opción múltiple</option>
        </select>
      </div>
      <div class="pregunta-row" style="margin-top:12px; justify-content:space-between; align-items:center;">
        <div class="obligatorio"><strong>Obligatorio</strong>
          <label class="switch" style="margin-left:8px;">
            <input type="checkbox" id="obligatorio-${id}">
            <span class="slider"></span>
          </label>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn-eliminar">Eliminar</button>
          <button class="btn-mini btn-arriba">Arriba</button>
          <button class="btn-mini btn-abajo">Abajo</button>
        </div>
      </div>
      <div class="pregunta-row opciones-container" style="display:none; margin-top:12px;">
        <div style="width:100%;">
          <label>Opciones:</label>
          <div class="opciones-list" data-pregunta-id="${id}"></div>
          <button class="btn-mini btn-add-opcion" data-pregunta-id="${id}">Agregar opción</button>
        </div>
      </div>
      <div class="pregunta-row answer-preview" style="display:none; margin-top:12px;">
        <!-- Aquí se renderiza el control de respuesta (input corto, textarea, radios/checkboxes) -->
      </div>
    `;
    return div;
  }

  // Add initial counter if none
  if (preguntaCounter === 0 && contenedorPreguntas) {
    preguntaCounter = 1; // already has one example in template, ensure IDs align
  }

  // Add question button
  const btnAddPregunta = document.getElementById('btn-add-pregunta');
  if (btnAddPregunta && contenedorPreguntas) {
    btnAddPregunta.addEventListener('click', function(e){
      e.preventDefault();
      preguntaCounter += 1;
      const card = createQuestionCard(preguntaCounter);
      contenedorPreguntas.appendChild(card);
      // focus the new question input
      const input = card.querySelector('input[type="text"]');
      if (input) input.focus();
    });
  }

  // Delegated events for contenedorPreguntas
  if (contenedorPreguntas) {
    contenedorPreguntas.addEventListener('change', function(e){
      const target = e.target;
      // handle tipo de respuesta change
      if (target && target.id && target.id.indexOf('tipo-respuesta-') === 0) {
        const val = target.value;
        const card = target.closest('.pregunta-card');
        if (!card) return;
        const opcionesRow = card.querySelector('.opciones-container');
        const opcionesList = opcionesRow ? opcionesRow.querySelector('.opciones-list') : null;
        const previewRow = card.querySelector('.answer-preview');
        // helper to render preview control
        function renderPreview(type){
          if (!previewRow) return;
          previewRow.style.display = 'block';
          previewRow.innerHTML = '';
          if (type === 'texto'){
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.className = 'respuesta-corta';
            inp.placeholder = 'Respuesta corta';
            // vista previa interactiva: permitir selección/entrada
            previewRow.appendChild(inp);
          } else if (type === 'parrafo'){
            const ta = document.createElement('textarea');
            ta.className = 'respuesta-parrafo';
            ta.placeholder = 'Respuesta (texto largo)';
            ta.rows = 4;
            previewRow.appendChild(ta);
          } else if (type === 'opcion' || type === 'multiple'){
            // render options as radios or checkboxes based on existing opciones-list
            if (!opcionesList) { previewRow.style.display = 'none'; return; }
            const items = opcionesList.querySelectorAll('.opcion-item .input-opcion');
            const container = document.createElement('div');
            container.className = 'preview-options';
            const name = 'preview_opt_' + (card.querySelector('select') ? card.querySelector('select').id : Math.random());
            items.forEach((i, idx) => {
              const label = document.createElement('label');
              label.style.display = 'block';
              const input = document.createElement('input');
              input.type = (type === 'opcion') ? 'radio' : 'checkbox';
              input.name = name;
              // allow interaction in preview
              input.style.marginRight = '8px';
              label.appendChild(input);
              const span = document.createElement('span');
              span.textContent = i.value || ('Opción ' + (idx+1));
              label.appendChild(span);
              container.appendChild(label);
            });
            previewRow.appendChild(container);
          } else {
            previewRow.style.display = 'none';
          }
        }
        if (val === 'opcion' || val === 'multiple') {
          if (opcionesRow) opcionesRow.style.display = 'block';
          // ensure at least two option inputs exist
          if (opcionesList && opcionesList.children.length === 0) {
            for (let i=1;i<=2;i++){
              const optDiv = document.createElement('div');
              optDiv.className = 'opcion-item';
              optDiv.innerHTML = `<input type="text" class="input-opcion" placeholder="Opción ${i}"> <button class="btn-mini remove-opcion">Eliminar</button>`;
              opcionesList.appendChild(optDiv);
            }
          }
          // render preview as options
          renderPreview(val);
        } else {
          if (opcionesRow) opcionesRow.style.display = 'none';
          if (opcionesList) opcionesList.innerHTML = '';
          // render short text or paragraph
          renderPreview(val);
        }
      }
    });

    contenedorPreguntas.addEventListener('click', function(e){
      const target = e.target;
      if (target.classList.contains('btn-eliminar')){
        // remove question card
        const card = target.closest('.pregunta-card');
        if (card) card.remove();
      }

      if (target.classList.contains('btn-arriba')){
        // scroll to top of constructor
        const constructor = document.getElementById('constructor-form');
        if (constructor) constructor.scrollIntoView({behavior:'smooth', block:'start'});
      }

      if (target.classList.contains('btn-abajo')){
        // scroll to bottom of constructor
        const constructor = document.getElementById('constructor-form');
        if (constructor) constructor.scrollIntoView({behavior:'smooth', block:'end'});
      }

      if (target.classList.contains('btn-add-opcion')){
        const pid = target.getAttribute('data-pregunta-id');
        const opcionesList = target.parentElement.querySelector('.opciones-list');
        if (opcionesList){
          const count = opcionesList.querySelectorAll('.opcion-item').length + 1;
          const optDiv = document.createElement('div');
          optDiv.className = 'opcion-item';
          optDiv.innerHTML = `<input type="text" class="input-opcion" placeholder="Opción ${count}"> <button class="btn-mini remove-opcion">Eliminar</button>`;
          opcionesList.appendChild(optDiv);
          // update preview if necessary
          const card = target.closest('.pregunta-card');
          if (card){
            const tipo = (card.querySelector('select') || {}).value || '';
            const previewRow = card.querySelector('.answer-preview');
            if (previewRow && (tipo === 'opcion' || tipo === 'multiple')){
              // trigger a change-like refresh by re-rendering preview
              const evt = new Event('change');
              const sel = card.querySelector('select');
              if (sel) sel.dispatchEvent(evt);
            }
          }
        }
      }

      if (target.classList.contains('remove-opcion')){
        const item = target.closest('.opcion-item');
        if (item) item.remove();
        // refresh preview after removal
        const card = target.closest('.pregunta-card');
        if (card){
          const sel = card.querySelector('select');
          if (sel){
            const evt = new Event('change'); sel.dispatchEvent(evt);
          }
        }
      }
    });
  }

  // Handle selection of forms in the table (single-select)
  if (tabla){
    tabla.addEventListener('change', function(e){
      const t = e.target;
      if (t && t.classList && t.classList.contains('select-form')){
        // uncheck other checkboxes
        const all = tabla.querySelectorAll('.select-form');
        all.forEach(cb => { if (cb !== t) cb.checked = false; });
        if (t.checked){
          selectedFormId = t.value || t.closest('tr')?.getAttribute('data-form-id');
        } else {
          selectedFormId = null;
        }
        updateActionButtons();
      }
    });
  }

  // Bottom buttons: eliminar formulario, guardar formulario
  const btnEliminarForm = document.getElementById('btn-eliminar-form');
  if (btnEliminarForm && contenedorPreguntas){
    btnEliminarForm.addEventListener('click', function(e){
      e.preventDefault();
      if (!confirm('¿Eliminar este formulario y todas sus preguntas?')) return;
      // clear questions and reset to a single blank card
      contenedorPreguntas.innerHTML = '';
      preguntaCounter = 1;
      const initial = createQuestionCard(1);
      contenedorPreguntas.appendChild(initial);
    });
  }

  // Edit / Delete actions from lateral panel
  if (btnEdit){
    btnEdit.addEventListener('click', async function(e){
      e.preventDefault();
      if (!selectedFormId){ alert('Seleccione un formulario para editar'); return; }
      try {
        const resp = await fetch(`/accounts/formularios/${selectedFormId}/json/`, { credentials: 'same-origin' });
        const data = await resp.json();
        if (!resp.ok || !data.success){ alert('No se pudo cargar el formulario: ' + (data.error || 'error')); return; }
        const f = data.form;
        // populate constructor
        editingFormId = f.id;
        const titulo = document.getElementById('titulo-formulario'); if (titulo) titulo.value = f.title || '';
        const tipoUsuario = document.getElementById('tipoUsuario'); if (tipoUsuario) tipoUsuario.value = f.role || '';
        const estado = document.getElementById('estado-form'); if (estado) estado.checked = !!f.estado;
        // clear existing questions
        contenedorPreguntas.innerHTML = '';
        preguntaCounter = 0;
        // create question cards from data
        (f.questions || []).forEach((q, idx) => {
          preguntaCounter += 1;
          const card = createQuestionCard(preguntaCounter);
          // insert card
          contenedorPreguntas.appendChild(card);
          // populate values
          const textInput = card.querySelector('input[id^="pregunta-"]'); if (textInput) textInput.value = q.text || '';
          const sel = card.querySelector('select'); if (sel) sel.value = q.type || '';
          const req = card.querySelector('.obligatorio input[type="checkbox"]'); if (req) req.checked = !!q.required;
          // if options, add them
          if (q.type === 'opcion' || q.type === 'multiple'){
            const opcionesRow = card.querySelector('.opciones-container'); if (opcionesRow) opcionesRow.style.display = 'block';
            const opcionesList = card.querySelector('.opciones-list');
            if (opcionesList){
              opcionesList.innerHTML = '';
              (q.options || []).forEach((optText, i) => {
                const optDiv = document.createElement('div');
                optDiv.className = 'opcion-item';
                optDiv.innerHTML = `<input type="text" class="input-opcion" value="${optText}"> <button class="btn-mini remove-opcion">Eliminar</button>`;
                opcionesList.appendChild(optDiv);
              });
            }
          }
          // trigger change to render preview
          const evt = new Event('change'); const sel2 = card.querySelector('select'); if (sel2) sel2.dispatchEvent(evt);
        });
        showConstructor();
      } catch (err){ console.error(err); alert('Error al cargar el formulario'); }
    });
  }

  if (btnDelete){
    btnDelete.addEventListener('click', async function(e){
      e.preventDefault();
      if (!selectedFormId){ alert('Seleccione un formulario para eliminar'); return; }
      if (!confirm('¿Eliminar el formulario seleccionado? Esta acción no se puede deshacer.')) return;
      try {
        function getCookie(name) {
          let cookieValue = null;
          if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
              const cookie = cookies[i].trim();
              if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
              }
            }
          }
          return cookieValue;
        }
        const csrftoken = getCookie('csrftoken');
        const resp = await fetch('/accounts/formularios/eliminar/', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {'Content-Type':'application/json','X-CSRFToken': csrftoken},
          body: JSON.stringify({form_id: selectedFormId})
        });
        const data = await resp.json();
        if (resp.ok && data.success){
          // remove row from table
          const row = tabla.querySelector(`tr[data-form-id="${selectedFormId}"]`);
          if (row) row.remove();
          selectedFormId = null; editingFormId = null; updateActionButtons();
          alert('Formulario eliminado');
        } else {
          alert('Error al eliminar: ' + (data.error || JSON.stringify(data)));
        }
      } catch (err){ console.error(err); alert('Error de red al eliminar'); }
    });
  }

  const btnGuardarForm = document.getElementById('btn-guardar-form');
  if (btnGuardarForm){
    btnGuardarForm.addEventListener('click', async function(e){
      e.preventDefault();
      // gather form payload
      const titulo = document.getElementById('titulo-formulario');
      const estado = document.getElementById('estado-form');
      const tipoUsuario = document.getElementById('tipoUsuario');
      const cards = contenedorPreguntas ? Array.from(contenedorPreguntas.querySelectorAll('.pregunta-card')) : [];
      const questions = cards.map(card => {
        // Pregunta: input con id que empieza por pregunta-
        const textInput = card.querySelector('input[id^="pregunta-"]');
        const text = textInput ? (textInput.value || '') : '';
        const tipoSel = card.querySelector('select') || {};
        const type = tipoSel.value || '';
        // Obligatorio: checkbox dentro del contenedor .obligatorio
        const reqChk = card.querySelector('.obligatorio input[type="checkbox"]');
        const required = !!(reqChk && reqChk.checked);
        const opciones = [];
        const opcionesList = card.querySelectorAll('.opcion-item .input-opcion');
        opcionesList.forEach(i => { if (i && i.value) opciones.push(i.value); });
        return { text: text, type: type, required: required, options: opciones };
      });

      const payload = {
        title: titulo ? titulo.value : '',
        role: tipoUsuario ? tipoUsuario.value : '',
        estado: estado ? !!estado.checked : true,
        questions: questions
      };

      if (editingFormId) payload.form_id = editingFormId;

      try {
        // attach CSRF token for Django and send credentials
        function getCookie(name) {
          let cookieValue = null;
          if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
              const cookie = cookies[i].trim();
              if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
              }
            }
          }
          return cookieValue;
        }
        const csrftoken = getCookie('csrftoken');

        const resp = await fetch('/accounts/formularios/guardar/', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
            body: JSON.stringify(payload)
          });
        const data = await resp.json();
        if (resp.ok && data.success){
          // guardado ok -> recargar lista para ver cambios
          window.location.reload();
        } else {
          alert('Error al guardar: ' + (data.error || JSON.stringify(data)));
        }
      } catch (err){
        alert('Error de red al intentar guardar.');
        console.error(err);
      }
    });
  }

  // Demo rows (can be removed)
  // Demo rows removed so table starts empty by default

  // Position the lateral panel 8px below the golden header line
  function positionLateralPanel(){
    const panel = document.querySelector('.panel-lateral');
    const headerLine = document.querySelector('.header-line');
    const siteWrap = document.querySelector('.site-wrap');
    if (!panel || !headerLine || !siteWrap) return;

    // Ensure panel uses the fixed helper class
    panel.classList.add('fixed');

    // Compute top: headerLine bottom (relative to viewport) + page scroll + 8px gap
    const headerRect = headerLine.getBoundingClientRect();
    const topPx = headerRect.bottom + window.scrollY + 8; // 8px gap as requested

    // Align left with site-wrap left + small offset so it sits inside layout
    const siteRect = siteWrap.getBoundingClientRect();
    const leftPx = siteRect.left + 12; // 12px from container left

    panel.style.top = topPx + 'px';
    panel.style.left = leftPx + 'px';

    // If the listado (table area) is visible, shift it to the right so it doesn't sit under the panel
    const listado = document.getElementById('vista-listado');
    if (listado) {
      const panelRect = panel.getBoundingClientRect();
      // add a small gap of 24px between panel and listado
      const gap = 24;
      // only apply margin if listado is not hidden
      const isHidden = listado.classList.contains('hidden');
      if (!isHidden) {
        listado.style.marginLeft = (panelRect.width + gap) + 'px';
      } else {
        listado.style.marginLeft = '';
      }
    }
  }

  // Run on load and on resize/scroll to keep it aligned
  positionLateralPanel();
  // Ensure main header (page content) sits 16px below the golden header line
  function positionMainBelowHeader(){
    const headerLine = document.querySelector('.header-line');
    const siteWrap = document.querySelector('.site-wrap');
    const main = document.querySelector('main.flex-main');
    if (!headerLine || !siteWrap || !main) return;
    // Fixed small gap: set margin-top to 4px so header appears close to the golden line
    main.style.marginTop = '4px';
  }

  positionMainBelowHeader();
  window.addEventListener('resize', function(){ positionLateralPanel(); positionMainBelowHeader(); });
  window.addEventListener('scroll', function(){ positionLateralPanel(); positionMainBelowHeader(); });
  window.addEventListener('resize', function(){ positionLateralPanel(); });
  window.addEventListener('scroll', function(){ positionLateralPanel(); });

});
