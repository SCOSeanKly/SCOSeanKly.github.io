const CONFIG = {
  GUMROAD_PRODUCT_URL: 'https://seankly.gumroad.com/l/gnvdnh',
  CLOUDFLARE_WORKER_URL: 'https://mlite-web-worker.ske-d03.workers.dev',
};

const MOCKUP_IMAGES = [
  'https://raw.githubusercontent.com/SCOSeanKly/mLiteWeb/main/mockup1.jpg',
  'https://raw.githubusercontent.com/SCOSeanKly/mLiteWeb/main/mockup2.jpg',
  'https://raw.githubusercontent.com/SCOSeanKly/mLiteWeb/main/mockup3.jpg',
  'https://raw.githubusercontent.com/SCOSeanKly/mLiteWeb/main/mockup4.jpg',
  'https://raw.githubusercontent.com/SCOSeanKly/mLiteWeb/main/mockup5.jpg',
  'https://raw.githubusercontent.com/SCOSeanKly/mLiteWeb/main/mockup6.jpg',
  'https://raw.githubusercontent.com/SCOSeanKly/mLiteWeb/main/mockup7.jpg',
  'https://raw.githubusercontent.com/SCOSeanKly/mLiteWeb/main/mockup8.jpg',
  'https://raw.githubusercontent.com/SCOSeanKly/mLiteWeb/main/mockup9.jpg',
  'https://raw.githubusercontent.com/SCOSeanKly/mLiteWeb/main/mockup10.jpg',
];

const els = {
  template: document.getElementById('templateFile'),
  mlite: document.getElementById('mliteFile'),
  shot: document.getElementById('shotFile'),
  btnImportTemplate: document.getElementById('btnImportTemplate'),
  btnImportMl: document.getElementById('btnImportMl'),
  btnImportShot: document.getElementById('btnImportShot'),
  save: document.getElementById('saveBtn'),
  browse: document.getElementById('browseBtn'),
  canvasContainer: document.getElementById('canvasContainer'),
  canvas: document.getElementById('canvas'),
  emptyState: document.getElementById('emptyState'),
  licenseNotice: document.getElementById('licenseNotice'),
  currentYear: document.getElementById('currentYear'),
  menuToggle: document.getElementById('menuToggle'),
  menuItems: document.getElementById('menuItems'),
  menuContainer: document.getElementById('menuContainer'),
  statusToast: document.getElementById('statusToast'),
  errorContainer: document.getElementById('errorContainer'),
  licenseBtn: document.getElementById('licenseBtn'),
  licenseInput: document.getElementById('licenseInput'),
  activateBtn: document.getElementById('activateBtn'),
  purchaseBtn: document.getElementById('purchaseBtn'),
  website: document.getElementById('websiteBtn'),
  editBtn: document.getElementById('editBtn'),
  exportMlBtn: document.getElementById('exportMlBtn'),
  editIcon: document.getElementById('editIcon'),
  mockupShowcase: document.getElementById('mockupShowcase'),
  mockupTrack: document.getElementById('mockupTrack'),
  licenseCard: document.getElementById('licenseCard'),
  zoomUI: document.getElementById('zoomUI'),
  zoomSlider: document.getElementById('zoomSlider'),
  zoomValue: document.getElementById('zoomValue'),
};

const ctx = els.canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

/* ===== View transform (pan & zoom) ===== */
const view = { scale: 1, offsetX: 0, offsetY: 0 };

function setView(scale, anchorCanvasX, anchorCanvasY, keepPoint=false){
  const clamped = Math.max(1, Math.min(5, scale));
  if (!keepPoint){
    const cx = els.canvas.width * 0.5;
    const cy = els.canvas.height * 0.5;
    const imgX = (cx - view.offsetX) / view.scale;
    const imgY = (cy - view.offsetY) / view.scale;
    view.scale = clamped;
    view.offsetX = cx - imgX * view.scale;
    view.offsetY = cy - imgY * view.scale;
  } else {
    const imgX = (anchorCanvasX - view.offsetX) / view.scale;
    const imgY = (anchorCanvasY - view.offsetY) / view.scale;
    view.scale = clamped;
    view.offsetX = anchorCanvasX - imgX * view.scale;
    view.offsetY = anchorCanvasY - imgY * view.scale;
  }
  updateZoomUI();
  doRender(true, false, true);
}

function resetView(){
  view.scale = 1; view.offsetX = 0; view.offsetY = 0;
  updateZoomUI();
  doRender(true, false, true);
}

/* ===== Zoom UI show/position/scale ===== */
function positionZoomUI(){
  const canvasRect = els.canvas.getBoundingClientRect();
  const containerRect = els.canvasContainer.getBoundingClientRect();
  const pad = 10;

  const scaleX = canvasRect.width / els.canvas.width;
  const scaleY = canvasRect.height / els.canvas.height;
  const s = Math.max(0.6, Math.min(1.25, Math.min(scaleX, scaleY)));

  const left = (canvasRect.right - containerRect.left) - pad;
  const top  = (canvasRect.top   - containerRect.top) + pad;

  els.zoomUI.style.transform = `translate(-100%, 0) scale(${s})`;
  els.zoomUI.style.left = `${left}px`;
  els.zoomUI.style.top  = `${top}px`;
}

function updateZoomUI(){
  els.zoomSlider.value = String(view.scale);
  els.zoomValue.textContent = view.scale.toFixed(2) + '×';
  const shouldShow = !!state.overlayImg && !!state.editMode;
  els.zoomUI.classList.toggle('show', shouldShow);
  if (shouldShow) positionZoomUI();
}

/* ===== Showcase (unchanged) ===== */
function initMockupShowcase() {
  const urls = [...MOCKUP_IMAGES];
  const preload = urls.map(
    src => new Promise(res => {
      const img = new Image();
      img.loading = 'eager';
      img.decoding = 'async';
      img.onload = () => res({ ok: true, src });
      img.onerror = () => res({ ok: false, src });
      img.src = src;
    })
  );

  Promise.all(preload).then(results => {
    const okUrls = results.filter(r => r.ok).map(r => r.src);
    if (!okUrls.length) return;

    els.mockupTrack.innerHTML = '';

    const ensureWidth = () => {
      const need = els.mockupShowcase.clientWidth * 2;
      while (els.mockupTrack.scrollWidth < need) {
        okUrls.forEach(url => {
          const img = document.createElement('img');
          img.src = url;
          img.alt = 'Mockup example';
          img.className = 'mockup-item';
          els.mockupTrack.appendChild(img);
        });
      }
    };

    ensureWidth();

    let x = 0;
    let speed = 60;
    let last = performance.now();

    const step = now => {
      const dt = (now - last) / 1000;
      last = now;
      x -= speed * dt;
      const half = els.mockupTrack.scrollWidth / 2;
      if (half > 0 && x <= -half) x += half;
      els.mockupTrack.style.transform = `translate3d(${x}px,0,0)`;
      rafId = requestAnimationFrame(step);
    };

    const onResize = () => {
      const prev = els.mockupTrack.style.transform;
      els.mockupTrack.style.transform = 'translate3d(0,0,0)';
      ensureWidth();
      els.mockupTrack.style.transform = prev;
      positionZoomUI();
    };
    window.addEventListener('resize', onResize);

    rafId = requestAnimationFrame(step);
  });
}

/* ===== Render & state ===== */
const MESH_DETAIL_IDLE = 35;
const MESH_DETAIL_DRAG = 0;
let meshDetail = MESH_DETAIL_IDLE;
const DST_EPS = 1.5;
const SRC_EPS = 1.0;
const ACCENT = '#5b9cf5';

// Detect coarse (touch) pointers
const IS_TOUCH = (typeof window !== 'undefined') && (('ontouchstart' in window) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));

function getHandleRadii(){
  // Base visual radius scales with image size
  const base = Math.max(5, Math.min(state.overlayW, state.overlayH) * 0.010 * 0.5);
  const rVis = IS_TOUCH ? Math.max(base, 12) : base;           // what we draw
  const rHit = IS_TOUCH ? Math.max(rVis * 2.0, 28) : Math.max(rVis * 1.6, 18); // what we hit-test
  return { rVis, rHit };
}


let state = {
  overlayImg: null,
  overlayW: 1024,
  overlayH: 1024,
  screenshotImg: null,
  quad: null,
  screenshotOnTop: false,
  cornerRadius: 0,
  hasLicense: false,
  licenseKey: null,
  editMode: false,
  activeHandle: -1,
  originalOverlayBase64: null,
  sourceType: null,
};

function updateEmptyState() {
  const hasContent = state.overlayImg || state.screenshotImg;
  els.emptyState.classList.toggle('hidden', !!hasContent);
  els.canvas.style.display = hasContent ? 'block' : 'none';
  els.zoomUI.classList.toggle('show', !!state.overlayImg && !!state.editMode);
  if (hasContent) positionZoomUI();
}

function readyForEdit(){ return !!(state.overlayImg && state.quad) && state.hasLicense; }
function readyForExport(){ return !!(state.overlayImg && state.quad) && state.hasLicense; }

let antsOffset = 0;
let antsRAF = null;
function startAntsIfNeeded(){
  if (!state.editMode) return;
  if (antsRAF) return;
  const tick = () => {
    if (!state.editMode) { antsRAF = null; return; }
    antsOffset = (antsOffset + 1.5) % 20;
    doRender(true, true, true);
    antsRAF = requestAnimationFrame(tick);
  };
  antsRAF = requestAnimationFrame(tick);
}
function stopAnts(){ if (antsRAF){ cancelAnimationFrame(antsRAF); antsRAF = null; } }

function updateActionStates(){
  els.editBtn.disabled = !readyForEdit();

  const canSave = state.hasLicense && state.overlayImg && state.screenshotImg && state.quad;
  els.save.disabled = !canSave;
  els.save.classList.toggle('disabled', !canSave);

  const shotReady = !!state.overlayImg && state.hasLicense;
  els.shot.disabled = !shotReady;
  els.btnImportShot.dataset.disabled = shotReady ? '' : 'true';
  els.btnImportShot.classList.toggle('disabled', !shotReady);

  if (state.sourceType === 'template') {
    els.btnImportMl.classList.add('disabled');
  } else if (state.sourceType === 'mlite') {
    els.btnImportTemplate.classList.add('disabled');
  } else {
    els.btnImportMl.classList.remove('disabled');
    els.btnImportTemplate.classList.remove('disabled');
  }

  const canExportMl = state.sourceType === 'template' &&
                      state.overlayImg && 
                      state.quad && 
                      state.hasLicense && 
                      !state.editMode;
  els.exportMlBtn.disabled = !canExportMl;
  els.exportMlBtn.classList.toggle('disabled', !canExportMl);
}

let statusTimeout;
function setStatus(text, type='idle'){
  clearTimeout(statusTimeout);
  els.statusToast.textContent = text;
  els.statusToast.className = `status-toast ${type} show`;
  if (type==='success'||type==='error') {
    statusTimeout = setTimeout(()=>els.statusToast.classList.remove('show'), 2500);
  }
}

function setError(text){
  if (!text) return els.errorContainer.classList.remove('show');
  els.errorContainer.textContent = text;
  els.errorContainer.classList.add('show');
  setTimeout(()=>els.errorContainer.classList.remove('show'), 4000);
}

/* License UI/events */
els.licenseInput.addEventListener('input', (e)=>{
  let value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  let formatted = value.match(/.{1,8}/g)?.join('-') || value;
  e.target.value = formatted;
});
els.licenseBtn.addEventListener('click', () => window.open(CONFIG.GUMROAD_PRODUCT_URL, '_blank'));
els.purchaseBtn.addEventListener('click', ()=> window.open(CONFIG.GUMROAD_PRODUCT_URL, '_blank'));

async function validateLicenseKey(key, silent=false){
  if (!silent) setStatus('Validating license…','loading');
  try{
    const response = await fetch(CONFIG.CLOUDFLARE_WORKER_URL + '/verify-license', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ license_key: key })
    });
    const data = await response.json();
    if (data.success){
      state.hasLicense = true;
      state.licenseKey = key;
      localStorage.setItem('mlite_license_key', key);
      els.licenseBtn.textContent = '✓ Licensed';
      els.licenseBtn.classList.add('active');
      els.menuContainer.classList.add('show');
      els.menuContainer.classList.remove('hidden');
      updateLicenseUI();
      if (!silent) setStatus('License activated!','success');
      updateActionStates();
      return true;
    } else {
      throw new Error(data.message || 'Invalid license key');
    }
  }catch(err){
    els.licenseInput.classList.add('error');
    if (!silent){ setError('Invalid license key.'); setStatus('Activation failed','error'); }
    return false;
  }
}
function checkExistingLicense(){
  const savedKey = localStorage.getItem('mlite_license_key');
  if (savedKey) validateLicenseKey(savedKey, true);
}
function updateLicenseUI(){
  if (state.hasLicense){
    els.licenseNotice.textContent = '✓ License activated - Ready to create!';
    els.licenseNotice.classList.add('active');
    els.licenseCard.classList.remove('show');
  } else {
    els.licenseNotice.textContent = '🔒 License required to render and export images';
    els.licenseNotice.classList.remove('active');
    els.licenseCard.classList.add('show');
  }
}

/* Menu interactions */
els.activateBtn.addEventListener('click', async () => {
  const key = els.licenseInput.value.trim();
  if (!key) { setError("Please enter a license key"); return; }
  await validateLicenseKey(key);
});
els.menuToggle.addEventListener('click', ()=>{
  els.menuToggle.classList.toggle('active');
  els.menuItems.classList.toggle('active');
});

/* Open ShowCreative site */
els.website?.addEventListener('click', ()=>{
  window.open('https://www.showcreative.co.uk', '_blank', 'noopener');
});

document.addEventListener('click', (e)=>{
  if (!els.menuContainer.contains(e.target)) {
    els.menuToggle.classList.remove('active');
    els.menuItems.classList.remove('active');
  }
});

/* Geometry & warp */
function normalizeQuad(points) {
  const pts = points.slice();
  pts.sort((a,b)=>a.y-b.y);
  const top = pts.slice(0,2).sort((a,b)=>a.x-b.x);
  const bot = pts.slice(2,4).sort((a,b)=>a.x-b.x);
  return [top[0], top[1], bot[1], bot[0]];
}
function drawTriangle(ctx, img, sx0, sy0, sx1, sy1, sx2, sy2, dx0, dy0, dx1, dy1, dx2, dy2) {
  const cx = (dx0 + dx1 + dx2) / 3, cy = (dy0 + dy1 + dy2) / 3;
  function expand(x,y){ 
    const dx = x - cx, dy = y - cy; 
    const len = Math.hypot(dx,dy) || 1; 
    const k = (len + DST_EPS) / len; 
    return [cx + dx*k, cy + dy*k]; 
  }
  const [edx0, edy0] = expand(dx0, dy0);
  const [edx1, edy1] = expand(dx1, dy1);
  const [edx2, edy2] = expand(dx2, dy2);
  
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.beginPath();
  ctx.moveTo(edx0, edy0); 
  ctx.lineTo(edx1, edy1); 
  ctx.lineTo(edx2, edy2);
  ctx.closePath(); 
  ctx.clip();
  
  const denom = (sx0*(sy1-sy2)+sx1*(sy2-sy0)+sx2*(sy0-sy1));
  if (Math.abs(denom) < 1e-8) { ctx.restore(); return; }
  
  const a11=(edx0*(sy1-sy2)+edx1*(sy2-sy0)+edx2*(sy0-sy1))/denom;
  const a12=(edx0*(sx2-sx1)+edx1*(sx0-sx2)+edx2*(sx1-sx0))/denom;
  const a13=(edx0*(sx1*sy2-sx2*sy1)+edx1*(sx2*sy0-sx0*sy2)+edx2*(sx0*sy1-sx1*sy0))/denom;
  const a21=(edy0*(sy1-sy2)+edy1*(sy2-sy0)+edy2*(sy0-sy1))/denom;
  const a22=(edy0*(sx2-sx1)+edy1*(sx0-sx2)+edy2*(sx1-sx0))/denom;
  const a23=(edy0*(sx1*sy2-sx2*sy1)+edy1*(sx2*sy0-sx0*sy2)+edy2*(sx0*sy1-sx1*sy0))/denom;
  
  ctx.setTransform(a11,a21,a12,a22,a13,a23);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const iw = (img.naturalWidth||img.width), ih = (img.naturalHeight||img.height);
  ctx.drawImage(img, -SRC_EPS, -SRC_EPS, iw + SRC_EPS*2, ih + SRC_EPS*2);
  ctx.restore();
}
function warpImageToQuad(ctx, img, dstQuad, steps) {
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  const s = Math.max(2, steps|0);
  function lerp(a,b,t){ return [a[0]*(1-t)+b[0]*t, a[1]*(1-t)+b[1]*t]; }
  function toPt(p){ return {x:p[0], y:p[1]}; }
  function mix(p,q,t){ return {x:p.x*(1-t)+q.x*t, y:p.y*(1-t)+q.y*t}; }
  
  for (let yi=0; yi<s; yi++) {
    const v0=yi/s, v1=(yi+1)/s;
    const l0 = toPt( lerp(dstQuad[0], dstQuad[3], v0) );
    const r0 = toPt( lerp(dstQuad[1], dstQuad[2], v0) );
    const l1 = toPt( lerp(dstQuad[0], dstQuad[3], v1) );
    const r1 = toPt( lerp(dstQuad[1], dstQuad[2], v1) );
    
    for (let xi=0; xi<s; xi++) {
      const u0=xi/s, u1=(xi+1)/s;
      const p00 = mix(l0,r0,u0);
      const p10 = mix(l0,r0,u1);
      const p01 = mix(l1,r1,u0);
      const p11 = mix(l1,r1,u1);
      
      const sx0=u0*w, sy0=v0*h; 
      const sx1=u1*w, sy1=v0*h; 
      const sx2=u0*w, sy2=v1*h; 
      const sx3=u1*w, sy3=v1*h;
      
      drawTriangle(ctx,img,sx0,sy0,sx1,sy1,sx3,sy3,p00.x,p00.y,p10.x,p10.y,p11.x,p11.y);
      drawTriangle(ctx,img,sx0,sy0,sx3,sy3,sx2,sy2,p00.x,p00.y,p11.x,p11.y,p01.x,p01.y);
    }
  }
}

/* ===== Render ===== */
function doRender(drawHandles=true, skipWarp=false, useView=true){
  if (!state.hasLicense || !state.overlayImg || !state.quad) return;

  ctx.setTransform(1,0,0,1,0,0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0,0,els.canvas.width,els.canvas.height);

  if (useView){
    ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);
  } else {
    ctx.setTransform(1,0,0,1,0,0);
  }
  
  const quadArr = [
    [state.quad[0].x, state.quad[0].y],
    [state.quad[1].x, state.quad[1].y],
    [state.quad[2].x, state.quad[2].y],
    [state.quad[3].x, state.quad[3].y],
  ];
  
  if (state.screenshotImg && !skipWarp) {
    if (state.screenshotOnTop) { 
      ctx.drawImage(state.overlayImg, 0, 0); 
      warpImageToQuad(ctx, state.screenshotImg, quadArr, meshDetail); 
    } else { 
      warpImageToQuad(ctx, state.screenshotImg, quadArr, meshDetail); 
      ctx.drawImage(state.overlayImg, 0, 0); 
    }
  } else {
    ctx.drawImage(state.overlayImg, 0, 0);
  }
  
  if (state.editMode && drawHandles) drawEditHandles();
  setStatus(state.editMode ? 'Edit mode: drag blue corners' : (state.screenshotImg ? 'Rendered ✓' : 'Template loaded ✓'), state.editMode ? 'loading' : 'success');

  positionZoomUI();
}

/* Edit handles */
function drawEditHandles(){
  const { rVis } = getHandleRadii();
  ctx.save();
  ctx.lineWidth = IS_TOUCH ? 7.0 : 6.0;
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = ACCENT;
  ctx.setLineDash([12, 8]);
  ctx.lineDashOffset = -antsOffset;

  ctx.beginPath();
  ctx.moveTo(state.quad[0].x, state.quad[0].y);
  ctx.lineTo(state.quad[1].x, state.quad[1].y);
  ctx.lineTo(state.quad[2].x, state.quad[2].y);
  ctx.lineTo(state.quad[3].x, state.quad[3].y);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = ACCENT;
  for (let i=0;i<4;i++) {
    const p = state.quad[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, rVis, 0, Math.PI*2);
    ctx.fill();
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = 'white';
    ctx.stroke();
    if (IS_TOUCH) {
      // outer ring cue, does not affect hit area
      ctx.beginPath();
      ctx.arc(p.x, p.y, rVis + 6, 0, Math.PI*2);
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = ACCENT;
      ctx.stroke();
      ctx.globalAlpha = 0.95;
    }
  }
  ctx.restore();
}

/* ===== Pointer helpers ===== */
function clientToCanvasXY(ev){
  const rect = els.canvas.getBoundingClientRect();
  const clientX = (ev.touches ? ev.touches[0].clientX : ev.clientX);
  const clientY = (ev.touches ? ev.touches[0].clientY : ev.clientY);
  const x = (clientX - rect.left) * (els.canvas.width / rect.width);
  const y = (clientY - rect.top) * (els.canvas.height / rect.height);
  return { x, y };
}
function clientToImage(ev){
  const pt = clientToCanvasXY(ev);
  const imgX = (pt.x - view.offsetX) / view.scale;
  const imgY = (pt.y - view.offsetY) / view.scale;
  return { x: imgX, y: imgY, canvasX: pt.x, canvasY: pt.y };
}

function hitTestHandle(x,y){
  const { rHit } = getHandleRadii();
  for (let i=0;i<4;i++){
    const p = state.quad[i];
    const dx=x-p.x, dy=y-p.y;
    if (dx*dx+dy*dy <= (rHit)*(rHit)) return i;
  }
  return -1;
}

let dragging=false;
let panning=false;
let lastTapTime=0;

function handlePointerDown(ev){
  if (!state.hasLicense || !state.overlayImg) return;

  const now = performance.now();
  const timeSince = now - lastTapTime;
  lastTapTime = now;

  const { x, y, canvasX, canvasY } = clientToImage(ev);

  if (timeSince < 300 && state.editMode){
    if (view.scale === 1){
      setView(3, canvasX, canvasY, true);
    } else {
      resetView();
    }
    ev.preventDefault();
    return;
  }

  if (state.editMode){
    const idx = hitTestHandle(x, y);
    if (idx !== -1) {
      state.activeHandle = idx;
      dragging = true;
      meshDetail = MESH_DETAIL_DRAG;
      doRender(true, true, true);
      ev.preventDefault();
      return;
    }

    if (view.scale > 1){
      panning = true;
      panState.startX = canvasX;
      panState.startY = canvasY;
      panState.baseOffsetX = view.offsetX;
      panState.baseOffsetY = view.offsetY;
      ev.preventDefault();
      return;
    }
  }
}

const panState = { startX:0, startY:0, baseOffsetX:0, baseOffsetY:0 };

function handlePointerMove(ev){
  if (state.editMode && dragging){
    const { x } = clientToImage(ev);
    const { y } = clientToImage(ev);
    const i = state.activeHandle;
    state.quad[i].x = Math.max(0, Math.min(state.overlayW, x.x ?? x));
    state.quad[i].y = Math.max(0, Math.min(state.overlayH, y.y ?? y));
    doRender(true, true, true);
    ev.preventDefault();
    return;
  }

  if (state.editMode && panning){
    const pt = clientToCanvasXY(ev);
    const dx = pt.x - panState.startX;
    const dy = pt.y - panState.startY;
    view.offsetX = panState.baseOffsetX + dx;
    view.offsetY = panState.baseOffsetY + dy;
    doRender(true, true, true);
    ev.preventDefault();
    return;
  }
}

function handlePointerUp(ev){
  if (state.editMode && dragging){
    dragging = false;
    state.activeHandle = -1;
    meshDetail = MESH_DETAIL_IDLE;
    doRender(true, false, true);
    ev.preventDefault();
  }
  if (state.editMode && panning){
    panning = false;
    ev.preventDefault();
  }
}

els.canvas.addEventListener('mousedown', handlePointerDown);
window.addEventListener('mousemove', handlePointerMove);
window.addEventListener('mouseup', handlePointerUp);
els.canvas.addEventListener('touchstart', handlePointerDown, {passive:false});
window.addEventListener('touchmove', handlePointerMove, {passive:false});
window.addEventListener('touchend', handlePointerUp);

/* Zoom slider -> updates view */
els.zoomSlider.addEventListener('input', (e)=>{
  const targetScale = parseFloat(e.target.value || '1');
  setView(targetScale, 0, 0, false);
});

/* Edit toggle (includes reset on exit) */
function toggleEdit(on){
  const next = (on===undefined) ? !state.editMode : !!on;
  if (!state.hasLicense || !state.overlayImg || !state.quad) return;
  if (next === state.editMode) return;

  const wasEditing = state.editMode;
  state.editMode = next;
  document.body.classList.toggle('editing', state.editMode);

  els.canvas.style.cursor = (state.editMode && view.scale>1) ? 'grab' : (state.editMode ? 'pointer' : 'default');

  meshDetail = state.editMode ? MESH_DETAIL_DRAG : MESH_DETAIL_IDLE;
  els.editIcon.innerHTML = state.editMode
    ? '<path d="M3 3v6M3 3h6M21 3h-6M21 3v6M3 21v-6M3 21h6M21 21h-6M21 21v-6"/><path d="M9 9l-6-6M15 9l6-6M9 15l-6 6M15 15l6 6"/>'
    : '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>';

  if (wasEditing && !state.editMode) {
    resetView();
  }

  updateActionStates();
  updateZoomUI();
  doRender(true, false, true);
  if (state.editMode) startAntsIfNeeded(); else stopAnts();
}

els.editBtn.addEventListener('click', ()=>{ if (!els.editBtn.disabled) toggleEdit(); });
window.addEventListener('keydown', (e)=>{ if (e.key.toLowerCase()==='e' && !els.editBtn.disabled) toggleEdit(); });

/* Utilities */
function ensureDataUrl(str) {
  if (/^data:image\//.test(str)) return str;
  const head = str.slice(0,10);
  let mime = 'image/png';
  if (head.startsWith('iVBOR')) mime = 'image/png';
  else if (head.startsWith('/9j/')) mime = 'image/jpeg';
  else if (head.startsWith('R0lGOD')) mime = 'image/gif';
  else if (head.startsWith('PHN2Zy')) mime = 'image/svg+xml';
  else if (head.startsWith('AAAB')) mime = 'image/x-icon';
  return `data:${mime};base64,${str}`;
}

/* Default 512x512 quad */
function createDefaultScreenshotQuad() {
  const W = state.overlayW;
  const H = state.overlayH;
  const centerX = W / 2;
  const centerY = H / 2;
  const size = 512;
  const halfSize = size / 2;
  return normalizeQuad([
    { x: centerX - halfSize, y: centerY - halfSize },
    { x: centerX + halfSize, y: centerY - halfSize },
    { x: centerX + halfSize, y: centerY + halfSize },
    { x: centerX - halfSize, y: centerY + halfSize }
  ]);
}

/* Import handlers */
/* Selected-state helpers for import buttons */
function markImportSelected(btnEl, on){
  if (!btnEl) return;
  btnEl.classList.toggle('selected', !!on);
}

/* Clear functions */
function clearTemplateImport(){
  if (state.sourceType !== 'template') return;
  state.overlayImg = null;
  state.overlayW = 1024;
  state.overlayH = 1024;
  state.quad = null;
  state.originalOverlayBase64 = null;
  state.sourceType = null;
  // Unselect template
  markImportSelected(els.btnImportTemplate, false);
  updateEmptyState();
  updateActionStates();
  resetView();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,els.canvas.width,els.canvas.height);
  setStatus('Template removed','idle');
}

function clearMliteImport(){
  if (state.sourceType !== 'mlite') return;
  state.overlayImg = null;
  state.overlayW = 1024;
  state.overlayH = 1024;
  state.quad = null;
  state.originalOverlayBase64 = null;
  state.sourceType = null;
  // Unselect mlite
  markImportSelected(els.btnImportMl, false);
  updateEmptyState();
  updateActionStates();
  resetView();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,els.canvas.width,els.canvas.height);
  setStatus('.mLite removed','idle');
}

function clearScreenshotImport(){
  if (!state.screenshotImg) return;
  state.screenshotImg = null;
  markImportSelected(els.btnImportShot, false);
  updateEmptyState();
  updateActionStates();
  doRender(true, false, true);
  setStatus('Screenshot removed','idle');
}

/* Toggle-click behavior on import buttons:
   - If nothing imported for that control, allow default (open file picker).
   - If already imported, confirm removal, then clear and prevent file picker.
*/
els.btnImportTemplate.addEventListener('click', (e)=>{
  if (state.sourceType === 'template' && state.overlayImg){
    const ok = confirm('Remove the imported Template?');
    if (ok){
      e.preventDefault(); e.stopPropagation();
      clearTemplateImport();
    } else {
      e.preventDefault(); e.stopPropagation();
    }
  }
}, true);

els.btnImportMl.addEventListener('click', (e)=>{
  if (state.sourceType === 'mlite' && state.overlayImg){
    const ok = confirm('Remove the imported .mLite file?');
    if (ok){
      e.preventDefault(); e.stopPropagation();
      clearMliteImport();
    } else {
      e.preventDefault(); e.stopPropagation();
    }
  }
}, true);

els.btnImportShot.addEventListener('click', (e)=>{
  // If disabled, global disabled handler will show toast.
  if (state.screenshotImg){
    const ok = confirm('Remove the imported Screenshot?');
    if (ok){
      e.preventDefault(); e.stopPropagation();
      clearScreenshotImport();
    } else {
      e.preventDefault(); e.stopPropagation();
    }
  }
}, true);

document.getElementById('btnImportShot').addEventListener('click', (e)=>{
  // handled globally by disabled-click handler below
});

els.template.addEventListener('change', async (e)=>{
  if (!state.hasLicense) { setStatus('Please activate your license first.','error'); e.target.value=''; return; }
  const file = e.target.files[0];
  if (!file) return;
  if (!/\.png$/i.test(file.name)) { setError('Template must be a PNG.'); return; }
  setStatus('Loading template…','loading');
  try{
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const overlayImg = new Image();
      overlayImg.onload = () => {
        state.overlayImg = overlayImg;
        state.overlayW = overlayImg.naturalWidth;
        state.overlayH = overlayImg.naturalHeight;
        els.canvas.width = state.overlayW;
        els.canvas.height = state.overlayH;
        state.originalOverlayBase64 = String(dataUrl).split(',')[1] || '';
        state.sourceType = 'template';

        const inset = Math.round(Math.min(state.overlayW, state.overlayH) * 0.08);
        const W = state.overlayW, H = state.overlayH;
        state.quad = normalizeQuad([
          { x: inset,     y: inset },
          { x: W - inset, y: inset },
          { x: W - inset, y: H - inset },
          { x: inset,     y: H - inset }
        ]);
        state.screenshotOnTop = false;
        state.cornerRadius = 0;

        // Mark Template button selected, ML button unselected (mutually exclusive)
        markImportSelected(els.btnImportTemplate, true);
        markImportSelected(els.btnImportMl, false);
        updateEmptyState();
        updateActionStates();
        resetView();
        doRender(false, false, true);
        setStatus('Template loaded ✓','success');
      };
      overlayImg.onerror = ()=> setError('Failed to decode template PNG');
      overlayImg.src = dataUrl;
    };
    reader.onerror = ()=> setError('Failed to read template file');
    reader.readAsDataURL(file);
  }catch(err){
    setError('Template import failed: ' + err.message);
  }
  e.target.value = '';
});

els.mlite.addEventListener('change', async (e)=>{
  if (!state.hasLicense) { setStatus('Please activate your license first.','error'); e.target.value=''; return; }
  const file = e.target.files[0]; 
  if (!file) return;
  setStatus('Loading .mlite…','loading');
  
  try{
    const txt = await file.text();
    /* Friendly mobile error */
    if (!txt || txt.trim().length < 2){ throw new Error('Empty file'); }
    let obj;
    try { obj = JSON.parse(txt); } catch(parseErr){ throw new Error('This doesn\'t look like a valid .mlite file. If you\'re on iOS, make sure you selected the original .mlite file.'); }
    let ovl = obj.customDeviceMockupBase64;
    if (!ovl) throw new Error('customDeviceMockupBase64 missing');
    state.originalOverlayBase64 = ovl;
    ovl = ensureDataUrl(ovl);
    state.sourceType = 'mlite';
    
    const overlayImg = new Image();
    overlayImg.onload = () => {
      state.overlayImg = overlayImg;
      state.overlayW = overlayImg.naturalWidth;
      state.overlayH = overlayImg.naturalHeight;
      els.canvas.width = state.overlayW;
      els.canvas.height = state.overlayH;
      
      const pv = obj.projectionValues || {};
      const H = state.overlayH, W = state.overlayW;
      function toPxBottomLeftNorm([nx, ny]) { return { x: nx * W, y: (1 - ny) * H }; }
      const tl = toPxBottomLeftNorm(pv.topLeft);
      const tr = toPxBottomLeftNorm(pv.topRight);
      const bl = toPxBottomLeftNorm(pv.bottomLeft);
      const br = toPxBottomLeftNorm(pv.bottomRight);
      state.quad = normalizeQuad([tl,tr,bl,br]);
      state.screenshotOnTop = !!obj.screenshotOnTop;
      state.cornerRadius = (pv.cornerRadius) || 0;
      
      // Mark .mLite button selected, Template button unselected (mutually exclusive)
      markImportSelected(els.btnImportMl, true);
      markImportSelected(els.btnImportTemplate, false);
      updateEmptyState();
      updateActionStates();
      resetView();
      ctx.clearRect(0,0,state.overlayW,state.overlayH);
      ctx.drawImage(state.overlayImg, 0, 0);
      if (state.screenshotImg) doRender(true, false, true);
      setStatus('mlite loaded ✓','success');
    };
    overlayImg.onerror = ()=> setError('Failed to decode overlay image');
    overlayImg.src = ovl;
  }catch(err){ 
    setError('Invalid: ' + err.message); 
  }
  e.target.value = '';
});

els.shot.addEventListener('change', (e)=>{
  if (!state.hasLicense) { setStatus('Please activate your license first.','error'); e.target.value=''; return; }
  const f = e.target.files[0]; 
  if (!f) return;
  const ext = (f.name.split('.').pop()||'').toLowerCase();
  if (ext==='heic'||ext==='heif'){ setError('HEIC/HEIF not supported.'); return; }
  const img = new Image();
  img.onload = ()=>{ 
    state.screenshotImg = img;
    if (!state.quad) state.quad = createDefaultScreenshotQuad();
    // Mark Screenshot button selected
    markImportSelected(els.btnImportShot, true);
    updateEmptyState(); 
    updateActionStates(); 
    if (state.overlayImg && state.quad) doRender(true, false, true); 
  };
  img.onerror = ()=> setError('Failed to load screenshot image.');
  img.src = URL.createObjectURL(f);
  e.target.value = '';
});

/* Save mockup */
document.getElementById('saveBtn').addEventListener('click', async ()=>{
  if (document.getElementById('saveBtn').disabled || !state.hasLicense) return;
  try{
    const off = document.createElement('canvas');
    off.width = state.overlayW;
    off.height = state.overlayH;
    const octx = off.getContext('2d', {alpha:false});
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';

    const prevScale = view.scale, prevOX = view.offsetX, prevOY = view.offsetY;
    view.scale = 1; view.offsetX = 0; view.offsetY = 0;

    (function renderTo(ctxTarget){
      const quadArr = [
        [state.quad[0].x, state.quad[0].y],
        [state.quad[1].x, state.quad[1].y],
        [state.quad[2].x, state.quad[2].y],
        [state.quad[3].x, state.quad[3].y],
      ];
      ctxTarget.setTransform(1,0,0,1,0,0);
      ctxTarget.clearRect(0,0,off.width,off.height);
      if (state.screenshotImg){
        if (state.screenshotOnTop){
          ctxTarget.drawImage(state.overlayImg, 0, 0);
          warpImageToQuad(ctxTarget, state.screenshotImg, quadArr, MESH_DETAIL_IDLE);
        } else {
          warpImageToQuad(ctxTarget, state.screenshotImg, quadArr, MESH_DETAIL_IDLE);
          ctxTarget.drawImage(state.overlayImg, 0, 0);
        }
      } else {
        ctxTarget.drawImage(state.overlayImg, 0, 0);
      }
    })(octx);

    view.scale = prevScale; view.offsetX = prevOX; view.offsetY = prevOY;

    const blob = await new Promise(res => off.toBlob(res,'image/png'));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = 'mockup.png'; 
    a.style.display='none';
    document.body.appendChild(a); 
    a.click();
    setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); }, 50);
    setStatus('Mockup image saved ✓','success');
  }catch(err){ setError('Save failed: ' + err.message); }
});

/* .mlite export */
function toBottomLeftNorm(pxPt){
  const nx = pxPt.x / state.overlayW;
  const ny_from_top = pxPt.y / state.overlayH;
  const ny_bottom_left = 1 - ny_from_top;
  return [nx, ny_bottom_left];
}
function buildCurrentMlitedoc(name = 'iP17Industrial', index = 0){
  if (!state.overlayImg || !state.quad) throw new Error('Nothing to export');
  const [TL, TR, BR, BL] = state.quad;
  function toBottomLeftNorm(pxPt){
    const nx = pxPt.x / state.overlayW;
    const ny_from_top = pxPt.y / state.overlayH;
    const ny_bottom_left = 1 - ny_from_top;
    return [nx, ny_bottom_left];
  }
  const uuid = (self.crypto && crypto.randomUUID) 
    ? crypto.randomUUID() 
    : (Date.now().toString(16) + Math.random().toString(16).slice(2, 10)).toUpperCase();

  return {
    id: uuid,
    customDeviceMockupBase64: state.originalOverlayBase64,
    index: index,
    projectionValues: {
      topLeft:      toBottomLeftNorm(TL),
      topRight:     toBottomLeftNorm(TR),
      bottomRight:  toBottomLeftNorm(BR),
      bottomLeft:   toBottomLeftNorm(BL),
      cornerRadius: Math.round(state.cornerRadius || 0)
    },
    name: name,
    screenshotOnTop: !!state.screenshotOnTop,
    isFavourite: false,
    supportsBackgrounds: false
  };
}
function openNameModalLikePrompt(defaultName='My Mockup.mlite'){
  const name = prompt('Name your .mlite file', defaultName);
  if (!name) return;
  const finalName = name.endsWith('.mlite') ? name : name + '.mlite';
  try{
    const doc = buildCurrentMlitedoc();
    const blob = new Blob([JSON.stringify(doc,null,2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ document.body.removeChild(a); }, 50);
    setStatus('.mlite exported ✓','success');
  }catch(err){ setError('Export .mlite failed: ' + err.message); }
}
els.exportMlBtn.addEventListener('click', ()=>{
  if (state.editMode){ setStatus('Finish editing before exporting .mlite','error'); return; }
  if (!state.hasLicense){ setStatus('Activate your license to export .mlite','error'); return; }
  if (!state.overlayImg || !state.quad){ setStatus('Load a Template PNG first to export .mlite','error'); return; }
  if (state.sourceType !== 'template'){ setStatus('Only Templates can be exported as .mlite files. Import a Template to enable this option.','error'); return; }
  openNameModalLikePrompt('My Mockup.mlite');
});

/* GLOBAL DISABLED CLICK HANDLER */
function getDisabledMessageFor(el){
  const id = el.id || '';
  // If no overlay/template/mlite loaded
  const noImport = !state.overlayImg;
  // For determining imported type
  const notTemplate = state.sourceType !== 'template';

  if (id === 'btnImportShot' || el.closest('#btnImportShot')){
    return 'Import a .mLite file or Template before importing a Screenshot.';
  }
  if (id === 'exportMlBtn'){
    if (noImport) return 'Import a .mLite file or Template before saving or exporting.';
    if (notTemplate) return 'Only Templates can be exported as .mLite files. Import a Template to enable this option.';
    if (state.editMode) return 'Finish editing before exporting .mLite.';
  }
  if (id === 'saveBtn'){
    if (noImport) return 'Import a .mLite file or Template before saving or exporting.';
    if (!state.hasLicense) return 'Activate your license to enable saving.';
    if (!state.screenshotImg) return 'Import a Screenshot to enable saving.';
  }
  if (id === 'editBtn'){
    if (!state.hasLicense) return 'Activate your license to edit.';
    if (!state.overlayImg || !state.quad) return 'Import a .mLite file or Template first to enable editing.';
  }
  // Fallback
  return 'This action is currently unavailable.';
}

function handleDisabledButtonClick(){
  document.addEventListener('click', (e)=>{
    // Find nearest actionable root (button or label acting as button)
    const el = e.target.closest('button, label');
    if (!el) return;

    const isDisabled = el.disabled || el.classList.contains('disabled') || el.dataset.disabled === 'true';

    if (isDisabled){
      e.preventDefault();
      e.stopPropagation();
      const msg = getDisabledMessageFor(el);
      setStatus(msg, 'error');
      // Ensure visual dim state always applied
      el.classList.add('disabled');
      if ('disabled' in el) el.disabled = true;
    }
  }, true); // capture phase to intercept early
}
handleDisabledButtonClick();

/* Robust disabled tap handler: works for true disabled buttons too */
function isDisabledEl(el){
  return !!(el && (el.disabled || el.classList.contains('disabled') || el.getAttribute('aria-disabled')==='true' || el.dataset.disabled === 'true'));
}
document.addEventListener('pointerdown', (e)=>{
  const el = e.target.closest('button, label');
  if (!el) return;
  if (isDisabledEl(el)){
    const msg = getDisabledMessageFor(el);
    setStatus(msg, 'error');
    e.preventDefault();
    e.stopPropagation();
  }
}, true);


/* Community link */
els.browse?.addEventListener("click", () => {
  if (!state.hasLicense) { setStatus("Activate your license to join the community", "error"); return; }
  window.open("https://t.me/+MbrzOkWJcZRiMDg8", "_blank");
});

els.currentYear.textContent = new Date().getFullYear();


/* --- iOS/iPadOS detection & .mlite accept fix --- */
function isIOSLike(){
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const iOS = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ can report as Mac; detect via touch points
  const iPadOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return iOS || iPadOS;
}
function relaxMliteAcceptOnIOS(){
  try{
    if (!els.mlite) return;
    if (isIOSLike()){
      // Remove accept filter so iOS Files app won't grey out .mlite JSON with odd MIME/UTI
      els.mlite.removeAttribute('accept');
      els.mlite.setAttribute('data-allfiles', 'true');
      // Nudge the user the first time
      if (!localStorage.getItem('mlite_ios_accept_relaxed')){
        setStatus('iOS Files: All files enabled for .mLite import. Select your .mlite and we\'ll validate it.', 'idle');
        localStorage.setItem('mlite_ios_accept_relaxed', '1');
      }
      // Optional: update label text subtly
      const span = els.btnImportMl?.querySelector('span');
      if (span && !span.textContent.includes('(iOS All Files)')){
        span.textContent = span.textContent + ' (iOS All Files)';
      }
    }
  }catch(e){ /* no-op */ }
}

/* Boot */
function boot(){
  relaxMliteAcceptOnIOS();
  checkExistingLicense();
  updateLicenseUI();
  updateActionStates();
  initMockupShowcase();
  setStatus('Ready to import files','idle');
  updateEmptyState();
  updateZoomUI();
  window.addEventListener('resize', positionZoomUI, { passive: true });
}
boot();
