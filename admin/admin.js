/**
 * CLAIRVIBE VISUAL STUDIO — HOSTINGER-STYLE WEBSITE BUILDER
 * Offline-ready, side-by-side live canvas, visual image replacement & deletion with previews.
 */

(function () {
  'use strict';

  // Constants
  const GITHUB_REPO_OWNER = 'websitebuilder7777-bit';
  const GITHUB_REPO_NAME = 'clairvibe';
  const GITHUB_BRANCH = 'main';
  const CONTENT_PATH = 'data/content.json';

  // Default Template Data (ensures 100% functionality even on file:/// without webserver)
  const DEFAULT_CONTENT = {
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
        images: [
          'machines/M.png',
          'machines/M2.png'
        ]
      },
      food: {
        title: 'Food & FMCG',
        cover: 'food and fmcg/F.png',
        images: [
          'food and fmcg/F.png',
          'food and fmcg/F1.png',
          'food and fmcg/F2.png',
          'food and fmcg/F3.png',
          'food and fmcg/F4.png',
          'food and fmcg/F5.png',
          'food and fmcg/F6.png',
          'food and fmcg/F7.png',
          'food and fmcg/F8.png',
          'food and fmcg/F9.png'
        ]
      },
      corporate: {
        title: 'Corporate & Brand Summits',
        cover: 'coorporate/C.png',
        images: [
          'coorporate/C.png',
          'coorporate/C2.png',
          'coorporate/C3.png'
        ]
      }
    },
    about: {
      label: 'Who We Are',
      title: 'We Design Moments That Last a Lifetime',
      paragraph1: 'ClairVibe is a full-service event management company setting the standard for premium experiential design. From concept to execution, we bring together creativity, strategy, and flawless logistics to craft events that leave lasting impressions.',
      paragraph2: 'Our team of seasoned creatives, planners, and producers work in harmony to bring your unique story to life — no matter the scale.',
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

  // State
  let state = JSON.parse(JSON.stringify(DEFAULT_CONTENT));
  let pendingUploads = {}; // file path -> base64 string
  let currentReplaceCallback = null;
  let currentDeleteCallback = null;
  let tempReplaceFile = null;

  /* ─────────────────────────────────────────────────────────────
     INIT
     ───────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', async () => {
    loadLocalSavedState();
    await tryFetchServerState();
    setupViewModeSwitchers();
    setupSidebarTabs();
    setupModals();
    setupGlobalButtons();
    renderAllViews();
    updateLiveCanvas();
  });

  function loadLocalSavedState() {
    try {
      const saved = localStorage.getItem('clairvibe_builder_state');
      if (saved) {
        state = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read localStorage:', e);
    }
  }

  async function tryFetchServerState() {
    try {
      const res = await fetch('../data/content.json?v=' + Date.now());
      if (res.ok) {
        const json = await res.json();
        // Merge with state
        state = Object.assign({}, DEFAULT_CONTENT, json);
        saveLocalState();
      }
    } catch (e) {
      // Offline / file:/// protocol: perfectly fine, state is already initialized!
    }
  }

  function saveLocalState() {
    try {
      localStorage.setItem('clairvibe_builder_state', JSON.stringify(state));
      sessionStorage.setItem('clairvibe_preview_data', JSON.stringify(state));
    } catch (e) {}
  }

  /* ─────────────────────────────────────────────────────────────
     RESOLVE IMAGE/VIDEO PATHS
     ───────────────────────────────────────────────────────────── */
  function resolvePath(path) {
    if (!path) return '';
    if (pendingUploads[path]) return pendingUploads[path];
    if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
      return path;
    }
    return '../' + path;
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER ALL EDITOR PANELS
     ───────────────────────────────────────────────────────────── */
  function renderAllViews() {
    renderHeroPanel();
    renderGalleryPanel('machines');
    renderGalleryPanel('food');
    renderGalleryPanel('corporate');
    renderAboutPanel();
    renderContactPanel();
    updateBadges();
  }

  function updateBadges() {
    const port = state.portfolio || {};
    const bMach = document.getElementById('badge_machines');
    const bFood = document.getElementById('badge_food');
    const bCorp = document.getElementById('badge_corporate');

    if (bMach) bMach.textContent = (port.machines?.images || []).length;
    if (bFood) bFood.textContent = (port.food?.images || []).length;
    if (bCorp) bCorp.textContent = (port.corporate?.images || []).length;
  }

  /* ── 1. Hero Panel ── */
  function renderHeroPanel() {
    const hero = state.hero || {};
    const videoPreview = document.getElementById('heroVideoPreview');
    const videoInput = document.getElementById('heroVideoInput');
    const btnTextInput = document.getElementById('heroBtnTextInput');
    const btnLinkInput = document.getElementById('heroBtnLinkInput');

    if (videoPreview && hero.video) {
      videoPreview.src = resolvePath(hero.video);
    }
    if (videoInput) {
      videoInput.value = hero.video || '';
      videoInput.oninput = (e) => {
        hero.video = e.target.value.trim();
        if (videoPreview) videoPreview.src = resolvePath(hero.video);
        onStateChanged();
      };
    }
    if (btnTextInput) {
      btnTextInput.value = hero.button_text || '';
      btnTextInput.oninput = (e) => {
        hero.button_text = e.target.value;
        onStateChanged();
      };
    }
    if (btnLinkInput) {
      btnLinkInput.value = hero.button_link || '';
      btnLinkInput.oninput = (e) => {
        hero.button_link = e.target.value;
        onStateChanged();
      };
    }

    // Replace Hero Video Button
    const btnReplaceVideo = document.getElementById('btnReplaceHeroVideo');
    if (btnReplaceVideo) {
      btnReplaceVideo.onclick = () => {
        openReplaceModal({
          title: 'Replace Homepage Background Video',
          currentSrc: hero.video,
          accept: 'video/mp4,video/webm',
          onConfirm: (newPath, base64) => {
            if (base64) pendingUploads[newPath] = base64;
            hero.video = newPath;
            renderHeroPanel();
            onStateChanged();
            showToast('Background video updated!', 'success');
          }
        });
      };
    }
  }

  /* ── 2. Gallery Panels (Machines / Food / Corporate) ── */
  function renderGalleryPanel(catKey) {
    const port = state.portfolio || {};
    const cat = port[catKey] || { title: '', cover: '', images: [] };

    // Title input
    const titleInput = document.getElementById(`input_title_${catKey}`);
    if (titleInput) {
      titleInput.value = cat.title || '';
      titleInput.oninput = (e) => {
        cat.title = e.target.value;
        onStateChanged();
      };
    }

    // Cover Card
    const coverCardContainer = document.getElementById(`coverCard_${catKey}`);
    if (coverCardContainer) {
      const coverSrc = resolvePath(cat.cover);
      coverCardContainer.innerHTML = `
        <div class="visual-image-card">
          <div class="image-preview-box">
            <img src="${coverSrc}" alt="${cat.title} Cover" onerror="this.src='https://placehold.co/600x400/15154A/F5A623?text=Cover+Image'">
            <div class="image-hover-actions">
              <button class="action-btn-pill pill-replace" id="btnReplaceCover_${catKey}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Replace Cover
              </button>
            </div>
          </div>
          <div class="image-meta-bar">
            <span class="image-meta-filename" title="${cat.cover}">${cat.cover ? cat.cover.split('/').pop() : 'No Cover Set'}</span>
            <span style="color:var(--amber);font-size:0.7rem;font-weight:600">CARD COVER</span>
          </div>
        </div>
      `;

      const btnRepCover = document.getElementById(`btnReplaceCover_${catKey}`);
      if (btnRepCover) {
        btnRepCover.onclick = () => {
          openReplaceModal({
            title: `Replace Card Cover — ${cat.title}`,
            currentSrc: cat.cover,
            accept: 'image/*',
            onConfirm: (newPath, base64) => {
              if (base64) pendingUploads[newPath] = base64;
              cat.cover = newPath;
              renderGalleryPanel(catKey);
              onStateChanged();
              showToast('Card cover image updated!', 'success');
            }
          });
        };
      }
    }

    // Gallery Photos Grid
    const gridContainer = document.getElementById(`grid_${catKey}`);
    if (gridContainer) {
      gridContainer.innerHTML = '';

      cat.images.forEach((imgPath, idx) => {
        const imgSrc = resolvePath(imgPath);
        const card = document.createElement('div');
        card.className = 'visual-image-card';
        card.innerHTML = `
          <div class="image-preview-box">
            <img src="${imgSrc}" alt="Gallery Photo ${idx + 1}" onerror="this.src='https://placehold.co/400x300/15154A/F5A623?text=Photo+Missing'">
            <div class="image-hover-actions">
              <button class="action-btn-pill pill-replace" title="Replace this photo" data-replace-idx="${idx}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Replace
              </button>
              <button class="action-btn-pill pill-delete" title="Delete this photo" data-delete-idx="${idx}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Delete
              </button>
            </div>
          </div>
          <div class="image-meta-bar">
            <span class="image-meta-filename" title="${imgPath}">#${idx + 1}: ${imgPath.split('/').pop()}</span>
          </div>
        `;

        // Replace Button
        card.querySelector('[data-replace-idx]').onclick = () => {
          openReplaceModal({
            title: `Replace Photo #${idx + 1} — ${cat.title}`,
            currentSrc: imgPath,
            accept: 'image/*',
            onConfirm: (newPath, base64) => {
              if (base64) pendingUploads[newPath] = base64;
              cat.images[idx] = newPath;
              renderGalleryPanel(catKey);
              onStateChanged();
              showToast(`Photo #${idx + 1} replaced successfully!`, 'success');
            }
          });
        };

        // Delete Button (Opens visual confirmation showing the exact photo being deleted)
        card.querySelector('[data-delete-idx]').onclick = () => {
          openDeleteModal({
            title: `Remove Photo from ${cat.title}`,
            imageSrc: imgPath,
            filename: imgPath.split('/').pop(),
            onConfirm: () => {
              cat.images.splice(idx, 1);
              renderGalleryPanel(catKey);
              onStateChanged();
              showToast('Photo removed from gallery!', 'success');
            }
          });
        };

        gridContainer.appendChild(card);
      });

      // Append "+ Add Photos" Box
      const addBox = document.createElement('div');
      addBox.className = 'add-photos-box';
      addBox.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <div style="font-weight:600;font-size:0.8rem">Add Photos</div>
        <div style="font-size:0.68rem;color:var(--white-40)">Click or Drop</div>
        <input type="file" multiple accept="image/*" style="display:none" id="multiFileInput_${catKey}">
      `;

      const multiFileInput = addBox.querySelector(`#multiFileInput_${catKey}`);
      addBox.onclick = () => multiFileInput.click();

      // Drag and drop onto Add Box
      addBox.ondragover = (e) => { e.preventDefault(); addBox.style.borderColor = 'var(--amber)'; };
      addBox.ondragleave = () => { addBox.style.borderColor = ''; };
      addBox.ondrop = async (e) => {
        e.preventDefault();
        addBox.style.borderColor = '';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          await handleAddMultipleFiles(catKey, Array.from(e.dataTransfer.files));
        }
      };

      multiFileInput.onchange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
          await handleAddMultipleFiles(catKey, Array.from(e.target.files));
        }
      };

      gridContainer.appendChild(addBox);
    }
  }

  async function handleAddMultipleFiles(catKey, files) {
    const cat = state.portfolio[catKey];
    if (!cat) return;

    for (const file of files) {
      const base64 = await fileToBase64(file);
      const cleanPath = `uploads/${catKey}_${Date.now()}_${sanitizeFilename(file.name)}`;
      pendingUploads[cleanPath] = base64;
      cat.images.push(cleanPath);
    }

    renderGalleryPanel(catKey);
    onStateChanged();
    showToast(`Added ${files.length} new photo(s) to ${cat.title}!`, 'success');
  }

  /* ── 3. About Panel ── */
  function renderAboutPanel() {
    const about = state.about || {};
    const inputLabel = document.getElementById('aboutLabelInput');
    const inputTitle = document.getElementById('aboutTitleInput');
    const inputP1 = document.getElementById('aboutP1Input');
    const inputP2 = document.getElementById('aboutP2Input');

    if (inputLabel) {
      inputLabel.value = about.label || '';
      inputLabel.oninput = (e) => { about.label = e.target.value; onStateChanged(); };
    }
    if (inputTitle) {
      inputTitle.value = about.title || '';
      inputTitle.oninput = (e) => { about.title = e.target.value; onStateChanged(); };
    }
    if (inputP1) {
      inputP1.value = about.paragraph1 || '';
      inputP1.oninput = (e) => { about.paragraph1 = e.target.value; onStateChanged(); };
    }
    if (inputP2) {
      inputP2.value = about.paragraph2 || '';
      inputP2.oninput = (e) => { about.paragraph2 = e.target.value; onStateChanged(); };
    }

    // Stats
    const stats = about.stats || [];
    [0, 1, 2].forEach(i => {
      const cInput = document.getElementById(`statCount_${i}`);
      const lInput = document.getElementById(`statLabel_${i}`);
      if (stats[i]) {
        if (cInput) {
          cInput.value = stats[i].count || 0;
          cInput.oninput = (e) => { stats[i].count = parseInt(e.target.value) || 0; onStateChanged(); };
        }
        if (lInput) {
          lInput.value = stats[i].label || '';
          lInput.oninput = (e) => { stats[i].label = e.target.value; onStateChanged(); };
        }
      }
    });

    // About Image Card
    const aboutImageSlot = document.getElementById('aboutImageSlot');
    if (aboutImageSlot) {
      const imgSrc = resolvePath(about.image);
      aboutImageSlot.innerHTML = `
        <div class="visual-image-card">
          <div class="image-preview-box">
            <img src="${imgSrc}" alt="About Visual" onerror="this.src='https://placehold.co/600x400/15154A/F5A623?text=About+Image'">
            <div class="image-hover-actions">
              <button class="action-btn-pill pill-replace" id="btnReplaceAboutImg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Replace Photo
              </button>
            </div>
          </div>
          <div class="image-meta-bar">
            <span class="image-meta-filename" title="${about.image}">${about.image ? about.image.split('/').pop() : 'No Image Set'}</span>
            <span style="color:var(--amber);font-size:0.7rem;font-weight:600">ABOUT VISUAL</span>
          </div>
        </div>
      `;

      const btnRepAbout = document.getElementById('btnReplaceAboutImg');
      if (btnRepAbout) {
        btnRepAbout.onclick = () => {
          openReplaceModal({
            title: 'Replace About Section Featured Photo',
            currentSrc: about.image,
            accept: 'image/*',
            onConfirm: (newPath, base64) => {
              if (base64) pendingUploads[newPath] = base64;
              about.image = newPath;
              renderAboutPanel();
              onStateChanged();
              showToast('About section photo updated!', 'success');
            }
          });
        };
      }
    }
  }

  /* ── 4. Contact Panel ── */
  function renderContactPanel() {
    const contact = state.contact || {};
    const inputEmail = document.getElementById('contactEmailInput');
    const inputPhone = document.getElementById('contactPhoneInput');
    const inputLocation = document.getElementById('contactLocationInput');
    const inputInsta = document.getElementById('contactInstaInput');
    const inputFb = document.getElementById('contactFbInput');
    const inputLi = document.getElementById('contactLiInput');
    const inputFooter = document.getElementById('contactFooterInput');

    if (inputEmail) {
      inputEmail.value = contact.email || '';
      inputEmail.oninput = (e) => { contact.email = e.target.value; onStateChanged(); };
    }
    if (inputPhone) {
      inputPhone.value = contact.phone || '';
      inputPhone.oninput = (e) => { contact.phone = e.target.value; onStateChanged(); };
    }
    if (inputLocation) {
      inputLocation.value = contact.location || '';
      inputLocation.oninput = (e) => { contact.location = e.target.value; onStateChanged(); };
    }

    const socials = contact.socials || {};
    if (inputInsta) {
      inputInsta.value = socials.instagram || '';
      inputInsta.oninput = (e) => { socials.instagram = e.target.value; onStateChanged(); };
    }
    if (inputFb) {
      inputFb.value = socials.facebook || '';
      inputFb.oninput = (e) => { socials.facebook = e.target.value; onStateChanged(); };
    }
    if (inputLi) {
      inputLi.value = socials.linkedin || '';
      inputLi.oninput = (e) => { socials.linkedin = e.target.value; onStateChanged(); };
    }
    if (inputFooter) {
      inputFooter.value = contact.footer_copy || '';
      inputFooter.oninput = (e) => { contact.footer_copy = e.target.value; onStateChanged(); };
    }
  }

  /* ─────────────────────────────────────────────────────────────
     LIVE CANVAS PREVIEW
     ───────────────────────────────────────────────────────────── */
  function updateLiveCanvas() {
    saveLocalState();
    const iframe = document.getElementById('liveCanvasIframe');
    if (iframe) {
      // Refresh preview iframe to reflect state
      iframe.src = '../index.html?preview=' + Date.now();
    }
  }

  function onStateChanged() {
    saveLocalState();
    updateBadges();
    updateLiveCanvas();
  }

  /* ─────────────────────────────────────────────────────────────
     VISUAL MODALS (REPLACE & DELETE WITH FULL THUMBNAILS)
     ───────────────────────────────────────────────────────────── */
  function setupModals() {
    // Replace Modal
    const repModal = document.getElementById('replaceModal');
    const repClose = document.getElementById('replaceModalClose');
    const repCancel = document.getElementById('btnCancelReplace');
    const repConfirm = document.getElementById('btnConfirmReplace');
    const repFileInput = document.getElementById('modalFileInput');
    const repPathInput = document.getElementById('modalPathInput');

    if (repClose) repClose.onclick = closeReplaceModal;
    if (repCancel) repCancel.onclick = closeReplaceModal;

    if (repFileInput) {
      repFileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const base64 = await fileToBase64(file);
          const genPath = `uploads/${Date.now()}_${sanitizeFilename(file.name)}`;
          tempReplaceFile = { path: genPath, base64: base64, preview: base64 };

          const newThumb = document.getElementById('replaceNewThumb');
          const placeholder = document.getElementById('replaceNewPlaceholder');
          if (newThumb) {
            newThumb.src = base64;
            newThumb.style.display = 'block';
          }
          if (placeholder) placeholder.style.display = 'none';
          if (repPathInput) repPathInput.value = genPath;
          if (repConfirm) repConfirm.disabled = false;
        }
      };
    }

    if (repPathInput) {
      repPathInput.oninput = (e) => {
        const val = e.target.value.trim();
        const newThumb = document.getElementById('replaceNewThumb');
        const placeholder = document.getElementById('replaceNewPlaceholder');
        if (val) {
          tempReplaceFile = { path: val, base64: null, preview: resolvePath(val) };
          if (newThumb) {
            newThumb.src = tempReplaceFile.preview;
            newThumb.style.display = 'block';
          }
          if (placeholder) placeholder.style.display = 'none';
          if (repConfirm) repConfirm.disabled = false;
        } else {
          tempReplaceFile = null;
          if (newThumb) newThumb.style.display = 'none';
          if (placeholder) placeholder.style.display = 'flex';
          if (repConfirm) repConfirm.disabled = true;
        }
      };
    }

    if (repConfirm) {
      repConfirm.onclick = () => {
        if (tempReplaceFile && currentReplaceCallback) {
          currentReplaceCallback(tempReplaceFile.path, tempReplaceFile.base64);
        }
        closeReplaceModal();
      };
    }

    // Delete Modal
    const delModal = document.getElementById('deleteModal');
    const delClose = document.getElementById('deleteModalClose');
    const delCancel = document.getElementById('btnCancelDelete');
    const delConfirm = document.getElementById('btnConfirmDelete');

    if (delClose) delClose.onclick = closeDeleteModal;
    if (delCancel) delCancel.onclick = closeDeleteModal;

    if (delConfirm) {
      delConfirm.onclick = () => {
        if (currentDeleteCallback) {
          currentDeleteCallback();
        }
        closeDeleteModal();
      };
    }
  }

  function openReplaceModal({ title, currentSrc, accept, onConfirm }) {
    currentReplaceCallback = onConfirm;
    tempReplaceFile = null;

    const modal = document.getElementById('replaceModal');
    const titleEl = document.getElementById('replaceModalTitle');
    const currThumb = document.getElementById('replaceCurrentThumb');
    const newThumb = document.getElementById('replaceNewThumb');
    const placeholder = document.getElementById('replaceNewPlaceholder');
    const fileInput = document.getElementById('modalFileInput');
    const pathInput = document.getElementById('modalPathInput');
    const confirmBtn = document.getElementById('btnConfirmReplace');

    if (titleEl) titleEl.textContent = title || 'Replace Media';
    if (currThumb) currThumb.src = resolvePath(currentSrc);
    if (newThumb) {
      newThumb.src = '';
      newThumb.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'flex';
    if (fileInput) {
      fileInput.value = '';
      fileInput.accept = accept || 'image/*';
    }
    if (pathInput) pathInput.value = '';
    if (confirmBtn) confirmBtn.disabled = true;

    if (modal) modal.classList.add('open');
  }

  function closeReplaceModal() {
    const modal = document.getElementById('replaceModal');
    if (modal) modal.classList.remove('open');
    currentReplaceCallback = null;
  }

  function openDeleteModal({ title, imageSrc, filename, onConfirm }) {
    currentDeleteCallback = onConfirm;
    const modal = document.getElementById('deleteModal');
    const titleEl = document.getElementById('deleteModalTitle');
    const thumbEl = document.getElementById('deleteModalThumb');
    const fnEl = document.getElementById('deleteModalFilename');

    if (titleEl) titleEl.textContent = title || 'Remove Photo';
    if (thumbEl) thumbEl.src = resolvePath(imageSrc);
    if (fnEl) fnEl.textContent = filename || imageSrc;

    if (modal) modal.classList.add('open');
  }

  function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('open');
    currentDeleteCallback = null;
  }

  /* ─────────────────────────────────────────────────────────────
     VIEW MODES & SIDEBAR TABS
     ───────────────────────────────────────────────────────────── */
  function setupViewModeSwitchers() {
    const viewButtons = document.querySelectorAll('.view-btn[data-mode]');
    viewButtons.forEach(btn => {
      btn.onclick = () => {
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        document.body.className = mode === 'split' ? '' : `mode-${mode}`;
      };
    });

    // Device toggles
    const deviceButtons = document.querySelectorAll('.device-btn[data-device]');
    const previewWrapper = document.getElementById('previewIframeWrapper');
    deviceButtons.forEach(btn => {
      btn.onclick = () => {
        deviceButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const dev = btn.dataset.device;
        if (previewWrapper) {
          previewWrapper.className = `preview-iframe-wrapper ${dev}`;
        }
      };
    });
  }

  function setupSidebarTabs() {
    const tabs = document.querySelectorAll('.sidebar-tab[data-tab]');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const target = document.getElementById(`tab_${tab.dataset.tab}`);
        if (target) target.classList.add('active');
      };
    });
  }

  /* ─────────────────────────────────────────────────────────────
     GLOBAL BUTTONS (GITHUB SYNC, BACKUP EXPORT)
     ───────────────────────────────────────────────────────────── */
  function setupGlobalButtons() {
    // 1. GitHub Token Config
    const tokenChip = document.getElementById('githubStatusChip');
    const tokenModal = document.getElementById('tokenModal');
    const tokenModalClose = document.getElementById('tokenModalClose');
    const tokenInput = document.getElementById('inputGithubToken');
    const btnSaveToken = document.getElementById('btnSaveToken');

    const updateChipStatus = () => {
      const savedToken = localStorage.getItem('clairvibe_github_token');
      const dot = tokenChip?.querySelector('.status-dot');
      const txt = tokenChip?.querySelector('.status-text');
      if (savedToken) {
        if (dot) dot.className = 'status-dot connected';
        if (txt) txt.textContent = 'GitHub Connected';
      } else {
        if (dot) dot.className = 'status-dot';
        if (txt) txt.textContent = 'Connect GitHub';
      }
    };
    updateChipStatus();

    if (tokenChip) {
      tokenChip.onclick = () => {
        if (tokenInput) tokenInput.value = localStorage.getItem('clairvibe_github_token') || '';
        if (tokenModal) tokenModal.classList.add('open');
      };
    }
    if (tokenModalClose) {
      tokenModalClose.onclick = () => tokenModal?.classList.remove('open');
    }

    if (btnSaveToken) {
      btnSaveToken.onclick = async () => {
        const val = tokenInput.value.trim();
        if (!val) {
          localStorage.removeItem('clairvibe_github_token');
          updateChipStatus();
          tokenModal.classList.remove('open');
          showToast('GitHub token removed', 'error');
          return;
        }

        btnSaveToken.disabled = true;
        btnSaveToken.textContent = 'Verifying...';

        try {
          const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`, {
            headers: {
              'Authorization': `token ${val}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          if (res.ok) {
            localStorage.setItem('clairvibe_github_token', val);
            updateChipStatus();
            tokenModal.classList.remove('open');
            showToast('✅ GitHub Token connected & verified!', 'success');
          } else {
            showToast('Invalid token or repository access denied', 'error');
          }
        } catch (e) {
          showToast('Failed to connect to GitHub', 'error');
        } finally {
          btnSaveToken.disabled = false;
          btnSaveToken.textContent = 'Save & Connect';
        }
      };
    }

    // 2. Publish Button (1-Click GitHub Save)
    const btnPublish = document.getElementById('btnPublish');
    if (btnPublish) {
      btnPublish.onclick = async () => {
        const token = localStorage.getItem('clairvibe_github_token');
        if (!token) {
          showToast('Please connect your GitHub Token first', 'error');
          if (tokenModal) tokenModal.classList.add('open');
          return;
        }

        btnPublish.disabled = true;
        btnPublish.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg> Publishing...`;

        try {
          // Upload any pending image files
          const uploadKeys = Object.keys(pendingUploads);
          for (const path of uploadKeys) {
            const base64 = pendingUploads[path].split(',')[1] || pendingUploads[path];
            await commitFileToGithub(token, path, base64, `Upload media: ${path}`);
          }

          // Fetch current content.json SHA
          const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${CONTENT_PATH}?ref=${GITHUB_BRANCH}`, {
            headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
          });
          let currentSha = null;
          if (getRes.ok) {
            const j = await getRes.json();
            currentSha = j.sha;
          }

          // Commit updated content.json
          const jsonStr = JSON.stringify(state, null, 2);
          const encoded = btoa(unescape(encodeURIComponent(jsonStr)));

          const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${CONTENT_PATH}`, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Update website content via ClairVibe Studio',
              content: encoded,
              branch: GITHUB_BRANCH,
              ...(currentSha ? { sha: currentSha } : {})
            })
          });

          if (putRes.ok) {
            pendingUploads = {};
            showToast('🚀 Live! Changes saved to GitHub repository', 'success');
          } else {
            const errJ = await putRes.json();
            throw new Error(errJ.message || 'Save failed');
          }
        } catch (err) {
          showToast(`Save error: ${err.message}`, 'error');
        } finally {
          btnPublish.disabled = false;
          btnPublish.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Publish to Website`;
        }
      };
    }

    // 3. Export Backup
    const btnExport = document.getElementById('btnExport');
    if (btnExport) {
      btnExport.onclick = () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'content.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Downloaded content.json backup', 'success');
      };
    }
  }

  async function commitFileToGithub(token, path, base64Content, commitMessage) {
    try {
      const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${path}?ref=${GITHUB_BRANCH}`, {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
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
      console.warn('File upload error:', e);
    }
  }

  /* ─── Helpers ─── */
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

  function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;flex-shrink:0">
        ${type === 'success' ? '<polyline points="20 6 9 17 4 12"/>' : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
      </svg>
      <span>${msg}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

})();
