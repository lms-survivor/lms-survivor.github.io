// ui.js
// Provides helper functions for showing a blocking loader and toast notifications.
// This script attaches itself on DOMContentLoaded and exposes a global `UI` object.

(function(){
  document.addEventListener('DOMContentLoaded', () => {
    // Ensure overlay and loading containers exist in the DOM
    let overlay = document.getElementById('overlay');
    if (!overlay){
      overlay = document.createElement('div');
      overlay.id = 'overlay';
      document.body.appendChild(overlay);
    }
    let loading = document.getElementById('loading');
    if (!loading){
      loading = document.createElement('div');
      loading.id = 'loading';
      loading.innerHTML = '<div class="box"><div class="spinner" aria-hidden="true"></div><div class="loader-text" role="status" aria-live="polite">Loading…</div></div>';
      document.body.appendChild(loading);
    }
    // Create toast wrapper if needed
    let wrap = document.querySelector('.toast-wrap');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    // Expose a UI helper globally
    window.UI = {
      showLoader(msg){
        overlay.style.display = 'block';
        loading.style.display = 'grid';
        const t = loading.querySelector('.loader-text');
        if (t && msg) t.textContent = msg;
      },
      hideLoader(){
        loading.style.display = 'none';
        overlay.style.display = 'none';
      },
      toast: {
        success(msg, ttl=3500){ mk(msg,'success',ttl); },
        error(msg, ttl=4500){ mk(msg,'error',ttl); }
      }
    };
    function mk(msg,type,ttl){
      const n = document.createElement('div');
      n.className = `toast ${type}`;
      n.textContent = msg;
      wrap.appendChild(n);
      setTimeout(() => n.remove(), ttl);
    }
  });
})();