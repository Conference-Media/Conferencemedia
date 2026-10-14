/* Conference Media motion: scroll reveals, count-ups, FAQ slide open/close, and the
   page-to-page logo transition. Works on every page; each rule only applies where its
   selector matches. Reduced-motion visitors get the plain page (html.mo is never set). */
(function(){
  var html=document.documentElement;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var on=html.classList.contains('mo');

  /* ---------- Arrival ----------
     The head script put the spinning emblem up before the page drew. Once this page has fully
     loaded, wait for the emblem to reach edge-on, turn it back into the wordmark, then fade away. */
  var SPIN=1100; // ms for the emblem to turn from one edge to the other (keep in step with motion.css)
  function arrive(after){
    var v=document.getElementById('cm-veil');
    if(!v||!v.classList.contains('spin')||!v.dataset.t){html.classList.remove('cm-in');after();return}
    v.dataset.done='1';
    var finished=false;
    function finish(){
      if(finished)return;finished=true;
      var rem=SPIN-((Date.now()-(+v.dataset.t))%SPIN);
      setTimeout(function(){
        var w=v.querySelector('.coin.w'),e=v.querySelector('.coin.e');
        v.classList.remove('spin');e.hidden=true;w.hidden=false;
        settle(w,function(){
          v.classList.add('leave');v.classList.remove('on');
          setTimeout(function(){v.remove();html.classList.remove('cm-in');},460);
          after();
        });
      },rem);
    }
    if(document.readyState==='complete')finish();else{window.addEventListener('load',finish,{once:true});setTimeout(finish,6000)}
  }
  // Wordmark turns in from edge-on and settles facing you, catching the light
  function settle(w,done){
    var ease='cubic-bezier(.1,.6,.3,1)',ms=620;
    w.animate([{transform:'rotateY(-90deg)'},{transform:'rotateY(6deg)',offset:.8},{transform:'rotateY(0deg)'}],{duration:ms,easing:ease,fill:'forwards'}).onfinish=function(){setTimeout(done,120)};
    w.querySelector('.top').animate([{filter:'brightness(.5)'},{filter:'brightness(1.12)'},{filter:'brightness(1)'}],{duration:ms,easing:ease,fill:'forwards'});
    w.querySelector('.sheen').animate([{backgroundPosition:'15% 0'},{backgroundPosition:'-30% 0'}],{duration:ms,easing:ease,fill:'forwards'});
  }

  /* ---------- Reveal rules ----------
     [selector, kind, stagger(ms) between matches in the same group, group selector] */
  var RULES=[
    // Homepage
    ['.stats > div','rv',160,'.stats'],
    ['.logos img','row',0,'.logos'],
    ['.intro > *','rv',120,'.intro'],
    ['.outcome .pics > img','rv',140,'.outcome'],
    ['.outcome > div:not(.pics) > *','rv',90,'.outcome'],
    ['.sameday > *','rv',120,'.sameday'],
    ['.recent-head > *','rv',100,'.recent-head'],
    ['.cards .card','rv',150,'.cards'],
    ['.tagline > *','rv',120,'.tagline'],
    ['.faq > .kicker, .faq > h2','rv',100,'.faq'],
    ['.faq-list details','rv',70,'.faq-list'],
    ['.book','rv',0],
    // Work page
    ['.filters','rv rv-f',0],
    ['.sec-head > *','rv',100,'.sec-head'],
    ['.rail .tile','rv rv-r',110,'.rail'],
    ['.ask','rv',0],
    ['#feed .row3 > .card','rv',140,'.row3'],
    ['#feed > .ask, #feed > .end','rv',0],
    // Case study pages
    ['.glance > div','rv',160,'.glance'],
    ['.facts','rv',0],
    ['article > *','rv',0],
    ['.feature','rv',0],
    ['.strip > img, .strip > div','rv',130,'.strip'],
    ['.cta > *','rv',120,'.cta'],
    // Everywhere
    ['main > .actions, section > .actions, .outcome-actions','rv',0],
    ['footer > *','rv',120,'footer']
  ];
  // Count up to the number on these when they appear
  var COUNT_BOX='.stats > div, .glance > div';

  var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){show(e.target);io.unobserve(e.target)}});
  },{rootMargin:'0px 0px -10% 0px',threshold:0.12}):null;

  function show(el){
    el.classList.add('in');
    // Rail tiles: once one shows, bring in the rest of that row (they sit off to the side)
    if(el.classList.contains('tile')&&el.parentElement)[].forEach.call(el.parentElement.querySelectorAll('.tile[data-mo]:not(.in)'),function(t){if(io)io.unobserve(t);t.classList.add('in')});
    if(el.matches(COUNT_BOX)){var b=el.querySelector('b');if(b)count(b,parseInt(el.style.getPropertyValue('--d'))||0)}
  }

  function tag(el,kind,delay){
    if(el.dataset.mo)return;el.dataset.mo='1';
    kind.split(' ').forEach(function(k){el.classList.add(k)});
    if(delay)el.style.setProperty('--d',delay+'ms');
    if(io)io.observe(el);else show(el);
  }

  function scan(root){
    if(!on)return;
    RULES.forEach(function(r){
      var sel=r[0],kind=r[1],step=r[2],group=r[3];
      var els=[].slice.call((root||document).querySelectorAll(sel));
      if(root&&root.matches&&root.matches(sel))els.unshift(root);
      if(kind==='row'){rows(els);return}
      var seen=new Map();
      els.forEach(function(el){
        if(el.dataset.mo||el.closest('.hero,.billboard,#pv,#quote,#player,#menu'))return;
        var g=group?(el.closest(group)||document):document,i=seen.get(g)||0;seen.set(g,i+1);
        tag(el,kind,step*i);
      });
    });
  }

  // Logos: top line first, then the next, left to right within each line.
  // Lines are worked out when the logos come into view, so they match the screen width.
  function rows(els){
    els=els.filter(function(el){return !el.dataset.mo});if(!els.length)return;
    els.forEach(function(el){el.dataset.mo='1';el.classList.add('rv')});
    var box=els[0].parentElement;
    function go(){
      var lines=[];els.forEach(function(el){var t=el.getBoundingClientRect().top,l=lines.filter(function(x){return Math.abs(x.t-t)<24})[0];if(!l){l={t:t,items:[]};lines.push(l)}l.items.push(el)});
      lines.sort(function(a,b){return a.t-b.t}).forEach(function(l,r){
        l.items.sort(function(a,b){return a.getBoundingClientRect().left-b.getBoundingClientRect().left}).forEach(function(el,c){el.style.setProperty('--d',(r*420+c*70)+'ms');el.classList.add('in')});
      });
    }
    if(!('IntersectionObserver' in window))return go();
    var o=new IntersectionObserver(function(es){if(es[0].isIntersecting){o.disconnect();go()}},{threshold:0.2});o.observe(box);
  }

  function reset(el){if(io)io.unobserve(el);el.classList.remove('in');delete el.dataset.mo;el.style.removeProperty('--d')}

  /* ---------- Count-ups ---------- */
  function count(b,delay){
    if(b.dataset.counted)return;b.dataset.counted='1';
    var txt=b.textContent,m=txt.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);if(!m)return;
    var pre=m[1],raw=m[2],post=m[3],commas=raw.indexOf(',')>-1,dec=(raw.split('.')[1]||'').length;
    var end=parseFloat(raw.replace(/,/g,'')),dur=2400;
    b.setAttribute('aria-label',txt);
    function fmt(v){var s=v.toFixed(dec);if(commas)s=Number(s).toLocaleString('en-CA',{minimumFractionDigits:dec,maximumFractionDigits:dec});return pre+s+post}
    b.textContent=fmt(0);
    setTimeout(function(){
      var t0=performance.now();
      (function step(t){var p=Math.min(1,(t-t0)/dur),e=p===1?1:1-Math.pow(2,-10*p); /* ease-out expo: fast start, long slow finish */b.textContent=p<1?fmt(end*e):txt;if(p<1)requestAnimationFrame(step)})(t0);
    },delay);
  }

  /* ---------- FAQ: start closed, slide open and closed ---------- */
  function faq(){
    var list=document.querySelectorAll('.faq-list details');
    list.forEach(function(d){
      d.open=false;
      var s=d.querySelector('summary');
      s.addEventListener('click',function(e){
        if(reduce)return;e.preventDefault();toggle(d,!d.open||d.dataset.closing);
      });
    });
    // Links to a question (e.g. the menu's Pricing link) open it
    function openHash(){var h=location.hash&&document.getElementById(location.hash.slice(1));if(h&&h.tagName==='DETAILS'&&!h.open)toggle(h,true)}
    window.addEventListener('hashchange',openHash);openHash();
    document.querySelectorAll('a[href^="#"]').forEach(function(a){
      var t=document.getElementById(a.getAttribute('href').slice(1));
      if(t&&t.tagName==='DETAILS')a.addEventListener('click',function(){setTimeout(function(){if(!t.open)toggle(t,true)},450)});
    });
  }
  function toggle(d,open){
    var s=d.querySelector('summary');
    if(d._anim)d._anim.cancel();
    var start=d.offsetHeight;
    d.classList.add('anim');
    if(open){d.open=true;delete d.dataset.closing}
    var cs=getComputedStyle(d),pad=parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom),bd=parseFloat(cs.borderBottomWidth)||0;
    var end=open?d.scrollHeight+bd:s.offsetHeight+pad+bd;
    if(!open)d.dataset.closing='1';
    var a=d.animate({height:[start+'px',end+'px']},{duration:open?420:340,easing:'cubic-bezier(.4,0,.2,1)'});
    d._anim=a;
    a.onfinish=function(){d._anim=null;d.classList.remove('anim');if(!open){d.open=false;delete d.dataset.closing}};
  }

  /* ---------- Page transitions ----------
     Leaving: the wordmark turns to edge-on, becomes the CE emblem, and the emblem keeps spinning
     while the next page loads. That page picks up the spin where it left off (see arrive). */
  var LAYERS=7;
  function veil(){
    var v=document.getElementById('cm-veil');
    if(!v){
      v=document.createElement('div');v.id='cm-veil';v.setAttribute('aria-hidden','true');
      function coin(cls){var ly='';for(var i=LAYERS;i>=1;i--)ly+='<i class="ly" style="--z:'+i+'"></i>';return '<div class="coin '+cls+'"'+(cls==='e'?' hidden':'')+'>'+ly+'<i class="top"></i><i class="sheen"></i></div>'}
      v.innerHTML='<div class="stage">'+coin('w')+coin('e')+'</div>';
      document.body.appendChild(v);
    }
    return v;
  }
  function leave(v,go){
    var w=v.querySelector('.coin.w'),e=v.querySelector('.coin.e');
    v.getAnimations({subtree:true}).forEach(function(x){x.cancel()});
    v.classList.remove('spin','leave');w.hidden=false;e.hidden=true;
    var ease='cubic-bezier(.45,0,.9,.6)',ms=380;
    w.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(90deg)'}],{duration:ms,easing:ease,fill:'forwards'}).onfinish=function(){
      w.hidden=true;e.hidden=false;
      v.style.setProperty('--sd','0ms');v.classList.add('spin');
      try{sessionStorage.setItem('cm-t',String(Date.now()))}catch(x){}
      go();
    };
    w.querySelector('.top').animate([{filter:'brightness(1)'},{filter:'brightness(.5)'}],{duration:ms,easing:ease,fill:'forwards'});
    w.querySelector('.sheen').animate([{backgroundPosition:'130% 0'},{backgroundPosition:'85% 0'}],{duration:ms,easing:ease,fill:'forwards'});
  }

  function internal(a,e){
    if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return false;
    if(a.target&&a.target!=='_self')return false;
    if(a.hasAttribute('download'))return false;
    var href=a.getAttribute('href');if(!href||href.charAt(0)==='#')return false;
    var u;try{u=new URL(a.href,location.href)}catch(x){return false}
    if(u.origin!==location.origin)return false;
    if(u.pathname===location.pathname&&u.search===location.search)return false; // same page, maybe a #section
    return u;
  }
  function transitions(){
    document.addEventListener('click',function(e){
      var a=e.target.closest&&e.target.closest('a[href]');var u=internal(a,e);if(!u)return;
      e.preventDefault();
      var v=veil();void v.offsetWidth;v.classList.add('on');
      var gone=false;function go(){if(!gone){gone=true;location.href=u.href}}
      leave(v,go);
      setTimeout(go,1500); // safety net if the animation is interrupted
    });
    // Warm up the next page while the pointer is on its link
    var done={};
    function warm(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;var u;try{u=new URL(a.href)}catch(x){return}
      if(u.origin!==location.origin||u.pathname===location.pathname||done[u.pathname])return;done[u.pathname]=1;
      var l=document.createElement('link');l.rel='prefetch';l.href=u.pathname;document.head.appendChild(l)}
    document.addEventListener('mouseover',warm,{passive:true});document.addEventListener('touchstart',warm,{passive:true});
    // Coming back with the Back button: don't leave the veil up
    window.addEventListener('pageshow',function(e){if(!e.persisted)return;var v=document.getElementById('cm-veil');if(v)v.remove();html.classList.remove('cm-in')});
  }

  function init(){
    faq();
    if(!on){arrive(function(){});return}
    transitions();
    // Start the scroll reveals once the logo card is out of the way
    arrive(function(){
      scan();
      // Work page builds its rows as you scroll and filter: reveal those too
      if('MutationObserver' in window){
        var feed=document.getElementById('feed');
        if(feed)new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType!==1)return;if(n.classList.contains('row3'))n.querySelectorAll('.card').forEach(reset);scan(n)})})}).observe(feed,{childList:true,subtree:true});
      }
      setTimeout(function(){if(!document.getElementById('cm-veil'))veil()},1200);
    });
    // Preview the spin without leaving the page: CMpreview() in the browser console
    window.CMpreview=function(){var v=veil();v.classList.add('on');leave(v,function(){
      v.dataset.t=String(Date.now());setTimeout(function(){var rem=SPIN-((Date.now()-(+v.dataset.t))%SPIN);setTimeout(function(){v.classList.remove('spin');v.querySelector('.coin.e').hidden=true;var w=v.querySelector('.coin.w');w.hidden=false;settle(w,function(){v.classList.remove('on')})},rem)},SPIN*1.5)})};
    // At the very bottom, show anything still waiting (the last lines can't scroll far enough to trigger)
    window.addEventListener('scroll',function(){
      if(innerHeight+scrollY<document.documentElement.scrollHeight-8)return;
      document.querySelectorAll('[data-mo]:not(.in)').forEach(function(el){if(el.getBoundingClientRect().top<innerHeight)show(el)});
    },{passive:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
