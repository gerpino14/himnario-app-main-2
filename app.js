/**
 * Himnario Digital Premium - Application Logic
 * Implements: client-side search, filtering, immersive reading mode, 
 * font size adjusters, theme persistence, and offline storage.
 */

// Application State
let hymnsData = [];
let filteredHymns = [];
let favorites = new Set();
let fontLyricsSize = 20;
let activeFilter = 'all';
let activeCategory = null;
let activeRange = null;
let activeHymn = null;
let pistasData = [];
let isPresentationMode = false;
let controlsTimeout = null;
let audioVolume = 1.0;

// PDF Viewer State
let pdfDoc = null;
let pdfTotalPages = 0;
let pdfCurrentScale = 1.0;
let pdfFitToWidth = true;
let pdfRenderedPages = new Set();
let pdfRenderingPages = new Set();
let pdfPageDimensions = [];
let pdfObserver = null;
let pdfFloatingIndicator = null;
let pdfScrollTimeout = null;
let pdfLoaded = false;

// Fullscreen PDF Viewer State
let pdfFsOpen = false;
let pdfFsScale = 1.0;
let pdfFsFitToWidth = true;
let pdfFsRenderedPages = new Set();
let pdfFsRenderingPages = new Set();
let pdfFsObserver = null;
let pdfFsScrollTimeout = null;
let pdfFsFloatingIndicator = null;

// DOM Elements Cache
let DOM = {};

function initDOM() {
  DOM = {
    themeToggle: document.getElementById('theme-toggle'),
    favoritesToggle: document.getElementById('favorites-toggle'),
    searchInput: document.getElementById('search-input'),
    clearSearch: document.getElementById('clear-search'),
    filterTabs: document.querySelectorAll('.tab-btn'),
    resultsCount: document.getElementById('results-count'),
    categoryFilterBadge: document.getElementById('active-category-filter'),
    rangeFilterBadge: document.getElementById('active-range-filter'),
    indexToggle: document.getElementById('index-toggle'),
    indexDrawer: document.getElementById('index-drawer'),
    closeDrawer: document.getElementById('close-drawer'),
    drawerBody: document.getElementById('drawer-body'),
    hymnsGrid: document.getElementById('hymns-grid'),
    
    // PDF Viewer
    pdfSection: document.getElementById('pdf-viewer-section'),
    pdfLoading: document.getElementById('pdf-loading'),
    pdfProgressFill: document.getElementById('pdf-progress-fill'),
    pdfPagesContainer: document.getElementById('pdf-pages-container'),
    pdfZoomIn: document.getElementById('pdf-zoom-in'),
    pdfZoomOut: document.getElementById('pdf-zoom-out'),
    pdfZoomDisplay: document.getElementById('pdf-zoom-display'),
    pdfFitWidth: document.getElementById('pdf-fit-width'),
    pdfGotoInput: document.getElementById('pdf-goto-input'),
    pdfPageTotal: document.getElementById('pdf-page-total'),
    pdfFullscreenBtn: document.getElementById('pdf-fullscreen-btn'),
    statusBar: document.querySelector('.status-bar'),
    
    // Fullscreen PDF Viewer
    pdfFsModal: document.getElementById('pdf-fullscreen-modal'),
    pdfFsClose: document.getElementById('pdf-fs-close'),
    pdfFsViewport: document.getElementById('pdf-fs-viewport'),
    pdfFsPagesContainer: document.getElementById('pdf-fs-pages-container'),
    pdfFsZoomIn: document.getElementById('pdf-fs-zoom-in'),
    pdfFsZoomOut: document.getElementById('pdf-fs-zoom-out'),
    pdfFsZoomDisplay: document.getElementById('pdf-fs-zoom-display'),
    pdfFsFitWidth: document.getElementById('pdf-fs-fit-width'),
    pdfFsGotoInput: document.getElementById('pdf-fs-goto-input'),
    pdfFsPageTotal: document.getElementById('pdf-fs-page-total'),
    
    // Reader Modal
    readerModal: document.getElementById('reader-modal'),
    readerContainer: document.querySelector('.reader-container'),
    readerBar: document.querySelector('.reader-bar'),
    readerFooter: document.querySelector('.reader-nav-footer'),
    presentationToggle: document.getElementById('presentation-toggle'),
    closeReader: document.getElementById('close-reader'),
    readerFavBtn: document.getElementById('reader-fav-btn'),
    fontDecrease: document.getElementById('font-decrease'),
    fontIncrease: document.getElementById('font-increase'),
    fontSizeDisplay: document.getElementById('font-size-display'),
    readerCategory: document.getElementById('reader-category'),
    readerNumber: document.getElementById('reader-number'),
    readerTitle: document.getElementById('reader-title'),
    readerLyrics: document.getElementById('reader-lyrics'),
    prevHymnBtn: document.getElementById('prev-hymn-btn'),
    nextHymnBtn: document.getElementById('next-hymn-btn'),
    readerProgress: document.getElementById('reader-progress-indicator'),
    viewport: document.querySelector('.reader-viewport'),
    readerAudio: document.getElementById('reader-audio'),
    readerAudioContainer: document.getElementById('reader-audio-container'),
    
    // Custom Audio Player Elements
    playerPlayBtn: document.getElementById('player-play-btn'),
    iconPlay: document.getElementById('icon-play'),
    iconPause: document.getElementById('icon-pause'),
    playerTime: document.getElementById('player-time'),
    playerProgress: document.getElementById('player-progress'),
    playerVolumeBtn: document.getElementById('player-volume-btn'),
    iconVolume: document.getElementById('icon-volume'),
    iconVolumeMuted: document.getElementById('icon-volume-muted'),
    playerOptionsBtn: document.getElementById('player-options-btn'),
    playerOptionsMenu: document.getElementById('player-options-menu'),
    playerDownloadLink: document.getElementById('player-download-link'),
    speedSlider: document.getElementById('speed-slider'),
    speedDisplay: document.getElementById('speed-display'),
    speedPresets: document.querySelectorAll('.speed-preset-btn'),
    menuVolumeBtn: document.getElementById('menu-volume-btn'),
    menuIconVol: document.getElementById('menu-icon-vol'),
    menuIconVolMuted: document.getElementById('menu-icon-vol-muted'),
    playerVolumeSlider: document.getElementById('player-volume-slider'),
    volumeDisplay: document.getElementById('volume-display')
  };
}

// ----------------------------------------------------
// 1. Initialization & Local Storage Sync
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  console.log('App DOMContentLoaded starting initialization...');
  try {
    initDOM();
    initTheme();
    initLocalStorage();
    fetchHymns();
    renderIndexDrawer();
    registerEventListeners();
    console.log('App initialization finished successfully.');
  } catch (error) {
    console.error('App initialization failed:', error);
  }
});

// Theme System
function initTheme() {
  const savedTheme = localStorage.getItem('hymnario-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  
  document.documentElement.setAttribute('data-theme', initialTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('hymnario-theme', newTheme);
}

// Local Storage Sync (Favorites & Font Size)
function initLocalStorage() {
  // Load Favorites
  try {
    const savedFavs = JSON.parse(localStorage.getItem('hymnario-favorites') || '[]');
    favorites = new Set(savedFavs);
  } catch (e) {
    favorites = new Set();
  }

  // Load Font Size
  fontLyricsSize = parseInt(localStorage.getItem('hymnario-fontsize') || '20');
  if (isNaN(fontLyricsSize) || fontLyricsSize < 14 || fontLyricsSize > 32) {
    fontLyricsSize = 20;
  }
  updateFontSizeControls();

  // Load Volume
  audioVolume = parseFloat(localStorage.getItem('hymnario-volume') || '1.0');
  if (isNaN(audioVolume) || audioVolume < 0 || audioVolume > 1) {
    audioVolume = 1.0;
  }
}

function saveFavorites() {
  localStorage.setItem('hymnario-favorites', JSON.stringify(Array.from(favorites)));
}

// ----------------------------------------------------
// 2. Data Fetching
// ----------------------------------------------------
async function fetchHymns() {
  try {
    // Cargar himnos y pistas de audio en paralelo
    const [hymnsRes, pistasRes] = await Promise.all([
      fetch('himnos.json'),
      fetch('himnos_pistas.json').catch(e => {
        console.warn("No se pudo cargar himnos_pistas.json, reproductor de audio deshabilitado.", e);
        return null;
      })
    ]);
    
    if (!hymnsRes.ok) {
      throw new Error(`HTTP error! status: ${hymnsRes.status}`);
    }
    hymnsData = await hymnsRes.json();
    filteredHymns = [...hymnsData];
    
    if (pistasRes && pistasRes.ok) {
      pistasData = await pistasRes.json();
    }
    
    applySearchAndFilters();
  } catch (error) {
    console.error('Failed to load hymns dataset:', error);
    renderErrorState();
  }
}

// ----------------------------------------------------
// 3. Search & Filter Systems
// ----------------------------------------------------
function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function applySearchAndFilters() {
  const query = removeAccents(DOM.searchInput.value.trim());
  
  filteredHymns = hymnsData.filter(item => {
    // 1. Filter by Section Tab
    if (activeFilter === 'favoritos' && !favorites.has(item.numero)) return false;
    
    // 2. Filter by Category badge (if clicked on a category link)
    if (activeCategory && item.categoria !== activeCategory) return false;
    
    // 3. Filter by Range (if clicked from the index)
    if (activeRange && (item.numero < activeRange.start || item.numero > activeRange.end)) return false;
    
    // 4. Filter by Search Query
    if (query !== '') {
      // Check exact or partial number match
      const numStr = item.numero.toString();
      if (numStr === query || numStr.includes(query)) return true;
      
      // Check Title Match
      const titleMatch = removeAccents(item.titulo).includes(query);
      if (titleMatch) return true;
      
      // Check Category Match
      const categoryMatch = removeAccents(item.categoria).includes(query);
      if (categoryMatch) return true;
      
      // Check Lyrics Match
      let lyricsMatch = false;
      for (const stanza of item.letra) {
        for (const line of stanza.lineas) {
          if (removeAccents(line).includes(query)) {
            lyricsMatch = true;
            break;
          }
        }
        if (lyricsMatch) break;
      }
      return lyricsMatch;
    }
    
    return true;
  });
  
  renderHymnsGrid();
  updateResultsCount();
}

function updateResultsCount() {
  const count = filteredHymns.length;
  if (count === 0) {
    DOM.resultsCount.textContent = 'Ningún resultado encontrado';
  } else if (count === 1) {
    DOM.resultsCount.textContent = '1 resultado encontrado';
  } else {
    DOM.resultsCount.textContent = `${count} resultados encontrados`;
  }
}

function setCategoryFilter(category) {
  activeCategory = category;
  activeRange = null;
  DOM.rangeFilterBadge.classList.add('hidden');
  
  if (category) {
    DOM.categoryFilterBadge.classList.remove('hidden');
    DOM.categoryFilterBadge.querySelector('.badge-text').textContent = category;
  } else {
    DOM.categoryFilterBadge.classList.add('hidden');
  }
  applySearchAndFilters();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ----------------------------------------------------
// 4. Rendering Interface
// ----------------------------------------------------
function renderHymnsGrid() {
  DOM.hymnsGrid.innerHTML = '';
  
  if (filteredHymns.length === 0) {
    renderEmptyState();
    return;
  }
  
  filteredHymns.forEach(item => {
    const isFav = favorites.has(item.numero);
    
    // Extract first line of first stanza for preview
    let previewText = '';
    if (item.letra && item.letra.length > 0) {
      // Find the first non-empty line
      for (const section of item.letra) {
        if (section.lineas && section.lineas.length > 0) {
          previewText = section.lineas.slice(0, 2).join(' / ');
          break;
        }
      }
    }
    
    const card = document.createElement('article');
    card.className = 'hymn-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Himno número ${item.numero}, ${item.titulo}`);
    
    const sectionLabelClass = 'section-label';
    const sectionLabelText = 'Himno';
    
    card.innerHTML = `
      <div class="card-header">
        <div class="hymn-number-badge">${item.numero}</div>
        <span class="${sectionLabelClass}">${sectionLabelText}</span>
      </div>
      <h3 class="card-title">${item.titulo}</h3>
      <p class="card-preview">${previewText || ''}</p>
      <div class="card-footer">
        <span class="card-category" title="Filtrar por esta categoría">${item.categoria}</span>
        <button class="btn-card-fav ${isFav ? 'is-active' : ''}" aria-label="Guardar en favoritos" title="Agregar a favoritos">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </button>
      </div>
    `;
    
    // Click Card to Open Reader
    card.addEventListener('click', (e) => {
      // If clicking the favorite button, do not open reader
      if (e.target.closest('.btn-card-fav')) {
        toggleFavorite(item.numero);
        const favBtn = card.querySelector('.btn-card-fav');
        favBtn.classList.toggle('is-active', favorites.has(item.numero));
        // If we are currently in Favorites tab, we need to apply search filters to remove card
        if (activeFilter === 'favoritos') {
          applySearchAndFilters();
        }
        return;
      }
      openReader(item.numero);
    });
    
    // Keyboard accessibility for cards
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openReader(item.numero);
      }
    });

    // Clicking category filter trigger
    const categorySpan = card.querySelector('.card-category');
    categorySpan.addEventListener('click', (e) => {
      e.stopPropagation(); // Avoid card click
      setCategoryFilter(item.categoria);
    });
    
    DOM.hymnsGrid.appendChild(card);
  });
}

function renderEmptyState() {
  DOM.hymnsGrid.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.3-4.3"/>
      </svg>
      <h3>Sin resultados</h3>
      <p>No pudimos encontrar ningún himno que coincida con "${DOM.searchInput.value}".</p>
    </div>
  `;
}

function renderErrorState() {
  DOM.resultsCount.textContent = 'Error al cargar';
  DOM.hymnsGrid.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <h3>Error de carga</h3>
      <p>No se pudo establecer la conexión con la base de datos de himnos local ('himnos.json').</p>
    </div>
  `;
}

// ----------------------------------------------------
// 5. Immersive Reader Actions
// ----------------------------------------------------
function openReader(hymnNumber) {
  const hymn = hymnsData.find(h => h.numero === hymnNumber);
  if (!hymn) return;
  
  activeHymn = hymn;
  
  // Render Metadata
  DOM.readerCategory.textContent = hymn.categoria;
  DOM.readerNumber.textContent = hymn.numero;
  DOM.readerTitle.textContent = hymn.titulo;
  
  // Update Fav Icon in Reader Bar
  DOM.readerFavBtn.classList.toggle('is-active', favorites.has(hymn.numero));
  
  // Render Lyrics Content
  DOM.readerLyrics.innerHTML = '';
  DOM.readerLyrics.style.setProperty('--lyrics-font-size', `${fontLyricsSize}px`);
  
  hymn.letra.forEach(section => {
    const sectionDiv = document.createElement('div');
    
    if (section.tipo === 'coro') {
      sectionDiv.className = 'lyric-stanza is-chorus';
      sectionDiv.setAttribute('aria-label', 'Coro');
    } else {
      sectionDiv.className = 'lyric-stanza has-number';
      sectionDiv.setAttribute('data-number', section.numero || '');
      sectionDiv.setAttribute('aria-label', `Estrofa ${section.numero || ''}`);
    }
    
    section.lineas.forEach(line => {
      const lineSpan = document.createElement('span');
      lineSpan.className = 'lyric-line';
      lineSpan.textContent = line;
      sectionDiv.appendChild(lineSpan);
    });
    
    DOM.readerLyrics.appendChild(sectionDiv);
  });
  
  // Cargar Audio si existe en la base de datos de pistas
  if (DOM.readerAudio && DOM.readerAudioContainer) {
    // Buscar la pista por el número de himno (numérico)
    const pista = pistasData.find(p => parseInt(p.numero) === parseInt(hymn.numero));
    if (pista) {
      DOM.readerAudioContainer.classList.remove('hidden');
      
      // Limpiar título para nombre de archivo válido en Windows
      const cleanTitle = pista.titulo.replace(/[\\\/\:\*\?\"\<\>\|]/g, '');
      const localUrl = `pistas/${pista.numero} - ${cleanTitle}.mp3`;
      const fallbackUrl = pista.url;
      
      // Configurar enlace de descarga
      if (DOM.playerDownloadLink) {
        DOM.playerDownloadLink.href = fallbackUrl;
        DOM.playerDownloadLink.download = `${pista.numero} - ${cleanTitle}.mp3`;
      }

      // Reiniciar velocidad de reproducción a 1.0x
      DOM.readerAudio.playbackRate = 1.0;
      if (DOM.speedSlider) {
        DOM.speedSlider.value = 1.0;
      }
      if (DOM.speedDisplay) {
        DOM.speedDisplay.textContent = '1.00x';
      }
      if (DOM.speedPresets) {
        DOM.speedPresets.forEach(btn => {
          const speed = parseFloat(btn.getAttribute('data-speed'));
          btn.classList.toggle('active', speed === 1.0);
        });
      }

      // Inicializar volumen
      DOM.readerAudio.volume = audioVolume;
      DOM.readerAudio.muted = false;
      if (DOM.playerVolumeSlider) {
        DOM.playerVolumeSlider.value = Math.round(audioVolume * 100);
      }
      if (DOM.volumeDisplay) {
        DOM.volumeDisplay.textContent = `${Math.round(audioVolume * 100)}%`;
      }
      updateVolumeMuteIcons(false);

      // Asegurar que el menú de opciones esté cerrado
      if (DOM.playerOptionsMenu) {
        DOM.playerOptionsMenu.classList.add('hidden');
      }

      // Inicializar textos y controles de tiempo
      if (DOM.playerTime) {
        DOM.playerTime.textContent = '0:00 / 0:00';
      }
      if (DOM.playerProgress) {
        DOM.playerProgress.value = 0;
        updateSliderBackground(0);
      }
      setAudioPlayState(false);

      DOM.readerAudio.src = encodeURI(localUrl);
      DOM.readerAudio.load();
      
      // Fallback a URL remota si no está descargado localmente
      DOM.readerAudio.onerror = function() {
        const currentSrc = DOM.readerAudio.src;
        // Solo intentar fallback si la URL de origen no empieza con http
        if (currentSrc && !currentSrc.startsWith('http') && currentSrc !== fallbackUrl) {
          console.warn(`Pista local no encontrada. Usando URL de respaldo remota: ${fallbackUrl}`);
          DOM.readerAudio.src = fallbackUrl;
          DOM.readerAudio.load();
        }
      };
    } else {
      DOM.readerAudioContainer.classList.add('hidden');
      DOM.readerAudio.src = '';
    }
  }
  
  // Show Reader Overlay Modal
  DOM.readerModal.classList.remove('hidden');
  DOM.readerModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  
  // Scroll to Top of reader
  DOM.viewport.scrollTop = 0;
  
  // Update Nav Buttons
  updateReaderNavigationState();
}

function closeReader() {
  if (DOM.readerAudio) {
    DOM.readerAudio.pause();
    DOM.readerAudio.src = '';
  }

  if (DOM.playerOptionsMenu) {
    DOM.playerOptionsMenu.classList.add('hidden');
  }

  if (isPresentationMode) {
    exitPresentationMode(true);
  }
  
  DOM.readerModal.classList.add('hidden');
  DOM.readerModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  activeHymn = null;
  
  // If we unfavorited items inside the reader under the Favorites tab, rerender list
  if (activeFilter === 'favoritos') {
    applySearchAndFilters();
  }
}

function updateReaderNavigationState() {
  if (!activeHymn) return;
  
  // Find index in current active FILTERED list to allow continuous swipe/next in current filters
  const idx = filteredHymns.findIndex(h => h.numero === activeHymn.numero);
  const total = filteredHymns.length;
  
  if (idx !== -1) {
    DOM.readerProgress.textContent = `${idx + 1} de ${total}`;
    
    // Enable/disable arrows
    DOM.prevHymnBtn.disabled = idx === 0;
    DOM.nextHymnBtn.disabled = idx === total - 1;
  } else {
    // If not found in current filtered lists (e.g. category filter active, but deep links), navigate global database
    const globalIdx = hymnsData.findIndex(h => h.numero === activeHymn.numero);
    DOM.readerProgress.textContent = `${globalIdx + 1} de ${hymnsData.length}`;
    DOM.prevHymnBtn.disabled = globalIdx === 0;
    DOM.nextHymnBtn.disabled = globalIdx === hymnsData.length - 1;
  }
}

function navigateReader(direction) {
  if (!activeHymn) return;
  
  if (DOM.readerAudio) {
    DOM.readerAudio.pause();
    DOM.readerAudio.src = '';
  }
  
  // Locate in current filtered list
  let currentList = filteredHymns;
  let idx = currentList.findIndex(h => h.numero === activeHymn.numero);
  
  // Fallback to global list if active isn't in filter list (highly unlikely)
  if (idx === -1) {
    currentList = hymnsData;
    idx = currentList.findIndex(h => h.numero === activeHymn.numero);
  }
  
  const targetIdx = idx + direction;
  if (targetIdx >= 0 && targetIdx < currentList.length) {
    // Animate reader content refresh (slide out and slide in)
    DOM.readerLyrics.style.opacity = '0';
    DOM.readerLyrics.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
      openReader(currentList[targetIdx].numero);
      DOM.readerLyrics.style.opacity = '1';
      DOM.readerLyrics.style.transform = 'translateY(0)';
    }, 150);
  }
}

// ----------------------------------------------------
// 6. Favorites and Font Scaling Systems
// ----------------------------------------------------
function toggleFavorite(num) {
  if (favorites.has(num)) {
    favorites.delete(num);
  } else {
    favorites.add(num);
  }
  saveFavorites();
}

function toggleReaderActiveFavorite() {
  if (!activeHymn) return;
  toggleFavorite(activeHymn.numero);
  DOM.readerFavBtn.classList.toggle('is-active', favorites.has(activeHymn.numero));
  
  // Synchronize state back to cards
  const cards = document.querySelectorAll('.hymn-card');
  cards.forEach(card => {
    const badge = card.querySelector('.hymn-number-badge');
    if (badge && parseInt(badge.textContent) === activeHymn.numero) {
      const favBtn = card.querySelector('.btn-card-fav');
      if (favBtn) favBtn.classList.toggle('is-active', favorites.has(activeHymn.numero));
    }
  });
}

function changeFontSize(amount) {
  const maxLimit = isPresentationMode ? 48 : 32;
  fontLyricsSize = Math.max(14, Math.min(maxLimit, fontLyricsSize + amount));
  updateFontSizeControls();
  DOM.readerLyrics.style.setProperty('--lyrics-font-size', `${fontLyricsSize}px`);
  localStorage.setItem('hymnario-fontsize', fontLyricsSize);
}

function updateFontSizeControls() {
  const maxLimit = isPresentationMode ? 48 : 32;
  DOM.fontSizeDisplay.textContent = `${fontLyricsSize}px`;
  DOM.fontDecrease.disabled = fontLyricsSize <= 14;
  DOM.fontIncrease.disabled = fontLyricsSize >= maxLimit;
}

// ----------------------------------------------------
// 7. Event Handlers & Subscriptions
// ----------------------------------------------------
function registerEventListeners() {
  console.log('Registering event listeners...');
  // Theme Click
  if (DOM.themeToggle) DOM.themeToggle.addEventListener('click', toggleTheme);
  
  // Search Key Inputs
  if (DOM.searchInput) {
    DOM.searchInput.addEventListener('input', () => {
      const val = DOM.searchInput.value;
      if (DOM.clearSearch) DOM.clearSearch.classList.toggle('hidden', val === '');
      applySearchAndFilters();
    });
  }
  
  // Clear search input
  if (DOM.clearSearch && DOM.searchInput) {
    DOM.clearSearch.addEventListener('click', () => {
      DOM.searchInput.value = '';
      DOM.clearSearch.classList.add('hidden');
      applySearchAndFilters();
      DOM.searchInput.focus();
    });
  }
  
  // Favorites view toggle (Heart icon in top header)
  if (DOM.favoritesToggle) {
    DOM.favoritesToggle.addEventListener('click', () => {
      // Toggle tab btn activation
      if (DOM.filterTabs) {
        DOM.filterTabs.forEach(btn => {
          const isFav = btn.getAttribute('data-filter') === 'favoritos';
          btn.classList.toggle('active', isFav);
        });
      }
      activeFilter = 'favoritos';
      hidePdfViewer();
      applySearchAndFilters();
    });
  }
  
  // Section Filters Tabs
  if (DOM.filterTabs) {
    DOM.filterTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        DOM.filterTabs.forEach(btn => btn.classList.remove('active'));
        tab.classList.add('active');
        const filter = tab.getAttribute('data-filter');
        
        if (filter === 'pdf') {
          // Switch to PDF view
          activeFilter = 'pdf';
          showPdfViewer();
        } else {
          // Switch back to hymns view
          activeFilter = filter;
          hidePdfViewer();
          applySearchAndFilters();
        }
      });
    });
  }
  
  // Category Badge close button
  if (DOM.categoryFilterBadge) {
    const removeBtn = DOM.categoryFilterBadge.querySelector('.remove-badge-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        setCategoryFilter(null);
      });
    }
  }

  // Range Badge close button
  if (DOM.rangeFilterBadge) {
    const removeBtn = DOM.rangeFilterBadge.querySelector('.remove-badge-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        setRangeFilter(null);
      });
    }
  }
  
  // Drawer Open/Close
  if (DOM.indexToggle) {
    console.log('Found indexToggle button, binding click...');
    DOM.indexToggle.addEventListener('click', openDrawer);
  } else {
    console.warn('indexToggle button not found in DOM!');
  }
  if (DOM.closeDrawer) DOM.closeDrawer.addEventListener('click', closeDrawer);
  if (DOM.indexDrawer) {
    const backdrop = DOM.indexDrawer.querySelector('.drawer-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeDrawer);
  }
  
  // Close Reader Modal
  if (DOM.closeReader) DOM.closeReader.addEventListener('click', closeReader);
  if (DOM.readerFavBtn) DOM.readerFavBtn.addEventListener('click', toggleReaderActiveFavorite);
  
  // Font Resizing Buttons
  if (DOM.fontDecrease) DOM.fontDecrease.addEventListener('click', () => changeFontSize(-2));
  if (DOM.fontIncrease) DOM.fontIncrease.addEventListener('click', () => changeFontSize(2));
  
  // Left/Right Nav Arrows inside Reader
  if (DOM.prevHymnBtn) DOM.prevHymnBtn.addEventListener('click', () => navigateReader(-1));
  if (DOM.nextHymnBtn) DOM.nextHymnBtn.addEventListener('click', () => navigateReader(1));
  
  // Back key gestures (Escape closes reader / drawer / fullscreen PDF)
  document.addEventListener('keydown', (e) => {
    // Fullscreen PDF modal has highest priority
    if (pdfFsOpen && DOM.pdfFsModal && !DOM.pdfFsModal.classList.contains('hidden')) {
      if (e.key === 'Escape') {
        closePdfFullscreen();
      }
    } else if (DOM.readerModal && !DOM.readerModal.classList.contains('hidden')) {
      if (e.key === 'Escape') {
        closeReader();
      } else if (e.key === 'ArrowLeft' && DOM.prevHymnBtn && !DOM.prevHymnBtn.disabled) {
        navigateReader(-1);
      } else if (e.key === 'ArrowRight' && DOM.nextHymnBtn && !DOM.nextHymnBtn.disabled) {
        navigateReader(1);
      }
    } else if (DOM.indexDrawer && !DOM.indexDrawer.classList.contains('hidden')) {
      if (e.key === 'Escape') {
        closeDrawer();
      }
    }
  });

  // Clicking Category link inside Reader closes reader and filters by category!
  if (DOM.readerCategory) {
    DOM.readerCategory.addEventListener('click', () => {
      if (!activeHymn) return;
      const cat = activeHymn.categoria;
      closeReader();
      setCategoryFilter(cat);
    });
  }

  // Custom Audio Player Listeners
  if (DOM.playerPlayBtn && DOM.readerAudio) {
    DOM.playerPlayBtn.addEventListener('click', toggleAudioPlay);
  }
  
  if (DOM.readerAudio) {
    DOM.readerAudio.addEventListener('timeupdate', updateAudioProgress);
    DOM.readerAudio.addEventListener('loadedmetadata', initAudioDuration);
    DOM.readerAudio.addEventListener('durationchange', initAudioDuration);
    DOM.readerAudio.addEventListener('play', () => setAudioPlayState(true));
    DOM.readerAudio.addEventListener('pause', () => setAudioPlayState(false));
    DOM.readerAudio.addEventListener('ended', () => {
      setAudioPlayState(false);
      if (DOM.playerProgress) {
        DOM.playerProgress.value = 0;
        updateSliderBackground(0);
      }
    });
  }

  if (DOM.playerProgress && DOM.readerAudio) {
    DOM.playerProgress.addEventListener('input', (e) => {
      const targetTime = (e.target.value / 100) * DOM.readerAudio.duration;
      if (!isNaN(targetTime)) {
        // Actualizar el tiempo transcurrido en texto mientras arrastra
        if (DOM.playerTime) {
          DOM.playerTime.textContent = `${formatTime(targetTime)} / ${formatTime(DOM.readerAudio.duration)}`;
        }
        // Actualizar el degradado del slider
        updateSliderBackground(e.target.value);
      }
    });

    DOM.playerProgress.addEventListener('change', (e) => {
      const targetTime = (e.target.value / 100) * DOM.readerAudio.duration;
      if (!isNaN(targetTime)) {
        DOM.readerAudio.currentTime = targetTime;
      }
    });
  }

  // Volume slider event
  if (DOM.playerVolumeSlider) {
    DOM.playerVolumeSlider.addEventListener('input', (e) => {
      const volPercent = parseInt(e.target.value);
      if (DOM.readerAudio) {
        audioVolume = volPercent / 100;
        DOM.readerAudio.volume = audioVolume;
        localStorage.setItem('hymnario-volume', audioVolume.toString());
        
        if (DOM.volumeDisplay) {
          DOM.volumeDisplay.textContent = `${volPercent}%`;
        }
        
        const isMuted = volPercent === 0;
        DOM.readerAudio.muted = isMuted;
        updateVolumeMuteIcons(isMuted);
      }
    });
  }

  // Volume button clicks (both main bar and menu button)
  const volButtons = [DOM.playerVolumeBtn, DOM.menuVolumeBtn];
  volButtons.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        toggleAudioMute();
      });
    }
  });

  if (DOM.playerOptionsBtn && DOM.playerOptionsMenu) {
    DOM.playerOptionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = DOM.playerOptionsMenu.classList.toggle('hidden');
      if (!isHidden) {
        // Asegurar que el menú completo sea visible desplazando el contenedor si es necesario
        setTimeout(() => {
          DOM.playerOptionsMenu.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (DOM.playerOptionsMenu && !DOM.playerOptionsMenu.classList.contains('hidden')) {
        if (!e.target.closest('#player-options-btn') && !e.target.closest('#player-options-menu')) {
          DOM.playerOptionsMenu.classList.add('hidden');
        }
      }
    });
  }

  // Playback Speed Slider Event
  if (DOM.speedSlider) {
    DOM.speedSlider.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      if (DOM.readerAudio && !isNaN(speed)) {
        DOM.readerAudio.playbackRate = speed;
        if (DOM.speedDisplay) {
          DOM.speedDisplay.textContent = `${speed.toFixed(2)}x`;
        }
        // Sync presets highlighting
        if (DOM.speedPresets) {
          DOM.speedPresets.forEach(btn => {
            const btnSpeed = parseFloat(btn.getAttribute('data-speed'));
            btn.classList.toggle('active', Math.abs(btnSpeed - speed) < 0.01);
          });
        }
      }
    });
  }

  // Playback Speed Presets Events
  if (DOM.speedPresets) {
    DOM.speedPresets.forEach(opt => {
      opt.addEventListener('click', () => {
        const speed = parseFloat(opt.getAttribute('data-speed'));
        if (DOM.readerAudio && !isNaN(speed)) {
          DOM.readerAudio.playbackRate = speed;
          
          if (DOM.speedSlider) {
            DOM.speedSlider.value = speed;
          }
          if (DOM.speedDisplay) {
            DOM.speedDisplay.textContent = `${speed.toFixed(2)}x`;
          }
          
          DOM.speedPresets.forEach(btn => {
            const btnSpeed = parseFloat(btn.getAttribute('data-speed'));
            btn.classList.toggle('active', btnSpeed === speed);
          });
          
          // Ocultar menú tras seleccionar preajuste
          if (DOM.playerOptionsMenu) {
            DOM.playerOptionsMenu.classList.add('hidden');
          }
        }
      });
    });
  }

  // Presentation Mode Toggle Listeners
  if (DOM.presentationToggle) {
    DOM.presentationToggle.addEventListener('click', togglePresentationMode);
  }

  // Auto-hide controls in presentation mode on mousemove/touchstart
  if (DOM.readerContainer) {
    const resetControlsTimer = () => {
      if (!isPresentationMode) return;
      showPresentationControls();
      clearTimeout(controlsTimeout);
      controlsTimeout = setTimeout(hidePresentationControls, 3000);
    };

    DOM.readerContainer.addEventListener('mousemove', resetControlsTimer);
    DOM.readerContainer.addEventListener('touchstart', resetControlsTimer);
  }

  // Handle native browser fullscreen exit (e.g. via system escape key)
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isPresentationMode) {
      exitPresentationMode(false); // sync state without trying to call document.exitFullscreen again
    }
  });
}

// ----------------------------------------------------
// 8. Sidebar Drawer & Index Filtering Systems
// ----------------------------------------------------
function openDrawer() {
  console.log('openDrawer triggered');
  if (DOM.indexDrawer) {
    DOM.indexDrawer.classList.remove('hidden');
    DOM.indexDrawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    console.log('Drawer classes updated to show drawer');
  } else {
    console.error('DOM.indexDrawer is null, cannot open');
  }
}

function closeDrawer() {
  console.log('closeDrawer triggered');
  if (DOM.indexDrawer) {
    DOM.indexDrawer.classList.add('hidden');
    DOM.indexDrawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    console.log('Drawer classes updated to hide drawer');
  } else {
    console.error('DOM.indexDrawer is null, cannot close');
  }
}

function setRangeFilter(range) {
  activeRange = range;
  activeCategory = null;
  DOM.categoryFilterBadge.classList.add('hidden');
  
  // Reset tab to 'all' to ensure range items are shown
  activeFilter = 'all';
  DOM.filterTabs.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === 'all');
  });
  
  if (range) {
    DOM.rangeFilterBadge.classList.remove('hidden');
    DOM.rangeFilterBadge.querySelector('.badge-text').textContent = `${range.name} (${range.start}-${range.end})`;
  } else {
    DOM.rangeFilterBadge.classList.add('hidden');
  }
  applySearchAndFilters();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const INDEX_SECTIONS = [
  {
    title: "DIOS",
    items: [
      { name: "La Santa Trinidad", start: 1, end: 7 },
      { name: "El Padre (Creación, Providencia)", start: 8, end: 17 },
      {
        name: "El Hijo",
        subitems: [
          { name: "Su Alabanza", start: 18, end: 27 },
          { name: "Su Natividad", start: 28, end: 40 },
          { name: "Sus Sufrimientos y Muerte", start: 41, end: 56 },
          { name: "Su Resurrección y Ascensión", start: 57, end: 70 }
        ]
      },
      { name: "Su Segunda Venida", start: 71, end: 83 },
      { name: "El Espíritu Santo", start: 84, end: 93 }
    ]
  },
  {
    title: "LA VIDA EN CRISTO",
    items: [
      { name: "Arrepentimiento y Fe", start: 94, end: 103 },
      { name: "Paz y Gozo", start: 104, end: 111 },
      { name: "Amor y Gratitud", start: 112, end: 119 },
      { name: "Oración", start: 120, end: 128 },
      { name: "Consagración y Santificación", start: 129, end: 146 },
      { name: "Sanidad Divina", start: 147, end: 150 },
      { name: "Confianza y Sumisión", start: 151, end: 172 },
      { name: "Peregrinación, Protección", start: 173, end: 190 },
      { name: "Conflicto y Lucha", start: 191, end: 206 },
      { name: "Muerte y Vida Eterna", start: 207, end: 219 }
    ]
  },
  {
    title: "LA IGLESIA",
    items: [
      { name: "La Iglesia", start: 220, end: 225 },
      { name: "Las Sagradas Escrituras", start: 226, end: 230 },
      { name: "El Día del Señor", start: 231, end: 233 },
      { name: "Bautismo", start: 234, end: 238 },
      { name: "La Santa Cena", start: 239, end: 242 },
      { name: "Misiones", start: 243, end: 254 },
      { name: "Servicio", start: 255, end: 262 },
      { name: "Testimonio", start: 263, end: 284 },
      { name: "Culto Evangelístico", start: 285, end: 306 },
      { name: "Avivamiento", start: 307, end: 310 },
      { name: "Invitación", start: 311, end: 325 },
      { name: "Niñez", start: 326, end: 330 },
      { name: "Juventud", start: 331, end: 335 },
      { name: "Ocasiones Especiales", start: 336, end: 350 }
    ]
  }
];

function renderIndexDrawer() {
  DOM.drawerBody.innerHTML = '';
  
  INDEX_SECTIONS.forEach(section => {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'index-section';
    
    const title = document.createElement('div');
    title.className = 'index-section-title';
    title.textContent = section.title;
    sectionDiv.appendChild(title);
    
    const list = document.createElement('ul');
    list.className = 'index-list';
    
    section.items.forEach(item => {
      const listItem = document.createElement('li');
      
      if (item.subitems) {
        listItem.className = 'index-item-group';
        
        const subTitle = document.createElement('div');
        subTitle.className = 'index-subitem-title';
        subTitle.textContent = item.name;
        listItem.appendChild(subTitle);
        
        const sublist = document.createElement('ul');
        sublist.className = 'index-sublist';
        
        item.subitems.forEach(subitem => {
          const subListItem = document.createElement('li');
          const btn = createIndexButton(subitem);
          subListItem.appendChild(btn);
          sublist.appendChild(subListItem);
        });
        
        listItem.appendChild(sublist);
      } else {
        const btn = createIndexButton(item);
        listItem.appendChild(btn);
      }
      
      list.appendChild(listItem);
    });
    
    sectionDiv.appendChild(list);
    DOM.drawerBody.appendChild(sectionDiv);
  });
}

function createIndexButton(item) {
  const btn = document.createElement('button');
  btn.className = 'index-item-btn';
  btn.innerHTML = `
    <span>${item.name}</span>
    <span class="index-item-range">${item.start}-${item.end}</span>
  `;
  
  btn.addEventListener('click', () => {
    setRangeFilter({ start: item.start, end: item.end, name: item.name });
    closeDrawer();
  });
  
  return btn;
}

// ----------------------------------------------------
// 9. Custom Audio Player Helper Functions
// ----------------------------------------------------
function toggleAudioPlay() {
  if (!DOM.readerAudio) return;
  if (DOM.readerAudio.paused) {
    DOM.readerAudio.play().catch(err => {
      console.warn("Autoplay block or audio load failure: ", err);
    });
  } else {
    DOM.readerAudio.pause();
  }
}

function setAudioPlayState(isPlaying) {
  if (!DOM.iconPlay || !DOM.iconPause) return;
  if (isPlaying) {
    DOM.iconPlay.classList.add('hidden');
    DOM.iconPause.classList.remove('hidden');
  } else {
    DOM.iconPlay.classList.remove('hidden');
    DOM.iconPause.classList.add('hidden');
  }
}

function formatTime(secs) {
  if (isNaN(secs) || secs === Infinity) return '0:00';
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function initAudioDuration() {
  if (!DOM.readerAudio || !DOM.playerTime) return;
  const duration = DOM.readerAudio.duration;
  DOM.playerTime.textContent = `0:00 / ${formatTime(duration)}`;
  if (DOM.playerProgress) {
    DOM.playerProgress.value = 0;
    updateSliderBackground(0);
  }
}

function updateAudioProgress() {
  if (!DOM.readerAudio || !DOM.playerProgress || !DOM.playerTime) return;
  const current = DOM.readerAudio.currentTime;
  const duration = DOM.readerAudio.duration;
  
  if (!isNaN(duration) && duration > 0) {
    const percent = (current / duration) * 100;
    DOM.playerProgress.value = percent;
    updateSliderBackground(percent);
    DOM.playerTime.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  }
}

function updateSliderBackground(percent) {
  if (DOM.playerProgress) {
    DOM.playerProgress.style.setProperty('--progress-percent', `${percent}%`);
  }
}

function toggleAudioMute() {
  if (!DOM.readerAudio) return;
  DOM.readerAudio.muted = !DOM.readerAudio.muted;
  
  const isMuted = DOM.readerAudio.muted;
  updateVolumeMuteIcons(isMuted);
  
  if (DOM.playerVolumeSlider && DOM.volumeDisplay) {
    if (isMuted) {
      DOM.playerVolumeSlider.value = 0;
      DOM.volumeDisplay.textContent = 'Mudo';
    } else {
      const volPercent = Math.round(audioVolume * 100);
      DOM.playerVolumeSlider.value = volPercent > 0 ? volPercent : 100;
      if (volPercent === 0) {
        audioVolume = 1.0;
        DOM.readerAudio.volume = 1.0;
        localStorage.setItem('hymnario-volume', '1.0');
        DOM.playerVolumeSlider.value = 100;
      }
      DOM.volumeDisplay.textContent = `${DOM.playerVolumeSlider.value}%`;
    }
  }
}

function updateVolumeMuteIcons(isMuted) {
  if (DOM.iconVolume && DOM.iconVolumeMuted) {
    DOM.iconVolume.classList.toggle('hidden', isMuted);
    DOM.iconVolumeMuted.classList.toggle('hidden', !isMuted);
  }
  if (DOM.menuIconVol && DOM.menuIconVolMuted) {
    DOM.menuIconVol.classList.toggle('toggle-hidden', isMuted); // wait, let's use hidden like the others
    DOM.menuIconVol.classList.toggle('hidden', isMuted);
    DOM.menuIconVolMuted.classList.toggle('hidden', !isMuted);
  }
}

// ----------------------------------------------------
// 10. Presentation Mode & Fullscreen Functions
// ----------------------------------------------------
function togglePresentationMode() {
  if (isPresentationMode) {
    exitPresentationMode(true);
  } else {
    enterPresentationMode();
  }
}

function enterPresentationMode() {
  if (!DOM.readerContainer) return;
  
  isPresentationMode = true;
  DOM.readerContainer.classList.add('is-presentation');
  
  if (DOM.presentationToggle) {
    DOM.presentationToggle.classList.add('is-active');
    DOM.presentationToggle.title = 'Salir del modo presentación';
  }

  // Actualizar controles de fuente para reflejar el límite de tamaño de 48px
  updateFontSizeControls();

  // Activar pantalla completa nativa del navegador sobre el lector
  if (DOM.readerContainer.requestFullscreen) {
    DOM.readerContainer.requestFullscreen().catch(err => {
      console.warn("Error al intentar activar pantalla completa:", err);
    });
  } else if (DOM.readerContainer.webkitRequestFullscreen) { /* Safari */
    DOM.readerContainer.webkitRequestFullscreen();
  } else if (DOM.readerContainer.msRequestFullscreen) { /* IE11 */
    DOM.readerContainer.msRequestFullscreen();
  }

  // Inicializar temporizador para ocultar controles
  showPresentationControls();
  clearTimeout(controlsTimeout);
  controlsTimeout = setTimeout(hidePresentationControls, 3000);
}

function exitPresentationMode(requestBrowserExit = true) {
  isPresentationMode = false;
  clearTimeout(controlsTimeout);
  
  if (DOM.readerContainer) {
    DOM.readerContainer.classList.remove('is-presentation');
  }
  
  if (DOM.presentationToggle) {
    DOM.presentationToggle.classList.remove('is-active');
    DOM.presentationToggle.title = 'Activar modo presentación';
  }

  showPresentationControls();

  // Limitar el tamaño de letra máximo al límite normal (32px) al salir del modo presentación
  if (fontLyricsSize > 32) {
    fontLyricsSize = 32;
    if (DOM.readerLyrics) {
      DOM.readerLyrics.style.setProperty('--lyrics-font-size', `${fontLyricsSize}px`);
    }
    localStorage.setItem('hymnario-fontsize', fontLyricsSize);
  }
  updateFontSizeControls();

  // Salir de pantalla completa nativa del navegador si está activa
  if (requestBrowserExit && document.fullscreenElement) {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => {
        console.warn("Error al intentar salir de pantalla completa:", err);
      });
    } else if (document.webkitExitFullscreen) { /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
      document.msExitFullscreen();
    }
  }
}

function hidePresentationControls() {
  if (!isPresentationMode) return;
  if (DOM.readerBar) DOM.readerBar.classList.add('controls-hidden');
  if (DOM.readerFooter) DOM.readerFooter.classList.add('controls-hidden');
}

function showPresentationControls() {
  if (DOM.readerBar) DOM.readerBar.classList.remove('controls-hidden');
  if (DOM.readerFooter) DOM.readerFooter.classList.remove('controls-hidden');
}

// ----------------------------------------------------
// 11. PDF Viewer Module
// ----------------------------------------------------

/**
 * Shows the PDF viewer section and hides the hymn grid.
 * Initializes PDF loading on first access.
 */
function showPdfViewer() {
  // Hide hymns content
  if (DOM.hymnsGrid) DOM.hymnsGrid.classList.add('hidden');
  if (DOM.statusBar) DOM.statusBar.classList.add('hidden');

  // Show PDF section
  if (DOM.pdfSection) {
    DOM.pdfSection.classList.remove('hidden');
    // Re-trigger entry animation
    DOM.pdfSection.style.animation = 'none';
    DOM.pdfSection.offsetHeight; // force reflow
    DOM.pdfSection.style.animation = '';
  }

  // Load PDF on first access
  if (!pdfLoaded && !pdfDoc) {
    initPdfViewer();
  } else if (pdfDoc) {
    // Re-observe pages if returning to the tab
    reobservePdfPages();
  }
}

/**
 * Hides the PDF viewer section and restores the hymn grid.
 */
function hidePdfViewer() {
  if (DOM.pdfSection) DOM.pdfSection.classList.add('hidden');
  if (DOM.hymnsGrid) DOM.hymnsGrid.classList.remove('hidden');
  if (DOM.statusBar) DOM.statusBar.classList.remove('hidden');

  // Hide floating indicator
  if (pdfFloatingIndicator) {
    pdfFloatingIndicator.classList.remove('is-visible');
  }

  // Disconnect observer to save resources while not viewing
  if (pdfObserver) {
    pdfObserver.disconnect();
  }
}

/**
 * Initializes PDF.js and loads the document.
 */
async function initPdfViewer() {
  if (typeof pdfjsLib === 'undefined') {
    console.error('PDF.js library not loaded');
    showPdfError('No se pudo cargar la biblioteca PDF.js');
    return;
  }

  // Set worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  // Show loading state
  if (DOM.pdfLoading) DOM.pdfLoading.classList.remove('hidden');
  if (DOM.pdfPagesContainer) DOM.pdfPagesContainer.innerHTML = '';

  try {
    const loadingTask = pdfjsLib.getDocument({
      url: 'himnario.pdf',
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true,
    });

    // Track loading progress
    loadingTask.onProgress = (progress) => {
      if (progress.total > 0 && DOM.pdfProgressFill) {
        const percent = Math.min(100, (progress.loaded / progress.total) * 100);
        DOM.pdfProgressFill.style.width = `${percent}%`;
      }
    };

    pdfDoc = await loadingTask.promise;
    pdfTotalPages = pdfDoc.numPages;
    pdfLoaded = true;

    console.log(`PDF loaded: ${pdfTotalPages} pages`);

    // Update UI
    if (DOM.pdfPageTotal) DOM.pdfPageTotal.textContent = `/ ${pdfTotalPages}`;
    if (DOM.pdfGotoInput) DOM.pdfGotoInput.max = pdfTotalPages;

    // Get page dimensions for all pages (for proper skeleton sizing)
    await fetchPageDimensions();

    // Create page placeholders
    createPagePlaceholders();

    // Hide loading
    if (DOM.pdfLoading) DOM.pdfLoading.classList.add('hidden');

    // Create floating indicator
    createFloatingIndicator();

    // Setup Intersection Observer for lazy rendering
    setupPdfObserver();

    // Register PDF viewer event listeners
    registerPdfEventListeners();

  } catch (error) {
    console.error('Failed to load PDF:', error);
    showPdfError('No se pudo cargar el himnario PDF. Verifica que el archivo "himnario.pdf" exista en la carpeta del proyecto.');
  }
}

/**
 * Fetches the viewport dimensions for all pages.
 */
async function fetchPageDimensions() {
  pdfPageDimensions = [];
  // Fetch first page to get base dimensions (most PDFs have uniform pages)
  const firstPage = await pdfDoc.getPage(1);
  const baseViewport = firstPage.getViewport({ scale: 1.0 });

  // Use first page dimensions for all pages as default
  for (let i = 0; i < pdfTotalPages; i++) {
    pdfPageDimensions.push({
      width: baseViewport.width,
      height: baseViewport.height,
    });
  }
}

/**
 * Creates placeholder elements for all pages.
 */
function createPagePlaceholders() {
  if (!DOM.pdfPagesContainer) return;
  DOM.pdfPagesContainer.innerHTML = '';

  // Calculate container width for fit-to-width scaling
  const containerWidth = DOM.pdfPagesContainer.clientWidth - 2; // account for border

  for (let i = 0; i < pdfTotalPages; i++) {
    const pageNum = i + 1;
    const dim = pdfPageDimensions[i];
    const scale = pdfFitToWidth
      ? containerWidth / dim.width
      : pdfCurrentScale;
    const displayWidth = dim.width * scale;
    const displayHeight = dim.height * scale;

    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-page-skeleton';
    wrapper.setAttribute('data-page', pageNum);
    wrapper.setAttribute('data-page-label', `Página ${pageNum}`);
    wrapper.style.width = `${displayWidth}px`;
    wrapper.style.height = `${displayHeight}px`;

    DOM.pdfPagesContainer.appendChild(wrapper);
  }

  // Update zoom display
  if (pdfFitToWidth && pdfPageDimensions.length > 0) {
    const scale = containerWidth / pdfPageDimensions[0].width;
    pdfCurrentScale = scale;
    updateZoomDisplay();
  }
}

/**
 * Sets up the Intersection Observer for virtualized page rendering.
 */
function setupPdfObserver() {
  if (pdfObserver) pdfObserver.disconnect();

  pdfObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const pageNum = parseInt(entry.target.getAttribute('data-page'));

      if (entry.isIntersecting) {
        renderPdfPage(pageNum, entry.target);
        // Also render buffer pages (1 above, 1 below)
        renderBufferPages(pageNum);
      }
    });
  }, {
    root: null,
    rootMargin: '200px 0px', // pre-render pages 200px before they enter viewport
    threshold: 0.01,
  });

  // Observe all page placeholders/wrappers
  const pages = DOM.pdfPagesContainer.querySelectorAll('[data-page]');
  pages.forEach(page => pdfObserver.observe(page));

  // Setup scroll listener for page indicator
  window.addEventListener('scroll', handlePdfScroll, { passive: true });
}

/**
 * Renders buffer pages around the current visible page.
 */
function renderBufferPages(centerPage) {
  const bufferSize = 2;
  for (let offset = -bufferSize; offset <= bufferSize; offset++) {
    const page = centerPage + offset;
    if (page >= 1 && page <= pdfTotalPages && page !== centerPage) {
      const el = DOM.pdfPagesContainer.querySelector(`[data-page="${page}"]`);
      if (el) renderPdfPage(page, el);
    }
  }
}

/**
 * Renders a single PDF page into a canvas element.
 */
async function renderPdfPage(pageNum, element) {
  // Skip if already rendered or currently rendering
  if (pdfRenderedPages.has(pageNum) || pdfRenderingPages.has(pageNum)) return;
  if (!pdfDoc) return;

  pdfRenderingPages.add(pageNum);

  try {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: pdfCurrentScale });

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-page-wrapper';
    wrapper.setAttribute('data-page', pageNum);
    wrapper.style.width = `${viewport.width}px`;

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Use devicePixelRatio for sharp rendering on HiDPI screens
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    ctx.scale(dpr, dpr);

    // Page number badge
    const badge = document.createElement('span');
    badge.className = 'pdf-page-number';
    badge.textContent = pageNum;

    wrapper.appendChild(canvas);
    wrapper.appendChild(badge);

    // Replace the skeleton with the rendered wrapper
    element.replaceWith(wrapper);

    // Render the page
    await page.render({
      canvasContext: ctx,
      viewport: viewport,
    }).promise;

    pdfRenderedPages.add(pageNum);
    pdfRenderingPages.delete(pageNum);

    // Re-observe the new wrapper for potential unloading in future
    if (pdfObserver) pdfObserver.observe(wrapper);

  } catch (error) {
    console.warn(`Error rendering page ${pageNum}:`, error);
    pdfRenderingPages.delete(pageNum);
  }
}

/**
 * Re-observes all pages when returning to the PDF tab.
 */
function reobservePdfPages() {
  if (!pdfObserver || !DOM.pdfPagesContainer) return;
  const pages = DOM.pdfPagesContainer.querySelectorAll('[data-page]');
  pages.forEach(page => pdfObserver.observe(page));
}

/**
 * Handles scroll events to update the floating page indicator and go-to input.
 */
function handlePdfScroll() {
  if (activeFilter !== 'pdf' || !DOM.pdfPagesContainer) return;

  // Find the currently visible page
  const pages = DOM.pdfPagesContainer.querySelectorAll('[data-page]');
  let currentPage = 1;

  for (const page of pages) {
    const rect = page.getBoundingClientRect();
    if (rect.top <= window.innerHeight / 2 && rect.bottom > 0) {
      currentPage = parseInt(page.getAttribute('data-page'));
    }
  }

  // Update go-to input
  if (DOM.pdfGotoInput && document.activeElement !== DOM.pdfGotoInput) {
    DOM.pdfGotoInput.value = currentPage;
  }

  // Show floating indicator
  if (pdfFloatingIndicator) {
    pdfFloatingIndicator.textContent = `Página ${currentPage} de ${pdfTotalPages}`;
    pdfFloatingIndicator.classList.add('is-visible');
  }

  // Hide floating indicator after delay
  clearTimeout(pdfScrollTimeout);
  pdfScrollTimeout = setTimeout(() => {
    if (pdfFloatingIndicator) {
      pdfFloatingIndicator.classList.remove('is-visible');
    }
  }, 1500);
}

/**
 * Creates the floating page indicator element.
 */
function createFloatingIndicator() {
  if (pdfFloatingIndicator) return;
  pdfFloatingIndicator = document.createElement('div');
  pdfFloatingIndicator.className = 'pdf-floating-indicator';
  pdfFloatingIndicator.textContent = `Página 1 de ${pdfTotalPages}`;
  document.body.appendChild(pdfFloatingIndicator);
}

/**
 * Zoom in/out and re-render all visible pages.
 */
function pdfZoom(direction) {
  pdfFitToWidth = false;
  if (DOM.pdfFitWidth) DOM.pdfFitWidth.classList.remove('is-active');

  if (direction === 'in') {
    pdfCurrentScale = Math.min(pdfCurrentScale * 1.25, 5.0);
  } else {
    pdfCurrentScale = Math.max(pdfCurrentScale * 0.8, 0.3);
  }

  updateZoomDisplay();
  rebuildPdfPages();
}

/**
 * Fit pages to the container width.
 */
function pdfFitToWidthMode() {
  pdfFitToWidth = true;
  if (DOM.pdfFitWidth) DOM.pdfFitWidth.classList.add('is-active');

  const containerWidth = DOM.pdfPagesContainer.clientWidth - 2;
  if (pdfPageDimensions.length > 0) {
    pdfCurrentScale = containerWidth / pdfPageDimensions[0].width;
  }
  updateZoomDisplay();
  rebuildPdfPages();
}

/**
 * Updates the zoom percentage display.
 */
function updateZoomDisplay() {
  if (DOM.pdfZoomDisplay) {
    DOM.pdfZoomDisplay.textContent = `${Math.round(pdfCurrentScale * 100)}%`;
  }
}

/**
 * Rebuilds all page placeholders with new dimensions after zoom change.
 * Preserves scroll position relative to the current page.
 */
function rebuildPdfPages() {
  if (!DOM.pdfPagesContainer || pdfPageDimensions.length === 0) return;

  // Calculate relative scroll position before rebuilding
  const currentPage = parseInt(DOM.pdfGotoInput?.value) || 1;
  const target = DOM.pdfPagesContainer.querySelector(`[data-page="${currentPage}"]`);
  let relativeOffset = 0;
  
  if (target) {
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    relativeOffset = (window.scrollY - targetTop) / target.offsetHeight;
  }

  // Clear rendered state
  pdfRenderedPages.clear();
  pdfRenderingPages.clear();

  // Disconnect observer
  if (pdfObserver) pdfObserver.disconnect();

  // Rebuild placeholders
  createPagePlaceholders();

  // Re-setup observer
  setupPdfObserver();

  // Restore exact scroll position
  if (target) {
    setTimeout(() => {
      const newTarget = DOM.pdfPagesContainer.querySelector(`[data-page="${currentPage}"]`);
      if (newTarget) {
        const newTargetTop = newTarget.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: newTargetTop + (relativeOffset * newTarget.offsetHeight),
          behavior: 'instant'
        });
      }
    }, 0);
  }
}

/**
 * Scrolls to a specific page.
 */
function goToPdfPage(pageNum) {
  pageNum = Math.max(1, Math.min(pdfTotalPages, pageNum));
  const target = DOM.pdfPagesContainer?.querySelector(`[data-page="${pageNum}"]`);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (DOM.pdfGotoInput) DOM.pdfGotoInput.value = pageNum;
}

/**
 * Shows a PDF loading error message.
 */
function showPdfError(message) {
  if (DOM.pdfLoading) DOM.pdfLoading.classList.add('hidden');
  if (DOM.pdfPagesContainer) {
    DOM.pdfPagesContainer.innerHTML = `
      <div class="empty-state" style="padding: var(--spacing-xxl)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <h3>Error al cargar</h3>
        <p>${message}</p>
      </div>
    `;
  }
}

/**
 * Registers event listeners for PDF viewer controls.
 */
function registerPdfEventListeners() {
  // Zoom controls
  if (DOM.pdfZoomIn) {
    DOM.pdfZoomIn.addEventListener('click', () => pdfZoom('in'));
  }
  if (DOM.pdfZoomOut) {
    DOM.pdfZoomOut.addEventListener('click', () => pdfZoom('out'));
  }
  if (DOM.pdfFitWidth) {
    DOM.pdfFitWidth.addEventListener('click', pdfFitToWidthMode);
  }

  // Fullscreen button
  if (DOM.pdfFullscreenBtn) {
    DOM.pdfFullscreenBtn.addEventListener('click', openPdfFullscreen);
  }

  // Go-to-page input
  if (DOM.pdfGotoInput) {
    DOM.pdfGotoInput.addEventListener('change', () => {
      const page = parseInt(DOM.pdfGotoInput.value);
      if (!isNaN(page) && page >= 1 && page <= pdfTotalPages) {
        goToPdfPage(page);
      }
    });

    DOM.pdfGotoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const page = parseInt(DOM.pdfGotoInput.value);
        if (!isNaN(page) && page >= 1 && page <= pdfTotalPages) {
          goToPdfPage(page);
          DOM.pdfGotoInput.blur();
        }
      }
    });
  }

  // Handle window resize for fit-to-width recalculation
  let resizeTimeout;
  window.addEventListener('resize', () => {
    if (activeFilter !== 'pdf' || !pdfFitToWidth || !pdfDoc) return;
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const containerWidth = DOM.pdfPagesContainer.clientWidth - 2;
      if (pdfPageDimensions.length > 0) {
        pdfCurrentScale = containerWidth / pdfPageDimensions[0].width;
        updateZoomDisplay();
        rebuildPdfPages();
      }
    }, 300);
  });
}

// ----------------------------------------------------
// 12. Fullscreen PDF Viewer Module
// ----------------------------------------------------

/**
 * Opens the fullscreen PDF viewer modal.
 * Renders pages into a dedicated full-viewport container.
 */
function openPdfFullscreen() {
  if (!pdfDoc || !pdfLoaded) return;

  pdfFsOpen = true;

  // Show modal
  if (DOM.pdfFsModal) {
    DOM.pdfFsModal.classList.remove('hidden');
    DOM.pdfFsModal.setAttribute('aria-hidden', 'false');
  }
  document.body.classList.add('modal-open');

  // Update page totals
  if (DOM.pdfFsPageTotal) DOM.pdfFsPageTotal.textContent = `/ ${pdfTotalPages}`;
  if (DOM.pdfFsGotoInput) DOM.pdfFsGotoInput.max = pdfTotalPages;

  // Determine current page from inline viewer and start there
  const currentPage = parseInt(DOM.pdfGotoInput?.value) || 1;
  if (DOM.pdfFsGotoInput) DOM.pdfFsGotoInput.value = currentPage;

  // Calculate scale for the fullscreen viewport
  pdfFsFitToWidth = true;
  if (DOM.pdfFsFitWidth) DOM.pdfFsFitWidth.classList.add('is-active');

  // Small delay to allow the modal to render and compute layout dimensions
  setTimeout(() => {
    let containerWidth = DOM.pdfFsPagesContainer.clientWidth - 2;
    if (containerWidth <= 0) {
      containerWidth = window.innerWidth - 40; // Fallback to prevent 0 scale
    }
    
    if (pdfPageDimensions.length > 0) {
      pdfFsScale = containerWidth / pdfPageDimensions[0].width;
    } else {
      pdfFsScale = pdfCurrentScale;
    }
    updateFsZoomDisplay();

    // Create page placeholders
    createFsPagePlaceholders();

    // Setup observer
    setupFsObserver();

    // Register fullscreen-specific event listeners
    registerFsEventListeners();

    // Create floating indicator for fullscreen
    createFsFloatingIndicator();

    // Scroll to the page the user was viewing
    setTimeout(() => {
      goToFsPage(currentPage);
    }, 50);
  }, 50);
}

/**
 * Closes the fullscreen PDF viewer modal.
 */
function closePdfFullscreen() {
  pdfFsOpen = false;

  // Sync page position back to inline viewer
  const currentPage = parseInt(DOM.pdfFsGotoInput?.value) || 1;
  if (DOM.pdfGotoInput) DOM.pdfGotoInput.value = currentPage;

  // Hide modal
  if (DOM.pdfFsModal) {
    DOM.pdfFsModal.classList.add('hidden');
    DOM.pdfFsModal.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('modal-open');

  // Cleanup
  if (pdfFsObserver) {
    pdfFsObserver.disconnect();
    pdfFsObserver = null;
  }
  pdfFsRenderedPages.clear();
  pdfFsRenderingPages.clear();
  if (DOM.pdfFsPagesContainer) DOM.pdfFsPagesContainer.innerHTML = '';

  // Remove floating indicator
  if (pdfFsFloatingIndicator) {
    pdfFsFloatingIndicator.remove();
    pdfFsFloatingIndicator = null;
  }

  // Remove scroll listener
  if (DOM.pdfFsViewport) {
    DOM.pdfFsViewport.onscroll = null;
  }

  // Scroll inline viewer to synced page
  setTimeout(() => {
    goToPdfPage(currentPage);
  }, 100);
}

/**
 * Creates page placeholders in the fullscreen container.
 */
function createFsPagePlaceholders() {
  if (!DOM.pdfFsPagesContainer) return;
  DOM.pdfFsPagesContainer.innerHTML = '';

  let containerWidth = DOM.pdfFsPagesContainer.clientWidth - 2;
  if (containerWidth <= 0) containerWidth = window.innerWidth - 40;

  for (let i = 0; i < pdfTotalPages; i++) {
    const pageNum = i + 1;
    const dim = pdfPageDimensions[i];
    const scale = pdfFsFitToWidth
      ? containerWidth / dim.width
      : pdfFsScale;
    const displayWidth = dim.width * scale;
    const displayHeight = dim.height * scale;

    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-page-skeleton';
    wrapper.setAttribute('data-page', pageNum);
    wrapper.setAttribute('data-page-label', `Página ${pageNum}`);
    wrapper.style.width = `${displayWidth}px`;
    wrapper.style.height = `${displayHeight}px`;

    DOM.pdfFsPagesContainer.appendChild(wrapper);
  }

  // Update scale if fit-to-width
  if (pdfFsFitToWidth && pdfPageDimensions.length > 0) {
    const scale = containerWidth / pdfPageDimensions[0].width;
    pdfFsScale = scale;
    updateFsZoomDisplay();
  }
}

/**
 * Sets up Intersection Observer for fullscreen pages.
 */
function setupFsObserver() {
  if (pdfFsObserver) pdfFsObserver.disconnect();

  pdfFsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const pageNum = parseInt(entry.target.getAttribute('data-page'));
      if (entry.isIntersecting) {
        renderFsPage(pageNum, entry.target);
        renderFsBufferPages(pageNum);
      }
    });
  }, {
    root: DOM.pdfFsViewport,
    rootMargin: '300px 0px',
    threshold: 0.01,
  });

  const pages = DOM.pdfFsPagesContainer.querySelectorAll('[data-page]');
  pages.forEach(page => pdfFsObserver.observe(page));
}

/**
 * Renders buffer pages around a center page in fullscreen.
 */
function renderFsBufferPages(centerPage) {
  const bufferSize = 2;
  for (let offset = -bufferSize; offset <= bufferSize; offset++) {
    const page = centerPage + offset;
    if (page >= 1 && page <= pdfTotalPages && page !== centerPage) {
      const el = DOM.pdfFsPagesContainer.querySelector(`[data-page="${page}"]`);
      if (el) renderFsPage(page, el);
    }
  }
}

/**
 * Renders a single PDF page in the fullscreen container.
 */
async function renderFsPage(pageNum, element) {
  if (pdfFsRenderedPages.has(pageNum) || pdfFsRenderingPages.has(pageNum)) return;
  if (!pdfDoc) return;

  pdfFsRenderingPages.add(pageNum);

  try {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: pdfFsScale });

    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-page-wrapper';
    wrapper.setAttribute('data-page', pageNum);
    wrapper.style.width = `${viewport.width}px`;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    ctx.scale(dpr, dpr);

    const badge = document.createElement('span');
    badge.className = 'pdf-page-number';
    badge.textContent = pageNum;

    wrapper.appendChild(canvas);
    wrapper.appendChild(badge);

    element.replaceWith(wrapper);

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
    }).promise;

    pdfFsRenderedPages.add(pageNum);
    pdfFsRenderingPages.delete(pageNum);

    if (pdfFsObserver) pdfFsObserver.observe(wrapper);

  } catch (error) {
    console.warn(`Error rendering fullscreen page ${pageNum}:`, error);
    pdfFsRenderingPages.delete(pageNum);
  }
}

/**
 * Handles scroll in the fullscreen viewport to track current page.
 */
function handleFsScroll() {
  if (!pdfFsOpen || !DOM.pdfFsPagesContainer) return;

  const pages = DOM.pdfFsPagesContainer.querySelectorAll('[data-page]');
  let currentPage = 1;
  const viewportRect = DOM.pdfFsViewport.getBoundingClientRect();
  const viewportMid = viewportRect.top + viewportRect.height / 2;

  for (const page of pages) {
    const rect = page.getBoundingClientRect();
    if (rect.top <= viewportMid && rect.bottom > viewportRect.top) {
      currentPage = parseInt(page.getAttribute('data-page'));
    }
  }

  if (DOM.pdfFsGotoInput && document.activeElement !== DOM.pdfFsGotoInput) {
    DOM.pdfFsGotoInput.value = currentPage;
  }

  // Show floating indicator
  if (pdfFsFloatingIndicator) {
    pdfFsFloatingIndicator.textContent = `Página ${currentPage} de ${pdfTotalPages}`;
    pdfFsFloatingIndicator.classList.add('is-visible');
  }

  clearTimeout(pdfFsScrollTimeout);
  pdfFsScrollTimeout = setTimeout(() => {
    if (pdfFsFloatingIndicator) {
      pdfFsFloatingIndicator.classList.remove('is-visible');
    }
  }, 1500);
}

/**
 * Creates floating page indicator for fullscreen viewer.
 */
function createFsFloatingIndicator() {
  if (pdfFsFloatingIndicator) return;
  pdfFsFloatingIndicator = document.createElement('div');
  pdfFsFloatingIndicator.className = 'pdf-floating-indicator';
  pdfFsFloatingIndicator.style.zIndex = '2100';
  pdfFsFloatingIndicator.textContent = `Página 1 de ${pdfTotalPages}`;
  document.body.appendChild(pdfFsFloatingIndicator);
}

/**
 * Updates zoom display in fullscreen toolbar.
 */
function updateFsZoomDisplay() {
  if (DOM.pdfFsZoomDisplay) {
    DOM.pdfFsZoomDisplay.textContent = `${Math.round(pdfFsScale * 100)}%`;
  }
}

/**
 * Zoom in/out for fullscreen viewer.
 */
function pdfFsZoom(direction) {
  pdfFsFitToWidth = false;
  if (DOM.pdfFsFitWidth) DOM.pdfFsFitWidth.classList.remove('is-active');

  if (direction === 'in') {
    pdfFsScale = Math.min(pdfFsScale * 1.25, 5.0);
  } else {
    pdfFsScale = Math.max(pdfFsScale * 0.8, 0.3);
  }

  updateFsZoomDisplay();
  rebuildFsPages();
}

/**
 * Fit to width for fullscreen viewer.
 */
function pdfFsFitToWidthMode() {
  pdfFsFitToWidth = true;
  if (DOM.pdfFsFitWidth) DOM.pdfFsFitWidth.classList.add('is-active');

  const containerWidth = DOM.pdfFsPagesContainer.clientWidth - 2;
  if (pdfPageDimensions.length > 0) {
    pdfFsScale = containerWidth / pdfPageDimensions[0].width;
  }
  updateFsZoomDisplay();
  rebuildFsPages();
}

/**
 * Rebuilds all fullscreen pages after zoom change.
 */
function rebuildFsPages() {
  if (!DOM.pdfFsPagesContainer || pdfPageDimensions.length === 0) return;

  // Calculate relative scroll position before rebuilding
  const currentPage = parseInt(DOM.pdfFsGotoInput?.value) || 1;
  const target = DOM.pdfFsPagesContainer.querySelector(`[data-page="${currentPage}"]`);
  let relativeOffset = 0;

  if (target && DOM.pdfFsViewport) {
    const viewportRect = DOM.pdfFsViewport.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetTop = targetRect.top - viewportRect.top + DOM.pdfFsViewport.scrollTop;
    relativeOffset = (DOM.pdfFsViewport.scrollTop - targetTop) / target.offsetHeight;
  }

  pdfFsRenderedPages.clear();
  pdfFsRenderingPages.clear();

  if (pdfFsObserver) pdfFsObserver.disconnect();

  createFsPagePlaceholders();
  setupFsObserver();

  if (target && DOM.pdfFsViewport) {
    setTimeout(() => {
      const newTarget = DOM.pdfFsPagesContainer.querySelector(`[data-page="${currentPage}"]`);
      if (newTarget) {
        const newViewportRect = DOM.pdfFsViewport.getBoundingClientRect();
        const newTargetRect = newTarget.getBoundingClientRect();
        const newTargetTop = newTargetRect.top - newViewportRect.top + DOM.pdfFsViewport.scrollTop;
        DOM.pdfFsViewport.scrollTo({
          top: newTargetTop + (relativeOffset * newTarget.offsetHeight),
          behavior: 'instant'
        });
      }
    }, 0);
  }
}

/**
 * Scrolls to a specific page in the fullscreen viewer.
 */
function goToFsPage(pageNum) {
  pageNum = Math.max(1, Math.min(pdfTotalPages, pageNum));
  const target = DOM.pdfFsPagesContainer?.querySelector(`[data-page="${pageNum}"]`);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (DOM.pdfFsGotoInput) DOM.pdfFsGotoInput.value = pageNum;
}

/**
 * Registers event listeners specific to the fullscreen PDF viewer.
 */
function registerFsEventListeners() {
  // Close button
  if (DOM.pdfFsClose) {
    DOM.pdfFsClose.onclick = closePdfFullscreen;
  }

  // Zoom controls
  if (DOM.pdfFsZoomIn) {
    DOM.pdfFsZoomIn.onclick = () => pdfFsZoom('in');
  }
  if (DOM.pdfFsZoomOut) {
    DOM.pdfFsZoomOut.onclick = () => pdfFsZoom('out');
  }
  if (DOM.pdfFsFitWidth) {
    DOM.pdfFsFitWidth.onclick = pdfFsFitToWidthMode;
  }

  // Go-to-page
  if (DOM.pdfFsGotoInput) {
    DOM.pdfFsGotoInput.onchange = () => {
      const page = parseInt(DOM.pdfFsGotoInput.value);
      if (!isNaN(page) && page >= 1 && page <= pdfTotalPages) {
        goToFsPage(page);
      }
    };
    DOM.pdfFsGotoInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const page = parseInt(DOM.pdfFsGotoInput.value);
        if (!isNaN(page) && page >= 1 && page <= pdfTotalPages) {
          goToFsPage(page);
          DOM.pdfFsGotoInput.blur();
        }
      }
    };
  }

  // Scroll handler
  if (DOM.pdfFsViewport) {
    DOM.pdfFsViewport.onscroll = handleFsScroll;
  }
}
