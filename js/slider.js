/* Homepage audience sliders: arrows move one photo at a time, the counter follows swipes, and the ends disable the arrows. Tapping a photo opens the gallery lightbox (gallery.js). */
(function(){
  document.querySelectorAll('.slider').forEach(function(s){
    var t=s.querySelector('.strip'),pv=s.querySelector('.pv'),nx=s.querySelector('.nx'),ct=s.querySelector('.ct'),items=t.children,n=items.length;
    function step(){return items.length>1?items[1].offsetLeft-items[0].offsetLeft:t.clientWidth}
    function idx(){return Math.round(t.scrollLeft/step())}
    function update(){var i=Math.min(idx(),n-1),end=t.scrollLeft+t.clientWidth>=t.scrollWidth-4;if(end)i=n-1;ct.textContent=(i+1)+' / '+n;pv.disabled=t.scrollLeft<=4;nx.disabled=end}
    pv.addEventListener('click',function(){t.scrollBy({left:-step(),behavior:'smooth'})});
    nx.addEventListener('click',function(){t.scrollBy({left:step(),behavior:'smooth'});if(window.gtag)gtag('event','slider_next',{section:s.closest('section').id})});
    t.addEventListener('keydown',function(e){if(e.target!==t)return;if(e.key==='ArrowRight'){e.preventDefault();nx.click()}else if(e.key==='ArrowLeft'){e.preventDefault();pv.click()}});
    var raf=0;t.addEventListener('scroll',function(){cancelAnimationFrame(raf);raf=requestAnimationFrame(update)},{passive:true});
    window.addEventListener('resize',update);update();
  });
})();
