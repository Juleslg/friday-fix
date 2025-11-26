(function () {
  function initWrap(wrap) {
    if (!wrap || wrap.__vsbInit) return;
    wrap.__vsbInit = true;

    var blockId = wrap.id.replace('vsb-', '');
    var dataEl = document.getElementById('vsb-data-' + blockId);
    if (!dataEl) return;

    var payload = {};
    try { payload = JSON.parse(dataEl.textContent.trim()); } catch (e) { payload = {}; }
    var variantsList = payload.variants || [];
    var variantsById = {};
    variantsList.forEach(function (v) { variantsById[String(v.id)] = v; });

    var optionsOrder = payload.options || [];
    var pill = wrap.querySelector('.vsb-pill');
    var percentEl = wrap.querySelector('.vsb-percent');

    var minPercent = +wrap.getAttribute('data-min-percent') || 0;
    var mode = wrap.getAttribute('data-mode') || 'selected';
    var maxPctAttr = +wrap.getAttribute('data-max-pct') || 0;

    var root = wrap.closest('[id^="shopify-section"]') || document;
    var variantIdInput = root.querySelector('form[action*="/cart/add"] input[name="id"]');

    function hide(){ pill.classList.remove('vsb-show','vsb-pop'); }
    function showPct(pct){
      if (pct >= minPercent && pct > 0) {
        percentEl.textContent = String(pct);
        pill.classList.add('vsb-show');
        pill.classList.remove('vsb-pop'); void pill.offsetWidth; pill.classList.add('vsb-pop');
      } else { hide(); }
    }
    function renderByVariantId(vid){
      var v = variantsById[String(vid)];
      if (!v) return hide();
      var price = +v.price || 0, compare = +v.compare || 0;
      if (compare > price && compare > 0) {
        var pct = Math.round(((compare - price) / compare) * 100);
        showPct(pct);
      } else { hide(); }
    }
    function getSelectedOptions(){
      var vals = [];
      optionsOrder.forEach(function(_, idx){
        var i = idx + 1;
        var sel = root.querySelector('select[name^="options["][name*="'+i+'"]');
        if (sel) { vals[idx] = sel.value; return; }
        var checked = root.querySelector('input[type="radio"][name^="options["][name*="'+i+'"]:checked');
        if (checked) { vals[idx] = checked.value; return; }
        var sel2 = root.querySelector('select[name="options['+idx+']"], select[name="options['+i+']"]');
        if (sel2) { vals[idx] = sel2.value; return; }
        var chk2 = root.querySelector('input[type="radio"][name="options['+idx+']]:checked, input[type="radio"][name="options['+i+']"]:checked');
        if (chk2) { vals[idx] = chk2.value; return; }
      });
      return vals;
    }
    function variantIdFromOptions(vals){
      for (var i=0;i<variantsList.length;i++){
        var v = variantsList[i], ok = true;
        if (vals[0] && v.o1 !== vals[0]) ok = false;
        if (vals[1] && v.o2 !== vals[1]) ok = false;
        if (vals[2] && v.o3 !== vals[2]) ok = false;
        if (ok) return v.id;
      }
      return null;
    }
    function getVariantIdFromURL(){
      try { return new URL(location.href).searchParams.get('variant'); } catch(_) { return null; }
    }
    function recomputeAndRender(){
      if (mode === 'max') return showPct(maxPctAttr);
      if (variantIdInput && variantIdInput.value) return renderByVariantId(variantIdInput.value);
      var urlVid = getVariantIdFromURL(); if (urlVid) return renderByVariantId(urlVid);
      var vals = getSelectedOptions(); var vid = variantIdFromOptions(vals); if (vid) renderByVariantId(vid);
    }

    recomputeAndRender();

    root.addEventListener('change', function(e){
      var n = (e.target && e.target.name) || '';
      if (n.indexOf('options') === 0 || n === 'id') recomputeAndRender();
    });
    if (variantIdInput){
      variantIdInput.addEventListener('change', recomputeAndRender);
      new MutationObserver(recomputeAndRender).observe(variantIdInput, { attributes:true, attributeFilter:['value'] });
    }
    ['variant:change','variant:changed','product:variant-change','theme:variant:change','product:change','theme:product:change']
      .forEach(function(evt){ document.addEventListener(evt, function(e){
        var vid = (e && e.detail && (e.detail.id || (e.detail.variant && e.detail.variant.id))) || null;
        if (vid) renderByVariantId(vid); else recomputeAndRender();
      }); });

    ['pushState','replaceState'].forEach(function(m){
      if (!history[m]._vsbWrapped){
        var orig = history[m];
        history[m] = function(){
          var ret = orig.apply(this, arguments);
          try{
            if (arguments && arguments[2] && String(arguments[2]).indexOf('variant=') > -1) {
              document.querySelectorAll('.vsb-wrap').forEach(function(w){
                if (w.__vsbInit && typeof w.__vsbRecompute === 'function') w.__vsbRecompute();
              });
            }
          } catch(_) {}
          return ret;
        };
        history[m]._vsbWrapped = true;
      }
    });
    wrap.__vsbRecompute = recomputeAndRender;
    window.addEventListener('popstate', recomputeAndRender);
  }

  function boot(){ document.querySelectorAll('.vsb-wrap').forEach(initWrap); }
  if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
  document.addEventListener('shopify:section:load', boot);
  document.addEventListener('shopify:section:reorder', boot);
  document.addEventListener('shopify:block:select', boot);
})();