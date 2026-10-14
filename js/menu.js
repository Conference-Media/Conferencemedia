/* Site menu: open from the header's Menu button, close with Close, Escape, or any link */
(function(){
  var menu=document.getElementById('menu');if(!menu)return;
  var openers=document.querySelectorAll('[data-menu-open]'),closer=menu.querySelector('[data-menu-close]'),last=null;
  function open(e){last=e&&e.currentTarget;menu.hidden=false;openers.forEach(function(b){b.setAttribute('aria-expanded','true')});document.body.style.overflow='hidden';closer.focus()}
  function close(){menu.hidden=true;openers.forEach(function(b){b.setAttribute('aria-expanded','false')});document.body.style.overflow='';if(last)last.focus()}
  openers.forEach(function(b){b.addEventListener('click',open)});
  closer.addEventListener('click',close);
  menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',close)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!menu.hidden)close()});
})();
