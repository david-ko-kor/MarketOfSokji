// 판매자 조건과 구매자 동의의 로컬 시제품 규칙입니다.
window.TradeFlow={
 terms(item){
  if(!item)return null;
  if(item.tradeTerms)return item.tradeTerms;
  if(!item.ownerId&&[1,2,3].includes(item.id)&&item.type==='market')return {condition:item.id===1?'필기 없는 새책급':'상품 설명과 실물을 확인해 주세요.',method:Number(item.price)===0?'무료 나눔':'교내 직거래',place:item.zone,refund:'설명과 다른 하자가 있으면 거래 전 판매자와 협의합니다.',revision:'sample-v1',sample:true};
  return null;
 },
 signature(item){return JSON.stringify([item.id,item.ownerId||null,item.title,Number(item.price),this.terms(item)]);},
 validate(deal,item,buyerId){
  if(!buyerId||deal.buyerId!==buyerId)throw new Error('약속서를 작성한 구매자 계정으로 로그인해 주세요.');
  if(!item||item.type!=='market')throw new Error('상품을 찾을 수 없습니다. 상품 목록에서 다시 확인해 주세요.');
  const sold=soldItemRecord(item);
  if(sold&&(!deal.dealId||sold.dealId!==deal.dealId))throw new Error('이미 거래완료된 상품입니다. 다른 상품을 선택해 주세요.');
  if(item.ownerId===buyerId)throw new Error('본인 상품은 구매할 수 없습니다.');
  if(deal.flowVersion!==2||!deal.buyerAccepted||!this.terms(item))throw new Error('상품 상세에서 판매 조건을 확인하고 다시 거래를 요청해 주세요.');
  if(deal.termsSignature!==this.signature(item)||Number(deal.price)!==Number(item.price))throw new Error('판매 조건이 변경되었습니다. 상품 상세에서 다시 확인·동의해 주세요.');
 }
};
