// Reusable helper to wire a textarea + iframe CompoViz embed pair.
// Usage: add a textarea with class `compoviz-yaml` and an iframe with class `compoviz-frame`.
// Configure initial content with: textarea.value, data-initial, or data-initial-b64 (base64).
// Optionally set `data-token` on either element to send a token with postMessage.
(function(){
  'use strict';

  function decodeMaybe(b64){
    try{ return atob(b64); }catch(e){ return b64 || ''; }
  }

  function getOrigin(iframe){
    try{ return new URL(iframe.src).origin; }catch(e){ return '*'; }
  }

  function initPair(textarea, iframe){
    const token = textarea.dataset.token || iframe.dataset.token || '';
    const initialB64 = textarea.dataset.initialB64;
    const initialRaw = textarea.dataset.initial;

    // Prefer explicit textarea content if present, otherwise use data attributes
    if(!textarea.value || textarea.value.trim() === ''){
      if(initialB64) textarea.value = decodeMaybe(initialB64);
      else if(initialRaw) textarea.value = initialRaw;
    }

    // debounce + autosend
    let t = null;
    function sendYaml(yaml){
      if(!iframe.contentWindow) return;
      const origin = getOrigin(iframe);
      iframe.contentWindow.postMessage({ type: 'CV_LOAD_YAML', payload: { yaml }, token }, origin);
    }

    textarea.addEventListener('input', ()=>{
      clearTimeout(t);
      t = setTimeout(()=> sendYaml(textarea.value), 800);
    });

    // send initial value after iframe loads
    iframe.addEventListener('load', ()=> setTimeout(()=> sendYaml(textarea.value || ''), 200));

    // optional: sync back from iframe when not focused
    window.addEventListener('message', (e)=>{
      if(e.source !== iframe.contentWindow) return;
      if(!e.data || e.data.type !== 'CV_STATE_UPDATE') return;
      const yaml = e.data.payload && e.data.payload.yaml;
      if(typeof yaml === 'string' && document.activeElement !== textarea){
        textarea.value = yaml;
      }
    });
  }

  function autoInit(){
    const textareas = document.querySelectorAll('.compoviz-yaml');
    textareas.forEach((ta)=>{
      // find nearest iframe sibling with class .compoviz-frame
      let iframe = ta.closest('div')?.querySelector('.compoviz-frame');
      if(!iframe){
        // fallback: find the first iframe in document
        iframe = document.querySelector('.compoviz-frame');
      }
      if(iframe) initPair(ta, iframe);
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInit);
  else autoInit();

})();
