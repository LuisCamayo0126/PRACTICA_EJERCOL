document.addEventListener('DOMContentLoaded', function() {
  // Basic interactions for the Formularios page
  const btnCrear = document.getElementById('btnCrear');
  const btnEdit = document.getElementById('btnEdit');
  const btnDelete = document.getElementById('btnDelete');
  const constructorForm = document.getElementById('constructor-form');
  const vistaPrev = document.getElementById('vista-previa');
  const tabla = document.getElementById('tablaFormularios');

  function showConstructor() {
    constructorForm.classList.remove('vista-oculta');
    vistaPrev.classList.add('vista-oculta');
    // scroll into view
    constructorForm.scrollIntoView({behavior:'smooth'});
  }

  function hideConstructor() {
    constructorForm.classList.add('vista-oculta');
  }

  if (btnCrear) btnCrear.addEventListener('click', function(){
    showConstructor();
  });

  const btnPreview = document.getElementById('btn-preview');
  const btnVolver = document.getElementById('btn-volver');
  if (btnPreview) btnPreview.addEventListener('click', function(){
    // simple preview: if there are questions, show preview content
    const previewContent = document.getElementById('preview-content');
    if (previewContent) previewContent.innerHTML = '<p>Vista previa del formulario (placeholder).</p>';
    vistaPrev.classList.remove('vista-oculta');
    constructorForm.classList.add('vista-oculta');
  });
  if (btnVolver) btnVolver.addEventListener('click', function(){
    vistaPrev.classList.add('vista-oculta');
    constructorForm.classList.remove('vista-oculta');
  });

  // Simple storage for created forms: demo only
  function addDemoRow(name, estado, respuestas, asignaciones) {
    // remove empty placeholder row
    if (tabla) {
      if (tabla.querySelector('tr td.empty')) tabla.innerHTML = '';
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><input type="checkbox"/></td><td>${name}</td><td>${estado}</td><td>${respuestas}</td><td>${asignaciones}</td>`;
      tabla.appendChild(tr);
    }
  }

  // Demo rows (can be removed)
  addDemoRow('CALIFICACIÓN A INSTRUCTORES', 'ACTIVO', 30, 'SOLDADOS');
  addDemoRow('PARCIAL MATERIA 1', 'INACTIVO', 32, 'SOLDADOS');

});
