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
    processing: false,
    cornerRadiusPercent: 13, // Default corner radius as percentage (66px / 512px ≈ 13%)
    shadowOpacity: 0,        // Shadow opacity 0-100 (default off)
    shadowYOffset: 10,       // Shadow Y offset in pixels
    shadowBlur: 20           // Shadow blur/spread in pixels
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
    closeOverlay: document.getElementById('closeOverlay'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    cornerRadiusSlider: document.getElementById('cornerRadiusSlider'),
    radiusValue: document.getElementById('radiusValue'),
    shadowOpacitySlider: document.getElementById('shadowOpacitySlider'),
    shadowOpacityValue: document.getElementById('shadowOpacityValue'),
    shadowYOffsetSlider: document.getElementById('shadowYOffsetSlider'),
    shadowYOffsetValue: document.getElementById('shadowYOffsetValue'),
    shadowBlurSlider: document.getElementById('shadowBlurSlider'),
    shadowBlurValue: document.getElementById('shadowBlurValue')
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

// Calculate corner radius in pixels based on percentage and image size
function calculateRadius(width, height) {
    const minDimension = Math.min(width, height);
    const radiusPixels = (state.cornerRadiusPercent / 100) * minDimension;
    return Math.min(radiusPixels, minDimension / 2);
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
        // Use 300px as reference size for carousel items
        const carouselRadius = calculateRadius(300, 300);
        
        img.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: scale(1.0); border-radius: ${carouselRadius}px;`;
        imgContainer.appendChild(img);
        
        // Add effect overlays
        state.selectedEffects.forEach(effectId => {
            const effect = state.availableEffects.find(e => e.id === effectId);
            if (effect) {
                const effectImg = document.createElement('img');
                effectImg.src = effect.url;
                effectImg.alt = effect.name;
                effectImg.className = 'carousel-effect-overlay';
                effectImg.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; border-radius: ${carouselRadius}px;`;
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
    
    // Calculate radius based on item size
    const getRadiusForSize = (size) => calculateRadius(size, size);
    
    // Calculate shadow style if enabled
    let shadowStyle = '';
    if (state.shadowOpacity > 0) {
        const shadowOpacityDecimal = state.shadowOpacity / 100;
        // We'll scale the shadow based on the item size
        const baseSize = 300; // Center item size
        let itemSize = 300;
        
        if (absN === 0) itemSize = 300;
        else if (absN === 1) itemSize = 240;
        else if (absN === 2) itemSize = 180;
        else itemSize = 120;
        
        const scale = itemSize / 512;
        const scaledYOffset = state.shadowYOffset * scale;
        const scaledBlur = state.shadowBlur * scale;
        shadowStyle = ` box-shadow: 0 ${scaledYOffset}px ${scaledBlur}px rgba(0,0,0,${shadowOpacityDecimal});`;
    }
    
    if (absN === 0) {
        // Center item - no blur
        const radius = getRadiusForSize(300);
        return `transform: translateX(0) scale(1); z-index: 5; opacity: 1; width: 300px; height: 300px; filter: blur(0px); border-radius: ${radius}px;${shadowStyle}`;
    } else if (absN === 1) {
        // First outer items - slight blur
        const radius = getRadiusForSize(240);
        return `transform: translateX(${diff > 0 ? '350px' : '-350px'}) scale(0.8); z-index: 4; opacity: 0.7; width: 240px; height: 240px; filter: blur(2px); border-radius: ${radius}px;${shadowStyle}`;
    } else if (absN === 2) {
        // Second outer items - more blur
        const radius = getRadiusForSize(180);
        return `transform: translateX(${diff > 0 ? '650px' : '-650px'}) scale(0.6); z-index: 3; opacity: 0.4; width: 180px; height: 180px; filter: blur(4px); border-radius: ${radius}px;${shadowStyle}`;
    } else {
        // Furthest items - maximum blur
        const radius = getRadiusForSize(120);
        return `transform: translateX(${diff > 0 ? '900px' : '-900px'}) scale(0.4); z-index: 1; opacity: 0; width: 120px; height: 120px; filter: blur(6px); border-radius: ${radius}px;${shadowStyle}`;
    }
}

// Update carousel
function updateCarousel() {
    const items = elements.carouselTrack.querySelectorAll('.carousel-item');
    items.forEach((item, index) => {
        item.style.cssText = getCarouselItemStyle(index);
        
        // Update border radius on all images
        const images = item.querySelectorAll('img');
        const itemSize = index === state.currentIconIndex ? 300 : (Math.abs(index - state.currentIconIndex) === 1 ? 240 : 180);
        const radius = calculateRadius(itemSize, itemSize);
        images.forEach(img => {
            img.style.borderRadius = `${radius}px`;
        });
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
    
    // Settings panel toggle
    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsPanel.classList.toggle('hidden');
    });
    
    // Corner radius slider
    elements.cornerRadiusSlider.addEventListener('input', (e) => {
        // Slider goes from 0-300, convert to percentage (0-50%)
        // Max 50% makes sense as that creates a perfect circle
        state.cornerRadiusPercent = (parseInt(e.target.value) / 300) * 50;
        
        // Display the pixel value for a 512x512 image
        const displayValue = Math.round(calculateRadius(512, 512));
        elements.radiusValue.textContent = displayValue;
        
        updateCarousel();
        renderUploadedFiles();
    });
    
    // Shadow opacity slider
    elements.shadowOpacitySlider.addEventListener('input', (e) => {
        state.shadowOpacity = parseInt(e.target.value);
        elements.shadowOpacityValue.textContent = state.shadowOpacity;
        updateCarousel();
        renderUploadedFiles();
    });
    
    // Shadow Y offset slider
    elements.shadowYOffsetSlider.addEventListener('input', (e) => {
        state.shadowYOffset = parseInt(e.target.value);
        elements.shadowYOffsetValue.textContent = state.shadowYOffset;
        updateCarousel();
        renderUploadedFiles();
    });
    
    // Shadow blur slider
    elements.shadowBlurSlider.addEventListener('input', (e) => {
        state.shadowBlur = parseInt(e.target.value);
        elements.shadowBlurValue.textContent = state.shadowBlur;
        updateCarousel();
        renderUploadedFiles();
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
        reader.onload = async (e) => {
            // Load the image to check dimensions
            const img = await loadImage(e.target.result);
            
            // Check if image is square
            const isSquare = img.width === img.height;
            
            // Create a canvas to resize to 512x512
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            // Draw image scaled to 512x512
            ctx.drawImage(img, 0, 0, 512, 512);
            
            // Convert to data URL
            const resizedDataUrl = canvas.toDataURL('image/png');
            
            state.uploadedFiles.push({
                name: file.name,
                preview: resizedDataUrl,
                file: file,
                isSquare: isSquare,
                originalWidth: img.width,
                originalHeight: img.height
            });
            
            renderUploadedFiles();
            updateButtonStates();
            
            // Show warning if not square
            if (!isSquare) {
                showToast(`Warning: "${file.name}" is not square (${img.width}×${img.height}). Results may vary.`, 'info');
            }
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
        
        // Calculate radius for thumbnail (90px height)
        const thumbnailRadius = calculateRadius(90, 90);
        
        // Apply shadow if opacity > 0
        let shadowStyle = '';
        if (state.shadowOpacity > 0) {
            const shadowOpacityDecimal = state.shadowOpacity / 100;
            // Scale shadow offset and blur to thumbnail size (90px vs 512px)
            const scale = 90 / 512;
            const scaledYOffset = state.shadowYOffset * scale;
            const scaledBlur = state.shadowBlur * scale;
            shadowStyle = `box-shadow: 0 ${scaledYOffset}px ${scaledBlur}px rgba(0,0,0,${shadowOpacityDecimal});`;
        }
        
        // Create container for image + effects
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = `position: relative; width: 100%; height: 90px; margin-bottom: 8px; border-radius: ${thumbnailRadius}px; overflow: visible; ${shadowStyle}`;
        
        const img = document.createElement('img');
        img.src = file.preview;
        img.alt = file.name;
        img.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; border-radius: ${thumbnailRadius}px;`;
        imgContainer.appendChild(img);
        
        // Add effect overlays if any selected
        state.selectedEffects.forEach(effectId => {
            const effect = state.availableEffects.find(e => e.id === effectId);
            if (effect) {
                const effectImg = document.createElement('img');
                effectImg.src = effect.url;
                effectImg.alt = effect.name;
                effectImg.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; border-radius: ${thumbnailRadius}px;`;
                imgContainer.appendChild(effectImg);
            }
        });
        
        // Add warning icon if not square
        if (!file.isSquare) {
            const warning = document.createElement('div');
            warning.className = 'warning-badge';
            warning.innerHTML = '⚠️';
            warning.title = 'Non-square image';
            warning.addEventListener('click', (e) => {
                e.stopPropagation();
                showToast(`"${file.name}" is not square (${file.originalWidth}×${file.originalHeight}). It has been resized to 512×512, which may distort the image. For best results, use square images.`, 'info', 5000);
            });
            imgContainer.appendChild(warning);
        }
        
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

// Process images with rounded corners
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
            
            // Load the base image (already 512x512)
            const img = await loadImage(file.preview);
            
            // Step 1: Create a canvas with the composited image
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext('2d', { alpha: true });
            
            // Draw base image
            tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
            
            // Apply each selected effect
            for (const effect of effectImages) {
                const effectImg = await loadImage(effect.url);
                tempCtx.drawImage(effectImg, 0, 0, tempCanvas.width, tempCanvas.height);
            }
            
            // Step 2: Calculate shadow padding needed
            const hasShadow = state.shadowOpacity > 0;
            const shadowPadding = hasShadow 
                ? Math.ceil(state.shadowYOffset + state.shadowBlur) 
                : 0;
            
            // Create the final canvas with extra space for shadow
            const canvas = document.createElement('canvas');
            const baseSize = img.width; // Original size (512x512)
            canvas.width = baseSize + (shadowPadding * 2);
            canvas.height = baseSize + (shadowPadding * 2);
            const ctx = canvas.getContext('2d', { alpha: true });
            
            // Clear to fully transparent
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Calculate radius based on the original base size
            const radius = calculateRadius(baseSize, baseSize);
            
            // Position icon in the center with shadow padding offset
            const offset = shadowPadding;
            
            // Step 3: Draw shadow if enabled
            // Step 3: Draw shadow if enabled
            if (hasShadow) {
                ctx.save();
                
                // Set shadow properties
                ctx.shadowColor = `rgba(0, 0, 0, ${state.shadowOpacity / 100})`;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = state.shadowYOffset;
                ctx.shadowBlur = state.shadowBlur;
                
                // Draw the rounded rectangle for shadow (filled shape)
                ctx.fillStyle = 'rgba(0, 0, 0, 1)'; // The shadow is created from this
                ctx.beginPath();
                ctx.moveTo(offset + radius, offset);
                ctx.lineTo(offset + baseSize - radius, offset);
                ctx.quadraticCurveTo(offset + baseSize, offset, offset + baseSize, offset + radius);
                ctx.lineTo(offset + baseSize, offset + baseSize - radius);
                ctx.quadraticCurveTo(offset + baseSize, offset + baseSize, offset + baseSize - radius, offset + baseSize);
                ctx.lineTo(offset + radius, offset + baseSize);
                ctx.quadraticCurveTo(offset, offset + baseSize, offset, offset + baseSize - radius);
                ctx.lineTo(offset, offset + radius);
                ctx.quadraticCurveTo(offset, offset, offset + radius, offset);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
                
                // Clear the shape itself (we only want the shadow)
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fillStyle = 'rgba(0, 0, 0, 1)';
                ctx.beginPath();
                ctx.moveTo(offset + radius, offset);
                ctx.lineTo(offset + baseSize - radius, offset);
                ctx.quadraticCurveTo(offset + baseSize, offset, offset + baseSize, offset + radius);
                ctx.lineTo(offset + baseSize, offset + baseSize - radius);
                ctx.quadraticCurveTo(offset + baseSize, offset + baseSize, offset + baseSize - radius, offset + baseSize);
                ctx.lineTo(offset + radius, offset + baseSize);
                ctx.quadraticCurveTo(offset, offset + baseSize, offset, offset + baseSize - radius);
                ctx.lineTo(offset, offset + radius);
                ctx.quadraticCurveTo(offset, offset, offset + radius, offset);
                ctx.closePath();
                ctx.fill();
                
                ctx.globalCompositeOperation = 'source-over';
            }
            
            // Step 4: Create mask for the icon content
            // Create a temporary canvas for the mask
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = canvas.width;
            maskCanvas.height = canvas.height;
            const maskCtx = maskCanvas.getContext('2d', { alpha: true });
            
            // Draw the rounded rectangle mask
            maskCtx.fillStyle = '#FFFFFF';
            maskCtx.beginPath();
            maskCtx.moveTo(offset + radius, offset);
            maskCtx.lineTo(offset + baseSize - radius, offset);
            maskCtx.quadraticCurveTo(offset + baseSize, offset, offset + baseSize, offset + radius);
            maskCtx.lineTo(offset + baseSize, offset + baseSize - radius);
            maskCtx.quadraticCurveTo(offset + baseSize, offset + baseSize, offset + baseSize - radius, offset + baseSize);
            maskCtx.lineTo(offset + radius, offset + baseSize);
            maskCtx.quadraticCurveTo(offset, offset + baseSize, offset, offset + baseSize - radius);
            maskCtx.lineTo(offset, offset + radius);
            maskCtx.quadraticCurveTo(offset, offset, offset + radius, offset);
            maskCtx.closePath();
            maskCtx.fill();
            
            // Apply the composited image within the mask
            maskCtx.globalCompositeOperation = 'source-in';
            maskCtx.drawImage(tempCanvas, offset, offset, baseSize, baseSize);
            
            // Step 5: Draw the masked icon on top of the shadow
            ctx.drawImage(maskCanvas, 0, 0);
            
            // Convert to blob and add to zip
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const fileName = `processed_${file.name.replace(/\.[^/.]+$/, '')}.png`;
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

// Create rounded rectangle path for clipping
function createRoundedRectPath(ctx, x, y, width, height, radius) {
    // Limit radius to half of the smallest dimension
    const maxRadius = Math.min(width, height) / 2;
    radius = Math.min(radius, maxRadius);
    
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
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
function showToast(message, type = 'info', duration = 3000) {
    elements.statusToast.textContent = message;
    elements.statusToast.className = `status-toast ${type}`;
    
    // Trigger reflow
    void elements.statusToast.offsetWidth;
    
    elements.statusToast.classList.add('show');
    
    setTimeout(() => {
        elements.statusToast.classList.remove('show');
    }, duration);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
