/* 학습 시연용 가상 도서 기준 가격. 실제 서점 시세를 수집한 자료가 아닙니다. */
(function(root){
 const books=[
  {id:'demo-reference-001',title:'가상 참고서 A (학습 예시)',referencePrice:1000},
  {id:'demo-reference-002',title:'가상 수학 문제집 B (학습 예시)',referencePrice:10000},
  {id:'demo-reference-003',title:'가상 영어 단어장 C (학습 예시)',referencePrice:5000}
 ];
 const normalize=text=>String(text||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
 function pricing(item){
  if(!item)return {};
  // 등록자가 입력한 임의 기준 가격을 신뢰하지 않고 기준 목록과 대조합니다.
  const book=books.find(book=>(!item.referenceId||book.id===item.referenceId)&&normalize(book.title)===normalize(item.title));
  return book?{referencePrice:book.referencePrice,salePrice:Number(item.price),title:book.title,source:'가상 기준 가격 · 실제 시세 아님'}:{salePrice:Number(item.price)};
 }
 function describe(pricing){
  if(!pricing.referencePrice)return '비교 정보 없음 · 등록된 기준 가격이 없는 상품입니다.';
  return '가상 기준 '+pricing.referencePrice.toLocaleString()+'원 / 판매 '+pricing.salePrice.toLocaleString()+'원 / '+(pricing.salePrice/pricing.referencePrice).toLocaleString('ko-KR',{maximumFractionDigits:1})+'배 (실제 시세 아님)';
 }
 root.BookPrices={books,pricing,describe};
})(typeof globalThis!=='undefined'?globalThis:this);
