(()=>{
  const page=document.body.dataset.page;
  const el=(tag,{className='',text='',attrs={}}={})=>{const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,value));return node;};
  const link=(href,text,className='')=>el('a',{className,text,attrs:{href}});
  const section=(title,content,className='')=>{const node=el('section',{className:`shell v012-section ${className}`.trim()});node.append(el('h2',{text:title}),content);return node;};
  function updateNav(){
    const brand=document.querySelector('.nav .brand');
    const links=document.querySelector('.nav .links');
    if(brand){brand.replaceChildren(el('i'),document.createTextNode(' OVERSEAS OPPORTUNITY RADAR'));brand.href='index.html';}
    if(!links)return;
    const language=document.querySelector('.nav .lang');
    links.replaceChildren(
      link('index.html','首頁'),link('workbench.html','找機會'),link('radar.html','案例庫'),link('method.html','使用方法'),
      language||el('button',{className:'lang',text:'EN',attrs:{type:'button'}})
    );
    const langButton=links.querySelector('.lang');
    if(langButton){langButton.textContent='EN';langButton.onclick=()=>window.toggleLang?.();}
  }
  function list(items){const node=el('ul',{className:'v012-list'});items.forEach(item=>node.append(el('li',{text:item})));return node;}
  function home(){
    const main=document.querySelector('main');if(!main)return;
    const hero=el('section',{className:'shell v012-hero'});
    const copy=el('div',{className:'v012-hero-copy'});
    copy.append(
      el('div',{className:'eyebrow',text:'OVERSEAS OPPORTUNITY RADAR · v0.1 BETA'}),
      el('h1',{text:'貼上海外資料，AI 幫你判斷有沒有機會'}),
      el('p',{className:'lead',text:'適合 AI 編程出海新手、OPC 和副業開發者。你只要貼上 App 評論、產品介紹、競品資料或榜單文字，系統會幫你整理：用戶在抱怨什麼、哪裡可能有機會、第一版產品該怎麼驗證。'}),
      el('div',{className:'v012-actions'})
    );
    copy.querySelector('.v012-actions').append(link('workbench.html','開始分析海外機會','button acid'),link('radar.html','查看案例','outline'));
    const beta=el('aside',{className:'v012-beta',text:'目前為 v0.1 內測版，用於海外 App／工具機會研究與 MVP 驗證。AI 分析結果僅作為產品假設與研究參考，不代表市場結論、收入承諾或投資建議。'});
    hero.append(copy,beta);
    const steps=el('div',{className:'v012-grid v012-three'});
    [['1','輸入方向','例如 Shopify SEO App、AI calorie tracker、Chrome LinkedIn extension'],['2','貼入資料','可以是 App 評論、產品介紹、競品資料、榜單文字、差評摘要'],['3','查看結論','得到機會判斷、主要痛點、MVP 驗證方案和下一步行動']].forEach(([number,title,body])=>{const card=el('article',{className:'v012-card'});card.append(el('b',{text:`第 ${number} 步`}),el('h3',{text:title}),el('p',{text:body}));steps.append(card);});
    const outcomes=el('div',{className:'v012-grid v012-two'});
    const outcomeCard=el('article',{className:'v012-card'});outcomeCard.append(el('h3',{text:'你會得到什麼？'}),list(['這個方向值不值得繼續研究','用戶主要在抱怨什麼','可以切入的小工具方向','第一版 MVP 做什麼、不做什麼','下一步去哪裡補證據','可複製給 Codex／Trae 的 MVP 驗證任務書']));
    const audienceCard=el('article',{className:'v012-card'});audienceCard.append(el('h3',{text:'適合這些人'}),list(['AI 編程出海新手','OPC 一人公司','副業開發者','想做海外小工具但不知道從哪開始的人','有想法但不會驗證的人','看不懂海外評論和競品資料的人']),el('p',{className:'v012-muted',text:'如果你已經有成熟的市場研究方法、投放數據和專業選品流程，這個工具可能太輕量。'}));outcomes.append(outcomeCard,audienceCard);
    const cta=el('section',{className:'shell v012-cta'});cta.append(el('p',{text:'先用一段海外資料，測一個你想做的方向。'}),link('workbench.html','開始分析海外機會','button acid'));
    main.replaceChildren(hero,section('三步找出一個海外小工具機會',steps),outcomes,cta);
  }
  function radar(){
    document.title='案例庫｜海外機會雷達';
    const head=document.querySelector('.page-head');if(!head)return;
    const eyebrow=head.querySelector('.eyebrow');const title=head.querySelector('h1');const lead=head.querySelector('.lead');
    if(eyebrow)eyebrow.textContent='CASE LIBRARY · 已整理案例';
    if(title)title.textContent='案例庫｜海外機會雷達';
    if(lead)lead.textContent='這裡保留已整理的海外需求與機會案例，方便你參考不同方向的分析方式。這些案例不是標準答案，而是幫你理解如何從用戶聲音中整理機會。';
  }
  function pain(){
    document.title=document.title.replace('Overseas Pain Radar','Overseas Opportunity Radar');
    const back=document.querySelector('.detail>a.eyebrow');if(back)back.textContent='← 返回案例庫';
    const action=document.querySelector('.detail>a.button');if(action)action.textContent='我想分析這個方向';
  }
  function method(){
    document.title='使用方法｜海外機會雷達';
    const main=document.querySelector('main.method');if(!main)return;
    const intro=el('p',{className:'lead',text:'我們不是直接告訴你做什麼產品，而是幫你把海外評論、產品介紹和競品資料整理成可驗證的機會假設。'});
    const flow=el('ol',{className:'v012-flow'});['找一個方向','收集幾條評論或產品資料','貼進「找機會」頁','查看簡明結論','再決定是否補資料、暫緩或放棄'].forEach(item=>flow.append(el('li',{text:item})));
    const tips=list(['先用真實公開資料，不要只貼自己的想像。','資料越具體，AI 的整理越有參考價值。','看到結論後，仍要回到原始連結與真實用戶核對。','把它當成開始研究的工具，不是保證成功的答案。']);
    main.replaceChildren(el('div',{className:'eyebrow',text:'HOW TO USE · START SIMPLE'}),el('h1',{text:'使用方法｜海外機會雷達'}),intro,el('h2',{text:'五步開始'}),flow,el('h2',{text:'使用時記住'}),tips);
  }
  function workbench(){
    document.title='找機會｜海外機會雷達';
    const main=document.querySelector('.work');if(!main)return;
    const eyebrow=main.querySelector('.eyebrow');const title=main.querySelector('h1');const lead=main.querySelector('.lead');
    if(eyebrow)eyebrow.textContent='FIND AN OPPORTUNITY · v0.1 BETA';
    if(title)title.textContent='找機會｜海外機會雷達';
    if(lead)lead.textContent='貼上海外 App 評論、產品介紹或競品資料，AI 會幫你整理：用戶在抱怨什麼、哪裡有機會、第一版產品該怎麼驗證。';
  }
  updateNav();
  ({home,radar,pain,method,workbench}[page]||(()=>{}))();
})();
