/* Public checkout configuration only. Never place API keys or secrets here. */
window.DEMO_PAYMENT_URL=window.DEMO_PAYMENT_URL||'success.html?demo=1';
window.getDemoPaymentUrl=(lang='en')=>{
  const target=window.DEMO_PAYMENT_URL;
  if(/^https?:\/\//i.test(target))return target;
  const separator=target.includes('?')?'&':'?';
  return `${target}${separator}lang=${lang==='en'?'en':'zh-HK'}`;
};
