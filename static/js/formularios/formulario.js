document.addEventListener('DOMContentLoaded', function () {
  // Main DOM refs
  const btnCrear = document.getElementById('btnCrear');
  const btnPreview = document.getElementById('btn-preview');
  const btnVolver = document.getElementById('btn-volver');
  const btnAddPregunta = document.getElementById('btn-add-pregunta');
  const btnEliminarForm = document.getElementById('btn-eliminar-form');
  const btnGuardarForm = document.getElementById('btn-guardar-form');
  const constructorForm = document.getElementById('constructor-form');
  const vistaPrev = document.getElementById('vista-previa');
  const previewContent = document.getElementById('preview-content');
  const contPreguntas = document.getElementById('contenedor-preguntas');
  const tituloInput = document.getElementById('titulo-formulario');
  const estadoForm = document.getElementById('estado-form');
  const estadoTexto = document.getElementById('estado-texto');
  const tabla = document.getElementById('tablaFormularios');

  function actualizarEstadoTexto() {
    if (!estadoForm || !estadoTexto) return;
    if (estadoForm.checked) {
      estadoTexto.textContent = 'ACTIVO';
      estadoTexto.style.color = '#143e34';
    } else {
      estadoTexto.textContent = 'INACTIVO';
      estadoTexto.style.color = '#c11f25';
    }
  }

  // Create a question card element
  function crearPregunta(data = {}) {
    const div = document.createElement('div');
    div.className = 'pregunta-container pregunta';
    div.dataset.id = data.id || 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

    div.innerHTML = `
      <div class="fila-form">
        <label>Pregunta:</label>
        <input type="text" class="preg tituloPregunta" placeholder="Escribe la pregunta" value="${data.pregunta ? escapeHtml(data.pregunta) : ''}">
      </div>
      <div class="fila-form">
        <label>Tipo de respuesta:</label>
        <div style="display:flex; gap:12px; align-items:center; width:100%;">
          <select class="tipo tipo-select">
          <option value="" disabled ${!data.tipo ? 'selected' : ''}>Selecciona</option>
          <option value="texto" ${data.tipo === 'texto' ? 'selected' : ''}>Texto corto</option>
          <option value="texto-largo" ${data.tipo === 'texto-largo' ? 'selected' : ''}>Texto largo</option>
          <option value="opciones" ${data.tipo === 'opciones' ? 'selected' : ''}>Opción múltiple</option>
          <option value="checkbox" ${data.tipo === 'checkbox' ? 'selected' : ''}>Casillas</option>
          <option value="lista" ${data.tipo === 'lista' ? 'selected' : ''}>Lista desplegable</option>
          </select>
          <div class="tipo-indicator" data-tipo="${data.tipo || ''}"></div>
        </div>
      </div>
      <div class="dynamic"></div>
      <div class="oblig-footer">
        <label class="txt-oblig">Obligatorio</label>
        <label class="switch-oblig">
          <input type="checkbox" class="oblig" ${data.obligatorio ? 'checked' : ''}>
          <span class="slider-oblig"></span>
        </label>
        <button class="btn-eliminar-pregunta" title="Eliminar pregunta">Eliminar</button>
        <button class="btn-mover-arriba btn-small" title="Mover arriba">Arriba</button>
        <button class="btn-mover-abajo btn-small" title="Mover abajo">Abajo</button>
      </div>
    `;

    // render dynamic area according to type and provided options
    const selectTipo = div.querySelector('.tipo-select');
    const dynamic = div.querySelector('.dynamic');
    if (data.tipo && data.tipo !== '') renderDynamicField(dynamic, data.tipo, data.opciones || []);

    // attach change listener for type
    selectTipo.addEventListener('change', function (e) {
      renderDynamicField(dynamic, this.value);
      // update visual indicator
      const indicator = div.querySelector('.tipo-indicator');
      if (indicator) updateTipoIndicator(indicator, this.value);
    });

    return div;
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&<>"]/g, function (s) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]);
    });
  }

  // render dynamic input(s) depending on type
  function renderDynamicField(container, tipo, opcionesArray = []) {
    container.innerHTML = '';
    if (tipo === 'texto') {
      container.innerHTML = `<div class="fila-form"><label>Respuesta:</label><input type="text" class="campo-respuesta" placeholder="Respuesta corta"></div>`;
    } else if (tipo === 'texto-largo') {
      container.innerHTML = `<div class="fila-form"><label>Respuesta:</label><textarea class="campo-respuesta" rows="3" placeholder="Respuesta larga"></textarea></div>`;
    } else if (tipo === 'opciones' || tipo === 'checkbox' || tipo === 'lista') {
      const wrapper = document.createElement('div');
      wrapper.className = 'options-container';
      const lista = document.createElement('div');
      lista.className = 'lista-opciones';
      container.appendChild(wrapper);
      wrapper.appendChild(lista);

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'add-option-btn';
      addBtn.textContent = '+';
      wrapper.appendChild(addBtn);

      function addOption(value = '') {
        const item = document.createElement('div');
        item.className = 'option-item';
        item.innerHTML = `<input type="text" class="resp" value="${escapeHtml(value)}" placeholder="Opción"><button type="button" class="remove-option">✕</button>`;
        lista.appendChild(item);
        const btn = item.querySelector('.remove-option');
        btn.addEventListener('click', () => item.remove());
      }

      // load provided options
      if (Array.isArray(opcionesArray) && opcionesArray.length) opcionesArray.forEach(o => addOption(o));

      addBtn.addEventListener('click', () => addOption(''));
    }
      container.innerHTML = '';
      if (tipo === 'texto') {
        container.innerHTML = `
        <div class="fila-form">
          <label>Respuesta:</label>
          <input type="text" class="campo-respuesta" placeholder="Texto de respuesta corta">
        </div>
      `;
      } else if (tipo === 'texto-largo') {
        container.innerHTML = `
        <div class="fila-form">
          <label>Respuesta:</label>
          <textarea class="campo-respuesta" rows="3" placeholder="Texto de respuesta larga"></textarea>
        </div>
      `;
      } else if (tipo === 'opciones' || tipo === 'checkbox' || tipo === 'lista') {
        // Build option list styled like Google Forms
        const wrapper = document.createElement('div');
        wrapper.className = 'options-container';
        const lista = document.createElement('div');
        lista.className = 'lista-opciones';
        wrapper.appendChild(lista);

        // helper to create an option row
        function addOption(value = '', isOther = false) {
          const item = document.createElement('div');
          item.className = 'option-item';

          // left icon (radio / checkbox / number)
          const left = document.createElement('div');
          left.className = 'option-icon';
          if (tipo === 'opciones') {
            left.innerHTML = '<span class="icon-radio">○</span>';
          } else if (tipo === 'checkbox') {
            left.innerHTML = '<span class="icon-check">☐</span>';
          } else if (tipo === 'lista') {
            left.innerHTML = `<span class="icon-num">${lista.children.length + 1}.</span>`;
          }

          const inputWrap = document.createElement('div');
          inputWrap.className = 'option-input-wrap';

          if (isOther) {
            const span = document.createElement('span');
            span.className = 'option-other-label';
            span.textContent = 'Otra respuesta';
            inputWrap.appendChild(span);
          } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'resp';
            input.placeholder = 'Opción';
            input.value = value ? escapeHtml(value) : '';
            inputWrap.appendChild(input);
          }

          const remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'remove-option';
          remove.title = 'Eliminar opción';
          remove.innerHTML = '✕';
          remove.addEventListener('click', () => item.remove());

          item.appendChild(left);
          item.appendChild(inputWrap);
          item.appendChild(remove);
          lista.appendChild(item);
        }

        // add control row: 'Añadir opción' and 'añadir respuesta "Otro"'
        const controls = document.createElement('div');
        controls.className = 'options-controls';
        const addLink = document.createElement('button');
        addLink.type = 'button';
        addLink.className = 'add-option-link';
        addLink.textContent = 'Añadir opción';
        const spacer = document.createElement('span');
        spacer.className = 'or-text';
        spacer.textContent = ' o ';
        const addOther = document.createElement('button');
        addOther.type = 'button';
        addOther.className = 'add-other-link';
        addOther.textContent = 'añadir respuesta "Otro"';

        controls.appendChild(addLink);
        controls.appendChild(spacer);
        controls.appendChild(addOther);

        wrapper.appendChild(controls);

        // Load provided options
        if (Array.isArray(opcionesArray) && opcionesArray.length) {
          opcionesArray.forEach(o => addOption(o));
        } else {
          // default: add 3 empty options like Google Forms
          addOption('Opción 1');
          addOption('Opción 2');
          addOption('Opción 3');
        }

        addLink.addEventListener('click', () => addOption(''));
        addOther.addEventListener('click', () => addOption('Otro', true));

        container.appendChild(wrapper);
      }
  }

  // update the small tipo indicator (icon + label)
  function updateTipoIndicator(indicatorEl, tipo) {
    if (!indicatorEl) return;
    indicatorEl.dataset.tipo = tipo || '';
    const map = {
      'texto': { icon: '≡', text: 'Texto corto' },
      'texto-largo': { icon: '≣', text: 'Texto largo' },
      'opciones': { icon: '◯', text: 'Opción múltiple (única)' },
      'checkbox': { icon: '☑', text: 'Casillas (varias)' },
      'lista': { icon: '▾', text: 'Lista desplegable (única)' }
    };
    const info = map[tipo] || { icon: '', text: '' };
    indicatorEl.innerHTML = info.icon ? `<span class="tipo-icon">${info.icon}</span><span class="tipo-text">${info.text}</span>` : '';
  }

  // add initial event handlers
  if (btnCrear) btnCrear.addEventListener('click', function () {
    // hide listado and preview, show constructor
    const vistaListado = document.getElementById('vista-listado');
    if (vistaListado) vistaListado.classList.add('vista-oculta');
    if (vistaPrev) vistaPrev.classList.add('vista-oculta');
    if (constructorForm) {
      constructorForm.classList.remove('vista-oculta');
      constructorForm.scrollIntoView({ behavior: 'smooth' });
    }
  });

  if (btnAddPregunta) btnAddPregunta.addEventListener('click', function () {
    const nueva = crearPregunta();
    if (contPreguntas) contPreguntas.appendChild(nueva);
    nueva.scrollIntoView({ behavior: 'smooth' });
  });

  // Event delegation for question controls
  if (contPreguntas) {
    contPreguntas.addEventListener('click', function (e) {
      const btn = e.target.closest('button');
      if (!btn) return;

      // eliminar pregunta
      if (btn.classList.contains('btn-eliminar-pregunta')) {
        const card = btn.closest('.pregunta-container');
        if (card) {
          if (confirm('¿Eliminar esta pregunta?')) card.remove();
        }
        return;
      }

      // mover arriba
      if (btn.classList.contains('btn-mover-arriba')) {
        const card = btn.closest('.pregunta-container');
        if (card && card.previousElementSibling) {
          card.parentNode.insertBefore(card, card.previousElementSibling);
        }
        return;
      }

      // mover abajo
      if (btn.classList.contains('btn-mover-abajo')) {
        const card = btn.closest('.pregunta-container');
        if (card && card.nextElementSibling) {
          // swap with next sibling (moves current card down one)
          card.parentNode.insertBefore(card.nextElementSibling, card);
        }
        return;
      }

      // remove option button inside options list
      if (btn.classList.contains('remove-option')) {
        const opt = btn.closest('.option-item');
        if (opt) opt.remove();
        return;
      }
    });

    // delegate change for tipo-select to render dynamic fields (covers newly added selects too)
    contPreguntas.addEventListener('change', function (e) {
      const target = e.target;
      if (target.classList.contains('tipo-select')) {
        const dynamic = target.closest('.pregunta-container').querySelector('.dynamic');
        renderDynamicField(dynamic, target.value);
        // update indicator next to this select
        const indicator = target.closest('.pregunta-container').querySelector('.tipo-indicator');
        if (indicator) updateTipoIndicator(indicator, target.value);
      }
    });
  }

  // Preview
  if (btnPreview) btnPreview.addEventListener('click', function () {
    if (!previewContent) return;
    previewContent.innerHTML = '';
    const titulo = tituloInput && tituloInput.value ? tituloInput.value : 'Formulario';
    const h = document.createElement('h3'); h.textContent = titulo; previewContent.appendChild(h);
    previewContent.appendChild(document.createElement('hr'));

    const preguntas = Array.from(document.querySelectorAll('.pregunta-container'));
    if (preguntas.length === 0) previewContent.appendChild(document.createElement('p')).textContent = 'Sin preguntas';

    preguntas.forEach((p, idx) => {
      const text = p.querySelector('.preg') ? p.querySelector('.preg').value : '';
      const tipo = p.querySelector('.tipo-select') ? p.querySelector('.tipo-select').value : '';
      const oblig = p.querySelector('.oblig') ? p.querySelector('.oblig').checked : false;

      const cont = document.createElement('div'); cont.style.marginBottom = '12px';
      const label = document.createElement('label'); label.innerHTML = `<strong>${idx+1}. ${text || '(Pregunta sin texto)'}${oblig ? ' *' : ''}</strong>`;
      cont.appendChild(label);

      if (tipo === 'texto') {
        const inp = document.createElement('input'); inp.className = 'previewInput'; inp.placeholder = '';
        cont.appendChild(inp);
      } else if (tipo === 'texto-largo') {
        const ta = document.createElement('textarea'); ta.className = 'previewInput'; ta.rows = 3; cont.appendChild(ta);
      } else if (tipo === 'opciones' || tipo === 'checkbox' || tipo === 'lista') {
        const opciones = Array.from(p.querySelectorAll('.resp')).map(r => r.value || '(sin texto)');
        if (tipo === 'lista') {
          const sel = document.createElement('select'); opciones.forEach(o => {
            const opt = document.createElement('option'); opt.textContent = o; sel.appendChild(opt);
          }); cont.appendChild(sel);
        } else {
          opciones.forEach(o => {
            const div = document.createElement('div');
            const inp = document.createElement('input'); inp.type = (tipo === 'checkbox') ? 'checkbox' : 'radio'; inp.name = 'p_' + idx;
            const span = document.createElement('span'); span.textContent = ' ' + o;
            div.appendChild(inp); div.appendChild(span); cont.appendChild(div);
          });
        }
      }

      previewContent.appendChild(cont);
    });

    // toggle views
    if (vistaPrev) vistaPrev.classList.remove('vista-oculta');
    if (constructorForm) constructorForm.classList.add('vista-oculta');
  });

  if (btnVolver) btnVolver.addEventListener('click', function () {
    if (vistaPrev) vistaPrev.classList.add('vista-oculta');
    if (constructorForm) constructorForm.classList.remove('vista-oculta');
  });

  // Guardar formulario (localStorage)
  if (btnGuardarForm) btnGuardarForm.addEventListener('click', function () {
    const titulo = tituloInput ? tituloInput.value.trim() : '';
    if (!titulo) { alert('Asigna un título al formulario antes de guardar.'); return; }

    const preguntas = Array.from(document.querySelectorAll('.pregunta-container')).map(p => {
      const pregunta = p.querySelector('.preg') ? p.querySelector('.preg').value : '';
      const tipo = p.querySelector('.tipo-select') ? p.querySelector('.tipo-select').value : '';
      const obligatorio = p.querySelector('.oblig') ? p.querySelector('.oblig').checked : false;
      const opciones = Array.from(p.querySelectorAll('.resp')).map(r => r.value);
      return { pregunta, tipo, obligatorio, opciones };
    });

    const estado = estadoForm && estadoForm.checked;
    const asignacion = document.getElementById('tipoUsuario') ? document.getElementById('tipoUsuario').value : '';

    const data = { titulo, estado, asignacion, preguntas };
    localStorage.setItem('formulario_creado', JSON.stringify(data));
    alert('Formulario guardado localmente.');
    // After saving, switch back to listado and add entry to the table
    const vistaListado = document.getElementById('vista-listado');
    if (constructorForm) constructorForm.classList.add('vista-oculta');
    if (vistaPrev) vistaPrev.classList.add('vista-oculta');
    if (vistaListado) {
      vistaListado.classList.remove('vista-oculta');
      // add a row to the table to show the saved form
      if (tabla) {
        // remove placeholder empty row
        const empty = tabla.querySelector('.empty');
        if (empty) empty.parentElement.remove();
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input type="checkbox"></td>
          <td>${escapeHtml(titulo)}</td>
          <td>${estado ? 'ACTIVO' : 'INACTIVO'}</td>
          <td>0</td>
          <td>${escapeHtml(asignacion)}</td>
        `;
        tabla.appendChild(tr);
      }
    }
  });

  // Eliminar formulario completo
  if (btnEliminarForm) btnEliminarForm.addEventListener('click', function () {
    if (!confirm('¿Eliminar todo el formulario?')) return;
    if (contPreguntas) contPreguntas.innerHTML = '';
    localStorage.removeItem('formulario_creado');
    // add one empty question to keep UI usable
    if (contPreguntas) contPreguntas.appendChild(crearPregunta());
  });

  // Load saved constructor if exists
  (function cargarGuardado() {
    try {
      const raw = localStorage.getItem('formulario_creado');
      if (!raw) return;
      const obj = JSON.parse(raw);
      if (tituloInput && obj.titulo) tituloInput.value = obj.titulo;
      if (estadoForm && typeof obj.estado !== 'undefined') estadoForm.checked = !!obj.estado;
      actualizarEstadoTexto();
      if (obj.preguntas && Array.isArray(obj.preguntas) && obj.preguntas.length) {
        contPreguntas.innerHTML = '';
        obj.preguntas.forEach(p => {
          contPreguntas.appendChild(crearPregunta(p));
        });
      }
    } catch (err) {
      console.error('Error cargando formulario guardado', err);
    }
  })();

  // ensure there's at least one question
  if (contPreguntas && contPreguntas.querySelectorAll('.pregunta-container').length === 0) {
    contPreguntas.appendChild(crearPregunta());
  }

  // update estado text on toggle
  if (estadoForm) estadoForm.addEventListener('change', actualizarEstadoTexto);

});
