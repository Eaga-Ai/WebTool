(()=>{
  const requestedLanguage=new URLSearchParams(location.search).get('lang');
  const isEnglish=!['zh','zh-HK','zh-hk','zh-Hant','zh-hant'].includes(requestedLanguage);
  const t=(zh,en)=>isEnglish?en:zh;
  const traditionalMap={
    '户':'戶','馈':'饋','个':'個','团':'團','队':'隊','无':'無','优':'優','么':'麼','话':'話','邮':'郵','周':'週','时':'時','请':'請','见':'見','业':'業','设':'設','计':'計','务':'務','开':'開','进':'進','预':'預','账':'帳','态':'態','复':'複','踪':'蹤','动':'動','现':'現','会':'會','录':'錄','难':'難','发':'發','来':'來','过':'過','为':'為','体':'體','专':'專','经':'經','济':'濟','医':'醫','疗':'療','门':'門','约':'約','档':'檔','归':'歸','报':'報','结':'結','构':'構','样':'樣','标':'標','签':'籤','页':'頁','据':'據','资':'資','讯':'訊','网':'網','风':'風','险':'險','议':'議','证':'證','实':'實','际':'際','关':'關','键':'鍵','级':'級','别':'別','载':'載','释':'釋','点':'點','达':'達','场':'場','库':'庫','创':'創','广':'廣','转':'轉','换':'換','营':'營','销':'銷','审':'審','题':'題','简':'簡','单':'單','内':'內','书':'書','测':'測','试':'試','验':'驗','变':'變','与':'與','应':'應','该':'該','从':'從','后':'後','台':'臺','获':'獲','联':'聯','络':'絡','费':'費','钱':'錢','损':'損','失':'失','买':'買','卖':'賣','识':'識','读':'讀','写':'寫','输':'輸','出':'出','处':'處','理':'理','评':'評','价':'價','统':'統','学':'學','习':'習','历':'歷','这':'這','对':'對','杂':'雜','问':'問','请':'請','补':'補','续':'續','暂':'暫','缓':'緩','导':'導','还':'還','没':'沒','当':'當','软':'軟','击':'擊','链':'鏈','组':'組','织':'織','线':'線','类':'類','选':'選','择':'擇','节':'節','扩':'擴','张':'張','势':'勢','劣':'劣','滤':'濾','显':'顯','准':'準','备':'備','观':'觀','察':'察','认':'認','听':'聽','说':'說','语':'語','义':'義','译':'譯','满':'滿','仅':'僅','须':'須','并':'並','带':'帶','给':'給','让':'讓','帮':'幫'
  };
  const toTraditional=value=>String(value??'').replace(/[\u3400-\u9fff]/g,char=>traditionalMap[char]||char);
  const hasChinese=value=>/[\u3400-\u9fff]/.test(String(value??''));
  const languageInstruction=isEnglish
    ?'Return the entire response in English only. Do not mix Chinese in headings, bullet points, analysis, validation questions, or task brief content. If the source material is Chinese, translate and summarize it into natural English.'
    :'請用香港繁體中文輸出全部內容。不要使用簡體中文。不要中英混雜，除非是 Codex、Trae、MVP、Product Hunt 等專有名詞。';
  const outputText=(value,kind='point')=>{
    const text=String(value??'').trim();
    if(!text)return '';
    if(isEnglish&&hasChinese(text))return `English summary needed — verify and restate this ${kind} from the original source material.`;
    return isEnglish?text:toTraditional(text);
  };
  const ids=['audience','context','current','waste','test','where'];
  const form=document.querySelector('#form');
  if(!form)return;

  const actions=form.querySelector('.actions');
  const button=document.createElement('button');
  const result=document.createElement('section');
  const slug=new URLSearchParams(location.search).get('pain');
  const pain=window.PAINS?.find(item=>item.slug===slug);
  const painValue=key=>pain?(isEnglish?(pain[`${key}_en`]||pain[key]||''):(pain[`${key}_zh`]||pain[key]||'')):'';

  const create=(tag,{className='',text='',attrs={}}={})=>{
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text)node.textContent=text;
    Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,value));
    return node;
  };
  const asLines=(value,kind='point')=>{
    if(Array.isArray(value))return value.map(item=>outputText(item,kind)).filter(Boolean);
    return String(value||'').split(/\n|[；;]/).map(item=>outputText(item.replace(/^[-•\d.\s]+/,'').trim(),kind)).filter(Boolean);
  };
  const addList=(container,title,items,kind)=>{
    const heading=create('h3',{text:title});
    const list=create('ul');
    const values=asLines(items,kind);
    (values.length?values:[t('暫時未有足夠資料，請回到原始來源補充。','Not enough material yet. Return to the original sources and add more evidence.')]).slice(0,4).forEach(item=>list.append(create('li',{text:item})));
    container.append(heading,list);
  };
  const validationChecklist=()=>t([
    '第 1 天：整理目前方向、目標用戶和核心假設。',
    '第 2 天：找 3–5 個目標用戶或潛在客戶。',
    '第 3 天：訪談他們目前怎樣處理這個問題。',
    '第 4 天：確認問題發生頻率、損失和現有替代方案。',
    '第 5 天：用表單、Notion、Google Sheet 或人工流程模擬最小方案。',
    '第 6 天：讓 1–2 個用戶試用或看流程，收集回饋。',
    '第 7 天：判斷是否繼續、暫緩或放棄，並決定是否生成 MVP 任務書。'
  ],[
    'Day 1: Clarify the direction, target user, and core hypothesis.',
    'Day 2: Find 3–5 target users or potential customers.',
    'Day 3: Interview them about how they currently handle the problem.',
    'Day 4: Check frequency, cost, and existing alternatives.',
    'Day 5: Simulate the smallest solution with a form, Notion, Google Sheet, or manual workflow.',
    'Day 6: Let 1–2 users try or review the flow and collect feedback.',
    'Day 7: Decide whether to continue, pause, or drop the idea, then generate an MVP task brief if needed.'
  ]);
  const copy=async(text)=>{
    try{await navigator.clipboard.writeText(text);alert(t('已複製驗證清單。','Validation checklist copied.'));}
    catch{alert(t('瀏覽器未允許自動複製，請手動複製文字。','Your browser did not allow automatic copying. Please copy the text manually.'));}
  };
  const buildTaskBrief=(answers,data)=>{
    const direction=outputText(pain?painValue('title'):(answers.context||t('待確認方向','Direction to confirm')),'direction');
    const target=outputText(answers.audience||t('待補充目標用戶','Target user to confirm'),'target user');
    const problem=outputText(answers.waste||painValue('pain_point')||t('待補充核心問題','Core problem to confirm'),'core problem');
    const alternative=outputText(answers.current||painValue('current_solution')||t('待補充現有替代方案','Current alternatives to confirm'),'current alternative');
    const scope=[...asLines(answers.test,'MVP validation step'),...asLines(data.questions,'MVP validation step')].filter(Boolean).slice(0,3);
    while(scope.length<3)scope.push(t('以一個最小流程驗證核心假設。','Validate one core hypothesis with a minimal workflow.'));
    return isEnglish?`# MVP Validation Task Brief

## Direction
${direction}

## Target user
${target}

## Core problem
${problem}

## Current alternatives
${alternative}

## What the first MVP should include
- ${scope[0]}
- ${scope[1]}
- ${scope[2]}

## What to avoid in the first version
- Do not build a full platform.
- Do not build a complex membership system.
- Do not over-automate before validation.
- Do not build unvalidated features.

## 7-day validation tasks
${validationChecklist().map(item=>`- ${item}`).join('\n')}

## Prompt for Codex / Trae
Based on the direction above, create a minimal usable prototype. Focus on validating the core workflow, not building a full platform. First output the file structure, page flow, core features, data structure, and development steps. Avoid over-engineering.`:`# MVP 驗證任務書

## 方向名稱
${direction}

## 目標用戶
${target}

## 核心問題
${problem}

## 現有替代方案
${alternative}

## 第一版 MVP 只做甚麼
- ${scope[0]}
- ${scope[1]}
- ${scope[2]}

## 第一版先不要做甚麼
- 不做完整平台。
- 不做複雜會員系統。
- 不做過度自動化。
- 不做沒有驗證過的功能。

## 7 天驗證任務
${validationChecklist().map(item=>`- ${item}`).join('\n')}

## 交給 Codex / Trae 的開發提示
請基於以上方向，建立一個最小可用原型。重點是驗證核心流程，不要做完整平台。請先輸出文件結構、頁面流程、核心功能、資料結構和開發步驟，不要過度設計。`;
  };
  const addNextSteps=(data,answers)=>{
    const section=create('section',{className:'ai-next-steps'});
    section.append(
      create('h2',{text:t('下一步：先驗證，不急著開發','Next step: validate before building')}),
      create('p',{className:'ai-next-lead',text:t('根據上面的資料缺口和風險提示，先完成小範圍驗證，再決定是否生成 MVP 任務書。','Use the gaps and risks above to run a small validation first, then decide whether to generate an MVP task brief.')})
    );
    const framework=create('div',{className:'ai-action-framework'});
    [
      [t('1. 補充資料','1. Fill the evidence gaps'),t('先確認用戶是否真的有這個問題、發生頻率有多高、目前怎樣解決，以及每次問題造成多少時間、金錢或機會損失。','Confirm whether users really have this problem, how often it happens, how they solve it today, and what time, money, or opportunity cost it creates.')],
      [t('2. 做小驗證','2. Run a small validation'),t('找 3–5 個目標用戶或潛在客戶訪談，不要急著寫代碼。先用表單、Notion、Google Sheet、WhatsApp、Email 或人工流程模擬一次。','Talk to 3–5 target users before writing code. Simulate the workflow with a form, Notion, Google Sheet, WhatsApp, email, or a manual process.')],
      [t('3. 再決定是否開發','3. Decide whether to build'),t('如果有明確重複痛點，並且有人願意試用、留下聯絡方式或表達付費意願，再生成 MVP 任務書交給 Codex / Trae。','If the pain point repeats and users are willing to try, leave contact information, or show payment intent, generate an MVP task brief for Codex or Trae.')]
    ].forEach(([heading,body])=>{const card=create('article',{className:'ai-action-card'});card.append(create('h3',{text:heading}),create('p',{text:body}));framework.append(card);});
    const checklist=create('div',{className:'ai-validation-checklist'});
    checklist.append(create('h3',{text:t('7 天驗證清單','7-day validation checklist')}));
    const list=create('ol');validationChecklist().forEach(item=>list.append(create('li',{text:item})));checklist.append(list);
    const buttons=create('div',{className:'ai-next-actions'});
    const copyChecklist=create('button',{className:'outline',text:t('複製驗證清單','Copy Validation Checklist'),attrs:{type:'button'}});
    const generateTask=create('button',{className:'button acid',text:t('生成 MVP 任務書','Generate MVP Task Brief'),attrs:{type:'button'}});
    const saveCard=create('button',{className:'outline',text:t('保存機會卡','Save Opportunity Card'),attrs:{type:'button'}});
    buttons.append(copyChecklist,generateTask,saveCard);
    const taskOutput=create('section',{className:'ai-task-output'});taskOutput.hidden=true;
    const taskLabel=create('label',{text:t('MVP 任務書，可編輯','MVP task brief, editable')});
    const taskText=create('textarea',{attrs:{rows:'18','aria-label':t('MVP 任務書','MVP task brief')}});taskLabel.append(taskText);
    const copyTask=create('button',{className:'outline',text:t('複製 MVP 任務書','Copy MVP Task Brief'),attrs:{type:'button'}});
    const demoPackLink=create('a',{className:'button acid',text:t('解鎖 Demo Pack','Unlock Demo Pack'),attrs:{href:window.getDemoPaymentUrl?.(isEnglish?'en':'zh-HK')||`success.html?demo=1&lang=${isEnglish?'en':'zh-HK'}`}});
    taskOutput.append(taskLabel,copyTask,create('p',{className:'ai-advanced-note',text:t('這次 demo 已生成基礎 MVP 任務書。如需更完整的報告與 Codex / Trae 可用任務簡報，可解鎖 Demo Pack。','This demo generated a basic MVP brief. For a polished report and Codex / Trae-ready task brief, unlock the Demo Pack.')}),demoPackLink);
    copyChecklist.addEventListener('click',()=>copy(`# ${t('7 天驗證清單','7-day validation checklist')}\n\n${validationChecklist().join('\n')}`));
    generateTask.addEventListener('click',()=>{taskText.value=buildTaskBrief(answers,data);taskOutput.hidden=false;taskOutput.scrollIntoView({behavior:'smooth',block:'nearest'});});
    copyTask.addEventListener('click',()=>copy(taskText.value));
    saveCard.addEventListener('click',()=>{if(typeof form.requestSubmit==='function')form.requestSubmit();else form.querySelector('[type="submit"]')?.click();});
    section.append(framework,checklist,buttons,taskOutput);
    result.append(section);
  };

  button.type='button';button.className='button acid';button.id='ai-assist';button.textContent=t('AI 協助完善機會卡','AI Assist: Refine Opportunity Card');
  result.className='opportunity ai-assisted-result';result.hidden=true;
  actions.append(button);form.insertAdjacentElement('afterend',result);

  button.onclick=async()=>{
    const answers=Object.fromEntries(ids.map(id=>[id,document.querySelector('#'+id)?.value.trim()||'']));
    if(Object.values(answers).filter(Boolean).length<2)return alert(t('請先至少填寫兩項，再讓 AI 協助整理。','Complete at least two fields before asking AI to organize them.'));
    button.disabled=true;button.textContent=t('正在整理…','Organizing…');
    try{
      const response=await fetch('/api/assist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers:{...answers,language_instruction:languageInstruction},pain:pain?{title:painValue('title'),industry:painValue('industry'),pain_type:painValue('pain_type'),specific_task:painValue('specific_task'),pain_point:painValue('pain_point')}:null})});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||t('暫時無法完成整理','Unable to complete the review right now.'));
      result.replaceChildren();
      const review=create('section',{className:'ai-review-summary'});
      review.append(create('div',{className:'eyebrow',text:'AI ASSISTED REVIEW'}),create('h2',{text:t('這個方向的待驗證重點','What still needs validation for this direction')}));
      addList(review,t('需要補充','What to add'),data.gaps,'evidence gap');addList(review,t('需要留意','What to watch'),data.risks,'risk');addList(review,t('下一步驗證','Next validation steps'),data.questions,'validation step');
      review.append(create('p',{className:'notice',text:t('AI 只協助澄清資料、識別風險與提出驗證問題，不代表機會已成立。','AI only helps clarify material, identify risks, and suggest validation questions. It does not prove that an opportunity exists.')}));
      result.append(review);addNextSteps(data,answers);
      result.hidden=false;result.scrollIntoView({behavior:'smooth',block:'nearest'});
    }catch(error){alert(error.message||t('暫時無法完成整理，請稍後再試。','Unable to complete the review right now. Please try again later.'));}
    finally{button.disabled=false;button.textContent=t('AI 協助完善機會卡','AI Assist: Refine Opportunity Card');}
  };
})();
