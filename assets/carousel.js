// 메인 안내 배너: 타이머는 하나만 사용하며 비활성 화면에서는 중지합니다.
(()=>{
 const root=document.querySelector('.market-carousel');if(!root)return;
 const slides=[...root.querySelectorAll('.market-slide')],dots=[...root.querySelectorAll('[data-slide]')];
 const toggle=document.getElementById('carousel-toggle');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let index=0,paused=reduced.matches,hover=false,focused=false,timer=null;
 function sync(){
  clearInterval(timer);timer=null;
  toggle.textContent=paused?'▶':'Ⅱ';toggle.setAttribute('aria-label',paused?'자동재생 시작':'자동재생 정지');
  if(!paused&&!hover&&!focused&&!document.hidden&&!document.getElementById('page-home').hidden)timer=setInterval(()=>show(index+1),5000);
 }
 function show(next){index=(next+slides.length)%slides.length;slides.forEach((slide,i)=>slide.hidden=i!==index);dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===index)));document.getElementById('carousel-count').textContent=(index+1)+' / '+slides.length;}
 function manual(next){show(next);sync();}
 document.getElementById('carousel-prev').addEventListener('click',()=>manual(index-1));
 document.getElementById('carousel-next').addEventListener('click',()=>manual(index+1));
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>manual(i)));
 toggle.addEventListener('click',()=>{paused=!paused;sync();});
 root.addEventListener('mouseenter',()=>{hover=true;sync();});root.addEventListener('mouseleave',()=>{hover=false;sync();});
 root.addEventListener('focusin',()=>{focused=true;sync();});root.addEventListener('focusout',event=>{focused=root.contains(event.relatedTarget);sync();});
 root.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();manual(index+(event.key==='ArrowLeft'?-1:1));}});
 document.addEventListener('visibilitychange',sync);window.addEventListener('hashchange',sync);window.addEventListener('pagehide',()=>clearInterval(timer));window.addEventListener('pageshow',sync);
 reduced.addEventListener('change',event=>{if(event.matches)paused=true;sync();});sync();
})();
