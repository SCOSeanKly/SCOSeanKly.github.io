// Configuration
const GITHUB_CONFIG = {
    iconsUrl: 'https://github.com/SCOSeanKly/iconWeb/tree/main/icons',
    effectsUrl: 'https://github.com/SCOSeanKly/iconWeb/tree/main/effects'
};

// State
let state = {
    sampleIcons: [],
    availableEffects: [],
    uploadedFiles: [],
    selectedEffects: [],
    currentIconIndex: 0,
    processing: false
};

// DOM Elements
const elements = {
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    carouselSection: document.getElementById('carouselSection'),
    carouselTrack: document.getElementById('carouselTrack'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    effectsSection: document.getElementById('effectsSection'),
    effectsGrid: document.getElementById('effectsGrid'),
    effectsCount: document.getElementById('effectsCount'),
    uploadSection: document.getElementById('uploadSection'),
    uploadIcon: document.getElementById('uploadIcon'),
    uploadTitle: document.getElementById('uploadTitle'),
    uploadSubtitle: document.getElementById('uploadSubtitle'),
    browseBtn: document.getElementById('browseBtn'),
    fileInput: document.getElementById('fileInput'),
    uploadedFilesSection: document.getElementById('uploadedFilesSection'),
    uploadedFiles: document.getElementById('uploadedFiles'),
    uploadedCount: document.getElementById('uploadedCount'),
    progressSection: document.getElementById('progressSection'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    progressStatus: document.getElementById('progressStatus'),
    processBtn: document.getElementById('processBtn'),
    clearBtn: document.getElementById('clearBtn'),
    statusToast: document.getElementById('statusToast'),
    howToBtn: document.getElementById('howToBtn'),
    howToOverlay: document.getElementById('howToOverlay'),
    closeOverlay: document.getElementById('closeOverlay')
};

// Initialize app
async function init() {
    showToast('Loading images from GitHub...', 'info');
    
    try {
        await Promise.all([
            loadGitHubFolder(GITHUB_CONFIG.iconsUrl, 'icons'),
            loadGitHubFolder(GITHUB_CONFIG.effectsUrl, 'effects')
        ]);
        
        hideElement(elements.loadingState);
        
        if (state.sampleIcons.length > 0 && state.availableEffects.length > 0) {
            showElement(elements.emptyState);
            showElement(elements.carouselSection);
            showElement(elements.effectsSection);
            showElement(elements.uploadSection);
            renderCarousel();
            renderEffects();
            showToast('Images loaded successfully!', 'success');
        } else {
            showToast('Error: No images found in GitHub folders', 'error');
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Error loading images from GitHub', 'error');
        hideElement(elements.loadingState);
        elements.emptyState.querySelector('h2').textContent = 'Error Loading Images';
        elements.emptyState.querySelector('.subtitle').textContent = 'Please check the GitHub repository and try again';
        showElement(elements.emptyState);
    }
    
    setupEventListeners();
}

// Load images from GitHub folder
async function loadGitHubFolder(url, type) {
    try {
        const apiUrl = convertGitHubUrlToApi(url);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to load ${type} from GitHub`);
        }
        
        const files = await response.json();
        const imageFiles = files.filter(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            const isImageFile = ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(ext);
            const fileName = file.name.toLowerCase();
            
            // Exclude files with certain keywords
            const excludeKeywords = ['preview', 'test', 'demo', 'temp', 'sample'];
            const shouldExclude = excludeKeywords.some(keyword => fileName.includes(keyword));
            
            return isImageFile && !shouldExclude;
        });
        
        if (imageFiles.length === 0) {
            throw new Error(`No image files found in ${type} folder`);
        }
        
        // Sort files naturally (image1, image2, etc.)
        imageFiles.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)?.[0] || '999');
            const numB = parseInt(b.name.match(/\d+/)?.[0] || '999');
            return numA - numB;
        });
        
        const loadedImages = imageFiles.map((file, index) => ({
            id: index + 1,
            name: file.name.split('.')[0],
            url: file.download_url,
            fileName: file.name
        }));
        
        if (type === 'icons') {
            state.sampleIcons = loadedImages;
        } else {
            state.availableEffects = loadedImages;
        }
        
        return loadedImages;
    } catch (error) {
        console.error(`Error loading ${type}:`, error);
        throw error;
    }
}

// Convert GitHub URL to API URL
function convertGitHubUrlToApi(url) {
    if (!url.includes('github.com')) return url;
    
    const parts = url.replace('https://github.com/', '').split('/');
    const user = parts[0];
    const repo = parts[1];
    
    let path = '';
    let ref = 'main';
    
    if (parts[2] === 'tree' || parts[2] === 'blob') {
        ref = parts[3];
        path = parts.slice(4).join('/');
    } else {
        path = parts.slice(2).join('/');
    }
    
    return `https://api.github.com/repos/${user}/${repo}/contents/${path}?ref=${ref}`;
}

// Render carousel
function renderCarousel() {
    elements.carouselTrack.innerHTML = '';
    
    state.sampleIcons.forEach((icon, index) => {
        const item = document.createElement('div');
        item.className = 'carousel-item';
        item.style.cssText = getCarouselItemStyle(index);
        
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = 'position: relative; width: 100%; height: 100%;';
        
        const img = document.createElement('img');
        img.src = icon.url;
        img.alt = icon.name;
        img.className = 'carousel-base-icon';
        img.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: scale(1.0);';
        imgContainer.appendChild(img);
        
        // Add effect overlays
        state.selectedEffects.forEach(effectId => {
            const effect = state.availableEffects.find(e => e.id === effectId);
            if (effect) {
                const effectImg = document.createElement('img');
                effectImg.src = effect.url;
                effectImg.alt = effect.name;
                effectImg.className = 'carousel-effect-overlay';
                effectImg.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;';
                imgContainer.appendChild(effectImg);
            }
        });
        
        item.appendChild(imgContainer);
        item.addEventListener('click', () => {
            state.currentIconIndex = index;
            updateCarousel();
        });
        
        elements.carouselTrack.appendChild(item);
    });
}

// Get carousel item style with progressive blur
function getCarouselItemStyle(index) {
    const diff = index - state.currentIconIndex;
    const absN = Math.abs(diff);
    
    if (absN === 0) {
        // Center item - no blur
        return 'transform: translateX(0) scale(1); z-index: 5; opacity: 1; width: 300px; height: 300px; filter: blur(0px);';
    } else if (absN === 1) {
        // First outer items - slight blur
        return `transform: translateX(${diff > 0 ? '350px' : '-350px'}) scale(0.8); z-index: 4; opacity: 0.7; width: 240px; height: 240px; filter: blur(2px);`;
    } else if (absN === 2) {
        // Second outer items - more blur
        return `transform: translateX(${diff > 0 ? '650px' : '-650px'}) scale(0.6); z-index: 3; opacity: 0.4; width: 180px; height: 180px; filter: blur(4px);`;
    } else {
        // Furthest items - maximum blur
        return `transform: translateX(${diff > 0 ? '900px' : '-900px'}) scale(0.4); z-index: 1; opacity: 0; width: 120px; height: 120px; filter: blur(6px);`;
    }
}

// Update carousel
function updateCarousel() {
    const items = elements.carouselTrack.querySelectorAll('.carousel-item');
    items.forEach((item, index) => {
        item.style.cssText = getCarouselItemStyle(index);
    });
}

// Render effects
function renderEffects() {
    elements.effectsGrid.innerHTML = '';
    
    state.availableEffects.forEach(effect => {
        const item = document.createElement('div');
        item.className = 'effect-item';
        if (state.selectedEffects.includes(effect.id)) {
            item.classList.add('selected');
        }
        
        const img = document.createElement('img');
        img.src = effect.url;
        img.alt = effect.name;
        
        const name = document.createElement('div');
        name.className = 'effect-name';
        name.textContent = effect.name;
        
        item.appendChild(img);
        item.appendChild(name);
        
        if (state.selectedEffects.includes(effect.id)) {
            const badge = document.createElement('div');
            badge.className = 'selected-badge';
            badge.textContent = '✓';
            item.appendChild(badge);
        }
        
        item.addEventListener('click', () => toggleEffect(effect.id));
        elements.effectsGrid.appendChild(item);
    });
    
    updateEffectsCount();
}

// Toggle effect selection
function toggleEffect(effectId) {
    const index = state.selectedEffects.indexOf(effectId);
    if (index > -1) {
        state.selectedEffects.splice(index, 1);
    } else {
        state.selectedEffects.push(effectId);
    }
    
    renderEffects();
    renderCarousel();
    renderUploadedFiles();
    updateButtonStates();
}

// Update effects count
function updateEffectsCount() {
    if (state.selectedEffects.length > 0) {
        elements.effectsCount.textContent = `(${state.selectedEffects.length} selected)`;
    } else {
        elements.effectsCount.textContent = '';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Carousel navigation
    elements.prevBtn.addEventListener('click', () => {
        state.currentIconIndex = (state.currentIconIndex - 1 + state.sampleIcons.length) % state.sampleIcons.length;
        updateCarousel();
    });
    
    elements.nextBtn.addEventListener('click', () => {
        state.currentIconIndex = (state.currentIconIndex + 1) % state.sampleIcons.length;
        updateCarousel();
    });
    
    // Upload handlers
    elements.uploadSection.addEventListener('click', () => elements.fileInput.click());
    elements.browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.fileInput.click();
    });
    elements.fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        processUploadedFiles(files);
        e.target.value = '';
    });
    
    // Drag and drop
    elements.uploadSection.addEventListener('dragenter', handleDragEnter);
    elements.uploadSection.addEventListener('dragleave', handleDragLeave);
    elements.uploadSection.addEventListener('dragover', handleDragOver);
    elements.uploadSection.addEventListener('drop', handleDrop);
    
    // Action buttons
    elements.processBtn.addEventListener('click', processImages);
    elements.clearBtn.addEventListener('click', clearUploads);
    
    // How To overlay
    elements.howToBtn.addEventListener('click', () => {
        showElement(elements.howToOverlay);
    });
    
    elements.closeOverlay.addEventListener('click', () => {
        hideElement(elements.howToOverlay);
    });
    
    elements.howToOverlay.addEventListener('click', (e) => {
        if (e.target === elements.howToOverlay) {
            hideElement(elements.howToOverlay);
        }
    });
}

// Process uploaded files
function processUploadedFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        showToast('Please upload valid image files', 'error');
        return;
    }
    
    imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            state.uploadedFiles.push({
                name: file.name,
                preview: e.target.result,
                file: file
            });
            renderUploadedFiles();
            updateButtonStates();
        };
        reader.readAsDataURL(file);
    });
    
    showToast(`${imageFiles.length} file(s) uploaded successfully`, 'success');
}

// Render uploaded files
function renderUploadedFiles() {
    if (state.uploadedFiles.length === 0) {
        hideElement(elements.uploadedFilesSection);
        return;
    }
    
    showElement(elements.uploadedFilesSection);
    elements.uploadedCount.textContent = state.uploadedFiles.length;
    elements.uploadedFiles.innerHTML = '';
    
    state.uploadedFiles.forEach(file => {
        const item = document.createElement('div');
        item.className = 'uploaded-file';
        
        // Create container for image + effects
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = 'position: relative; width: 100%; height: 90px; margin-bottom: 8px; border-radius: 8px; overflow: hidden;';
        
        const img = document.createElement('img');
        img.src = file.preview;
        img.alt = file.name;
        img.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 8px;';
        imgContainer.appendChild(img);
        
        // Add effect overlays if any selected
        state.selectedEffects.forEach(effectId => {
            const effect = state.availableEffects.find(e => e.id === effectId);
            if (effect) {
                const effectImg = document.createElement('img');
                effectImg.src = effect.url;
                effectImg.alt = effect.name;
                effectImg.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; border-radius: 8px;';
                imgContainer.appendChild(effectImg);
            }
        });
        
        const name = document.createElement('div');
        name.className = 'file-name';
        name.textContent = file.name;
        
        item.appendChild(imgContainer);
        item.appendChild(name);
        elements.uploadedFiles.appendChild(item);
    });
}

// Drag and drop handlers
function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadSection.classList.add('dragging');
    elements.uploadIcon.textContent = '📥';
    elements.uploadTitle.textContent = 'Drop Your Icons Here!';
    elements.uploadSubtitle.textContent = 'Release to upload';
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadSection.classList.remove('dragging');
    elements.uploadIcon.textContent = '📤';
    elements.uploadTitle.textContent = 'Upload Your Icons';
    elements.uploadSubtitle.textContent = 'Drag and drop your icon images here';
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadSection.classList.remove('dragging');
    elements.uploadIcon.textContent = '📤';
    elements.uploadTitle.textContent = 'Upload Your Icons';
    elements.uploadSubtitle.textContent = 'Drag and drop your icon images here';
    
    const files = Array.from(e.dataTransfer.files);
    processUploadedFiles(files);
}

// Process images
async function processImages() {
    if (state.uploadedFiles.length === 0) {
        showToast('Please upload at least one icon image', 'error');
        return;
    }
    
    if (state.selectedEffects.length === 0) {
        showToast('Please select at least one effect', 'error');
        return;
    }
    
    state.processing = true;
    updateButtonStates();
    showElement(elements.progressSection);
    setProgress(0, 'Initializing...');
    
    try {
        const zip = new JSZip();
        const effectImages = state.availableEffects.filter(e => state.selectedEffects.includes(e.id));
        
        for (let i = 0; i < state.uploadedFiles.length; i++) {
            const file = state.uploadedFiles[i];
            setProgress(
                Math.round(((i) / state.uploadedFiles.length) * 100),
                `Processing ${i + 1} of ${state.uploadedFiles.length}...`
            );
            
            // Load the base image
            const img = await loadImage(file.preview);
            
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            // Draw base image
            ctx.drawImage(img, 0, 0);
            
            // Apply each selected effect
            for (const effect of effectImages) {
                const effectImg = await loadImage(effect.url);
                ctx.drawImage(effectImg, 0, 0, canvas.width, canvas.height);
            }
            
            // Convert to blob and add to zip
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const fileName = `processed_${file.name}`;
            zip.file(fileName, blob);
            
            setProgress(
                Math.round(((i + 1) / state.uploadedFiles.length) * 100),
                `Processed ${i + 1} of ${state.uploadedFiles.length}`
            );
        }
        
        // Generate zip file
        setProgress(100, 'Creating download...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `iconweb_processed_${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('Processing complete! Download started', 'success');
        
        setTimeout(() => {
            hideElement(elements.progressSection);
        }, 2000);
        
    } catch (error) {
        console.error('Processing error:', error);
        showToast('Error processing images. Please try again', 'error');
        hideElement(elements.progressSection);
    } finally {
        state.processing = false;
        updateButtonStates();
    }
}

// Load image helper
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Set progress
function setProgress(percent, status) {
    elements.progressBar.style.width = `${percent}%`;
    elements.progressText.textContent = `${percent}%`;
    elements.progressStatus.textContent = status;
}

// Clear uploads
function clearUploads() {
    state.uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    state.uploadedFiles = [];
    renderUploadedFiles();
    updateButtonStates();
    showToast('Uploads cleared', 'info');
}

// Update button states
function updateButtonStates() {
    const canProcess = state.uploadedFiles.length > 0 && state.selectedEffects.length > 0 && !state.processing;
    const canClear = state.uploadedFiles.length > 0 && !state.processing;
    
    elements.processBtn.disabled = !canProcess;
    elements.clearBtn.disabled = !canClear;
}

// Show/hide helpers
function showElement(element) {
    element.classList.remove('hidden');
}

function hideElement(element) {
    element.classList.add('hidden');
}

// Show toast
function showToast(message, type = 'info') {
    elements.statusToast.textContent = message;
    elements.statusToast.className = `status-toast ${type}`;
    
    // Trigger reflow
    void elements.statusToast.offsetWidth;
    
    elements.statusToast.classList.add('show');
    
    setTimeout(() => {
        elements.statusToast.classList.remove('show');
    }, 3000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
