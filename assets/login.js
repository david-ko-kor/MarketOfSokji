// 로그인 화면 전용
document.getElementById('login-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  const result=form.querySelector('.form-result');
  const button=form.querySelector('[type="submit"]');
  const id=document.getElementById('login-id').value.trim();
  const password=document.getElementById('login-password');
  button.disabled=true;
  try {
    const account=localAccounts().find(account=>account.id===id);
    if(!account || await passwordDigest(password.value,account.salt)!==account.hash) {
      result.textContent='아이디 또는 비밀번호가 일치하지 않습니다.';return;
    }
    if(!account.schoolConfirmed || account.ocrVerification?.status!=='school_name_matched') {
      sessionStorage.setItem('sm_pending_account',account.id);
      location.href='auth.html';return;
    }
    const {hash,salt,...profile}=account;
    userAuth={...profile,demoOnly:true};
    localStorage.setItem('sm_userAuth',JSON.stringify(userAuth));
    sessionStorage.removeItem('sm_pending_account');
    updateAuthStatusUI();
    result.textContent='로그인되었습니다. (이 브라우저 전용)';
    location.href='index.html';
  } catch(error) {result.textContent='로그인을 처리하지 못했습니다. 브라우저 실행 환경을 확인해 주세요.';}
  finally {password.value='';button.disabled=false;}
});
document.querySelectorAll('[data-provider]').forEach(button=>{
  button.addEventListener('click',()=>{
    document.getElementById('social-login-result').textContent=button.dataset.provider+' 로그인 화면 예시입니다. 실제 소셜 로그인은 아직 연결되지 않았습니다.';
  });
});


const lastAccount=localStorage.getItem('sm_last_account');
if(lastAccount)document.getElementById('login-id').value=lastAccount;
