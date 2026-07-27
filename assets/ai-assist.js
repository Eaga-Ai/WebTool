(()=>{
  const isEnglish=new URLSearchParams(location.search).get('lang')==='en';
  const t=(zh,en)=>isEnglish?en:zh;
  const ids=['audience','context','current','waste','test','where'];
  const form=document.querySelector('#form');
  if(!form)return;
  const actions=form.querySelector('.actions');
  const button=document.createElement('button');
  const result=document.createElement('section');
  const slug=new URLSearchParams(location.search).get('pain');
  const pain=window.PAINS?.find(item=>item.slug===slug);
  button.type='button';button.className='button acid';button.id='ai-assist';button.textContent=t('AI 協助完善機會卡','AI Assist: Refine Opportunity Card');
  result.className='opportunity';result.hidden=true;
  actions.append(button);form.insertAdjacentElement('afterend',result);
  const addList=(title,items)=>{
    const heading=document.createElement('h3');heading.textContent=title;
    const list=document.createElement('ul');
    (Array.isArray(items)?items:[]).slice(0,4).forEach(item=>{const li=document.createElement('li');li.textContent=String(item);list.append(li);});
    result.append(heading,list);
  };
  button.onclick=async()=>{
    const answers=Object.fromEntries(ids.map(id=>[id,document.querySelector('#'+id)?.value.trim()||'']));
    if(Object.values(answers).filter(Boolean).length<2)return alert(t('請先至少填寫兩項，再讓 AI 協助整理。','Complete at least two fields before asking AI to organize them.'));
    button.disabled=true;button.textContent=t('正在整理…','Organizing…');
    try{
      const response=await fetch('/api/assist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers,pain:pain?{title:pain.title_zh,industry:pain.industry,pain_type:pain.pain_type,specific_task:pain.specific_task,pain_point:pain.pain_point}:null})});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||t('暫時無法完成整理','Unable to complete the review right now.'));
      result.replaceChildren();
      const eyebrow=document.createElement('div');eyebrow.className='eyebrow';eyebrow.style.color='#d7fa58';eyebrow.textContent='AI ASSISTED REVIEW';
      const heading=document.createElement('h2');heading.textContent=t('這個方向的待驗證重點','What still needs validation for this direction');
      const notice=document.createElement('p');notice.className='notice';notice.textContent=t('AI 只協助澄清資料、識別風險與提出驗證問題，不代表機會已成立。','AI only helps clarify material, identify risks, and suggest validation questions. It does not prove that an opportunity exists.');
      result.append(eyebrow,heading);addList(t('需要補充','What to add'),data.gaps);addList(t('需要留意','What to watch'),data.risks);addList(t('下一步驗證','Next validation steps'),data.questions);result.append(notice);
      result.hidden=false;result.scrollIntoView({behavior:'smooth',block:'nearest'});
    }catch(error){alert(error.message||t('暫時無法完成整理，請稍後再試。','Unable to complete the review right now. Please try again later.'));}
    finally{button.disabled=false;button.textContent=t('AI 協助完善機會卡','AI Assist: Refine Opportunity Card');}
  };
})();
