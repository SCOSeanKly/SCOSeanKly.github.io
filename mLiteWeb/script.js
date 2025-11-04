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

// Screenshot color assignments
const SCREENSHOT_COLORS = [
  { name: 'Blue', hex: '#5b9cf5', rgb: 'rgba(91, 156, 245, 0.8)' },
  { name: 'Green', hex: '#10b981', rgb: 'rgba(16, 185, 129, 0.8)' },
  { name: 'Orange', hex: '#f59e0b', rgb: 'rgba(245, 158, 11, 0.8)' },
  { name: 'Purple', hex: '#a855f7', rgb: 'rgba(168, 85, 247, 0.8)' }
];

const els = {
  template: document.getElementById('templateFile'),
  mlite: document.getElementById('mliteFile'),
  shot: document.getElementById('shotFile'),
  logo: document.getElementById('logoFile'),
  btnImportTemplate: document.getElementById('btnImportTemplate'),
  btnImportMl: document.getElementById('btnImportMl'),
  btnImportShot: document.getElementById('btnImportShot'),
  btnImportLogo: document.getElementById('btnImportLogo'),
  logoButtonGroup: document.getElementById('logoButtonGroup'),
  btnLogoSettings: document.getElementById('btnLogoSettings'),
  logoSettingsPanel: document.getElementById('logoSettingsPanel'),
  btnCloseLogoSettings: document.getElementById('btnCloseLogoSettings'),
  logoScaleSlider: document.getElementById('logoScaleSlider'),
  logoScaleValue: document.getElementById('logoScaleValue'),
  logoOpacitySlider: document.getElementById('logoOpacitySlider'),
  logoOpacityValue: document.getElementById('logoOpacityValue'),
  logoRadiusSlider: document.getElementById('logoRadiusSlider'),
  logoRadiusValue: document.getElementById('logoRadiusValue'),
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
  screenshotList: document.getElementById('screenshotList'),
  addScreenshotBtn: document.getElementById('addScreenshotBtn'),
};



const ctx = els.canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

/* ===== PERFORMANCE OPTIMIZATION: Base Composite Cache ===== */
let baseCompositeCanvas = null;
let baseCompositeCtx = null;
let baseCompositeDirty = true;

function invalidateBaseComposite() {
  baseCompositeDirty = true;
}

function ensureBaseCompositeCanvas() {
  if (!baseCompositeCanvas || baseCompositeCanvas.width !== state.overlayW || baseCompositeCanvas.height !== state.overlayH) {
    baseCompositeCanvas = document.createElement('canvas');
    baseCompositeCanvas.width = state.overlayW;
    baseCompositeCanvas.height = state.overlayH;
    baseCompositeCtx = baseCompositeCanvas.getContext('2d', { alpha: false });
    baseCompositeCtx.imageSmoothingEnabled = true;
    baseCompositeCtx.imageSmoothingQuality = 'high';
    baseCompositeDirty = true;
  }
}

/* ===== View transform (pan & zoom) - canvas rendering approach ===== */
const view = { scale: 1, offsetX: 0, offsetY: 0 };

function setView(scale, anchorCanvasX, anchorCanvasY, keepPoint=false){
  const clamped = Math.max(1, Math.min(4, scale));
  if (!keepPoint){
    const cx = els.canvas.width * 0.5;
    const cy = els.canvas.height * 0.5;
    const imgX = (cx - view.offsetX) / view.scale;
    const imgY = (cy - view.offsetY) / view.scale;
    view.scale = clamped;
    view.offsetX = cx - imgX * view.scale;
    view.offsetY = cy - imgX * view.scale;
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
  view.scale = 1; 
  view.offsetX = 0; 
  view.offsetY = 0;
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

let rafId = null;

const DST_EPS = 1.5;
const SRC_EPS = 1.0;
const ACCENT = '#5b9cf5';

// Detect coarse (touch) pointers
const IS_TOUCH = (typeof window !== 'undefined') && (('ontouchstart' in window) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));

function getHandleRadii(){
  const base = Math.max(5, Math.min(state.overlayW, state.overlayH) * 0.010 * 0.5);
  const rVis = IS_TOUCH ? Math.max(base, 12) : base;
  const rHit = IS_TOUCH ? Math.max(rVis * 2.0, 28) : Math.max(rVis * 1.6, 18);
  return { rVis, rHit };
}

let state = {
  overlayImg: null,
  overlayW: 1024,
  overlayH: 1024,
  screenshots: [], // Array of screenshot objects: { id, img, quad, colorIndex }
  activeScreenshotId: null,
  logoImg: null,
  logoSettings: {
    position: 'bottom-left',
    scale: 1.0,
    opacity: 1.0,
    cornerRadius: 0
  },
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
  const hasContent = state.overlayImg || state.screenshots.length > 0;
  els.emptyState.classList.toggle('hidden', !!hasContent);
  els.canvas.style.display = hasContent ? 'block' : 'none';
  els.zoomUI.classList.toggle('show', !!state.overlayImg && !!state.editMode);
  if (hasContent) positionZoomUI();
}

function readyForEdit(){ return !!(state.overlayImg && state.screenshots.length > 0) && state.hasLicense; }
function readyForExport(){ return !!(state.overlayImg && state.screenshots.length > 0) && state.hasLicense; }

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

  const canSave = state.hasLicense && state.overlayImg && state.screenshots.length > 0;
  els.save.disabled = !canSave;
  els.save.classList.toggle('disabled', !canSave);

  const shotReady = !!state.overlayImg && state.hasLicense && state.screenshots.length < 4;
  els.shot.disabled = !shotReady;
  els.btnImportShot.dataset.disabled = shotReady ? '' : 'true';
  els.btnImportShot.classList.toggle('disabled', !shotReady);

  const logoReady = !!state.overlayImg && state.hasLicense;
  els.logo.disabled = !logoReady;
  els.logoButtonGroup.dataset.disabled = logoReady ? '' : 'true';
  els.logoButtonGroup.classList.toggle('disabled', !logoReady);

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
                      state.screenshots.length > 0 && 
                      state.hasLicense && 
                      !state.editMode;
  els.exportMlBtn.disabled = !canExportMl;
  els.exportMlBtn.classList.toggle('disabled', !canExportMl);

  // Update add screenshot button
  if (els.addScreenshotBtn) {
    const canAdd = state.screenshots.length < 4 && state.overlayImg && state.hasLicense;
    els.addScreenshotBtn.disabled = !canAdd;
    els.addScreenshotBtn.classList.toggle('disabled', !canAdd);
  }
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

/* ===== OPTIMIZED: Build base composite (screenshots + overlay) ===== */
function buildBaseComposite() {
  if (!state.hasLicense || !state.overlayImg) return;
  
  ensureBaseCompositeCanvas();
  
  baseCompositeCtx.setTransform(1, 0, 0, 1, 0, 0);
  baseCompositeCtx.clearRect(0, 0, baseCompositeCanvas.width, baseCompositeCanvas.height);
  
  // Filter out screenshots that don't have images loaded
  const loadedScreenshots = state.screenshots.filter(shot => shot.img);
  
  if (loadedScreenshots.length > 0) {
    if (state.screenshotOnTop) {
      baseCompositeCtx.drawImage(state.overlayImg, 0, 0);
      // Draw all loaded screenshots
      loadedScreenshots.forEach(shot => {
        const quadArr = [
          [shot.quad[0].x, shot.quad[0].y],
          [shot.quad[1].x, shot.quad[1].y],
          [shot.quad[2].x, shot.quad[2].y],
          [shot.quad[3].x, shot.quad[3].y],
        ];
        warpImageToQuad(baseCompositeCtx, shot.img, quadArr, meshDetail);
      });
    } else {
      // Draw all loaded screenshots
      loadedScreenshots.forEach(shot => {
        const quadArr = [
          [shot.quad[0].x, shot.quad[0].y],
          [shot.quad[1].x, shot.quad[1].y],
          [shot.quad[2].x, shot.quad[2].y],
          [shot.quad[3].x, shot.quad[3].y],
        ];
        warpImageToQuad(baseCompositeCtx, shot.img, quadArr, meshDetail);
      });
      baseCompositeCtx.drawImage(state.overlayImg, 0, 0);
    }
  } else {
    // No screenshots loaded, just draw the overlay
    baseCompositeCtx.drawImage(state.overlayImg, 0, 0);
  }
  
  baseCompositeDirty = false;
}

/* ===== Draw logo only (for fast slider updates) ===== */
function drawLogoLayer(targetCtx) {
  if (!state.logoImg) return;
  
  const padding = 40;
  const baseHeight = state.overlayH * 0.15;
  const baseWidth = state.overlayW * 0.25;
  
  const maxLogoHeight = baseHeight * state.logoSettings.scale;
  const maxLogoWidth = baseWidth * state.logoSettings.scale;
  
  const logoAspect = state.logoImg.width / state.logoImg.height;
  let logoW = state.logoImg.width;
  let logoH = state.logoImg.height;
  
  if (logoH > maxLogoHeight) {
    logoH = maxLogoHeight;
    logoW = logoH * logoAspect;
  }
  if (logoW > maxLogoWidth) {
    logoW = maxLogoWidth;
    logoH = logoW / logoAspect;
  }
  
  let logoX, logoY;
  switch(state.logoSettings.position) {
    case 'top-left':
      logoX = padding;
      logoY = padding;
      break;
    case 'top-right':
      logoX = state.overlayW - logoW - padding;
      logoY = padding;
      break;
    case 'bottom-right':
      logoX = state.overlayW - logoW - padding;
      logoY = state.overlayH - logoH - padding;
      break;
    case 'bottom-left':
    default:
      logoX = padding;
      logoY = state.overlayH - logoH - padding;
      break;
  }
  
  targetCtx.save();
  targetCtx.globalAlpha = state.logoSettings.opacity;
  
  if (state.logoSettings.cornerRadius > 0) {
    targetCtx.beginPath();
    const radius = Math.min(state.logoSettings.cornerRadius, logoW/2, logoH/2);
    
    if (targetCtx.roundRect) {
      targetCtx.roundRect(logoX, logoY, logoW, logoH, radius);
    } else {
      targetCtx.moveTo(logoX + radius, logoY);
      targetCtx.lineTo(logoX + logoW - radius, logoY);
      targetCtx.quadraticCurveTo(logoX + logoW, logoY, logoX + logoW, logoY + radius);
      targetCtx.lineTo(logoX + logoW, logoY + logoH - radius);
      targetCtx.quadraticCurveTo(logoX + logoW, logoY + logoH, logoX + logoW - radius, logoY + logoH);
      targetCtx.lineTo(logoX + radius, logoY + logoH);
      targetCtx.quadraticCurveTo(logoX, logoY + logoH, logoX, logoY + logoH - radius);
      targetCtx.lineTo(logoX, logoY + radius);
      targetCtx.quadraticCurveTo(logoX, logoY, logoX + radius, logoY);
      targetCtx.closePath();
    }
    targetCtx.clip();
  }
  
  targetCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  targetCtx.shadowBlur = 10;
  targetCtx.shadowOffsetX = 2;
  targetCtx.shadowOffsetY = 2;
  targetCtx.drawImage(state.logoImg, logoX, logoY, logoW, logoH);
  targetCtx.restore();
}

/* ===== OPTIMIZED: Main render with logo-only fast path ===== */
function doRender(drawHandles=true, skipWarp=false, useView=true, logoOnly=false){
  if (!state.hasLicense || !state.overlayImg) return;

  ctx.setTransform(1,0,0,1,0,0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0,0,els.canvas.width,els.canvas.height);

  // Apply view transform if requested
  if (useView) {
    ctx.save();
    ctx.translate(view.offsetX, view.offsetY);
    ctx.scale(view.scale, view.scale);
  }

  // Fast path for logo-only adjustments
  if (logoOnly && !baseCompositeDirty && baseCompositeCanvas) {
    ctx.drawImage(baseCompositeCanvas, 0, 0);
    drawLogoLayer(ctx);
    if (useView) ctx.restore();
    return;
  }

  // Build or rebuild base composite if needed
  if (baseCompositeDirty || !baseCompositeCanvas) {
    buildBaseComposite();
  }

  if (baseCompositeCanvas) {
    ctx.drawImage(baseCompositeCanvas, 0, 0);
  }

  // Draw logo
  drawLogoLayer(ctx);

  // Draw edit handles and marching ants if in edit mode
  if (drawHandles && state.editMode && state.activeScreenshotId) {
    const screenshot = state.screenshots.find(s => s.id === state.activeScreenshotId);
    if (screenshot && screenshot.quad) {
      const color = SCREENSHOT_COLORS[screenshot.colorIndex];
      drawQuadOutlineAndHandles(ctx, screenshot.quad, color);
    }
  }

  if (useView) ctx.restore();
}

function drawQuadOutlineAndHandles(ctx, quad, color) {
  const { rVis, rHit } = getHandleRadii();
  
  // Draw marching ants outline
  ctx.save();
  ctx.setLineDash([10, 10]);
  ctx.lineDashOffset = -antsOffset;
  ctx.strokeStyle = color.hex;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(quad[0].x, quad[0].y);
  ctx.lineTo(quad[1].x, quad[1].y);
  ctx.lineTo(quad[2].x, quad[2].y);
  ctx.lineTo(quad[3].x, quad[3].y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Draw corner handles
  ctx.save();
  quad.forEach((pt, i) => {
    ctx.fillStyle = color.hex;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, rVis, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();
}

// Helper to convert screen coordinates to canvas image coordinates
function screenToCanvasCoords(screenX, screenY) {
  const rect = els.canvas.getBoundingClientRect();
  const canvasX = screenX - rect.left;
  const canvasY = screenY - rect.top;
  
  // Account for canvas CSS size vs actual pixel size
  const scaleX = els.canvas.width / rect.width;
  const scaleY = els.canvas.height / rect.height;
  
  // Convert to canvas pixels
  const x = canvasX * scaleX;
  const y = canvasY * scaleY;
  
  // Account for view transform (zoom/pan)
  const imgX = (x - view.offsetX) / view.scale;
  const imgY = (y - view.offsetY) / view.scale;
  
  return { x: imgX, y: imgY };
}

/* Pan & zoom handlers (touch and mouse) */
let isPanning = false;
let lastPanX = 0, lastPanY = 0;

els.canvas.addEventListener('pointerdown', (e)=>{
  if (!state.editMode || !state.overlayImg) return;

  const coords = screenToCanvasCoords(e.clientX, e.clientY);
  const imgX = coords.x;
  const imgY = coords.y;

  // Check if clicking on a handle
  if (state.activeScreenshotId) {
    const screenshot = state.screenshots.find(s => s.id === state.activeScreenshotId);
    if (screenshot && screenshot.quad) {
      const { rHit } = getHandleRadii();
      
      for (let i = 0; i < screenshot.quad.length; i++) {
        const pt = screenshot.quad[i];
        const dx = imgX - pt.x;
        const dy = imgY - pt.y;
        if (Math.hypot(dx, dy) <= rHit) {
          state.activeHandle = i;
          meshDetail = MESH_DETAIL_DRAG;
          els.canvas.style.cursor = 'grabbing';
          return;
        }
      }
    }
  }

  // Start panning when zoomed
  if (view.scale > 1) {
    isPanning = true;
    lastPanX = e.clientX;
    lastPanY = e.clientY;
    els.canvas.style.cursor = 'grabbing';
  }
});

els.canvas.addEventListener('pointermove', (e)=>{
  if (!state.editMode || !state.overlayImg) return;

  const coords = screenToCanvasCoords(e.clientX, e.clientY);
  const imgX = coords.x;
  const imgY = coords.y;

  if (state.activeHandle >= 0 && state.activeScreenshotId) {
    const screenshot = state.screenshots.find(s => s.id === state.activeScreenshotId);
    if (screenshot) {
      screenshot.quad[state.activeHandle].x = imgX;
      screenshot.quad[state.activeHandle].y = imgY;
      invalidateBaseComposite();
      doRender(true, true, true);
    }
  } else if (isPanning) {
    const dx = e.clientX - lastPanX;
    const dy = e.clientY - lastPanY;
    view.offsetX += dx;
    view.offsetY += dy;
    lastPanX = e.clientX;
    lastPanY = e.clientY;
    doRender(true, false, true);
  } else {
    // Update cursor based on hover
    if (state.activeScreenshotId) {
      const screenshot = state.screenshots.find(s => s.id === state.activeScreenshotId);
      if (screenshot && screenshot.quad) {
        const { rHit } = getHandleRadii();
        let onHandle = false;
        
        for (let i = 0; i < screenshot.quad.length; i++) {
          const pt = screenshot.quad[i];
          const dx = imgX - pt.x;
          const dy = imgY - pt.y;
          if (Math.hypot(dx, dy) <= rHit) {
            onHandle = true;
            break;
          }
        }
        
        els.canvas.style.cursor = onHandle ? 'pointer' : (view.scale > 1 ? 'grab' : 'default');
      }
    } else {
      els.canvas.style.cursor = view.scale > 1 ? 'grab' : 'default';
    }
  }
});

els.canvas.addEventListener('pointerup', ()=>{
  if (state.activeHandle >= 0) {
    state.activeHandle = -1;
    meshDetail = MESH_DETAIL_IDLE;
    invalidateBaseComposite();
    doRender(true, false, true);
  }
  isPanning = false;
  els.canvas.style.cursor = (state.editMode && view.scale > 1) ? 'grab' : (state.editMode ? 'pointer' : 'default');
});

els.canvas.addEventListener('pointerleave', ()=>{
  if (state.activeHandle >= 0) {
    state.activeHandle = -1;
    meshDetail = MESH_DETAIL_IDLE;
    invalidateBaseComposite();
    doRender(true, false, true);
  }
  isPanning = false;
});

/* Zoom slider */
els.zoomSlider.addEventListener('input', (e)=>{
  const targetScale = parseFloat(e.target.value);
  setView(targetScale, 0, 0, false);
});

/* Double-click to toggle zoom/reset */
els.canvas.addEventListener('dblclick', (e)=>{
  if (!state.editMode || !state.overlayImg) return;
  e.preventDefault();
  
  const rect = els.canvas.getBoundingClientRect();
  const canvasX = e.clientX - rect.left;
  const canvasY = e.clientY - rect.top;
  
  if (view.scale === 1) {
    const targetScale = 2.5;
    setView(targetScale, canvasX, canvasY, true);
  } else {
    resetView();
  }
});

/* Wheel zoom */
els.canvas.addEventListener('wheel', (e)=>{
  if (!state.editMode || !state.overlayImg) return;
  e.preventDefault();
  
  const rect = els.canvas.getBoundingClientRect();
  const canvasX = e.clientX - rect.left;
  const canvasY = e.clientY - rect.top;
  
  const delta = -e.deltaY;
  const zoomFactor = delta > 0 ? 1.1 : 0.9;
  const targetScale = view.scale * zoomFactor;
  setView(targetScale, canvasX, canvasY, true);
}, { passive: false });

/* Pinch zoom support for touch devices */
let lastDist = 0;
els.canvas.addEventListener('touchstart', (e)=>{
  if (!state.editMode || !state.overlayImg) return;
  if (e.touches.length === 2) {
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    lastDist = Math.hypot(dx, dy);
  }
}, { passive: false });

els.canvas.addEventListener('touchmove', (e)=>{
  if (!state.editMode || !state.overlayImg) return;
  if (e.touches.length === 2) {
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    
    if (lastDist > 0) {
      const zoomFactor = dist / lastDist;
      const rect = els.canvas.getBoundingClientRect();
      const centerX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
      const centerY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
      const targetScale = view.scale * zoomFactor;
      setView(targetScale, centerX, centerY, true);
    }
    lastDist = dist;
  }
}, { passive: false });

els.canvas.addEventListener('touchend', (e)=>{
  if (e.touches.length < 2) {
    lastDist = 0;
  }
});

/* Edit toggle (includes reset on exit) */
function toggleEdit(on){
  const next = (on===undefined) ? !state.editMode : !!on;
  if (!state.hasLicense || !state.overlayImg || state.screenshots.length === 0) return;
  if (next === state.editMode) return;

  const wasEditing = state.editMode;
  state.editMode = next;
  document.body.classList.toggle('editing', state.editMode);

  els.canvas.style.cursor = (state.editMode && view.scale > 1) ? 'grab' : (state.editMode ? 'pointer' : 'default');

  meshDetail = state.editMode ? MESH_DETAIL_DRAG : MESH_DETAIL_IDLE;
  els.editIcon.innerHTML = state.editMode
    ? '<path d="M3 3v6M3 3h6M21 3h-6M21 3v6M3 21v-6M3 21h6M21 21h-6M21 21v-6"/><path d="M9 9l-6-6M15 9l6-6M9 15l-6 6M15 15l6 6"/>'
    : '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>';

  if (wasEditing && !state.editMode) {
    resetView();
  }

  updateActionStates();
  updateZoomUI();
  invalidateBaseComposite();
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

/* Screenshot management */
function addScreenshot(img) {
  // First, check if there's an existing slot without an image
  const emptySlot = state.screenshots.find(s => !s.img);
  
  if (emptySlot) {
    // Fill the empty slot
    emptySlot.img = img;
    state.activeScreenshotId = emptySlot.id;
  } else {
    // Create a new screenshot if we haven't reached the limit
    if (state.screenshots.length >= 4) {
      setError('Maximum 4 screenshots allowed');
      return;
    }
    
    const colorIndex = state.screenshots.length;
    const screenshot = {
      id: Date.now() + Math.random(),
      img: img,
      quad: createDefaultScreenshotQuad(),
      colorIndex: colorIndex
    };
    
    state.screenshots.push(screenshot);
    state.activeScreenshotId = screenshot.id;
  }
  
  updateScreenshotList();
  invalidateBaseComposite();
  updateEmptyState();
  updateActionStates();
  updateDropZones();
  doRender(true, false, true);
}

function removeScreenshot(id) {
  const screenshot = state.screenshots.find(s => s.id === id);
  if (!screenshot) return;
  
  // Just clear the image, keep the slot and coordinates
  screenshot.img = null;
  
  // If this was the active screenshot, keep it active (so coordinates still show)
  // Or switch to another one that has an image
  if (state.activeScreenshotId === id) {
    const withImage = state.screenshots.find(s => s.img);
    if (withImage) {
      state.activeScreenshotId = withImage.id;
    }
    // If no screenshots have images, keep this one active so we can still see/edit coordinates
  }
  
  updateScreenshotList();
  invalidateBaseComposite();
  updateEmptyState();
  updateActionStates();
  updateDropZones();
  doRender(true, false, true);
}

function setActiveScreenshot(id) {
  state.activeScreenshotId = id;
  updateScreenshotList();
  doRender(true, false, true);
}

function updateScreenshotList() {
  if (!els.screenshotList) return;
  
  els.screenshotList.innerHTML = '';
  
  state.screenshots.forEach(screenshot => {
    const color = SCREENSHOT_COLORS[screenshot.colorIndex];
    const item = document.createElement('div');
    item.className = 'screenshot-item';
    if (screenshot.id === state.activeScreenshotId) {
      item.classList.add('active');
    }
    if (!screenshot.img) {
      item.classList.add('empty');
    }
    
    const btn = document.createElement('button');
    btn.className = 'screenshot-btn';
    btn.style.backgroundColor = color.hex;
    btn.textContent = `Screenshot ${screenshot.colorIndex + 1}${!screenshot.img ? ' (Empty)' : ''}`;
    
    // If empty, clicking imports; if filled, clicking selects
    btn.addEventListener('click', () => {
      if (!screenshot.img) {
        // Empty slot - trigger import for this specific slot
        state.activeScreenshotId = screenshot.id;
        updateScreenshotList();
        els.shot.click();
      } else {
        // Has image - just select it
        setActiveScreenshot(screenshot.id);
      }
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'screenshot-delete';
    deleteBtn.innerHTML = screenshot.img ? '×' : '🗑';
    deleteBtn.title = screenshot.img ? 'Clear image' : 'Delete slot';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (screenshot.img) {
        // Clear the image but keep the slot
        removeScreenshot(screenshot.id);
      } else {
        // Delete the entire slot
        const index = state.screenshots.findIndex(s => s.id === screenshot.id);
        if (index !== -1) {
          state.screenshots.splice(index, 1);
          // Reassign color indices
          state.screenshots.forEach((shot, i) => {
            shot.colorIndex = i;
          });
          if (state.activeScreenshotId === screenshot.id) {
            state.activeScreenshotId = state.screenshots.length > 0 ? state.screenshots[0].id : null;
          }
          updateScreenshotList();
          invalidateBaseComposite();
          updateEmptyState();
          updateActionStates();
          updateDropZones();
          doRender(true, false, true);
        }
      }
    });
    
    item.appendChild(btn);
    item.appendChild(deleteBtn);
    els.screenshotList.appendChild(item);
  });
}

/* Import handlers */
function markImportSelected(btnEl, on){
  if (!btnEl) return;
  btnEl.classList.toggle('selected', !!on);
  
  const span = btnEl.querySelector('span');
  if (span) {
    const currentText = span.textContent;
    if (on) {
      span.textContent = currentText.replace(/^Import\s+/i, 'Remove ');
    } else {
      span.textContent = currentText.replace(/^Remove\s+/i, 'Import ');
    }
  }
}

/* Clear functions */
function clearTemplateImport(){
  if (state.sourceType !== 'template') return;
  state.overlayImg = null;
  state.overlayW = 1024;
  state.overlayH = 1024;
  state.screenshots = [];
  state.activeScreenshotId = null;
  state.originalOverlayBase64 = null;
  state.sourceType = null;
  markImportSelected(els.btnImportTemplate, false);
  invalidateBaseComposite();
  updateEmptyState();
  updateActionStates();
  updateScreenshotList();
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
  state.screenshots = [];
  state.activeScreenshotId = null;
  state.originalOverlayBase64 = null;
  state.sourceType = null;
  markImportSelected(els.btnImportMl, false);
  invalidateBaseComposite();
  updateEmptyState();
  updateActionStates();
  updateScreenshotList();
  resetView();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,els.canvas.width,els.canvas.height);
  setStatus('.mLite removed','idle');
}

function clearLogoImport(){
  if (!state.logoImg) return;
  state.logoImg = null;
  markImportSelected(els.btnImportLogo, false);
  els.btnLogoSettings.style.display = 'none';
  els.logoSettingsPanel.classList.remove('active');
  state.logoSettings = {
    position: 'bottom-left',
    scale: 1.0,
    opacity: 1.0,
    cornerRadius: 0
  };
  if (els.logoScaleSlider) {
    els.logoScaleSlider.value = 1;
    els.logoScaleValue.textContent = '1.0';
  }
  if (els.logoOpacitySlider) {
    els.logoOpacitySlider.value = 1;
    els.logoOpacityValue.textContent = '100%';
  }
  if (els.logoRadiusSlider) {
    els.logoRadiusSlider.value = 0;
    els.logoRadiusValue.textContent = '0px';
  }
  document.querySelectorAll('.position-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.position-btn[data-position="bottom-left"]')?.classList.add('active');
  
  updateEmptyState();
  updateActionStates();
  doRender(true, false, true);
  setStatus('Logo removed','idle');
}

/* Toggle-click behavior on import buttons */
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

els.btnImportLogo.addEventListener('click', (e)=>{
  if (state.logoImg){
    const ok = confirm('Remove the imported Logo?');
    if (ok){
      e.preventDefault(); e.stopPropagation();
      clearLogoImport();
    } else {
      e.preventDefault(); e.stopPropagation();
    }
  }
}, true);

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
        // Don't auto-create screenshot quad, wait for screenshot import
        state.screenshotOnTop = false;
        state.cornerRadius = 0;

        markImportSelected(els.btnImportTemplate, true);
        markImportSelected(els.btnImportMl, false);
        invalidateBaseComposite();
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
      
      // Load screenshots if present
      state.screenshots = [];
      if (obj.screenshots && Array.isArray(obj.screenshots)) {
        obj.screenshots.forEach((shotData, index) => {
          if (shotData.quad) {
            const pv = shotData.quad;
            const H = state.overlayH, W = state.overlayW;
            function toPxBottomLeftNorm([nx, ny]) { return { x: nx * W, y: (1 - ny) * H }; }
            const tl = toPxBottomLeftNorm(pv.topLeft);
            const tr = toPxBottomLeftNorm(pv.topRight);
            const bl = toPxBottomLeftNorm(pv.bottomLeft);
            const br = toPxBottomLeftNorm(pv.bottomRight);
            
            // Create placeholder for screenshot (will be filled when imported)
            state.screenshots.push({
              id: Date.now() + Math.random() + index,
              img: null,
              quad: normalizeQuad([tl, tr, bl, br]),
              colorIndex: index
            });
          }
        });
      } else {
        // Legacy format - single screenshot
        const pv = obj.projectionValues || {};
        if (pv.topLeft) {
          const H = state.overlayH, W = state.overlayW;
          function toPxBottomLeftNorm([nx, ny]) { return { x: nx * W, y: (1 - ny) * H }; }
          const tl = toPxBottomLeftNorm(pv.topLeft);
          const tr = toPxBottomLeftNorm(pv.topRight);
          const bl = toPxBottomLeftNorm(pv.bottomLeft);
          const br = toPxBottomLeftNorm(pv.bottomRight);
          
          state.screenshots.push({
            id: Date.now(),
            img: null,
            quad: normalizeQuad([tl, tr, bl, br]),
            colorIndex: 0
          });
        }
      }
      
      if (state.screenshots.length > 0) {
        state.activeScreenshotId = state.screenshots[0].id;
      }
      
      state.screenshotOnTop = !!obj.screenshotOnTop;
      state.cornerRadius = (obj.projectionValues?.cornerRadius) || 0;
      
      markImportSelected(els.btnImportMl, true);
      markImportSelected(els.btnImportTemplate, false);
      invalidateBaseComposite();
      updateEmptyState();
      updateActionStates();
      updateScreenshotList();
      updateDropZones();
      resetView();
      
      // Always render the overlay, even if screenshots aren't loaded yet
      doRender(false, false, false);
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
    addScreenshot(img);
    setStatus('Screenshot loaded ✓', 'success');
  };
  img.onerror = ()=> setError('Failed to load screenshot image.');
  img.src = URL.createObjectURL(f);
  e.target.value = '';
});

if (els.addScreenshotBtn) {
  els.addScreenshotBtn.addEventListener('click', () => {
    if (state.screenshots.length >= 4) {
      setError('Maximum 4 screenshots allowed');
      return;
    }
    els.shot.click();
  });
}

els.logo.addEventListener('change', (e)=>{
  if (!state.hasLicense) { setStatus('Please activate your license first.','error'); e.target.value=''; return; }
  const f = e.target.files[0]; 
  if (!f) return;
  const ext = (f.name.split('.').pop()||'').toLowerCase();
  if (ext==='heic'||ext==='heif'){ setError('HEIC/HEIF not supported.'); return; }
  const img = new Image();
  img.onload = ()=>{ 
    state.logoImg = img;
    markImportSelected(els.btnImportLogo, true);
    els.btnLogoSettings.style.display = 'flex';
    updateEmptyState(); 
    updateActionStates(); 
    if (state.overlayImg) doRender(true, false, true, true); 
    setStatus('Logo loaded ✓','success');
  };
  img.onerror = ()=> setError('Failed to load logo image.');
  img.src = URL.createObjectURL(f);
  e.target.value = '';
});

// Logo settings panel handlers
els.btnLogoSettings?.addEventListener('click', (e) => {
  e.stopPropagation();
  els.logoSettingsPanel.classList.toggle('active');
  els.menuItems.classList.toggle('active', false);
  els.menuToggle.classList.toggle('active', false);
});

els.btnCloseLogoSettings?.addEventListener('click', () => {
  els.logoSettingsPanel.classList.remove('active');
  els.menuItems.classList.add('active');
  els.menuToggle.classList.add('active');
});

document.addEventListener('click', (e) => {
  if (els.logoSettingsPanel?.classList.contains('active')) {
    if (!els.logoSettingsPanel.contains(e.target) && 
        !els.btnLogoSettings.contains(e.target)) {
      els.logoSettingsPanel.classList.remove('active');
      els.menuItems.classList.add('active');
      els.menuToggle.classList.add('active');
    }
  }
});

// Position buttons
document.querySelectorAll('.position-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const position = btn.dataset.position;
    state.logoSettings.position = position;
    
    document.querySelectorAll('.position-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    if (state.overlayImg) doRender(true, false, true, true);
  });
});

// Logo settings sliders
els.logoScaleSlider?.addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  state.logoSettings.scale = value;
  els.logoScaleValue.textContent = value.toFixed(1);
  if (state.overlayImg) doRender(true, false, true, true);
});

if (els.logoOpacitySlider) {
  els.logoOpacitySlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    state.logoSettings.opacity = value;
    els.logoOpacityValue.textContent = Math.round(value * 100) + '%';
    if (state.overlayImg) doRender(true, false, true, true);
  });
}

els.logoRadiusSlider?.addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  state.logoSettings.cornerRadius = value;
  els.logoRadiusValue.textContent = value + 'px';
  if (state.overlayImg) doRender(true, false, true, true);
});

/* Save/Export */
function openNameModalLikePrompt(defaultName) {
  const name = prompt('Save as:', defaultName);
  if (!name || !name.trim()) return;
  exportMlite(name.trim());
}

function exportMlite(filename) {
  if (!state.hasLicense || !state.overlayImg || state.screenshots.length === 0) {
    setStatus('Cannot export: missing requirements', 'error');
    return;
  }

  try {
    const W = state.overlayW;
    const H = state.overlayH;
    
    function toNormBottomLeft(pt) {
      return [pt.x / W, 1 - (pt.y / H)];
    }

    const screenshots = state.screenshots.map(shot => ({
      quad: {
        topLeft: toNormBottomLeft(shot.quad[0]),
        topRight: toNormBottomLeft(shot.quad[1]),
        bottomRight: toNormBottomLeft(shot.quad[2]),
        bottomLeft: toNormBottomLeft(shot.quad[3]),
        cornerRadius: state.cornerRadius
      },
      colorIndex: shot.colorIndex
    }));

    const mliteData = {
      customDeviceMockupBase64: state.originalOverlayBase64,
      screenshots: screenshots,
      screenshotOnTop: state.screenshotOnTop,
      // Legacy support - keep first screenshot in old format
      projectionValues: screenshots[0]?.quad || {},
      version: 2
    };

    const json = JSON.stringify(mliteData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.mlite') ? filename : `${filename}.mlite`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('.mlite exported ✓', 'success');
  } catch (err) {
    setError('Export failed: ' + err.message);
  }
}

els.save?.addEventListener('click', async () => {
  if (!state.hasLicense) { setStatus('Activate your license to save', 'error'); return; }
  if (!state.overlayImg || state.screenshots.length === 0) { setStatus('Import a template and screenshot first', 'error'); return; }

  setStatus('Rendering…', 'loading');
  await new Promise(r => setTimeout(r, 50));

  const wasEditing = state.editMode;
  if (wasEditing) toggleEdit(false);

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = state.overlayW;
  exportCanvas.height = state.overlayH;
  const exportCtx = exportCanvas.getContext('2d', { alpha: false });
  exportCtx.imageSmoothingEnabled = true;
  exportCtx.imageSmoothingQuality = 'high';

  // Build final composite
  if (state.screenshots.some(s => s.img)) {
    if (state.screenshotOnTop) {
      exportCtx.drawImage(state.overlayImg, 0, 0);
      state.screenshots.forEach(shot => {
        if (shot.img) {
          const quadArr = [
            [shot.quad[0].x, shot.quad[0].y],
            [shot.quad[1].x, shot.quad[1].y],
            [shot.quad[2].x, shot.quad[2].y],
            [shot.quad[3].x, shot.quad[3].y],
          ];
          warpImageToQuad(exportCtx, shot.img, quadArr, MESH_DETAIL_IDLE);
        }
      });
    } else {
      state.screenshots.forEach(shot => {
        if (shot.img) {
          const quadArr = [
            [shot.quad[0].x, shot.quad[0].y],
            [shot.quad[1].x, shot.quad[1].y],
            [shot.quad[2].x, shot.quad[2].y],
            [shot.quad[3].x, shot.quad[3].y],
          ];
          warpImageToQuad(exportCtx, shot.img, quadArr, MESH_DETAIL_IDLE);
        }
      });
      exportCtx.drawImage(state.overlayImg, 0, 0);
    }
  } else {
    exportCtx.drawImage(state.overlayImg, 0, 0);
  }

  // Draw logo if present
  drawLogoLayer(exportCtx);

  exportCanvas.toBlob(blob => {
    if (wasEditing) toggleEdit(true);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mockup.png';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Mockup saved ✓', 'success');
  }, 'image/png');
});

els.exportMlBtn?.addEventListener('click', () => {
  if (!state.hasLicense) { setStatus('Activate your license to export .mlite', 'error'); return; }
  if (!state.overlayImg || state.screenshots.length === 0) { setStatus('Load a Template PNG first to export .mlite', 'error'); return; }
  if (state.sourceType !== 'template') { setStatus('Only Templates can be exported as .mlite files. Import a Template to enable this option.', 'error'); return; }
  openNameModalLikePrompt('My Mockup.mlite');
});

/* GLOBAL DISABLED CLICK HANDLER */
function getDisabledMessageFor(el) {
  const id = el.id || '';
  const noImport = !state.overlayImg;
  const notTemplate = state.sourceType !== 'template';

  if (id === 'btnImportShot' || el.closest('#btnImportShot')) {
    if (state.screenshots.length >= 4) return 'Maximum 4 screenshots allowed.';
    return 'Import a .mLite file or Template before importing a Screenshot.';
  }
  if (id === 'addScreenshotBtn') {
    if (state.screenshots.length >= 4) return 'Maximum 4 screenshots allowed.';
    return 'Import a Template first to add screenshots.';
  }
  if (id === 'exportMlBtn') {
    if (noImport) return 'Import a .mLite file or Template before saving or exporting.';
    if (notTemplate) return 'Only Templates can be exported as .mLite files. Import a Template to enable this option.';
    if (state.editMode) return 'Finish editing before exporting .mLite.';
  }
  if (id === 'saveBtn') {
    if (noImport) return 'Import a .mLite file or Template before saving or exporting.';
    if (!state.hasLicense) return 'Activate your license to enable saving.';
    if (state.screenshots.length === 0) return 'Import a Screenshot to enable saving.';
  }
  if (id === 'editBtn') {
    if (!state.hasLicense) return 'Activate your license to edit.';
    if (!state.overlayImg || state.screenshots.length === 0) return 'Import a .mLite file or Template and Screenshot first to enable editing.';
  }
  return 'This action is currently unavailable.';
}

function handleDisabledButtonClick() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, label');
    if (!el) return;

    const isDisabled = el.disabled || el.classList.contains('disabled') || el.dataset.disabled === 'true';

    if (isDisabled) {
      e.preventDefault();
      e.stopPropagation();
      const msg = getDisabledMessageFor(el);
      setStatus(msg, 'error');
      el.classList.add('disabled');
      if ('disabled' in el) el.disabled = true;
    }
  }, true);
}
handleDisabledButtonClick();

function isDisabledEl(el) {
  return !!(el && (el.disabled || el.classList.contains('disabled') || el.getAttribute('aria-disabled') === 'true' || el.dataset.disabled === 'true'));
}
document.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('button, label');
  if (!el) return;
  if (isDisabledEl(el)) {
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

/* iOS/iPadOS detection & .mlite accept fix */
function isIOSLike() {
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return iOS || iPadOS;
}

function relaxMliteAcceptOnIOS() {
  try {
    if (!els.mlite) return;
    if (isIOSLike()) {
      els.mlite.removeAttribute('accept');
      els.mlite.setAttribute('data-allfiles', 'true');
      if (!localStorage.getItem('mlite_ios_accept_relaxed')) {
        setStatus('iOS Files: All files enabled for .mLite import. Select your .mlite and we\'ll validate it.', 'idle');
        localStorage.setItem('mlite_ios_accept_relaxed', '1');
      }
      const span = els.btnImportMl?.querySelector('span');
      if (span && !span.textContent.includes('(iOS All Files)')) {
        span.textContent = span.textContent + ' (iOS All Files)';
      }
    }
  } catch (e) { }
}

/* Boot */
function boot() {
  relaxMliteAcceptOnIOS();
  checkExistingLicense();
  updateLicenseUI();
  updateActionStates();
  initMockupShowcase();
  setStatus('Ready to import files', 'idle');
  updateEmptyState();
  updateZoomUI();
  updateScreenshotList();
  updateDropZones();
  window.addEventListener('resize', positionZoomUI, { passive: true });
}
boot();

// Showcase visibility control
let _mliteLoaded = false;
let _templateLoaded = false;

function updateShowcaseVisibility() {
  const showcase = document.getElementById('mockupShowcase');
  const hasAny = _mliteLoaded || _templateLoaded;
  if (!showcase) return;
  showcase.style.display = hasAny ? 'none' : 'flex';
}

document.addEventListener('DOMContentLoaded', updateShowcaseVisibility);

const _mlInput = document.getElementById('mliteFile');
if (_mlInput && !_mlInput.__skFlagBound) {
  _mlInput.addEventListener('change', () => { _mliteLoaded = _mlInput.files && _mlInput.files.length > 0; updateShowcaseVisibility(); });
  _mlInput.__skFlagBound = true;
}
const _tplInput = document.getElementById('templateFile');
if (_tplInput && !_tplInput.__skFlagBound) {
  _tplInput.addEventListener('change', () => { _templateLoaded = _tplInput.files && _tplInput.files.length > 0; updateShowcaseVisibility(); });
  _tplInput.__skFlagBound = true;
}

window.__mliteSetShowcaseState = function ({ mlite = false, template = false } = {}) {
  _mliteLoaded = !!mlite; _templateLoaded = !!template; updateShowcaseVisibility();
};

// Auto-close Menu Enhancements
(function () {
  if (window.__mliteAutoCloseInit__) return;
  window.__mliteAutoCloseInit__ = true;

  function qs(id) { return document.getElementById(id); }
  const menuToggle = qs('menuToggle');
  const menuItems = qs('menuItems');
  ['removeTemplateBtn', 'removeScreenshotBtn', 'refreshBtn', 'clearAllBtn'].forEach(id => {
    const el = qs(id);
    if (el) el.dataset.keepopen = 'true';
  });

  function closeMenu() {
    if (!menuItems) return;
    menuItems.classList.remove('active');
    menuToggle && menuToggle.classList.remove('active');
  }

  function isRemovalOrMultiStepModeActive() {
    return !!document.querySelector('#menuItems [data-keepopen="true"]');
  }

  function maybeAutoCloseMenu(evt) {
    try {
      if (evt?.currentTarget?.dataset?.keepopen === 'true') return;
    } catch (e) { }
    if (isRemovalOrMultiStepModeActive()) return;
    closeMenu();
  }

  const fileIds = ['mliteFile', 'shotFile', 'templateFile'];
  fileIds.forEach(id => {
    const el = qs(id);
    if (el && !el.__ac_bound__) {
      el.addEventListener('change', (e) => { maybeAutoCloseMenu(e); }, { passive: true });
      el.__ac_bound__ = true;
    }
  });

  ['saveBtn', 'exportMlBtn', 'websiteBtn'].forEach(id => {
    const el = qs(id);
    if (el && !el.__ac_bound__) {
      el.addEventListener('click', maybeAutoCloseMenu, { passive: true });
      el.__ac_bound__ = true;
    }
  });

  window.__mliteCloseMenu = closeMenu;
})();

// Drag and drop support
let dragTargetSlot = null;
let dragTargetType = null;

// Update drop zone states based on current screenshots
function updateDropZones() {
  const slots = [
    document.getElementById('dropZoneScreenshot1'),
    document.getElementById('dropZoneScreenshot2'),
    document.getElementById('dropZoneScreenshot3'),
    document.getElementById('dropZoneScreenshot4')
  ];
  
  // Update each slot based on screenshot state
  state.screenshots.forEach((screenshot, index) => {
    if (slots[index]) {
      slots[index].classList.remove('disabled');
      if (screenshot.img) {
        slots[index].classList.add('filled');
        slots[index].querySelector('.slot-status').textContent = 'Filled';
      } else {
        slots[index].classList.remove('filled');
        slots[index].querySelector('.slot-status').textContent = 'Empty';
      }
    }
  });
  
  // Disable slots beyond available screenshots
  for (let i = state.screenshots.length; i < 4; i++) {
    if (slots[i]) {
      slots[i].classList.add('disabled');
      slots[i].classList.remove('filled');
      slots[i].querySelector('.slot-status').textContent = 'N/A';
    }
  }
}

// Setup drop zone tracking
function setupDropZoneTracking() {
  document.querySelectorAll('.drop-zone').forEach(zone => {
    zone.addEventListener('dragenter', (e) => {
      e.stopPropagation();
      const type = zone.dataset.type;
      dragTargetType = type;
      
      if (type === 'screenshot' && !zone.classList.contains('disabled')) {
        dragTargetSlot = parseInt(zone.dataset.slot);
        zone.classList.add('active');
      } else {
        dragTargetSlot = null;
        zone.classList.add('active');
      }
    });
    
    zone.addEventListener('dragleave', (e) => {
      if (e.target === zone || zone.contains(e.relatedTarget)) {
        return;
      }
      zone.classList.remove('active');
      if (zone.dataset.type === 'screenshot') {
        dragTargetSlot = null;
      }
      dragTargetType = null;
    });
  });
}

els.canvasContainer.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (!els.canvasContainer.classList.contains('drag-over')) {
    els.canvasContainer.classList.add('drag-over');
    updateDropZones();
  }
  
  // Also check which element we're over
  const dropZone = e.target.closest('.drop-zone');
  if (dropZone) {
    dragTargetType = dropZone.dataset.type;
    if (dragTargetType === 'screenshot' && dropZone.dataset.slot !== undefined) {
      dragTargetSlot = parseInt(dropZone.dataset.slot);
    }
  }
});

els.canvasContainer.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Only remove drag-over if we're actually leaving the container, not just entering a child
  const rect = els.canvasContainer.getBoundingClientRect();
  const x = e.clientX;
  const y = e.clientY;
  
  if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
    els.canvasContainer.classList.remove('drag-over');
    dragTargetSlot = null;
    dragTargetType = null;
    
    // Clear all active zone states
    document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('active'));
  }
});

els.canvasContainer.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  els.canvasContainer.classList.remove('drag-over');
  
  // Check which zone we dropped on
  const dropZone = e.target.closest('.drop-zone');
  if (dropZone) {
    dragTargetType = dropZone.dataset.type;
    if (dragTargetType === 'screenshot' && dropZone.dataset.slot !== undefined) {
      dragTargetSlot = parseInt(dropZone.dataset.slot);
    }
  }
  
  // Clear all active states
  document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('active'));

  const files = Array.from(e.dataTransfer.files);
  if (files.length === 0) {
    dragTargetSlot = null;
    dragTargetType = null;
    return;
  }

  const file = files[0];
  const ext = file.name.split('.').pop().toLowerCase();

  console.log('Drop detected:', { type: dragTargetType, slot: dragTargetSlot, ext: ext });

  // Check what type of zone was targeted
  if (dragTargetType === 'mlite' && (ext === 'mlite' || ext === 'json')) {
    const dt = new DataTransfer();
    dt.items.add(file);
    els.mlite.files = dt.files;
    els.mlite.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (dragTargetType === 'template' && ext === 'png') {
    const dt = new DataTransfer();
    dt.items.add(file);
    els.template.files = dt.files;
    els.template.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (dragTargetType === 'screenshot' && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    if (!state.overlayImg) {
      setError('Import a Template or .mlite file first');
      dragTargetSlot = null;
      dragTargetType = null;
      return;
    }
    
    console.log('Screenshot drop detected');
    console.log('Target slot:', dragTargetSlot);
    console.log('Available screenshots:', state.screenshots.length);
    console.log('Screenshots array:', state.screenshots);
    
    // Handle screenshot drop to specific slot
    if (dragTargetSlot !== null && dragTargetSlot >= 0 && dragTargetSlot < state.screenshots.length) {
      const targetScreenshot = state.screenshots[dragTargetSlot];
      console.log('Target screenshot object:', targetScreenshot);
      
      if (!targetScreenshot) {
        console.error('Screenshot slot exists but is undefined');
        setError('Screenshot slot error');
        dragTargetSlot = null;
        dragTargetType = null;
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        console.log('Screenshot loaded successfully, filling slot', dragTargetSlot);
        // Set this slot as active and fill it
        state.activeScreenshotId = targetScreenshot.id;
        targetScreenshot.img = img;
        updateScreenshotList();
        updateDropZones();
        invalidateBaseComposite();
        updateEmptyState();
        updateActionStates();
        doRender(true, false, true);
        setStatus(`Screenshot ${dragTargetSlot + 1} loaded ✓`, 'success');
        dragTargetSlot = null;
        dragTargetType = null;
      };
      img.onerror = () => {
        console.error('Failed to load screenshot image');
        setError('Failed to load screenshot image.');
        dragTargetSlot = null;
        dragTargetType = null;
      };
      img.src = URL.createObjectURL(file);
    } else {
      console.log('Invalid slot or no slot targeted. Slot:', dragTargetSlot, 'Available:', state.screenshots.length);
      console.log('Using fallback - filling first empty slot');
      // No specific slot targeted or invalid slot, use the old behavior (fill first empty)
      const dt = new DataTransfer();
      dt.items.add(file);
      els.shot.files = dt.files;
      els.shot.dispatchEvent(new Event('change', { bubbles: true }));
    }
  } else if (!dragTargetType) {
    // No specific zone targeted, use file extension to determine action
    if (ext === 'mlite' || ext === 'json') {
      const dt = new DataTransfer();
      dt.items.add(file);
      els.mlite.files = dt.files;
      els.mlite.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (ext === 'png') {
      const dt = new DataTransfer();
      dt.items.add(file);
      els.template.files = dt.files;
      els.template.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (['jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
      if (!state.overlayImg) {
        setError('Import a Template or .mlite file first');
        dragTargetSlot = null;
        dragTargetType = null;
        return;
      }
      const dt = new DataTransfer();
      dt.items.add(file);
      els.shot.files = dt.files;
      els.shot.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  
  dragTargetSlot = null;
  dragTargetType = null;
});

// Initialize drop zone tracking
setupDropZoneTracking();

// Prevent browser from opening files when dropped outside drop zones
document.addEventListener('dragover', (e) => {
  e.preventDefault();
}, false);

document.addEventListener('drop', (e) => {
  e.preventDefault();
}, false);
