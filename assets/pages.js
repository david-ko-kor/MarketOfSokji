function summary(entries) {
  return '<dl>' + entries.map(([label, value]) => `<div class="summary-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || '미입력')}</dd></div>`).join('') + '</dl>';
}
function refreshStudentPages() {
  const deal = readDemo('sm_demo_deal', null);
  document.getElementById('view-receipt').hidden=!deal?.completed;
  document.getElementById('completion-summary').innerHTML = deal
    ? summary([['상품명',deal.title],['결제 방식','가상 잔액 (실제 돈 아님)'],['내 체험 잔액',userAuth?.id?walletBalance(userAuth.id).toLocaleString()+'원':'로그인 필요'],['금액',Number(deal.price).toLocaleString()+'원'],['상품 상태',deal.condition],['거래 방법',deal.method],['환불 규칙',deal.refund || '미입력'],['상대 닉네임',deal.partner],['거래 장소',deal.place],['거래 일시',deal.date?.replace('T',' ')],['상태',deal.completed?'거래 완료 (체험)':'구매자 요청 저장 · 채팅에서 일정 확정']])
    : '<p>저장된 거래 약속이 없습니다. 약속서를 먼저 작성해 주세요.</p>';
  const preview=document.getElementById('payment-preview');
  const balance=userAuth?.id?walletBalance(userAuth.id):null;
  const price=Number(deal?.price);
  preview.hidden=!deal || deal.completed;
  if(deal&&!deal.completed){
   const valid=Number.isSafeInteger(price)&&price>=0;
   const remaining=balance!==null&&valid?balance-price:null;
   preview.innerHTML='<h3 class="transaction-heading">완료 전에 확인해 주세요</h3><label class="check"><input id="receipt-item-check" type="checkbox"> 물건과 상태를 확인했어요.</label><label class="check"><input id="receipt-terms-check" type="checkbox"> 거래 조건대로 받았어요.</label>'+summary([['거래금액',valid?price.toLocaleString()+'원':'금액 확인 필요'],['현재 체험 잔액',balance!==null?balance.toLocaleString()+'원':'로그인 필요'],['거래 후 예상 잔액',remaining===null?'로그인 후 확인':remaining<0?'잔액 부족':remaining.toLocaleString()+'원']])+'<p class="school-help">물건을 확인한 뒤 거래 완료를 확정해 주세요. 확정 시 구매자 잔액에서 차감되고 판매자 잔액에 반영됩니다. 약속서 작성만으로는 차감되지 않습니다. 실제 돈은 이동하지 않습니다.</p>';
  }
  updateAuthStatusUI();
  document.getElementById('complete-button').disabled = !deal || deal.completed;
  document.getElementById('complete-button').style.opacity = !deal || deal.completed ? '.45' : '1';
  const reports = readDemo('sm_demo_reports', []);
  document.getElementById('police-report-actions').hidden=!reports.length;
  document.getElementById('report-history').innerHTML = reports.length
    ? reports.map((report,index) => '<article class="report-record"><header class="report-record-header"><div><span class="report-record-label">신고 기록 '+(reports.length-index)+'</span><h3>'+escapeHtml(report.item || '상품명 없음')+'</h3></div><span class="report-record-date">'+escapeHtml(report.createdAt ? new Date(report.createdAt).toLocaleString('ko-KR') : '기존 저장 기록')+'</span></header>' + summary([['대상',report.person],['상품',report.item],['사유',report.reason],['내용',report.description],['저장 일시',report.createdAt ? new Date(report.createdAt).toLocaleString('ko-KR') : '기존 저장 기록'],['상태','브라우저에 저장 · 경찰청 제출 여부 미확인']]) + '</article>').join('')
    : '<p>이 브라우저에서 작성한 체험 신고가 없습니다.</p>';
  document.getElementById('profile-summary').innerHTML = summary([['학교',userAuth?.school],['체험 이름',userAuth?.name],['내 체험 잔액',userAuth?.id?walletBalance(userAuth.id).toLocaleString()+'원':'로그인 필요'],['학교명 확인',userAuth?.ocrVerification?.status==='school_name_matched'?'OCR 학교명 일치 · 로컬 체험':'학교 정보에서 확인 필요'],['대화방',Object.keys(chats).length+'개 (로컬 시연)'],['거래 약속',deal?.title || '없음'],['거래 상태',deal?.completed ? '완료 기록 있음' : '완료 기록 없음']]);
  const ownGoods=readDemo('sm_items',[]).filter(item=>userAuth?.id&&item.ownerId===userAuth.id&&item.type==='market');
  document.getElementById('seller-products').innerHTML=ownGoods.length?ownGoods.map(item=>'<div class="wallet-transaction"><strong>'+escapeHtml(item.title)+'</strong><a class="secondary" href="agreement.html?item='+encodeURIComponent(item.id)+'">판매 조건 작성·수정</a></div>').join(''):'<p class="school-help">등록한 중고거래 상품이 없습니다.</p>';
  const transactions=walletState().transactions.filter(tx=>userAuth?.id&&(tx.buyerId===userAuth.id||tx.sellerId===userAuth.id)).slice().reverse();
  document.getElementById('wallet-transactions').innerHTML=transactions.length?transactions.map(tx=>{
   const buying=tx.buyerId===userAuth.id;
   return '<article class="wallet-transaction"><div><strong>'+escapeHtml(tx.title||'상품 거래')+'</strong><p>'+escapeHtml(new Date(tx.createdAt).toLocaleString('ko-KR'))+' · '+(buying?'구매 완료':'판매 완료')+'</p></div><span class="'+(buying?'wallet-debit':'wallet-credit')+'">'+(buying?'−':'+')+Number(tx.price).toLocaleString()+'원</span></article>';
  }).join(''):'<p class="school-help">완료된 체험 거래가 없습니다.</p>';
}
function routePage() {
  const legacy={signup:'signup.html',login:'login.html',school:'auth.html',agreement:'agreement.html'};
  if(legacy[location.hash.slice(1)]){location.replace(legacy[location.hash.slice(1)]);return;}

  const requested = location.hash.slice(1) || 'home';
  const valid = [...document.querySelectorAll('[data-page]')].some(page=>page.dataset.page===requested);
  const current = valid ? requested : 'home';
  document.querySelectorAll('[data-page]').forEach(page => { page.hidden = page.dataset.page !== current; });
  refreshStudentPages();
  document.title = (document.querySelector('[data-page="'+current+'"] h2')?.textContent || '마켓 홈') + ' | 속지마켓';
}
window.addEventListener('hashchange', () => { routePage(); window.scrollTo(0,0); });
function selectedProduct() {
  const room = activeChatRoomId ? chats[activeChatRoomId] : null;
  return items.find(item => item.id === (room?.itemId ?? selectedItemId));
}
function closeFlowModals() {
  closeDetailModal(); closeChatModal();
}
function startAgreement() {
  const item=selectedProduct();
  if(item?.type!=='market'){alert('중고거래 상품을 선택해 주세요.');return;}
  location.href='agreement.html'+(item?'?item='+encodeURIComponent(item.id):'');
}
function startReport() {
  const item=selectedProduct();
  if(item) {
    document.getElementById('report-person').value=item.author;
    document.getElementById('report-item').value=item.title;
  }
  closeFlowModals(); location.hash='report';
}
function finalizeVirtualTrade(){
  const deal=readDemo('sm_demo_deal',null);
  if(!deal || deal.completed) return;
  let payment;
  if(!document.getElementById('receipt-item-check')?.checked||!document.getElementById('receipt-terms-check')?.checked){document.getElementById('completion-result').textContent='물건과 거래 조건을 먼저 확인해 주세요.';return;}
  deal.receiptConfirmed=true;
  try{payment=settleVirtualTrade(deal);}
  catch(error){document.getElementById('completion-result').textContent=error.message;return;}
  deal.payment=payment;
  deal.completed=true;
  deal.status='completed';
  deal.completedAt=new Date().toISOString();
  deal.myNickname=userAuth?.name || '체험 사용자';
  try{localStorage.setItem('sm_demo_deal',JSON.stringify(deal));}
  catch{document.getElementById('completion-result').textContent='거래 완료를 저장하지 못했습니다. 다시 시도해 주세요.';return;}
  refreshStudentPages();
  updateAuthStatusUI();
  location.href='receipt.html';
}
document.getElementById('complete-button').addEventListener('click',()=>{
 const deal=readDemo('sm_demo_deal',null);if(!deal||deal.completed)return;
 if(!userAuth?.id){document.getElementById('completion-result').textContent='로그인 후 거래를 완료해 주세요.';return;}
 try{TradeFlow.validate(deal,readDemo('sm_items',[]).find(item=>item.id===deal.itemId),userAuth.id);}catch(error){document.getElementById('completion-result').textContent=error.message;return;}
 if(!document.getElementById('receipt-item-check')?.checked||!document.getElementById('receipt-terms-check')?.checked){document.getElementById('completion-result').textContent='물건과 거래 조건을 먼저 확인해 주세요.';return;}
 const price=Number(deal.price),balance=walletBalance(userAuth.id);
 if(!Number.isSafeInteger(price)||price<0||balance<price){document.getElementById('completion-result').textContent='거래 금액과 체험 잔액을 확인해 주세요.';return;}
 let dialog=document.getElementById('trade-confirm-dialog');
 if(!dialog){
  dialog=document.createElement('dialog');dialog.id='trade-confirm-dialog';dialog.className='brand-alert-dialog';dialog.setAttribute('aria-labelledby','trade-confirm-title');
  dialog.innerHTML='<h2 id="trade-confirm-title">거래를 완료할까요?</h2><div id="trade-confirm-summary"></div><p>물건과 거래 내용을 확인하셨나요? 확정하면 체험 잔액에 반영됩니다.</p><div class="action-row"><button type="button" class="secondary" id="trade-confirm-cancel" autofocus>취소</button><button type="button" class="primary" id="trade-confirm-submit">거래 완료 확정</button></div>';
  document.body.appendChild(dialog);
  dialog.querySelector('#trade-confirm-cancel').addEventListener('click',()=>dialog.close());
  dialog.querySelector('#trade-confirm-submit').addEventListener('click',()=>{dialog.close();finalizeVirtualTrade();});
 }
 document.getElementById('trade-confirm-summary').innerHTML=summary([['거래금액',price.toLocaleString()+'원'],['거래 후 예상 잔액',(balance-price).toLocaleString()+'원']]);
 if(!dialog.open)dialog.showModal();
});
document.getElementById('report-form').addEventListener('submit',event=>{
  event.preventDefault();
  const value=id=>document.getElementById(id).value.trim();
  const reports=readDemo('sm_demo_reports',[]);
  reports.unshift({id:Date.now(),createdAt:Date.now(),person:value('report-person'),item:value('report-item'),reason:value('report-reason'),description:value('report-description')});
  try {
    localStorage.setItem('sm_demo_reports',JSON.stringify(reports));
    event.currentTarget.reset(); location.hash='history';
    refreshStudentPages();
  } catch {
    event.currentTarget.querySelector('.form-result').textContent='저장하지 못했습니다. 브라우저 저장 공간과 권한을 확인해 주세요. 입력 내용은 유지됩니다.';
  }
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape') {
    document.querySelectorAll('[id$="-modal"]').forEach(modal=>modal.classList.add('hidden'));
    activeChatRoomId=null;
  }
});
// 기존 폼도 label-input 연결을 갖도록 보완합니다.
document.querySelectorAll('label').forEach(label=>{
  const input=label.nextElementSibling;
  if(!label.htmlFor && input?.matches('input[id],select[id],textarea[id]')) label.htmlFor=input.id;
});
routePage();


window.addEventListener('load',()=>{
 if(location.hash==='#chats'){location.hash='home';openChatListModal();}
 if(location.hash==='#post'){location.hash='home';openPostModal();}
});

// 거래 상대에게 수여할 상장 선택·로컬 저장.
let selectedAward=null;
const awardGrid=document.querySelector('#page-awards .award-grid');
const awardNames=['매너상','따뜻상','빨라상','꼼꼼상','완벽상'];
const awardControls=document.createElement('div');
awardControls.className='action-row';
awardControls.innerHTML='<button type="button" class="primary" id="give-award" disabled>선택한 상장 수여</button><p id="award-result" class="form-result" role="status" aria-live="polite"></p>';
awardGrid.after(awardControls);
awardGrid.querySelectorAll('article').forEach((card,index)=>{
 const button=document.createElement('button');
 button.type='button';button.className='award-select';button.setAttribute('aria-pressed','false');
 button.innerHTML=card.innerHTML;
 button.querySelector('.status-chip').textContent='눌러서 선택';
 card.replaceWith(button);
 button.addEventListener('click',()=>{
  selectedAward=awardNames[index];
  awardGrid.querySelectorAll('button').forEach(option=>{
   const selected=option===button;
   option.setAttribute('aria-pressed',String(selected));
   option.querySelector('.status-chip').textContent=selected?'선택됨':'눌러서 선택';
  });
  document.getElementById('give-award').disabled=false;
  document.getElementById('award-result').textContent=selectedAward+'을 선택했습니다.';
 });
});
document.getElementById('give-award').addEventListener('click',()=>{
 const result=document.getElementById('award-result');
 const deal=readDemo('sm_demo_deal',null);
 if(!deal?.completed){result.textContent='거래 완료를 먼저 기록해 주세요.';return;}
 if(!selectedAward)return;
 const key=String(deal.completedAt || deal.date)+'|'+deal.title+'|'+deal.partner;
 const awards=readDemo('sm_given_awards',[]);
 if(awards.some(award=>award.dealKey===key)){result.textContent='이 거래에는 이미 상장을 수여했습니다.';return;}
 awards.unshift({dealKey:key,name:selectedAward,recipient:deal.partner,sender:deal.myNickname||userAuth?.name||'체험 사용자',item:deal.title,createdAt:new Date().toISOString()});
 try{
  localStorage.setItem('sm_given_awards',JSON.stringify(awards));
  result.textContent=deal.partner+'님에게 '+selectedAward+' 수여 기록을 저장했습니다. (이 브라우저 전용)';
  document.getElementById('give-award').disabled=true;
 }catch{result.textContent='상장을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.';}
});
