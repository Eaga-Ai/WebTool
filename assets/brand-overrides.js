(()=>{
  const brandZh='海外機會雷達';
  const brandEn='Overseas Opportunity Radar';
  const requestedLanguage=new URLSearchParams(location.search).get('lang');
  const isTraditionalChinese=['zh','zh-HK','zh-hk'].includes(requestedLanguage);
  const betaNotice=isTraditionalChinese
    ? '目前為 v0.1 demo 版，用於海外 App / 工具機會研究與 MVP 驗證。AI 分析結果僅作為產品假設與研究參考，不代表市場結論、收入承諾或投資建議。'
    : 'Currently in v0.1 demo mode, this tool is used for overseas app and tool opportunity research and MVP validation. AI analysis is only for product hypothesis and research reference. It does not represent market conclusions, revenue promises, or investment advice.';

  function replaceText(node,replacements){
    const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(textNode=>{
      let value=textNode.nodeValue;
      replacements.forEach(([from,to])=>{value=value.replaceAll(from,to);});
      textNode.nodeValue=value;
    });
  }
  function makeNotice(){
    const notice=document.createElement('p');
    notice.className='beta-notice';
    notice.textContent=betaNotice;
    return notice;
  }
  function opportunityMarkdown(){
    const fields=[...document.querySelectorAll('#form .field')];
    return `# ${brandZh}｜我的產品機會卡\n\n${fields.map(field=>{const label=field.querySelector('label')?.textContent?.trim()||'研究項目';const value=field.querySelector('textarea')?.value.trim()||'—';return `## ${label}\n${value}`;}).join('\n\n')}\n\n> 這是我的研究判斷，仍需回到原始資料並進行用戶驗證。`;
  }
  function updateOriginalExport(){
    const form=document.querySelector('#form');
    const output=document.querySelector('#out');
    const copy=document.querySelector('#copy');
    const download=document.querySelector('#download');
    if(!form||!output||!copy||!download)return;
    form.addEventListener('submit',()=>setTimeout(()=>{
      const preview=output.querySelector('pre');
      if(preview)preview.textContent=opportunityMarkdown();
    },0));
    copy.onclick=async()=>{
      try{await navigator.clipboard.writeText(opportunityMarkdown());alert('已複製 Markdown。');}
      catch{alert('瀏覽器未允許自動複製，請使用下載 Markdown。');}
    };
    download.onclick=()=>{
      const link=document.createElement('a');
      link.href=URL.createObjectURL(new Blob([opportunityMarkdown()],{type:'text/markdown;charset=utf-8'}));
      link.download='overseas-opportunity-card.md';
      link.click();
      URL.revokeObjectURL(link.href);
    };
  }
  function applyBrand(){
    const page=document.body.dataset.page;
    replaceText(document.body,[
      ['OVERSEAS PAIN RADAR','OVERSEAS OPPORTUNITY RADAR'],
      ['痛点雷达','海外機會雷達'],
      ['痛點雷達','海外機會雷達'],
      ['Pain radar','Overseas Opportunity Radar'],
      ['Overseas Pain Radar','Overseas Opportunity Radar'],
      ['返回海外機會雷達','返回海外機會雷達']
    ]);
    if(page==='home'){
      const eyebrow=document.querySelector('.hero .eyebrow');
      if(eyebrow)eyebrow.textContent=`${brandZh} · EVIDENCE-LED RESEARCH · v0.1`;
      const lead=document.querySelector('.hero .lead');
      if(lead&&!document.querySelector('.hero .beta-notice'))lead.insertAdjacentElement('afterend',makeNotice());
    }
    if(page==='workbench'){
      const title=document.querySelector('.work>h1');
      if(title)title.textContent=`${brandZh}工作台`;
      const lead=document.querySelector('.work>.lead');
      if(lead&&!document.querySelector('.work>.beta-notice'))lead.insertAdjacentElement('afterend',makeNotice());
      updateOriginalExport();
    }
    if(page==='pain')document.title=document.title.replace('Overseas Pain Radar',brandEn);
    document.title=document.title.replace('Overseas Pain Radar',brandEn).replace('海外痛点雷达',brandZh).replace('痛点雷达',brandZh);
  }
  applyBrand();
})();
