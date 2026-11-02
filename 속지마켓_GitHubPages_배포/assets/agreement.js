// 판매자는 조건 작성, 구매자는 읽기 전용 확인과 거래 요청을 담당합니다.
const agreementItemId=new URLSearchParams(location.search).get('item');
const agreementForm=document.getElementById('agreement-form');
const agreementResult=document.getElementById('agreement-result');
const findAgreementItem=()=>readDemo('sm_items',[]).find(item=>String(item.id)===agreementItemId&&item.type==='market');
const agreementItem=findAgreementItem();
const agreementSeller=Boolean(userAuth?.id&&agreementItem?.ownerId===userAuth.id);
const initialSignature=agreementItem?TradeFlow.signature(agreementItem):null;
const initialTerms=TradeFlow.terms(agreementItem);
function agreementUnavailable(message){
 agreementForm.hidden=true;const box=document.getElementById('agreement-empty');box.hidden=false;box.textContent=message;
 const link=document.createElement('a');link.className='secondary';link.href=userAuth?.id?'index.html':'login.html';link.textContent=userAuth?.id?'상품 목록으로':'로그인하기';box.appendChild(document.createElement('br'));box.appendChild(link);
}
if(!userAuth?.id)agreementUnavailable('로그인 후 상품 상세에서 거래 조건을 확인해 주세요.');
else if(!agreementItem)agreementUnavailable('메인에서 거래할 상품을 선택해 주세요.');
else if(!agreementSeller&&!initialTerms)agreementUnavailable('판매자가 아직 거래 조건을 작성하지 않았습니다. 채팅에서 판매자에게 조건 작성을 요청해 주세요.');
else{
 document.getElementById('agreement-empty').hidden=true;
 agreementForm.hidden=false;
 document.title=(agreementSeller?'판매 조건 작성':'거래 조건 확인')+' | 속지마켓';
 document.getElementById('agreement-heading').textContent=agreementSeller?'판매자 · 거래 조건 작성':'구매자 · 거래 조건 확인';
 document.getElementById('agreement-description').textContent=agreementSeller?'상품명과 가격은 등록 정보입니다. 조건을 저장하면 구매자가 확인할 수 있습니다. 기존 조건 변경 시 구매자는 다시 동의해야 합니다.':'판매자가 작성한 조건입니다. 내용을 확인하고 희망 일시를 정해 거래를 요청해 주세요. 잔액은 아직 차감되지 않습니다.';
 const data={title:agreementItem.title,price:agreementItem.price,partner:agreementItem.author,condition:initialTerms?.condition||'',method:initialTerms?.method||(Number(agreementItem.price)===0?'무료 나눔':'교내 직거래'),place:initialTerms?.place||agreementItem.zone,refund:initialTerms?.refund||''};
 for(const key of Object.keys(data))document.getElementById('deal-'+key).value=data[key];
 if(agreementSeller){
  document.getElementById('buyer-schedule').hidden=true;document.getElementById('deal-date').required=false;document.getElementById('deal-consent').required=false;
  document.getElementById('agreement-submit').textContent='거래 조건 저장';
 }else{
  ['condition','place','refund'].forEach(key=>document.getElementById('deal-'+key).readOnly=true);document.getElementById('deal-method').disabled=true;
  if(initialTerms.sample)document.getElementById('agreement-description').textContent+=' 기본 예시 판매자의 시연용 조건입니다.';
 }
}
agreementForm.addEventListener('submit',event=>{
 event.preventDefault();
 const account=readDemo('sm_userAuth',null),item=findAgreementItem(),value=id=>document.getElementById(id).value.trim();
 if(!account?.id||account.id!==userAuth?.id){agreementResult.textContent='로그인 계정이 변경되었습니다. 다시 로그인해 주세요.';return;}
 if(!item){agreementResult.textContent='상품이 삭제되었습니다. 메인에서 다시 확인해 주세요.';return;}
 if(TradeFlow.signature(item)!==initialSignature){agreementResult.textContent='판매 정보가 변경되었습니다. 새로고침 후 다시 확인해 주세요.';return;}
 try{
  if(agreementSeller){
   if(item.ownerId!==account.id)throw new Error('판매자만 조건을 작성할 수 있습니다.');
   const terms={condition:value('deal-condition'),method:value('deal-method'),place:value('deal-place'),refund:value('deal-refund'),revision:crypto.randomUUID(),updatedAt:new Date().toISOString()};
   if(!terms.condition||!terms.place||!terms.refund)throw new Error('상품 상태·장소·환불 조건을 입력해 주세요.');
   const goods=readDemo('sm_items',[]);const target=goods.find(g=>g.id===item.id);target.tradeTerms=terms;
   localStorage.setItem('sm_items',JSON.stringify(goods));
   agreementResult.textContent='거래 조건을 저장했습니다. 구매자가 상품 상세에서 확인할 수 있습니다.';
   document.getElementById('agreement-submit').disabled=true;
   const link=document.createElement('a');link.className='secondary';link.href='index.html';link.textContent='마켓으로 돌아가기';agreementResult.appendChild(document.createElement('br'));agreementResult.appendChild(link);
  }else{
   const terms=TradeFlow.terms(item),date=value('deal-date');
   if(!document.getElementById('deal-consent').checked||!date||!Number.isFinite(new Date(date).getTime()))throw new Error('거래 조건 동의와 희망 일시를 확인해 주세요.');
   const deal={flowVersion:2,dealId:crypto.randomUUID(),buyerId:account.id,sellerId:item.ownerId||null,itemId:item.id,title:item.title,price:Number(item.price),condition:terms.condition,partner:item.author,method:terms.method,place:terms.place,refund:terms.refund,date,buyerAccepted:true,buyerAcceptedAt:new Date().toISOString(),termsSignature:TradeFlow.signature(item),status:'buyer_requested',completed:false};
   TradeFlow.validate(deal,item,account.id);
   localStorage.setItem('sm_demo_deal',JSON.stringify(deal));location.href='index.html#complete';
  }
 }catch(error){agreementResult.textContent=error.message||'저장하지 못했습니다. 다시 시도해 주세요.';}
});
