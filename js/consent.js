/* Conference Media: analytics with consent.
   Google Analytics loads only after a visitor taps Accept on the cookie banner.
   Visit any page once with ?notrack to stop counting your own visits on that browser (?track turns it back on).
   A link with data-cookie-settings reopens the banner. */
(function(){
  var ID='G-JBB51LKLJR', KEY='cm-consent', ls={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}};
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
  }
  if(ls.get(KEY)==='yes')load();

  /* Conversion signals: Request Pricing clicks, quote form submits, email and phone clicks */
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a,button');if(!a)return;
    if(a.hasAttribute('data-cookie-settings')){e.preventDefault();ls.set(KEY,null);banner();return}
    var h=a.getAttribute('href')||'';
    if(a.hasAttribute('data-quote'))gtag('event','request_pricing_click',{link_text:(a.textContent||'').trim().slice(0,60)});
    else if(h.indexOf('mailto:')===0)gtag('event','email_click');
    else if(h.indexOf('tel:')===0)gtag('event','phone_click');
  },true);
  document.addEventListener('submit',function(e){
    var f=e.target;if(f&&f.getAttribute('name')==='request-pricing')gtag('event','quote_form_submit',{form_location:location.pathname});
  },true);

  function banner(){
    if(document.getElementById('cm-consent'))return;
    var d=document.createElement('div');d.id='cm-consent';d.setAttribute('role','region');d.setAttribute('aria-label','Cookie choice');
    d.innerHTML='<style>#cm-consent{position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9000;max-width:560px;margin:0 auto;background:#0E0E0E;color:#F2EFE9;border:1px solid #2A2A2A;border-radius:10px;padding:16px 18px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;font:14px/1.5 Manrope,system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.5)}#cm-consent p{margin:0;flex:1 1 260px;color:#A9A49B}#cm-consent a{color:#F2EFE9}#cm-consent .b{display:flex;gap:8px}#cm-consent button{font:600 14px/1 Manrope,system-ui,sans-serif;padding:11px 16px;border-radius:999px;cursor:pointer;border:1.5px solid #2A2A2A;background:none;color:#F2EFE9}#cm-consent button.y{background:#E8392F;border-color:#E8392F;color:#fff}#cm-consent button:focus-visible{outline:2px solid #F2EFE9;outline-offset:2px}</style>'+
      '<p>We use Google Analytics cookies to see which pages help conference organizers find us. <a href="/privacy/">Privacy policy</a></p><div class="b"><button type="button" data-c="no">Decline</button><button type="button" class="y" data-c="yes">Accept</button></div>';
    d.addEventListener('click',function(e){var c=e.target.getAttribute&&e.target.getAttribute('data-c');if(!c)return;ls.set(KEY,c);d.remove();if(c==='yes')load()});
    (document.body||document.documentElement).appendChild(d);
  }
  if(!ls.get(KEY)){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',banner);else banner()}
})();
