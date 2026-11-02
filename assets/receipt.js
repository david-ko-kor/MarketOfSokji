// 완료된 로컬 거래만 확인증으로 표시합니다.
const receiptDeal=readDemo('sm_demo_deal',null);
const receiptSummary=document.getElementById('receipt-summary');
if(!receiptDeal?.completed){
 receiptSummary.innerHTML='<p>완료된 거래가 없습니다. 약속서를 저장하고 거래 완료를 먼저 기록해 주세요.</p><div class="action-row"><a class="secondary" href="index.html#complete">거래 내역으로</a></div>';
}else{
 const entries=[['결제 방식','가상 잔액 (실제 돈 아님)'],['거래 후 구매자 잔액',receiptDeal.payment?Number(receiptDeal.payment.balanceAfter).toLocaleString()+'원':'기존 기록 · 가상 결제 전'],['내 닉네임',receiptDeal.myNickname || userAuth?.name || '기존 기록 · 미입력'],['상대 닉네임',receiptDeal.partner],['상품명',receiptDeal.title],['가격',Number(receiptDeal.price).toLocaleString()+'원'],['거래 장소',receiptDeal.place],['거래 날짜',receiptDeal.date?.replace('T',' ')],['환불 규칙',receiptDeal.refund || '미입력'],['완료 기록 일시',receiptDeal.completedAt?new Date(receiptDeal.completedAt).toLocaleString('ko-KR'):'기존 완료 기록']];
 receiptSummary.innerHTML='<dl>'+entries.map(([label,value])=>'<div class="summary-row"><dt>'+escapeHtml(label)+'</dt><dd>'+escapeHtml(value||'미입력')+'</dd></div>').join('')+'</dl>';
 document.getElementById('receipt-actions').hidden=false;
}
