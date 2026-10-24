/* Landing pages: any [data-optin] button opens the opt-in sheet. The form posts to Netlify Forms, then lands on /shot-list/thanks/. */
(function(){
  var d=document.getElementById('optin');if(!d)return;
  var f=d.querySelector('form'),first=d.querySelector('input[name="first-name"]');
  function open(e){e&&e.preventDefault();
    var where=(this&&this.getAttribute&&this.getAttribute('data-optin'))||'';
    var p=d.querySelector('input[name="button"]');if(p)p.value=where;
    if(window.gtag)gtag('event','optin_open',{offer:'shot-list',variant:document.body.dataset.v||'',button:where});
    if(d.showModal){d.showModal()}else{d.setAttribute('open','')}
    setTimeout(function(){first&&first.focus()},60)}
  document.querySelectorAll('[data-optin]').forEach(function(b){b.addEventListener('click',open)});
  d.querySelector('.x').addEventListener('click',function(){d.close?d.close():d.removeAttribute('open')});
  d.addEventListener('click',function(e){if(e.target===d)d.close()});
  /* remember the first name and email so the thank-you page can say where it's going */
  f.addEventListener('submit',function(){try{sessionStorage.setItem('cm-sl',JSON.stringify({n:first.value,e:f.email.value}))}catch(e){}});
  /* local preview: no Netlify here, so go straight to the thank-you page */
  if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)){f.addEventListener('submit',function(e){e.preventDefault();location.href=f.getAttribute('action')})}
})();
