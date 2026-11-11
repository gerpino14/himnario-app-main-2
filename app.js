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
let audioPlaybackSpeed = 1.0;
let toastTimeout = null;

// PDF Viewer State & Virtualization
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
let pdfActiveRenderTasks = {};
let pdfRenderQueue = [];
let pdfActiveRenders = 0;
let pdfCurrentVisiblePage = 1;
let pdfScrollRaf = null;

// Fullscreen PDF Viewer State & Virtualization
let pdfFsOpen = false;
let pdfFsScale = 1.0;
let pdfFsFitToWidth = true;
let pdfFsRenderedPages = new Set();
let pdfFsRenderingPages = new Set();
let pdfFsObserver = null;
let pdfFsScrollTimeout = null;
let pdfFsFloatingIndicator = null;
let pdfFsActiveRenderTasks = {};
let pdfFsRenderQueue = [];
let pdfFsActiveRenders = 0;
let pdfFsCurrentVisiblePage = 1;
let pdfFsScrollRaf = null;


const MAX_CONCURRENT_PDF_RENDERS = 2;
const PDF_BUFFER_PAGES = 2;

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
    pdfGotoHymn: document.getElementById('pdf-goto-hymn'),
    pdfHymnJumpBtn: document.getElementById('pdf-hymn-jump-btn'),
    pdfIndexBtn: document.getElementById('pdf-index-btn'),
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
    pdfFsGotoHymn: document.getElementById('pdf-fs-goto-hymn'),
    pdfFsHymnJumpBtn: document.getElementById('pdf-fs-hymn-jump-btn'),
    pdfFsIndexBtn: document.getElementById('pdf-fs-index-btn'),
    pdfFsGotoInput: document.getElementById('pdf-fs-goto-input'),
    pdfFsPageTotal: document.getElementById('pdf-fs-page-total'),

    // PDF Index Modal
    pdfIndexModal: document.getElementById('pdf-index-modal'),
    pdfIndexClose: document.getElementById('pdf-index-close'),
    pdfIndexSearchInput: document.getElementById('pdf-index-search-input'),
    pdfIndexClear: document.getElementById('pdf-index-clear'),
    pdfIndexChips: document.querySelectorAll('.pdf-chip'),
    pdfIndexList: document.getElementById('pdf-index-list'),
    
    // Reader Modal
    readerModal: document.getElementById('reader-modal'),
    readerContainer: document.querySelector('.reader-container'),
    readerBar: document.querySelector('.reader-bar'),
    readerFooter: document.querySelector('.reader-nav-footer'),
    presentationToggle: document.getElementById('presentation-toggle'),
    closeReader: document.getElementById('close-reader'),
    readerFavBtn: document.getElementById('reader-fav-btn'),
    readerShareBtn: document.getElementById('reader-share-btn'),
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
    playerRewindBtn: document.getElementById('player-rewind-btn'),
    playerForwardBtn: document.getElementById('player-forward-btn'),
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
    speedDecreaseBtn: document.getElementById('speed-decrease-btn'),
    speedIncreaseBtn: document.getElementById('speed-increase-btn'),
    speedPresets: document.querySelectorAll('.speed-preset-btn'),
    menuVolumeBtn: document.getElementById('menu-volume-btn'),
    menuIconVol: document.getElementById('menu-icon-vol'),
    menuIconVolMuted: document.getElementById('menu-icon-vol-muted'),
    playerVolumeSlider: document.getElementById('player-volume-slider'),
    volumeDisplay: document.getElementById('volume-display'),
    appToast: document.getElementById('app-toast')
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

  // Load Playback Speed
  audioPlaybackSpeed = parseFloat(localStorage.getItem('hymnario-playback-speed') || '1.0');
  if (isNaN(audioPlaybackSpeed) || audioPlaybackSpeed < 0.5 || audioPlaybackSpeed > 2.0) {
    audioPlaybackSpeed = 1.0;
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

    // Open hymn directly if URL contains ?himno=<numero>
    const urlParams = new URLSearchParams(window.location.search);
    const sharedHymnNum = parseInt(urlParams.get('himno'), 10);
    if (!isNaN(sharedHymnNum) && hymnsData.some(h => h.numero === sharedHymnNum)) {
      openReader(sharedHymnNum);
    }
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

// Sincroniza y aplica la velocidad de reproducción en audio, slider, indicador, presets y botones +/-
function applyPlaybackSpeed(speed, persist = true) {
  const clamped = Math.max(0.5, Math.min(2.0, Math.round(speed * 100) / 100));
  audioPlaybackSpeed = clamped;
  if (persist) {
    try {
      localStorage.setItem('hymnario-playback-speed', clamped.toFixed(2));
    } catch (e) {}
  }
  if (DOM.readerAudio) {
    DOM.readerAudio.playbackRate = clamped;
  }
  if (DOM.speedSlider) {
    DOM.speedSlider.value = clamped;
  }
  if (DOM.speedDisplay) {
    DOM.speedDisplay.textContent = `${clamped.toFixed(2)}x`;
  }
  if (DOM.speedPresets) {
    DOM.speedPresets.forEach(btn => {
      const btnSpeed = parseFloat(btn.getAttribute('data-speed'));
      btn.classList.toggle('active', Math.abs(btnSpeed - clamped) < 0.01);
    });
  }
  if (DOM.speedDecreaseBtn) {
    const isMin = clamped <= 0.5 + 0.001;
    DOM.speedDecreaseBtn.disabled = isMin;
    DOM.speedDecreaseBtn.setAttribute('aria-disabled', isMin);
  }
  if (DOM.speedIncreaseBtn) {
    const isMax = clamped >= 2.0 - 0.001;
    DOM.speedIncreaseBtn.disabled = isMax;
    DOM.speedIncreaseBtn.setAttribute('aria-disabled', isMax);
  }
  return clamped;
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

      // Restaurar velocidad de reproducción guardada
      applyPlaybackSpeed(audioPlaybackSpeed, false);

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
      if (DOM.playerRewindBtn) DOM.playerRewindBtn.disabled = true;
      if (DOM.playerForwardBtn) DOM.playerForwardBtn.disabled = true;
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
  
  // Sync shareable ?himno=<numero> URL
  syncHymnUrl(hymn.numero);

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
  syncHymnUrl(null);
  
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
  if (DOM.readerShareBtn) DOM.readerShareBtn.addEventListener('click', shareActiveHymn);
  
  // Font Resizing Buttons
  if (DOM.fontDecrease) DOM.fontDecrease.addEventListener('click', () => changeFontSize(-2));
  if (DOM.fontIncrease) DOM.fontIncrease.addEventListener('click', () => changeFontSize(2));
  
  // Left/Right Nav Arrows inside Reader
  if (DOM.prevHymnBtn) DOM.prevHymnBtn.addEventListener('click', () => navigateReader(-1));
  if (DOM.nextHymnBtn) DOM.nextHymnBtn.addEventListener('click', () => navigateReader(1));
  
  // Back key gestures (Escape closes modals / drawer)
  document.addEventListener('keydown', (e) => {
    // PDF Index modal
    if (DOM.pdfIndexModal && !DOM.pdfIndexModal.classList.contains('hidden')) {
      if (e.key === 'Escape') {
        closePdfIndexModal();
      }
      return;
    }

    // Fullscreen PDF modal
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
  if (DOM.playerRewindBtn && DOM.readerAudio) {
    DOM.playerRewindBtn.addEventListener('click', () => seekAudioBy(-10));
  }
  if (DOM.playerForwardBtn && DOM.readerAudio) {
    DOM.playerForwardBtn.addEventListener('click', () => seekAudioBy(10));
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

  // Helper para botones con autorepetición al mantener presionado (+ y -)
  function setupSpeedStepButton(btn, stepDelta) {
    if (!btn) return;
    let timer = null;
    let interval = null;

    const doStep = () => {
      const current = DOM.readerAudio ? DOM.readerAudio.playbackRate : (parseFloat(DOM.speedSlider ? DOM.speedSlider.value : 1.0) || 1.0);
      applyPlaybackSpeed(current + stepDelta);
    };

    const stop = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      if (btn.disabled) return;
      doStep();
      timer = setTimeout(() => {
        interval = setInterval(() => {
          if (btn.disabled) {
            stop();
          } else {
            doStep();
          }
        }, 120);
      }, 350);
    });

    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointerleave', stop);
    btn.addEventListener('pointercancel', stop);

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        doStep();
      }
    });
  }

  // Vincular eventos de disminución (-) y aumento (+) de velocidad
  setupSpeedStepButton(DOM.speedDecreaseBtn, -0.05);
  setupSpeedStepButton(DOM.speedIncreaseBtn, 0.05);

  // Playback Speed Slider Event
  if (DOM.speedSlider) {
    DOM.speedSlider.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      if (!isNaN(speed)) {
        applyPlaybackSpeed(speed);
      }
    });
  }

  // Playback Speed Presets Events
  if (DOM.speedPresets) {
    DOM.speedPresets.forEach(opt => {
      opt.addEventListener('click', () => {
        const speed = parseFloat(opt.getAttribute('data-speed'));
        if (!isNaN(speed)) {
          applyPlaybackSpeed(speed);
          
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
  const hasDuration = !isNaN(duration) && isFinite(duration) && duration > 0;

  if (DOM.playerRewindBtn) DOM.playerRewindBtn.disabled = !hasDuration;
  if (DOM.playerForwardBtn) DOM.playerForwardBtn.disabled = !hasDuration;

  // Enforce persisted playback speed once metadata loads (mobile browsers may reset on load)
  DOM.readerAudio.playbackRate = audioPlaybackSpeed;

  if (hasDuration && DOM.readerAudio.currentTime > 0) {
    updateAudioProgress();
    return;
  }

  DOM.playerTime.textContent = `0:00 / ${formatTime(duration)}`;
  if (DOM.playerProgress) {
    DOM.playerProgress.value = 0;
    updateSliderBackground(0);
  }
}

function seekAudioBy(deltaSeconds) {
  if (!DOM.readerAudio) return;
  const duration = DOM.readerAudio.duration;
  if (isNaN(duration) || !isFinite(duration) || duration <= 0) return;

  const targetTime = Math.max(0, Math.min(duration, DOM.readerAudio.currentTime + deltaSeconds));
  DOM.readerAudio.currentTime = targetTime;
  updateAudioProgress();
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

/**
 * Syncs ?himno=<numero> in the browser URL without adding history entries.
 */
function syncHymnUrl(hymnNumber) {
  try {
    const url = new URL(window.location.href);
    if (hymnNumber) {
      url.searchParams.set('himno', hymnNumber);
    } else {
      url.searchParams.delete('himno');
    }
    window.history.replaceState(null, '', url.toString());
  } catch (e) {}
}

/**
 * Shares or copies the direct URL of the currently open hymn.
 */
async function shareActiveHymn() {
  if (!activeHymn) return;

  const url = new URL(window.location.href);
  url.searchParams.set('himno', activeHymn.numero);
  const shareUrl = url.toString();
  const shareTitle = `Himno #${activeHymn.numero}: ${activeHymn.titulo}`;

  // On mobile with native share support → use native share sheet
  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: `${shareTitle} — Himnos de la Vida Cristiana`,
        url: shareUrl
      });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      // If native share fails for another reason, fall through to custom panel
    }
  }

  // On desktop (no navigator.share) → show custom share panel
  openSharePanel(shareTitle, shareUrl);
}

function openSharePanel(title, shareUrl) {
  const panel = document.getElementById('share-panel');
  if (!panel) return;

  // Update preview info
  const titleEl = document.getElementById('share-panel-title');
  const urlEl = document.getElementById('share-panel-url');
  if (titleEl) titleEl.textContent = title;
  if (urlEl) {
    try {
      const u = new URL(shareUrl);
      urlEl.textContent = u.hostname + u.pathname;
    } catch (_) {
      urlEl.textContent = shareUrl;
    }
  }

  // Build social share URLs
  const encoded = encodeURIComponent(shareUrl);
  const textEncoded = encodeURIComponent(title + ' — Himnos de la Vida Cristiana');

  const whatsapp = document.getElementById('share-whatsapp');
  const telegram = document.getElementById('share-telegram');
  const twitter = document.getElementById('share-twitter');
  const facebook = document.getElementById('share-facebook');

  if (whatsapp) whatsapp.href = `https://wa.me/?text=${textEncoded}%20${encoded}`;
  if (telegram) telegram.href = `https://t.me/share/url?url=${encoded}&text=${textEncoded}`;
  if (twitter) twitter.href = `https://twitter.com/intent/tweet?text=${textEncoded}&url=${encoded}`;
  if (facebook) facebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;

  // Copy button
  const copyBtn = document.getElementById('share-copy-btn');
  if (copyBtn) {
    copyBtn.onclick = async () => {
      let copied = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try { await navigator.clipboard.writeText(shareUrl); copied = true; } catch (_) {}
      }
      if (!copied) {
        const t = document.createElement('textarea');
        t.value = shareUrl; t.setAttribute('readonly', '');
        t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select();
        try { copied = document.execCommand('copy'); } catch (_) {}
        t.remove();
      }
      closeSharePanel();
      showToast(copied ? 'Enlace copiado al portapapeles' : 'No se pudo copiar el enlace');
    };
  }

  // Show panel
  panel.classList.remove('hidden');
  requestAnimationFrame(() => panel.classList.add('is-open'));

  // Focus trap: close on backdrop click
  const backdrop = panel.querySelector('.share-panel-backdrop');
  if (backdrop) backdrop.onclick = closeSharePanel;

  const closeBtn = document.getElementById('share-panel-close');
  if (closeBtn) closeBtn.onclick = closeSharePanel;
}

function closeSharePanel() {
  const panel = document.getElementById('share-panel');
  if (!panel) return;
  panel.classList.remove('is-open');
  panel.addEventListener('transitionend', () => {
    panel.classList.add('hidden');
  }, { once: true });
}

/**
 * Shows an accessible non-blocking toast notification for 3 seconds.
 */
function showToast(message) {
  if (!DOM.appToast) return;
  DOM.appToast.textContent = message;
  DOM.appToast.classList.remove('hidden');
  // Force reflow so transition triggers cleanly after removing hidden
  DOM.appToast.offsetHeight;
  DOM.appToast.classList.add('is-visible');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    DOM.appToast.classList.remove('is-visible');
    setTimeout(() => {
      if (!DOM.appToast.classList.contains('is-visible')) {
        DOM.appToast.classList.add('hidden');
      }
    }, 250);
  }, 3000);
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
// 11. PDF Viewer Module (Continuous Scroll Virtualizado & Navegación Rápida)
// ----------------------------------------------------

let pdfIndexActiveRange = 'all';

/**
 * Retorna el himno correspondiente a una página del PDF.
 */
function getHymnForPdfPage(pageNum) {
  if (!hymnsData || hymnsData.length === 0) return null;
  // Coincidencia exacta con alguna de las páginas asignadas al himno
  const exact = hymnsData.find(h => h.paginas_pdf && h.paginas_pdf.includes(pageNum));
  if (exact) return exact;

  // Si no coincide exactamente, buscar el himno inmediatamente anterior
  let closest = null;
  for (const h of hymnsData) {
    if (h.paginas_pdf && h.paginas_pdf[0] <= pageNum) {
      if (!closest || h.paginas_pdf[0] > closest.paginas_pdf[0]) {
        closest = h;
      }
    }
  }
  return closest;
}

/**
 * Salta instantáneamente a cualquier himno (1-350) por su número oficial.
 */
function jumpToHymn(hymnNum, isFs = false) {
  hymnNum = parseInt(hymnNum);
  if (isNaN(hymnNum) || hymnNum < 1 || hymnNum > 350) {
    alert('Por favor ingresa un número de himno válido entre 1 y 350.');
    return;
  }

  const hymn = hymnsData.find(h => h.numero === hymnNum);
  if (!hymn || !hymn.paginas_pdf || hymn.paginas_pdf.length === 0) {
    console.warn(`El himno ${hymnNum} no tiene páginas PDF asociadas.`);
    return;
  }

  const targetPage = hymn.paginas_pdf[0];

  if (isFs || pdfFsOpen) {
    goToFsPage(targetPage);
  } else {
    if (activeFilter !== 'pdf') {
      const pdfTab = document.querySelector('.filter-btn[data-filter="pdf"]');
      if (pdfTab) pdfTab.click();
    }
    goToPdfPage(targetPage);
  }

  // Sincronizar inputs
  if (DOM.pdfGotoHymn) DOM.pdfGotoHymn.value = hymnNum;
  if (DOM.pdfFsGotoHymn) DOM.pdfFsGotoHymn.value = hymnNum;

  // Indicador flotante informativo
  const indicator = (isFs || pdfFsOpen) ? pdfFsFloatingIndicator : pdfFloatingIndicator;
  if (indicator) {
    indicator.textContent = `Himno ${hymn.numero}: ${hymn.titulo} (Pág. ${targetPage})`;
    indicator.classList.add('is-visible');
    clearTimeout(pdfScrollTimeout);
    pdfScrollTimeout = setTimeout(() => {
      indicator.classList.remove('is-visible');
    }, 2800);
  }
}

/**
 * Abre el modal con el índice completo de partituras para buscar por título o número.
 */
function openPdfIndexModal() {
  if (!DOM.pdfIndexModal) return;
  DOM.pdfIndexModal.classList.remove('hidden');
  DOM.pdfIndexModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  if (DOM.pdfIndexSearchInput) {
    DOM.pdfIndexSearchInput.value = '';
    setTimeout(() => DOM.pdfIndexSearchInput.focus(), 60);
  }
  if (DOM.pdfIndexClear) DOM.pdfIndexClear.classList.add('hidden');

  pdfIndexActiveRange = 'all';
  if (DOM.pdfIndexChips) {
    DOM.pdfIndexChips.forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-range') === 'all');
    });
  }

  renderPdfIndexList();
}

/**
 * Cierra el modal del índice de partituras.
 */
function closePdfIndexModal() {
  if (!DOM.pdfIndexModal) return;
  DOM.pdfIndexModal.classList.add('hidden');
  DOM.pdfIndexModal.setAttribute('aria-hidden', 'true');
  if (!pdfFsOpen && (!DOM.readerModal || DOM.readerModal.classList.contains('hidden'))) {
    document.body.classList.remove('modal-open');
  }
}

/**
 * Renderiza la lista filtrada de himnos dentro del modal de índice de partituras.
 */
function renderPdfIndexList() {
  if (!DOM.pdfIndexList || !hymnsData) return;

  const query = (DOM.pdfIndexSearchInput?.value || '').trim().toLowerCase();
  const normalizedQuery = typeof removeAccents === 'function' ? removeAccents(query) : query;

  let filtered = hymnsData.filter(h => h.paginas_pdf && h.paginas_pdf.length > 0);

  // Filtro por rango
  if (pdfIndexActiveRange !== 'all') {
    const [min, max] = pdfIndexActiveRange.split('-').map(Number);
    filtered = filtered.filter(h => h.numero >= min && h.numero <= max);
  }

  // Filtro por búsqueda
  if (query) {
    const queryNum = parseInt(query);
    filtered = filtered.filter(h => {
      if (!isNaN(queryNum) && h.numero.toString().includes(query)) return true;
      const titleNorm = typeof removeAccents === 'function' ? removeAccents(h.titulo.toLowerCase()) : h.titulo.toLowerCase();
      return titleNorm.includes(normalizedQuery);
    });
  }

  if (filtered.length === 0) {
    DOM.pdfIndexList.innerHTML = `
      <div style="padding: 28px; text-align: center; color: var(--secondary-text);">
        No se encontraron himnos con "${query}"
      </div>
    `;
    return;
  }

  DOM.pdfIndexList.innerHTML = filtered.map(h => `
    <button type="button" class="pdf-index-item" data-hymn-num="${h.numero}" data-page="${h.paginas_pdf[0]}">
      <div class="pdf-index-item-main">
        <span class="pdf-index-num">#${h.numero}</span>
        <span class="pdf-index-item-title">${h.titulo}</span>
      </div>
      <span class="pdf-index-badge">Pág. ${h.paginas_pdf[0]}</span>
    </button>
  `).join('');

  DOM.pdfIndexList.querySelectorAll('.pdf-index-item').forEach(btn => {
    btn.onclick = () => {
      const num = parseInt(btn.getAttribute('data-hymn-num'));
      closePdfIndexModal();
      jumpToHymn(num, pdfFsOpen);
    };
  });
}

/**
 * Configura los event listeners del modal del índice de partituras.
 */
function initPdfIndexListeners() {
  if (DOM.pdfIndexBtn) {
    DOM.pdfIndexBtn.onclick = openPdfIndexModal;
  }
  if (DOM.pdfFsIndexBtn) {
    DOM.pdfFsIndexBtn.onclick = openPdfIndexModal;
  }
  if (DOM.pdfIndexClose) {
    DOM.pdfIndexClose.onclick = closePdfIndexModal;
  }

  if (DOM.pdfIndexModal) {
    DOM.pdfIndexModal.onclick = (e) => {
      if (e.target === DOM.pdfIndexModal) closePdfIndexModal();
    };
  }

  if (DOM.pdfIndexSearchInput) {
    DOM.pdfIndexSearchInput.oninput = () => {
      const hasText = DOM.pdfIndexSearchInput.value.trim().length > 0;
      if (DOM.pdfIndexClear) DOM.pdfIndexClear.classList.toggle('hidden', !hasText);
      renderPdfIndexList();
    };
  }

  if (DOM.pdfIndexClear) {
    DOM.pdfIndexClear.onclick = () => {
      if (DOM.pdfIndexSearchInput) {
        DOM.pdfIndexSearchInput.value = '';
        DOM.pdfIndexSearchInput.focus();
      }
      DOM.pdfIndexClear.classList.add('hidden');
      renderPdfIndexList();
    };
  }

  if (DOM.pdfIndexChips) {
    DOM.pdfIndexChips.forEach(chip => {
      chip.onclick = () => {
        DOM.pdfIndexChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        pdfIndexActiveRange = chip.getAttribute('data-range') || 'all';
        renderPdfIndexList();
      };
    });
  }

  // Inputs de salto directo por Himno #
  const setupHymnInput = (input, goBtn, isFs) => {
    if (goBtn) {
      goBtn.onclick = () => {
        if (input) jumpToHymn(input.value, isFs);
      };
    }
    if (input) {
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          jumpToHymn(input.value, isFs);
          input.blur();
        }
      };
    }
  };

  setupHymnInput(DOM.pdfGotoHymn, DOM.pdfHymnJumpBtn, false);
  setupHymnInput(DOM.pdfFsGotoHymn, DOM.pdfFsHymnJumpBtn, true);
}

/**
 * Muestra la sección del visor PDF continuo y oculta la cuadrícula de himnos.
 */
function showPdfViewer() {
  if (DOM.hymnsGrid) DOM.hymnsGrid.classList.add('hidden');
  if (DOM.statusBar) DOM.statusBar.classList.add('hidden');

  if (DOM.pdfSection) {
    DOM.pdfSection.classList.remove('hidden');
    DOM.pdfSection.style.animation = 'none';
    DOM.pdfSection.offsetHeight; // force reflow
    DOM.pdfSection.style.animation = '';
  }

  if (!pdfLoaded && !pdfDoc) {
    initPdfViewer();
  } else if (pdfDoc) {
    reobservePdfPages();
  }
}

/**
 * Oculta la sección del visor PDF continuo.
 */
function hidePdfViewer() {
  if (DOM.pdfSection) DOM.pdfSection.classList.add('hidden');
  if (DOM.hymnsGrid) DOM.hymnsGrid.classList.remove('hidden');
  if (DOM.statusBar) DOM.statusBar.classList.remove('hidden');

  if (pdfFloatingIndicator) {
    pdfFloatingIndicator.classList.remove('is-visible');
  }

  cancelAllPdfRenders();
  if (pdfObserver) {
    pdfObserver.disconnect();
  }
}

/**
 * Inicializa PDF.js y carga el documento en modo scroll continuo.
 */
async function initPdfViewer() {
  if (typeof pdfjsLib === 'undefined') {
    console.error('PDF.js library not loaded');
    showPdfError('No se pudo cargar la biblioteca PDF.js');
    return;
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  if (DOM.pdfLoading) DOM.pdfLoading.classList.remove('hidden');
  if (DOM.pdfPagesContainer) DOM.pdfPagesContainer.innerHTML = '';

  try {
    const loadingTask = pdfjsLib.getDocument({
      url: 'himnario.pdf',
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true,
    });

    loadingTask.onProgress = (progress) => {
      if (progress.total > 0 && DOM.pdfProgressFill) {
        const percent = Math.min(100, (progress.loaded / progress.total) * 100);
        DOM.pdfProgressFill.style.width = `${percent}%`;
      }
    };

    pdfDoc = await loadingTask.promise;
    pdfTotalPages = pdfDoc.numPages;
    pdfLoaded = true;

    if (DOM.pdfPageTotal) DOM.pdfPageTotal.textContent = `/ ${pdfTotalPages}`;
    if (DOM.pdfGotoInput) DOM.pdfGotoInput.max = pdfTotalPages;
    if (DOM.pdfFsPageTotal) DOM.pdfFsPageTotal.textContent = `/ ${pdfTotalPages}`;
    if (DOM.pdfFsGotoInput) DOM.pdfFsGotoInput.max = pdfTotalPages;

    await fetchPageDimensions();
    createPagePlaceholders();

    if (DOM.pdfLoading) DOM.pdfLoading.classList.add('hidden');

    createFloatingIndicator();
    setupPdfObserver();
    registerPdfEventListeners();
    initPdfIndexListeners();

  } catch (error) {
    console.error('Failed to load PDF:', error);
    showPdfError('No se pudo cargar el himnario PDF. Verifica que el archivo "himnario.pdf" exista en la carpeta del proyecto.');
  }
}

/**
 * Obtiene las dimensiones base de las páginas.
 */
async function fetchPageDimensions() {
  pdfPageDimensions = [];
  const firstPage = await pdfDoc.getPage(1);
  const baseViewport = firstPage.getViewport({ scale: 1.0 });

  for (let i = 0; i < pdfTotalPages; i++) {
    pdfPageDimensions.push({
      width: baseViewport.width,
      height: baseViewport.height,
    });
  }
}

/**
 * Crea todos los contenedores / placeholders de páginas para el scroll continuo.
 */
function createPagePlaceholders() {
  if (!DOM.pdfPagesContainer) return;
  DOM.pdfPagesContainer.innerHTML = '';

  const containerWidth = DOM.pdfPagesContainer.clientWidth - 2;

  for (let i = 0; i < pdfTotalPages; i++) {
    const pageNum = i + 1;
    const dim = pdfPageDimensions[i];
    const scale = pdfFitToWidth ? (containerWidth / dim.width) : pdfCurrentScale;
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

  if (pdfFitToWidth && pdfPageDimensions.length > 0) {
    const scale = containerWidth / pdfPageDimensions[0].width;
    pdfCurrentScale = scale;
    updateZoomDisplay();
  }
}

/**
 * Configura el IntersectionObserver para lazy loading fluido en scroll vertical.
 */
function setupPdfObserver() {
  if (pdfObserver) pdfObserver.disconnect();

  pdfObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const pageNum = parseInt(entry.target.getAttribute('data-page'));
      if (entry.isIntersecting && !isNaN(pageNum)) {
        queuePdfPageRender(pageNum);
      }
    });
  }, {
    root: null,
    rootMargin: '300px 0px',
    threshold: 0.01,
  });

  const pages = DOM.pdfPagesContainer.querySelectorAll('[data-page]');
  pages.forEach(page => pdfObserver.observe(page));

  window.removeEventListener('scroll', onPdfScroll);
  window.addEventListener('scroll', onPdfScroll, { passive: true });
}

function onPdfScroll() {
  if (!pdfScrollRaf) {
    pdfScrollRaf = requestAnimationFrame(() => {
      pdfScrollRaf = null;
      handlePdfScroll();
    });
  }
}

/**
 * Encola una página para renderizarla sin descartes de distancia.
 */
function queuePdfPageRender(pageNum, prioritize = false) {
  if (pageNum < 1 || pageNum > pdfTotalPages) return;
  if (pdfRenderedPages.has(pageNum) || pdfRenderingPages.has(pageNum)) return;
  if (!pdfDoc) return;

  if (prioritize) {
    pdfRenderQueue = pdfRenderQueue.filter(p => p !== pageNum);
    pdfRenderQueue.unshift(pageNum);
  } else if (!pdfRenderQueue.includes(pageNum)) {
    pdfRenderQueue.push(pageNum);
  }
  processPdfRenderQueue();
}

/**
 * Procesa la cola de renderizado priorizando cercanía a la vista activa.
 */
function processPdfRenderQueue() {
  if (!pdfDoc) return;

  pdfRenderQueue.sort((a, b) => Math.abs(a - pdfCurrentVisiblePage) - Math.abs(b - pdfCurrentVisiblePage));

  while (pdfActiveRenders < MAX_CONCURRENT_PDF_RENDERS && pdfRenderQueue.length > 0) {
    const next = pdfRenderQueue.shift();
    if (!pdfRenderedPages.has(next) && !pdfRenderingPages.has(next)) {
      executePdfPageRender(next);
    }
  }
}

/**
 * Renderiza la página del PDF en un elemento canvas con aceleración por hardware.
 */
async function executePdfPageRender(pageNum) {
  const currentTarget = DOM.pdfPagesContainer?.querySelector(`[data-page="${pageNum}"]`);
  if (!currentTarget || !pdfDoc) return;

  pdfRenderingPages.add(pageNum);
  pdfActiveRenders++;

  try {
    const page = await pdfDoc.getPage(pageNum);
    if (activeFilter !== 'pdf') {
      pdfRenderingPages.delete(pageNum);
      return;
    }

    const viewport = page.getViewport({ scale: pdfCurrentScale });
    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2.0);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    ctx.scale(dpr, dpr);

    const renderTask = page.render({
      canvasContext: ctx,
      viewport: viewport,
    });

    pdfActiveRenderTasks[pageNum] = renderTask;
    await renderTask.promise;
    delete pdfActiveRenderTasks[pageNum];

    const targetElement = DOM.pdfPagesContainer?.querySelector(`[data-page="${pageNum}"]`);
    if (targetElement && activeFilter === 'pdf') {
      const wrapper = document.createElement('div');
      wrapper.className = 'pdf-page-wrapper';
      wrapper.setAttribute('data-page', pageNum);
      wrapper.style.width = `${viewport.width}px`;
      wrapper.style.height = `${viewport.height}px`;

      const badge = document.createElement('span');
      badge.className = 'pdf-page-number';
      badge.textContent = pageNum;

      wrapper.appendChild(canvas);
      wrapper.appendChild(badge);

      targetElement.replaceWith(wrapper);
      if (pdfObserver) pdfObserver.observe(wrapper);
    }

    pdfRenderedPages.add(pageNum);
    pdfRenderingPages.delete(pageNum);

    evictOffscreenPdfPages(pdfCurrentVisiblePage);

  } catch (error) {
    delete pdfActiveRenderTasks[pageNum];
    pdfRenderingPages.delete(pageNum);
    if (error && error.name !== 'RenderingCancelledException') {
      console.warn(`Error renderizando página ${pageNum}:`, error);
    }
  } finally {
    pdfActiveRenders--;
    processPdfRenderQueue();
  }
}

/**
 * Libera de memoria páginas fuera de vista lejanas (> 5 páginas) para evitar cierres en móvil.
 */
function evictOffscreenPdfPages(centerPage) {
  if (!DOM.pdfPagesContainer) return;
  const maxDistance = 5;

  for (const renderedPage of Array.from(pdfRenderedPages)) {
    if (Math.abs(renderedPage - centerPage) > maxDistance) {
      const el = DOM.pdfPagesContainer.querySelector(`.pdf-page-wrapper[data-page="${renderedPage}"]`);
      if (el) {
        const canvas = el.querySelector('canvas');
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }

        const skeleton = document.createElement('div');
        skeleton.className = 'pdf-page-skeleton';
        skeleton.setAttribute('data-page', renderedPage);
        skeleton.setAttribute('data-page-label', `Página ${renderedPage}`);
        skeleton.style.width = el.style.width;
        skeleton.style.height = el.style.height;

        el.replaceWith(skeleton);
        if (pdfObserver) pdfObserver.observe(skeleton);
      }
      pdfRenderedPages.delete(renderedPage);
    }
  }

  for (const pageStr in pdfActiveRenderTasks) {
    const p = parseInt(pageStr);
    if (Math.abs(p - centerPage) > maxDistance + 3) {
      try {
        pdfActiveRenderTasks[p].cancel();
      } catch (e) {}
      delete pdfActiveRenderTasks[p];
      pdfRenderingPages.delete(p);
    }
  }
}

/**
 * Cancela renders pendientes inline.
 */
function cancelAllPdfRenders() {
  for (const pageStr in pdfActiveRenderTasks) {
    try {
      pdfActiveRenderTasks[pageStr].cancel();
    } catch (e) {}
  }
  pdfActiveRenderTasks = {};
  pdfRenderQueue = [];
  pdfRenderingPages.clear();
  pdfActiveRenders = 0;
}

/**
 * Re-observa las páginas al volver a la pestaña de PDF.
 */
function reobservePdfPages() {
  if (!pdfObserver || !DOM.pdfPagesContainer) return;
  const pages = DOM.pdfPagesContainer.querySelectorAll('[data-page]');
  pages.forEach(page => pdfObserver.observe(page));
}

/**
 * Maneja el evento de scroll en O(1) y sincroniza página e himno actual.
 */
function handlePdfScroll() {
  if (activeFilter !== 'pdf' || !DOM.pdfPagesContainer) return;

  const containerRect = DOM.pdfPagesContainer.getBoundingClientRect();
  const baseDim = pdfPageDimensions[0];
  const pageHeight = (baseDim ? baseDim.height * pdfCurrentScale : 800) + 20;
  const relativeY = (window.innerHeight * 0.4) - containerRect.top;

  let approxPage = Math.max(1, Math.min(pdfTotalPages, Math.floor(relativeY / pageHeight) + 1));

  for (let p = Math.max(1, approxPage - 1); p <= Math.min(pdfTotalPages, approxPage + 1); p++) {
    const el = DOM.pdfPagesContainer.querySelector(`[data-page="${p}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.1) {
        approxPage = p;
        break;
      }
    }
  }

  const currentPage = approxPage;
  pdfCurrentVisiblePage = currentPage;

  evictOffscreenPdfPages(currentPage);

  queuePdfPageRender(currentPage);
  if (currentPage > 1) queuePdfPageRender(currentPage - 1);
  if (currentPage < pdfTotalPages) queuePdfPageRender(currentPage + 1);

  if (DOM.pdfGotoInput && document.activeElement !== DOM.pdfGotoInput) {
    DOM.pdfGotoInput.value = currentPage;
  }

  // Sincronizar himno actual visible
  const hymn = getHymnForPdfPage(currentPage);
  if (hymn && DOM.pdfGotoHymn && document.activeElement !== DOM.pdfGotoHymn) {
    DOM.pdfGotoHymn.value = hymn.numero;
  }

  if (pdfFloatingIndicator) {
    if (hymn) {
      pdfFloatingIndicator.textContent = `Pág. ${currentPage} de ${pdfTotalPages} · Himno ${hymn.numero}: ${hymn.titulo}`;
    } else {
      pdfFloatingIndicator.textContent = `Página ${currentPage} de ${pdfTotalPages}`;
    }
    pdfFloatingIndicator.classList.add('is-visible');
  }

  clearTimeout(pdfScrollTimeout);
  pdfScrollTimeout = setTimeout(() => {
    if (pdfFloatingIndicator) {
      pdfFloatingIndicator.classList.remove('is-visible');
    }
  }, 1800);
}

/**
 * Crea el indicador flotante de página.
 */
function createFloatingIndicator() {
  if (pdfFloatingIndicator) return;
  pdfFloatingIndicator = document.createElement('div');
  pdfFloatingIndicator.className = 'pdf-floating-indicator';
  pdfFloatingIndicator.textContent = `Página 1 de ${pdfTotalPages}`;
  document.body.appendChild(pdfFloatingIndicator);
}

/**
 * Zoom in/out en modo continuo.
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
 * Ajusta al ancho en modo continuo.
 */
function pdfFitToWidthMode() {
  pdfFitToWidth = true;
  if (DOM.pdfFitWidth) DOM.pdfFitWidth.classList.add('is-active');

  const containerWidth = DOM.pdfPagesContainer.clientWidth - 4;
  if (pdfPageDimensions.length > 0 && containerWidth > 0) {
    pdfCurrentScale = containerWidth / pdfPageDimensions[0].width;
  }
  updateZoomDisplay();
  rebuildPdfPages();
}

/**
 * Actualiza el porcentaje del zoom.
 */
function updateZoomDisplay() {
  if (DOM.pdfZoomDisplay) {
    DOM.pdfZoomDisplay.textContent = `${Math.round(pdfCurrentScale * 100)}%`;
  }
}

/**
 * Reconstruye las páginas al cambiar zoom conservando la posición relativa.
 */
function rebuildPdfPages() {
  if (!DOM.pdfPagesContainer || pdfPageDimensions.length === 0) return;

  const currentPage = parseInt(DOM.pdfGotoInput?.value) || pdfCurrentVisiblePage || 1;
  const target = DOM.pdfPagesContainer.querySelector(`[data-page="${currentPage}"]`);
  let relativeOffset = 0;
  
  if (target) {
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    relativeOffset = (window.scrollY - targetTop) / target.offsetHeight;
  }

  cancelAllPdfRenders();
  pdfRenderedPages.clear();

  if (pdfObserver) pdfObserver.disconnect();

  createPagePlaceholders();
  setupPdfObserver();

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
 * Navega de inmediato a una página específica en el scroll continuo.
 */
function goToPdfPage(pageNum) {
  pageNum = Math.max(1, Math.min(pdfTotalPages, pageNum));
  pdfCurrentVisiblePage = pageNum;

  if (DOM.pdfGotoInput && document.activeElement !== DOM.pdfGotoInput) {
    DOM.pdfGotoInput.value = pageNum;
  }

  const hymn = getHymnForPdfPage(pageNum);
  if (hymn && DOM.pdfGotoHymn && document.activeElement !== DOM.pdfGotoHymn) {
    DOM.pdfGotoHymn.value = hymn.numero;
  }

  // Priorizar la página requerida en la cola de renderizado
  queuePdfPageRender(pageNum, true);
  if (pageNum > 1) queuePdfPageRender(pageNum - 1);
  if (pageNum < pdfTotalPages) queuePdfPageRender(pageNum + 1);

  const target = DOM.pdfPagesContainer?.querySelector(`[data-page="${pageNum}"]`);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Mensaje de error al cargar el PDF.
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
 * Event listeners para controles del visor PDF inline.
 */
function registerPdfEventListeners() {
  if (DOM.pdfZoomIn) {
    DOM.pdfZoomIn.onclick = () => pdfZoom('in');
  }
  if (DOM.pdfZoomOut) {
    DOM.pdfZoomOut.onclick = () => pdfZoom('out');
  }
  if (DOM.pdfFitWidth) {
    DOM.pdfFitWidth.onclick = pdfFitToWidthMode;
  }
  if (DOM.pdfFullscreenBtn) {
    DOM.pdfFullscreenBtn.onclick = () => openPdfFullscreen();
  }

  if (DOM.pdfGotoInput) {
    DOM.pdfGotoInput.onchange = () => {
      const page = parseInt(DOM.pdfGotoInput.value);
      if (!isNaN(page) && page >= 1 && page <= pdfTotalPages) {
        goToPdfPage(page);
      }
    };

    DOM.pdfGotoInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const page = parseInt(DOM.pdfGotoInput.value);
        if (!isNaN(page) && page >= 1 && page <= pdfTotalPages) {
          goToPdfPage(page);
          DOM.pdfGotoInput.blur();
        }
      }
    };
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    if (activeFilter !== 'pdf' || !pdfFitToWidth || !pdfDoc) return;
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const containerWidth = DOM.pdfPagesContainer.clientWidth - 4;
      if (pdfPageDimensions.length > 0 && containerWidth > 0) {
        pdfCurrentScale = containerWidth / pdfPageDimensions[0].width;
        updateZoomDisplay();
        rebuildPdfPages();
      }
    }, 300);
  });
}

// ----------------------------------------------------
// 12. Fullscreen PDF Viewer Module (Continuo & Rápido)
// ----------------------------------------------------

/**
 * Abre el visor de partituras en pantalla completa con scroll continuo.
 */
function openPdfFullscreen(initialPage) {
  if (!pdfDoc || !pdfLoaded) {
    initPdfViewer().then(() => {
      openPdfFullscreen(initialPage);
    });
    return;
  }

  pdfFsOpen = true;

  if (DOM.pdfFsModal) {
    DOM.pdfFsModal.classList.remove('hidden');
    DOM.pdfFsModal.setAttribute('aria-hidden', 'false');
  }
  document.body.classList.add('modal-open');

  if (DOM.pdfFsPageTotal) DOM.pdfFsPageTotal.textContent = `/ ${pdfTotalPages}`;
  if (DOM.pdfFsGotoInput) DOM.pdfFsGotoInput.max = pdfTotalPages;

  const targetPage = (typeof initialPage === 'number' && initialPage >= 1 && initialPage <= pdfTotalPages)
    ? initialPage
    : (parseInt(DOM.pdfGotoInput?.value) || pdfCurrentVisiblePage || 1);

  pdfFsCurrentVisiblePage = targetPage;
  if (DOM.pdfFsGotoInput) DOM.pdfFsGotoInput.value = targetPage;

  const hymn = getHymnForPdfPage(targetPage);
  if (hymn && DOM.pdfFsGotoHymn) DOM.pdfFsGotoHymn.value = hymn.numero;

  pdfFsFitToWidth = true;
  if (DOM.pdfFsFitWidth) DOM.pdfFsFitWidth.classList.add('is-active');

  setTimeout(() => {
    let containerWidth = DOM.pdfFsPagesContainer.clientWidth - 4;
    if (containerWidth <= 0) {
      containerWidth = window.innerWidth - 40;
    }
    
    if (pdfPageDimensions.length > 0) {
      pdfFsScale = containerWidth / pdfPageDimensions[0].width;
    } else {
      pdfFsScale = pdfCurrentScale;
    }
    updateFsZoomDisplay();

    createFsPagePlaceholders();
    setupFsObserver();
    registerFsEventListeners();
    createFsFloatingIndicator();

    setTimeout(() => {
      goToFsPage(targetPage);
    }, 50);
  }, 50);
}

/**
 * Cierra el visor de pantalla completa.
 */
function closePdfFullscreen() {
  pdfFsOpen = false;

  const currentPage = pdfFsCurrentVisiblePage || parseInt(DOM.pdfFsGotoInput?.value) || 1;
  pdfCurrentVisiblePage = currentPage;
  if (DOM.pdfGotoInput) DOM.pdfGotoInput.value = currentPage;

  if (DOM.pdfFsModal) {
    DOM.pdfFsModal.classList.add('hidden');
    DOM.pdfFsModal.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('modal-open');

  cancelAllFsRenders();
  if (pdfFsObserver) {
    pdfFsObserver.disconnect();
    pdfFsObserver = null;
  }
  pdfFsRenderedPages.clear();
  if (DOM.pdfFsPagesContainer) DOM.pdfFsPagesContainer.innerHTML = '';

  if (pdfFsFloatingIndicator) {
    pdfFsFloatingIndicator.remove();
    pdfFsFloatingIndicator = null;
  }

  if (DOM.pdfFsViewport) {
    DOM.pdfFsViewport.removeEventListener('scroll', onFsScroll);
  }

  if (activeFilter === 'pdf') {
    if (pdfObserver) reobservePdfPages();
    goToPdfPage(currentPage);
  }
}

/**
 * Crea los placeholders de todas las páginas en el visor de pantalla completa.
 */
function createFsPagePlaceholders() {
  if (!DOM.pdfFsPagesContainer) return;
  DOM.pdfFsPagesContainer.innerHTML = '';

  let containerWidth = DOM.pdfFsPagesContainer.clientWidth - 2;
  if (containerWidth <= 0) containerWidth = window.innerWidth - 40;

  for (let i = 0; i < pdfTotalPages; i++) {
    const pageNum = i + 1;
    const dim = pdfPageDimensions[i];
    const scale = pdfFsFitToWidth ? (containerWidth / dim.width) : pdfFsScale;
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

  if (pdfFsFitToWidth && pdfPageDimensions.length > 0) {
    const scale = containerWidth / pdfPageDimensions[0].width;
    pdfFsScale = scale;
    updateFsZoomDisplay();
  }
}

/**
 * Observer para el visor de pantalla completa.
 */
function setupFsObserver() {
  if (pdfFsObserver) pdfFsObserver.disconnect();

  pdfFsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const pageNum = parseInt(entry.target.getAttribute('data-page'));
      if (entry.isIntersecting && !isNaN(pageNum)) {
        queueFsPageRender(pageNum);
      }
    });
  }, {
    root: DOM.pdfFsViewport,
    rootMargin: '300px 0px',
    threshold: 0.01,
  });

  const pages = DOM.pdfFsPagesContainer.querySelectorAll('[data-page]');
  pages.forEach(page => pdfFsObserver.observe(page));

  if (DOM.pdfFsViewport) {
    DOM.pdfFsViewport.removeEventListener('scroll', onFsScroll);
    DOM.pdfFsViewport.addEventListener('scroll', onFsScroll, { passive: true });
  }
}

function onFsScroll() {
  if (!pdfFsScrollRaf) {
    pdfFsScrollRaf = requestAnimationFrame(() => {
      pdfFsScrollRaf = null;
      handleFsScroll();
    });
  }
}

/**
 * Encola páginas de pantalla completa priorizándolas.
 */
function queueFsPageRender(pageNum, prioritize = false) {
  if (pageNum < 1 || pageNum > pdfTotalPages) return;
  if (pdfFsRenderedPages.has(pageNum) || pdfFsRenderingPages.has(pageNum)) return;
  if (!pdfDoc || !pdfFsOpen) return;

  if (prioritize) {
    pdfFsRenderQueue = pdfFsRenderQueue.filter(p => p !== pageNum);
    pdfFsRenderQueue.unshift(pageNum);
  } else if (!pdfFsRenderQueue.includes(pageNum)) {
    pdfFsRenderQueue.push(pageNum);
  }
  processFsRenderQueue();
}

/**
 * Procesa cola de pantalla completa sin descartar páginas solicitadas.
 */
function processFsRenderQueue() {
  if (!pdfDoc || !pdfFsOpen) return;

  pdfFsRenderQueue.sort((a, b) => Math.abs(a - pdfFsCurrentVisiblePage) - Math.abs(b - pdfFsCurrentVisiblePage));

  while (pdfFsActiveRenders < MAX_CONCURRENT_PDF_RENDERS && pdfFsRenderQueue.length > 0) {
    const next = pdfFsRenderQueue.shift();
    if (!pdfFsRenderedPages.has(next) && !pdfFsRenderingPages.has(next)) {
      executeFsPageRender(next);
    }
  }
}

/**
 * Renderiza página en pantalla completa sin abortos falsos.
 */
async function executeFsPageRender(pageNum) {
  const currentTarget = DOM.pdfFsPagesContainer?.querySelector(`[data-page="${pageNum}"]`);
  if (!currentTarget || !pdfDoc || !pdfFsOpen) return;

  pdfFsRenderingPages.add(pageNum);
  pdfFsActiveRenders++;

  try {
    const page = await pdfDoc.getPage(pageNum);
    if (!pdfFsOpen) {
      pdfFsRenderingPages.delete(pageNum);
      return;
    }

    const viewport = page.getViewport({ scale: pdfFsScale });
    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2.0);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    ctx.scale(dpr, dpr);

    const renderTask = page.render({
      canvasContext: ctx,
      viewport: viewport,
    });

    pdfFsActiveRenderTasks[pageNum] = renderTask;
    await renderTask.promise;
    delete pdfFsActiveRenderTasks[pageNum];

    const targetElement = DOM.pdfFsPagesContainer?.querySelector(`[data-page="${pageNum}"]`);
    if (targetElement && pdfFsOpen) {
      const wrapper = document.createElement('div');
      wrapper.className = 'pdf-page-wrapper';
      wrapper.setAttribute('data-page', pageNum);
      wrapper.style.width = `${viewport.width}px`;
      wrapper.style.height = `${viewport.height}px`;

      const badge = document.createElement('span');
      badge.className = 'pdf-page-number';
      badge.textContent = pageNum;

      wrapper.appendChild(canvas);
      wrapper.appendChild(badge);

      targetElement.replaceWith(wrapper);
      if (pdfFsObserver) pdfFsObserver.observe(wrapper);
    }

    pdfFsRenderedPages.add(pageNum);
    pdfFsRenderingPages.delete(pageNum);

    evictOffscreenFsPages(pdfFsCurrentVisiblePage);

  } catch (error) {
    delete pdfFsActiveRenderTasks[pageNum];
    pdfFsRenderingPages.delete(pageNum);
    if (error && error.name !== 'RenderingCancelledException') {
      console.warn(`Error renderizando fullscreen ${pageNum}:`, error);
    }
  } finally {
    pdfFsActiveRenders--;
    processFsRenderQueue();
  }
}

/**
 * Libera memoria GPU de páginas en pantalla completa.
 */
function evictOffscreenFsPages(centerPage) {
  if (!DOM.pdfFsPagesContainer) return;
  const maxDistance = 5;

  for (const renderedPage of Array.from(pdfFsRenderedPages)) {
    if (Math.abs(renderedPage - centerPage) > maxDistance) {
      const el = DOM.pdfFsPagesContainer.querySelector(`.pdf-page-wrapper[data-page="${renderedPage}"]`);
      if (el) {
        const canvas = el.querySelector('canvas');
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }

        const skeleton = document.createElement('div');
        skeleton.className = 'pdf-page-skeleton';
        skeleton.setAttribute('data-page', renderedPage);
        skeleton.setAttribute('data-page-label', `Página ${renderedPage}`);
        skeleton.style.width = el.style.width;
        skeleton.style.height = el.style.height;

        el.replaceWith(skeleton);
        if (pdfFsObserver) pdfFsObserver.observe(skeleton);
      }
      pdfFsRenderedPages.delete(renderedPage);
    }
  }

  for (const pageStr in pdfFsActiveRenderTasks) {
    const p = parseInt(pageStr);
    if (Math.abs(p - centerPage) > maxDistance + 3) {
      try {
        pdfFsActiveRenderTasks[p].cancel();
      } catch (e) {}
      delete pdfFsActiveRenderTasks[p];
      pdfFsRenderingPages.delete(p);
    }
  }
}

/**
 * Cancela renders activos en pantalla completa.
 */
function cancelAllFsRenders() {
  for (const pageStr in pdfFsActiveRenderTasks) {
    try {
      pdfFsActiveRenderTasks[pageStr].cancel();
    } catch (e) {}
  }
  pdfFsActiveRenderTasks = {};
  pdfFsRenderQueue = [];
  pdfFsRenderingPages.clear();
  pdfFsActiveRenders = 0;
}

/**
 * Manejo de scroll continuo en pantalla completa con detección O(1).
 */
function handleFsScroll() {
  if (!pdfFsOpen || !DOM.pdfFsPagesContainer || !DOM.pdfFsViewport) return;

  const viewportRect = DOM.pdfFsViewport.getBoundingClientRect();
  const containerRect = DOM.pdfFsPagesContainer.getBoundingClientRect();
  const baseDim = pdfPageDimensions[0];
  const pageHeight = (baseDim ? baseDim.height * pdfFsScale : 800) + 24;
  const relativeY = (viewportRect.height * 0.4) - (containerRect.top - viewportRect.top);

  let approxPage = Math.max(1, Math.min(pdfTotalPages, Math.floor(relativeY / pageHeight) + 1));

  for (let p = Math.max(1, approxPage - 1); p <= Math.min(pdfTotalPages, approxPage + 1); p++) {
    const el = DOM.pdfFsPagesContainer.querySelector(`[data-page="${p}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top <= viewportRect.top + viewportRect.height * 0.5 && rect.bottom >= viewportRect.top + viewportRect.height * 0.1) {
        approxPage = p;
        break;
      }
    }
  }

  const currentPage = approxPage;
  pdfFsCurrentVisiblePage = currentPage;

  evictOffscreenFsPages(currentPage);

  queueFsPageRender(currentPage);
  if (currentPage > 1) queueFsPageRender(currentPage - 1);
  if (currentPage < pdfTotalPages) queueFsPageRender(currentPage + 1);

  if (DOM.pdfFsGotoInput && document.activeElement !== DOM.pdfFsGotoInput) {
    DOM.pdfFsGotoInput.value = currentPage;
  }

  const hymn = getHymnForPdfPage(currentPage);
  if (hymn && DOM.pdfFsGotoHymn && document.activeElement !== DOM.pdfFsGotoHymn) {
    DOM.pdfFsGotoHymn.value = hymn.numero;
  }

  if (pdfFsFloatingIndicator) {
    if (hymn) {
      pdfFsFloatingIndicator.textContent = `Pág. ${currentPage} de ${pdfTotalPages} · Himno ${hymn.numero}: ${hymn.titulo}`;
    } else {
      pdfFsFloatingIndicator.textContent = `Página ${currentPage} de ${pdfTotalPages}`;
    }
    pdfFsFloatingIndicator.classList.add('is-visible');
  }

  clearTimeout(pdfFsScrollTimeout);
  pdfFsScrollTimeout = setTimeout(() => {
    if (pdfFsFloatingIndicator) {
      pdfFsFloatingIndicator.classList.remove('is-visible');
    }
  }, 1800);
}

/**
 * Crea indicador flotante en pantalla completa.
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
 * Zoom display en pantalla completa.
 */
function updateFsZoomDisplay() {
  if (DOM.pdfFsZoomDisplay) {
    DOM.pdfFsZoomDisplay.textContent = `${Math.round(pdfFsScale * 100)}%`;
  }
}

/**
 * Zoom in/out en pantalla completa.
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
 * Ajuste a ancho en pantalla completa.
 */
function pdfFsFitToWidthMode() {
  pdfFsFitToWidth = true;
  if (DOM.pdfFsFitWidth) DOM.pdfFsFitWidth.classList.add('is-active');

  const containerWidth = DOM.pdfFsPagesContainer.clientWidth - 4;
  if (pdfPageDimensions.length > 0 && containerWidth > 0) {
    pdfFsScale = containerWidth / pdfPageDimensions[0].width;
  }
  updateFsZoomDisplay();
  rebuildFsPages();
}

/**
 * Reconstruye páginas al cambiar zoom en pantalla completa.
 */
function rebuildFsPages() {
  if (!DOM.pdfFsPagesContainer || pdfPageDimensions.length === 0) return;

  const currentPage = parseInt(DOM.pdfFsGotoInput?.value) || pdfFsCurrentVisiblePage || 1;
  const target = DOM.pdfFsPagesContainer.querySelector(`[data-page="${currentPage}"]`);
  let relativeOffset = 0;

  if (target && DOM.pdfFsViewport) {
    const viewportRect = DOM.pdfFsViewport.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetTop = targetRect.top - viewportRect.top + DOM.pdfFsViewport.scrollTop;
    relativeOffset = (DOM.pdfFsViewport.scrollTop - targetTop) / target.offsetHeight;
  }

  cancelAllFsRenders();
  pdfFsRenderedPages.clear();

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
 * Salta instantáneamente a una página en el visor de pantalla completa.
 */
function goToFsPage(pageNum) {
  pageNum = Math.max(1, Math.min(pdfTotalPages, pageNum));
  pdfFsCurrentVisiblePage = pageNum;

  if (DOM.pdfFsGotoInput && document.activeElement !== DOM.pdfFsGotoInput) {
    DOM.pdfFsGotoInput.value = pageNum;
  }

  const hymn = getHymnForPdfPage(pageNum);
  if (hymn && DOM.pdfFsGotoHymn && document.activeElement !== DOM.pdfFsGotoHymn) {
    DOM.pdfFsGotoHymn.value = hymn.numero;
  }

  queueFsPageRender(pageNum, true);
  if (pageNum > 1) queueFsPageRender(pageNum - 1);
  if (pageNum < pdfTotalPages) queueFsPageRender(pageNum + 1);

  const target = DOM.pdfFsPagesContainer?.querySelector(`[data-page="${pageNum}"]`);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Event listeners para el visor de pantalla completa.
 */
function registerFsEventListeners() {
  if (DOM.pdfFsClose) {
    DOM.pdfFsClose.onclick = closePdfFullscreen;
  }
  if (DOM.pdfFsZoomIn) {
    DOM.pdfFsZoomIn.onclick = () => pdfFsZoom('in');
  }
  if (DOM.pdfFsZoomOut) {
    DOM.pdfFsZoomOut.onclick = () => pdfFsZoom('out');
  }
  if (DOM.pdfFsFitWidth) {
    DOM.pdfFsFitWidth.onclick = pdfFsFitToWidthMode;
  }

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
}
