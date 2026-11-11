document.addEventListener("DOMContentLoaded", function () {
  let map, clusterGroup, radiusCircle, centerMarker, currentRouteLine;
  let searchCenterCoords = null; // [lat, lon]
  let currentDetailPlace = null;

  // --- API Key Management (Secure / No hardcoded keys in Git) ---
  const API_KEY_STORAGE = 'khojkr_rapidapi_key';

  function getApiKey() {
    if (window.KHOJKR_CONFIG && typeof window.KHOJKR_CONFIG.RAPIDAPI_KEY === 'string' && window.KHOJKR_CONFIG.RAPIDAPI_KEY.trim() !== '') {
      return window.KHOJKR_CONFIG.RAPIDAPI_KEY.trim();
    }
    const stored = localStorage.getItem(API_KEY_STORAGE);
    return stored ? stored.trim() : '';
  }

  function openKeyModal(alertMessage = '') {
    if (map) map.closePopup();
    document.body.classList.add('overflow-hidden');
    const modal = document.getElementById('apiKeyModal');
    const input = document.getElementById('rapidApiKeyInput');
    if (modal) modal.classList.remove('hidden');
    if (input) {
      input.value = getApiKey();
      input.focus();
    }
    if (alertMessage) {
      alert(alertMessage);
    }
  }

  function closeKeyModal() {
    const modal = document.getElementById('apiKeyModal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  const openKeyBtn = document.getElementById('openKeyBtn');
  if (openKeyBtn) openKeyBtn.addEventListener('click', () => openKeyModal());

  const closeKeyBtn = document.getElementById('closeKeyBtn');
  if (closeKeyBtn) closeKeyBtn.addEventListener('click', closeKeyModal);

  const apiKeyBackdrop = document.getElementById('apiKeyBackdrop');
  if (apiKeyBackdrop) apiKeyBackdrop.addEventListener('click', closeKeyModal);

  const saveKeyBtn = document.getElementById('saveKeyBtn');
  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', function () {
      const input = document.getElementById('rapidApiKeyInput');
      const val = input ? input.value.trim() : '';
      if (!val) {
        alert("Please enter a valid RapidAPI Key.");
        return;
      }
      localStorage.setItem(API_KEY_STORAGE, val);
      alert("RapidAPI key saved securely in your browser's local storage!");
      closeKeyModal();
    });
  }

  const clearKeyBtn = document.getElementById('clearKeyBtn');
  if (clearKeyBtn) {
    clearKeyBtn.addEventListener('click', function () {
      localStorage.removeItem(API_KEY_STORAGE);
      const input = document.getElementById('rapidApiKeyInput');
      if (input) input.value = '';
      alert("Saved RapidAPI key removed.");
    });
  }

  // --- Saved Places (localStorage) ---
  const STORAGE_KEY = 'khojkr_saved_places';

  function getSavedPlaces() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function savePlace(place) {
    const list = getSavedPlaces();
    if (!list.some(p => p.name === place.name)) {
      list.push(place);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      updateSavedUI();
    }
  }

  function removeSavedPlace(name) {
    let list = getSavedPlaces();
    list = list.filter(p => p.name !== name);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    updateSavedUI();
  }

  function isPlaceSaved(name) {
    const list = getSavedPlaces();
    return list.some(p => p.name === name);
  }

  function updateSavedBadge() {
    const list = getSavedPlaces();
    const badge = document.getElementById('savedCountBadge');
    if (badge) {
      badge.textContent = list.length;
      if (list.length > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
    const summary = document.getElementById('savedSummaryText');
    if (summary) {
      summary.textContent = `${list.length} ${list.length === 1 ? 'place' : 'places'} saved`;
    }
  }

  function renderSavedDrawer() {
    const container = document.getElementById('savedListContainer');
    if (!container) return;
    const list = getSavedPlaces();
    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-400">
          <span class="text-4xl block mb-2">🔖</span>
          <p class="text-sm font-medium">No saved places yet.</p>
          <p class="text-xs text-gray-400 mt-1">Click the heart on any place to save it to your wishlist.</p>
        </div>
      `;
      return;
    }

    list.forEach(place => {
      const card = document.createElement('div');
      card.className = "saved-item-card flex justify-between items-start gap-2";

      const info = document.createElement('div');
      info.className = "flex-1 min-w-0";

      const title = document.createElement('h4');
      title.className = "font-bold text-gray-900 text-sm truncate";
      title.textContent = place.name;

      const meta = document.createElement('p');
      meta.className = "text-xs text-gray-500 mt-0.5 truncate";
      meta.textContent = `${place.distance ? `${place.distance} km away` : 'Saved attraction'}${place.kinds ? ` • ${place.kinds}` : ''}`;

      const btnRow = document.createElement('div');
      btnRow.className = "flex items-center gap-2 mt-2";

      const viewBtn = document.createElement('button');
      viewBtn.type = "button";
      viewBtn.className = "text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium px-2.5 py-1 rounded-md transition";
      viewBtn.textContent = "🗺️ View on Map";
      viewBtn.addEventListener('click', () => {
        closeSavedDrawer();
        const mapSection = document.getElementById('mapSection');
        if (mapSection) mapSection.classList.remove('hidden');
        if (map) {
          map.setView([place.lat, place.lon], 16);
          if (searchCenterCoords) {
            drawRouteLine(searchCenterCoords[0], searchCenterCoords[1], place.lat, place.lon, place.name, place.distance || 0);
          }
        }
      });

      const detailsBtn = document.createElement('button');
      detailsBtn.type = "button";
      detailsBtn.className = "text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium px-2.5 py-1 rounded-md transition";
      detailsBtn.textContent = "📖 Guide";
      detailsBtn.addEventListener('click', () => {
        closeSavedDrawer();
        openPlaceDetails(place);
      });

      const dirBtn = document.createElement('a');
      dirBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`;
      dirBtn.target = "_blank";
      dirBtn.rel = "noopener noreferrer";
      dirBtn.className = "text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium px-2.5 py-1 rounded-md transition";
      dirBtn.textContent = "🧭 Directions";

      btnRow.appendChild(viewBtn);
      btnRow.appendChild(detailsBtn);
      btnRow.appendChild(dirBtn);

      info.appendChild(title);
      info.appendChild(meta);
      info.appendChild(btnRow);

      const delBtn = document.createElement('button');
      delBtn.type = "button";
      delBtn.className = "text-gray-300 hover:text-red-500 text-lg transition p-1";
      delBtn.title = "Remove from saved";
      delBtn.innerHTML = "&times;";
      delBtn.addEventListener('click', () => {
        removeSavedPlace(place.name);
      });

      card.appendChild(info);
      card.appendChild(delBtn);
      container.appendChild(card);
    });
  }

  function updateSavedUI() {
    updateSavedBadge();
    renderSavedDrawer();
    updateDetailModalSaveBtn();
  }

  function openSavedDrawer() {
    if (map) map.closePopup();
    document.body.classList.add('overflow-hidden');
    const modal = document.getElementById('savedModal');
    if (modal) {
      modal.classList.remove('hidden');
      renderSavedDrawer();
    }
  }

  function closeSavedDrawer() {
    const modal = document.getElementById('savedModal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  // --- Place Details & Photos Modal (In-App Guide) ---
  function updateDetailModalSaveBtn() {
    if (!currentDetailPlace) return;
    const saveBtn = document.getElementById('detailSaveBtn');
    const heartIcon = document.getElementById('detailHeartIcon');
    const saveText = document.getElementById('detailSaveText');
    const saved = isPlaceSaved(currentDetailPlace.name);
    if (heartIcon) heartIcon.textContent = saved ? '❤️' : '🤍';
    if (saveText) saveText.textContent = saved ? 'Saved' : 'Save';
    if (saveBtn) {
      saveBtn.className = saved
        ? 'bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-4 rounded-xl flex items-center gap-1.5 text-sm transition'
        : 'bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2.5 px-4 rounded-xl flex items-center gap-1.5 text-sm transition';
    }
  }

  async function openPlaceDetails(place) {
    if (map) map.closePopup();
    document.body.classList.add('overflow-hidden');
    currentDetailPlace = place;
    const modal = document.getElementById('detailsModal');
    const titleEl = document.getElementById('detailTitle');
    const badgeEl = document.getElementById('detailCategoryBadge');
    const subtitleEl = document.getElementById('detailSubtitle');
    const heroImg = document.getElementById('detailHeroImg');
    const extractEl = document.getElementById('detailExtract');
    const loadingEl = document.getElementById('detailLoading');
    const contentEl = document.getElementById('detailContent');
    const dirBtn = document.getElementById('detailDirectionsBtn');
    const wikiBtn = document.getElementById('detailWikiBtn');

    if (!modal) return;
    modal.classList.remove('hidden');

    // Default placeholders
    if (titleEl) titleEl.textContent = place.name;
    if (badgeEl) badgeEl.textContent = place.kinds ? place.kinds.split(',')[0].trim() : 'Attraction';
    if (subtitleEl) subtitleEl.textContent = `${place.distance ? `${place.distance} km away` : 'Tourist Attraction'}`;
    if (heroImg) {
      heroImg.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';
    }
    if (dirBtn) {
      dirBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`;
    }
    if (wikiBtn) {
      wikiBtn.href = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(place.name)}`;
    }

    updateDetailModalSaveBtn();

    if (loadingEl) loadingEl.classList.remove('hidden');
    if (contentEl) contentEl.classList.add('hidden');

    try {
      // Clean search title: strip parenthesis or city suffixes
      const cleanTitle = place.name.replace(/\(.*?\)/g, '').trim();
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTitle)}`;
      const res = await fetch(wikiUrl);

      if (res.ok) {
        const data = await res.json();
        if (data.extract) {
          if (extractEl) extractEl.textContent = data.extract;
          if (heroImg && (data.originalimage?.source || data.thumbnail?.source)) {
            heroImg.src = data.originalimage?.source || data.thumbnail?.source;
          }
          if (wikiBtn && data.content_urls?.desktop?.page) {
            wikiBtn.href = data.content_urls.desktop.page;
          }
        } else {
          showFallbackDescription(extractEl, place);
        }
      } else {
        // Fallback: search Wikipedia API
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanTitle)}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        const topHit = searchData?.query?.search?.[0];

        if (topHit && topHit.title) {
          const secondRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topHit.title)}`);
          if (secondRes.ok) {
            const secondData = await secondRes.json();
            if (extractEl) extractEl.textContent = secondData.extract || topHit.snippet.replace(/<[^>]+>/g, '');
            if (heroImg && (secondData.originalimage?.source || secondData.thumbnail?.source)) {
              heroImg.src = secondData.originalimage?.source || secondData.thumbnail?.source;
            }
            if (wikiBtn && secondData.content_urls?.desktop?.page) {
              wikiBtn.href = secondData.content_urls.desktop.page;
            }
          } else {
            showFallbackDescription(extractEl, place);
          }
        } else {
          showFallbackDescription(extractEl, place);
        }
      }
    } catch {
      showFallbackDescription(extractEl, place);
    } finally {
      if (loadingEl) loadingEl.classList.add('hidden');
      if (contentEl) contentEl.classList.remove('hidden');
    }
  }

  function showFallbackDescription(extractEl, place) {
    if (extractEl) {
      extractEl.innerHTML = `
        A notable ${place.kinds ? `<b>${escapeHtml(place.kinds)}</b>` : 'tourist destination'} located near this area. 
        You can navigate using the directions button or explore historical travel guides online.
      `;
    }
  }

  function closeDetailsModal() {
    const modal = document.getElementById('detailsModal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  const closeDetailsBtn = document.getElementById('closeDetailsBtn');
  if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', closeDetailsModal);

  const detailsBackdrop = document.getElementById('detailsBackdrop');
  if (detailsBackdrop) detailsBackdrop.addEventListener('click', closeDetailsModal);

  const detailSaveBtn = document.getElementById('detailSaveBtn');
  if (detailSaveBtn) {
    detailSaveBtn.addEventListener('click', function () {
      if (!currentDetailPlace) return;
      if (isPlaceSaved(currentDetailPlace.name)) {
        removeSavedPlace(currentDetailPlace.name);
      } else {
        savePlace(currentDetailPlace);
      }
      updateSavedUI();
    });
  }

  // --- Map Initialization ---
  function initializeMap(lat = 20.5937, lon = 78.9629, zoom = 5) {
    if (map) return;
    map = L.map('map').setView([lat, lon], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize marker cluster group (or fallback to layer group)
    if (typeof L.markerClusterGroup === 'function') {
      clusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 40
      });
      map.addLayer(clusterGroup);
    } else {
      clusterGroup = L.layerGroup().addTo(map);
    }
  }

  initializeMap();

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function setStatus(message, isError = false) {
    const placesList = document.getElementById('places-list');
    const placesCount = document.getElementById('places-count');
    if (placesCount) placesCount.textContent = isError ? 'Error' : '';
    if (placesList) {
      placesList.innerHTML = `<li class="${isError ? 'text-red-600 bg-red-50 border-red-200' : 'text-blue-600 bg-blue-50 border-blue-200'} p-4 rounded-xl border text-sm">${escapeHtml(message)}</li>`;
    }
  }

  function getCategoryPin(rawKinds) {
    const cat = (rawKinds || '').toLowerCase();
    let bg = '#2563eb';
    let icon = '📍';

    if (cat.includes('historic') || cat.includes('architecture') || cat.includes('monument')) {
      bg = '#d97706';
      icon = '🏛️';
    } else if (cat.includes('natural') || cat.includes('park') || cat.includes('forest')) {
      bg = '#059669';
      icon = '🌳';
    } else if (cat.includes('religion') || cat.includes('church') || cat.includes('temple') || cat.includes('mosque')) {
      bg = '#7c3aed';
      icon = '⛪';
    } else if (cat.includes('cultural') || cat.includes('theatre') || cat.includes('museum')) {
      bg = '#db2777';
      icon = '🎭';
    } else if (cat.includes('amusement') || cat.includes('sport')) {
      bg = '#ea580c';
      icon = '🎡';
    }

    return L.divIcon({
      className: 'category-pin-wrapper',
      html: `
        <div style="background-color: ${bg}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
          <span style="transform: rotate(45deg); font-size: 13px;">${icon}</span>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -28]
    });
  }

  function drawRouteLine(startLat, startLon, endLat, endLon, placeName, distanceKm) {
    if (currentRouteLine && map.hasLayer(currentRouteLine)) {
      map.removeLayer(currentRouteLine);
    }

    currentRouteLine = L.polyline([[startLat, startLon], [endLat, endLon]], {
      color: '#f97316',
      weight: 3.5,
      opacity: 0.85,
      dashArray: '6, 8'
    }).addTo(map);

    const distNum = parseFloat(distanceKm);
    const driveMinutes = Math.max(1, Math.round((distNum / 35) * 60));
    const walkMinutes = Math.round((distNum / 4.5) * 60);

    L.popup()
      .setLatLng([(startLat + endLat) / 2, (startLon + endLon) / 2])
      .setContent(`
        <div style="font-size: 12px; padding: 2px; text-align: center;">
          <b style="color: #c2410c;">Route to ${escapeHtml(placeName)}</b><br>
          <span>🚗 ~${driveMinutes} mins drive (${distNum} km)</span><br>
          <span>🚶 ~${walkMinutes} mins walk</span>
        </div>
      `)
      .openOn(map);
  }

  async function fetchPlaces(lat, lon, radiusKm, category, locationLabel = "Selected location") {
    const mapSection = document.getElementById('mapSection');
    const placesList = document.getElementById('places-list');
    const placesCount = document.getElementById('places-count');
    const radiusMeters = radiusKm * 1000;
    searchCenterCoords = [lat, lon];

    const activeApiKey = getApiKey();
    if (!activeApiKey) {
      openKeyModal("A RapidAPI Key is required to fetch OpenTripMap attractions. Please paste your key below (saved only in your browser).");
      return;
    }

    mapSection.classList.remove('hidden');
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 150);

    // Clear previous markers, route, and radius circle
    clusterGroup.clearLayers();
    if (radiusCircle && map.hasLayer(radiusCircle)) {
      map.removeLayer(radiusCircle);
    }
    if (centerMarker && map.hasLayer(centerMarker)) {
      map.removeLayer(centerMarker);
    }
    if (currentRouteLine && map.hasLayer(currentRouteLine)) {
      map.removeLayer(currentRouteLine);
    }

    // Add search area circle
    radiusCircle = L.circle([lat, lon], {
      radius: radiusMeters,
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.12,
      weight: 2,
      dashArray: '5, 5'
    }).addTo(map);

    // Add center location marker
    const centerIcon = L.divIcon({
      className: 'user-location-marker',
      html: '<div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    centerMarker = L.marker([lat, lon], { icon: centerIcon })
      .addTo(map)
      .bindPopup(`<b>${escapeHtml(locationLabel)}</b><br><span style="font-size: 12px; color: #64748b;">Search center (${radiusKm} km radius)</span>`);

    setStatus(`Finding tourist places within ${radiusKm} km of ${locationLabel}...`);

    try {
      const url = `https://opentripmap-places-v1.p.rapidapi.com/en/places/radius?radius=${radiusMeters}&lon=${lon}&lat=${lat}&format=geojson${category ? `&kinds=${category}` : ''}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": activeApiKey,
          "X-RapidAPI-Host": "opentripmap-places-v1.p.rapidapi.com"
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Invalid or expired RapidAPI Key. Please check the key in API Key Settings.");
        }
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      placesList.innerHTML = '';

      const features = (data.features || []).filter(place => {
        const name = place.properties && place.properties.name;
        return name && name.trim().length > 0;
      });

      if (features.length === 0) {
        if (placesCount) placesCount.textContent = '0 places';
        setStatus(`No named tourist attractions found within ${radiusKm} km. Try increasing the radius or choosing "All Categories".`);
        map.setView([lat, lon], 12);
        return;
      }

      if (placesCount) {
        placesCount.textContent = `${features.length} ${features.length === 1 ? 'place' : 'places'}`;
      }

      // Sort by distance ascending
      features.sort((a, b) => (a.properties.dist || 0) - (b.properties.dist || 0));

      const bounds = L.latLngBounds([[lat, lon]]);

      features.forEach(place => {
        const name = place.properties.name || "Attraction";
        const placeLat = place.geometry.coordinates[1];
        const placeLon = place.geometry.coordinates[0];
        const distance = ((place.properties.dist || 0) / 1000).toFixed(1);
        const rawKinds = place.properties.kinds || "";
        const kinds = rawKinds
          .split(',')
          .slice(0, 2)
          .map(k => k.replace(/_/g, ' '))
          .join(', ');

        const placeObj = { name, lat: placeLat, lon: placeLon, distance, kinds };

        bounds.extend([placeLat, placeLon]);

        // Place marker with category-styled icon
        const pinIcon = getCategoryPin(rawKinds);
        const marker = L.marker([placeLat, placeLon], { icon: pinIcon });

        // Build popup content safely
        const popupDiv = document.createElement('div');
        popupDiv.style.minWidth = '190px';
        popupDiv.style.padding = '4px';

        const popupTitle = document.createElement('h4');
        popupTitle.style.fontWeight = '700';
        popupTitle.style.fontSize = '14px';
        popupTitle.style.margin = '0 0 4px';
        popupTitle.style.color = '#1e3a8a';
        popupTitle.textContent = name;

        const popupMeta = document.createElement('p');
        popupMeta.style.fontSize = '12px';
        popupMeta.style.color = '#64748b';
        popupMeta.style.margin = '0 0 8px';
        popupMeta.textContent = `Distance: ${distance} km ${kinds ? `• ${kinds}` : ''}`;

        const popupActions = document.createElement('div');
        popupActions.style.display = 'flex';
        popupActions.style.gap = '6px';
        popupActions.style.alignItems = 'center';

        const guideBtn = document.createElement('button');
        guideBtn.type = 'button';
        guideBtn.style.fontSize = '11px';
        guideBtn.style.backgroundColor = '#4f46e5';
        guideBtn.style.color = 'white';
        guideBtn.style.padding = '4px 8px';
        guideBtn.style.borderRadius = '6px';
        guideBtn.style.border = 'none';
        guideBtn.style.cursor = 'pointer';
        guideBtn.textContent = '📖 Details';
        guideBtn.addEventListener('click', () => openPlaceDetails(placeObj));

        const dirLink = document.createElement('a');
        dirLink.href = `https://www.google.com/maps/dir/?api=1&destination=${placeLat},${placeLon}`;
        dirLink.target = '_blank';
        dirLink.rel = 'noopener noreferrer';
        dirLink.style.fontSize = '11px';
        dirLink.style.backgroundColor = '#2563eb';
        dirLink.style.color = 'white';
        dirLink.style.padding = '4px 8px';
        dirLink.style.borderRadius = '6px';
        dirLink.style.textDecoration = 'none';
        dirLink.textContent = '🧭 Routes';

        popupActions.appendChild(guideBtn);
        popupActions.appendChild(dirLink);

        popupDiv.appendChild(popupTitle);
        popupDiv.appendChild(popupMeta);
        popupDiv.appendChild(popupActions);

        marker.bindPopup(popupDiv);
        clusterGroup.addLayer(marker);

        // Place item in sidebar list
        const li = document.createElement('li');
        li.className = "place-item cursor-pointer p-3.5 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition shadow-sm";

        const row = document.createElement('div');
        row.className = "flex justify-between items-center gap-2";

        const textDiv = document.createElement('div');
        textDiv.className = "flex-1 min-w-0";

        const titleEl = document.createElement('h3');
        titleEl.className = "font-semibold text-blue-900 text-sm truncate";
        titleEl.textContent = name;

        const subEl = document.createElement('p');
        subEl.className = "text-xs text-gray-500 mt-0.5 truncate";
        subEl.textContent = `${distance} km${kinds ? ` • ${kinds}` : ''}`;

        textDiv.appendChild(titleEl);
        textDiv.appendChild(subEl);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = "flex items-center gap-1 flex-shrink-0";

        // Details Guide button
        const listDetailsBtn = document.createElement('button');
        listDetailsBtn.type = "button";
        listDetailsBtn.className = "p-1.5 rounded-lg text-sm text-indigo-600 hover:bg-indigo-100 transition";
        listDetailsBtn.title = "View in-app guide & photos";
        listDetailsBtn.textContent = "📖";
        listDetailsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openPlaceDetails(placeObj);
        });

        // Save / Bookmark button
        const saveBtn = document.createElement('button');
        saveBtn.type = "button";
        saveBtn.className = "p-1.5 rounded-lg text-sm hover:bg-red-50 transition";
        const updateSaveIcon = () => {
          const saved = isPlaceSaved(name);
          saveBtn.innerHTML = saved ? "❤️" : "🤍";
          saveBtn.title = saved ? "Saved in wishlist" : "Save to wishlist";
        };
        updateSaveIcon();
        saveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (isPlaceSaved(name)) {
            removeSavedPlace(name);
          } else {
            savePlace(placeObj);
          }
          updateSaveIcon();
        });

        // Direction link
        const listDirLink = document.createElement('a');
        listDirLink.href = `https://www.google.com/maps/dir/?api=1&destination=${placeLat},${placeLon}`;
        listDirLink.target = "_blank";
        listDirLink.rel = "noopener noreferrer";
        listDirLink.title = "Get directions in Google Maps";
        listDirLink.className = "p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg text-sm";
        listDirLink.textContent = "🧭";

        actionsDiv.appendChild(listDetailsBtn);
        actionsDiv.appendChild(saveBtn);
        actionsDiv.appendChild(listDirLink);

        row.appendChild(textDiv);
        row.appendChild(actionsDiv);
        li.appendChild(row);

        // Click on item centers map, draws route line, and opens popup
        li.addEventListener('click', (e) => {
          if (!e.target.closest('a') && !e.target.closest('button')) {
            map.setView([placeLat, placeLon], 16);
            marker.openPopup();
            drawRouteLine(lat, lon, placeLat, placeLon, name, distance);
          }
        });

        placesList.appendChild(li);
      });

      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } catch (err) {
      console.error(err);
      setStatus(err.message || "Error fetching tourist places. Please verify your connection or API key.", true);
    }
  }

  async function searchByCity(city, radiusKm, category) {
    const mapSection = document.getElementById('mapSection');
    mapSection.classList.remove('hidden');
    setStatus(`Searching coordinates for "${city}"...`);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(city)}`, {
        headers: { "Accept-Language": "en" }
      });
      const data = await res.json();
      if (!data || data.length === 0) {
        setStatus(`Could not find location "${city}". Please check spelling or use GPS.`, true);
        return;
      }
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      const displayName = data[0].display_name.split(',')[0];
      await fetchPlaces(lat, lon, radiusKm, category, displayName);
    } catch (err) {
      console.error(err);
      setStatus("Error geocoding the city name. Please try again.", true);
    }
  }

  function searchByGPS(radiusKm, category) {
    const mapSection = document.getElementById('mapSection');
    mapSection.classList.remove('hidden');
    setStatus("Accessing your current location...");

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser. Please enter a city name instead.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchPlaces(lat, lon, radiusKm, category, "Your Location");
      },
      error => {
        console.warn("Geolocation failed:", error);
        setStatus("Location permission denied or unavailable. Please type a city name above (e.g. 'Jaipur', 'Paris').", true);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  window.findPlaces = function () {
    const cityInput = document.getElementById('searchCity');
    const radiusInput = document.getElementById('radius');
    const categoryInput = document.getElementById('category');

    const city = cityInput ? cityInput.value.trim() : '';
    const radius = radiusInput ? parseFloat(radiusInput.value) : 10;
    const category = categoryInput ? categoryInput.value : '';

    if (!radius || radius <= 0 || isNaN(radius)) {
      alert("Please enter a valid radius in kilometers.");
      return;
    }

    if (city.length > 0) {
      searchByCity(city, radius, category);
    } else {
      searchByGPS(radius, category);
    }
  };

  // GPS button click handler
  const gpsBtn = document.getElementById('gpsBtn');
  if (gpsBtn) {
    gpsBtn.addEventListener('click', function () {
      const cityInput = document.getElementById('searchCity');
      if (cityInput) cityInput.value = '';
      const radiusInput = document.getElementById('radius');
      const categoryInput = document.getElementById('category');
      const radius = radiusInput ? parseFloat(radiusInput.value) : 10;
      const category = categoryInput ? categoryInput.value : '';
      searchByGPS(radius, category);
    });
  }

  // Saved Drawer Event Listeners
  const openSavedBtn = document.getElementById('openSavedBtn');
  if (openSavedBtn) {
    openSavedBtn.addEventListener('click', openSavedDrawer);
  }

  const closeSavedBtn = document.getElementById('closeSavedBtn');
  if (closeSavedBtn) {
    closeSavedBtn.addEventListener('click', closeSavedDrawer);
  }

  const savedBackdrop = document.getElementById('savedBackdrop');
  if (savedBackdrop) {
    savedBackdrop.addEventListener('click', closeSavedDrawer);
  }

  const clearSavedBtn = document.getElementById('clearSavedBtn');
  if (clearSavedBtn) {
    clearSavedBtn.addEventListener('click', function () {
      if (confirm("Are you sure you want to clear all saved places?")) {
        localStorage.removeItem(STORAGE_KEY);
        updateSavedUI();
      }
    });
  }

  // Initialize saved badge on load
  updateSavedBadge();

  // Allow pressing Enter key in search fields
  const inputs = [document.getElementById('searchCity'), document.getElementById('radius')];
  inputs.forEach(input => {
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.findPlaces();
        }
      });
    }
  });

  // Quick Search Destination Chips
  const quickChips = document.querySelectorAll('.quick-chip[data-city]');
  quickChips.forEach(chip => {
    chip.addEventListener('click', function () {
      const city = this.getAttribute('data-city');
      const cityInput = document.getElementById('searchCity');
      if (cityInput) {
        cityInput.value = city;
      }
      quickChips.forEach(c => c.classList.remove('ring-2', 'ring-orange-400', 'bg-white/30'));
      this.classList.add('ring-2', 'ring-orange-400', 'bg-white/30');

      window.findPlaces();

      const mapSection = document.getElementById('mapSection');
      if (mapSection) {
        setTimeout(() => {
          mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    });
  });

  // Surprise Me Random City Generator
  const surpriseBtn = document.getElementById('surpriseBtn');
  if (surpriseBtn) {
    const surpriseDestinations = [
      'Jaipur', 'Agra', 'Goa', 'Udaipur', 'Varanasi',
      'Kochi', 'Amritsar', 'Leh', 'Hampi', 'Manali',
      'Mysore', 'Ooty', 'Jodhpur', 'Rishikesh', 'Shimla'
    ];
    surpriseBtn.addEventListener('click', function () {
      const randomCity = surpriseDestinations[Math.floor(Math.random() * surpriseDestinations.length)];
      const cityInput = document.getElementById('searchCity');
      if (cityInput) {
        cityInput.value = randomCity;
      }
      quickChips.forEach(c => c.classList.remove('ring-2', 'ring-orange-400', 'bg-white/30'));
      this.classList.add('animate-bounce');
      setTimeout(() => this.classList.remove('animate-bounce'), 700);

      window.findPlaces();

      const mapSection = document.getElementById('mapSection');
      if (mapSection) {
        setTimeout(() => {
          mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    });
  }
});
