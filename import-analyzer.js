(()=>{
  const TEXT_FIELDS=['review_text','review','text','content','body','description'];
  const META_FIELDS=['title','rating','date','published_at','product_name','competitor_name','source_url'];
  const MAX_FILE_BYTES=2*1024*1024;
  const MAX_RAW_CHARS=24000;
  const main=document.querySelector('main.work');
  if(!main)return;

  const el=(tag,options={})=>{
    const node=document.createElement(tag);
    Object.entries(options).forEach(([key,value])=>{
      if(key==='text')node.textContent=value;
      else if(key==='className')node.className=value;
      else if(key==='attrs')Object.entries(value).forEach(([name,attrValue])=>node.setAttribute(name,attrValue));
    });
    return node;
  };
  const label=(text,control)=>{
    const wrap=el('div',{className:'field'});
    wrap.append(el('label',{text}),control);
    return wrap;
  };
  const option=(value,text)=>el('option',{text,attrs:{value}});
  const select=(values)=>{
    const node=el('select');
    values.forEach(([value,text])=>node.append(option(value,text)));
    return node;
  };
  const textArea=(rows=5,placeholder='')=>el('textarea',{attrs:{rows,placeholder}});
  const toText=value=>Array.isArray(value)?value.filter(Boolean).map(item=>`- ${item}`).join('\n'):String(value||'');
  const fromText=value=>String(value||'').split('\n').map(item=>item.replace(/^\s*[-•]\s*/, '').trim()).filter(Boolean);
  const escapeCsvRow=row=>row.map(value=>`"${String(value??'').replace(/"/g,'""')}"`).join(',');

  function parseCsv(source){
    const rows=[];let row=[],cell='',quoted=false;
    for(let i=0;i<source.length;i+=1){
      const char=source[i],next=source[i+1];
      if(char==='"'&&quoted&&next==='"'){cell+='"';i+=1;continue;}
      if(char==='"'){quoted=!quoted;continue;}
      if(char===','&&!quoted){row.push(cell);cell='';continue;}
      if((char==='\n'||char==='\r')&&!quoted){
        if(char==='\r'&&next==='\n')i+=1;
        row.push(cell);cell='';
        if(row.some(value=>value.trim()))rows.push(row);
        row=[];continue;
      }
      cell+=char;
    }
    row.push(cell);if(row.some(value=>value.trim()))rows.push(row);
    if(rows.length<2)return [];
    const headers=rows[0].map(value=>value.trim().toLowerCase());
    return rows.slice(1).map(values=>Object.fromEntries(headers.map((key,index)=>[key,values[index]||''])));
  }
  function parseJson(source){
    const parsed=JSON.parse(source);
    if(Array.isArray(parsed))return parsed;
    if(Array.isArray(parsed?.data))return parsed.data;
    if(Array.isArray(parsed?.reviews))return parsed.reviews;
    if(Array.isArray(parsed?.items))return parsed.items;
    return parsed&&typeof parsed==='object'?[parsed]:[];
  }
  function normalizeRecords(records){
    return records.filter(record=>record&&typeof record==='object').map(record=>{
      const normalized={};
      Object.entries(record).forEach(([key,value])=>{normalized[key.toLowerCase()]=typeof value==='object'?JSON.stringify(value):String(value??'');});
      return normalized;
    });
  }
  function recordToText(record,index){
    const lines=[];
    META_FIELDS.forEach(key=>{if(record[key])lines.push(`${key}: ${record[key]}`);});
    const content=TEXT_FIELDS.map(key=>record[key]).find(Boolean);
    if(content)lines.push(`content: ${content}`);
    if(!lines.length)lines.push(`raw_record: ${JSON.stringify(record)}`);
    return `[Imported record ${index+1}]\n${lines.join('\n')}`;
  }
  function downloadMarkdown(markdown){
    const link=document.createElement('a');
    link.href=URL.createObjectURL(new Blob([markdown],{type:'text/markdown;charset=utf-8'}));
    link.download='external-source-opportunity-analysis.md';
    link.click();
    URL.revokeObjectURL(link.href);
  }
  async function copyMarkdown(markdown){
    try{await navigator.clipboard.writeText(markdown);alert('已复制 Markdown。');}
    catch{alert('浏览器未允许自动复制，请使用下载 Markdown。');}
  }

  const section=el('section',{className:'external-analyzer',attrs:{'aria-labelledby':'external-analysis-title'}});
  const header=el('div',{className:'section-head'});
  const headingWrap=el('div');
  headingWrap.append(el('div',{className:'eyebrow',text:'OVERSEAS OPPORTUNITY RADAR · LOCAL IMPORT'}),el('h2',{text:'外部資料分析｜海外機會雷達'}),el('p',{className:'lead',text:'導入公開產品資料、評論、榜單或競品分析。AI 只根據你提供的內容整理，不補造下載量、收入、排名或來源。'}));
  header.append(headingWrap);
  section.append(header);
  const form=el('form',{className:'form external-form'});
  const direction=el('input',{attrs:{type:'text',required:'',placeholder:'例如：AI calorie tracker / Shopify SEO app'}});
  const platform=select([['App Store','App Store'],['Google Play','Google Play'],['Chrome Web Store','Chrome Web Store'],['Shopify App Store','Shopify App Store'],['Product Hunt','Product Hunt'],['G2/Capterra','G2/Capterra'],['Other','Other']]);
  const market=select([['US','US'],['UK','UK'],['India','India'],['Brazil','Brazil'],['Mexico','Mexico'],['Global','Global'],['Other','Other']]);
  const sourceType=select([['Product Page','Product Page'],['Reviews','Reviews'],['Ranking','Ranking'],['Pricing','Pricing'],['Competitor Analysis','Competitor Analysis'],['Mixed','Mixed']]);
  const competitors=textArea(2,'可选，例如：Cal AI；MyFitnessPal；YAZIO');
  const rawContent=textArea(10,'粘贴产品介绍、评论、榜单或竞品资料。每段资料尽量保留来源链接。');
  rawContent.maxLength=MAX_RAW_CHARS;
  const fileInput=el('input',{attrs:{type:'file',accept:'.csv,.json,text/csv,application/json'}});
  const importStatus=el('p',{className:'import-status',text:'尚未导入文件。支持常见评论、产品与来源字段。'});
  form.append(
    label('研究方向',direction),label('目标平台',platform),label('目标市场',market),label('资料类型',sourceType),
    label('代表竞品（可选）',competitors),label('原始资料',rawContent),label('导入 CSV / JSON（本机文件）',fileInput),importStatus
  );
  const actions=el('div',{className:'actions'});
  const analyze=el('button',{className:'button acid',text:'分析外部资料',attrs:{type:'submit'}});
  const copy=el('button',{className:'outline',text:'复制分析 Markdown',attrs:{type:'button'}});
  const download=el('button',{className:'outline',text:'下载分析 Markdown',attrs:{type:'button'}});
  copy.disabled=true;download.disabled=true;
  actions.append(analyze,copy,download);form.append(actions);section.append(form);
  const result=el('section',{className:'external-result'});result.hidden=true;section.append(result);
  main.append(section);

  function field(labelText,key,value,rows=3){
    const input=textArea(rows);
    input.dataset.analysisKey=key;
    input.value=toText(value);
    return label(labelText,input);
  }
  function renderResult(data){
    result.replaceChildren();
    result.append(el('div',{className:'eyebrow',text:'EVIDENCE-LED OPPORTUNITY ANALYSIS'}),el('h2',{text:'可編輯的出海機會卡'}),el('p',{className:'notice',text:'以下結論僅依據本次導入資料整理。修改後可複製或下載；請繼續核對原連結與實際市場情況。'}));
    const score=el('div',{className:'analysis-score'});
    score.append(el('strong',{text:`机会评分：${Math.min(100,Math.max(1,Number(data.opportunity_score)||1))} / 100`}),el('span',{text:data.opportunity_score_reason||'评分仅用于研究优先级，不代表市场结论。'}));
    result.append(score);
    const editor=el('div',{className:'analysis-editor'});
    [
      ['资料摘要与来源类型','source_summary'],['代表竞品','representative_competitors'],['重复出现的用户痛点','repeated_pain_points'],['好评洞察','positive_insights'],['差评洞察','negative_insights'],['功能请求','feature_requests'],['价格／订阅抱怨','pricing_complaints'],['现有替代方案','current_alternatives'],['AI 可切入点','ai_entry_points'],['待验证假设','validation_hypotheses'],['合规或平台风险','compliance_risks'],['MVP 范围建议','mvp_scope'],['不建议第一版做什么','avoid_first_version'],['MVP 验证任务书','mvp_validation_task']
    ].forEach(([title,key])=>editor.append(field(title,key,data[key],key==='mvp_validation_task'?6:3)));
    result.append(editor);
    result.hidden=false;
    copy.disabled=false;download.disabled=false;
    result.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function markdown(){
    const values=Object.fromEntries([...result.querySelectorAll('[data-analysis-key]')].map(input=>[input.dataset.analysisKey,input.value.trim()]));
    const score=result.querySelector('.analysis-score strong')?.textContent||'机会评分：待生成';
    const reason=result.querySelector('.analysis-score span')?.textContent||'';
    const titles={source_summary:'资料摘要与来源类型',representative_competitors:'代表竞品',repeated_pain_points:'重复出现的用户痛点',positive_insights:'好评洞察',negative_insights:'差评洞察',feature_requests:'功能请求',pricing_complaints:'价格／订阅抱怨',current_alternatives:'现有替代方案',ai_entry_points:'AI 可切入点',validation_hypotheses:'待验证假设',compliance_risks:'合规或平台风险',mvp_scope:'MVP 范围建议',avoid_first_version:'不建议第一版做什么',mvp_validation_task:'MVP 验证任务书'};
    const research=`研究方向：${direction.value.trim()||'—'}\n目标平台：${platform.value}\n目标市场：${market.value}\n资料类型：${sourceType.value}\n代表竞品（输入）：${competitors.value.trim()||'—'}`;
    return `# 海外機會雷達｜外部資料出海機會分析\n\n${research}\n\n## ${score}\n${reason}\n\n${Object.entries(titles).map(([key,title])=>`## ${title}\n${values[key]||'—'}`).join('\n\n')}\n\n> 本分析僅基於本次導入資料整理，不代表市場結論、投資建議或產品承諾。請核對原始來源並自行驗證。`;
  }
  fileInput.addEventListener('change',async()=>{
    const file=fileInput.files?.[0];
    if(!file)return;
    if(file.size>MAX_FILE_BYTES){importStatus.textContent='文件超过 2 MB，请先筛选或拆分后再导入。';fileInput.value='';return;}
    try{
      const source=await file.text();
      const records=normalizeRecords(file.name.toLowerCase().endsWith('.json')?parseJson(source):parseCsv(source));
      if(!records.length)throw Error('未能识别可导入的记录');
      const imported=records.map(recordToText).join('\n\n');
      const prefix=rawContent.value.trim()?`${rawContent.value.trim()}\n\n` : '';
      rawContent.value=(prefix+imported).slice(0,MAX_RAW_CHARS);
      importStatus.textContent=`已导入 ${records.length} 条记录，可继续在原始资料框内编辑。`;
    }catch(error){importStatus.textContent=`导入失败：${error.message||'请确认文件是有效 CSV 或 JSON。'}`;}
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const content=rawContent.value.trim();
    if(!direction.value.trim())return alert('请先填写研究方向。');
    if(content.length<40)return alert('请至少粘贴一段可供分析的原始资料。');
    analyze.disabled=true;analyze.textContent='正在分析…';
    try{
      const response=await fetch('/api/assist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'external_source_analysis',research:{research_direction:direction.value.trim(),target_platform:platform.value,target_market:market.value,source_type:sourceType.value,competitor_names:competitors.value.trim(),raw_content:content}})});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||'暂时无法完成分析');
      renderResult(data);
    }catch(error){alert(error.message||'暂时无法完成分析，请稍后再试。');}
    finally{analyze.disabled=false;analyze.textContent='分析外部资料';}
  });
  copy.addEventListener('click',()=>copyMarkdown(markdown()));
  download.addEventListener('click',()=>downloadMarkdown(markdown()));
})();
