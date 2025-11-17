document.addEventListener('DOMContentLoaded', function(){
  const grid = document.getElementById('batallones-grid');
  if(!grid) return;
  const emptyMsg = document.getElementById('batallones-empty');
  if(emptyMsg){
    // fallback: try to render battalion cards from known brigade folders
    const brigadaRaw = grid.dataset.brigada || '';
    const brigada = brigadaRaw.trim().toUpperCase();
    const base = grid.dataset.staticBase || '/static/images/tercedivi/';
    const compUrl = grid.dataset.compUrl || '/';

    const mapping = [
      {
        test: s => s.includes('FUDRA') && s.includes('2'),
        folder: 'BATALLONES_FUDRA_2',
        files: ['BADRA4.png','BADRA5.png','BADRA6.png','BADRE4.png'],
        type: 'FUDRA'
      },
      {
        test: s => s.includes('FUDRA') && s.includes('4'),
        folder: 'BATALLONES_FUDRA_4',
        files: ['BADRA10.png','BADRA11.png','BADRA12.png','BADRE4.png'],
        type: 'FUDRA'
      },
      {
        test: s => s.includes('HERCULES') || s.includes('HÉRCULES'),
        folder: 'BATALLONES_FUERZA_DE_TAREA_HERCULES',
        files: ['BASGO53.png','BATOT14.png','BATOT15.png','BATOT16.png'],
        type: 'OTRAS'
      }
    ];

    let entry = mapping.find(m => m.test(brigada));
    if(!entry){
      // try partial matches (contains FUDRA)
      entry = mapping.find(m => brigada.includes('FUDRA') && m.folder.includes('FUDRA')) || null;
    }

    if(!entry){
      // nothing to show
      emptyMsg.textContent = 'No hay imágenes disponibles para esta brigada.';
      return;
    }

    // clear empty message
    emptyMsg.remove();

    // for each candidate file, attempt to load and show card on success
    entry.files.forEach(fname => {
      const url = base + entry.folder + '/' + fname;
      const img = new Image();
      img.onload = function(){
        // derive battalion name from filename (extract number)
        const m = fname.match(/(\d{1,3})/);
        let num = m? m[1] : '';
        let displayName = fname.replace(/\.[a-zA-Z]+$/,'').replace(/_/g,' ').toUpperCase();
        if(num){
          if(entry.type === 'FUDRA') displayName = 'Batallón de Despliegue Rápido No. ' + num;
          else displayName = 'Batallón No. ' + num;
        }

        const a = document.createElement('a');
        a.className = 'battalion-card';
        const href = compUrl + '?brigada=' + encodeURIComponent(brigadaRaw) + '&batallon=' + encodeURIComponent(displayName);
        a.href = href;

        const content = document.createElement('div'); content.className = 'card-content';
        const iconWrap = document.createElement('div'); iconWrap.className = 'icon-wrap';
        const emblem = document.createElement('img'); emblem.src = url; emblem.alt = displayName + ' emblem'; emblem.loading = 'lazy';
        iconWrap.appendChild(emblem);
        const title = document.createElement('h3'); title.className = 'card-title'; title.textContent = displayName;
        content.appendChild(iconWrap); content.appendChild(title);
        a.appendChild(content);
        grid.appendChild(a);
      };
      img.onerror = function(){ /* skip missing file */ };
      img.src = url;
    });
  }
});
