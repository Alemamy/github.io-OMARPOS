// OmarPOS reliability fixes
(function(){
  function syncProducts(){
    if(!STORE) STORE={products:[],sales:[]};
    if(!Array.isArray(STORE.products)) STORE.products=[];
    if(!Array.isArray(STORE.sales)) STORE.sales=[];
    demoProducts.length=0; STORE.products.forEach(p=>demoProducts.push(p));
  }
  async function persist(){
    syncProducts();
    if(window.omarpos && window.omarpos.saveStore) await window.omarpos.saveStore(STORE);
  }
  window.saveProduct=async function(id){
    const name=(document.getElementById('pfName')?.value||'').trim();
    const barcode=(document.getElementById('pfBarcode')?.value||'').trim();
    const price=Number(document.getElementById('pfPrice')?.value);
    const stock=Number(document.getElementById('pfStock')?.value);
    if(!name) return alert('أدخل اسم الصنف.');
    if(!Number.isFinite(price)||price<0) return alert('أدخل سعراً صحيحاً.');
    if(!Number.isInteger(stock)||stock<0) return alert('أدخل كمية مخزون صحيحة.');
    syncProducts();
    const existing=id?STORE.products.find(p=>Number(p.id)===Number(id)):null;
    if(existing){existing.name=name;existing.barcode=barcode;existing.price=price;existing.stock=stock;}
    else {
      const newId=STORE.products.reduce((m,p)=>Math.max(m,Number(p.id)||0),0)+1;
      STORE.products.push({id:newId,name,barcode,price,stock});
    }
    try{await persist(); closeModal(); showProducts(); alert('تم حفظ الصنف بنجاح.');}
    catch(e){alert('تعذر حفظ الصنف: '+e.message);}
  };
  window.deleteProduct=async function(id){
    if(!confirm('هل تريد حذف هذا الصنف؟')) return;
    syncProducts();
    STORE.products=STORE.products.filter(p=>Number(p.id)!==Number(id));
    try{await persist(); showProducts();}
    catch(e){alert('تعذر حذف الصنف: '+e.message);}
  };
  window.completeSale=async function(){
    if(!cart.length) return alert('أضف منتجاً إلى الفاتورة أولاً.');
    const discount=Math.max(0,Number(document.getElementById('discount')?.value||0));
    const subtotal=cart.reduce((s,r)=>s+Number(r.price)*Number(r.qty),0);
    if(discount>subtotal) return alert('الخصم لا يمكن أن يكون أكبر من الإجمالي.');
    const sale={items:cart.map(r=>({id:r.id,name:r.name,qty:r.qty,price:Number(r.price)})),total:Math.max(0,subtotal-discount),discount};
    try{
      let saved={...sale,id:Date.now(),date:new Date().toISOString()};
      if(window.omarpos?.addSale) saved=await window.omarpos.addSale(sale);
      else {if(!STORE) STORE={products:[],sales:[]}; if(!STORE.sales) STORE.sales=[]; STORE.sales.push(saved); await persist();}
      if(window.omarpos?.getStore){STORE=await window.omarpos.getStore();syncProducts();}
      cart=[];
      showInvoice(saved);
    }catch(e){alert('تعذر إتمام البيع: '+e.message);}
  };
  window.showInvoice=function(sale){
    const items=(sale.items||[]).map(i=>`<tr><td>${i.name||('منتج #'+i.id)}</td><td>${i.qty}</td><td>${money(i.price)}</td><td>${money(Number(i.price)*Number(i.qty))}</td></tr>`).join('');
    const modal=document.getElementById('modal');
    modal.innerHTML=`<div class="modal-box invoice" id="invoicePrint"><h2>🧾 فاتورة OmarPOS</h2><p>مركز المهندس</p><p>رقم الفاتورة: <b>${sale.id}</b><br>التاريخ: ${new Date(sale.date).toLocaleString('ar-LY')}</p><table class="table"><thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>${items}</tbody></table><div class="totals"><div>الإجمالي قبل الخصم: <b>${money((sale.items||[]).reduce((s,i)=>s+Number(i.price)*Number(i.qty),0))}</b></div><div>الخصم: <b>${money(sale.discount)}</b></div><div class="grand">الإجمالي النهائي: <b>${money(sale.total)}</b></div></div><button class="primary" onclick="printInvoice()">🖨 طباعة الفاتورة</button><button class="secondary" onclick="closeInvoice()">إغلاق</button></div>`;
    modal.classList.remove('hidden');
  };
  window.printInvoice=function(){
    const box=document.getElementById('invoicePrint'); if(!box) return;
    const w=window.open('','_blank','width=800,height=900');
    if(!w) return alert('اسمح بالنوافذ المنبثقة لطباعة الفاتورة.');
    w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>فاتورة OmarPOS</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#111}h2{text-align:center}.table{width:100%;border-collapse:collapse;margin:20px 0}.table th,.table td{border:1px solid #999;padding:8px;text-align:center}.grand{font-size:20px;font-weight:bold;margin-top:10px}@media print{button{display:none}}</style></head><body>${box.innerHTML}</body></html>`);
    w.document.close(); w.focus(); setTimeout(()=>{w.print();w.close()},300);
  };
})();
