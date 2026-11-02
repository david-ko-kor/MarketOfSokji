/* 공식 기준가 + 판매가 → 학습한 랜덤포레스트 실행. 텍스트 분류는 수행하지 않습니다. */
(function(root){
 function extract(reference,sale){
  const known=reference!==null&&Number.isFinite(reference)&&reference>0&&Number.isFinite(sale)&&sale>=0;
  return [known?1:0,known?reference:0,Number.isFinite(sale)?sale:0,known?Math.min(sale/reference,1000):0,known?Math.min((sale-reference)/reference,999):0];
 }
 function predict(vector,model=root.PRICE_RISK_MODEL){
  if(!model||model.version!=='price-only-rf-v3')throw new Error('가격 모델을 불러오지 못했습니다.');
  const scores=[0,0];
  for(const tree of model.trees){let node=0;while(tree.left[node]!==-1)node=vector[tree.feature[node]]<=tree.threshold[node]?tree.left[node]:tree.right[node];tree.probabilities[node].forEach((v,i)=>scores[i]+=v/model.trees.length);}
  return scores;
 }
 function evaluate(item){
  const reference=root.ReferencePrices.match(item);
  const sale=Number(item?.price);
  if(!reference)return {available:false,reason:'reference_not_found'};
  if(!Number.isSafeInteger(sale)||sale<0)return {available:false,reason:'invalid_price'};
  const scores=predict(extract(reference.referencePrice,sale));
  return {available:true,attention:scores[1]>scores[0],reference,salePrice:sale,ratio:sale/reference.referencePrice,difference:sale-reference.referencePrice};
 }
 root.PriceRisk={extract,predict,evaluate};
})(typeof globalThis!=='undefined'?globalThis:this);
