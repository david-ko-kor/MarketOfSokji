/* 학습·브라우저가 같은 특징 추출기를 사용합니다. 원문은 외부로 전송하지 않습니다. */
(function(root){
 'use strict';
 const definitions=[
  ['advance','선입금·선송금 요구',['선입금','먼저 입금','먼저 송금','입금부터','송금부터','예약금','계약금','돈부터','미리 입금','미리 송금']],
  ['external','외부 연락·거래 유도',['카카오톡','카톡','텔레그램','오픈채팅','문자로','외부 채팅','밖에서 대화','개인 연락','디엠','dm으로']],
  ['urgency','송금·결정 재촉',['지금 바로','당장','빨리','오늘 안에','분 안에','지금 아니면','기다릴 수 없','즉시','서둘러','마감']],
  ['fee','약속 외 추가 비용',['추가금','추가 입금','수수료','보증금','보험료','인증비','해제비','추가 비용','택배비 더','추가 결제']],
  ['credential','비밀번호·인증번호 요구',['비밀번호','인증번호','otp','보안카드','카드번호','주민번호','신분증 사진','계정 로그인']],
  ['refuse_check','상품 확인·직거래 거부',['사진 못','사진은 안','확인 불가','확인은 안','검수 불가','직거래 안','직거래는 안','직거래 불가','직접 볼 수 없','실물 확인 안','사진 줄 수 없']],
  ['link','외부 링크 전송',['https://','http://','bit.ly','tinyurl','링크 눌','링크에서','주소 접속','안전결제 링크','결제 주소']],
  ['offcampus','교외 장소·택배 제안',['학교 밖','교외','택배로만','택배만','주차장','골목','집으로','외진','심야']],
  ['change_price','가격·조건 변경',['가격 올','가격이 올','금액 변경','약속한 가격 말고','더 보내','금액을 바꿔','가격 변경','가격 바꿔']],
  ['threat','위협·환불 거부',['환불 안','환불은 안','취소 안','신고하면','계정 차단','차단할','불이익','돈 안 돌려','돌려줄 수 없']],
  ['safe','교내 확인·약속 제안',['본관','도서관','학생회실','교내','실물 확인','직접 확인','확인 후','만나서','안심존','사진 보내','협의','영수증']],
  ['negation','위험 요구에 대한 거절·예방',[]]
 ];
 const negative=/(?:하지|보내지|입금하지|송금하지|누르지|알려주지|요구하지|재촉하지|추가하지|지불하지|접속하지|공유하지)\s*(?:마|않)|필요\s*없|요구\s*없|안\s*받|안\s*보내|하지\s*말|금지|거절|절대.*안\s*돼/;
 const norm=text=>String(text||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
 function extract(messages,pricing={}){
  const values=new Array(definitions.length).fill(0);
  for(const message of messages){
   if(message.sender==='system')continue;
   // 쉼표/종결부호 단위로 거절 표현을 분리합니다. 완전한 한국어 이해는 아닙니다.
   for(const clause of norm(message.text).split(/[!?\n,;]+|(?<=[요다])\./u)){
    if(negative.test(clause)){values[11]++;continue;}
    definitions.forEach(([, ,terms],i)=>{if(i<11&&terms.some(term=>clause.includes(term)))values[i]++;});
   }
  }
  const sale=Number(pricing.salePrice);
  const reference=Number(pricing.referencePrice);
  const known=Number.isFinite(sale)&&sale>=0&&Number.isFinite(reference)&&reference>0;
  return values.map(value=>Math.min(value,4)).concat([
   known?1:0,known?reference:0,Number.isFinite(sale)&&sale>=0?sale:0,
   known?Math.min(sale/reference,1000):0,known?Math.max(-1,Math.min((sale-reference)/reference,999)):0
  ]);
 }
 const api={version:'2.0.0',names:definitions.map(d=>d[0]).concat(['has_reference_price','reference_price','sale_price','price_ratio','price_delta_ratio']),labels:definitions.map(d=>d[1]).concat(['가격 비교 가능','기준 가격','판매 가격','가격 배수','가격 차이 비율']),extract};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ChatRiskFeatures=api;
})(typeof globalThis!=='undefined'?globalThis:this);
