/* Conference Media: analytics with consent.
   Google Analytics and Microsoft Clarity (heat maps) load only after a visitor taps Accept on the cookie banner.
   Visit any page once with ?notrack to stop counting your own visits on that browser (?track turns it back on).
   A link with data-cookie-settings reopens the banner. */
(function(){
  var ID='G-JBB51LKLJR', KEY='cm-consent-2', ls={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}};
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){dataLayer.push(arguments)};
  gtag('js',new Date());gtag('config',ID);
  var q=location.search;
  if(/[?&]notrack\b/.test(q))ls.set('cm-notrack','1');
  if(/[?&]track\b/.test(q))ls.set('cm-notrack',null);
  var loaded=false;
  function load(){
    if(loaded||ls.get('cm-notrack'))return;loaded=true;
    var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+ID;document.head.appendChild(s);
    /* Microsoft Clarity: heat maps and session recordings (form fields are masked by Clarity) */
    window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments)};
    var c=document.createElement('script');c.async=true;c.src='https://www.clarity.ms/tag/yzlq849hx6';document.head.appendChild(c);
    window.clarity('consent');
  }
  if(ls.get(KEY)==='yes')load();

  /* Lead source: remember how this visit arrived (first page of the visit) and add it to the quote form,
     so every quote email says where the client came from. Works whether or not cookies are accepted. */
  var SRC='cm-src';
  function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);sessionStorage.setItem(k,v)}catch(e){return null}}
  if(!ss(SRC)){
    var p=new URLSearchParams(location.search),ref='',src;
    try{ref=document.referrer?new URL(document.referrer).hostname.replace(/^www\./,''):''}catch(e){}
    if(ref===location.hostname.replace(/^www\./,''))ref='';
    if(p.get('utm_source'))src=[p.get('utm_source'),p.get('utm_medium'),p.get('utm_campaign')].filter(Boolean).join(' / ');
    else if(p.get('gclid'))src='Google Ads';
    else if(/(^|\.)google\./.test(ref))src='Google search';
    else if(/bing\.com$/.test(ref))src='Bing search';
    else if(/duckduckgo|yahoo|ecosia|brave/.test(ref))src='Search ('+ref+')';
    else if(/linkedin\.com$|lnkd\.in$/.test(ref))src='LinkedIn';
    else if(/instagram\.com$/.test(ref))src='Instagram';
    else if(/facebook\.com$|fb\.me$/.test(ref))src='Facebook';
    else if(/youtube\.com$/.test(ref))src='YouTube';
    else if(/chatgpt\.com$|openai\.com$/.test(ref))src='ChatGPT';
    else if(/perplexity\.ai$/.test(ref))src='Perplexity';
    else if(/claude\.ai$/.test(ref))src='Claude';
    else if(/copilot\.microsoft\.com$/.test(ref))src='Copilot';
    else if(ref)src='Website: '+ref;
    else src='Direct (typed in, bookmark, app or email link)';
    ss(SRC,src+' | first page: '+location.pathname);
  }
  function fillSrc(){document.querySelectorAll('input[name="found-us-via"]').forEach(function(i){i.value=ss(SRC)||''})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fillSrc);else fillSrc();

  /* Conversion signals: Request Pricing clicks, quote form submits, email and phone clicks */
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a,button');if(!a)return;
    if(a.hasAttribute('data-cookie-settings')){e.preventDefault();ls.set(KEY,null);banner();return}
    var h=a.getAttribute('href')||'';
    if(a.hasAttribute('data-quote'))gtag('event','request_pricing_click',{link_text:(a.textContent||'').trim().slice(0,60)});
    else if(h.indexOf('mailto:')===0)gtag('event','email_click');
    else if(h.indexOf('tel:')===0)gtag('event','phone_click');
    /* Work page interest: which projects get opened, which filters get used, which project pages get visited */
    if(a.matches('a.card')){var t=a.querySelector('b');gtag('event','project_open',{project:t?t.textContent.trim():h})}
    else if(a.matches('.filter[data-filter]'))gtag('event','project_filter',{filter:a.getAttribute('data-filter')});
    else if(a.closest('#pv-actions')&&h&&h!=='#')gtag('event','project_page_click',{project:h});
    /* Video plays on YouTube embeds (case studies): a tap on a video tile or the Watch Recap button */
    else if(a.matches('.ytf,#play'))gtag('event','video_play',{video_title:(a.getAttribute('aria-label')||a.getAttribute('data-t')||'Watch Recap: '+document.title).replace(/^Play the /,'').slice(0,90)});
  },true);
  /* Video plays and how far people watch, for videos with controls (Work page previews) */
  var seen=new WeakMap();
  document.addEventListener('play',function(e){var v=e.target;if(!v.controls||seen.has(v))return;seen.set(v,{});gtag('event','video_play',{video_title:videoName(v)})},true);
  document.addEventListener('timeupdate',function(e){var v=e.target,m=seen.get(v);if(!m||!v.duration)return;
    [25,50,75,100].forEach(function(p){if(!m[p]&&v.currentTime/v.duration*100>=(p===100?97:p)){m[p]=1;gtag('event','video_progress',{video_title:videoName(v),percent:p})}})},true);
  function videoName(v){var h=document.getElementById('pv-h');return (h&&h.textContent.replace(/\.$/,''))||(v.currentSrc||'').split('/').pop()}
  document.addEventListener('submit',function(e){
    var f=e.target;if(f&&f.getAttribute('name')==='request-pricing')gtag('event','quote_form_submit',{form_location:location.pathname});
    else if(f&&f.getAttribute('name')==='contact')gtag('event','contact_form_submit');
  },true);

  function banner(){
    if(document.getElementById('cm-consent'))return;
    var d=document.createElement('div');d.id='cm-consent';d.setAttribute('role','region');d.setAttribute('aria-label','Cookie choice');
    d.innerHTML='<style>#cm-consent{position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9000;max-width:560px;margin:0 auto;background:#0E0E0E;color:#F2EFE9;border:1px solid #2A2A2A;border-radius:10px;padding:16px 18px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;font:14px/1.5 Manrope,system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.5)}#cm-consent p{margin:0;flex:1 1 260px;color:#A9A49B}#cm-consent a{color:#F2EFE9}#cm-consent .b{display:flex;gap:8px}#cm-consent button{font:600 14px/1 Manrope,system-ui,sans-serif;padding:11px 16px;border-radius:999px;cursor:pointer;border:1.5px solid #2A2A2A;background:none;color:#F2EFE9}#cm-consent button.y{background:#E8392F;border-color:#E8392F;color:#fff}#cm-consent button:focus-visible{outline:2px solid #F2EFE9;outline-offset:2px}</style>'+
      '<p>We use Google Analytics and Microsoft Clarity cookies to see which pages help conference organizers find us. <a href="/privacy/">Privacy policy</a></p><div class="b"><button type="button" data-c="no">Decline</button><button type="button" class="y" data-c="yes">Accept</button></div>';
    d.addEventListener('click',function(e){var c=e.target.getAttribute&&e.target.getAttribute('data-c');if(!c)return;ls.set(KEY,c);d.remove();if(c==='yes')load()});
    (document.body||document.documentElement).appendChild(d);
  }
  if(!ls.get(KEY)){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',banner);else banner()}
})();
