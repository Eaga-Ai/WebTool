(()=>{
  const ids=['audience','context','current','waste','test','where'];
  const form=document.querySelector('#form');
  if(!form)return;
  const actions=form.querySelector('.actions');
  const button=document.createElement('button');
  const result=document.createElement('section');
  const slug=new URLSearchParams(location.search).get('pain');
  const pain=window.PAINS?.find(item=>item.slug===slug);
  button.type='button';button.className='button acid';button.id='ai-assist';button.textContent='AI 协助完善机会卡';
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
    if(Object.values(answers).filter(Boolean).length<2)return alert('请先至少填写两项，再让 AI 协助整理。');
    button.disabled=true;button.textContent='正在整理…';
    try{
      const response=await fetch('/api/assist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers,pain:pain?{title:pain.title_zh,industry:pain.industry,pain_type:pain.pain_type,specific_task:pain.specific_task,pain_point:pain.pain_point}:null})});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||'暂时无法完成整理');
      result.replaceChildren();
      const eyebrow=document.createElement('div');eyebrow.className='eyebrow';eyebrow.style.color='#d7fa58';eyebrow.textContent='AI ASSISTED REVIEW';
      const heading=document.createElement('h2');heading.textContent='针对这个痛点的待验证重点';
      const notice=document.createElement('p');notice.className='notice';notice.textContent='AI 只协助澄清信息、识别风险与提出验证问题，不代表机会成立。';
      result.append(eyebrow,heading);addList('需要补充',data.gaps);addList('需要留意',data.risks);addList('下一步验证',data.questions);result.append(notice);
      result.hidden=false;result.scrollIntoView({behavior:'smooth',block:'nearest'});
    }catch(error){alert(error.message||'暂时无法完成整理，请稍后重试。');}
    finally{button.disabled=false;button.textContent='AI 协助完善机会卡';}
  };
})();
