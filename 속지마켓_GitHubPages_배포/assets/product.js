// 제품등록 전용: 사진은 작게 변환해 로컬 저장소에 저장합니다.
let productPhoto='';
let processingPhoto=false;
let photoVersion=0;
const photoInput=document.getElementById('product-photo');
const photoResult=document.getElementById('product-result');
function showPhoto(){
 const preview=document.getElementById('product-preview');
 preview.hidden=!productPhoto;
 if(productPhoto)preview.src=productPhoto;else preview.removeAttribute('src');
 document.getElementById('photo-placeholder').hidden=Boolean(productPhoto);
 document.getElementById('remove-photo').hidden=!productPhoto;
}
photoInput.addEventListener('change',async()=>{
 const version=++photoVersion;
 const file=photoInput.files[0];
 if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){photoResult.textContent='10MB 이하 JPG·PNG·WebP 사진을 선택해 주세요.';photoInput.value='';return;}
 processingPhoto=true;photoResult.textContent='사진을 준비하고 있습니다.';
 try{
  const bitmap=await createImageBitmap(file);
  const ratio=Math.min(1,900/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
  const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  if(version!==photoVersion)return;
  productPhoto=canvas.toDataURL('image/jpeg',0.75);showPhoto();photoResult.textContent='사진을 선택했습니다.';
 }catch{if(version===photoVersion)photoResult.textContent='사진을 읽지 못했습니다. 다른 사진을 선택해 주세요.';}
 finally{if(version===photoVersion)processingPhoto=false;}
});
document.getElementById('remove-photo').addEventListener('click',()=>{photoVersion++;processingPhoto=false;productPhoto='';photoInput.value='';showPhoto();photoResult.textContent='';});
document.getElementById('product-form').addEventListener('submit',event=>{
 event.preventDefault();
 userAuth=readDemo('sm_userAuth',null);
 if(!userAuth?.id){photoResult.innerHTML='제품등록은 로그인 후 가능합니다. <a href="login.html">로그인하기</a>';return;}
 if(processingPhoto){photoResult.textContent='사진 처리가 끝난 후 등록해 주세요.';return;}
 const title=document.getElementById('product-title').value.trim();
 const desc=document.getElementById('product-desc').value.trim();
 const zone=document.getElementById('product-zone').value.trim();
 const price=Number(document.getElementById('product-price').value);
 if(!title||!desc||!zone||!Number.isSafeInteger(price)||price<0){photoResult.textContent='상품 정보와 0 이상의 정수 가격을 입력해 주세요.';return;}
 const items=readDemo('sm_items',[]);
 const productId=Date.now();
 items.unshift({id:productId,createdAt:Date.now(),type:'market',title,desc,zone,price,photo:productPhoto,category:'🎁 기타',ownerId:userAuth.id,author:userAuth.name});
 try{localStorage.setItem('sm_items',JSON.stringify(items));location.href='agreement.html?item='+encodeURIComponent(productId);}
 catch{photoResult.textContent='브라우저 저장 공간이 부족하거나 저장이 차단되었습니다. 사진을 줄이거나 삭제한 뒤 다시 등록해 주세요.';}
});
if(!userAuth?.id)photoResult.innerHTML='제품등록은 로그인 후 가능합니다. <a href="login.html">로그인하기</a>';

