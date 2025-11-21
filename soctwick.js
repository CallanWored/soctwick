// soctwick.optimized.js
document.addEventListener('DOMContentLoaded', function () {
  /* ------------------ FAQ: делегирование + aria ------------------ */
  (function initFaqDelegated() {
    const container = document.querySelector('.faq') || document;
    if (!container) return;

    container.addEventListener('click', event => {
      const q = event.target.closest('.faq-question');
      if (!q) return;

      const answer = q.nextElementSibling;
      if (!answer || !answer.classList) return;

      const currentlyOpen = document.querySelector('.faq-answer.active');

      if (currentlyOpen && currentlyOpen !== answer) {
        currentlyOpen.style.maxHeight = currentlyOpen.scrollHeight + 'px';
        requestAnimationFrame(() => {
          currentlyOpen.classList.remove('active');
          currentlyOpen.style.maxHeight = '0px';
          const prevQ = currentlyOpen.previousElementSibling;
          if (prevQ && prevQ.classList.contains('faq-question')) prevQ.setAttribute('aria-expanded', 'false');
          const prevIcon = prevQ && prevQ.querySelector('.faq-icon');
          if (prevIcon) prevIcon.classList.remove('rotate');
        });
      }

      const willOpen = !answer.classList.contains('active');
      if (willOpen) {
        answer.classList.add('active');
        answer.style.maxHeight = '0px';
        requestAnimationFrame(() => {
          answer.style.maxHeight = answer.scrollHeight + 'px';
        });
      } else {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        requestAnimationFrame(() => {
          answer.classList.remove('active');
          answer.style.maxHeight = '0px';
        });
      }

      const icon = q.querySelector('.faq-icon');
      if (icon) icon.classList.toggle('rotate', willOpen);
      q.setAttribute('aria-expanded', String(willOpen));
    });

    container.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        const q = event.target.closest('.faq-question');
        if (!q) return;
        event.preventDefault();
        q.click();
      }
    });

    document.querySelectorAll('.faq-answer.active').forEach(a => {
      a.style.maxHeight = a.scrollHeight + 'px';
      const q = a.previousElementSibling;
      if (q && q.classList.contains('faq-question')) q.setAttribute('aria-expanded', 'true');
    });
  })();

  /* ------------------ Cookie banner / modal ------------------ */
  ;(function(){
      const KEY='cookiesConfirm';
      const banner=document.getElementById('cookieBanner');
      const btn=document.getElementById('cookieAccept');

      try{
        if(localStorage.getItem(KEY)==='true'){
          banner.remove();
          return;
        }
      }catch(e){}

      btn.addEventListener('click',()=>{
        try{localStorage.setItem(KEY,'true');}catch(e){}
        banner.remove();
      });

      document.addEventListener('keydown',e=>{
        if(e.key==='Escape'){
          try{localStorage.setItem(KEY,'true');}catch(e){}
          banner.remove();
        }
      });
    })();
});
