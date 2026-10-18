/* Site menu: open from the header's Menu button, close with Close, Escape, or any link */
(function(){
  var menu=document.getElementById('menu');if(!menu)return;
  var openers=document.querySelectorAll('[data-menu-open]'),closer=menu.querySelector('[data-menu-close]'),last=null;
  function open(e){last=e&&e.currentTarget;clearTimeout(tm);menu.classList.remove('closing');menu.hidden=false;openers.forEach(function(b){b.setAttribute('aria-expanded','true')});document.body.style.overflow='hidden';closer.focus()}
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,tm;
  function close(){if(menu.hidden||menu.classList.contains('closing'))return;openers.forEach(function(b){b.setAttribute('aria-expanded','false')});document.body.style.overflow='';
    function done(){menu.classList.remove('closing');menu.hidden=true;if(last)last.focus()}
    if(reduce)return done();menu.classList.add('closing');clearTimeout(tm);tm=setTimeout(done,420)}
  openers.forEach(function(b){b.addEventListener('click',open)});
  closer.addEventListener('click',close);
  menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',close)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!menu.hidden)close()});
})();
