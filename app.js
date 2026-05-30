/* ==========================================================================
   M365 STAFF ONBOARDING WIKI - INTERACTIVE SCRIPT
   Features: Collapsible sections, Screenshot visibility toggle,
             Advanced Lightbox Zoom/Pan, Scroll observer, Copy helper
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. COLLAPSIBLE CARD CONTROLLER
    // ==========================================
    const cardHeaders = document.querySelectorAll('.card-header');
    
    cardHeaders.forEach(header => {
        // Support click
        header.addEventListener('click', () => {
            toggleCard(header);
        });

        // Support Keyboard Enter/Space
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleCard(header);
            }
        });
    });

    function toggleCard(header) {
        const card = header.closest('.collapsible-card');
        const body = card.querySelector('.card-body');
        const isExpanded = card.classList.contains('expanded');
        const actionLabel = header.querySelector('.expand-label');
        
        if (isExpanded) {
            // Collapse
            card.classList.remove('expanded');
            header.setAttribute('aria-expanded', 'false');
            if (actionLabel) actionLabel.textContent = 'Click to expand';
        } else {
            // Expand
            card.classList.add('expanded');
            header.setAttribute('aria-expanded', 'true');
            if (actionLabel) actionLabel.textContent = 'Click to collapse';
        }
    }


    // ==========================================
    // 2. GLOBAL SCREENSHOT VISIBILITY TOGGLE
    // ==========================================
    const screenshotToggle = document.getElementById('screenshot-toggle');
    const screenshotWrappers = document.querySelectorAll('.screenshot-wrapper');

    screenshotToggle.addEventListener('change', (e) => {
        const show = e.target.checked;
        
        screenshotWrappers.forEach(wrapper => {
            if (show) {
                wrapper.classList.remove('hidden-mode');
            } else {
                wrapper.classList.add('hidden-mode');
            }
        });
    });


    // ==========================================
    // 3. INTERACTIVE LIGHTBOX & ZOOM/PAN
    // ==========================================
    const lightbox = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-image');
    const lightboxClose = document.getElementById('lightbox-close');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');
    const zoomIndicator = document.getElementById('zoom-indicator');
    const backdrop = document.querySelector('.lightbox-backdrop');

    // Zoom & Pan State variables
    let currentScale = 1;
    const scaleStep = 0.25;
    const maxScale = 3;
    const minScale = 0.75;
    
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;

    // Attach click events to screenshots
    screenshotWrappers.forEach(wrapper => {
        wrapper.addEventListener('click', (e) => {
            // Extract the img inside the wrapper
            const img = wrapper.querySelector('img');
            if (img) {
                openLightbox(img.src, img.alt);
            }
        });
    });

    function openLightbox(src, alt) {
        lightboxImg.src = src;
        lightboxImg.alt = alt;
        
        // Reset scale and positions
        currentScale = 1;
        translateX = 0;
        translateY = 0;
        updateImageTransform();
        
        // Show Lightbox
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Lock background scrolling
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = ''; // Unlock scroll
    }

    // Close triggers
    lightboxClose.addEventListener('click', closeLightbox);
    backdrop.addEventListener('click', closeLightbox);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });

    // Zoom Controls
    zoomInBtn.addEventListener('click', () => {
        if (currentScale < maxScale) {
            currentScale += scaleStep;
            updateImageTransform();
        }
    });

    zoomOutBtn.addEventListener('click', () => {
        if (currentScale > minScale) {
            currentScale -= scaleStep;
            updateImageTransform();
        }
    });

    zoomResetBtn.addEventListener('click', () => {
        currentScale = 1;
        translateX = 0;
        translateY = 0;
        updateImageTransform();
    });

    function updateImageTransform() {
        lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
        zoomIndicator.textContent = `${Math.round(currentScale * 100)}%`;
        
        // Update cursor style depending on zoom level
        if (currentScale > 1) {
            lightboxImg.style.cursor = 'grab';
        } else {
            lightboxImg.style.cursor = 'default';
        }
    }

    // Panning & Dragging Support (active when zoomed in)
    lightboxImg.addEventListener('mousedown', (e) => {
        if (currentScale <= 1) return; // Only pan when zoomed in
        e.preventDefault();
        isDragging = true;
        lightboxImg.style.cursor = 'grabbing';
        
        // Calculate starting offset
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        // Calculate new translations
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        
        updateImageTransform();
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            if (currentScale > 1) {
                lightboxImg.style.cursor = 'grab';
            }
        }
    });

    // Support Scroll Wheel Zoom inside Lightbox
    lightbox.addEventListener('wheel', (e) => {
        if (!lightbox.classList.contains('active')) return;
        e.preventDefault();
        
        const zoomDirection = e.deltaY < 0 ? 1 : -1;
        if (zoomDirection === 1 && currentScale < maxScale) {
            currentScale += 0.15;
        } else if (zoomDirection === -1 && currentScale > minScale) {
            currentScale -= 0.15;
            // Bound it
            if (currentScale < minScale) currentScale = minScale;
        }
        
        updateImageTransform();
    }, { passive: false });


    // ==========================================
    // 4. COPY EMAIL TEMPLATE BUTTON
    // ==========================================
    const copyBtn = document.getElementById('copy-template-btn');
    const templateTextElement = document.getElementById('template-text');

    if (copyBtn && templateTextElement) {
        copyBtn.addEventListener('click', () => {
            // Strip HTML markup to copy clean plain text
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = templateTextElement.innerText;
            
            // Clean specific links inside template for text format
            const links = tempDiv.querySelectorAll('a');
            links.forEach(link => {
                link.replaceWith(link.href);
            });

            const textToCopy = tempDiv.innerText || tempDiv.textContent;

            navigator.clipboard.writeText(textToCopy).then(() => {
                // Success visual state
                const originalContent = copyBtn.innerHTML;
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = `
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>Copied!</span>
                `;
                
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = originalContent;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    }


    // ==========================================
    // 5. STICKY NAV AND SCROLL OBSERVER
    // ==========================================
    const sections = document.querySelectorAll('section.collapsible-card');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Intersection Observer Options
    const observerOptions = {
        root: null, // Viewport
        rootMargin: '-80px 0px -60% 0px', // Shrink vertical margin bounds to activate exact sections
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                
                // Remove active class from all links
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                        // Auto-scroll the horizontal nav to keep the active item visible on mobile
                        link.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // Helper to scroll to a section with dynamic offsets
    function scrollToSection(element) {
        const tabsBarHeight = document.querySelector('.main-tabs-bar').offsetHeight || 51;
        const dashboardBarHeight = document.getElementById('dashboard-bar').offsetHeight || 80;
        const navBarHeight = tabsBarHeight + dashboardBarHeight;
        const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - navBarHeight - 16;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    // Explicit Nav Click Smooth Scroll (to account for collapsible panel heights)
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // If collapsed, expand first before scrolling
                if (!targetElement.classList.contains('expanded')) {
                    const header = targetElement.querySelector('.card-header');
                    toggleCard(header);
                }

                // Scroll with offset
                scrollToSection(targetElement);

                // Update browser URL address bar hash without default jump scroll
                history.pushState(null, null, targetId);
            }
        });
    });

    // ==========================================
    // 6. TAB CONTROLLER & ROUTER (DEEP LINKING)
    // ==========================================
    const tabBtnGuide = document.getElementById('tab-btn-guide');
    const tabBtnScripts = document.getElementById('tab-btn-scripts');
    const tabPanelGuide = document.getElementById('tab-panel-guide');
    const tabPanelScripts = document.getElementById('tab-panel-scripts');

    if (tabBtnGuide && tabBtnScripts && tabPanelGuide && tabPanelScripts) {
        tabBtnGuide.addEventListener('click', () => {
            window.location.hash = 'guide';
        });
        tabBtnScripts.addEventListener('click', () => {
            window.location.hash = 'scripts-' + activeScriptName;
        });
    }

    function switchTab(tabId) {
        if (tabId === 'guide') {
            tabBtnGuide.classList.add('active');
            tabBtnGuide.setAttribute('aria-selected', 'true');
            tabBtnScripts.classList.remove('active');
            tabBtnScripts.setAttribute('aria-selected', 'false');
            
            tabPanelGuide.classList.add('active');
            tabPanelScripts.classList.remove('active');
        } else if (tabId === 'scripts') {
            tabBtnScripts.classList.add('active');
            tabBtnScripts.setAttribute('aria-selected', 'true');
            tabBtnGuide.classList.remove('active');
            tabBtnGuide.setAttribute('aria-selected', 'false');
            
            tabPanelScripts.classList.add('active');
            tabPanelGuide.classList.remove('active');
            
            // Load initial script if not loaded
            loadSelectedScript(activeScriptName);
        }
    }

    // ==========================================
    // 7. POWERSHELL SCRIPTS MANAGER & VIEWER
    // ==========================================
    const scriptNavButtons = document.querySelectorAll('.script-nav-btn');
    const currentScriptNameEl = document.getElementById('current-script-name');
    const scriptCodeContentEl = document.getElementById('script-code-content');
    const scriptDescriptionCardEl = document.getElementById('script-description-card');
    const copyScriptBtn = document.getElementById('copy-script-btn');

    let activeScriptName = 'New-UserProvisioning.ps1';
    let loadedScriptsCache = {};

    const embeddedScripts = {
        "New-UserProvisioning.ps1": {
            description: "Comprehensive script that automates the complete onboarding process: creating the M365 user account, assigning licenses, waiting for directory sync, adding to group/DL, and sending a confirmation HTML email to the manager.",
            requiredModules: ["Microsoft.Graph.Users", "Microsoft.Graph.Groups", "ExchangeOnlineManagement"],
            content: "77u/IyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09DQojIENPTkZJR1VSQVRJT04NCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQ0KJEZpcnN0TmFtZSAgICAgPSAiU2FyYWgiDQokTGFzdE5hbWUgICAgICA9ICJTbWl0aCINCiREaXNwbGF5TmFtZSAgID0gIiRGaXJzdE5hbWUgJExhc3ROYW1lIg0KJEpvYlRpdGxlICAgICAgPSAiU29mdHdhcmUgRW5naW5lZXIiDQokRGVwYXJ0bWVudCAgICA9ICJFbmdpbmVlcmluZyINCiRVc2FnZUxvY2F0aW9uID0gIkFVIiAgICAgICAgICAgICAgICAgIA0KJFRlbmFudERvbWFpbiAgPSAibWlsbGlvbm1vdmVzMjYub25taWNyb3NvZnQuY29tIg0KJE1hbmFnZXJFbWFpbCAgPSAibWFuYWdlckBtaWxsaW9ubW92ZXMyNi5vbm1pY3Jvc29mdC5jb20iDQokVGFyZ2V0R3JvdXAgICA9ICJBbGwgVXNlcnMiDQokVGFyZ2V0REwgICAgICA9ICJBbGwgU3RhZmYiDQokU2t1SWQgICAgICAgICA9ICJjYmRjMTRhYi1kOTZjLTRjMzAtYjlmNC02YWRhN2NkYzFkNDYiIA0KDQojIE5FVzogQWRqdXN0YWJsZSBhY2NvdW50IHN5bmMgZGVsYXkgKGluIHNlY29uZHMpDQokU3luY0RlbGF5ICAgICAgPSA1MCAjIDUwIHNlY3Mgd2FpdCBiZWZvcmUgYWRkaW5nIHVzZXIgdG8gYSBETCAvIGluY3JlYXNlIGRlbGF5IGlmIGZhaWxpbmcgdG8gYWRkDQoNCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQ0KIyBNT0RVTEUgJiBMT0dJTiBNQU5BR0VNRU5UDQojID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0NCkltcG9ydC1Nb2R1bGUgTWljcm9zb2Z0LkdyYXBoLlVzZXJzLCBNaWNyb3NvZnQuR3JhcGguR3JvdXBzLCBFeGNoYW5nZU9ubGluZU1hbmFnZW1lbnQNCg0KV3JpdGUtSG9zdCAiQ2xlYXJpbmcgYWN0aXZlIG1lbW9yeSBzcGFjZXMuLi4iIC1Gb3JlZ3JvdW5kQ29sb3IgQ3lhbg0KRGlzY29ubmVjdC1NZ0dyYXBoIC1FcnJvckFjdGlvbiBTaWxlbnRseUNvbnRpbnVlIHwgT3V0LU51bGwNCkRpc2Nvbm5lY3QtRXhjaGFuZ2VPbmxpbmUgLUNvbmZpcm06JGZhbHNlIC1FcnJvckFjdGlvbiBTaWxlbnRseUNvbnRpbnVlIHwgT3V0LU51bGwNCg0KV3JpdGUtSG9zdCAiQ29ubmVjdGluZyB0byBNaWNyb3NvZnQgR3JhcGguLi4iIC1Gb3JlZ3JvdW5kQ29sb3IgQ3lhbg0KQ29ubmVjdC1NZ0dyYXBoIC1TY29wZXMgIlVzZXIuUmVhZFdyaXRlLkFsbCIsIkRpcmVjdG9yeS5SZWFkV3JpdGUuQWxsIiwiR3JvdXAuUmVhZFdyaXRlLkFsbCIsIk1haWwuU2VuZCIgLVRlbmFudElkICJiMmUwZWU5Yi05ZjIzLTQ0MWQtYjUyOC00MjE3NTliN2U4ZTciIC1Vc2VEZXZpY2VBdXRoZW50aWNhdGlvbg0KDQokQ3VycmVudENvbnRleHQgPSBHZXQtTWdDb250ZXh0DQokQWRtaW5FbWFpbCA9ICRDdXJyZW50Q29udGV4dC5BY2NvdW50DQoNCldyaXRlLUhvc3QgIkhvb2tpbmcgRXhjaGFuZ2UgT25saW5lIFNoZWxsIENvcmUgb250byAkQWRtaW5FbWFpbC4uLiIgLUZvcmVncm91bmRDb2xvciBDeWFuDQpDb25uZWN0LUV4Y2hhbmdlT25saW5lIC1Vc2VyUHJpbmNpcGFsTmFtZSAkQWRtaW5FbWFpbCAtT3JnYW5pemF0aW9uICJtaWxsaW9ubW92ZXMyNi5vbm1pY3Jvc29mdC5jb20iIC1FcnJvckFjdGlvbiBTdG9wIHwgT3V0LU51bGwNCg0KdHJ5IHsNCiAgICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLQ0KICAgICMgU1RFUCAxOiBDUkVBVEUgVVNFUg0KICAgICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tDQogICAgJFJhbmRvbVBhc3N3b3JkID0gW1N5c3RlbS5JTy5QYXRoXTo6R2V0UmFuZG9tRmlsZU5hbWUoKSArIFtTeXN0ZW0uSU8uUGF0aF06OkdldFJhbmRvbUZpbGVOYW1lKCkuU3Vic3RyaW5nKDAsNCkuVG9VcHBlcigpICsgIjI2ISINCiAgICAkTWFpbE5pY2tuYW1lICAgPSAiJCgkRmlyc3ROYW1lKS4kKCRMYXN0TmFtZSkiLlRvTG93ZXIoKQ0KICAgICRVc2VyUHJpbmNpcGFsICA9ICIkTWFpbE5pY2tuYW1lQCRUZW5hbnREb21haW4iDQoNCiAgICBXcml0ZS1Ib3N0ICJgbltTVEVQIDFdIENyZWF0aW5nIHVzZXIgYWNjb3VudCBmb3IgJERpc3BsYXlOYW1lLi4uIiAtRm9yZWdyb3VuZENvbG9yIEN5YW4NCiAgICAkTmV3VXNlciA9IE5ldy1NZ1VzZXIgLUFjY291bnRFbmFibGVkIC1EaXNwbGF5TmFtZSAkRGlzcGxheU5hbWUgLUdpdmVuTmFtZSAkRmlyc3ROYW1lIC1TdXJuYW1lICRMYXN0TmFtZSAtSm9iVGl0bGUgJEpvYlRpdGxlIC1EZXBhcnRtZW50ICREZXBhcnRtZW50IC1Vc2FnZUxvY2F0aW9uICRVc2FnZUxvY2F0aW9uIC1NYWlsTmlja25hbWUgJE1haWxOaWNrbmFtZSAtVXNlclByaW5jaXBhbE5hbWUgJFVzZXJQcmluY2lwYWwgLVBhc3N3b3JkUHJvZmlsZSBAeyBGb3JjZUNoYW5nZVBhc3N3b3JkTmV4dFNpZ25JbiA9ICR0cnVlOyBQYXNzd29yZCA9ICRSYW5kb21QYXNzd29yZCB9IC1FcnJvckFjdGlvbiBTdG9wDQogICAgV3JpdGUtSG9zdCAiU3VjY2VzcyEgVXNlciBvYmplY3QgY3JlYXRlZC4iIC1Gb3JlZ3JvdW5kQ29sb3IgR3JlZW4NCg0KICAgICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tDQogICAgIyBTVEVQIDI6IExJQ0VOU0UgQVNTSUdOTUVOVA0KICAgICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tDQogICAgU2V0LU1nVXNlckxpY2Vuc2UgLVVzZXJJZCAkTmV3VXNlci5JZCAtQWRkTGljZW5zZXMgQChAeyBTa3VJZCA9ICRTa3VJZCB9KSAtUmVtb3ZlTGljZW5zZXMgQCgpIC1FcnJvckFjdGlvbiBTdG9wDQogICAgV3JpdGUtSG9zdCAiYG5bU1RFUCAyXSBBc3NpZ25pbmcgTGljZW5zZS4uLiIgLUZvcmVncm91bmRDb2xvciBDeWFuDQogICAgV3JpdGUtSG9zdCAiU3VjY2VzcyEgTGljZW5zZSBhc3NpZ25lZC4iIC1Gb3JlZ3JvdW5kQ29sb3IgR3JlZW4NCg0KICAgICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tDQogICAgIyBTVEVQIHg6IFBST1BBR0FUSU9OIERFTEFZIChDUklUSUNBTCBGSVgpDQogICAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0NCiAgICBXcml0ZS1Ib3N0ICJgbldhaXRpbmcgJFN5bmNEZWxheSBzZWNvbmRzIGZvciBkaXJlY3Rvcnkgc3luY2hyb25pemF0aW9uLi4uIiAtRm9yZWdyb3VuZENvbG9yIFllbGxvdw0KICAgIFN0YXJ0LVNsZWVwIC1TZWNvbmRzICRTeW5jRGVsYXkNCg0KICAgICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tDQogICAgIyBTVEVQIDM6IEdST1VQIE1FTUJFUlNISVBTDQogICAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0NCiAgICAjIE0zNjUgR3JvdXANCiAgICBXcml0ZS1Ib3N0ICJgbltTVEVQIDNdIERpc2NvdmVyaW5nIGFjdGl2ZSBhZG1pbmlzdHJhdG9yIGlkZW50aXR5Li4uJyIgLUZvcmVncm91bmRDb2xvciBDeWFuDQogICAgV3JpdGUtSG9zdCAiQXR0ZW1wdGluZyB0byBhZGQgdXNlciB0byBNMzY1IEdyb3VwICckVGFyZ2V0R3JvdXAnLi4uIiAtRm9yZWdyb3VuZENvbG9yIEN5YW4NCiAgICAkR3JvdXAgPSBHZXQtTWdHcm91cCAtRmlsdGVyICJkaXNwbGF5TmFtZSBlcSAnJFRhcmdldEdyb3VwJyIgLUVycm9yQWN0aW9uIFNpbGVudGx5Q29udGludWUNCiAgICBpZiAoJEdyb3VwKSB7DQogICAgICAgIE5ldy1NZ0dyb3VwTWVtYmVyIC1Hcm91cElkICRHcm91cC5JZCAtRGlyZWN0b3J5T2JqZWN0SWQgJE5ld1VzZXIuSWQgLUVycm9yQWN0aW9uIFNpbGVudGx5Q29udGludWUNCiAgICAgICAgV3JpdGUtSG9zdCAiU3VjY2VzcyEgQWRkZWQgdG8gTTM2NSBHcm91cCAnJFRhcmdldEdyb3VwJy4iIC1Gb3JlZ3JvdW5kQ29sb3IgR3JlZW4NCiAgICB9DQoNCiAgICAjIERpc3RyaWJ1dGlvbiBMaXN0DQogICAgV3JpdGUtSG9zdCAiQXR0ZW1wdGluZyB0byBhZGQgdXNlciB0byBETCAnJFRhcmdldERMJy4uLiIgLUZvcmVncm91bmRDb2xvciBDeWFuDQ5IHRyeSB7DQogICAgICAgIEFkZC1EaXN0cmlidXRpb25Hcm91cE1lbWJlciAtSWRlbnRpdHkgJFRhcmdldERMIC1NZW1iZXIgJFVzZXJQcmluY2lwYWwgLUJ5cGFzc1NlY3VyaXR5R3JvdXBNYW5hZ2VyQ2hlY2sgLUVycm9yQWN0aW9uIFN0b3ANCiAgICAgICAgV3JpdGUtSG9zdCAiU3VjY2VzcyEgQWRkZWQgdG8gREwgJyRUYXJnZXRETFkuIiAtRm9yZWdyb3VuZENvbG9yIEdyZWVuDQogICAgfQ0KICAgIGNhdGNoIHsNCiAgICAgICAgaWYgKCRfLkV4Y2VwdGlvbi5NZXNzYWdlIC1saWtlICoqYWxyZWFkeSBleGlzdHMqKikgew0KICAgICAgICAgICAgV3JpdGUtSG9zdCAiIFtTS0lQXSBVc2VyIGFscmVhZHkgaW4gJyRUYXJnZXRETFkuIiAtRm9yZWdyb3VuZENvbG9yIFllbGxvdw0KICAgICAgICB9IGVsc2Ugew0KICAgICAgICAgICAgV3JpdGUtSG9zdCAiIFtFUlJPUl0gVW5hYmxlIHRvIGFkZCB0byBETCAnJFRhcmdldERMLiBJbmNyZWFzZSBkZWxheSB0byBlbnN1cmUgY29tcGxldGUgc3luY2hyb25pemF0aW9uLiIgLUZvcmVncm91bmRDb2xvciBSZWQNCiAgICAgICAgfQ0KICAgIH0NCiAgICAgICAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0NCiAgICAjIFNURVAgNDogU0VORCBXRUxDT01FIEVNQUlMIFRPIE1BTkFHRVINCiAgICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLQ0KICAgIFdyaXRlLUhvc3QgImBuW1NURVAgNF0gRGlzY292ZXJpbmcgYWN0aXZlIGFkbWluaXN0cmF0b3IgaWRlbnRpdHkuLi4iIC1Gb3JlZ3JvdW5kQ29sb3IgQ3lhbg0KICAgICRDdXJyZW50Q29udGV4dCA9IEdldC1NZ0NvbnRleHQNCiAgICAkQWRtaW5FbWFpbCA9ICRDdXJyZW50Q29udGV4dC5BY2NvdW50DQoNCiAgICBXcml0ZS1Ib3N0ICJEcmFmdGluZyBwcm92aXNpb25pbmcgb3ZlcnZpZXcgZm9yICRNYW5hZ2VyRW1haWwuLi4iIC1Gb3JlZ3JvdW5kQ29sb3IgQ3lhbg0KICAgIA0KICAgICRFbWFpbEJvZHkgPSBAIg0KICAgIDxodG1sPg0KICAgIDxib2R5IHN0eWxlPSJmb250LWZhbWlseTogQXJpYWwsIHNhbnMtc2VyaWY7IGxpbmUtaGVpZ2h0OiAxLjY7IGNvbG9yOiAjMzMzMzMzOyI+DQogICAgICAgIDxoMiBzdHlsZT0iY29sb3I6ICMwMDc4ZDQ7Ij5Vc2VyIE9uYm9hcmRpbmcgQXV0b21hdGVkIFJlcG9ydDwvaDI+DQogICAgICAgIDxwPkhlbGxvLDwvcD4NCiAgICAgICAgPHA+VGhlIHN5c3RlbSBwcm9maWxlIHNldHVwIGZvciA8c3Ryb25nPiREaXNwbGF5TmFtZTwvc3Ryb25nPiBoYXMgZmluaXNoZWQgcHJvY2Vzc2luZy48L3A+DQogICAgICAgIA0KICAgICAgICA8dGFibGUgc3R5bGU9ImJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7IHdpZHRoOiAxMDAlOyBtYXgtd2lkdGg6IDUwMHB4OyBtYXJnaW46IDIwcHggMDsiPg0KICAgICAgICAgICAgPHRyIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiAjZjJmMmYyOyI+DQogICAgICAgICAgICAgICAgPHRoIHN0eWxlPSJib3JkZXI6IDFweCBzb2xpZCAjZGRkZGRkOyB0ZXh0LWFsaWduOiBsZWZ0OyBwYWRkaW5nOiA4cHg7IHdpZHRoOiA0MCU7Ij5EZXRhaWwgUmVzb3VyY2U8L3RoPg0KICAgICAgICAgICAgICAgIDx0aCBzdHlsZT0iYm9yZGVyOiAxcHggc29saWQgI2RkZGRkZDsgdGV4dC1hbGlnbjogbGVmdDsgcGFkZGluZzogOHB4OyI+VGFyZ2V0IFZhbHVlPC90aD4NCiAgICAgICAgICAgIDwvdHI+DQogICAgICAgICAgICA8dHI+DQogICAgICAgICAgICAgICAgPHRkIHN0eWxlPSJib3JkZXI6IDFweCBzb2xpZCAjZGRkZGRkOyBwYWRkaW5nOiA4cHg7IGZvbnQtd2VpZ2h0OiBib2xkOyI+VXNlciBQcmluY2lwYWwgTmFtZTo8L3RkPg0KICAgICAgICAgICAgICAgIDx0ZCBzdHlsZT0iYm9yZGVyOiAxcHggc29saWQgI2RkZGRkZDsgdGV4dC1hbGlnbjogbGVmdDsgcGFkZGluZzogOHB4OyBjb2xvcjogIzAwNzhkNDsiPiRVc2VyUHJpbmNpcGFsPC90ZD4NCiAgICAgICAgICAgIDwvdHI+DQogICAgICAgICAgICA8dHI+DQogICAgICAgICAgICAgICAgPHRkIHN0eWxlPSJib3JkZXI6IDFweCBzb2xpZCAjZGRkZGRkOyBwYWRkaW5nOiA4cHg7IGZvbnQtd2VpZ2h0OiBib2xkOyI+VGVtcG9yYXJ5IFBhc3N3b3JkOjwvdGQ+DQogICAgICAgICAgICAgICAgPHRkIHN0eWxlPSJib3JkZXI6IDFweCBzb2xpZCAjZGRkZGRkOyBwYWRkaW5nOiA4cHg7IGZvbnQtZmFtaWx5OiBDb25zb2xhcywgbW9ub3NwYWNlOyBiYWNrZ3JvdW5kLWNvbG9yOiAjZmFmYWZhOyI+JFJhbmRvbVBhc3N3b3JkPC90ZD4NCiAgICAgICAgICAgIDwvdHI+DQogICAgICAgICAgICA8dHI+DQogICAgICAgICAgICAgICAgPHRkIHN0eWxlPSJib3JkZXI6IDFweCBzb2xpZCAjZGRkZGRkOyBwYWRkaW5nOiA4cHg7IGZvbnQtd2VpZ2h0OiBib2xkOyI+QXNzaWduZWQgTGljZW5zZSBQbGFuOjwvdGQ+DQogICAgICAgICAgICAgICAgPHRkIHN0eWxlPSJib3JkZXI6IDFweCBzb2xpZCAjZGRkZGRkOyBwYWRkaW5nOiA4cHg7Ij5NMzY1IEJ1c2luZXNzIFByZW1pdW0gKFNQQiBCdW5kbGUpPC90ZD4NCiAgICAgICAgICAgIDwvdHI+DQogICAgICAgIDwvdGFibGU+DQKDQogICAgICAgIDxwIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmOWU2OyBib3JkZXItbGVmdDogNHB4IHNvbGlkICNmZmNjMDA7IHBhZGRpbmc6IDEwcHg7IG1heC13aWR0aDogNTAwcHg7Ij4NCiAgICAgICAgICAgIDxzdHJvbmc+TUZBIFdhcm5pbmc6PC9zdHJvbmc+IENvbmRpdGlvbmFsIEFjY2VzcyBQb2xpY2llcyBhcmUgYWN0aXZlIGZvciB0aGlzIGFjY291bnQuIFRoZSB1c2VyIHdpbGwgYmUgcmVxdWVzdGVkIHRvIGVucm9sbCBhbiBhdXRoZW50aWNhdG9yIG1ldGhvZCBhbmQgY3ljbGUgdGhlaXIgcGFzc3dvcmQgaW1tZWRpYXRlbHkgdXBvbiB0aGVpciBmaXJzdCBhdXRoZW50aWNhdG9yIGldmVudC4NCiAgICAgICAgPC9wPg0KICAgICAgICANCiAgICAgICAgPHA+UmVnYXJkcyw8YnI+SVQgSWRlbnRpdHkgUHJvdmlzaW9uaW5nIFN5c3RlbSw8L3A+DQogICAgPC9ib2R5Pg0KICAgIDwvaHRtbD4NCiJANCg0KICAgICRNYWlsUGFyYW1ldGVycyA9IEB7DQogICAgICAgIFVzZXJJZCA9ICRBZG1pbkVtYWlsDQogICAgICAgIE1lc3NhZ2UgPSBAew0KICAgICAgICAgICAgU3ViamVjdCA9ICJBY2NvdW50IFJlYWR5OiAkRGlzcGxheU5hbWUgKCRVc2VyUHJpbmNpcGFsKSINCiAgICAgICAgICAgIEJvZHkgPSBAew0KICAgICAgICAgICAgICAgIENvbnRlbnRUeXBlID0gIkh0bWwiDQogICAgICAgICAgICAgICAgQ29udGVudCAgICAgPSAkRW1haWxCb2R5DQogICAgICAgICAgICB9DQogICAgICAgICAgICBUb1JlY2lwaWVudHMgPSBAKA0KICAgICAgICAgICAgICAgIEB7IEVtYWlsQWRkcmVzcyA9IEB7IEFkZHJlc3MgPSAkTWFuYWdlckVtYWlsIH0gfQ0KICAgICAgICAgICAgKQ0KICAgICAgICB9DQogICAgfQ0KDQogICAgV3JpdGUtSG9zdCAiVHJhbnNtaXR0aW5nIGNyZWRlbnRpYWwgZGlzcGF0Y2ggdmlhIEdyYXBoIE1haWwgRW5naW5lLi4uIiAtRm9yZWdyb3VuZENvbG9yIEN5YW4NCiAgICBTZW5kLU1nVXNlck1haWwgQE1haWxQYXJhbWV0ZXJzIC1FcnJvckFjdGlvbiBTdG9wDQogICAgV3JpdGUtSG9zdCAiU3VjY2VzcyEgTm90aWZpY2F0aW9uIHNlbnQgc2FmZWx5IHRvICRNYW5hZ2VyRW1haWwuIiAtRm9yZWdyb3VuZENvbG9yIEdyZWVuDQoNCiAgICBXcml0ZS1Ib3N0ICJgbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0iIC1Gb3JlZ3JvdW5kQ29sb3IgR3JlZW4NCiAgICBXcml0ZS1Ib3N0ICIgQ09NUExFVEU6IEF1dG9tYXRlZCBwcm92aXNpb25pbmcgZXhlY3V0aW9uIGVuZGVkIHN1Y2Nlc3NmdWxseSEiIC1Gb3JlZ3JvdW5kQ29sb3IgR3JlZW4NCiAgICBXcml0ZS1Ib3N0ICI9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09YG4iIC1Gb3JlZ3JvdW5kQ29sb3IgR3JlZW4NCg0KDQp9DQpjYXRjaCB7DQogICAgJFJldHVybiA9ICJba2V5d29yZF0iOw0KICAgIFdyaXRlLUhvc3QgImBuIFtDUklUSUNBTCBFUlJPUl0gVXNlciBhbHJlYWR5IGV4aXN0cy4iIC1Gb3JlZ3JvdW5kQ29sb3IgUmVkDQp9DQpmaW5hbGx5IHsNCiAgICBEaXNjb25uZWN0LU1nR3JhcGggLUVycm9yQWN0aW9uIFNpbGVudGx5Q29udGludWUgfCBPdXQtTnVsbA0KICAgIERpc2Nvbm5lY3QtRXhjaGFuZ2VPbmxpbmUgLUNvbmZpcm06JGZhbHNlIC1FcnJvckFjdGlvbiBTaWxlbnRseUNvbnRpbnVlIHwgT3V0LU51bGwNCn0="
        },
        "Create-User.ps1": {
            description: "Imports user accounts from a local CSV template and batch provisions them to Microsoft Entra/M365 using Microsoft Graph PowerShell API cmdlets, dynamically resolving manager relations.",
            requiredModules: ["Microsoft.Graph.Users"],
            content: "IyAtLS0gQ29uZmlndXJhdGlvbiAtLS0NCiRUZW5hbnREb21haW4gPSAibWlsbGlvbm1vdmVzMjYub25taWNyb3NvZnQuY29tIg0KJENzdlBhdGggICAgICA9ICIuXHVzZXJzLmNzdiINCg0KIyAtLS0gQ29ubmVjdCB0byBNaWNyb3NvZnQgR3JhcGggLS0tDQpXcml0ZS1Ib3N0ICJDb25uZWN0aW5nIHRvIE1pY3Jvc29mdCBHcmFwaC4uLiIgLUZvcmVncm91bmRDb2xvciBDeWFuDQpDb25uZWN0LU1nR3JhcGggLVNjb3BlcyAiVXNlci5SZWFkV3JpdGUuQWxsIiwgIlVzZXIuUmVhZC5BbGwiIC1Vc2VEZXZpY2VBdXRoZW50aWNhdGlvbg0KDQojIC0tLSBJbXBvcnQgQ1NWIC0tLQ0KJFVzZXJzID0gSW1wb3J0LUNzdiAkQ3N2UGF0aA0KDQpmb3JlYWNoICgkUm93IGluICRVc2Vycykgew0KICAgICRVUE4gPSAiJCgkUm93LkZpcnN0TmFtZSkuJCgkUm93Lkxhc3ROYW1lKUAkVGVuYW50RG9tYWluIi5Ub0xvd2VyKCkNCiAgICBXcml0ZS1Ib3N0ICJgbi0tLSBQcm9jZXNzaW5nOiAkVVBOIC0tLSIgLUZvcmVncm91bmRDb2xvciBDeWFuDQoNCiAgICAkRXhpc3RpbmdVc2VyID0gR2V0LU1nVXNlciAtVXNlcklkICRVUE4gLUVycm9yQWN0aW9uIFNpbGVudGx5Q29udGludWUNCiAgICANCiAgICBpZiAoJEV4aXN0aW5nVXNlcikgew0KICAgICAgICBXcml0ZS1Ib3N0ICIgW1NLSVBdIFVzZXIgJyRVUE4nIGFscmVhZHkgZXhpc3RzLiIgLUZvcmVncm91bmRDb2xvciBZZWxsb3cNCiAgICAgICAgJE5ld1VzZXIgPSAkRXhpc3RpbmdVc2VyDQogICAgfSBlbHNlIHsNCiAgICAgICAgJFVzZXJQYXJhbXMgPSBAew0KICAgICAgICAgICAgRGlzcGxheU5hbWUgICAgICAgPSAiJCgkUm93LkZpcnN0TmFtZSkgJCgkUm93Lkxhc3ROYW1lKSINCiAgICAgICAgICAgIEdpdmVuTmFtZSAgICAgICAgID0gJFJvdy5GaXJzdE5hbWUNCiAgICAgICAgICAgIFN1cm5hbWUgICAgICAgICAgID0gJFJvdy5MYXN0TmFtZQ0KICAgICAgICAgICAgVXNlclByaW5jaXBhbE5hbWUgPSAkVVBODQogICAgICAgICAgICBNYWlsTmlja25hbWUgICAgICA9ICIkKCRSb3cuRmlyc3ROYW1lKS4kKCRSb3cuTGFzdE5hbWUpIi5Ub0xvd2VyKCkNCiAgICAgICAgICAgIFVzYWdlTG9jYXRpb24gICAgID0gJFJvdy5Vc2FnZUxvY2F0aW9uDQogICAgICAgICAgICBKb2JUaXRsZSAgICAgICAgICA9ICRSb3cuSm9iVGl0bGUNCiAgICAgICAgICAgIERlcGFydG1lbnQgICAgICAgID0gJFJvdy5EZXBhcnRtZW50DQogICAgICAgICAgICBBY2NvdW50RW5hYmxlZCAgICA9ICR0cnVlDQogICAgICAgICAgICBQYXNzd29yZFByb2ZpbGUgICA9IEB7DQogICAgICAgICAgICAgICAgUGFzc3dvcmQgICAgICAgICAgICAgICAgICAgICAgPSAiU2VjdXJlUGFzc3dvcmQxMjMhIg0KICAgICAgICAgICAgICAgIEZvcmNlQ2hhbmdlUGFzc3dvcmROZXh0U2lnbkluID0gJHRydWUNCiAgICAgICAgICAgIH0NCiAgICAgICAgfQ0KDQogICAgICAgIHRyeSB7DQogICAgICAgICAgICAkTmV3VXNlciA9IE5ldy1NZ1VzZXIgQFVzZXJQYXJhbXMNCiAgICAgICAgICAgIFdyaXRlLUhvc3QgIiBbU1VDQ0VTU10gQ3JlYXRlZCB1c2VyOiAkVVBOIiAtRm9yZWdyb3VuZENvbG9yIEdyZWVuDQogICAgICAgIH0NCiAgICAgICAgY2F0Y2ggew0KICAgICAgICAgICAgJEVycm9yTWVzc2FnZSA9ICRfLkV4Y2VwdGlvbi5NZXNzYWdlDQogICAgICAgICAgICBXcml0ZS1FcnJvciAiIFtFUlJPUl0gRmFpbGVkIHRvIGNyZWF0ZSAnJFVQTic6ICRFcnJvck1lc3NhZ2UiDQogICAgICAgICAgICBjb250aW51ZSANCiAgICAgICAgfQ0KICAgIH0NCg0KICAgIGlmICgtbm90IFtzdHJpbmddOjpJc051bGxPcldoaXRlU3BhY2UoJFJvdy5NYW5hZ2VyRW1haWwpKSB7DQogICAgICAgICRNYW5hZ2VyID0gR2V0LU1nVXNlciAtVXNlcklkICRSb3cuTWFuYWdlckVtYWlsIC1FcnJvckFjdGlvbiBTaWxlbnRseUNvbnRpbnVlDQogICAgICAgIA0KICAgICAgICBpZiAoJE1hbmFnZXIgLWFuZCAkTmV3VXNlcikgew0KICAgICAgICAgICAgdHJ5IHsNCiAgICAgICAgICAgICAgICAkTWFuYWdlclBhcmFtcyA9IEB7ICJAb2RhdGEuaWQiID0gImh0dHBzOi8vZ3JhcGgubWljcm9zb2Z0LmNvbS92MS4wL3VzZXJzLyQoJE1hbmFnZXIuSWQpIiB9DQogICAgICAgICAgICAgICAgU2V0LU1nVXNlck1hbmFnZXJCeVJlZiAtVXNlcklkICROZXdVc2VyLklkIC1Cb2R5UGFyYW1ldGVyICRNYW5hZ2VyUGFyYW1zDQogICAgICAgICAgICAgICAgV3JpdGUtSG9zdCAiIFtJTkZPXSBBc3NpZ25lZCBtYW5hZ2VyOiAkKCRSb3cuTWFuYWdlckVtYWlsKSIgLUZvcmVncm91bmRDb2xvciBHcmF5DQogICAgICAgICAgICB9DQogICAgICAgICAgICBjYXRjaCB7DQogICAgICAgICAgICAgICAgIyBGSVhFRDogRXh0cmFjdGluZyB0aGUgZXJyb3IgbWVzc2FnZSB0byBhIHZhcmlhYmxlIGZpcnN0DQogICAgICAgICAgICAgICAgDQogICAgICAgICAgICAgICAgV3JpdGUtV2FybmluZyAiIFtXQVJOXSBGYWlsZWQgdG8gYXNzaWduIG1hbmFnZXIgdG8gJFVQNi4iDQogICAgICAgICAgICB9DQogICAgICAgIH0gZWxzZSB7DQogICAgICAgICAgICBXcml0ZS1XYXJuaW5nICIgW1dBUk5dIENvdWxkIG5vdCBhc3NpZ24gbWFuYWdlci4gQ2hlY2sgaWYgTWFuYWdlciAoJyQoJFJvdy5NYW5hZ2VyRW1haWwpJykgZXhpc3RzLiINCiAgICAgICAgfQ0KICAgIH0NCn0NCg0KRGlzY29ubmVjdC1NZ0dyYXBoDQpXcml0ZS1Ib3N0ICJgbnByb2Nlc3MgQ29tcGxldGUuIiAtRm9yZWdyb3VuZENvbG9yIEdyZWVu"
        },
        "Assign-License.ps1": {
            description: "Connects to Microsoft Graph and assigns the specified Microsoft 365 license SKU. Automatically ensures the target user account has a defined UsageLocation, which is a mandatory prerequisite for Microsoft 365 product assignment.",
            requiredModules: ["Microsoft.Graph.Users"],
            content: "77u/IyAxLiBEZWZpbmUgdmFyaWFibGVzDQokVXNlclVQTiA9ICJhbGljZS5icm93bkBtaWxsaW9ubW92ZXMyNi5vbm1pY3Jvc29mdC5jb20iDQojICRCdXNpbmVzc1N0YW5kYXJkU2t1SWQgPSAiNjQ3MDY4N2UtYTUzMC00ZTc3LThkNTEtNjdhZjA5NDM5MWM1IiAjIFN0YW5kYXJkIFNLVSBmb3IgTTM2NSBCdXNpbmVzcyBTdGFuZGFyZA0KJEJ1c2luZXNzUHJlbWl1bVNrdUlkID0gImNiZGMxNGFiLWQ5NmMtNGMzMC1iOWY0LTZhZGE3Y2RjMWQ0NiIgIyBTdGFuZGFyZCBTS1UgZm9yIE0zNjUgQnVzaW5lc3MgUHJlbWl1bSAoVHJpYWwpDQoNCiMgMi4gQ29ubmVjdCB0byBNaWNyb3NvZnQgR3JhcGgNCiMgTm90ZTogJ0RpcmVjdG9yeS5SZWFkV3JpdGUuQWxsJyBpcyByZXF1aXJlZCB0byBtb2RpZnkgbGljZW5zZXMNCldyaXRlLUhvc3QgIkNvbm5lY3RpbmcgdG8gTWljcm9zb2Z0IEdyYXBoLi4uIiAtRm9yZWdyb3VuZENvbG9yIEN5YW4NCkNvbm5lY3QtTWdHcmFwaCAtU2NvcGVzICJVc2VyLlJlYWQuQWxsIiwgIkRpcmVjdG9yeS5SZWFkV3JpdGUuQWxsIiAtQ29udGV4dFNjb3BlIEN1cnJlbnRVc2VyIC1Vc2VEZXZpY2VBdXRoZW50aWNhdGlvbg0KDQp0cnkgew0KICAgIFdyaXRlLUhvc3QgIkxvb2tpbmcgZm9yIHVzZXI6ICRVc2VyVVBOLi4uIiAtRm9yZWdyb3VuZENvbG9yIEN5YW4NCiAgICAkVXNlciA9IEdldC1NZ1VzZXIgLVVzZXJJZCAkVXNlclVQTiAtRXJyb3JBY3Rpb24gU2lsZW50bHlDb250aW51ZQ0KDQogICAgaWYgKC1ub3QgJFVzZXIpIHsNCiAgICAgICAgV3JpdGUtSG9zdCAiIFtFUlJPUl0gVXNlciAnJFVzZXJVUE4nIG5vdCBmb3VuZC4gQ2Fubm90IGFzc2lnbiBsaWNlbnNlLiIgLUZvcmVncm91bmRDb2xvciBSZWQNCiAgICB9IA0KICAgIGVsc2Ugew0KICAgICAgICAjIDMuIFZlcmlmeSBVc2FnZSBMb2NhdGlvbiAoQ3JpdGljYWwgU3RlcCkNCiAgICAgICAgIyBNMzY1IHdpbGwgcmVqZWN0IGxpY2Vuc2luZyBpZiB0aGUgdXNlciBoYXMgbm8gbG9jYXRpb24gYXNzaWduZWQNCiAgICAgICAgaWYgKFtzdHJpbmddOjpJc051bGxPckVtcHR5KCRVc2VyLlVzYWdlTG9jYXRpb24pKSB7DQogICAgICAgICAgICBXcml0ZS1Ib3N0ICJVc2VyIGhhcyBubyBVc2FnZUxvY2F0aW9uLiBTZXR0aW5nIGl0IHRvICdVUycgdG8gYWxsb3cgbGljZW5zaW5nLi4uIiAtRm9yZWdyb3VuZENvbG9yIFllbGxvdw0KICAgICAgICAgICAgVXBkYXRlLU1nVXNlciAtVXNlcklkICRVc2VyLklkIC1Vc2FnZUxvY2F0aW9uICJVUyINCiAgICAgICAgfQ0KDQogICAgICAgIFdyaXRlLUhvc3QgIkFzc2lnbmluZyBNaWNyb3NvZnQgMzY1IEJ1c2luZXNzIFByZW1pdW0gbGljZW5zZS4uLiIgLUZvcmVncm91bmRDb2xvciBDeWFuDQoNCiAgICAgICAgIyA0LiBDb25zdHJ1Y3QgdGhlIGxpY2Vuc2Ugb2JqZWN0DQogICAgICAgICRMaWNlbnNlT2JqZWN0ID0gQHsNCiAgICAgICAgICAgIEFkZExpY2Vuc2VzID0gQCgNCiAgICAgICAgICAgICAgICBAeyBTa3VJZCA9ICRCdXNpbmVzc1ByZW1pdW1Ta3VJZCB9DQogICAgICAgICAgICApDQogICAgICAgICAgICBSZW1vdmVMaWNlbnNlcyA9IEAoKSAjIFJlcXVpcmVkIGJ5IHRoZSBBUEksIGV2ZW4gaWYgZW1wdHkNCiAgICAgICAgfQ0KDQogICAgICAgICMgNS4gQXBwbHkgdGhlIGxpY2Vuc2UNCiAgICAgICAgU2V0LU1nVXNlckxpY2Vuc2UgLVVzZXJJZCAkVXNlci5JZCAtQm9keVBhcmFtZXRlciAkTGljZW5zZU9iamVjdA0KICAgICAgICANCiAgICAgICAgV3JpdGUtSG9zdCAiU3VjY2VzcyEgQnVzaW5lc3MgUHJlbWl1bSBsaWNlbnNlIGhhcyBiZWVuIGFzc2lnbmVkIHRvICRVc2VyVVBOLiIgLUZvcmVncm91bmRDb2xvciBHcmVlbg0KICAgIH0NCn0NCmNhdGNoIHsNCiAgICBXcml0ZS1FcnJvciAiRmFpbGVkIHRvIGFzc2lnbiBsaWNlbnNlLiBFcnJvcjogJF8iDQp9DQpmaW5hbGx5IHsNCiAgICAjIDMuIENsZWFuIHVwIHNlc3Npb24NCiAgICBEaXNjb25uZWN0LU1nR3JhcGgNCiAgICBXcml0ZS1Ib3N0ICJEaXNjb25uZWN0ZWQgZnJvbSBNaWNyb3NvZnQgR3JhcGguIiAtRm9yZWdyb3VuZENvbG9yIFllbGxvdw0KfQ=="
        },
        "AddTo-DLGroup.ps1": {
            description: "Connects to Exchange Online Shell Core using administrator session credentials and places the user account inside the target Distribution Group list, bypassing manager ownership limits.",
            requiredModules: ["ExchangeOnlineManagement"],
            content: "77u/IyAxLiBEZWZpbmUgVmFyaWFibGVzDQokVXNlclVQTiAgPSAic2FyYWguc21pdGhAbWlsbGlvbm1vdmVzMjYub25taWNyb3NvZnQuY29tIg0KJEdyb3VwTmFtZSA9ICJBbGwgU3RhZmYiDQoNCiMgMi4gQ29ubmVjdCB0byBFeGNoYW5nZSBPbmxpbmUNCg0KV3JpdGUtSG9zdCAiQ2xlYXJpbmcgYWN0aXZlIG1lbW9yeSBzcGFjZXMuLi4iIC1Gb3JlZ3JvdW5kQ29sb3IgQ3lhbg0KRGlzY29ubmVjdC1NZ0dyYXBoIC1FcnJvckFjdGlvbiBTaWxlbnRseUNvbnRpbnVlIHwgT3V0LU51bGwNCkRpc2Nvbm5lY3QtRXhjaGFuZ2VPbmxpbmUgLUNvbmZpcm06JGZhbHNlIC1FcnJvckFjdGlvbiBTaWxlbnRseUNvbnRpbnVlIHwgT3V0LU51bGwNCg0KIyBQb3dlclNoZWxsIDcgaGFuZGxlcyB0aGlzIGNvbm5lY3Rpb24gY2xlYW5seSB3aXRob3V0IG1lc3NpbmcgdXAgeW91ciBHcmFwaCB0b2tlbiBtZW1vcnkNCg0KV3JpdGUtSG9zdCAiQ29ubmVjdGluZyB0byBFeGNoYW5nZSBPbmxpbmUgKFBvd2VyU2hlbGwgNyBNb2RlKS4uLiIgLUZvcmVncm91bmRDb2xvciBDeWFuDQpDb25uZWN0LUV4Y2hhbmdlT25saW5lIC1Vc2VyUHJpbmNpcGFsTmFtZSAiaHBAbWlsbGlvbm1vdmVzMjYub25taWNyb3NvZnQuY29tIg0KDQp0cnkgew0KICAgIFdyaXRlLUhvc3QgIkFkZGluZyAkVXNlclVQTiB0byBEaXN0cmlidXRpb24gTGlzdCAnJEdyb3VwTmFtZScuLi4iIC1Gb3JlZ3JvdW5kQ29sb3IgQ3lhbg0KICAgICMgU3RhbmRhcmQgbW9kZXJuIEV4Y2hhbmdlIGNtZGxldCBhY2NlcHRlZCBuYXRpdmVseSBieSBEaXN0cmlidXRpb24gTGlzdHMNCiAgICBBZGQtRGlzdHJpYnV0aW9uR3JvdXBNZW1iZXIgLUlkZW50aXR5ICRHcm91cE5hbWUgLU1lbWJlciAkVXNlclVQTiAtQnlwYXNzU2VjdXJpdHlHcm91cE1hbmFnZXJDaGVjayAtRXJyb3JBY3Rpb24gU3RvcA0KICAgIA0KICAgIFdyaXRlLUhvc3QgIlN1Y2Nlc3MhICRVc2VyVVBOIGhhcyBiZWVuIG9mZmljaWFsbHkgYWRkZWQgdG8gdGhlICckR3JvdXBOYW1lJyBkaXN0cmlidXRpb24gbGlzdC4iIC1Gb3JlZ3JvdW5kQ29sb3IgR3JlZW4NCn0NCmNhdGNoIHsNCiAgICAjIENsZWFuIGNoZWNrIGluIGNhc2UgdGhlIHVzZXIgd2FzIGFscmVhZHkgYWRkZWQgaW4gYSBwcmV2aW91cyB0ZXN0DQogICAgaWYgKCRfLkV4Y2VwdGlvbi5NZXNzYWdlIC1saWtlICIqYWxyZWFkeSBleGlzdHMqIiAtb3IgJF8uRXhjZXB0aW9uLklubmVyRXhjZXB0aW9uLk1lc3NhZ2UgLWxpa2UgIiphbHJlYWR5IGV4aXN0cyoiKSB7DQogICAgICAgIFdyaXRlLUhvc3QgIiBbU0tJUF0gJFVzZXJVUE4gaXMgYWxyZWFkeSBhIG1lbWJlciBvZiAnJEdyb3VwTmFtZScuIiAtRm9yZWdyb3VuZENvbG9yIFllbGxvdw0KICAgIH0gZWxzZ Tggew0KICAgICAgICBXcml0ZS1FcnJvciAiRmFpbGVkIHRvIGFkZCB1c2VyIHRvIERpc3RyaWJ1dGlvbiBMaXN0LiBFcnJvcjogJF8iDQogICAgfQ0KfQ0KZmluYWxseSB7DQogICAgIyAzLiBEaXNjb25uZWN0IGNsZWFubHkNCiAgICBEaXNjb25uZWN0LUV4Y2hhbmdlT25saW5lIC1Db25maXJtOiRmYWxzZQ0KICAgIFdyaXRlLUhvc3QgIkRpc2Nvbm5lY3RlZCBmcm9tIEV4Y2hhbmdlIE9ubGluZS4iIC1Gb3JlZ3JvdW5kQ29sb3IgWWVsbG93DQp9"
        },
        "users.csv": {
            description: "Structured CSV text config file containing the headers and row items used for creating batch test users with the user onboarding script.",
            requiredModules: [],
            content: "Rmlyc3ROYW1lLExhc3ROYW1lLEpvYlRpdGxlLERlcGFydG1lbnQsVXNhZ2VMb2NhdGlvbixNYW5hZ2VyRW1haWwNClNhcmFoLFNtaXRoLFNvZnR3YXJlIEVuZ2luZWVyLEVuZ2luZWVyaW5nLEFVLGhwQG1pbGxpb25tb3ZlczI2Lm9ubWljcm9zb2Z0LmNvbQ0KSm9obixEb2UsRGV2T3BzIEVuZ2luZWVyLElULEFVLGhwQG1pbGxpb25tb3ZlczI2Lm9ubWljcm9zb2Z0LmNvbQ0KQWxpY2UsQnJvd24sUHJvZHVjdCBNYW5hZ2VyLFByb2R1Y3QsQVUsaHBAbWlsbGlvbm1vdmVzMjYub25taWNyb3NvZnQuY29tDQo="
        }
    };

    function decodeBase64Utf8(str) {
        const binString = atob(str);
        const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
        let decoded = new TextDecoder().decode(bytes);
        if (decoded.charCodeAt(0) === 0xFEFF) {
            decoded = decoded.substring(1);
        }
        return decoded;
    }

    // Attach click events to script sidebar buttons to update URL hash
    scriptNavButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const scriptName = btn.getAttribute('data-script');
            window.location.hash = 'scripts-' + scriptName;
        });
    });

    // Hash-based routing controller
    function handleRouting() {
        const hash = window.location.hash;
        if (!hash) {
            switchTab('guide');
            return;
        }

        if (hash.startsWith('#scripts-')) {
            const scriptName = hash.replace('#scripts-', '');
            if (embeddedScripts[scriptName]) {
                activeScriptName = scriptName;
                switchTab('scripts');
                
                // Update active sidebar button visual state
                scriptNavButtons.forEach(btn => {
                    if (btn.getAttribute('data-script') === scriptName) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
                loadSelectedScript(scriptName);
            }
        } else if (hash === '#scripts') {
            switchTab('scripts');
        } else if (hash === '#guide') {
            switchTab('guide');
        } else {
            // Might be a guide section hash (e.g. #section-create)
            const targetElement = document.querySelector(hash);
            if (targetElement) {
                switchTab('guide');
                
                // Expand card if collapsed
                if (!targetElement.classList.contains('expanded')) {
                    const header = targetElement.querySelector('.card-header');
                    toggleCard(header);
                }
                
                // Scroll to target element
                setTimeout(() => {
                    scrollToSection(targetElement);
                }, 300);
            }
        }
    }

    // Initialize routing and listeners
    window.addEventListener('hashchange', handleRouting);
    handleRouting();

    function loadSelectedScript(scriptName) {
        if (!currentScriptNameEl || !scriptCodeContentEl || !scriptDescriptionCardEl) return;
        
        currentScriptNameEl.textContent = scriptName;
        document.querySelector('.code-viewer-file-icon').textContent = scriptName.endsWith('.csv') ? '📊' : '📄';
        
        // Update Description & Modules
        const scriptData = embeddedScripts[scriptName] || {};
        const desc = scriptData.description || 'No description available.';
        const modules = scriptData.requiredModules || [];
        
        let modulesHtml = '';
        if (modules.length > 0) {
            modulesHtml = `
                <div class="required-modules">
                    <strong>Required Modules:</strong>
                    ${modules.map(mod => `<span class="module-badge">${mod}</span>`).join('')}
                </div>
            `;
        }

        // Show engine badge for all .ps1 scripts
        let engineHtml = '';
        if (scriptName.endsWith('.ps1')) {
            engineHtml = `
                <div class="required-engine">
                    <strong>Required Shell:</strong>
                    <span class="engine-badge">PowerShell 7</span>
                </div>
            `;
        }

        scriptDescriptionCardEl.innerHTML = `
            <h3>About this script</h3>
            <p>${desc}</p>
            ${engineHtml}
            ${modulesHtml}
        `;
        
        // Check cache first
        if (loadedScriptsCache[scriptName]) {
            renderScriptCode(loadedScriptsCache[scriptName], scriptName);
            return;
        }

        // Try to fetch dynamically
        scriptCodeContentEl.textContent = 'Loading script content...';
        const fetchPath = `powershell/${scriptName}`;
        
        fetch(fetchPath)
            .then(res => {
                if (!res.ok) throw new Error(`Could not load script ${scriptName}`);
                return res.text();
            })
            .then(text => {
                // Cache it
                loadedScriptsCache[scriptName] = text;
                renderScriptCode(text, scriptName);
            })
            .catch(err => {
                console.warn(`Dynamic load failed for ${scriptName}, falling back to embedded content. Error:`, err);
                // Fall back to embedded copy
                let fallback = '# Failed to load script.';
                if (embeddedScripts[scriptName]) {
                    try {
                        fallback = decodeBase64Utf8(embeddedScripts[scriptName].content);
                    } catch (e) {
                        fallback = atob(embeddedScripts[scriptName].content);
                    }
                }
                loadedScriptsCache[scriptName] = fallback;
                renderScriptCode(fallback, scriptName);
            });
    }

    function renderScriptCode(codeText, scriptName) {
        scriptCodeContentEl.innerHTML = highlightPowerShell(codeText, scriptName);
    }

    function highlightPowerShell(code, fileName) {
        if (fileName.endsWith('.csv')) {
            const lines = code.split('\n');
            return lines.map((line, idx) => {
                if (idx === 0) return `<span class="csv-header">${escapeHtml(line)}</span>`;
                return `<span class="csv-row">${escapeHtml(line)}</span>`;
            }).join('\n');
        }

        const tokens = [];
        
        // Define regex for all types of tokens in priority order:
        // 1. Comments: #...
        // 2. Double-quoted strings: "..." (handles escaped quotes)
        // 3. Single-quoted strings: '...' (handles escaped quotes)
        // 4. Variables: $var
        // 5. Cmdlets: Verb-Noun (case-insensitive)
        // 6. Keywords: try, catch, finally, foreach, if, else, in, return, continue, break
        const tokenRegex = /(#[^\n]*)|("[^"\\]*(?:\\.[^"\\]*)*")|('[^'\\]*(?:\\.[^'\\]*)*')|(\$[a-zA-Z0-9_]+)|(\b[a-zA-Z]+-[a-zA-Z0-9_]+\b)|(\b(?:try|catch|finally|foreach|if|else|in|return|continue|break)\b)/g;

        let processed = code.replace(tokenRegex, (match, comment, dstr, sstr, variable, cmdlet, keyword) => {
            let htmlClass = '';
            let content = match;

            if (comment !== undefined) {
                htmlClass = 'pl-comment';
            } else if (dstr !== undefined || sstr !== undefined) {
                htmlClass = 'pl-string';
            } else if (variable !== undefined) {
                htmlClass = 'pl-variable';
            } else if (cmdlet !== undefined) {
                htmlClass = 'pl-cmdlet';
            } else if (keyword !== undefined) {
                htmlClass = 'pl-keyword';
            }

            const tokenIndex = tokens.length;
            const escapedContent = escapeHtml(content);
            tokens.push(`<span class="${htmlClass}">${escapedContent}</span>`);
            
            return `___PS_HIGHLIGHT_TOKEN_${tokenIndex}___`;
        });

        // Now HTML-escape the remaining text (preserving our placeholders)
        let html = escapeHtml(processed);

        // Replace the placeholders back with the HTML-wrapped syntax elements
        for (let i = 0; i < tokens.length; i++) {
            html = html.replace(`___PS_HIGHLIGHT_TOKEN_${i}___`, tokens[i]);
        }

        return html;
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Attach Copy script button handler
    if (copyScriptBtn) {
        copyScriptBtn.addEventListener('click', () => {
            let codeToCopy = loadedScriptsCache[activeScriptName];
            if (!codeToCopy && embeddedScripts[activeScriptName]) {
                try {
                    codeToCopy = decodeBase64Utf8(embeddedScripts[activeScriptName].content);
                } catch (e) {
                    codeToCopy = atob(embeddedScripts[activeScriptName].content);
                }
            }
            if (!codeToCopy) return;

            navigator.clipboard.writeText(codeToCopy).then(() => {
                const originalContent = copyScriptBtn.innerHTML;
                copyScriptBtn.classList.add('copied');
                copyScriptBtn.innerHTML = `
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>Copied!</span>
                `;
                
                setTimeout(() => {
                    copyScriptBtn.classList.remove('copied');
                    copyScriptBtn.innerHTML = originalContent;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy script: ', err);
            });
        });
    }

});
