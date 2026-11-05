(function(){
'use strict';

const MAX_IMG_DIM = 1024;
const JPEG_Q = 0.8;
const MAX_FILE_BYTES = 3.5 * 1024 * 1024;
const IMG_TYPES = ['image/jpeg','image/png','image/gif','image/webp'];
const DOC_TYPES = ['application/pdf'];

let _att = null;
let _rec = false;
let _mr = null;
let _sr = null;
let _chunks = [];
let _transcript = '';
let _recStart = 0;
let _recTimer = null;
let _cfg = {};
let _els = {};

function injectStyles(){
const css = `
.mm-bar-left{display:flex;align-items:center;gap:4px;flex-shrink:0;}
.mm-btn{width:38px;height:38px;min-width:38px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,transform .1s;flex-shrink:0;background:transparent;color:#8696a0;}
.mm-btn:hover{background:rgba(255,255,255,.07);}
.mm-btn:active{transform:scale(.92);}
.mm-btn svg{pointer-events:none;}
.mm-btn-mic{color:#8696a0;}
.mm-btn-mic.active{color:#ef4444;animation:mm-pulse 1.2s infinite;}
@keyframes mm-pulse{0%,100%{opacity:1;}50%{opacity:.5;}}

.mm-preview{display:none;background:#182229;border-top:1px solid #2a3942;padding:10px 14px;gap:10px;align-items:flex-end;position:relative;z-index:10;flex-shrink:0;}
.mm-preview.on{display:flex;}
.mm-preview-thumb{width:64px;height:64px;border-radius:10px;object-fit:cover;background:#111b21;flex-shrink:0;}
.mm-preview-doc{width:64px;height:64px;border-radius:10px;background:#1a2b36;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mm-preview-doc svg{width:32px;height:32px;color:#53bdeb;}
.mm-preview-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.mm-preview-name{color:#e9edef;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mm-preview-size{color:#667781;font-size:11px;}
.mm-preview-close{width:28px;height:28px;min-width:28px;border-radius:50%;border:none;background:rgba(255,255,255,.08);color:#aebac1;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;position:absolute;top:6px;right:6px;}

.mm-rec-bar{display:none;background:#202c33;padding:8px 12px;gap:10px;align-items:center;flex-shrink:0;z-index:20;}
.mm-rec-bar.on{display:flex;}
.mm-rec-dot{width:10px;height:10px;border-radius:50%;background:#ef4444;animation:mm-pulse 1s infinite;flex-shrink:0;}
.mm-rec-time{color:#e9edef;font-size:14px;font-weight:500;font-variant-numeric:tabular-nums;min-width:40px;}
.mm-rec-wave{flex:1;display:flex;align-items:center;gap:2px;height:28px;overflow:hidden;}
.mm-rec-wave-bar{width:3px;border-radius:2px;background:#25d366;animation:mm-wave 0.8s ease-in-out infinite alternate;}
.mm-rec-wave-bar:nth-child(2){animation-delay:.1s;} .mm-rec-wave-bar:nth-child(3){animation-delay:.2s;}
.mm-rec-wave-bar:nth-child(4){animation-delay:.3s;} .mm-rec-wave-bar:nth-child(5){animation-delay:.15s;}
.mm-rec-wave-bar:nth-child(6){animation-delay:.25s;} .mm-rec-wave-bar:nth-child(7){animation-delay:.35s;}
.mm-rec-wave-bar:nth-child(8){animation-delay:.05s;} .mm-rec-wave-bar:nth-child(9){animation-delay:.2s;}
.mm-rec-wave-bar:nth-child(10){animation-delay:.3s;} .mm-rec-wave-bar:nth-child(11){animation-delay:.1s;}
.mm-rec-wave-bar:nth-child(12){animation-delay:.25s;}
@keyframes mm-wave{0%{height:4px;}100%{height:22px;}}
.mm-rec-cancel{background:none;border:none;color:#ef4444;cursor:pointer;font-size:22px;padding:4px 8px;flex-shrink:0;}
.mm-rec-send{width:40px;height:40px;min-width:40px;border-radius:50%;border:none;background:#25d366;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}

.mm-img-wrap{border-radius:10px;overflow:hidden;max-width:240px;cursor:pointer;position:relative;}
.mm-img-wrap img{display:block;width:100%;border-radius:10px;}
.mm-img-caption{padding:4px 8px 0;font-size:14px;line-height:1.45;}

.mm-audio-player{display:flex;align-items:center;gap:8px;min-width:200px;padding:4px 0;}
.mm-audio-play{width:32px;height:32px;min-width:32px;border-radius:50%;border:none;background:rgba(255,255,255,.15);color:#e9edef;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;}
.mm-audio-bars{display:flex;align-items:center;gap:1.5px;height:24px;flex:1;}
.mm-audio-bar{width:3px;border-radius:2px;background:rgba(255,255,255,.35);}
.mm-audio-bar.played{background:#25d366;}
.mm-audio-dur{color:#8696a0;font-size:11px;min-width:32px;text-align:right;}
.mm-audio-note{color:#8696a0;font-size:10px;font-style:italic;margin-top:2px;display:block;}

.mm-doc-attach{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 12px;min-width:200px;max-width:260px;}
.mm-doc-icon{width:40px;height:40px;min-width:40px;border-radius:8px;background:#1a3a5c;display:flex;align-items:center;justify-content:center;}
.mm-doc-icon svg{width:22px;height:22px;color:#53bdeb;}
.mm-doc-info{flex:1;min-width:0;}
.mm-doc-name{color:#e9edef;font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mm-doc-size{color:#667781;font-size:11px;}

.mm-lightbox{display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;align-items:center;justify-content:center;cursor:pointer;padding:20px;}
.mm-lightbox.on{display:flex;}
.mm-lightbox img{max-width:100%;max-height:100%;object-fit:contain;border-radius:6px;}
.mm-lightbox-close{position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,.15);color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;}

.mm-toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a2b36;color:#e9edef;padding:10px 20px;border-radius:10px;font-size:13px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.4);animation:mm-toast-in .25s ease;max-width:320px;text-align:center;}
@keyframes mm-toast-in{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}

input[type="file"].mm-file-input{display:none!important;}
`;
const s = document.createElement('style');
s.textContent = css;
document.head.appendChild(s);
}

function svgAttach(){
return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.49"/></svg>';
}
function svgMic(){
return '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>';
}
function svgSend(){
return '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
}
function svgDoc(){
return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
}

function formatSize(bytes){
if(bytes < 1024) return bytes + ' B';
if(bytes < 1048576) return (bytes/1024).toFixed(0) + ' KB';
return (bytes/1048576).toFixed(1) + ' MB';
}

function formatTime(sec){
const m = Math.floor(sec/60);
const s = Math.floor(sec%60);
return m + ':' + String(s).padStart(2,'0');
}

function toast(msg, ms){
const el = document.createElement('div');
el.className = 'mm-toast';
el.textContent = msg;
document.body.appendChild(el);
setTimeout(()=>{ el.remove(); }, ms || 3000);
}

function resizeImage(file){
return new Promise((resolve, reject)=>{
const img = new Image();
const url = URL.createObjectURL(file);
img.onload = ()=>{
  URL.revokeObjectURL(url);
  let w = img.width, h = img.height;
  if(w > MAX_IMG_DIM || h > MAX_IMG_DIM){
    if(w > h){ h = Math.round(h * MAX_IMG_DIM / w); w = MAX_IMG_DIM; }
    else { w = Math.round(w * MAX_IMG_DIM / h); h = MAX_IMG_DIM; }
  }
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  c.toBlob(blob=>{
    const r = new FileReader();
    r.onload = ()=> resolve({
      type:'image', base64: r.result.split(',')[1],
      mimeType:'image/jpeg', previewUrl: URL.createObjectURL(blob),
      name: file.name, size: blob.size
    });
    r.onerror = reject;
    r.readAsDataURL(blob);
  }, 'image/jpeg', JPEG_Q);
};
img.onerror = ()=>{ URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')); };
img.src = url;
});
}

function readAsBase64(file){
return new Promise((resolve, reject)=>{
const r = new FileReader();
r.onload = ()=> resolve(r.result.split(',')[1]);
r.onerror = reject;
r.readAsDataURL(file);
});
}

function genBars(count){
let html = '';
for(let i=0;i<count;i++){
  const h = 4 + Math.floor(Math.random()*18);
  html += '<div class="mm-audio-bar" style="height:'+h+'px"></div>';
}
return html;
}

function createUI(){
const inputBar = _cfg.inputBar;
const textInput = _cfg.textInput;
const sendBtn = _cfg.sendBtn;

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.className = 'mm-file-input';
fileInput.accept = 'image/jpeg,image/png,image/gif,image/webp,application/pdf';
document.body.appendChild(fileInput);
_els.fileInput = fileInput;

const attachBtn = document.createElement('button');
attachBtn.className = 'mm-btn mm-btn-attach';
attachBtn.type = 'button';
attachBtn.innerHTML = svgAttach();
attachBtn.title = 'Adjuntar archivo';
_els.attachBtn = attachBtn;

const micBtn = document.createElement('button');
micBtn.className = 'mm-btn mm-btn-mic';
micBtn.type = 'button';
micBtn.innerHTML = svgMic();
micBtn.title = 'Grabar audio';
_els.micBtn = micBtn;

const inputWrap = textInput.parentElement;
if(inputBar.contains(inputWrap)){
  inputBar.insertBefore(attachBtn, inputWrap);
} else {
  inputBar.insertBefore(attachBtn, textInput);
}
inputBar.insertBefore(micBtn, sendBtn);

const preview = document.createElement('div');
preview.className = 'mm-preview';
preview.innerHTML = '<button class="mm-preview-close" type="button">&times;</button>';
_els.preview = preview;
inputBar.parentElement.insertBefore(preview, inputBar);

let waveBarsHtml = '';
for(let i=0;i<12;i++) waveBarsHtml += '<div class="mm-rec-wave-bar"></div>';
const recBar = document.createElement('div');
recBar.className = 'mm-rec-bar';
recBar.innerHTML = `
  <div class="mm-rec-dot"></div>
  <span class="mm-rec-time">0:00</span>
  <div class="mm-rec-wave">${waveBarsHtml}</div>
  <button class="mm-rec-cancel" type="button" title="Cancelar">✕</button>
  <button class="mm-rec-send" type="button" title="Enviar audio">${svgSend()}</button>
`;
_els.recBar = recBar;
inputBar.parentElement.insertBefore(recBar, inputBar);

const lightbox = document.createElement('div');
lightbox.className = 'mm-lightbox';
lightbox.innerHTML = '<button class="mm-lightbox-close" type="button">&times;</button><img src="" alt="">';
document.body.appendChild(lightbox);
_els.lightbox = lightbox;

attachBtn.addEventListener('click', ()=> fileInput.click());

fileInput.addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  fileInput.value = '';
  if(!file) return;
  if(file.size > MAX_FILE_BYTES){
    toast('El archivo es demasiado grande. Máximo: ' + formatSize(MAX_FILE_BYTES));
    return;
  }
  try{
    if(IMG_TYPES.includes(file.type)){
      _att = await resizeImage(file);
      showPreview(_att);
    } else if(DOC_TYPES.includes(file.type)){
      const b64 = await readAsBase64(file);
      _att = { type:'document', base64:b64, mimeType:file.type, name:file.name, size:file.size };
      showPreview(_att);
    } else {
      toast('Formato no soportado. Enviá imágenes (JPG, PNG) o PDF.');
    }
  } catch(err){
    toast('No se pudo procesar el archivo.');
  }
});

preview.querySelector('.mm-preview-close').addEventListener('click', ()=>{
  _att = null;
  hidePreview();
});

micBtn.addEventListener('click', ()=>{
  if(_rec) return;
  startRecording();
});

recBar.querySelector('.mm-rec-cancel').addEventListener('click', cancelRecording);
recBar.querySelector('.mm-rec-send').addEventListener('click', stopAndSend);

lightbox.addEventListener('click', (e)=>{
  if(e.target === lightbox || e.target.classList.contains('mm-lightbox-close')){
    lightbox.classList.remove('on');
  }
});

document.addEventListener('click', (e)=>{
  if(e.target.closest('.mm-img-wrap')){
    const img = e.target.closest('.mm-img-wrap').querySelector('img');
    if(img){
      lightbox.querySelector('img').src = img.src;
      lightbox.classList.add('on');
    }
  }
});
}

function showPreview(att){
const p = _els.preview;
const existing = p.querySelectorAll('.mm-preview-thumb,.mm-preview-doc,.mm-preview-info');
existing.forEach(el=>el.remove());

const closeBtn = p.querySelector('.mm-preview-close');

if(att.type === 'image'){
  const img = document.createElement('img');
  img.className = 'mm-preview-thumb';
  img.src = att.previewUrl;
  p.insertBefore(img, closeBtn);
} else {
  const docIcon = document.createElement('div');
  docIcon.className = 'mm-preview-doc';
  docIcon.innerHTML = svgDoc();
  p.insertBefore(docIcon, closeBtn);
}

const info = document.createElement('div');
info.className = 'mm-preview-info';
info.innerHTML = '<div class="mm-preview-name">' + escHtml(att.name) + '</div><div class="mm-preview-size">' + formatSize(att.size) + '</div>';
p.insertBefore(info, closeBtn);

p.classList.add('on');
_cfg.textInput.focus();
}

function hidePreview(){
_els.preview.classList.remove('on');
}

function escHtml(s){
const d = document.createElement('div');
d.textContent = s;
return d.innerHTML;
}

async function startRecording(){
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
let stream;
try {
  stream = await navigator.mediaDevices.getUserMedia({ audio:true });
} catch(e){
  toast('No se pudo acceder al micrófono. Revisá los permisos del navegador.');
  return;
}

_rec = true;
_chunks = [];
_transcript = '';
_recStart = Date.now();

_els.micBtn.classList.add('active');
_cfg.inputBar.style.display = 'none';
_els.recBar.classList.add('on');
if(_els.preview.classList.contains('on')){
  _att = null;
  hidePreview();
}

_recTimer = setInterval(()=>{
  const sec = Math.floor((Date.now() - _recStart)/1000);
  _els.recBar.querySelector('.mm-rec-time').textContent = formatTime(sec);
}, 500);

try{
  _mr = new MediaRecorder(stream, { mimeType:'audio/webm;codecs=opus' });
} catch(e){
  _mr = new MediaRecorder(stream);
}
_mr.ondataavailable = (e)=>{ if(e.data.size>0) _chunks.push(e.data); };
_mr.start(200);

if(SpeechRec){
  _sr = new SpeechRec();
  _sr.lang = _cfg.lang || 'es-AR';
  _sr.continuous = true;
  _sr.interimResults = false;
  _sr.onresult = (e)=>{
    let t = '';
    for(let i=0;i<e.results.length;i++){
      if(e.results[i].isFinal) t += e.results[i][0].transcript + ' ';
    }
    _transcript = t.trim();
  };
  _sr.onerror = ()=>{};
  try{ _sr.start(); } catch(e){}
}
}

function cancelRecording(){
if(_mr && _mr.state !== 'inactive') _mr.stop();
if(_sr) try{ _sr.stop(); } catch(e){}
if(_mr && _mr.stream) _mr.stream.getTracks().forEach(t=>t.stop());
clearInterval(_recTimer);
_rec = false;
_mr = null;
_sr = null;
_chunks = [];
_transcript = '';
_els.micBtn.classList.remove('active');
_els.recBar.classList.remove('on');
_cfg.inputBar.style.display = '';
}

function stopAndSend(){
if(!_rec) return;

const doFinish = ()=>{
  const blob = new Blob(_chunks, { type:'audio/webm' });
  const audioUrl = URL.createObjectURL(blob);
  const duration = Math.floor((Date.now() - _recStart)/1000);
  const transcript = _transcript || '';

  if(_mr && _mr.stream) _mr.stream.getTracks().forEach(t=>t.stop());
  clearInterval(_recTimer);
  _rec = false;
  _els.micBtn.classList.remove('active');
  _els.recBar.classList.remove('on');
  _cfg.inputBar.style.display = '';

  _att = { type:'audio', audioUrl, duration, transcription:transcript };

  if(_cfg.onAudioReady) _cfg.onAudioReady(_att);
};

if(_sr) try{ _sr.stop(); } catch(e){}

if(_mr && _mr.state === 'recording'){
  _mr.onstop = doFinish;
  _mr.stop();
} else {
  doFinish();
}
_mr = null;
_sr = null;
}

function buildContent(text, att){
if(!att){
  return text || '';
}

const blocks = [];

if(att.type === 'image'){
  blocks.push({
    type:'image',
    source:{ type:'base64', media_type:att.mimeType, data:att.base64 }
  });
  if(text) blocks.push({ type:'text', text:text });
  else blocks.push({ type:'text', text:'[El usuario envió esta imagen]' });
} else if(att.type === 'document'){
  blocks.push({
    type:'document',
    source:{ type:'base64', media_type:att.mimeType, data:att.base64 }
  });
  if(text) blocks.push({ type:'text', text:text });
  else blocks.push({ type:'text', text:'[El usuario envió este documento: ' + att.name + ']' });
} else if(att.type === 'audio'){
  const t = att.transcription;
  if(t){
    blocks.push({ type:'text', text: (text ? text + '\n\n' : '') + '[Mensaje de voz del usuario]: "' + t + '"' });
  } else {
    blocks.push({ type:'text', text: (text ? text + '\n\n' : '') + '[El usuario envió un mensaje de voz pero no se pudo transcribir el contenido]' });
  }
}

if(blocks.length === 1 && blocks[0].type === 'text') return blocks[0].text;
return blocks;
}

function bubbleHtml(att, caption, isUser){
const time = new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
const ticks = isUser ? ' <span style="color:#53bdeb;font-size:13px;">✓✓</span>' : '';
const metaColor = isUser ? 'color:#a9d9cf;' : 'color:#8696a0;';

if(att.type === 'image'){
  let html = '<div class="mm-img-wrap"><img src="'+att.previewUrl+'" alt="Imagen"></div>';
  if(caption) html += '<div class="mm-img-caption">' + escHtml(caption) + '</div>';
  html += '<div style="display:flex;justify-content:flex-end;align-items:center;gap:3px;font-size:10.5px;'+metaColor+'margin-top:3px;">'+time+ticks+'</div>';
  return html;
}

if(att.type === 'audio'){
  const dur = formatTime(att.duration || 0);
  const bars = genBars(28);
  const audioId = 'mm-audio-' + Date.now();
  let html = '<div class="mm-audio-player" data-audio-id="'+audioId+'">';
  html += '<audio id="'+audioId+'" src="'+att.audioUrl+'" preload="metadata"></audio>';
  html += '<button class="mm-audio-play" onclick="window._mmPlayAudio(\''+audioId+'\')" type="button">▶</button>';
  html += '<div class="mm-audio-bars">'+bars+'</div>';
  html += '<span class="mm-audio-dur">'+dur+'</span>';
  html += '</div>';
  if(!att.transcription) html += '<span class="mm-audio-note">Audio no transcripto</span>';
  if(caption) html += '<div style="margin-top:4px;font-size:14px;">'+escHtml(caption)+'</div>';
  html += '<div style="display:flex;justify-content:flex-end;align-items:center;gap:3px;font-size:10.5px;'+metaColor+'margin-top:3px;">'+time+ticks+'</div>';
  return html;
}

if(att.type === 'document'){
  let html = '<div class="mm-doc-attach">';
  html += '<div class="mm-doc-icon">'+svgDoc()+'</div>';
  html += '<div class="mm-doc-info"><div class="mm-doc-name">'+escHtml(att.name)+'</div><div class="mm-doc-size">'+formatSize(att.size)+' · PDF</div></div>';
  html += '</div>';
  if(caption) html += '<div style="margin-top:6px;font-size:14px;">'+escHtml(caption)+'</div>';
  html += '<div style="display:flex;justify-content:flex-end;align-items:center;gap:3px;font-size:10.5px;'+metaColor+'margin-top:3px;">'+time+ticks+'</div>';
  return html;
}

return '';
}

window._mmPlayAudio = function(id){
const audio = document.getElementById(id);
if(!audio) return;
const btn = audio.parentElement.querySelector('.mm-audio-play');
if(audio.paused){
  audio.play();
  btn.textContent = '❚❚';
  audio.onended = ()=>{ btn.textContent = '▶'; };
} else {
  audio.pause();
  btn.textContent = '▶';
}
};

window.ChatMultimedia = {
init(cfg){
  _cfg = cfg;
  injectStyles();
  createUI();
},
getAttachment(){ return _att; },
clearAttachment(){
  _att = null;
  hidePreview();
},
buildContent: buildContent,
bubbleHtml: bubbleHtml,
isRecording(){ return _rec; },
toast: toast,
};

})();
