// OmarPOS production reliability layer
(function(){
  'use strict';

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const localKey='omarpos_store_v1';

  function ensureStoreShape(s){
    s=s&&typeof s==='object'?s:{};
    if(!Array.isArray(s.products))s.products=[];
    if(!Array.isArray(s.sales))s.sales=[];
    if(!Array.isArray(s.customers))s.customers=[];
    if(!Array.isArray(s.expenses))s.expenses=[];
    return s;
  }
  function syncLocal(s){
    STORE=ensureStoreShape(s);
    if(Array.isArray(demoProducts)){
      demoProducts.length=0;
      STORE.products.forEach(p=>demoProducts.push(p));
    }
    return STORE;
  }
  async function getFreshStore(){
    if(window.omarpos?.getStore)return syncLocal(await window.omarpos.getStore());
    try{return syncLocal(JSON.parse(localStorage.getItem(localKey)||'{}'))}catch{return syncLocal({})}
  }
  async function saveStore(s){
    s=ensureStoreShape(s);
    if(window.omarpos?.saveStore)await window.omarpos.saveStore(s);
    else localStorage.setItem(localKey,JSON.stringify(s));
    return syncLocal(s);
  }
  function nextId(items){return items.reduce((m,x)=>Math.max(m,Number(x.id)||0),0)+1}

  window.saveProduct=async function(id){
    const name=(document.getElementById('pfName')?.value||'').trim();
    const barcode=(document.getElementById('pfBarcode')?.value||'').trim();
    const price=Number(document.getElementById('pfPrice')?.value);
    const stock=Number(document.getElementById('pfStock')?.value);
    if(!name)return alert('أدخل اسم الصنف.');
    if(!Number.isFinite(price)||price<0)return alert('أدخل سعراً صحيحاً.');
    if(!Number.isInteger(stock)||stock<0)return alert('أدخل كمية مخزون صحيحة.');
    try{
      const s=await getFreshStore();
      if(barcode&&s.products.some(p=>String(p.barcode||'')===barcode&&Number(p.id)!==Number(id)))return alert('هذا الباركود مستخدم لصنف آخر.');
      let p=id?s.products.find(x=>Number(x.id)===Number(id)):null;
      if(p)Object.assign(p,{name,barcode,price,stock});
      else{s.products.push({id:nextId(s.products),name,barcode,price,stock});}
      await saveStore(s);
      closeModal();
      showProducts();
    }catch(e){console.error(e);alert('تعذر حفظ الصنف. تأكد من صلاحية التخزين ثم حاول مرة أخرى.');}
  };

  window.deleteProduct=async function(id){
    const s=await getFreshStore();
    const p=s.products.find(x=>Number(x.id)===Number(id));
    if(!p)return;
    if(!confirm('هل تريد حذف الصنف «'+p.name+'»؟'))return;
    try{await saveStore({...s,products:s.products.filter(x=>Number(x.id)!==Number(id))});showProducts()}
    catch(e){console.error(e);alert('تعذر حذف الصنف.');}
  };

  let saleBusy=false;
  window.completeSale=async function(){
    if(saleBusy)return;
    if(!Array.isArray(cart)||!cart.length)return alert('أضف منتجاً إلى الفاتورة أولاً.');
    const discount=Math.max(0,Number(document.getElementById('discount')?.value||0));
    const subtotal=cart.reduce((s,r)=>s+Number(r.price||0)*Number(r.qty||0),0);
    if(!Number.isFinite(subtotal)||discount>subtotal)return alert('الخصم لا يمكن أن يكون أكبر من الإجمالي.');
    saleBusy=true;
    const draft={items:cart.map(r=>({id:r.id,name:r.name,qty:Number(r.qty),price:Number(r.price)})),total:Number((subtotal-discount).toFixed(2)),discount:Number(discount.toFixed(2))};
    try{
      let saved;
      if(window.omarpos?.addSale){
        saved=await window.omarpos.addSale(draft);
        if(!saved||!saved.id)saved={...draft,id:Date.now(),date:new Date().toISOString()};
        await getFreshStore();
      }else{
        const s=await getFreshStore();
        saved={...draft,id:Date.now(),date:new Date().toISOString()};
        s.sales.push(saved);
        for(const item of saved.items){const p=s.products.find(x=>Number(x.id)===Number(item.id));if(p)p.stock=Math.max(0,Number(p.stock||0)-Number(item.qty||0));}
        await saveStore(s);
      }
      cart=[];
      showInvoice(saved);
    }catch(e){console.error(e);alert('تعذر إتمام البيع: '+(e?.message||'خطأ غير معروف'))}
    finally{saleBusy=false}
  };

  window.showInvoice=function(sale){
    sale=sale&&typeof sale==='object'?sale:{};
    const items=Array.isArray(sale.items)?sale.items:[];
    const before=items.reduce((s,i)=>s+Number(i.price||0)*Number(i.qty||0),0);
    const modal=document.getElementById('modal');
    if(!modal)return;
    modal.innerHTML=`<div class="modal-box invoice" id="invoicePrint"><h2>🧾 فاتورة OmarPOS</h2><p>مركز المهندس</p><p>رقم الفاتورة: <b>${esc(sale.id||'-')}</b><br>التاريخ: ${esc(sale.date?new Date(sale.date).toLocaleString('ar-LY'):new Date().toLocaleString('ar-LY'))}</p><table class="table"><thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>${items.map(i=>`<tr><td>${esc(i.name||('منتج #'+i.id))}</td><td>${esc(i.qty)}</td><td>${money(i.price)}</td><td>${money(Number(i.price)*Number(i.qty))}</td></tr>`).join('')}</tbody></table><div class="totals"><div>الإجمالي قبل الخصم: <b>${money(before)}</b></div><div>الخصم: <b>${money(sale.discount)}</b></div><div class="grand">الإجمالي النهائي: <b>${money(sale.total)}</b></div></div><button class="primary" onclick="printInvoice()">🖨 طباعة الفاتورة</button><button class="secondary" onclick="closeInvoice()">إغلاق</button></div>`;
    modal.classList.remove('hidden');
  };

  window.printInvoice=function(){
    const box=document.getElementById('invoicePrint');
    if(!box)return;
    const w=window.open('','_blank','width=800,height=900');
    if(!w)return alert('اسمح بالنوافذ المنبثقة لطباعة الفاتورة.');
    w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>فاتورة OmarPOS</title><style>body{font-family:Arial,Tahoma,sans-serif;padding:24px;color:#111}h2{text-align:center}.table{width:100%;border-collapse:collapse;margin:18px 0}.table th,.table td{border:1px solid #999;padding:7px;text-align:center}.totals div{display:flex;justify-content:space-between;margin:8px 0}.grand{font-size:19px;font-weight:bold;border-top:1px solid #999;padding-top:10px}@media print{button{display:none!important}}</style></head><body>${box.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(()=>{try{w.print()}finally{setTimeout(()=>w.close(),250)}},250);
  };

  window.closeInvoice=function(){closeModal();page('home')};
})();
