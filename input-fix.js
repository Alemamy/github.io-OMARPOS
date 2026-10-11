// OmarPOS input focus fix for Electron Windows
(function () {
  'use strict';
  function focusName() {
    const input = document.getElementById('pfName');
    if (input) {
      input.removeAttribute('readonly');
      input.disabled = false;
      input.tabIndex = 0;
      input.style.pointerEvents = 'auto';
      input.style.userSelect = 'text';
      input.focus();
      input.click();
      if (typeof input.setSelectionRange === 'function') {
        const n = input.value.length;
        input.setSelectionRange(n, n);
      }
    }
  }
  const oldOpenProductForm = window.openProductForm;
  window.openProductForm = function (id) {
    const p = id ? demoProducts.find(x => Number(x.id) === Number(id)) : null;
    openModal('<div class="modal-box product-form" tabindex="-1"><h2>' + (p ? 'تعديل الصنف' : 'إضافة صنف') + '</h2>' +
      '<label>اسم الصنف<input id="pfName" type="text" autocomplete="off" value="' + String(p?.name ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '"></label>' +
      '<label>الباركود<input id="pfBarcode" type="text" autocomplete="off" value="' + String(p?.barcode ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '"></label>' +
      '<label>سعر البيع<input id="pfPrice" type="number" min="0" step="0.01" value="' + (p?.price ?? '') + '"></label>' +
      '<label>أقل سعر للبيع<input id="pfMinPrice" type="number" min="0" step="0.01" value="' + (p?.minPrice ?? 0) + '"></label>' +
      '<label>سعر الشراء<input id="pfCostPrice" type="number" min="0" step="0.01" value="' + (p?.costPrice ?? 0) + '"></label>' +
      '<label>المخزون<input id="pfStock" type="number" min="0" step="1" value="' + (p?.stock ?? 0) + '"></label>' +
      '<button class="primary" onclick="saveProduct(' + (id || 0) + ')">💾 حفظ</button><button class="secondary" onclick="closeModal()">إلغاء</button></div>');
    focusName();
    requestAnimationFrame(focusName);
    setTimeout(focusName, 100);
  };
  document.addEventListener('click', function (event) {
    const modal = document.getElementById('modal');
    if (modal && !modal.classList.contains('hidden') && event.target.closest('.modal-box label')) {
      const input = event.target.closest('label').querySelector('input');
      if (input) input.focus();
    }
  }, true);
  document.addEventListener('keydown', function (event) {
    const modal = document.getElementById('modal');
    if (!modal || modal.classList.contains('hidden')) return;
    if (event.key === 'Escape') closeModal();
  });
  const style = document.createElement('style');
  style.textContent = '#modal,.modal,.modal-box,.modal-box label,.modal-box input{pointer-events:auto!important;-webkit-app-region:no-drag!important}.modal-box input{user-select:text!important;-webkit-user-select:text!important;cursor:text!important;position:relative;z-index:1}.modal-box label{position:relative;z-index:1}';
  document.head.appendChild(style);
})();