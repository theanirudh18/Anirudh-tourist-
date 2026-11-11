document.addEventListener("DOMContentLoaded", function () {
  const apiKey = 'b214498003msh9e825648a66a8eep1e163djsn397a59057b80';
  let map, clusterGroup, radiusCircle, centerMarker, currentRouteLine;
  let searchCenterCoords = null; // [lat, lon]

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

      const dirBtn = document.createElement('a');
      dirBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`;
      dirBtn.target = "_blank";
      dirBtn.rel = "noopener noreferrer";
      dirBtn.className = "text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium px-2.5 py-1 rounded-md transition";
      dirBtn.textContent = "🧭 Directions";

      btnRow.appendChild(viewBtn);
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
  }

  function openSavedDrawer() {
    const modal = document.getElementById('savedModal');
    if (modal) {
      modal.classList.remove('hidden');
      renderSavedDrawer();
    }
  }

  function closeSavedDrawer() {
    const modal = document.getElementById('savedModal');
    if (modal) modal.classList.add('hidden');
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
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "opentripmap-places-v1.p.rapidapi.com"
        }
      });

      if (!response.ok) {
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

        bounds.extend([placeLat, placeLon]);

        // Place marker with category-styled icon
        const pinIcon = getCategoryPin(rawKinds);
        const marker = L.marker([placeLat, placeLon], { icon: pinIcon }).bindPopup(`
          <div style="min-width: 190px; padding: 4px;">
            <h4 style="font-weight: 700; font-size: 14px; margin: 0 0 4px; color: #1e3a8a;">${escapeHtml(name)}</h4>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 8px;">Distance: ${distance} km ${kinds ? `• ${escapeHtml(kinds)}` : ''}</p>
            <div style="display: flex; gap: 6px; align-items: center;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${placeLat},${placeLon}" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style="font-size: 11px; background-color: #2563eb; color: white; padding: 4px 8px; border-radius: 6px; text-decoration: none;">
                🧭 Directions
              </a>
              <a href="https://www.google.com/search?q=${encodeURIComponent(name)}+tourism&tbm=isch" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style="font-size: 11px; background-color: #f1f5f9; color: #334155; padding: 4px 8px; border-radius: 6px; text-decoration: none;">
                🖼️ Photos
              </a>
            </div>
          </div>
        `);
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
            savePlace({ name, lat: placeLat, lon: placeLon, distance, kinds });
          }
          updateSaveIcon();
        });

        // Direction link
        const dirLink = document.createElement('a');
        dirLink.href = `https://www.google.com/maps/dir/?api=1&destination=${placeLat},${placeLon}`;
        dirLink.target = "_blank";
        dirLink.rel = "noopener noreferrer";
        dirLink.title = "Get directions in Google Maps";
        dirLink.className = "p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg text-sm";
        dirLink.textContent = "🧭";

        // Image link
        const photoLink = document.createElement('a');
        photoLink.href = `https://www.google.com/search?q=${encodeURIComponent(name)}+tourism&tbm=isch`;
        photoLink.target = "_blank";
        photoLink.rel = "noopener noreferrer";
        photoLink.title = "View images on Google";
        photoLink.className = "p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg text-sm";
        photoLink.textContent = "🖼️";

        actionsDiv.appendChild(saveBtn);
        actionsDiv.appendChild(dirLink);
        actionsDiv.appendChild(photoLink);

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
      setStatus("Error fetching tourist places. Please verify your connection or try again later.", true);
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
});
