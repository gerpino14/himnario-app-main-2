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

// Shared PDF Document Cache
let pdfDoc = null;
let pdfDocLoadPromise = null;
let pdfTotalPages = 0;

// Reader Embedded Score State
let readerActiveTab = 'lyrics';
let readerScorePageIdx = 0;
let readerScoreZoomFactor = 1.0;
let readerScoreRenderToken = 0;
let readerScoreModalOpen = false;
let readerScoreModalZoomFactor = 1.0;
let readerScoreModalRenderToken = 0;

// Cánticos de Júbilo State
let canticosData = [];
let filteredCanticos = [];
let activeCanticosFilter = 'all';
let activeCanticoIndex = -1;

// DOM Elements Cache
let DOM = {};

function initDOM() {
  DOM = {
    themeToggle: document.getElementById('theme-toggle'),
    favoritesToggle: document.getElementById('favorites-toggle'),
    mainSearchBar: document.querySelector('.search-bar'),
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

    // Cánticos de Júbilo DOM Elements
    canticosTabBtn: document.getElementById('canticos-tab-btn'),
    canticosSection: document.getElementById('canticos-section'),
    canticosCountPill: document.getElementById('canticos-count-pill'),
    canticosSearchInput: document.getElementById('canticos-search-input'),
    canticosClearSearch: document.getElementById('canticos-clear-search'),
    canticosFilterChips: document.querySelectorAll('.canticos-chip'),
    canticosGrid: document.getElementById('canticos-grid'),
    canticoReaderModal: document.getElementById('cantico-reader-modal'),
    canticoModalBackdrop: document.getElementById('cantico-modal-backdrop'),
    canticoModalClose: document.getElementById('cantico-modal-close'),
    canticoModalNum: document.getElementById('cantico-modal-num'),
    canticoModalSource: document.getElementById('cantico-modal-source'),
    canticoModalPage: document.getElementById('cantico-modal-page'),
    canticoModalTitle: document.getElementById('cantico-modal-title'),
    canticoModalLyrics: document.getElementById('cantico-modal-lyrics'),
    canticoPrevBtn: document.getElementById('cantico-prev-btn'),
    canticoNextBtn: document.getElementById('cantico-next-btn'),
    canticoIndexIndicator: document.getElementById('cantico-index-indicator'),
    canticoCopyBtn: document.getElementById('cantico-copy-btn'),
    canticoCopyText: document.getElementById('cantico-copy-text'),
    
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
    readerViewTabs: document.getElementById('reader-view-tabs'),
    readerTabLyrics: document.getElementById('reader-tab-lyrics'),
    readerTabScore: document.getElementById('reader-tab-score'),
    readerScorePagesBadge: document.getElementById('reader-score-pages-badge'),
    readerLyrics: document.getElementById('reader-lyrics'),
    readerScoreView: document.getElementById('reader-score-view'),
    readerScorePagePill: document.getElementById('reader-score-page-pill'),
    readerScoreCaption: document.getElementById('reader-score-caption'),
    readerScoreZoomOut: document.getElementById('reader-score-zoom-out'),
    readerScoreZoomIn: document.getElementById('reader-score-zoom-in'),
    readerScoreZoomLabel: document.getElementById('reader-score-zoom-label'),
    readerScoreZoomFit: document.getElementById('reader-score-zoom-fit'),
    readerScoreExpandBtn: document.getElementById('reader-score-expand-btn'),
    readerScorePrevBtn: document.getElementById('reader-score-prev-btn'),
    readerScoreNextBtn: document.getElementById('reader-score-next-btn'),
    readerScoreDots: document.getElementById('reader-score-dots'),
    readerScoreStatus: document.getElementById('reader-score-status'),
    readerScorePages: document.getElementById('reader-score-pages'),

    // Expanded Hymn Score Modal (Ampliar)
    readerScoreModal: document.getElementById('reader-score-modal'),
    readerScoreModalClose: document.getElementById('reader-score-modal-close'),
    readerScoreModalTitle: document.getElementById('reader-score-modal-title'),
    readerScoreModalPill: document.getElementById('reader-score-modal-pill'),
    readerScoreModalZoomOut: document.getElementById('reader-score-modal-zoom-out'),
    readerScoreModalZoomIn: document.getElementById('reader-score-modal-zoom-in'),
    readerScoreModalZoomFit: document.getElementById('reader-score-modal-zoom-fit'),
    readerScoreModalZoomLabel: document.getElementById('reader-score-modal-zoom-label'),
    readerScoreModalPrev: document.getElementById('reader-score-modal-prev'),
    readerScoreModalNext: document.getElementById('reader-score-modal-next'),
    readerScoreModalPages: document.getElementById('reader-score-modal-pages'),
    readerScoreModalDots: document.getElementById('reader-score-modal-dots'),
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
    playerTimeCurrent: document.getElementById('player-time-current'),
    playerTimeDuration: document.getElementById('player-time-duration'),
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
    // Cargar himnos, pistas de audio y cánticos de júbilo en paralelo
    const [hymnsRes, pistasRes, canticosRes] = await Promise.all([
      fetch('himnos.json'),
      fetch('himnos_pistas.json').catch(e => {
        console.warn("No se pudo cargar himnos_pistas.json, reproductor de audio deshabilitado.", e);
        return null;
      }),
      fetch('canticos.json').catch(e => {
        console.warn("No se pudo cargar canticos.json.", e);
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

    if (canticosRes && canticosRes.ok) {
      canticosData = await canticosRes.json();
      filteredCanticos = [...canticosData];
    }
    
    handleViewSwitch();

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

function handleViewSwitch() {
  const isCanticos = activeFilter === 'canticos';

  // Ocultar o mostrar buscador principal en barra pegajosa
  if (DOM.mainSearchBar) {
    DOM.mainSearchBar.classList.toggle('hidden', isCanticos);
  }

  if (isCanticos) {
    // Ocultar sección de Himnos
    if (DOM.hymnsGrid) DOM.hymnsGrid.classList.add('hidden');
    if (DOM.resultsCount && DOM.resultsCount.parentElement) {
      DOM.resultsCount.parentElement.classList.add('hidden');
    }
    // Mostrar sección exclusiva de Cánticos de Júbilo
    if (DOM.canticosSection) {
      DOM.canticosSection.classList.remove('hidden');
      applyCanticosFilters();
    }
  } else {
    // Ocultar sección de Cánticos
    if (DOM.canticosSection) DOM.canticosSection.classList.add('hidden');
    // Mostrar sección de Himnos
    if (DOM.hymnsGrid) DOM.hymnsGrid.classList.remove('hidden');
    if (DOM.resultsCount && DOM.resultsCount.parentElement) {
      DOM.resultsCount.parentElement.classList.remove('hidden');
    }
    applySearchAndFilters();
  }
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

// ----------------------------------------------------
// 3.1 Cánticos de Júbilo Engine (Módulo Independiente)
// ----------------------------------------------------
function applyCanticosFilters() {
  if (!canticosData || canticosData.length === 0) return;

  const query = removeAccents(DOM.canticosSearchInput ? DOM.canticosSearchInput.value.trim() : '');

  filteredCanticos = canticosData.filter(item => {
    // 1. Filtro por Chips (Todos / Doxologías)
    if (activeCanticosFilter === 'doxologias' && item.tipo !== 'doxologia') return false;

    // 2. Filtro por Búsqueda (Número, Título, Fuente o Letra)
    if (query !== '') {
      const numStr = (item.numero_display || '').toString().toLowerCase();
      if (numStr === query || numStr.includes(query)) return true;

      const titleMatch = removeAccents(item.titulo || '').includes(query);
      if (titleMatch) return true;

      const sourceMatch = removeAccents(item.fuente || '').includes(query);
      if (sourceMatch) return true;

      if (Array.isArray(item.letra)) {
        for (const line of item.letra) {
          if (removeAccents(line).includes(query)) return true;
        }
      }
      return false;
    }

    return true;
  });

  if (DOM.canticosCountPill) {
    const total = filteredCanticos.length;
    DOM.canticosCountPill.textContent = `${total} cántico${total === 1 ? '' : 's'}`;
  }

  renderCanticos();
}

function renderCanticos() {
  if (!DOM.canticosGrid) return;

  if (filteredCanticos.length === 0) {
    DOM.canticosGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 48px 20px; text-align: center; color: var(--secondary-text);">
        <p style="font-size: 1.15rem; font-weight: 700; margin-bottom: 8px; color: var(--primary-text);">No se encontraron cánticos</p>
        <p style="font-size: 0.9rem;">Prueba buscando por número (ej: 14), título o palabras de la letra.</p>
      </div>
    `;
    return;
  }

  DOM.canticosGrid.innerHTML = filteredCanticos.map(item => {
    const sourceBadge = item.fuente ? `<span class="cantico-source-tag">${item.fuente}</span>` : '';
    const pageBadge = item.pagina_pdf ? `<span class="cantico-page-tag">Pág. ${item.pagina_pdf}</span>` : '';
    const previewText = item.letra && item.letra.length > 0 ? item.letra.slice(0, 2).join(' / ') : '';
    return `
      <article class="cantico-card" data-cantico-id="${item.id}" tabindex="0" role="button" aria-label="Cántico ${item.numero_display}: ${item.titulo}">
        <div class="cantico-card-header">
          <span class="cantico-card-num">${item.numero_display}</span>
          <div class="cantico-card-tags">
            ${sourceBadge}
            ${pageBadge}
          </div>
        </div>
        <h3 class="cantico-card-title">${item.titulo}</h3>
        ${previewText ? `<p class="cantico-card-preview">${previewText}</p>` : ''}
      </article>
    `;
  }).join('');
}

function openCanticoReader(id) {
  const index = filteredCanticos.findIndex(c => c.id === id);
  if (index === -1) return;
  activeCanticoIndex = index;
  renderCurrentCanticoInModal();
  if (DOM.canticoReaderModal) {
    DOM.canticoReaderModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }
}

function renderCurrentCanticoInModal() {
  if (activeCanticoIndex < 0 || activeCanticoIndex >= filteredCanticos.length) return;
  const item = filteredCanticos[activeCanticoIndex];
  if (!item) return;

  if (DOM.canticoModalNum) DOM.canticoModalNum.textContent = item.numero_display;
  if (DOM.canticoModalSource) {
    if (item.fuente) {
      DOM.canticoModalSource.textContent = item.fuente;
      DOM.canticoModalSource.style.display = 'inline-block';
    } else {
      DOM.canticoModalSource.style.display = 'none';
    }
  }
  if (DOM.canticoModalPage) DOM.canticoModalPage.textContent = `Pág. ${item.pagina_pdf || 1}`;
  if (DOM.canticoModalTitle) DOM.canticoModalTitle.textContent = item.titulo;

  if (DOM.canticoModalLyrics) {
    DOM.canticoModalLyrics.innerHTML = (item.letra || []).map(line => `<p>${line}</p>`).join('');
  }

  if (DOM.canticoIndexIndicator) {
    DOM.canticoIndexIndicator.textContent = `${activeCanticoIndex + 1} de ${filteredCanticos.length}`;
  }

  if (DOM.canticoPrevBtn) {
    DOM.canticoPrevBtn.disabled = activeCanticoIndex === 0;
  }
  if (DOM.canticoNextBtn) {
    DOM.canticoNextBtn.disabled = activeCanticoIndex === filteredCanticos.length - 1;
  }
}

function closeCanticoReader() {
  if (DOM.canticoReaderModal) {
    DOM.canticoReaderModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }
}

function navigateCantico(direction) {
  const newIndex = activeCanticoIndex + direction;
  if (newIndex >= 0 && newIndex < filteredCanticos.length) {
    activeCanticoIndex = newIndex;
    renderCurrentCanticoInModal();
  }
}

async function copyCanticoLyrics() {
  if (activeCanticoIndex < 0 || activeCanticoIndex >= filteredCanticos.length) return;
  const item = filteredCanticos[activeCanticoIndex];
  const textToCopy = `${item.numero_display}. ${item.titulo}\n\n${(item.letra || []).join('\n')}\n\n(Cánticos de Júbilo · Pág. ${item.pagina_pdf})`;

  try {
    await navigator.clipboard.writeText(textToCopy);
    if (DOM.canticoCopyBtn) {
      DOM.canticoCopyBtn.classList.add('copied');
      if (DOM.canticoCopyText) DOM.canticoCopyText.textContent = '¡Copiado!';
      setTimeout(() => {
        DOM.canticoCopyBtn.classList.remove('copied');
        if (DOM.canticoCopyText) DOM.canticoCopyText.textContent = 'Copiar letra';
      }, 2000);
    }
    showToast('Letra copiada al portapapeles');
  } catch (e) {
    console.error('Error al copiar letra:', e);
    showToast('No se pudo copiar la letra');
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
      setPlayerTimeDisplay(0, 0);
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

  // Configure Letra / Partitura segmented tabs
  readerScoreRenderToken++;
  readerScoreModalRenderToken++;
  readerScorePageIdx = 0;
  readerScoreZoomFactor = 1.0;
  readerScoreModalZoomFactor = 1.0;
  if (readerScoreModalOpen) closeReaderScoreModal();
  if (DOM.readerScorePages) DOM.readerScorePages.innerHTML = '';
  if (DOM.readerScoreStatus) DOM.readerScoreStatus.classList.add('hidden');
  const scorePages = Array.isArray(hymn.paginas_pdf) ? hymn.paginas_pdf : [];
  if (DOM.readerViewTabs) {
    if (scorePages.length > 0) {
      const badgeText = formatScorePagesBadge(scorePages);
      DOM.readerViewTabs.classList.remove('hidden');
      if (DOM.readerScorePagesBadge) DOM.readerScorePagesBadge.textContent = badgeText;
    } else {
      DOM.readerViewTabs.classList.add('hidden');
    }
  }
  setReaderTab('lyrics');

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

  if (readerScoreModalOpen) {
    closeReaderScoreModal();
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
      handleViewSwitch();
    });
  }
  
  // Section Filters Tabs (Todos / Favoritos / Cánticos de Júbilo)
  if (DOM.filterTabs) {
    DOM.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        DOM.filterTabs.forEach(btn => btn.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = tab.getAttribute('data-filter');
        handleViewSwitch();
      });
    });
  }

  // Cánticos de Júbilo Event Listeners
  if (DOM.canticosSearchInput) {
    DOM.canticosSearchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (DOM.canticosClearSearch) {
        DOM.canticosClearSearch.classList.toggle('hidden', val.length === 0);
      }
      applyCanticosFilters();
    });
  }

  if (DOM.canticosClearSearch) {
    DOM.canticosClearSearch.addEventListener('click', () => {
      if (DOM.canticosSearchInput) {
        DOM.canticosSearchInput.value = '';
        DOM.canticosSearchInput.focus();
      }
      DOM.canticosClearSearch.classList.add('hidden');
      applyCanticosFilters();
    });
  }

  if (DOM.canticosFilterChips) {
    DOM.canticosFilterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.canticosFilterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeCanticosFilter = chip.getAttribute('data-canticos-filter');
        applyCanticosFilters();
      });
    });
  }

  if (DOM.canticosGrid) {
    DOM.canticosGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.cantico-card');
      if (card) {
        const id = card.getAttribute('data-cantico-id');
        openCanticoReader(id);
      }
    });

    DOM.canticosGrid.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.cantico-card');
        if (card) {
          e.preventDefault();
          const id = card.getAttribute('data-cantico-id');
          openCanticoReader(id);
        }
      }
    });
  }

  if (DOM.canticoModalClose) DOM.canticoModalClose.addEventListener('click', closeCanticoReader);
  if (DOM.canticoModalBackdrop) DOM.canticoModalBackdrop.addEventListener('click', closeCanticoReader);
  if (DOM.canticoPrevBtn) DOM.canticoPrevBtn.addEventListener('click', () => navigateCantico(-1));
  if (DOM.canticoNextBtn) DOM.canticoNextBtn.addEventListener('click', () => navigateCantico(1));
  if (DOM.canticoCopyBtn) DOM.canticoCopyBtn.addEventListener('click', copyCanticoLyrics);
  
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

  // Reader Letra / Partitura Tabs, Carousel & Score Zoom
  if (DOM.readerTabLyrics) DOM.readerTabLyrics.addEventListener('click', () => setReaderTab('lyrics'));
  if (DOM.readerTabScore) DOM.readerTabScore.addEventListener('click', () => setReaderTab('score'));
  if (DOM.readerScoreZoomIn) {
    DOM.readerScoreZoomIn.addEventListener('click', () => adjustScoreZoom(false, 1.2));
  }
  if (DOM.readerScoreZoomOut) {
    DOM.readerScoreZoomOut.addEventListener('click', () => adjustScoreZoom(false, 0.8));
  }
  if (DOM.readerScoreZoomFit) {
    DOM.readerScoreZoomFit.addEventListener('click', () => resetScoreZoom(false));
  }
  if (DOM.readerScorePrevBtn) {
    DOM.readerScorePrevBtn.addEventListener('click', () => stepScorePage(-1));
  }
  if (DOM.readerScoreNextBtn) {
    DOM.readerScoreNextBtn.addEventListener('click', () => stepScorePage(1));
  }
  if (DOM.readerScoreExpandBtn) {
    DOM.readerScoreExpandBtn.addEventListener('click', openReaderScoreModal);
  }

  // Expanded Score Modal Controls
  if (DOM.readerScoreModalClose) {
    DOM.readerScoreModalClose.addEventListener('click', closeReaderScoreModal);
  }
  if (DOM.readerScoreModalZoomIn) {
    DOM.readerScoreModalZoomIn.addEventListener('click', () => adjustScoreZoom(true, 1.2));
  }
  if (DOM.readerScoreModalZoomOut) {
    DOM.readerScoreModalZoomOut.addEventListener('click', () => adjustScoreZoom(true, 0.8));
  }
  if (DOM.readerScoreModalZoomFit) {
    DOM.readerScoreModalZoomFit.addEventListener('click', () => resetScoreZoom(true));
  }
  if (DOM.readerScoreModalPrev) {
    DOM.readerScoreModalPrev.addEventListener('click', () => stepScorePage(-1));
  }
  if (DOM.readerScoreModalNext) {
    DOM.readerScoreModalNext.addEventListener('click', () => stepScorePage(1));
  }

  bindScoreSwipe(DOM.readerScorePages, () => stepScorePage(1), () => stepScorePage(-1));
  bindScoreSwipe(DOM.readerScoreModalPages, () => stepScorePage(1), () => stepScorePage(-1));
  
  // Font Resizing Buttons
  if (DOM.fontDecrease) DOM.fontDecrease.addEventListener('click', () => changeFontSize(-2));
  if (DOM.fontIncrease) DOM.fontIncrease.addEventListener('click', () => changeFontSize(2));
  
  // Left/Right Nav Arrows inside Reader
  if (DOM.prevHymnBtn) DOM.prevHymnBtn.addEventListener('click', () => navigateReader(-1));
  if (DOM.nextHymnBtn) DOM.nextHymnBtn.addEventListener('click', () => navigateReader(1));
  
  // Back key gestures (Escape closes modals / drawer)
  document.addEventListener('keydown', (e) => {
    // Cántico Reader Modal
    if (DOM.canticoReaderModal && !DOM.canticoReaderModal.classList.contains('hidden')) {
      if (e.key === 'Escape') {
        closeCanticoReader();
      } else if (e.key === 'ArrowLeft') {
        navigateCantico(-1);
      } else if (e.key === 'ArrowRight') {
        navigateCantico(1);
      }
      return;
    }

    // Expanded Hymn Score Modal (Ampliar)
    if (readerScoreModalOpen && DOM.readerScoreModal && !DOM.readerScoreModal.classList.contains('hidden')) {
      if (e.key === 'Escape') {
        closeReaderScoreModal();
      } else if (e.key === 'ArrowLeft') {
        stepScorePage(-1);
      } else if (e.key === 'ArrowRight') {
        stepScorePage(1);
      }
      return;
    }

    if (DOM.readerModal && !DOM.readerModal.classList.contains('hidden')) {
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
      setPlayerTimeDisplay(0, DOM.readerAudio.duration);
    });
  }

  if (DOM.playerProgress && DOM.readerAudio) {
    DOM.playerProgress.addEventListener('input', (e) => {
      const targetTime = (e.target.value / 100) * DOM.readerAudio.duration;
      if (!isNaN(targetTime)) {
        // Actualizar el tiempo transcurrido en texto mientras arrastra
        setPlayerTimeDisplay(targetTime, DOM.readerAudio.duration);
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
  handleViewSwitch();
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

/**
 * Updates both desktop inline time ("0:00 / 3:37") and mobile split timestamps.
 */
function setPlayerTimeDisplay(currentSecs, durationSecs) {
  const currentStr = formatTime(currentSecs);
  const durationStr = formatTime(durationSecs);
  if (DOM.playerTime) {
    DOM.playerTime.textContent = `${currentStr} / ${durationStr}`;
  }
  if (DOM.playerTimeCurrent) {
    DOM.playerTimeCurrent.textContent = currentStr;
  }
  if (DOM.playerTimeDuration) {
    DOM.playerTimeDuration.textContent = durationStr;
  }
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

  setPlayerTimeDisplay(0, duration);
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
    setPlayerTimeDisplay(current, duration);
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
  if (readerScoreModalOpen) {
    closeReaderScoreModal();
  }

  if (isPresentationMode) {
    exitPresentationMode(true);
  } else {
    enterPresentationMode();
  }
}

function enterPresentationMode() {
  if (!DOM.readerContainer) return;

  if (readerActiveTab !== 'lyrics') {
    setReaderTab('lyrics');
  }

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
// 11. Embedded Hymn Score Viewer (Letra / Partitura + Ampliar)
// ----------------------------------------------------

/**
 * Formatea la etiqueta de páginas de partitura (1 página o rango de varias).
 */
function formatScorePagesBadge(pages) {
  if (!Array.isArray(pages) || pages.length === 0) return '';
  if (pages.length === 1) return `Pág. ${pages[0]}`;
  const isContiguous = pages.every((p, idx) => idx === 0 || p === pages[idx - 1] + 1);
  if (isContiguous) {
    return `Págs. ${pages[0]}–${pages[pages.length - 1]}`;
  }
  return `Págs. ${pages.join(', ')}`;
}

/**
 * Carga y cachea una única instancia de pdfDoc compartida por toda la app.
 */
async function ensurePdfDocumentLoaded(onProgress) {
  if (pdfDoc) return pdfDoc;
  if (typeof pdfjsLib === 'undefined') {
    throw new Error('La biblioteca PDF.js no está disponible.');
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  if (!pdfDocLoadPromise) {
    const loadingTask = pdfjsLib.getDocument({
      url: 'himnario.pdf',
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true,
    });

    if (typeof onProgress === 'function') {
      loadingTask.onProgress = onProgress;
    }

    pdfDocLoadPromise = loadingTask.promise
      .then((doc) => {
        pdfDoc = doc;
        pdfTotalPages = doc.numPages;
        return doc;
      })
      .catch((err) => {
        pdfDocLoadPromise = null;
        throw err;
      });
  }

  return pdfDocLoadPromise;
}

/**
 * Alterna entre la vista de Letra y la vista de Partitura dentro del lector.
 */
function setReaderTab(tab) {
  const hasScore = activeHymn && Array.isArray(activeHymn.paginas_pdf) && activeHymn.paginas_pdf.length > 0;
  const targetTab = (tab === 'score' && hasScore) ? 'score' : 'lyrics';
  readerActiveTab = targetTab;

  const isScore = targetTab === 'score';
  if (DOM.readerTabLyrics) {
    DOM.readerTabLyrics.classList.toggle('is-active', !isScore);
    DOM.readerTabLyrics.setAttribute('aria-selected', String(!isScore));
  }
  if (DOM.readerTabScore) {
    DOM.readerTabScore.classList.toggle('is-active', isScore);
    DOM.readerTabScore.setAttribute('aria-selected', String(isScore));
  }
  if (DOM.readerLyrics) DOM.readerLyrics.classList.toggle('hidden', isScore);
  if (DOM.readerScoreView) DOM.readerScoreView.classList.toggle('hidden', !isScore);

  if (isScore) {
    renderActiveHymnScore();
  }
}

/**
 * Actualiza los controles de carrusel (píldora 1/2, flechas y puntos de paginación).
 */
function updateScoreCarouselChrome({ pages, idx, totalDocPages, pillEl, captionEl, prevBtn, nextBtn, dotsEl }) {
  const hasMultiple = pages.length > 1;
  const pageNum = pages[idx];

  if (pillEl) pillEl.textContent = `${idx + 1}/${pages.length}`;
  if (captionEl) captionEl.textContent = `(Pág. ${pageNum} de ${totalDocPages} en el himnario)`;

  if (prevBtn) {
    prevBtn.classList.toggle('hidden', !hasMultiple);
    prevBtn.disabled = idx <= 0;
  }
  if (nextBtn) {
    nextBtn.classList.toggle('hidden', !hasMultiple);
    nextBtn.disabled = idx >= pages.length - 1;
  }

  if (dotsEl) {
    dotsEl.classList.toggle('hidden', !hasMultiple);
    dotsEl.innerHTML = '';
    if (hasMultiple) {
      pages.forEach((p, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'reader-score-dot' + (i === idx ? ' is-active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-selected', String(i === idx));
        dot.setAttribute('aria-label', `Ir a página ${i + 1} de ${pages.length} (Pág. ${p})`);
        dot.onclick = () => goToScorePage(i);
        dotsEl.appendChild(dot);
      });
    }
  }
}

function goToScorePage(index) {
  const pages = activeHymn && Array.isArray(activeHymn.paginas_pdf) ? activeHymn.paginas_pdf : [];
  if (pages.length === 0) return;
  readerScorePageIdx = Math.max(0, Math.min(pages.length - 1, index));
  if (readerActiveTab === 'score') {
    renderScoreTarget(false);
  }
  if (readerScoreModalOpen) {
    renderScoreTarget(true);
  }
}

function stepScorePage(delta) {
  goToScorePage(readerScorePageIdx + delta);
}

function adjustScoreZoom(isModal, factor) {
  if (isModal) {
    readerScoreModalZoomFactor = Math.max(0.5, Math.min(2.5, readerScoreModalZoomFactor * factor));
    renderScoreTarget(true);
  } else {
    readerScoreZoomFactor = Math.max(0.5, Math.min(2.5, readerScoreZoomFactor * factor));
    renderScoreTarget(false);
  }
}

function resetScoreZoom(isModal) {
  if (isModal) {
    readerScoreModalZoomFactor = 1.0;
    renderScoreTarget(true);
  } else {
    readerScoreZoomFactor = 1.0;
    renderScoreTarget(false);
  }
}

function bindScoreSwipe(container, onSwipeNext, onSwipePrev) {
  if (!container) return;
  let startX = 0;
  let startY = 0;

  container.addEventListener('touchstart', (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    if (!e.changedTouches || e.changedTouches.length !== 1) return;
    // Do not hijack horizontal drag when zoomed in horizontally
    if (container.scrollWidth > container.clientWidth + 6) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) onSwipeNext();
      else onSwipePrev();
    }
  }, { passive: true });
}

function openReaderScoreModal() {
  if (!activeHymn || !DOM.readerScoreModal) return;
  const pages = Array.isArray(activeHymn.paginas_pdf) ? activeHymn.paginas_pdf : [];
  if (pages.length === 0) return;

  readerScoreModalOpen = true;
  readerScoreModalZoomFactor = 1.0;
  DOM.readerScoreModal.classList.remove('hidden');
  DOM.readerScoreModal.setAttribute('aria-hidden', 'false');
  if (DOM.readerScoreModalTitle) {
    DOM.readerScoreModalTitle.textContent = `Himno #${activeHymn.numero} · ${activeHymn.titulo}`;
  }
  renderScoreTarget(true);
}

function closeReaderScoreModal() {
  if (!DOM.readerScoreModal) return;
  readerScoreModalOpen = false;
  readerScoreModalRenderToken++;
  DOM.readerScoreModal.classList.add('hidden');
  DOM.readerScoreModal.setAttribute('aria-hidden', 'true');
  if (DOM.readerScoreModalPages) DOM.readerScoreModalPages.innerHTML = '';
}

/**
 * Renderiza la página activa de la partitura (1 página a la vez en carrusel)
 * tanto en la tarjeta del lector como en el modal ampliado.
 */
async function renderScoreTarget(isModal = false) {
  if (!activeHymn) return;
  const pages = Array.isArray(activeHymn.paginas_pdf) ? activeHymn.paginas_pdf : [];
  if (pages.length === 0) return;

  const pagesContainer = isModal ? DOM.readerScoreModalPages : DOM.readerScorePages;
  if (!pagesContainer) return;

  const idx = Math.max(0, Math.min(pages.length - 1, readerScorePageIdx));
  readerScorePageIdx = idx;

  const token = isModal ? ++readerScoreModalRenderToken : ++readerScoreRenderToken;
  const hymnNum = activeHymn.numero;
  const zoomFactor = isModal ? readerScoreModalZoomFactor : readerScoreZoomFactor;
  const zoomLabel = isModal ? DOM.readerScoreModalZoomLabel : DOM.readerScoreZoomLabel;

  if (!isModal && DOM.readerScoreStatus) {
    DOM.readerScoreStatus.classList.remove('hidden', 'is-error');
    DOM.readerScoreStatus.innerHTML = '<div class="pdf-spinner" aria-hidden="true"></div><span>Cargando partitura…</span>';
  }

  try {
    const doc = await ensurePdfDocumentLoaded();
    const stillValid = isModal
      ? (token === readerScoreModalRenderToken && readerScoreModalOpen)
      : (token === readerScoreRenderToken && readerActiveTab === 'score');
    if (!stillValid || !activeHymn || activeHymn.numero !== hymnNum) return;

    updateScoreCarouselChrome({
      pages,
      idx,
      totalDocPages: doc.numPages,
      pillEl: isModal ? DOM.readerScoreModalPill : DOM.readerScorePagePill,
      captionEl: isModal ? null : DOM.readerScoreCaption,
      prevBtn: isModal ? DOM.readerScoreModalPrev : DOM.readerScorePrevBtn,
      nextBtn: isModal ? DOM.readerScoreModalNext : DOM.readerScoreNextBtn,
      dotsEl: isModal ? DOM.readerScoreModalDots : DOM.readerScoreDots,
    });

    const pageNum = pages[idx];
    if (pageNum < 1 || pageNum > doc.numPages) return;

    const page = await doc.getPage(pageNum);
    const stillValid2 = isModal
      ? (token === readerScoreModalRenderToken && readerScoreModalOpen)
      : (token === readerScoreRenderToken && readerActiveTab === 'score');
    if (!stillValid2 || !activeHymn || activeHymn.numero !== hymnNum) return;

    const baseViewport = page.getViewport({ scale: 1.0 });
    const availWidth = Math.max(240, pagesContainer.clientWidth - (isModal ? 32 : 16));
    let fitScale = availWidth / baseViewport.width;
    if (isModal) {
      const availHeight = Math.max(280, pagesContainer.clientHeight - 24);
      fitScale = Math.min(fitScale, availHeight / baseViewport.height);
    }

    const renderScale = fitScale * zoomFactor;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const viewport = page.getViewport({ scale: renderScale * dpr });

    const canvas = document.createElement('canvas');
    canvas.className = 'reader-score-canvas';
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
    canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    const stillValid3 = isModal
      ? (token === readerScoreModalRenderToken && readerScoreModalOpen)
      : (token === readerScoreRenderToken && readerActiveTab === 'score');
    if (!stillValid3 || !activeHymn || activeHymn.numero !== hymnNum) return;

    const card = document.createElement('div');
    card.className = 'reader-score-page-card';
    card.setAttribute('data-page', pageNum);
    card.appendChild(canvas);

    pagesContainer.innerHTML = '';
    pagesContainer.appendChild(card);

    if (zoomLabel) {
      zoomLabel.textContent = `${Math.round(zoomFactor * 100)}%`;
    }
    if (!isModal && DOM.readerScoreStatus) {
      DOM.readerScoreStatus.classList.add('hidden');
    }
  } catch (err) {
    const activeToken = isModal ? readerScoreModalRenderToken : readerScoreRenderToken;
    if (token !== activeToken) return;
    console.error('Error al renderizar partitura del himno:', err);
    if (!isModal && DOM.readerScoreStatus) {
      DOM.readerScoreStatus.classList.remove('hidden');
      DOM.readerScoreStatus.classList.add('is-error');
      DOM.readerScoreStatus.textContent = 'No se pudo cargar la partitura desde himnario.pdf.';
    }
  }
}

function renderActiveHymnScore() {
  return renderScoreTarget(false);
}
