// 회원가입 화면 전용
document.getElementById('signup-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  const result=form.querySelector('.form-result');
  const button=form.querySelector('[type="submit"]');
  const id=document.getElementById('signup-id').value.trim();
  const name=document.getElementById('signup-name').value.trim();
  const school=document.getElementById('signup-school').value.trim();
  const password=document.getElementById('signup-password');
  const confirmation=document.getElementById('signup-confirm');
  if(!id || !name || !school) {result.textContent='아이디·닉네임·학교를 입력해 주세요.';return;}
  if(!captchaVerified) {result.textContent='숫자 캡챠를 확인해 주세요.';return;}
  if(password.value!==confirmation.value) {result.textContent='비밀번호 확인이 일치하지 않습니다.';return;}
  if(localAccounts().some(account=>account.id===id)) {result.textContent='이 브라우저에 이미 등록된 아이디입니다.';return;}
  button.disabled=true;
  try {
    const salt=Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
    const hash=await passwordDigest(password.value,salt);
    const accounts=localAccounts();
    if(accounts.some(account=>account.id===id)) throw new Error('duplicate');
    accounts.push({id,name,school,salt,hash,schoolConfirmed:false,signupStatus:"pending_ocr"});
    localStorage.setItem('sm_local_accounts',JSON.stringify(accounts));
    sessionStorage.setItem('sm_pending_account',id);
    password.value='';confirmation.value='';resetCaptcha();
    location.href='auth.html';
  } catch(error) {result.textContent='가입 정보를 저장하지 못했습니다. 브라우저 저장 권한 또는 실행 환경을 확인해 주세요.';}
  finally {button.disabled=false;}
});
// 회원가입: 학교 찾기 화면 틀. 실제 학교 검색 API는 추후 연결합니다.
document.getElementById('find-school-button').addEventListener('click',()=>{
  const panel=document.getElementById('school-search-panel');
  panel.hidden=!panel.hidden;
  if(!panel.hidden) document.getElementById('school-search-name').focus();
});
document.getElementById('select-school-button').addEventListener('click',()=>{
  const name=document.getElementById('school-search-name');
  if(!name.value.trim()) { name.focus(); return; }
  document.getElementById('signup-school').value=name.value.trim();
  document.getElementById('school-search-panel').hidden=true;
});

// 숫자 입력 흐름 시제품: 보안용 캡챠 검증은 서버에서 구현해야 합니다.
let captchaAnswer = '';
let captchaVerified = false;
function resetCaptcha() {
  captchaAnswer = String(100000 + Math.floor(Math.random() * 900000));
  captchaVerified = false;
  document.getElementById('captcha-number').textContent = captchaAnswer;
  document.getElementById('signup-captcha-code').value = '';
  document.getElementById('captcha-status').textContent = '표시된 숫자를 입력하고 확인을 눌러 주세요.';
}
document.getElementById('captcha-refresh').addEventListener('click',resetCaptcha);
document.getElementById('signup-captcha-code').addEventListener('input',()=>{
  captchaVerified=false;
  document.getElementById('captcha-status').textContent='숫자 입력 후 확인을 눌러 주세요.';
});
document.getElementById('captcha-check').addEventListener('click',()=>{
  captchaVerified=document.getElementById('signup-captcha-code').value===captchaAnswer;
  document.getElementById('captcha-status').textContent=captchaVerified
    ? '숫자 확인 완료 (체험)'
    : '숫자가 일치하지 않습니다. 다시 입력해 주세요.';
});
resetCaptcha();
