/* Homepage audience sliders: no arrows. They advance one photo every 4 seconds while on screen, loop forever, and pause while someone hovers, touches or drags them. Phones swipe; desktop mice can click and drag. The photos are copied once before and once after, and when the strip lands in a copy it jumps back to the matching real photo without visibly moving. Tapping a photo (or its copy) opens the gallery lightbox from gallery.js. */
(function(){
  var still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.slider').forEach(function(s,k){
    var t=s.querySelector('.strip'),real=[].slice.call(t.children),n=real.length;if(n<2)return;
    function copy(b){var c=b.cloneNode(true);c.setAttribute('aria-hidden','true');c.tabIndex=-1;c.removeAttribute('data-full');var im=c.querySelector('img');im.alt='';im.loading='lazy';c.addEventListener('click',function(){b.click()});return c}
    var first=real[0];real.forEach(function(b){t.insertBefore(copy(b),first)});real.forEach(function(b){t.appendChild(copy(b))});
    function step(){return real[1].offsetLeft-real[0].offsetLeft}
    function jump(x){t.style.scrollBehavior='auto';t.scrollLeft=x;t.offsetHeight;t.style.scrollBehavior=''}
    function pos(){return Math.round(t.scrollLeft/step())}
    function wrap(){var i=pos();if(i<n)jump(t.scrollLeft+n*step());else if(i>=2*n)jump(t.scrollLeft-n*step())}
    function go(d){wrap();t.scrollTo({left:(pos()+d)*step(),behavior:'smooth'})}
    var idle=0;t.addEventListener('scroll',function(){clearTimeout(idle);idle=setTimeout(wrap,160)},{passive:true});
    window.addEventListener('resize',function(){jump((n+((pos()%n)+n)%n)*step())});
    t.addEventListener('keydown',function(e){if(e.target!==t)return;if(e.key==='ArrowRight'){e.preventDefault();go(1)}else if(e.key==='ArrowLeft'){e.preventDefault();go(-1)}});
    jump(n*step());

    /* autoplay: only while visible, never while someone is interacting, never with reduced motion */
    var hold=0,seen=false,timer=0,resume=0;
    function tick(){if(!still&&seen&&!hold&&!document.hidden)go(1)}
    function start(){clearInterval(timer);timer=setInterval(tick,4000)}
    function pause(){hold++}function unpause(ms){clearTimeout(resume);resume=setTimeout(function(){hold=Math.max(0,hold-1);start()},ms||0)}
    if('IntersectionObserver' in window)new IntersectionObserver(function(e){seen=e[0].isIntersecting},{threshold:.5}).observe(t);else seen=true;
    t.addEventListener('mouseenter',pause);t.addEventListener('mouseleave',function(){unpause(0)});
    t.addEventListener('touchstart',function(){pause()},{passive:true});t.addEventListener('touchend',function(){unpause(5000)},{passive:true});
    t.addEventListener('focusin',pause);t.addEventListener('focusout',function(){unpause(0)});
    setTimeout(start,k*1300);

    /* desktop: click and drag; a real drag doesn't count as a click on the photo */
    var x0=0,l0=0,down=false,moved=false;
    t.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse'||e.button!==0)return;down=true;moved=false;x0=e.clientX;l0=t.scrollLeft});
    window.addEventListener('pointermove',function(e){if(!down)return;var dx=e.clientX-x0;if(!moved&&Math.abs(dx)>5){moved=true;t.classList.add('drag')}if(moved){e.preventDefault();t.scrollLeft=l0-dx}});
    window.addEventListener('pointerup',function(){if(!down)return;down=false;if(!moved)return;t.classList.remove('drag');var dir=t.scrollLeft-l0;t.scrollTo({left:(dir>0?Math.ceil:Math.floor)(t.scrollLeft/step()-(dir>0?.15:-.15))*step(),behavior:'smooth'})});
    t.addEventListener('click',function(e){if(moved){e.stopPropagation();e.preventDefault();moved=false}},true);
    t.addEventListener('dragstart',function(e){e.preventDefault()});
  });
})();
