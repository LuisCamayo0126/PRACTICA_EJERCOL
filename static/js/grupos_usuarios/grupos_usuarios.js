document.addEventListener('DOMContentLoaded', function(){
  // Enhance UX: table search/filtering per table
  console.debug('grupos_usuarios JS loaded');
  const searches = document.querySelectorAll('.table-search');
  searches.forEach(function(inp){
    inp.addEventListener('input', function(e){
      const target = inp.getAttribute('data-target');
      if (!target) return;
      const tbody = document.querySelector(`#tabla-${target}`) || document.querySelector(`#tabla-${target} tbody`) || null;
      // fallback: try to find table by role name
      let tableBody = null;
      if (!tbody){
        const tables = document.querySelectorAll('.tabla-datos');
        tables.forEach(function(t){
          if (t.closest('.panel-contenido') && t.closest('.panel-contenido').querySelector('.panel-title') && t.closest('.panel-contenido').querySelector('.panel-title').textContent.toLowerCase().includes(target)){
            tableBody = t.querySelector('tbody');
          }
        });
      } else {
        tableBody = tbody;
      }
      if (!tableBody) return;
      const q = inp.value.trim().toLowerCase();
      Array.from(tableBody.querySelectorAll('tr')).forEach(function(row){
        const text = row.textContent.trim().toLowerCase();
        if (q === '' || text.indexOf(q) !== -1){ row.style.display = ''; }
        else { row.style.display = 'none'; }
      });
    });
  });

  // AJAX loader: fetch data and populate tables
  async function loadGroupsData(){
    try{
      const resp = await fetch('/accounts/grupos-usuarios/json/', { credentials: 'same-origin' });
      if (!resp.ok){ console.error('Failed to load groups JSON', resp.status); return; }
      const json = await resp.json();
      if (!json.success){ console.error('groups json error', json); return; }
      const data = json.data || {};
      // update counts
      const countAdmins = document.getElementById('count-admins');
      const countInstructors = document.getElementById('count-instructors');
      const countSoldados = document.getElementById('count-soldados');
      if (countAdmins) countAdmins.textContent = (data.admins||[]).length;
      if (countInstructors) countInstructors.textContent = (data.instructors||[]).length;
      if (countSoldados) countSoldados.textContent = (data.soldados||[]).length;

      // populate tables
      function buildRows(arr){
        if (!arr || !arr.length) return '<tr><td colspan="4" class="empty">Sin registros</td></tr>';
        return arr.map(u => `<tr><td>${escapeHtml(u.last_name)}</td><td>${escapeHtml(u.first_name)}</td><td>${escapeHtml(u.email)}</td><td>${escapeHtml(u.telefono)}</td></tr>`).join('');
      }
      const tbodyInstructors = document.getElementById('tbody-instructors');
      const tbodySoldados = document.getElementById('tbody-soldados');
      if (tbodyInstructors) tbodyInstructors.innerHTML = buildRows(data.instructors || []);
      if (tbodySoldados) tbodySoldados.innerHTML = buildRows(data.soldados || []);
    }catch(err){ console.error('Error loading groups data', err); }
  }

  // simple HTML escape
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]; }); }

  loadGroupsData();
});
