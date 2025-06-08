document.addEventListener("DOMContentLoaded", function () {
  const apiKey = 'b214498003msh9e825648a66a8eep1e163djsn397a59057b80';
  let map, markers;

  // Initialize map
  function initializeMap(lat = 20.5937, lon = 78.9629, zoom = 5) {
    map = L.map('map').setView([lat, lon], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    markers = L.layerGroup().addTo(map);
  }

  initializeMap();

  // Main function
  window.findPlaces = function () {
    const radius = document.getElementById('radius').value;
    const category = document.getElementById('category').value;
    const mapSection = document.getElementById('mapSection');
    const placesList = document.getElementById('places-list');

    if (!radius || radius <= 0) {
      alert("Please enter a valid radius.");
      return;
    }

    navigator.geolocation.getCurrentPosition(async position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const radiusMeters = radius * 1000;

      // Show map and move to current location
      map.setView([lat, lon], 13);
      markers.clearLayers();

      // Add user location marker
      const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: '<div style="background-color: red; width: 35px; height: 35px; border-radius: 50%; border: 3px solid white;"></div>',
          iconSize: [35, 35],
          iconAnchor: [17, 17]
      });
      
      L.marker([lat, lon], {
          icon: userIcon
      }).addTo(markers).bindPopup("You are here").openPopup();

      mapSection.classList.remove('hidden');
      placesList.innerHTML = `<li class="text-blue-500">Loading places...</li>`;

      try {
        const response = await fetch(`https://opentripmap-places-v1.p.rapidapi.com/en/places/radius?radius=${radiusMeters}&lon=${lon}&lat=${lat}&format=geojson${category ? `&kinds=${category}` : ''}`, {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": apiKey,
            "X-RapidAPI-Host": "opentripmap-places-v1.p.rapidapi.com"
          }
        });

        if (!response.ok) throw new Error("API request failed");

        const data = await response.json();
        placesList.innerHTML = '';

        if (!data.features || data.features.length === 0) {
          placesList.innerHTML = `<li class="text-red-600">No places found in this area.</li>`;
          return;
        }

        // Create bounds to fit all markers
        const bounds = L.latLngBounds();
        
        data.features.forEach(place => {
            const name = place.properties.name || "Unknown";
            const placeLat = place.geometry.coordinates[1];
            const placeLon = place.geometry.coordinates[0];
            const distance = (place.properties.dist / 1000).toFixed(1);

            // Add marker
            const marker = L.marker([placeLat, placeLon]).bindPopup(`
                <div class="place-popup-mini">
                    <h3 class="mini-title">${name}</h3>
                    <span class="mini-distance">${distance} km</span>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${placeLat},${placeLon}" 
                       target="_blank" 
                       class="mini-direction-btn">
                        🗺️
                    </a>
                </div>
            `, {
                closeButton: false,
                autoClose: false,
                closeOnClick: false,
                className: 'mini-popup'
            }).openPopup();
            
            markers.addLayer(marker);

            // Extend bounds to include this marker
            bounds.extend([placeLat, placeLon]);

            // Add to list with both direction and image options
            const li = document.createElement('li');
            li.className = "place-item cursor-pointer hover:bg-blue-100 transition";
            li.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="font-semibold text-blue-700">${name}</h3>
                        <p class="text-sm text-gray-600">Distance: ${distance} km</p>
                    </div>
                    <div class="dropdown-actions">
                        <select class="action-select" onchange="handlePlaceAction(this, '${lat}', '${lon}', '${encodeURIComponent(name)}')">
                            <option value="">Actions</option>
                            <option value="directions">Get Directions</option>
                            <option value="images">View Images</option>
                        </select>
                    </div>
                </div>
            `;
            li.onclick = (e) => {
                // Only trigger map view if not clicking on select
                if (!e.target.closest('select')) {
                    map.setView([lat, lon], 16);
                    marker.openPopup();
                }
            };
            placesList.appendChild(li);
        });

        // Extend bounds to include user location
        bounds.extend([lat, lon]);

        // Fit map to show all markers with padding
        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 15
        });
    } catch (error) {
      console.error(error);
      placesList.innerHTML = `<li class="text-red-600">Error fetching places. Try again later.</li>`;
    }
  }, error => {
    alert("Unable to get your location. Make sure location access is allowed.");
  });
};
});

// Add this function to handle dropdown actions
window.handlePlaceAction = function(select, lat, lon, name) {
  const action = select.value;
  if (action === 'directions') {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank');
  } else if (action === 'images') {
      window.open(`https://www.google.com/search?q=${name}&tbm=isch`, '_blank');
  }
  select.value = ''; // Reset select after action
};


// Review System Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Star Rating Functionality
    const ratingStars = document.querySelectorAll('.star');
    let currentRating = 0;

    ratingStars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const rating = this.dataset.rating;
            highlightStars(rating);
        });

        star.addEventListener('mouseout', function() {
            highlightStars(currentRating);
        });

        star.addEventListener('click', function() {
            currentRating = this.dataset.rating;
            highlightStars(currentRating);
        });
    });

    function highlightStars(rating) {
        ratingStars.forEach(star => {
            star.style.color = star.dataset.rating <= rating ? '#fbbf24' : '#d1d5db';
        });
    }

    // Bookmark Functionality
    const bookmarkBtns = document.querySelectorAll('.bookmark-btn');
    bookmarkBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            const heartIcon = this.querySelector('.heart-icon');
            heartIcon.textContent = this.classList.contains('active') ? '♥' : '♡';
        });
    });

    // Review Form Submission
    const reviewForms = document.querySelectorAll('.review-form');
    reviewForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const textarea = this.querySelector('textarea');
            const review = {
                text: textarea.value,
                rating: currentRating,
                date: new Date().toLocaleDateString(),
                id: Date.now()
            };

            // Add review to the list
            addReviewToList(review);
            
            // Reset form
            textarea.value = '';
            currentRating = 0;
            highlightStars(0);
        });
    });

    function addReviewToList(review) {
        const reviewsList = document.querySelector('.reviews-list');
        if (!reviewsList) {
            const newReviewsList = document.createElement('div');
            newReviewsList.className = 'reviews-list custom-scrollbar';
            document.querySelector('.review-section').appendChild(newReviewsList);
        }

        const reviewElement = document.createElement('div');
        reviewElement.className = 'review-item';
        reviewElement.innerHTML = `
            <div class="review-header">
                <div class="review-rating">
                    ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                </div>
                <span class="review-date">${review.date}</span>
            </div>
            <p class="review-text">${review.text}</p>
        `;

        reviewsList.insertBefore(reviewElement, reviewsList.firstChild);
    }

    // Character Counter
    const reviewTextareas = document.querySelectorAll('.review-form textarea');
    reviewTextareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            const maxLength = this.getAttribute('maxlength');
            const currentLength = this.value.length;
            const counter = this.closest('form').querySelector('.text-sm');
            counter.textContent = `${currentLength}/${maxLength} characters`;
        });
    });
});

