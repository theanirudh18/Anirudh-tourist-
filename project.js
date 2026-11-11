document.addEventListener("DOMContentLoaded", function () {
  const apiKey = 'b214498003msh9e825648a66a8eep1e163djsn397a59057b80';
  let map, markers, radiusCircle, centerMarker;

  // Initialize Leaflet map
  function initializeMap(lat = 20.5937, lon = 78.9629, zoom = 5) {
    if (map) return;
    map = L.map('map').setView([lat, lon], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    markers = L.layerGroup().addTo(map);
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

  async function fetchPlaces(lat, lon, radiusKm, category, locationLabel = "Selected location") {
    const mapSection = document.getElementById('mapSection');
    const placesList = document.getElementById('places-list');
    const placesCount = document.getElementById('places-count');
    const radiusMeters = radiusKm * 1000;

    mapSection.classList.remove('hidden');
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 150);

    // Clear previous markers & radius circle
    markers.clearLayers();
    if (radiusCircle && map.hasLayer(radiusCircle)) {
      map.removeLayer(radiusCircle);
    }
    if (centerMarker && map.hasLayer(centerMarker)) {
      map.removeLayer(centerMarker);
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

        // Place marker
        const marker = L.marker([placeLat, placeLon]).bindPopup(`
          <div style="min-width: 180px; padding: 4px;">
            <h4 style="font-weight: 700; font-size: 14px; margin: 0 0 4px; color: #1e3a8a;">${escapeHtml(name)}</h4>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 8px;">Distance: ${distance} km</p>
            <div style="display: flex; gap: 6px;">
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
        markers.addLayer(marker);

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

        const dirLink = document.createElement('a');
        dirLink.href = `https://www.google.com/maps/dir/?api=1&destination=${placeLat},${placeLon}`;
        dirLink.target = "_blank";
        dirLink.rel = "noopener noreferrer";
        dirLink.title = "Get directions in Google Maps";
        dirLink.className = "p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg text-sm";
        dirLink.textContent = "🧭";

        const photoLink = document.createElement('a');
        photoLink.href = `https://www.google.com/search?q=${encodeURIComponent(name)}+tourism&tbm=isch`;
        photoLink.target = "_blank";
        photoLink.rel = "noopener noreferrer";
        photoLink.title = "View images on Google";
        photoLink.className = "p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg text-sm";
        photoLink.textContent = "🖼️";

        actionsDiv.appendChild(dirLink);
        actionsDiv.appendChild(photoLink);

        row.appendChild(textDiv);
        row.appendChild(actionsDiv);
        li.appendChild(row);

        // Click on item centers map on THIS attraction (placeLat, placeLon) and opens popup
        li.addEventListener('click', (e) => {
          if (!e.target.closest('a')) {
            map.setView([placeLat, placeLon], 16);
            marker.openPopup();
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
