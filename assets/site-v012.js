(()=>{
  const page=document.body.dataset.page;
  const requestedLanguage=new URLSearchParams(location.search).get('lang');
  const isEnglish=!['zh','zh-HK','zh-hk','zh-Hant','zh-hant'].includes(requestedLanguage);
  const t=(zh,en)=>isEnglish?en:zh;
  const itemValue=(item,key)=>{
    if(!item)return '';
    return isEnglish?(item[`${key}_en`]||item[key]||''):(item[`${key}_zh`]||item[key]||'');
  };
  const el=(tag,{className='',text='',attrs={}}={})=>{const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,value));return node;};
  const withLanguage=(href)=>`${href}${href.includes('?')?'&':'?'}lang=${isEnglish?'en':'zh-HK'}`;
  const link=(href,text,className='')=>el('a',{className,text,attrs:{href:withLanguage(href)}});
  const paymentHref=()=>window.getDemoPaymentUrl?.(isEnglish?'en':'zh-HK')||withLanguage('success.html?demo=1');
  const paymentLink=(text,className='button acid')=>el('a',{className,text,attrs:{href:paymentHref()}});
  const demoPackCard=(className='shell v012-demo-pack')=>{const card=el('section',{className});card.append(el('div',{className:'eyebrow',text:'MVP TASK BRIEF DEMO PACK · US$9 DEMO PRICE'}),el('h2',{text:t('需要完整 MVP 任務書？','Want a full MVP task brief?')}),el('p',{text:t('使用這個 Demo Pack，測試從機會分析到 Codex / Trae 可用 MVP 任務書的完整流程。','Use this demo pack to test the full workflow from opportunity analysis to a Codex / Trae-ready MVP brief.')}),paymentLink(t('取得 MVP Task Brief Demo Pack','Get MVP Task Brief Demo Pack')));return card;};
  const setMeta=(title,description)=>{document.documentElement.lang=isEnglish?'en':'zh-Hant';document.title=title;const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=description;const ogTitle=document.querySelector('meta[property="og:title"]');if(ogTitle)ogTitle.content=title;const ogDescription=document.querySelector('meta[property="og:description"]');if(ogDescription)ogDescription.content=description;};
  const section=(title,content,className='')=>{const node=el('section',{className:`shell v012-section ${className}`.trim()});node.append(el('h2',{text:title}),content);return node;};
  const list=items=>{const node=el('ul',{className:'v012-list'});items.forEach(item=>node.append(el('li',{text:item})));return node;};
  function convertLegacyChinese(){
    if(isEnglish)return;
    const map={'户':'戶','馈':'饋','个':'個','团':'團','队':'隊','无':'無','优':'優','么':'麼','话':'話','邮':'郵','周':'週','时':'時','请':'請','见':'見','业':'業','设':'設','计':'計','务':'務','开':'開','进':'進','预':'預','账':'帳','态':'態','复':'複','踪':'蹤','动':'動','现':'現','会':'會','录':'錄','难':'難','发':'發','来':'來','过':'過','为':'為','体':'體','专':'專','经':'經','济':'濟','医':'醫','疗':'療','门':'門','约':'約','档':'檔','归':'歸','报':'報','结':'結','构':'構','样':'樣','标':'標','签':'籤','页':'頁','据':'據','资':'資','讯':'訊','网':'網','风':'風','险':'險','议':'議','证':'證','实':'實','际':'際','关':'關','键':'鍵','级':'級','别':'別','载':'載','释':'釋','点':'點','达':'達','场':'場','库':'庫','创':'創','广':'廣','转':'轉','换':'換','营':'營','销':'銷','审':'審','题':'題','简':'簡','单':'單','内':'內','书':'書','测':'測','试':'試','验':'驗','变':'變','与':'與','应':'應','该':'該','从':'從','后':'後','台':'臺','获':'獲','联':'聯','络':'絡','费':'費','钱':'錢','损':'損','失':'失','买':'買','卖':'賣','识':'識','读':'讀','写':'寫','输':'輸','出':'出','处':'處','理':'理','评':'評','价':'價','统':'統','学':'學','习':'習','历':'歷','这':'這','协':'協','触':'觸','够':'夠','仅':'僅','并':'並','总':'總','线':'線','层':'層','宽':'寬','载':'載','变':'變','联':'聯','络':'絡','观':'觀','察':'察','认':'認','义':'義','语':'語','让':'讓','帮':'幫','给':'給','带':'帶','暂':'暫','缓':'緩','补':'補','须':'須','显':'顯','滤':'濾'};
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{if(['SCRIPT','STYLE'].includes(node.parentElement?.tagName))return;node.nodeValue=node.nodeValue.replace(/[\u4e00-\u9fff]/g,char=>map[char]||char);});
  }
  function updateNav(){
    const brand=document.querySelector('.nav .brand');
    const links=document.querySelector('.nav .links');
    if(brand){brand.replaceChildren(el('i'),document.createTextNode(' OVERSEAS OPPORTUNITY RADAR'));brand.href=withLanguage('index.html');}
    if(!links)return;
    const language=el('button',{className:'lang',text:isEnglish?'繁中':'EN',attrs:{type:'button','aria-label':isEnglish?'切換至繁體中文':'Switch to English'}});
    language.onclick=()=>window.toggleLang?.();
    links.replaceChildren(link('index.html',t('首頁','Home')),link('radar.html',t('方向庫','Opportunity Library')),link('workbench.html',t('找機會','Find Opportunities')),link('method.html',t('使用方法','How It Works')),language);
  }
  function heroTitle(){const title=el('h1',{className:'v012-title'});title.append(el('span',{text:t('海外機會雷達','Overseas Opportunity Radar')}),el('strong',{text:t('把海外工具信號整理成 MVP 任務書。','Turn overseas tool signals into MVP task briefs.')}));return title;}
  function home(){
    const title=t('海外機會雷達｜MVP 任務書 Demo','Overseas Opportunity Radar | MVP Task Brief Demo');
    const description=t('這是一個輕量 AI 工具 demo，用於發現海外工具機會、驗證方向，並生成可交給 Codex / Trae 的 MVP 任務簡報。','A lightweight AI demo for discovering tool opportunities, validating ideas, and generating Codex / Trae-ready MVP briefs.');
    setMeta(title,description);const main=document.querySelector('main');if(!main)return;
    const hero=el('section',{className:'shell v012-hero'});const copy=el('div',{className:'v012-hero-copy'});
    copy.append(el('div',{className:'eyebrow',text:'OVERSEAS OPPORTUNITY RADAR · DEMO'}),heroTitle(),el('p',{className:'lead',text:t('這是一個輕量 AI 工具 demo，用於發現海外工具機會、驗證方向，並生成可交給 Codex / Trae 的 MVP 任務簡報。','A lightweight AI demo for discovering tool opportunities, validating ideas, and generating Codex / Trae-ready MVP briefs.')}));
    const actions=el('div',{className:'v012-actions'});actions.append(link('workbench.html',t('開始驗證','Start Validation'),'button acid'),link('radar.html',t('查看方向庫','View Opportunity Library'),'outline'));copy.append(actions);
    const beta=el('aside',{className:'v012-beta',text:t('Demo 模式：本項目用於測試 AI 工具的完整流程，包括分析、付款與報告交付。','Demo mode: this project is built to test the full AI tool workflow, including analysis, payment, and report delivery.')});hero.append(copy,beta);
    const definition=el('p',{className:'shell v012-definition',text:t('海外機會雷達把公開工具信號與你的資料整理成可驗證的機會卡，再輸出可交給 Codex / Trae 的 MVP 任務書。','Overseas Opportunity Radar turns public tool signals and your source material into testable opportunity cards and Codex / Trae-ready MVP task briefs.')});
    const steps=el('div',{className:'v012-grid v012-three'});[
      [t('1','1'),t('先看方向庫','Explore the library first'),t('從免費方向卡裡找到幾個可能有機會的海外小工具方向。','Browse free direction cards to find overseas tool ideas worth a closer look.')],
      [t('2','2'),t('按清單找資料','Collect evidence with a checklist'),t('到 App Store、Google Play、Shopify App Store、Chrome Web Store 等平台採樣評論和競品資料。','Sample reviews and competitor material from App Store, Google Play, Shopify App Store, Chrome Web Store, and similar sources.')],
      [t('3','3'),t('生成機會卡','Create an opportunity card'),t('把資料貼回來，AI 幫你整理機會判斷、MVP 範圍和下一步驗證任務。','Bring the material back and let AI organize an opportunity judgment, MVP scope, and next validation tasks.')]
    ].forEach(([number,heading,body])=>{const card=el('article',{className:'v012-card'});card.append(el('b',{text:t(`第 ${number} 步`,`STEP ${number}`)}),el('h3',{text:heading}),el('p',{text:body}));steps.append(card);});
    const outcomes=el('div',{className:'v012-grid v012-two'});
    const outcomeCard=el('article',{className:'v012-card'});outcomeCard.append(el('h3',{text:t('你可以先免費看到什麼？','What you can explore for free')}),list(t(['一批海外小工具方向','每個方向的簡明機會判斷','適合平台與常見變現方式的提示','推薦資料來源','是否值得繼續研究的初步訊號'],['A selection of overseas tool directions','A short opportunity signal for each direction','Hints about relevant platforms and common monetization models','Suggested places to collect evidence','An initial signal for whether the direction deserves more research'])));
    const analysisCard=el('article',{className:'v012-card'});analysisCard.append(el('h3',{text:t('Demo Pack 包括：','The Demo Pack includes:')}),list(t(['機會卡','7 天驗證清單','MVP 範圍與不做清單','可交給 Codex／Trae 的任務簡報'],['An opportunity card','A 7-day validation checklist','MVP scope and a do-not-build list','A task brief for Codex or Trae'])));
    const audienceCard=el('article',{className:'v012-card'});audienceCard.append(el('h3',{text:t('適合這些人','Who it is for')}),list(t(['AI 編程出海新手','OPC 一人公司','副業開發者','想做海外小工具但不知道從哪開始的人','有產品想法但不會驗證的人','想用 Codex／Trae 快速做 MVP 的人'],['Beginner AI builders going global','Solo founders and OPC operators','Side-project builders','Indie hackers exploring overseas tools','People with ideas but no validation process','Builders using Codex or Trae to create MVPs'])),el('p',{className:'v012-muted',text:t('如果你已經有成熟的市場研究方法、投放數據和專業選品流程，這個工具可能太輕量。','If you already have a mature market research workflow, paid app intelligence tools, and a professional selection process, this tool may be too lightweight for you.')}));outcomes.append(outcomeCard,analysisCard);
    const cta=el('section',{className:'shell v012-cta'});cta.append(el('p',{text:t('不知道先做哪個？先從方向庫看起。','Not sure what to build first? Start with the opportunity library.')}),link('radar.html',t('查看方向庫','View Opportunity Library'),'button acid'));
    main.replaceChildren(hero,definition,section(t('三步開始一個海外小工具方向','Start an overseas tool idea in three steps'),steps),section(t('免費方向與進一步分析','Free direction signals and deeper analysis'),outcomes),section(t('適合這些人','Who it is for'),audienceCard),demoPackCard(),cta);
  }
  function radar(){
    setMeta(t('海外小工具方向庫｜海外機會雷達｜AI 編程出海選題','Overseas Tool Opportunity Library | Overseas Opportunity Radar'),t('瀏覽重新整理的海外小工具方向卡，從公開用戶聲音和競品資料中找到值得再驗證的 AI 編程出海方向。','Browse curated overseas tool directions based on public user feedback and competitor material, then decide which AI tool ideas deserve further validation.'));
    const head=document.querySelector('.page-head');if(!head)return;const eyebrow=head.querySelector('.eyebrow'),title=head.querySelector('h1'),lead=head.querySelector('.lead');if(eyebrow)eyebrow.textContent=t('方向庫 · DEMO 級簡微信號','OPPORTUNITY LIBRARY · LIGHT DEMO SIGNALS');if(title)title.textContent=t('海外工具機會方向庫','Overseas Tool Opportunity Library');if(lead)lead.textContent=t('這是一個 demo 級海外工具方向庫。每張卡只提供簡微信號，完整報告與 MVP 任務書放在 Demo Pack 中。','A small demo library of overseas tool opportunities. Each card gives a light signal only. Full reports and MVP task briefs are part of the demo pack.');
    document.querySelectorAll('.filterbar select[data-f]').forEach(select=>{const key=select.dataset.f;[...select.options].forEach(option=>{if(!option.value)return;const item=(window.PAINS||[]).find(record=>record[key]===option.value);if(item&&key!=='evidence_level')option.textContent=itemValue(item,key);});});
    const decorate=()=>document.querySelectorAll('#results .card').forEach(card=>{const slug=new URL(card.href,location.href).searchParams.get('slug');const item=(window.PAINS||[]).find(p=>p.slug===slug);card.href=withLanguage(card.getAttribute('href').replace(/[?&]lang=(?:zh(?:-HK|-Hant)?|en)/i,''));if(!item)return;const meta=card.querySelector('.meta span');if(meta)meta.textContent=`${item.source_platform} · ${itemValue(item,'audience')}`;const cardTitle=card.querySelector('h3');if(cardTitle)cardTitle.textContent=itemValue(item,'title');const excerpt=card.querySelector('p:not(.direction-card-note)');if(excerpt)excerpt.textContent=isEnglish?item.original_quote:itemValue(item,'translation');if(card.querySelector('.direction-card-note'))return;const note=el('p',{className:'direction-card-note',text:t(`方向信號：${itemValue(item,'industry')} 團隊需要更好地完成「${itemValue(item,'specific_task')}」。仍需進一步確認平台匹配、常見變現方式與初步難度。`,`Direction signal: ${itemValue(item,'industry')} teams need a better way to ${itemValue(item,'specific_task').replace(/^[A-Z]/,char=>char.toLowerCase())}. Confirm platform fit, common monetization, and initial difficulty with further sampling.`)});cardTitle?.after(note);const more=card.querySelector('.more');if(more)more.textContent=t('查看方向 →','View direction →');});
    decorate();const results=document.querySelector('#results');if(results)new MutationObserver(decorate).observe(results,{childList:true});
  }
  function pain(){
    setMeta(t('方向詳情｜海外機會雷達｜海外小工具機會','Opportunity Detail | Overseas Opportunity Radar | Overseas Tool Direction'),t('查看由公開用戶聲音和競品資料整理而成的海外小工具方向提示與原始證據。','Review an overseas tool direction signal and its original public evidence.'));
    const item=(window.PAINS||[]).find(p=>p.slug===new URLSearchParams(location.search).get('slug'))||window.PAINS?.[0];
    const back=document.querySelector('.detail>a.eyebrow');if(back){back.textContent=t('← 返回方向庫','← Back to Opportunity Library');back.href=withLanguage('radar.html');}const action=document.querySelector('.detail>a.button');if(action){action.textContent=t('開始分析這個方向','Analyze This Direction');action.href=withLanguage(action.getAttribute('href').replace(/[?&]lang=(?:zh(?:-HK|-Hant)?|en)/i,''));}
    if(!item)return;
    const title=document.querySelector('.detail>h1');if(title)title.textContent=itemValue(item,'title');
    const translation=document.querySelector('.detail .translation');if(translation){translation.hidden=isEnglish;if(!isEnglish)translation.replaceChildren(el('b',{text:'忠實翻譯：'}),document.createTextNode(itemValue(item,'translation')));}
    const values=['audience','industry','specific_task','pain_point','current_solution','buying_intent'];
    document.querySelectorAll('.detail .facts .fact').forEach((fact,index)=>{const value=fact.querySelector('div');if(!value)return;if(index<values.length)value.textContent=itemValue(item,values[index]);else if(index===6)value.textContent=`${item.evidence_level} · ${itemValue(item,'evidence_reason')}`;else if(index===7)value.textContent=t('已發布','Published');});
  }
  function method(){
    setMeta(t('使用方法｜海外機會雷達｜從方向庫到 MVP 驗證','How It Works | Overseas Opportunity Radar | From Direction Library to MVP Validation'),t('了解如何從海外小工具方向庫開始，收集公開評論與競品資料，完成一輪 MVP 驗證。','Learn how to start with the overseas tool opportunity library, collect public reviews and competitor material, and complete an MVP validation cycle.'));
    const main=document.querySelector('main.method');if(!main)return;
    const intro=el('p',{className:'lead',text:t('這個 demo 用最短流程，從一個方向和一段資料走到可交付的 MVP 任務書。','This demo uses the shortest path from one direction and a few source materials to a deliverable MVP task brief.')});
    const flow=el('ol',{className:'v012-flow'});t(['選一個方向','貼上資料','生成機會卡','查看驗證清單','解鎖或下載 MVP 任務書 Demo Pack'],['Pick a direction','Paste source material','Generate an opportunity card','Review the validation checklist','Unlock or download the MVP task brief demo pack']).forEach(item=>flow.append(el('li',{text:item})));
    main.replaceChildren(el('div',{className:'eyebrow',text:'HOW IT WORKS · DEMO FLOW'}),el('h1',{text:t('使用方法｜Demo 流程','How It Works | Demo Flow')}),intro,el('h2',{text:t('五步開始','Five steps to start')}),flow,demoPackCard('v012-demo-pack'));
  }
  function workbench(){
    setMeta(t('找機會｜海外機會雷達｜分析方向與 MVP 驗證','Find Opportunities | Overseas Opportunity Radar | Analyze Directions and Validate MVPs'),t('把海外 App 評論、產品介紹、競品資料或榜單文字整理成機會卡、MVP 範圍與下一步驗證任務。','Turn overseas app reviews, product descriptions, competitor notes, or ranking snippets into opportunity cards, MVP scope, and next validation tasks.'));
    const main=document.querySelector('.work');if(!main)return;const eyebrow=main.querySelector('.eyebrow'),title=main.querySelector('h1'),lead=main.querySelector('.lead');if(eyebrow)eyebrow.textContent=t('找機會 · 已有方向或資料','FIND OPPORTUNITIES · I HAVE A DIRECTION OR MATERIAL');if(title){title.classList.add('v012-work-title');title.replaceChildren(el('span',{text:t('找機會','Find Opportunities')}),el('strong',{text:t('把方向變成一張可驗證的機會卡','Turn a direction into a testable opportunity card')}));}if(lead)lead.textContent=t('如果你已經有方向或資料，可以把海外 App 評論、產品介紹、競品資料或榜單文字貼進來，AI 會幫你整理機會判斷和 MVP 驗證任務。','I already have a direction or source material. Paste overseas app reviews, product descriptions, competitor notes, or ranking snippets, and AI will organize an opportunity judgment and MVP validation tasks.');
    const analyzer=main.querySelector('.external-analyzer');const oldForm=main.querySelector('.form');const item=(window.PAINS||[]).find(p=>p.slug===new URLSearchParams(location.search).get('pain'));
    const applyLocalizedPreset=()=>{if(!item)return;const preset={audience:itemValue(item,'audience'),context:`${itemValue(item,'industry')} · ${itemValue(item,'specific_task')}`,current:itemValue(item,'current_solution'),waste:itemValue(item,'pain_point')};Object.entries(preset).forEach(([key,value])=>{const input=document.querySelector(`#${key}`);if(input)input.value=value;});const badge=main.querySelector('.badge');if(badge)badge.textContent=`${t('研究方向：','Study direction: ')}${itemValue(item,'title')} · ${itemValue(item,'pain_type')}`;};
    applyLocalizedPreset();document.querySelector('#apply-pain')?.addEventListener('click',()=>setTimeout(applyLocalizedPreset,0));
    if(analyzer&&oldForm){const prompt=el('aside',{className:'notice v012-preflight'});prompt.append(el('h2',{text:t('還沒有資料？','Do not have source material yet?')}),el('p',{text:t('先去方向庫選一個方向，找 3 個競品和 10 條差評，再回來分析。','Start in the opportunity library. Pick one direction, collect three competitors and ten negative reviews, then return here to analyze.')}),link('radar.html',t('查看方向庫','View Opportunity Library'),'outline'));main.insertBefore(prompt,oldForm);main.insertBefore(analyzer,oldForm);}
  }
  function success(){
    setMeta(t('Demo Pack 交付｜海外機會雷達','Demo Pack Delivery | Overseas Opportunity Radar'),t('MVP 任務書 Demo Pack 的交付說明。','Delivery information for the MVP Task Brief Demo Pack.'));
    const main=document.querySelector('main');if(!main)return;
    const isDemo=new URLSearchParams(location.search).get('demo')==='1';
    const card=el('section',{className:'shell v012-success-card'});
    card.append(el('div',{className:'eyebrow',text:'MVP TASK BRIEF DEMO PACK'}),el('h1',{text:isDemo?t('Demo 交付頁','Demo delivery page'):t('付款成功','Payment received')}),el('p',{className:'lead',text:isDemo?t('這是 demo 交付流程。設定真實外部付款連結後，付款成功頁可使用同一個交付內容。','This is the demo delivery flow. Once a real external payment link is configured, the same delivery content can follow a successful payment.'):t('你的 MVP Task Brief Demo Pack 已準備好。','Your MVP Task Brief Demo Pack is ready.')}),el('p',{text:t('你可以先下載樣例報告，或把你的方向與資料發給我們，生成一份 demo 任務簡報。','Download the sample report below, or send us your opportunity material for a custom demo brief.')}));
    const actions=el('div',{className:'v012-actions'});actions.append(el('a',{className:'button acid',text:t('下載樣例報告','Download Sample Report'),attrs:{href:'assets/demo-mvp-task-brief.md',download:'demo-mvp-task-brief.md'}}),link('workbench.html',t('提交資料','Send Material'),'outline'));card.append(actions);main.replaceChildren(card);
  }
  updateNav();({home,radar,pain,method,workbench,success}[page]||(()=>{}))();convertLegacyChinese();
})();
