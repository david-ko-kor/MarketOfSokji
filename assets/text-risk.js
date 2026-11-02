/* 기존 랜덤포레스트의 채팅 문장 경고. 가격 비교 모델과 별도로 실행합니다. */
(function(root){
 function probabilities(vector,model=root.CHAT_RISK_FOREST){
  if(!model||model.feature_version!==root.ChatRiskFeatures?.version)throw new Error('채팅 모델을 불러오지 못했습니다.');
  const votes=new Array(model.classes.length).fill(0);
  for(const tree of model.trees){let n=0;while(tree.left[n]!==-1)n=vector[tree.feature[n]]<=tree.threshold[n]?tree.left[n]:tree.right[n];tree.probabilities[n].forEach((v,i)=>votes[i]+=v/model.trees.length);}
  return votes;
 }
 function analyze(messages){
  const recent=messages.filter(m=>m.sender!=='system'&&String(m.text||'').trim()).slice(-8);
  if(!recent.length)return {level:0,reasons:[]};
  const contexts=recent.map(m=>[m]);const groups=new Map();
  for(const m of recent){if(!groups.has(m.sender))groups.set(m.sender,[]);groups.get(m.sender).push(m);}
  contexts.push(...groups.values());let best={level:0,reasons:[],strength:0};
  for(const context of contexts){
   const vector=root.ChatRiskFeatures.extract(context,{});const votes=probabilities(vector);const level=votes.indexOf(Math.max(...votes));
   if(level>best.level||(level===best.level&&votes[level]>best.strength))best={level,strength:votes[level],reasons:root.ChatRiskFeatures.labels.filter((label,index)=>index<10&&vector[index]>0)};
  }
  return best;
 }
 root.ChatRisk={probabilities,analyze};
})(typeof globalThis!=='undefined'?globalThis:this);
