function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
// 모든 HTML에서 공유하는 로컬 계정과 상단 메뉴입니다.
const readDemo=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
let userAuth=readDemo('sm_userAuth',null);
function localAccounts(){return readDemo('sm_local_accounts',[]);}
async function passwordDigest(password, salt) {
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256);
  return Array.from(new Uint8Array(bits),value=>value.toString(16).padStart(2,'0')).join('');
}
function updateAuthStatusUI(){
 const walletBanner=document.getElementById('wallet-banner');
 if(walletBanner)walletBanner.hidden=true;
 const headerWallet=document.getElementById('wallet-header');
 if(headerWallet){headerWallet.hidden=!userAuth?.id;if(userAuth?.id){headerWallet.textContent='내 체험 잔액 '+walletBalance(userAuth.id).toLocaleString()+'원';headerWallet.title='실제 돈이 아닌 가상 거래용 잔액 · 거래 내역 보기';}}
 document.querySelectorAll('[data-guest-link]').forEach(el=>el.hidden=Boolean(userAuth));
 document.querySelectorAll('[data-member-link]').forEach(el=>el.hidden=!userAuth);
 const status=document.getElementById('school-status-text');
 if(status)status.textContent=userAuth?userAuth.school+' · '+userAuth.name+' (로컬 체험)':'우리 학교 안심 거래';
 const notice=document.getElementById('school-resume-notice');
 if(notice){
  const pendingId=sessionStorage.getItem('sm_pending_account');
  const account=localAccounts().find(value=>value.id===(userAuth?.id || pendingId));
  notice.hidden=!account || Boolean(account.schoolConfirmed && account.ocrVerification?.status==='school_name_matched') || location.pathname.endsWith('/auth.html');
 }
}
function openAuthModal(){location.href=userAuth?'auth.html': 'login.html';}
function logoutLocal(){
 localStorage.removeItem('sm_userAuth');sessionStorage.removeItem('sm_pending_account');
 userAuth=null;location.href='login.html';
}
// 메인 외 화면의 공통 헤더 버튼은 메인으로 이동한 뒤 동작합니다.
function openChatListModal(){location.href='index.html#chats';}
function requestProductRegistration(){
 if(userAuth?.id){location.href='product.html';return;}
 let dialog=document.getElementById('product-login-dialog');
 if(!dialog){
  dialog=document.createElement('dialog');
  dialog.id='product-login-dialog';dialog.className='brand-alert-dialog';
  dialog.setAttribute('aria-labelledby','product-login-title');
  dialog.setAttribute('aria-describedby','product-login-description');
  dialog.innerHTML='<div class="brand-alert-icon" aria-hidden="true">!</div><h2 id="product-login-title">로그인이 필요합니다</h2><p id="product-login-description">제품을 등록하려면 먼저 로그인해 주세요.</p><div class="action-row"><button class="secondary" type="button" data-dialog-cancel autofocus>취소</button><a class="primary" href="login.html">로그인하기</a></div>';
  document.body.appendChild(dialog);
  dialog.querySelector('[data-dialog-cancel]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
 }
 if(!dialog.open)dialog.showModal();
}
function openPostModal(){requestProductRegistration();}
updateAuthStatusUI();

// 가상 잔액: 계정별 기본 100,000원. 실제 결제 기능이 아닙니다.
function walletState(){return readDemo('sm_virtual_wallet',{balances:[],transactions:[]});}
function walletBalance(id){
 if(!id)return 0;
 const entry=walletState().balances.find(value=>value.id===id);
 return entry?entry.amount:100000;
}
function settleVirtualTrade(deal){
 const account=readDemo('sm_userAuth',null);
 if(!account?.id)throw new Error('로그인 후 거래를 완료해 주세요.');
 if(deal.buyerId && deal.buyerId!==account.id)throw new Error('약속서를 작성한 구매자 계정으로 로그인해 주세요.');
 const price=Number(deal.price);
 if(!Number.isSafeInteger(price)||price<0)throw new Error('거래 금액을 확인해 주세요.');
 const state=walletState();
 const key=deal.dealId || JSON.stringify([deal.itemId,deal.title,deal.date,deal.partner,account.id]);
 const prior=state.transactions.find(tx=>tx.dealId===key);
 if(prior){if(prior.buyerId!==account.id)throw new Error('다른 계정의 거래입니다.');return prior;}
 const item=readDemo('sm_items',[]).find(item=>item.id===deal.itemId);
 TradeFlow.validate(deal,item,account.id);
 if(!deal.receiptConfirmed)throw new Error('물건과 거래 조건을 확인한 뒤 완료해 주세요.');
 let sellerId=deal.sellerId || item?.ownerId;
 if(!sellerId){
  const matches=localAccounts().filter(value=>value.name===deal.partner);
  if(matches.length===1)sellerId=matches[0].id;
 }
 const isDefaultSample=SampleCatalog.isSample(item);
 if(isDefaultSample)sellerId='sample-seller-'+item.id;
 if(price>0 && !isDefaultSample && !localAccounts().some(value=>value.id===sellerId))throw new Error('유료 거래는 같은 브라우저에 등록된 판매자 계정이 필요합니다. 판매자가 등록한 상품으로 약속서를 작성해 주세요.');
 if(sellerId===account.id)throw new Error('본인 상품은 구매할 수 없습니다. 구매자 계정으로 로그인해 주세요.');
 const balance=id=>state.balances.find(value=>value.id===id)?.amount??100000;
 if(balance(account.id)<price)throw new Error('가상 잔액이 부족합니다. 현재 잔액: '+balance(account.id).toLocaleString()+'원');
 const setBalance=(id,amount)=>{const entry=state.balances.find(value=>value.id===id);if(entry)entry.amount=amount;else state.balances.push({id,amount});};
 if(sellerId && !Number.isSafeInteger(balance(sellerId)+price))throw new Error('판매자 잔액 한도를 초과합니다.');
 setBalance(account.id,balance(account.id)-price);
 if(sellerId)setBalance(sellerId,balance(sellerId)+price);
 const tx={dealId:key,buyerId:account.id,sellerId:sellerId||null,price,title:deal.title,createdAt:new Date().toISOString(),balanceAfter:balance(account.id)};
 state.transactions.push(tx);
 localStorage.setItem('sm_virtual_wallet',JSON.stringify(state));
 return tx;
}

function validProductPhoto(photo){return /^data:image\/(jpeg|png|webp);base64,/.test(photo||'')||/^assets\/sample-products\/(1|2|[4-9]|1[0-3])\.(svg|png)$/.test(photo||'');}
