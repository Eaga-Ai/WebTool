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
  const label=(text,control)=>{const wrap=el('div',{className:'field'});wrap.append(el('label',{text}),control);return wrap;};
  const option=(value,text)=>el('option',{text,attrs:{value}});
  const select=values=>{const node=el('select');values.forEach(([value,text])=>node.append(option(value,text)));return node;};
  const textArea=(rows=5,placeholder='')=>el('textarea',{attrs:{rows,placeholder}});

  function formatAnalysisValue(value,indent=''){
    if(value===null||value===undefined||value==='')return '—';
    if(Array.isArray(value))return value.length?value.map(item=>`${indent}- ${formatAnalysisValue(item,`${indent}  `).replace(/^\s*-\s*/, '')}`).join('\n'):'—';
    if(typeof value==='object'){
      const entries=Object.entries(value);
      return entries.length?entries.map(([key,item])=>`${indent}- ${key}：${formatAnalysisValue(item,`${indent}  `).replace(/^\s*-\s*/, '')}`).join('\n'):'—';
    }
    return String(value).trim()||'—';
  }
  const escapeCsvRow=row=>row.map(value=>`"${String(value??'').replace(/"/g,'""')}"`).join(',');

  function parseCsv(source){
    const rows=[];let row=[],cell='',quoted=false;
    for(let index=0;index<source.length;index+=1){
      const char=source[index],next=source[index+1];
      if(char==='"'&&quoted&&next==='"'){cell+='"';index+=1;continue;}
      if(char==='"'){quoted=!quoted;continue;}
      if(char===','&&!quoted){row.push(cell);cell='';continue;}
      if((char==='\n'||char==='\r')&&!quoted){
        if(char==='\r'&&next==='\n')index+=1;
        row.push(cell);cell='';if(row.some(value=>value.trim()))rows.push(row);row=[];continue;
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
    link.download='overseas-opportunity-radar-analysis.md';link.click();URL.revokeObjectURL(link.href);
  }
  async function copyMarkdown(markdown){
    try{await navigator.clipboard.writeText(markdown);alert('已複製 Markdown。');}
    catch{alert('瀏覽器未允許自動複製，請使用下載 Markdown。');}
  }

  const section=el('section',{className:'external-analyzer',attrs:{'aria-labelledby':'external-analysis-title'}});
  const header=el('div',{className:'section-head'});
  const headingWrap=el('div');
  headingWrap.append(
    el('div',{className:'eyebrow',text:'OVERSEAS OPPORTUNITY RADAR · LOCAL IMPORT'}),
    el('h2',{text:'外部資料分析｜海外機會雷達',attrs:{id:'external-analysis-title'}}),
    el('p',{className:'lead',text:'貼上海外 App 評論、產品介紹或競品資料，AI 會幫你整理：用戶在抱怨什麼、哪裡有機會、第一版產品該怎麼驗證。'}),
    el('p',{className:'analysis-hint',text:'資料越真實，分析越有價值。AI 不會自動補造下載量、收入、排名或來源。'})
  );
  header.append(headingWrap);section.append(header);

  const form=el('form',{className:'form external-form'});
  const direction=el('input',{attrs:{type:'text',required:'',placeholder:'例如：Shopify SEO App、AI calorie tracker、Chrome LinkedIn AI extension'}});
  const rawContent=textArea(10,'可以貼 App 評論、產品介紹、競品資料、榜單文字、差評摘要等。每段資料盡量保留來源連結。');
  rawContent.maxLength=MAX_RAW_CHARS;
  const platform=select([['Auto / Mixed','Auto / Mixed（預設）'],['App Store','App Store'],['Google Play','Google Play'],['Chrome Web Store','Chrome Web Store'],['Shopify App Store','Shopify App Store'],['Product Hunt','Product Hunt'],['G2/Capterra','G2/Capterra'],['Other','Other']]);
  const market=select([['Global','Global / US（預設）'],['US','US'],['UK','UK'],['India','India'],['Brazil','Brazil'],['Mexico','Mexico'],['Other','Other']]);
  const sourceType=select([['Mixed','Mixed（預設）'],['Product Page','Product Page'],['Reviews','Reviews'],['Ranking','Ranking'],['Pricing','Pricing'],['Competitor Analysis','Competitor Analysis']]);
  const competitors=textArea(2,'可選，例如：Cal AI；MyFitnessPal；YAZIO');
  const fileInput=el('input',{attrs:{type:'file',accept:'.csv,.json,text/csv,application/json'}});
  const importStatus=el('p',{className:'import-status',text:'尚未導入檔案。支援常見評論、產品與來源欄位。'});
  let importedRecordCount=0;

  const step=(number,title,description,content)=>{
    const wrap=el('section',{className:'beginner-step'});
    wrap.append(el('div',{className:'step-kicker',text:`第 ${number} 步`}),el('h3',{text:title}),el('p',{text:description}),content);
    return wrap;
  };
  const directionField=label('研究方向',direction);
  const rawField=label('原始資料',rawContent);
  form.append(
    step(1,'你想研究什麼海外工具？','例如：Shopify SEO App、AI calorie tracker、Chrome LinkedIn AI extension。',directionField),
    step(2,'貼入你找到的資料','可以貼 App 評論、產品介紹、競品資料、榜單文字、差評摘要等。',rawField)
  );
  const advanced=el('details',{className:'advanced-options'});
  advanced.append(el('summary',{text:'展開進階選項'}));
  const advancedGrid=el('div',{className:'advanced-grid'});
  advancedGrid.append(label('目標平台',platform),label('目標市場',market),label('資料類型',sourceType),label('代表競品（可選）',competitors),label('匯入 CSV / JSON（本機檔案）',fileInput),importStatus);
  advanced.append(advancedGrid);form.append(advanced);
  const actions=el('div',{className:'actions beginner-actions'});
  const analyze=el('button',{className:'button acid',text:'開始分析機會',attrs:{type:'submit'}});
  const copy=el('button',{className:'outline',text:'複製分析 Markdown',attrs:{type:'button'}});
  const download=el('button',{className:'outline',text:'下載分析 Markdown',attrs:{type:'button'}});
  copy.disabled=true;download.disabled=true;
  const thirdStep=step(3,'點擊分析','AI 只整理本次輸入資料，請把結果當作研究起點。',actions);
  actions.append(analyze,copy,download);form.append(thirdStep);section.append(form);
  const result=el('section',{className:'external-result'});result.hidden=true;section.append(result);main.append(section);

  function field(labelText,key,value,rows=3){
    const input=textArea(rows);input.dataset.analysisKey=key;input.value=formatAnalysisValue(value);return label(labelText,input);
  }
  function chooseRecommendation(data){
    const value=String(data.opportunity_recommendation||'').trim();
    if(value)return value;
    const score=Number(data.opportunity_score)||1;
    if(data.evidence_status?.includes('不足')||data.evidence_status?.includes('補充'))return '暫緩：先補充真實樣本';
    if(score>=70)return '推薦繼續研究';
    if(score>=40)return '暫緩：需要補充驗證';
    return '不建議：目前證據不足';
  }
  function summaryList(title,value,limit=5){
    const block=el('div',{className:'summary-block'});block.append(el('h3',{text:title}));
    const list=el('ul');
    formatAnalysisValue(value).split('\n').filter(Boolean).slice(0,limit).forEach(item=>list.append(el('li',{text:item.replace(/^\s*[-•]\s*/, '')})));
    block.append(list);return block;
  }
  function renderResult(data){
    result.replaceChildren();
    result.append(el('div',{className:'eyebrow',text:'EVIDENCE-LED OPPORTUNITY ANALYSIS'}));
    const simple=el('section',{className:'analysis-summary'});
    simple.append(el('h2',{text:'簡明結論'}));
    const recommendation=chooseRecommendation(data);
    const score=el('div',{className:'analysis-score'});
    score.append(el('span',{className:'score-label',text:'機會判斷'}),el('strong',{text:recommendation}),el('span',{className:'score-number',text:`${Math.min(100,Math.max(1,Number(data.opportunity_score)||1))} / 100`}));
    simple.append(score,el('p',{className:'score-reason',text:formatAnalysisValue(data.opportunity_score_reason)}));
    const status=formatAnalysisValue(data.evidence_status||'資料不足，只能作初步觀察');
    simple.append(el('p',{className:'evidence-status',text:status}));
    const summaryGrid=el('div',{className:'analysis-summary-grid'});
    summaryGrid.append(summaryList('主要痛點',data.repeated_pain_points),summaryList('可切入方向',data.ai_entry_points,1),summaryList('最小 MVP',data.mvp_scope),summaryList('下一步驗證',data.mvp_validation_task,3));
    simple.append(summaryGrid);result.append(simple);
    result.append(el('h2',{className:'full-analysis-title',text:'完整分析，可編輯'}),el('p',{className:'notice',text:'以下內容僅依據本次導入資料整理。修改後可複製或下載；請繼續核對原連結與實際市場情況。'}));
    const editor=el('div',{className:'analysis-editor'});
    [
      ['資料摘要與來源類型','source_summary'],['代表競品','representative_competitors'],['重複出現的用戶痛點','repeated_pain_points'],['好評洞察','positive_insights'],['差評洞察','negative_insights'],['功能請求','feature_requests'],['價格／訂閱抱怨','pricing_complaints'],['現有替代方案','current_alternatives'],['AI 可切入點','ai_entry_points'],['待驗證假設','validation_hypotheses'],['合規或平台風險','compliance_risks'],['MVP 範圍建議','mvp_scope'],['不建議第一版做什麼','avoid_first_version'],['MVP 驗證任務書','mvp_validation_task']
    ].forEach(([title,key])=>editor.append(field(title,key,data[key],key==='mvp_validation_task'?6:3)));
    result.append(editor);result.hidden=false;copy.disabled=false;download.disabled=false;result.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function markdown(){
    const values=Object.fromEntries([...result.querySelectorAll('[data-analysis-key]')].map(input=>[input.dataset.analysisKey,input.value.trim()]));
    const score=result.querySelector('.analysis-score .score-number')?.textContent||'待生成';
    const judgement=result.querySelector('.analysis-score strong')?.textContent||'待生成';
    const reason=result.querySelector('.score-reason')?.textContent||'';
    const research=`研究方向：${direction.value.trim()||'—'}\n目標平台：${platform.value}\n目標市場：${market.value}\n資料類型：${sourceType.value}\n代表競品（輸入）：${competitors.value.trim()||'—'}`;
    const titles={source_summary:'資料摘要與來源類型',representative_competitors:'代表競品',repeated_pain_points:'重複出現的用戶痛點',positive_insights:'好評洞察',negative_insights:'差評洞察',feature_requests:'功能請求',pricing_complaints:'價格／訂閱抱怨',current_alternatives:'現有替代方案',ai_entry_points:'AI 可切入點',validation_hypotheses:'待驗證假設',compliance_risks:'合規或平台風險',mvp_scope:'MVP 範圍建議',avoid_first_version:'不建議第一版做什麼',mvp_validation_task:'MVP 驗證任務書'};
    return `# 海外機會雷達｜外部資料出海機會分析\n\n${research}\n\n## 簡明結論\n機會判斷：${judgement}\n機會評分：${score}\n${reason}\n\n${Object.entries(titles).map(([key,title])=>`## ${title}\n${values[key]||'—'}`).join('\n\n')}\n\n> 本分析僅基於本次導入資料整理，不代表市場結論、投資建議或產品承諾。請核對原始來源並自行驗證。`;
  }
  fileInput.addEventListener('change',async()=>{
    const file=fileInput.files?.[0];if(!file)return;
    if(file.size>MAX_FILE_BYTES){importStatus.textContent='檔案超過 2 MB，請先篩選或拆分後再導入。';fileInput.value='';return;}
    try{
      const source=await file.text();const records=normalizeRecords(file.name.toLowerCase().endsWith('.json')?parseJson(source):parseCsv(source));
      if(!records.length)throw Error('未能識別可導入的記錄');
      importedRecordCount=records.length;
      const imported=records.map(recordToText).join('\n\n');const prefix=rawContent.value.trim()?`${rawContent.value.trim()}\n\n`:'';
      rawContent.value=(prefix+imported).slice(0,MAX_RAW_CHARS);importStatus.textContent=`已導入 ${records.length} 條記錄，可繼續在原始資料框內編輯。`;
    }catch(error){importStatus.textContent=`導入失敗：${error.message||'請確認檔案是有效 CSV 或 JSON。'}`;}
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();const content=rawContent.value.trim();
    if(!direction.value.trim())return alert('請先填寫研究方向。');
    if(content.length<40)return alert('請至少貼上一段可供分析的原始資料。');
    analyze.disabled=true;analyze.textContent='正在分析…';
    const hasReviewSignal=/review|rating|評論|差評|評分/i.test(content);
    try{
      const response=await fetch('/api/assist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'external_source_analysis',research:{research_direction:direction.value.trim(),target_platform:platform.value,target_market:market.value,source_type:sourceType.value,competitor_names:competitors.value.trim(),raw_content:content,record_count:importedRecordCount,has_review_signal:hasReviewSignal}})});
      const data=await response.json();if(!response.ok)throw Error(data.error||'暫時無法完成分析');renderResult(data);
    }catch(error){alert(error.message||'暫時無法完成分析，請稍後再試。');}
    finally{analyze.disabled=false;analyze.textContent='開始分析機會';}
  });
  copy.addEventListener('click',()=>copyMarkdown(markdown()));download.addEventListener('click',()=>downloadMarkdown(markdown()));
})();
