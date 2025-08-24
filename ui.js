<script>
(function(){
  // Attach once on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    // Ensure overlay & loading exist
    let overlay = document.getElementById('overlay');
    if(!overlay){ overlay = document.createElement('div'); overlay.id='overlay'; document.body.appendChild(overlay); }
    let loading = document.getElementById('loading');
    if(!loading){
      loading = document.createElement('div'); loading.id='loading';
      loading.innerHTML = '<div class="box"><div class="spinner" aria-hidden="true"></div><div class="loader-text" role="status" aria-live="polite">Loading…</div></div>';
      document.body.appendChild(loading);
    }
    // Toast container
    let wrap = document.querySelector('.toast-wrap');
    if(!wrap){ wrap = document.createElement('div'); wrap.className='toast-wrap'; document.body.appendChild(wrap); }

    // Expose helpers
    window.UI = {
      showLoader(msg){
        overlay.style.display='block';
        loading.style.display='grid';
        const t = loading.querySelector('.loader-text'); if (t && msg) t.textContent = msg;
      },
      hideLoader(){
        loading.style.display='none';
        overlay.style.display='none';
      },
      toast: {
        success(msg, ttl=3500){ mk(msg,'success',ttl) },
        error(msg, ttl=4500){ mk(msg,'error',ttl) }
      }
    };

    function mk(msg,type,ttl){
      const n = document.createElement('div');
      n.className = `toast ${type}`;
      n.textContent = msg;
      wrap.appendChild(n);
      setTimeout(()=> n.remove(), ttl);
    }
  });
})();
</script>
