/**
 * CLAIRVIBE ADMIN STUDIO — CORE JAVASCRIPT
 * Full visual management, image replacement with live previews, GitHub 1-click sync.
 */

(function () {
  'use strict';

  // Config
  const GITHUB_REPO_OWNER = 'websitebuilder7777-bit';
  const GITHUB_REPO_NAME = 'clairvibe';
  const GITHUB_BRANCH = 'main';
  const CONTENT_JSON_PATH = 'data/content.json';

  // State
  let siteData = {};
  let originalData = {};
  let pendingUploads = {}; // Key: target path or ref -> base64 data
  let isDirty = false;

  // DOM Elements
  const tabButtons = document.querySelectorAll('.nav-item[data-tab]');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const btnPublish = document.getElementById('btnPublish');
  const btnExport = document.getElementById('btnExport');
  const btnReset = document.getElementById('btnReset');
  const btnGithubSettings = document.getElementById('btnGithubSettings');
  const githubStatusChip = document.getElementById('githubStatusChip');
  const tokenModal = document.getElementById('tokenModal');
  const tokenModalClose = document.getElementById('tokenModalClose');
  const btnSaveToken = document.getElementById('btnSaveToken');
  const inputGithubToken = document.getElementById('inputGithubToken');
  const imageReplaceModal = document.getElementById('imageReplaceModal');
  const imageReplaceModalClose = document.getElementById('imageReplaceModalClose');
  const toastContainer = document.getElementById('toastContainer');

  // Replace Modal State
  let currentReplaceTarget = null; // { type: 'hero'|'about'|'cover'|'gallery_item', category?: 'machines'|'food'|'corporate', index?: number }
  let tempReplacementData = null; // { previewUrl, file, path }

  /* ─────────────────────────────────────────────────────────────
     INIT & DATA FETCHING
     ───────────────────────────────────────────────────────────── */
  async function init() {
    setupTabNavigation();
    setupGithubToken();
    setupGlobalActions();
    setupReplaceModal();
    await loadInitialData();
    renderAllSections();
  }

  async function loadInitialData() {
    try {
      // 1. Try local data/content.json
      const res = await fetch('../data/content.json?v=' + Date.now());
      if (res.ok) {
        siteData = await res.json();
        originalData = JSON.parse(JSON.stringify(siteData));
        showToast('Site content loaded successfully', 'success');
        return;
      }
    } catch (e) {
      console.warn('Could not load local data/content.json:', e);
    }

    // Fallback template data
    siteData = {
      hero: {
        video: 'website.mp4',
        button_text: 'Start Your Event',
        button_link: '#contact'
      },
      portfolio: {
        header_label: 'Our Portfolio',
        header_title: 'Crafted With Passion',
        header_desc: "A glimpse into the experiences we've brought to life — every detail, every emotion, every moment.",
        machines: {
          title: 'Heavy Machinery & Stage Rigs',
          cover: 'machines/M.png',
          images: ['machines/M.png', 'machines/M2.png']
        },
        food: {
          title: 'Food & FMCG',
          cover: 'food and fmcg/F.png',
          images: [
            'food and fmcg/F.png', 'food and fmcg/F1.png', 'food and fmcg/F2.png',
            'food and fmcg/F3.png', 'food and fmcg/F4.png', 'food and fmcg/F5.png',
            'food and fmcg/F6.png', 'food and fmcg/F7.png', 'food and fmcg/F8.png',
            'food and fmcg/F9.png'
          ]
        },
        corporate: {
          title: 'Corporate & Brand Summits',
          cover: 'coorporate/C.png',
          images: ['coorporate/C.png', 'coorporate/C2.png', 'coorporate/C3.png']
        }
      },
      about: {
        label: 'Who We Are',
        title: 'We Design Moments That Last a Lifetime',
        paragraph1: 'ClairVibe is a full-service event management company setting the standard for premium experiential design.',
        paragraph2: 'Our team of seasoned creatives, planners, and producers work in harmony to bring your unique story to life.',
        image: 'machines/M2.png',
        stats: [
          { count: 150, label: 'Events Delivered' },
          { count: 50, label: 'Happy Clients' },
          { count: 8, label: 'Years of Craft' }
        ]
      },
      contact: {
        label: 'Get In Touch',
        title: "Let's Create Something Remarkable",
        description: "Ready to start planning your next event? Reach out and let's bring your vision to life.",
        email: 'hello@clairvibe.com',
        phone: '+91 98765 43210',
        location: 'Mumbai, India',
        socials: {
          instagram: '#',
          facebook: '#',
          linkedin: '#'
        },
        footer_copy: '© 2026 ClairVibe. All rights reserved.'
      }
    };
    originalData = JSON.parse(JSON.stringify(siteData));
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER ALL EDITABLE SECTIONS
     ───────────────────────────────────────────────────────────── */
  function renderAllSections() {
    renderHeroSection();
    renderGallerySection('machines');
    renderGallerySection('food');
    renderGallerySection('corporate');
    renderAboutSection();
    renderContactSection();
    updateLivePreview();
  }

  /* ── 1. Hero Section ── */
  function renderHeroSection() {
    const hero = siteData.hero || {};
    const inputVideo = document.getElementById('heroVideoInput');
    const inputBtnText = document.getElementById('heroBtnTextInput');
    const inputBtnLink = document.getElementById('heroBtnLinkInput');
    const videoPreview = document.getElementById('heroVideoPreview');

    if (inputVideo) inputVideo.value = hero.video || '';
    if (inputBtnText) inputBtnText.value = hero.button_text || '';
    if (inputBtnLink) inputBtnLink.value = hero.button_link || '';

    if (videoPreview && hero.video) {
      const src = pendingUploads[hero.video] || '../' + hero.video;
      videoPreview.src = src;
    }

    // Bind inputs
    if (inputVideo) {
      inputVideo.oninput = (e) => {
        hero.video = e.target.value.trim();
        if (videoPreview) videoPreview.src = hero.video.startsWith('data:') ? hero.video : '../' + hero.video;
        markDirty();
      };
    }
    if (inputBtnText) {
      inputBtnText.oninput = (e) => {
        hero.button_text = e.target.value;
        markDirty();
      };
    }
    if (inputBtnLink) {
      inputBtnLink.oninput = (e) => {
        hero.button_link = e.target.value;
        markDirty();
      };
    }

    // Hero Video File Drop
    const dropzone = document.getElementById('heroVideoDropzone');
    const fileInput = document.getElementById('heroVideoFileInput');
    if (dropzone && fileInput) {
      setupDropzone(dropzone, fileInput, (file, base64) => {
        const path = 'uploads/' + sanitizeFilename(file.name);
        pendingUploads[path] = base64;
        hero.video = path;
        inputVideo.value = path;
        if (videoPreview) videoPreview.src = base64;
        markDirty();
        showToast('Hero video replacement ready', 'success');
      });
    }
  }

  /* ── 2. Gallery Sections (Machines / Food / Corporate) ── */
  function renderGallerySection(catKey) {
    const port = siteData.portfolio || {};
    const cat = port[catKey] || { title: '', cover: '', images: [] };

    // Section title input
    const titleInput = document.getElementById(`galTitle_${catKey}`);
    if (titleInput) {
      titleInput.value = cat.title || '';
      titleInput.oninput = (e) => {
        cat.title = e.target.value;
        markDirty();
      };
    }

    // Cover Image Slot
    const coverSlot = document.getElementById(`galCoverSlot_${catKey}`);
    if (coverSlot) {
      const coverSrc = pendingUploads[cat.cover] || (cat.cover?.startsWith('data:') ? cat.cover : '../' + cat.cover);
      coverSlot.innerHTML = `
        <div class="media-side">
          <div class="media-side-label">
            <span>Current Card Cover</span>
            <span class="badge-current">Live on Site</span>
          </div>
          <div class="media-preview-container">
            <img src="${coverSrc}" alt="${cat.title} Cover" onerror="this.src='https://placehold.co/600x400/15154A/F5A623?text=No+Cover'">
          </div>
        </div>
        <div class="media-side">
          <div class="media-side-label">
            <span>Replace Cover Image</span>
          </div>
          <div class="file-dropzone" id="dropzone_cover_${catKey}">
            <input type="file" accept="image/*" id="file_cover_${catKey}">
            <div class="dropzone-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div class="dropzone-title">Click or Drop New Cover Image</div>
              <div class="dropzone-subtitle">JPG, PNG, WebP (Instant Preview)</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn_modal_cover_${catKey}" style="margin-top:0.5rem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Compare & Replace with Live Preview
          </button>
        </div>
      `;

      // Setup dropzone for cover
      const dz = document.getElementById(`dropzone_cover_${catKey}`);
      const fi = document.getElementById(`file_cover_${catKey}`);
      if (dz && fi) {
        setupDropzone(dz, fi, (file, base64) => {
          const path = `uploads/${catKey}_cover_${Date.now()}_${sanitizeFilename(file.name)}`;
          pendingUploads[path] = base64;
          cat.cover = path;
          renderGallerySection(catKey);
          markDirty();
          showToast(`Cover image for ${cat.title} updated!`, 'success');
        });
      }

      const modalBtn = document.getElementById(`btn_modal_cover_${catKey}`);
      if (modalBtn) {
        modalBtn.onclick = () => {
          openReplaceModal({
            title: `Replace Cover — ${cat.title}`,
            currentImage: cat.cover,
            onConfirm: (newPath, base64) => {
              if (base64) pendingUploads[newPath] = base64;
              cat.cover = newPath;
              renderGallerySection(catKey);
              markDirty();
            }
          });
        };
      }
    }

    // Grid of all gallery images
    const gridEl = document.getElementById(`galGrid_${catKey}`);
    const countBadge = document.getElementById(`galCount_${catKey}`);
    if (countBadge) countBadge.textContent = `${cat.images.length} Photos`;

    if (gridEl) {
      gridEl.innerHTML = '';

      cat.images.forEach((imgPath, idx) => {
        const imgSrc = pendingUploads[imgPath] || (imgPath.startsWith('data:') ? imgPath : '../' + imgPath);
        const card = document.createElement('div');
        card.className = 'gallery-item-card';
        card.innerHTML = `
          <div class="gallery-item-thumb">
            <span class="gallery-item-index">#${String(idx + 1).padStart(2, '0')}</span>
            <img src="${imgSrc}" alt="Gallery item ${idx + 1}" onerror="this.src='https://placehold.co/400x300/15154A/F5A623?text=Image+Missing'">
          </div>
          <div class="gallery-item-body">
            <span class="gallery-item-path" title="${imgPath}">${imgPath.split('/').pop()}</span>
            <div class="gallery-item-actions">
              <button class="btn-icon" title="Replace this Image" data-replace-idx="${idx}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn-icon btn-icon-danger" title="Delete Image" data-delete-idx="${idx}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
          </div>
        `;

        // Bind replace button
        card.querySelector('[data-replace-idx]').onclick = () => {
          openReplaceModal({
            title: `Replace Image #${idx + 1} — ${cat.title}`,
            currentImage: imgPath,
            onConfirm: (newPath, base64) => {
              if (base64) pendingUploads[newPath] = base64;
              cat.images[idx] = newPath;
              renderGallerySection(catKey);
              markDirty();
              showToast(`Image #${idx + 1} replaced successfully`, 'success');
            }
          });
        };

        // Bind delete button
        card.querySelector('[data-delete-idx]').onclick = () => {
          if (confirm(`Remove image #${idx + 1} (${imgPath.split('/').pop()}) from ${cat.title}?`)) {
            cat.images.splice(idx, 1);
            renderGallerySection(catKey);
            markDirty();
            showToast('Image removed from gallery', 'success');
          }
        };

        gridEl.appendChild(card);
      });

      // Append "+ Add New Image" Card
      const addCard = document.createElement('div');
      addCard.className = 'add-item-card';
      addCard.innerHTML = `
        <div class="add-item-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <div style="font-weight:600;font-size:0.95rem">Add New Photo</div>
        <div style="font-size:0.75rem;color:var(--white-mute)">Upload or select image to add to this gallery</div>
        <input type="file" accept="image/*" style="display:none" id="file_add_${catKey}">
      `;

      const addFileInput = addCard.querySelector(`#file_add_${catKey}`);
      addCard.onclick = () => addFileInput.click();

      addFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          fileToBase64(file).then(base64 => {
            const path = `uploads/${catKey}_${Date.now()}_${sanitizeFilename(file.name)}`;
            pendingUploads[path] = base64;
            cat.images.push(path);
            renderGallerySection(catKey);
            markDirty();
            showToast(`Added new photo to ${cat.title}!`, 'success');
          });
        }
      };

      gridEl.appendChild(addCard);
    }
  }

  /* ── 3. About Section ── */
  function renderAboutSection() {
    const about = siteData.about || {};
    const inputLabel = document.getElementById('aboutLabelInput');
    const inputTitle = document.getElementById('aboutTitleInput');
    const inputP1 = document.getElementById('aboutP1Input');
    const inputP2 = document.getElementById('aboutP2Input');

    if (inputLabel) {
      inputLabel.value = about.label || '';
      inputLabel.oninput = (e) => { about.label = e.target.value; markDirty(); };
    }
    if (inputTitle) {
      inputTitle.value = about.title || '';
      inputTitle.oninput = (e) => { about.title = e.target.value; markDirty(); };
    }
    if (inputP1) {
      inputP1.value = about.paragraph1 || '';
      inputP1.oninput = (e) => { about.paragraph1 = e.target.value; markDirty(); };
    }
    if (inputP2) {
      inputP2.value = about.paragraph2 || '';
      inputP2.oninput = (e) => { about.paragraph2 = e.target.value; markDirty(); };
    }

    // Stats
    const stats = about.stats || [];
    [0, 1, 2].forEach(i => {
      const numInput = document.getElementById(`statCount_${i}`);
      const labelInput = document.getElementById(`statLabel_${i}`);
      if (stats[i]) {
        if (numInput) {
          numInput.value = stats[i].count || 0;
          numInput.oninput = (e) => { stats[i].count = parseInt(e.target.value) || 0; markDirty(); };
        }
        if (labelInput) {
          labelInput.value = stats[i].label || '';
          labelInput.oninput = (e) => { stats[i].label = e.target.value; markDirty(); };
        }
      }
    });

    // About Image Slot
    const aboutImgSlot = document.getElementById('aboutImageSlot');
    if (aboutImgSlot) {
      const imgSrc = pendingUploads[about.image] || (about.image?.startsWith('data:') ? about.image : '../' + about.image);
      aboutImgSlot.innerHTML = `
        <div class="media-side">
          <div class="media-side-label">
            <span>Current Image</span>
            <span class="badge-current">Live on Site</span>
          </div>
          <div class="media-preview-container">
            <img src="${imgSrc}" alt="About Section Image" onerror="this.src='https://placehold.co/600x400/15154A/F5A623?text=About+Image'">
          </div>
        </div>
        <div class="media-side">
          <div class="media-side-label">
            <span>Replace About Photo</span>
          </div>
          <div class="file-dropzone" id="dropzone_about_img">
            <input type="file" accept="image/*" id="file_about_img">
            <div class="dropzone-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div class="dropzone-title">Click or Drop Replacement Image</div>
              <div class="dropzone-subtitle">JPG, PNG, WebP</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn_modal_about_img" style="margin-top:0.5rem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Compare & Replace with Live Preview
          </button>
        </div>
      `;

      const dz = document.getElementById('dropzone_about_img');
      const fi = document.getElementById('file_about_img');
      if (dz && fi) {
        setupDropzone(dz, fi, (file, base64) => {
          const path = `uploads/about_${Date.now()}_${sanitizeFilename(file.name)}`;
          pendingUploads[path] = base64;
          about.image = path;
          renderAboutSection();
          markDirty();
          showToast('About image updated!', 'success');
        });
      }

      const modalBtn = document.getElementById('btn_modal_about_img');
      if (modalBtn) {
        modalBtn.onclick = () => {
          openReplaceModal({
            title: 'Replace About Section Photo',
            currentImage: about.image,
            onConfirm: (newPath, base64) => {
              if (base64) pendingUploads[newPath] = base64;
              about.image = newPath;
              renderAboutSection();
              markDirty();
            }
          });
        };
      }
    }
  }

  /* ── 4. Contact & Socials Section ── */
  function renderContactSection() {
    const contact = siteData.contact || {};
    const inputEmail = document.getElementById('contactEmailInput');
    const inputPhone = document.getElementById('contactPhoneInput');
    const inputLocation = document.getElementById('contactLocationInput');
    const inputInsta = document.getElementById('contactInstaInput');
    const inputFb = document.getElementById('contactFbInput');
    const inputLi = document.getElementById('contactLiInput');
    const inputFooter = document.getElementById('contactFooterInput');

    if (inputEmail) {
      inputEmail.value = contact.email || '';
      inputEmail.oninput = (e) => { contact.email = e.target.value; markDirty(); };
    }
    if (inputPhone) {
      inputPhone.value = contact.phone || '';
      inputPhone.oninput = (e) => { contact.phone = e.target.value; markDirty(); };
    }
    if (inputLocation) {
      inputLocation.value = contact.location || '';
      inputLocation.oninput = (e) => { contact.location = e.target.value; markDirty(); };
    }

    const socials = contact.socials || {};
    if (inputInsta) {
      inputInsta.value = socials.instagram || '';
      inputInsta.oninput = (e) => { socials.instagram = e.target.value; markDirty(); };
    }
    if (inputFb) {
      inputFb.value = socials.facebook || '';
      inputFb.oninput = (e) => { socials.facebook = e.target.value; markDirty(); };
    }
    if (inputLi) {
      inputLi.value = socials.linkedin || '';
      inputLi.oninput = (e) => { socials.linkedin = e.target.value; markDirty(); };
    }
    if (inputFooter) {
      inputFooter.value = contact.footer_copy || '';
      inputFooter.oninput = (e) => { contact.footer_copy = e.target.value; markDirty(); };
    }
  }

  /* ─────────────────────────────────────────────────────────────
     INTERACTIVE LIVE PREVIEW
     ───────────────────────────────────────────────────────────── */
  function updateLivePreview() {
    try {
      sessionStorage.setItem('clairvibe_preview_data', JSON.stringify(siteData));
      const iframe = document.getElementById('previewIframe');
      if (iframe && iframe.contentWindow) {
        // Send message to reload preview or refresh iframe src
        iframe.src = '../index.html?preview=' + Date.now();
      }
    } catch (e) {
      console.warn('Preview update error:', e);
    }
  }

  /* ─────────────────────────────────────────────────────────────
     VISUAL IMAGE REPLACEMENT MODAL (Side-by-Side Comparison)
     ───────────────────────────────────────────────────────────── */
  function setupReplaceModal() {
    if (imageReplaceModalClose) {
      imageReplaceModalClose.onclick = closeReplaceModal;
    }
    const cancelBtn = document.getElementById('btnCancelReplace');
    if (cancelBtn) cancelBtn.onclick = closeReplaceModal;
  }

  function openReplaceModal({ title, currentImage, onConfirm }) {
    const modalTitle = document.getElementById('replaceModalTitle');
    const currentImgEl = document.getElementById('replaceModalCurrentImg');
    const newImgEl = document.getElementById('replaceModalNewImg');
    const placeholder = document.getElementById('replaceModalPlaceholder');
    const fileInput = document.getElementById('replaceModalFileInput');
    const pathInput = document.getElementById('replaceModalPathInput');
    const confirmBtn = document.getElementById('btnConfirmReplace');

    if (modalTitle) modalTitle.textContent = title || 'Replace Image';

    const currentSrc = pendingUploads[currentImage] || (currentImage?.startsWith('data:') ? currentImage : '../' + currentImage);
    if (currentImgEl) currentImgEl.src = currentSrc;

    // Reset replacement state
    tempReplacementData = null;
    if (newImgEl) {
      newImgEl.style.display = 'none';
      newImgEl.src = '';
    }
    if (placeholder) placeholder.style.display = 'flex';
    if (pathInput) pathInput.value = '';
    if (confirmBtn) confirmBtn.disabled = true;

    // File input handler
    if (fileInput) {
      fileInput.value = '';
      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const base64 = await fileToBase64(file);
          const genPath = `uploads/${Date.now()}_${sanitizeFilename(file.name)}`;
          tempReplacementData = {
            previewUrl: base64,
            path: genPath,
            base64: base64
          };
          if (newImgEl) {
            newImgEl.src = base64;
            newImgEl.style.display = 'block';
          }
          if (placeholder) placeholder.style.display = 'none';
          if (pathInput) pathInput.value = genPath;
          if (confirmBtn) confirmBtn.disabled = false;
        }
      };
    }

    // Path input handler
    if (pathInput) {
      pathInput.oninput = (e) => {
        const val = e.target.value.trim();
        if (val) {
          tempReplacementData = {
            previewUrl: val.startsWith('data:') || val.startsWith('http') ? val : '../' + val,
            path: val,
            base64: null
          };
          if (newImgEl) {
            newImgEl.src = tempReplacementData.previewUrl;
            newImgEl.style.display = 'block';
          }
          if (placeholder) placeholder.style.display = 'none';
          if (confirmBtn) confirmBtn.disabled = false;
        } else {
          tempReplacementData = null;
          if (newImgEl) newImgEl.style.display = 'none';
          if (placeholder) placeholder.style.display = 'flex';
          if (confirmBtn) confirmBtn.disabled = true;
        }
      };
    }

    // Confirm action
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        if (tempReplacementData && onConfirm) {
          onConfirm(tempReplacementData.path, tempReplacementData.base64);
        }
        closeReplaceModal();
      };
    }

    imageReplaceModal.classList.add('open');
  }

  function closeReplaceModal() {
    if (imageReplaceModal) imageReplaceModal.classList.remove('open');
  }

  /* ─────────────────────────────────────────────────────────────
     GITHUB 1-CLICK SYNC & PUBLISHING
     ───────────────────────────────────────────────────────────── */
  function setupGithubToken() {
    const token = localStorage.getItem('clairvibe_github_token');
    updateGithubStatusChip(token);

    if (githubStatusChip) {
      githubStatusChip.onclick = () => {
        if (inputGithubToken) inputGithubToken.value = localStorage.getItem('clairvibe_github_token') || '';
        tokenModal.classList.add('open');
      };
    }

    if (btnGithubSettings) {
      btnGithubSettings.onclick = () => {
        if (inputGithubToken) inputGithubToken.value = localStorage.getItem('clairvibe_github_token') || '';
        tokenModal.classList.add('open');
      };
    }

    if (tokenModalClose) {
      tokenModalClose.onclick = () => tokenModal.classList.remove('open');
    }

    if (btnSaveToken) {
      btnSaveToken.onclick = async () => {
        const tokenVal = inputGithubToken.value.trim();
        if (!tokenVal) {
          localStorage.removeItem('clairvibe_github_token');
          updateGithubStatusChip(null);
          tokenModal.classList.remove('open');
          showToast('GitHub token removed', 'error');
          return;
        }

        btnSaveToken.disabled = true;
        btnSaveToken.textContent = 'Verifying Token...';

        try {
          const testRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`, {
            headers: {
              'Authorization': `token ${tokenVal}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          if (testRes.ok) {
            localStorage.setItem('clairvibe_github_token', tokenVal);
            updateGithubStatusChip(tokenVal);
            tokenModal.classList.remove('open');
            showToast('✅ GitHub Token verified & connected!', 'success');
          } else {
            showToast('Invalid token or repository access denied', 'error');
          }
        } catch (err) {
          showToast('Failed to connect to GitHub API', 'error');
        } finally {
          btnSaveToken.disabled = false;
          btnSaveToken.textContent = 'Save & Connect';
        }
      };
    }
  }

  function updateGithubStatusChip(token) {
    if (!githubStatusChip) return;
    const dot = githubStatusChip.querySelector('.status-dot');
    const text = githubStatusChip.querySelector('.status-text');

    if (token) {
      dot.className = 'status-dot connected';
      text.textContent = 'GitHub Connected';
    } else {
      dot.className = 'status-dot';
      text.textContent = 'Connect GitHub Token';
    }
  }

  async function publishToGithub() {
    const token = localStorage.getItem('clairvibe_github_token');
    if (!token) {
      showToast('Please connect your GitHub Token first', 'error');
      tokenModal.classList.add('open');
      return;
    }

    btnPublish.disabled = true;
    btnPublish.innerHTML = `
      <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>
      Publishing Changes...
    `;

    try {
      // 1. Commit any pending uploaded files
      const uploadKeys = Object.keys(pendingUploads);
      for (const filePath of uploadKeys) {
        const base64Data = pendingUploads[filePath].split(',')[1] || pendingUploads[filePath];
        await commitFileToGithub(token, filePath, base64Data, `Upload media: ${filePath}`);
      }

      // 2. Fetch current content.json SHA
      const getFileRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${CONTENT_JSON_PATH}?ref=${GITHUB_BRANCH}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      let currentSha = null;
      if (getFileRes.ok) {
        const fileJson = await getFileRes.json();
        currentSha = fileJson.sha;
      }

      // 3. Commit updated content.json
      const updatedJsonString = JSON.stringify(siteData, null, 2);
      const encodedContent = btoa(unescape(encodeURIComponent(updatedJsonString)));

      const commitRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${CONTENT_JSON_PATH}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Update website content via ClairVibe Studio',
          content: encodedContent,
          branch: GITHUB_BRANCH,
          ...(currentSha ? { sha: currentSha } : {})
        })
      });

      if (commitRes.ok) {
        const commitData = await commitRes.json();
        originalData = JSON.parse(JSON.stringify(siteData));
        pendingUploads = {};
        isDirty = false;
        updateDirtyState();
        showToast('🚀 Live! Changes published to GitHub Pages', 'success');
      } else {
        const errJson = await commitRes.json();
        throw new Error(errJson.message || 'Commit failed');
      }
    } catch (err) {
      console.error('Publish error:', err);
      showToast(`Publish failed: ${err.message}`, 'error');
    } finally {
      btnPublish.disabled = false;
      btnPublish.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Publish to Website
      `;
    }
  }

  async function commitFileToGithub(token, path, base64Content, commitMessage) {
    try {
      // Get existing SHA if file exists
      const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${path}?ref=${GITHUB_BRANCH}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      let sha = null;
      if (getRes.ok) {
        const j = await getRes.json();
        sha = j.sha;
      }

      await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: commitMessage,
          content: base64Content,
          branch: GITHUB_BRANCH,
          ...(sha ? { sha } : {})
        })
      });
    } catch (e) {
      console.warn(`Could not upload ${path}:`, e);
    }
  }

  /* ─────────────────────────────────────────────────────────────
     GLOBAL ACTIONS (Export, Reset, Tabs)
     ───────────────────────────────────────────────────────────── */
  function setupGlobalActions() {
    // Publish
    if (btnPublish) btnPublish.onclick = publishToGithub;

    // Export JSON backup
    if (btnExport) {
      btnExport.onclick = () => {
        const blob = new Blob([JSON.stringify(siteData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'content.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Downloaded content.json backup', 'success');
      };
    }

    // Reset Changes
    if (btnReset) {
      btnReset.onclick = () => {
        if (confirm('Discard all unsaved edits and reset to original content?')) {
          siteData = JSON.parse(JSON.stringify(originalData));
          pendingUploads = {};
          isDirty = false;
          updateDirtyState();
          renderAllSections();
          showToast('Changes discarded', 'success');
        }
      };
    }
  }

  function setupTabNavigation() {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = btn.dataset.tab;

        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPanel = document.getElementById(`panel_${tabId}`);
        if (targetPanel) targetPanel.classList.add('active');

        if (tabId === 'preview') {
          updateLivePreview();
        }
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     HELPERS & UTILITIES
     ───────────────────────────────────────────────────────────── */
  function markDirty() {
    isDirty = true;
    updateDirtyState();
    sessionStorage.setItem('clairvibe_preview_data', JSON.stringify(siteData));
  }

  function updateDirtyState() {
    if (btnReset) btnReset.style.display = isDirty ? 'inline-flex' : 'none';
  }

  function setupDropzone(dropzoneEl, fileInputEl, onFileRead) {
    dropzoneEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzoneEl.classList.add('dragover');
    });
    dropzoneEl.addEventListener('dragleave', () => {
      dropzoneEl.classList.remove('dragover');
    });
    dropzoneEl.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzoneEl.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });

    fileInputEl.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleFile(file);
    });

    function handleFile(file) {
      fileToBase64(file).then(base64 => {
        if (onFileRead) onFileRead(file, base64);
      });
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function sanitizeFilename(name) {
    return name.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
  }

  function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === 'success' ? '<polyline points="20 6 9 17 4 12"/>' : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
      </svg>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Start
  document.addEventListener('DOMContentLoaded', init);
})();
