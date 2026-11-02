// 학교 정보 입력·학생증 OCR. OCR 확인 상태는 현재 화면 메모리에만 둡니다.
let selectedCard=null;
let selectedCardUrl=null;
let cardVersion=0;
let ocrBusy=false;
let verifiedCard=null;
const ocrStatus=document.getElementById('ocr-status');
const finishButton=document.getElementById('finish-school-auth');
const fileInput=document.getElementById('student-card-file');
function invalidateCard(){verifiedCard=null;finishButton.disabled=ocrBusy;finishButton.textContent='학교명 확인 후 가입 완료';document.getElementById('ocr-summary').hidden=true;}
function setBusy(busy){
 ocrBusy=busy;document.getElementById('run-student-ocr').disabled=busy||!selectedCard;
 document.getElementById('use-ocr-sample').disabled=busy;
 finishButton.disabled=busy;
 finishButton.textContent=busy?'학생증 인식 중…':verifiedCard?.ok?'가입 완료하기':'학교명 확인 후 가입 완료';
}
function clearCard(){
 cardVersion++;selectedCard=null;if(selectedCardUrl)URL.revokeObjectURL(selectedCardUrl);selectedCardUrl=null;
 const preview=document.getElementById('student-card-preview');preview.hidden=true;preview.removeAttribute('src');
 fileInput.value='';invalidateCard();document.getElementById('clear-student-card').hidden=true;
 document.getElementById('run-student-ocr').disabled=true;ocrStatus.textContent='학생증 사진을 선택해 주세요.';
 document.getElementById('ocr-progress').hidden=true;
}
fileInput.addEventListener('change',()=>{
 const file=fileInput.files[0];clearCard();
 if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){ocrStatus.textContent='10MB 이하 JPG·PNG·WebP 사진을 선택해 주세요.';return;}
 selectedCard=file;selectedCardUrl=URL.createObjectURL(file);
 const preview=document.getElementById('student-card-preview');preview.src=selectedCardUrl;preview.hidden=false;
 document.getElementById('clear-student-card').hidden=false;
 setBusy(ocrBusy);ocrStatus.textContent='사진을 선택했습니다. 학생증 확인하기를 눌러 주세요.';
});
document.getElementById('clear-student-card').addEventListener('click',clearCard);
for(const id of ['auth-school','auth-role'])document.getElementById(id).addEventListener('input',()=>{
 invalidateCard();ocrStatus.textContent='학교 정보가 변경되었습니다. 학생증 확인을 다시 진행해 주세요.';
});
document.getElementById('auth-role').addEventListener('change',()=>{invalidateCard();});
async function runCardOCR(){
 if(!selectedCard||ocrBusy)return;
 const version=cardVersion;const enteredSchool=document.getElementById('auth-school').value.trim();
 if(!enteredSchool){ocrStatus.textContent='학교명을 먼저 입력해 주세요.';return;}
 invalidateCard();setBusy(true);const progress=document.getElementById('ocr-progress');progress.hidden=false;progress.value=0;
 ocrStatus.textContent='내장된 한국어 OCR 엔진을 준비하고 있습니다. 외부 다운로드는 하지 않습니다.';
 try{
  const result=await StudentOCR.recognize(selectedCard,message=>{
   if(version!==cardVersion)return;
   const recognizing=message.status==='recognizing text';
   progress.value=Math.round((message.progress||0)*100);
   ocrStatus.textContent=recognizing?'학생증 글자 인식 중 '+progress.value+'%':'OCR 모델 준비 중…';
  });
  if(version!==cardVersion)return;
  if(enteredSchool!==document.getElementById('auth-school').value.trim()){ocrStatus.textContent='학교 정보가 바뀌었습니다. 다시 인식해 주세요.';return;}
  const verdict=StudentOCR.inspect(result.text,result.confidence,enteredSchool);
  if(!verdict.ok){ocrStatus.textContent=verdict.message;return;}
  verifiedCard={...verdict,version};
  const summary=document.getElementById('ocr-summary');summary.hidden=false;
  summary.textContent='인식 학교: '+verdict.school+' / 원주시 학교명 일치'+(verdict.sample?' / 테스트 문서 (실제 효력 없음)':' / 재학·본인 여부는 별도 확인 필요');
  ocrStatus.textContent=verdict.sample?'샘플 학교명 인식에 성공했습니다. 로컬 시연용 가입만 가능합니다.':'학교명 일치를 확인했습니다. 학생증 진위·실제 재학 여부를 검증한 것은 아닙니다.';
  ocrStatus.textContent+=' · 인식 시간 '+(result.elapsedMs/1000).toFixed(1)+'초';
  progress.value=100;
 }catch(error){if(version===cardVersion)ocrStatus.textContent=error.code==='OCR_TIMEOUT'?'30초 안에 완료되지 않아 중단했습니다. 다시 시도할 수 있습니다. 파일 주소에서 반복되면 Live Server로 실행해 주세요.':'OCR 준비 또는 인식에 실패했습니다. 다시 시도해 주세요. 내장 엔진 파일이 정상인지 확인하거나 Live Server에서 다시 시도해 주세요.';}
 finally{setBusy(false);}
}
document.getElementById('run-student-ocr').addEventListener('click',runCardOCR);
document.getElementById('use-ocr-sample').addEventListener('click',()=>{
 clearCard();selectedCard=globalThis.OCR_SAMPLE_IMAGE;
 const preview=document.getElementById('student-card-preview');preview.src=selectedCard;preview.hidden=false;
 document.getElementById('auth-school').value='원주중학교';
 document.getElementById('clear-student-card').hidden=false;setBusy(false);runCardOCR();
});
function handleAuth(event){
 event.preventDefault();const result=document.getElementById('school-auth-result');
 const tell=message=>{result.textContent=message;result.classList.add('auth-needs-attention');result.scrollIntoView?.({block:'nearest',behavior:'smooth'});};
 if(ocrBusy){tell('학생증 인식이 진행 중입니다. 완료될 때까지 기다려 주세요.');return;}
 if(!verifiedCard?.ok||verifiedCard.version!==cardVersion){tell('학생증 확인이 아직 완료되지 않았습니다. 위의 학생증 확인하기 또는 원주중학교 샘플로 테스트를 먼저 눌러 주세요.');return;}
 const enteredNumber=document.getElementById('auth-number');
 if(!enteredNumber.value.trim()){tell('학번을 입력해 주세요. 샘플 시험 시 예: 1학년 1반 99번');enteredNumber.focus?.();return;}
 const id=sessionStorage.getItem('sm_pending_account')||userAuth?.id;
 const accounts=localAccounts();const account=accounts.find(value=>value.id===id);
 if(!account){tell('연결된 회원가입 정보가 없습니다. 회원가입 화면에서 계정을 만든 뒤 학교 인증을 진행해 주세요. 이미 가입했다면 로그인 후 이어서 진행할 수 있습니다.');return;}
  const school=document.getElementById('auth-school').value.trim();
 const number=document.getElementById('auth-number').value.trim();
 if(StudentOCR.normalize(school)!==StudentOCR.normalize(verifiedCard.school)||document.getElementById('auth-role').value!=='학생'){result.textContent='확인된 학교의 학생 정보로만 완료할 수 있습니다.';return;}
 if(!number){tell('학번을 입력해 주세요.');return;}
 account.school=verifiedCard.school;account.number=number;account.role='학생';account.schoolConfirmed=true;account.signupStatus='local_demo_school_matched';
 account.ocrVerification={status:'school_name_matched',school:verifiedCard.school,region:'원주시',checkedAt:new Date().toISOString(),sample:verifiedCard.sample,demoOnly:true};
 try{
  localStorage.setItem('sm_local_accounts',JSON.stringify(accounts));
  if(userAuth?.id===account.id){const {hash,salt,...profile}=account;userAuth={...profile,demoOnly:true};localStorage.setItem('sm_userAuth',JSON.stringify(userAuth));updateAuthStatusUI();}
  localStorage.setItem('sm_last_account',account.id);sessionStorage.removeItem('sm_pending_account');clearCard();location.href='login.html';
 }catch{result.textContent='가입 정보를 저장하지 못했습니다. 브라우저 저장 권한을 확인해 주세요.';}
}
const schoolAccount=localAccounts().find(account=>account.id===(sessionStorage.getItem('sm_pending_account')||userAuth?.id));
if(schoolAccount){document.getElementById('auth-school').value=schoolAccount.school;document.getElementById('auth-role').value='학생';document.getElementById('auth-number').value=schoolAccount.number||'';}
else document.getElementById('school-auth-result').textContent='샘플 인식 테스트는 바로 가능합니다. 가입 완료는 회원가입 후 진행해 주세요.';
