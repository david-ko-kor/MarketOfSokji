/* 학교명 대조와 OCR 엔진. 이미지·인식 전문은 저장하지 않습니다. */
(function(root){
 function normalize(value){return String(value||'').normalize('NFKC').replace(/\s+/g,'');}
 function inspect(text,confidence,enteredSchool){
  const schools=root.WONJU_SCHOOLS||[];
  const names=new Set();
  for(const line of String(text||'').split(/[\n\r:：]+/)){
   const compact=normalize(line).replace(/^학교명?/, '');
   const candidates=compact.match(/[가-힣]{2,25}(?:중학교|고등학교)/g)||[];
   for(const candidate of candidates)names.add(candidate);
  }
  const matched=schools.filter(school=>names.has(normalize(school.name)));
  const sample=/테스트용|가상학생증|sample|test-0001/i.test(normalize(text));
  if(!Number.isFinite(confidence)||confidence<45)return {ok:false,code:'low_confidence',sample,message:'인식이 불명확합니다. 학교명이 잘 보이도록 밝게 다시 촬영해 주세요.'};
  if(matched.length>1)return {ok:false,code:'ambiguous',sample,message:'여러 학교명이 감지되었습니다. 한 장의 학생증만 선택해 주세요.'};
  if(!matched.length)return {ok:false,code:names.size?'unlisted':'unreadable',sample,message:names.size?'원주 허용 학교 목록과 일치하지 않습니다. 지역 외 학교이거나 목록 확인이 필요한 학교입니다.':'학교명을 읽지 못했습니다. 학교명이 보이는 학생증 사진을 다시 선택해 주세요.'};
  if(!enteredSchool||normalize(enteredSchool)!==normalize(matched[0].name))return {ok:false,code:'mismatch',sample,message:'입력한 학교와 학생증 학교명이 다릅니다. 학교 입력을 확인하고 다시 인식해 주세요.'};
  return {ok:true,school:matched[0].name,region:'원주시',sample,confidence:Math.round(confidence),status:'school_name_matched'};
 }
 let sharedWorker=null;
 let progressListener=null;
 let recognizeActive=false;
 function resetEngine(){
  const pending=sharedWorker;sharedWorker=null;
  if(pending)pending.then(worker=>worker.terminate()).catch(()=>{});
 }
 async function recognize(image,onProgress){
  if(!root.Tesseract)throw new Error('OCR 라이브러리를 불러오지 못했습니다.');
  if(recognizeActive)throw new Error('이미 인식 중입니다.');
  recognizeActive=true;progressListener=onProgress;
  const start=performance.now();let timer;
  try{
   const job=(async()=>{
    if(!sharedWorker){
     let reportError;
     const errorSignal=new Promise((resolve,reject)=>{reportError=reject;});
     const boot=(async()=>{
      if(!root.OCR_BUNDLED_WORKER_SOURCE||!root.OCR_BUNDLED_KOR_GZIP)throw new Error('프로젝트의 OCR 내장 파일이 없습니다.');
      // 한국어 데이터 요청은 Worker 안의 메모리 응답으로 처리합니다.
      // 문자열 언어 코드로 초기화해 Tesseract의 객체 언어 초기화 오류를 피합니다.
      const languageLoader='const localKorBase64='+JSON.stringify(root.OCR_BUNDLED_KOR_GZIP)+';self.fetch=(url)=>{if(String(url).endsWith("/kor.traineddata.gz")){const raw=atob(localKorBase64);return Promise.resolve(new Response(Uint8Array.from(raw,c=>c.charCodeAt(0)),{status:200}));}return Promise.reject(new Error("Unexpected OCR resource request"));};\n';
      const workerUrl=URL.createObjectURL(new Blob([languageLoader,root.OCR_BUNDLED_WORKER_SOURCE],{type:'application/javascript'}));
      const languages=['kor'];
      const options={cacheMethod:'none',langPath:'https://local-ocr.invalid',workerPath:workerUrl,workerBlobURL:false,logger:message=>progressListener?.(message),errorHandler:error=>reportError(new Error(String(error)))};
      const worker=await root.Tesseract.createWorker(languages,1,options);
      URL.revokeObjectURL(workerUrl);
      await worker.setParameters({tessedit_pageseg_mode:'11'});
      return worker;
     })();
     sharedWorker=Promise.race([boot,errorSignal]);
    }
    const worker=await sharedWorker;
    const result=await worker.recognize(image);
    return {text:result.data.text,confidence:result.data.confidence,elapsedMs:Math.round(performance.now()-start)};
   })();
   const timeout=new Promise((resolve,reject)=>{timer=setTimeout(()=>{const error=new Error('OCR_TIMEOUT');error.code='OCR_TIMEOUT';reject(error);},30000);});
   return await Promise.race([job,timeout]);
  }catch(error){resetEngine();throw error;}
  finally{clearTimeout(timer);progressListener=null;recognizeActive=false;}
 }
 root.addEventListener?.('pagehide',resetEngine);
 root.StudentOCR={normalize,inspect,recognize};
})(typeof globalThis!=='undefined'?globalThis:this);
