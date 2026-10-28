/* Project galleries: every .gal button opens its photo full size; arrows and swipe move through all photos on the page. The .film block plays the recap in place. */
(function(){
  var btns=[].slice.call(document.querySelectorAll('.gal button'));
  if(btns.length){
    var lb=document.createElement('div');lb.className='lb';lb.hidden=true;lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','Photo viewer');
    lb.innerHTML='<img alt=""><button class="x" type="button" aria-label="Close">×</button><button class="pv" type="button" aria-label="Previous photo">‹</button><button class="nx" type="button" aria-label="Next photo">›</button><p class="n"></p>';
    document.body.appendChild(lb);
    var img=lb.querySelector('img'),n=lb.querySelector('.n'),i=0,last=null;
    function show(k){i=(k+btns.length)%btns.length;var b=btns[i],t=b.querySelector('img');img.src=b.getAttribute('data-full');img.alt=t.alt;n.textContent=(i+1)+' / '+btns.length}
    function open(k){last=document.activeElement;show(k);lb.hidden=false;document.body.style.overflow='hidden';lb.querySelector('.x').focus();if(window.gtag)gtag('event','gallery_open',{page:location.pathname})}
    function close(){lb.hidden=true;document.body.style.overflow='';img.removeAttribute('src');if(last)last.focus()}
    btns.forEach(function(b,k){b.addEventListener('click',function(){open(k)})});
    lb.querySelector('.x').addEventListener('click',close);
    lb.querySelector('.pv').addEventListener('click',function(){show(i-1)});
    lb.querySelector('.nx').addEventListener('click',function(){show(i+1)});
    lb.addEventListener('click',function(e){if(e.target===lb)close()});
    document.addEventListener('keydown',function(e){if(lb.hidden)return;if(e.key==='Escape')close();else if(e.key==='ArrowLeft')show(i-1);else if(e.key==='ArrowRight')show(i+1)});
    var x0=null;lb.addEventListener('touchstart',function(e){x0=e.touches[0].clientX},{passive:true});
    lb.addEventListener('touchend',function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>50)show(dx<0?i+1:i-1);x0=null});
  }
  document.querySelectorAll('.film-frame').forEach(function(f){
    f.addEventListener('click',function(){if(f.querySelector('video,iframe'))return;var yt=f.getAttribute('data-yt'),src=f.getAttribute('data-src'),name=f.getAttribute('aria-label')||'Recap video';
      if(window.gtag)gtag('event','video_play',{video_title:name.replace(/^Play the /,'')});
      if(yt){var i=document.createElement('iframe');i.src='https://www.youtube-nocookie.com/embed/'+yt+'?autoplay=1&rel=0&modestbranding=1&playsinline=1';i.title=name;i.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';i.allowFullscreen=true;i.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0;z-index:2';var w=document.createElement('div');w.className='film-frame';w.style.cursor='auto';w.appendChild(i);f.replaceWith(w);return}
      if(!src)return;
      var v=document.createElement('video');v.controls=true;v.autoplay=true;v.playsInline=true;v.src=src;v.setAttribute('aria-label',name);f.appendChild(v)});
  });
  document.querySelectorAll('[data-film]').forEach(function(a){a.addEventListener('click',function(e){var f=document.querySelector('.film-frame');if(!f)return;e.preventDefault();f.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(function(){f.click()},500)})});
})();
