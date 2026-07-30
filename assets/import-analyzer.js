(()=>{
  const TEXT_FIELDS=['review_text','review','text','content','body','description'];
  const META_FIELDS=['title','rating','date','published_at','product_name','competitor_name','source_url'];
  const MAX_FILE_BYTES=2*1024*1024;
  const MAX_RAW_CHARS=24000;
  const main=document.querySelector('main.work');
  if(!main)return;
  const requestedLanguage=new URLSearchParams(location.search).get('lang');
  const isEnglish=!['zh','zh-HK','zh-hk','zh-Hant','zh-hant'].includes(requestedLanguage);
  const t=(zh,en)=>isEnglish?en:zh;
  const traditionalMap={'户':'戶','馈':'饋','个':'個','团':'團','队':'隊','无':'無','优':'優','么':'麼','话':'話','邮':'郵','周':'週','时':'時','请':'請','见':'見','业':'業','设':'設','计':'計','务':'務','开':'開','进':'進','预':'預','账':'帳','态':'態','复':'複','踪':'蹤','动':'動','现':'現','会':'會','录':'錄','难':'難','发':'發','来':'來','过':'過','为':'為','体':'體','专':'專','经':'經','济':'濟','医':'醫','疗':'療','门':'門','约':'約','档':'檔','归':'歸','报':'報','结':'結','构':'構','样':'樣','标':'標','签':'籤','页':'頁','据':'據','资':'資','讯':'訊','网':'網','风':'風','险':'險','议':'議','证':'證','实':'實','际':'際','关':'關','键':'鍵','级':'級','别':'別','载':'載','释':'釋','点':'點','达':'達','场':'場','库':'庫','创':'創','广':'廣','转':'轉','换':'換','营':'營','销':'銷','审':'審','题':'題','简':'簡','单':'單','内':'內','书':'書','测':'測','试':'試','验':'驗','变':'變','与':'與','应':'應','该':'該','从':'從','后':'後','台':'臺','获':'獲','联':'聯','络':'絡','费':'費','钱':'錢','损':'損','失':'失','买':'買','卖':'賣','识':'識','读':'讀','写':'寫','输':'輸','出':'出','处':'處','理':'理','评':'評','价':'價','统':'統','学':'學','习':'習','历':'歷','这':'這','对':'對','杂':'雜','问':'問','补':'補','续':'續','暂':'暫','缓':'緩','导':'導','还':'還','没':'沒','软':'軟','击':'擊','链':'鏈','组':'組','织':'織','线':'線','类':'類','选':'選','择':'擇','节':'節','扩':'擴','张':'張','势':'勢','劣':'劣','滤':'濾','显':'顯','准':'準','备':'備','观':'觀','察':'察','认':'認','听':'聽','说':'說','语':'語','义':'義','译':'譯','满':'滿','仅':'僅','须':'須','并':'並','带':'帶','给':'給','让':'讓','帮':'幫'};
  const toTraditional=value=>String(value??'').replace(/[\u3400-\u9fff]/g,char=>traditionalMap[char]||char);
  const hasChinese=value=>/[\u3400-\u9fff]/.test(String(value??''));
  const outputText=(value,kind='analysis point')=>{
    const text=String(value??'').trim();
    if(!text)return '';
    if(isEnglish&&hasChinese(text))return `English summary needed — verify and restate this ${kind} from the original source material.`;
    return isEnglish?text:toTraditional(text);
  };

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
      return entries.length?entries.map(([key,item])=>`${indent}- ${outputText(key,'field label') || 'Field'}: ${formatAnalysisValue(item,`${indent}  `).replace(/^\s*-\s*/, '')}`).join('\n'):'—';
    }
    return outputText(value)||'—';
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
    try{await navigator.clipboard.writeText(markdown);alert(t('已複製分析結果。','Analysis copied.'));}
    catch{alert(t('瀏覽器未允許自動複製，請使用下載完整報告。','Your browser did not allow automatic copying. Use Download Full Report instead.'));}
  }

  const section=el('section',{className:'external-analyzer',attrs:{'aria-labelledby':'external-analysis-title'}});
  const header=el('div',{className:'section-head'});
  const headingWrap=el('div');
  headingWrap.append(
    el('div',{className:'eyebrow',text:'OVERSEAS OPPORTUNITY RADAR · SOURCE ANALYSIS'}),
    el('h2',{text:t('機會分析｜海外機會雷達','Opportunity Analysis | Overseas Opportunity Radar'),attrs:{id:'external-analysis-title'}}),
    el('p',{className:'lead',text:t('貼上海外 App 評論、產品介紹、競品資料、榜單文字或差評摘要，AI 會幫你整理：用戶在抱怨什麼、哪裡可能有機會、第一版 MVP 該怎樣驗證。','Paste overseas app reviews, product descriptions, competitor notes, ranking snippets, or negative review summaries. AI will help you understand what users complain about, where the opportunity may be, and how to validate the first MVP.')}),
    el('p',{className:'analysis-hint',text:t('資料越真實，分析越有價值。AI 不會自動編造下載量、收入、排名或來源。','The more real the source material is, the more useful the analysis will be. AI will not invent downloads, revenue, rankings, or sources.')})
  );
  header.append(headingWrap);section.append(header);

  const form=el('form',{className:'form external-form'});
  const direction=el('input',{attrs:{type:'text',required:'',placeholder:t('例如：Shopify SEO App、AI calorie tracker、Chrome LinkedIn AI extension','For example: Shopify SEO App, AI calorie tracker, Chrome LinkedIn AI extension')}});
  const rawContent=textArea(10,t('可以貼 App 評論、產品介紹、競品資料、榜單文字或差評摘要。最好保留來源連結。','Paste app reviews, product descriptions, competitor notes, ranking snippets, or negative review summaries. Keep source links when possible.'));
  rawContent.maxLength=MAX_RAW_CHARS;
  const platform=select([['Auto / Mixed','Auto / Mixed（預設）'],['App Store','App Store'],['Google Play','Google Play'],['Chrome Web Store','Chrome Web Store'],['Shopify App Store','Shopify App Store'],['Product Hunt','Product Hunt'],['G2/Capterra','G2/Capterra'],['Other','Other']]);
  const market=select([['Global','Global / US（預設）'],['US','US'],['UK','UK'],['India','India'],['Brazil','Brazil'],['Mexico','Mexico'],['Other','Other']]);
  const sourceType=select([['Mixed','Mixed（預設）'],['Product Page','Product Page'],['Reviews','Reviews'],['Ranking','Ranking'],['Pricing','Pricing'],['Competitor Analysis','Competitor Analysis']]);
  const competitors=textArea(2,t('可選，例如：Cal AI；MyFitnessPal；YAZIO','Optional, for example: Cal AI; MyFitnessPal; YAZIO'));
  const fileInput=el('input',{attrs:{type:'file',accept:'.csv,.json,text/csv,application/json'}});
  const importStatus=el('p',{className:'import-status',text:t('尚未導入檔案。支援常見評論、產品與來源欄位。','No file imported yet. Common review, product, and source fields are supported.')});
  let importedRecordCount=0;

  const step=(number,title,description,content)=>{
    const wrap=el('section',{className:'beginner-step'});
    wrap.append(el('div',{className:'step-kicker',text:isEnglish?`STEP ${number}`:`第 ${number} 步`}),el('h3',{text:title}),el('p',{text:description}),content);
    return wrap;
  };
  const directionField=label(t('研究方向','Study direction'),direction);
  const rawField=label(t('原始資料','Source material'),rawContent);
  form.append(
    step(1,t('你想研究甚麼方向？','What direction do you want to study?'),t('例如 Shopify SEO App、AI calorie tracker、Chrome LinkedIn AI extension。','For example: Shopify SEO App, AI calorie tracker, or Chrome LinkedIn AI extension.'),directionField),
    step(2,t('貼上你找到的資料','Paste the material you found'),t('可以貼 App 評論、產品介紹、競品資料、榜單文字、差評摘要等。','Paste app reviews, product descriptions, competitor notes, ranking snippets, or negative review summaries.'),rawField)
  );
  const advanced=el('details',{className:'advanced-options'});
  advanced.append(el('summary',{text:t('展開進階選項','Show advanced options')}));
  const advancedGrid=el('div',{className:'advanced-grid'});
  advancedGrid.append(label(t('目標平台','Target platform'),platform),label(t('目標市場','Target market'),market),label(t('資料類型','Source type'),sourceType),label(t('代表競品（可選）','Competitors (optional)'),competitors),label(t('匯入 CSV / JSON（本機檔案）','Import CSV / JSON (local file)'),fileInput),importStatus);
  advanced.append(advancedGrid);form.append(advanced);
  const actions=el('div',{className:'actions beginner-actions'});
  const analyze=el('button',{className:'button acid',text:t('開始找機會','Start Finding Opportunities'),attrs:{type:'submit'}});
  const thirdStep=step(3,t('開始分析','Start analysis'),t('AI 只整理你提供的資料，不會自動編造下載量、收入、排名或來源。','AI only analyzes the material you provide. It will not invent downloads, revenue, rankings, or sources.'),actions);
  actions.append(analyze);form.append(thirdStep);section.append(form);
  const result=el('section',{className:'external-result'});result.hidden=true;section.append(result);main.append(section);

  function field(labelText,key,value,rows=3){
    const input=textArea(rows);input.dataset.analysisKey=key;input.value=formatAnalysisValue(value);return label(labelText,input);
  }
  function chooseRecommendation(data){
    const value=String(data.opportunity_recommendation||'').trim();
    if(value)return outputText(value,'opportunity judgment');
    const score=Number(data.opportunity_score)||1;
    if(data.evidence_status?.includes('不足')||data.evidence_status?.includes('補充'))return t('暫緩：先補充真實樣本','Pause: collect more real samples first');
    if(score>=70)return t('推薦繼續研究','Worth further research');
    if(score>=40)return t('暫緩：需要補充驗證','Pause: more validation is needed');
    return t('不建議：目前證據不足','Not recommended: evidence is still too limited');
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
    simple.append(el('h2',{text:t('簡明結論','Short conclusion')}));
    const recommendation=chooseRecommendation(data);
    const score=el('div',{className:'analysis-score'});
    score.append(el('span',{className:'score-label',text:t('機會判斷','Opportunity judgment')}),el('strong',{text:recommendation}),el('span',{className:'score-number',text:`${Math.min(100,Math.max(1,Number(data.opportunity_score)||1))} / 100`}));
    simple.append(score,el('p',{className:'score-reason',text:formatAnalysisValue(data.opportunity_score_reason)}));
    const status=formatAnalysisValue(data.evidence_status||t('資料不足，只能作初步觀察','Evidence is limited; treat this as an initial observation.'));
    simple.append(el('p',{className:'evidence-status',text:status}));
    const summaryGrid=el('div',{className:'analysis-summary-grid'});
    summaryGrid.append(summaryList(t('主要痛點','Key pain points'),data.repeated_pain_points),summaryList(t('可切入方向','Possible angle'),data.ai_entry_points,1),summaryList(t('最小 MVP','Smallest MVP'),data.mvp_scope),summaryList(t('下一步驗證','Next validation steps'),data.mvp_validation_task,3));
    simple.append(summaryGrid);
    const summaryActions=el('div',{className:'summary-actions'});
    const copySummary=el('button',{className:'outline',text:t('複製分析結果','Copy Analysis'),attrs:{type:'button'}});
    const downloadFull=el('button',{className:'outline',text:t('下載完整報告','Download Full Report'),attrs:{type:'button'}});
    const toggleFull=el('button',{className:'outline',text:t('展開完整分析','Expand Full Analysis'),attrs:{type:'button','aria-expanded':'false'}});
    summaryActions.append(copySummary,downloadFull,toggleFull);simple.append(summaryActions);result.append(simple);
    const fullPanel=el('section',{className:'full-analysis-details'});fullPanel.hidden=true;
    fullPanel.append(el('h2',{className:'full-analysis-title',text:t('完整分析，可編輯','Full analysis, editable')}),el('p',{className:'notice',text:t('這是進階詳情。你可以修改後再下載完整報告；請繼續核對原連結與實際市場情況。','This is the advanced detail view. You can edit it before downloading the full report; keep checking the original links and real market context.')}));
    const editor=el('div',{className:'analysis-editor'});
    [
      [t('資料摘要與來源類型','Source summary and type'),'source_summary'],[t('代表競品','Representative competitors'),'representative_competitors'],[t('重複出現的用戶痛點','Repeated user pain points'),'repeated_pain_points'],[t('好評洞察','Positive insights'),'positive_insights'],[t('差評洞察','Negative insights'),'negative_insights'],[t('功能請求','Feature requests'),'feature_requests'],[t('價格／訂閱抱怨','Pricing or subscription complaints'),'pricing_complaints'],[t('現有替代方案','Current alternatives'),'current_alternatives'],[t('AI 可切入點','AI entry points'),'ai_entry_points'],[t('待驗證假設','Validation hypotheses'),'validation_hypotheses'],[t('合規或平台風險','Compliance or platform risks'),'compliance_risks'],[t('MVP 範圍建議','MVP scope suggestions'),'mvp_scope'],[t('不建議第一版做什麼','What to avoid in v1'),'avoid_first_version'],[t('MVP 驗證任務書','MVP validation task brief'),'mvp_validation_task']
    ].forEach(([title,key])=>editor.append(field(title,key,data[key],key==='mvp_validation_task'?6:3)));
    fullPanel.append(editor);result.append(fullPanel);
    const demoPack=el('section',{className:'demo-pack-result'});
    demoPack.append(el('h2',{text:t('需要完整 MVP 任務書？','Want a full MVP task brief?')}),el('p',{text:t('這次 demo 已生成基礎 MVP 任務書。如需更完整的報告與 Codex / Trae 可用任務簡報，可解鎖 Demo Pack。','This demo generated a basic MVP brief. For a polished report and Codex / Trae-ready task brief, unlock the Demo Pack.')}),el('a',{className:'button acid',text:t('解鎖 Demo Pack','Unlock Demo Pack'),attrs:{href:window.getDemoPaymentUrl?.(isEnglish?'en':'zh-HK')||`success.html?demo=1&lang=${isEnglish?'en':'zh-HK'}`}}));
    result.append(demoPack);result.hidden=false;
    copySummary.addEventListener('click',()=>copyMarkdown(summaryMarkdown(data)));
    downloadFull.addEventListener('click',()=>downloadMarkdown(markdown()));
    toggleFull.addEventListener('click',()=>{fullPanel.hidden=!fullPanel.hidden;const isOpen=!fullPanel.hidden;toggleFull.textContent=isOpen?t('收起完整分析','Collapse Full Analysis'):t('展開完整分析','Expand Full Analysis');toggleFull.setAttribute('aria-expanded',String(isOpen));if(isOpen)fullPanel.scrollIntoView({behavior:'smooth',block:'start'});});
    result.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function summaryMarkdown(data){
    const research=t(`研究方向：${direction.value.trim()||'—'}\n目標平台：${platform.value}\n目標市場：${market.value}`,`Study direction: ${outputText(direction.value.trim()||'—','study direction') || '—'}\nTarget platform: ${platform.value}\nTarget market: ${market.value}`);
    const recommendation=chooseRecommendation(data);
    const sections=[[t('主要痛點','Key pain points'),data.repeated_pain_points],[t('可切入方向','Possible opportunity angle'),data.ai_entry_points],[t('最小 MVP','Smallest MVP'),data.mvp_scope],[t('下一步驗證','Next validation steps'),data.mvp_validation_task]];
    return `# ${t('海外機會雷達｜簡明結論','Overseas Opportunity Radar | Short Conclusion')}\n\n${research}\n\n## ${t('機會判斷','Opportunity judgment')}\n${recommendation}\n\n## ${t('機會評分','Opportunity score')}\n${Math.min(100,Math.max(1,Number(data.opportunity_score)||1))} / 100\n\n## ${t('評分理由','Why this score')}\n${formatAnalysisValue(data.opportunity_score_reason)}\n\n${sections.map(([title,value])=>`## ${title}\n${formatAnalysisValue(value)}`).join('\n\n')}\n\n> ${t('本分析僅基於本次導入資料整理，不代表市場結論、投資建議或產品承諾。','This analysis is based only on the material imported in this session. It is not a market conclusion, investment recommendation, or product promise.')}`;
  }
  function markdown(){
    const values=Object.fromEntries([...result.querySelectorAll('[data-analysis-key]')].map(input=>[input.dataset.analysisKey,input.value.trim()]));
    const score=result.querySelector('.analysis-score .score-number')?.textContent||t('待生成','Pending');
    const judgement=result.querySelector('.analysis-score strong')?.textContent||t('待生成','Pending');
    const reason=result.querySelector('.score-reason')?.textContent||'';
    const research=t(`研究方向：${direction.value.trim()||'—'}\n目標平台：${platform.value}\n目標市場：${market.value}\n資料類型：${sourceType.value}\n代表競品（輸入）：${competitors.value.trim()||'—'}`,`Study direction: ${outputText(direction.value.trim()||'—','study direction') || '—'}\nTarget platform: ${platform.value}\nTarget market: ${market.value}\nSource type: ${sourceType.value}\nCompetitors provided: ${outputText(competitors.value.trim()||'—','competitor name') || '—'}`);
    const titles={source_summary:t('資料摘要與來源類型','Source summary and type'),representative_competitors:t('代表競品','Representative competitors'),repeated_pain_points:t('重複出現的用戶痛點','Repeated user pain points'),positive_insights:t('好評洞察','Positive insights'),negative_insights:t('差評洞察','Negative insights'),feature_requests:t('功能請求','Feature requests'),pricing_complaints:t('價格／訂閱抱怨','Pricing or subscription complaints'),current_alternatives:t('現有替代方案','Current alternatives'),ai_entry_points:t('AI 可切入點','AI entry points'),validation_hypotheses:t('待驗證假設','Validation hypotheses'),compliance_risks:t('合規或平台風險','Compliance or platform risks'),mvp_scope:t('MVP 範圍建議','MVP scope suggestions'),avoid_first_version:t('不建議第一版做什麼','What to avoid in v1'),mvp_validation_task:t('MVP 驗證任務書','MVP validation task brief')};
    return `# ${t('海外機會雷達｜外部資料出海機會分析','Overseas Opportunity Radar | External Source Opportunity Analysis')}\n\n${research}\n\n## ${t('簡明結論','Short conclusion')}\n${t('機會判斷','Opportunity judgment')}: ${judgement}\n${t('機會評分','Opportunity score')}: ${score}\n${reason}\n\n${Object.entries(titles).map(([key,title])=>`## ${title}\n${values[key]||'—'}`).join('\n\n')}\n\n> ${t('本分析僅基於本次導入資料整理，不代表市場結論、投資建議或產品承諾。請核對原始來源並自行驗證。','This analysis is based only on the material imported in this session. It is not a market conclusion, investment recommendation, or product promise. Verify the original sources and make your own judgment.')}`;
  }
  fileInput.addEventListener('change',async()=>{
    const file=fileInput.files?.[0];if(!file)return;
    if(file.size>MAX_FILE_BYTES){importStatus.textContent=t('檔案超過 2 MB，請先篩選或拆分後再導入。','The file exceeds 2 MB. Filter or split it before importing.');fileInput.value='';return;}
    try{
      const source=await file.text();const records=normalizeRecords(file.name.toLowerCase().endsWith('.json')?parseJson(source):parseCsv(source));
      if(!records.length)throw Error(t('未能識別可導入的記錄','No importable records were detected'));
      importedRecordCount=records.length;
      const imported=records.map(recordToText).join('\n\n');const prefix=rawContent.value.trim()?`${rawContent.value.trim()}\n\n`:'';
      rawContent.value=(prefix+imported).slice(0,MAX_RAW_CHARS);importStatus.textContent=t(`已導入 ${records.length} 條記錄，可繼續在原始資料框內編輯。`,`Imported ${records.length} records. You can keep editing the source material.`);
    }catch(error){importStatus.textContent=t(`導入失敗：${error.message||'請確認檔案是有效 CSV 或 JSON。'}`,`Import failed: ${error.message||'Make sure the file is valid CSV or JSON.'}`);}
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();const content=rawContent.value.trim();
    if(!direction.value.trim())return alert(t('請先填寫研究方向。','Please enter a study direction first.'));
    if(content.length<40)return alert(t('資料太少啦。請至少貼 3–5 條 App 評論、產品介紹或競品資料，AI 才能幫你分析機會。','Not enough source material. Please paste at least 3–5 app reviews, product descriptions, or competitor notes before analysis.'));
    analyze.disabled=true;analyze.textContent=t('正在分析…','Analyzing…');
    const hasReviewSignal=/review|rating|評論|差評|評分/i.test(content);
    try{
      const response=await fetch('/api/assist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'external_source_analysis',research:{research_direction:direction.value.trim(),target_platform:platform.value,target_market:market.value,source_type:sourceType.value,competitor_names:competitors.value.trim(),raw_content:content,record_count:importedRecordCount,has_review_signal:hasReviewSignal}})});
      const data=await response.json();if(!response.ok)throw Error(data.error||t('暫時無法完成分析','Analysis is temporarily unavailable'));renderResult(data);
    }catch(error){alert(error.message||t('暫時無法完成分析，請稍後再試。','Analysis is temporarily unavailable. Please try again later.'));}
    finally{analyze.disabled=false;analyze.textContent=t('開始找機會','Start Finding Opportunities');}
  });
})();
