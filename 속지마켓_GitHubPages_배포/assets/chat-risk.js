/* 채팅창 전용 가격 주의 표시. 상품등록·상세에는 분석 UI를 표시하지 않습니다. */
function updateChatPrice(){
 const panel=document.getElementById('chat-price-panel');
 if(!panel)return;
 const title=document.getElementById('chat-price-title');
 const detail=document.getElementById('chat-price-summary');
 const priceDetail=document.getElementById('chat-price-detail');
 const link=document.getElementById('chat-price-source');
 const room=activeChatRoomId?chats[activeChatRoomId]:null;
 const item=room?items.find(item=>item.id===room.itemId):null;
 link.hidden=true;link.removeAttribute('href');priceDetail.textContent='';
 try{
  const result=PriceRisk.evaluate(item);
  if(!result.available){
   panel.dataset.level='unavailable';title.textContent='가격 비교 정보 없음';
   detail.textContent='상품명·모델·규격과 일치하는 공개 기준 가격을 찾지 못했습니다. 가격이 적정하거나 안전하다는 뜻은 아닙니다.';return;
  }
  panel.dataset.level=result.attention?'1':'0';
  title.textContent=result.attention?'가격 주의 · 공개 기준보다 높은 판매가':'공개 기준 가격 참고';
  detail.textContent=result.attention
   ? '판매 금액이 수집한 새 제품 가격보다 크게 높습니다. 수량·구성품·모델을 상대방과 확인해 주세요. 사기 판정은 아닙니다.'
   : '현재 모델에서 큰 가격 차이 신호가 감지되지 않았습니다. 중고 적정가나 거래 안전을 보장하지 않습니다.';
  const ref=result.reference;
  priceDetail.textContent='판매 '+result.salePrice.toLocaleString()+'원 / 공식 새 제품 '+ref.referencePrice.toLocaleString()+'원 / '+result.ratio.toLocaleString('ko-KR',{maximumFractionDigits:1})+'배 · '+ref.observedDate+' 확인 · '+ref.unit;
  link.href=ref.sourceUrl;link.hidden=false;
 }catch{
  panel.dataset.level='unavailable';title.textContent='가격 분석을 사용할 수 없습니다.';
  detail.textContent='모델 또는 기준 가격 파일을 확인해 주세요. 채팅은 계속 사용할 수 있습니다.';
 }
}


// 채팅 위험 경고와 가격 비교를 독립적으로 갱신합니다.
function updateChatRisk(){
 const panel=document.getElementById('chat-risk-panel');
 if(panel){
  const title=document.getElementById('chat-risk-title');
  const detail=document.getElementById('chat-risk-detail');
  const report=document.getElementById('chat-risk-report');
  const room=activeChatRoomId?chats[activeChatRoomId]:null;
  const messages=room?[...room.messages]:[];
  const draft=document.getElementById('chat-input').value.trim();
  if(draft)messages.push({sender:userAuth?.name||'나',text:draft});
  try{
   const result=ChatRisk.analyze(messages);
   panel.dataset.level=String(result.level);
   title.textContent=['뚜렷한 거래 주의 신호 미감지','거래 주의 신호 감지','강한 거래 주의 신호 감지'][result.level];
   detail.textContent=result.level
    ? (draft?'입력 중인 내용과 최근 대화':'최근 대화')+'에서 주의 신호를 감지했습니다. '+(result.reasons.length?'관련 표현: '+result.reasons.slice(0,3).join(' · ')+'. ':'')+'송금 전에 상품과 거래 조건을 확인하세요.'
    : '최근 대화와 입력 내용을 확인합니다. 경고가 없어도 거래 안전을 보장하지 않습니다.';
   report.hidden=!result.level;
  }catch{
   panel.dataset.level='unavailable';title.textContent='채팅 위험 분석을 사용할 수 없습니다.';
   detail.textContent='모델 파일을 확인해 주세요. 채팅과 가격 비교는 별도로 사용할 수 있습니다.';report.hidden=true;
  }
 }
 updateChatPrice();
}
window.updateChatRisk=updateChatRisk;
let riskDraftTimer;
document.getElementById('chat-input')?.addEventListener('input',()=>{clearTimeout(riskDraftTimer);riskDraftTimer=setTimeout(updateChatRisk,200);});
document.querySelectorAll('[data-risk-example]').forEach(button=>button.addEventListener('click',()=>{
 document.getElementById('chat-input').value=button.dataset.riskExample;document.getElementById('chat-input').focus();updateChatRisk();
}));
document.getElementById('chat-risk-report')?.addEventListener('click',()=>{
 const room=activeChatRoomId?chats[activeChatRoomId]:null;
 if(room){document.getElementById('report-person').value=room.partner;document.getElementById('report-item').value=room.itemTitle;}
 closeChatModal();location.hash='report';
});
