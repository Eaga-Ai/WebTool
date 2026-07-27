const reviewPrompt=`你是海外機會雷達的研究輔助。根據研究資料與使用者機會卡，動態判斷當前場景最需要追問什麼。不同問題類型必須使用不同角度：流程低效關注步驟、頻率與替代；協作問題關注角色、交接與責任；資訊檢索關注來源、時間與準確性；付費意圖關注預算、決策人與觸發條件；溝通成本關注往返次數、損失與現有渠道。只幫助釐清資訊，不生成創業點子、不承諾成功。以繁體中文嚴格返回 JSON：{"gaps":["最多4條缺失資訊"],"risks":["最多4條待確認風險"],"questions":["最多4條針對當前資料、7天內可驗證的問題"]}。`;

const externalAnalysisPrompt=`你是「海外機會雷達」的證據研究助手。只根據使用者提供的研究方向、平台、市場、競品名稱及原始資料進行整理；不得虛構數據來源、下載量、收入、排名、使用者評論、競品功能或市場事實。資料不足時必須直接寫「輸入資料未提供／無法判斷」。

你不是创业点子生成器：不承诺成功、不替用户决定做什么，不输出代码 Prompt。你的任务是帮助用户把外部资料变成可核验、可编辑的研究卡和 7 天验证任务。

以简体中文严格返回单一 JSON 对象，不能使用 Markdown 代码块。字段必须完整：
{
  "source_summary":"说明输入资料的范围、数量线索与来源类型；不得补造来源",
  "representative_competitors":["仅列出输入中明确出现的竞品"],
  "repeated_pain_points":["最多5条；资料不足时说明无法判断"],
  "positive_insights":["最多4条"],
  "negative_insights":["最多5条"],
  "feature_requests":["最多5条"],
  "pricing_complaints":["最多4条"],
  "current_alternatives":["最多5条"],
  "ai_entry_points":["最多4条；写成待探索切口而不是结论"],
  "validation_hypotheses":["最多4条，可在7天内验证"],
  "compliance_risks":["最多4条"],
  "mvp_scope":["最多5条，范围小且可验证"],
  "avoid_first_version":["最多5条"],
  "mvp_validation_task":["目标","7天内步骤","要找的首批用户","成功/失败信号"],
  "opportunity_score":1,
  "opportunity_score_reason":"评分只反映当前资料的证据强度、重复度、替代方案与可验证性，不代表市场结论"
}`;

function extractJson(content){
  const match=String(content||'').match(/\{[\s\S]*\}/);
  if(!match)throw Error('模型未返回结构化结果');
  return JSON.parse(match[0]);
}

function asList(value){
  if(Array.isArray(value))return value.map(item=>String(item||'').trim()).filter(Boolean).slice(0,5);
  return value? [String(value).trim()] : ['输入资料未提供／无法判断'];
}

function normalizeExternalResult(result){
  const listKeys=['representative_competitors','repeated_pain_points','positive_insights','negative_insights','feature_requests','pricing_complaints','current_alternatives','ai_entry_points','validation_hypotheses','compliance_risks','mvp_scope','avoid_first_version','mvp_validation_task'];
  const normalized={source_summary:String(result.source_summary||'输入资料未提供／无法判断'),opportunity_score:Math.max(1,Math.min(100,Number.parseInt(result.opportunity_score,10)||1)),opportunity_score_reason:String(result.opportunity_score_reason||'评分只反映当前输入资料的研究优先级。')};
  listKeys.forEach(key=>{normalized[key]=asList(result[key]);});
  return normalized;
}

async function askModel({prompt,input,maxTokens}){
  const provider=process.env.AI_PROVIDER||'openrouter';
  const key=provider==='deepseek'?process.env.DEEPSEEK_API_KEY:process.env.OPENROUTER_API_KEY;
  const endpoint=provider==='deepseek'?'https://api.deepseek.com/chat/completions':'https://openrouter.ai/api/v1/chat/completions';
  const model=process.env.AI_MODEL;
  if(!key||!model){const error=new Error('AI 服务尚未配置，请联系站点管理员');error.status=503;throw error;}
  const headers={'Content-Type':'application/json',Authorization:`Bearer ${key}`};
  if(provider==='openrouter'){
    headers['HTTP-Referer']=process.env.SITE_URL||'https://web-tool-lake-gamma.vercel.app';
  headers['X-OpenRouter-Title']='Overseas Opportunity Radar';
  }
  const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({model,temperature:.2,max_tokens:maxTokens,messages:[{role:'system',content:prompt},{role:'user',content:JSON.stringify(input)}]})});
  const data=await response.json();
  if(!response.ok)throw Error(data?.error?.message||'模型服务暂不可用');
  return extractJson(data?.choices?.[0]?.message?.content);
}

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    if(req.body?.mode==='external_source_analysis'){
      const research=req.body?.research;
      const rawContent=String(research?.raw_content||'').trim();
      if(!research?.research_direction?.trim())return res.status(400).json({error:'缺少研究方向'});
      if(rawContent.length<40)return res.status(400).json({error:'请提供足够的原始资料后再分析'});
      if(rawContent.length>24000)return res.status(413).json({error:'原始资料过长，请缩短至 24,000 字符以内'});
      const result=await askModel({prompt:externalAnalysisPrompt,input:{research_direction:String(research.research_direction).slice(0,300),target_platform:String(research.target_platform||'Other').slice(0,100),target_market:String(research.target_market||'Global').slice(0,100),source_type:String(research.source_type||'Mixed').slice(0,100),competitor_names:String(research.competitor_names||'').slice(0,1200),raw_content:rawContent},maxTokens:2600});
      return res.status(200).json(normalizeExternalResult(result));
    }
    const answers=req.body?.answers;
    const pain=req.body?.pain;
    const input=JSON.stringify({pain,answers});
    if(!answers)return res.status(400).json({error:'缺少机会卡内容'});
    if(input.length>16000)return res.status(413).json({error:'填写内容过长，请精简后重试'});
    const result=await askModel({prompt:reviewPrompt,input:{pain,answers},maxTokens:700});
    return res.status(200).json({gaps:asList(result.gaps).slice(0,4),risks:asList(result.risks).slice(0,4),questions:asList(result.questions).slice(0,4)});
  }catch(error){return res.status(error.status||500).json({error:error.message||'AI 整理失败'});}
}
