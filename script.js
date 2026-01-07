/* ==========================================================================
   SHOW CREATIVE — Interaction & Animation Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    
    // --------------------------------------------------------------------------
    // Custom Cursor
    // --------------------------------------------------------------------------
    const cursor = document.querySelector('.cursor');
    const cursorFollower = document.querySelector('.cursor-follower');
    
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let followerX = 0, followerY = 0;
    
    // Only enable custom cursor on devices with hover capability
    if (window.matchMedia('(hover: hover)').matches && cursor && cursorFollower) {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        // Smooth cursor animation
        function animateCursor() {
            // Main cursor (faster)
            cursorX += (mouseX - cursorX) * 0.2;
            cursorY += (mouseY - cursorY) * 0.2;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
            
            // Follower (slower, more laggy)
            followerX += (mouseX - followerX) * 0.08;
            followerY += (mouseY - followerY) * 0.08;
            cursorFollower.style.left = followerX + 'px';
            cursorFollower.style.top = followerY + 'px';
            
            requestAnimationFrame(animateCursor);
        }
        animateCursor();
        
        // Hover effects for interactive elements
        const hoverElements = document.querySelectorAll('a, button, .app-card, .gallery-item');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorFollower.classList.add('hovering');
            });
            el.addEventListener('mouseleave', () => {
                cursorFollower.classList.remove('hovering');
            });
        });
        
        // Hide cursor when leaving window
        document.addEventListener('mouseleave', () => {
            cursor.style.opacity = '0';
            cursorFollower.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            cursor.style.opacity = '1';
            cursorFollower.style.opacity = '0.5';
        });
    }
    
    // --------------------------------------------------------------------------
    // Navigation Menu
    // --------------------------------------------------------------------------
    const navToggle = document.getElementById('navToggle');
    const menu = document.getElementById('menu');
    
    if (navToggle && menu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            menu.classList.toggle('active');
            document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
        });
        
        // Close menu when clicking on menu links
        const menuLinks = menu.querySelectorAll('.menu-link, .menu-link-small');
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                // If it's an anchor link on the same page
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    
                    navToggle.classList.remove('active');
                    menu.classList.remove('active');
                    document.body.style.overflow = '';
                    
                    // Wait for menu to close, then scroll
                    setTimeout(() => {
                        const target = document.querySelector(href);
                        if (target) {
                            const offset = 100;
                            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                            window.scrollTo({
                                top: targetPosition,
                                behavior: 'smooth'
                            });
                        }
                    }, 400);
                } else {
                    // External link, close menu
                    navToggle.classList.remove('active');
                    menu.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('active')) {
                navToggle.classList.remove('active');
                menu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // --------------------------------------------------------------------------
    // Scroll Reveal Animations
    // --------------------------------------------------------------------------
    const revealElements = document.querySelectorAll('.app-card, .gallery-item, .stat-item, .contact-content');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Optional: unobserve after revealing
                // revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '-50px'
    });
    
    revealElements.forEach(el => {
        el.classList.add('reveal');
        revealObserver.observe(el);
    });
    
    // --------------------------------------------------------------------------
    // Stat Counter Animation
    // --------------------------------------------------------------------------
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const value = parseInt(target.getAttribute('data-value'));
                animateCounter(target, value);
                statObserver.unobserve(target);
            }
        });
    }, {
        threshold: 0.5
    });
    
    statNumbers.forEach(num => {
        statObserver.observe(num);
    });
    
    function animateCounter(element, target) {
        const duration = 2000;
        const start = performance.now();
        const startValue = 0;
        
        function update(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out-expo)
            const eased = 1 - Math.pow(2, -10 * progress);
            const current = Math.floor(startValue + (target - startValue) * eased);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target;
            }
        }
        
        requestAnimationFrame(update);
    }
    
    // --------------------------------------------------------------------------
    // Gallery Horizontal Scroll
    // --------------------------------------------------------------------------
    const galleryTrack = document.querySelector('.gallery-track');
    const progressBar = document.querySelector('.gallery-progress-bar');
    
    if (galleryTrack && progressBar) {
        // Drag to scroll
        let isDown = false;
        let startX;
        let scrollLeft;
        
        galleryTrack.addEventListener('mousedown', (e) => {
            isDown = true;
            galleryTrack.style.cursor = 'grabbing';
            startX = e.pageX - galleryTrack.offsetLeft;
            scrollLeft = galleryTrack.scrollLeft;
        });
        
        galleryTrack.addEventListener('mouseleave', () => {
            isDown = false;
            galleryTrack.style.cursor = 'grab';
        });
        
        galleryTrack.addEventListener('mouseup', () => {
            isDown = false;
            galleryTrack.style.cursor = 'grab';
        });
        
        galleryTrack.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - galleryTrack.offsetLeft;
            const walk = (x - startX) * 2;
            galleryTrack.scrollLeft = scrollLeft - walk;
        });
        
        // Progress bar update
        galleryTrack.addEventListener('scroll', () => {
            const scrollWidth = galleryTrack.scrollWidth - galleryTrack.clientWidth;
            const scrollPercent = (galleryTrack.scrollLeft / scrollWidth) * 100;
            const barWidth = (galleryTrack.clientWidth / galleryTrack.scrollWidth) * 100;
            
            progressBar.style.setProperty('--progress', `${scrollPercent}%`);
            progressBar.querySelector('::after') || updateProgressBar(scrollPercent, barWidth);
        });
        
        function updateProgressBar(percent, width) {
            const afterStyle = progressBar.style;
            afterStyle.setProperty('width', `${width}%`);
            progressBar.style.transform = `translateX(${(percent / (100 - width)) * 100}%)`;
        }
        
        // Update progress on scroll
        galleryTrack.addEventListener('scroll', () => {
            const maxScroll = galleryTrack.scrollWidth - galleryTrack.clientWidth;
            const progress = (galleryTrack.scrollLeft / maxScroll) * 80; // 80% max position
            progressBar.style.cssText = `
                --progress: ${progress}%;
            `;
            // Update the ::after pseudo-element via CSS variable
            progressBar.style.setProperty('--bar-translate', `${progress}%`);
        });
    }
    
    // --------------------------------------------------------------------------
    // Smooth Scroll for Anchor Links
    // --------------------------------------------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offset = 100;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // --------------------------------------------------------------------------
    // Parallax Effects on Scroll
    // --------------------------------------------------------------------------
    const heroAmbient = document.querySelector('.hero-ambient');
    const contactOrb = document.querySelector('.contact-orb');
    
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.pageYOffset;
                
                // Hero ambient parallax
                if (heroAmbient) {
                    const heroOffset = scrollY * 0.3;
                    heroAmbient.style.transform = `translateY(${heroOffset}px)`;
                }
                
                // Contact orb parallax
                if (contactOrb) {
                    const contactSection = document.querySelector('.contact');
                    if (contactSection) {
                        const rect = contactSection.getBoundingClientRect();
                        if (rect.top < window.innerHeight && rect.bottom > 0) {
                            const orbOffset = (rect.top - window.innerHeight) * 0.2;
                            contactOrb.style.transform = `translateY(calc(-50% + ${orbOffset}px))`;
                        }
                    }
                }
                
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // --------------------------------------------------------------------------
    // App Card Hover Effect (magnetic icon)
    // --------------------------------------------------------------------------
    const appCards = document.querySelectorAll('.app-card');
    
    appCards.forEach(card => {
        const icon = card.querySelector('.app-icon');
        if (!icon) return;
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const deltaX = (x - centerX) / centerX;
            const deltaY = (y - centerY) / centerY;
            
            const rotateX = deltaY * -5;
            const rotateY = deltaX * 5;
            
            icon.style.transform = `
                perspective(500px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                translateY(-5px)
            `;
        });
        
        card.addEventListener('mouseleave', () => {
            icon.style.transform = '';
        });
    });
    
    // --------------------------------------------------------------------------
    // Gallery Items Stagger Animation
    // --------------------------------------------------------------------------
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    const galleryObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, index * 100);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '-20px'
    });
    
    galleryItems.forEach(item => {
        item.classList.add('reveal');
        galleryObserver.observe(item);
    });
    
    // --------------------------------------------------------------------------
    // Preloader (optional - add loading state)
    // --------------------------------------------------------------------------
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
        
        // Trigger initial animations after load
        setTimeout(() => {
            document.querySelectorAll('.hero .title-word').forEach(word => {
                word.style.animationPlayState = 'running';
            });
        }, 100);
    });
    
    // --------------------------------------------------------------------------
    // Performance: Reduce animations for users who prefer reduced motion
    // --------------------------------------------------------------------------
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.style.setProperty('--ease-out-expo', 'ease');
        document.querySelectorAll('.grain').forEach(el => el.remove());
        
        // Disable cursor animations
        if (cursor) cursor.style.display = 'none';
        if (cursorFollower) cursorFollower.style.display = 'none';
    }
    
});

// --------------------------------------------------------------------------
// Console Signature
// --------------------------------------------------------------------------
console.log(
    '%c Show Creative ',
    'background: #d4a574; color: #0a0a0a; font-size: 24px; font-weight: bold; padding: 10px 20px; border-radius: 4px;'
);
console.log(
    '%c Crafting Beautiful iOS Experiences ',
    'color: #888; font-size: 12px; padding: 5px 0;'
);
