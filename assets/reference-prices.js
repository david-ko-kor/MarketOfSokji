/* 공식 새 제품 공개 가격 스냅샷과 명확히 일치하는 상품만 비교합니다. */
(function(root){
 function normalize(text){return String(text||'').normalize('NFKC').toLowerCase().replace(/(?:판매합니다|판매해요|팝니다|판매중|중고|새상품|미개봉)/g,'').replace(/[\s()\-·,]/g,'');}
 function match(item){
  if(!item)return null;
  const title=normalize(item.title);
  const matches=(root.PRICE_REFERENCE_CATALOG||[]).filter(product=>[product.title,...product.aliases].some(alias=>normalize(alias)===title));
  return matches.length===1?matches[0]:null;
 }
 root.ReferencePrices={match,normalize};
})(typeof globalThis!=='undefined'?globalThis:this);
