// Marca activo el icono según el parámetro ?brigada= de la URL y
// mejora la navegación en la barra lateral de resultados.
(function(){
	try{
		var params = new URLSearchParams(location.search);
		var sel = (params.get('brigada')||'').trim().toUpperCase();
		var items = document.querySelectorAll('.resultados-nav__btn');
		if(!items.length) return;
		items.forEach(function(a){
			var key = (a.getAttribute('data-brigada')||'').trim().toUpperCase();
			if(sel && key === sel){
				a.classList.add('active');
				a.setAttribute('aria-current','true');
			}
			// Permitir navegación sin recargar repetidamente si ya estamos en la misma brigada
			a.addEventListener('click', function(ev){
				// Si el href ya coincide con el destino actual y está activo, no hagas nada
				if(a.classList.contains('active')){ return; }
			});
		});
	}catch(err){ /* no-op */ }
})();

