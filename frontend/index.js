const KOZHIKODE_BOUNDS = [
  [11.05, 75.60],
  [11.45, 76.10]
];

// --- Loading Screen Logic ---
window.addEventListener('load', () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.classList.add('fade-out');
      // Remove from DOM after transition (0.5s)
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }, 2500); // Show for 2.5 seconds
  }

  // --- Star Rating Logic ---
  const stars = document.querySelectorAll('.star');
  const ratingValue = document.getElementById('rating-value');

  stars.forEach(star => {
    star.addEventListener('click', () => {
      const value = parseInt(star.getAttribute('data-value'));
      ratingValue.value = value;
      updateStars(value);
    });
  });

  function updateStars(value) {
    stars.forEach(s => {
      if (parseInt(s.getAttribute('data-value')) <= value) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });
  }
});



let selectedLocationId = null;
let map;
let userMarker;
let allToilets = [];



// --- Map Logic ---
if (document.getElementById('map')) {
  map = L.map('map', {
    zoomControl: false // Move zoom control if needed, or keep default
  }).setView([11.2588, 75.7804], 12);

  L.control.zoom({
    position: 'bottomright'
  }).addTo(map);

  map.setMinZoom(12);
  map.setMaxZoom(18);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
    noWrap: true
  }).addTo(map);

  // Vendor specific cursor
  if (localStorage.getItem("vendor_token")) {
    map.getContainer().style.cursor = "crosshair";
  }

  // Close bottom sheet on map click (if not clicking a marker)
  map.on('click', function (e) {
    if (!localStorage.getItem("vendor_token")) {
      closeBottomSheet();
    }
  });


  // --- Geolocation Logic ---
  // (userMarker and allToilets are now global)

  // Fetch and render markers (Updated to store data)
  fetch("http://localhost:8000/toilets")
    .then(res => res.json())
    .then(data => {
      allToilets = data.items; // Store for later
      const bounds = [];

      data.items.forEach(place => {
        const isFree = place.pricing === "free";

        const circle = L.circleMarker(
          [place.lat, place.lon],
          {
            radius: 8,
            color: "white",
            weight: 2,
            fillColor: isFree ? "#34A853" : "#EA4335",
            fillOpacity: 1,
          }
        ).addTo(map);

        // Open Bottom Sheet on Click
        circle.on("click", function (e) {
          L.DomEvent.stopPropagation(e);
          openBottomSheet(place);
          map.flyTo([place.lat, place.lon], 15, { duration: 0.5 });
        });

        bounds.push([place.lat, place.lon]);
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40] });
        map.setMaxBounds(KOZHIKODE_BOUNDS);
        map.options.maxBoundsViscosity = 1.0;
      }
    })
    .catch(err => {
      console.error("Failed to load toilet data", err);
    });
} // End of Map Logic if-block

// --- Vendor Add Location Logic ---
if (map) {
  let addPopup;
  map.on("click", function (e) {
    const token = localStorage.getItem("vendor_token");
    if (!token) return; // Non-vendors handled by the other click listener

    if (addPopup) {
      map.closePopup(addPopup);
    }

    const { lat, lng } = e.latlng;

    const formHtml = `
            <div style="min-width: 200px;">
                <h3>Add Location</h3>
                <input id="name" placeholder="Place name" style="width: 100%; margin-bottom: 10px; padding: 5px; box-sizing: border-box;"/><br/>
                
                <label>Pricing:</label>
                <select id="pricing" style="width: 100%; margin-bottom: 10px; padding: 5px;">
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                </select><br/>

                <label style="display: flex; align-items: center; gap: 5px; margin-bottom: 15px;">
                    <input type="checkbox" id="accessible"/>
                    Accessible for differently abled
                </label>

                <button onclick="submitLocation(${lat}, ${lng})" class="btn btn-primary" style="width: 100%;">Add Location</button>
            </div>
        `;

    addPopup = L.popup()
      .setLatLng([lat, lng])
      .setContent(formHtml)
      .openOn(map);
  });
}


function locateUser() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }

  // Mock location for demo purposes (near Kozhikode) if real fails or for testing
  // You can remove the fallback if you want strict real location
  const fallbackLat = 11.2588;
  const fallbackLng = 75.7804;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      handleUserLocation(latitude, longitude);
    },
    (error) => {
      console.warn("Geolocation failed or denied, using mock location.", error);
      handleUserLocation(fallbackLat, fallbackLng);
      alert("Using mock location (Kozhikode Center) as geolocation was denied/failed.");
    },
    { enableHighAccuracy: true }
  );
}

function handleUserLocation(lat, lng) {
  // 1. Show user marker
  if (userMarker) {
    userMarker.setLatLng([lat, lng]);
  } else {
    userMarker = L.circleMarker([lat, lng], {
      radius: 10,
      color: "white",
      weight: 3,
      fillColor: "#4285F4", // Blue dot
      fillOpacity: 1
    }).addTo(map).bindPopup("You are here");
  }

  // 2. Find nearest toilet
  if (allToilets.length === 0) return;

  let nearest = null;
  let minDist = Infinity;

  allToilets.forEach(place => {
    const d = getDistanceFromLatLonInKm(lat, lng, place.lat, place.lon);
    if (d < minDist) {
      minDist = d;
      nearest = place;
    }
  });

  if (nearest) {
    // 3. Zoom to fit both
    const bounds = L.latLngBounds([
      [lat, lng],
      [nearest.lat, nearest.lon]
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    // 4. Draw line (optional, lets just open sheet)
    // L.polyline([[lat, lng], [nearest.lat, nearest.lon]], {color: 'blue', dashArray: '5, 10'}).addTo(map);

    // 5. Open Bottom Sheet for nearest
    openBottomSheet(nearest);

    // Add a visual cue to the nearest marker? 
    // We are already opening the sheet which is strong enough.
  }
}

// Haversine formula for distance
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);  // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}


// --- Bottom Sheet Logic ---

function openBottomSheet(place) {
  selectedLocationId = place.id;
  const sheet = document.getElementById('bottom-sheet');
  const title = document.getElementById('sheet-title');
  const details = document.getElementById('sheet-details');
  const commentsContainer = document.getElementById('sheet-comments');
  const commentInput = document.getElementById('sheet-comment-input');
  const commentBtn = document.getElementById('sheet-comment-btn');

  title.innerText = place.name ?? "Unnamed place";
  details.innerHTML = `
        <p><b>Type:</b> ${place.place_type}</p>
        <p><b>Payment:</b> ${place.pricing}</p>
        <p><b>Accessible:</b> ${place.differently_abled_supported ? "Yes" : "No"}</p>
        <p><b>Rating:</b> ${place.rating} ⭐</p>
    `;

  // Clear previous comments
  commentsContainer.innerHTML = "Loading reviews...";
  commentInput.value = "";

  // Set up comment button
  commentBtn.onclick = () => submitComment(place.id);

  sheet.classList.add('open');

  // Load comments
  loadComments(place.id);
}

function closeBottomSheet() {
  document.getElementById('bottom-sheet').classList.remove('open');
  selectedLocationId = null;
}


// --- Logic Variables ---
function submitLocation(lat, lon) {
  // ... validation ...
  const token = localStorage.getItem("vendor_token");

  fetch("http://127.0.0.1:8000/vendor/locations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      name: document.getElementById("name").value,
      lat: lat,
      lon: lon,
      pricing: document.getElementById("pricing").value,
      differently_abled_supported:
        document.getElementById("accessible").checked
    })
  })
    .then(res => res.json())
    .then(() => {
      const pricing = document.getElementById("pricing").value;
      const isFree = pricing === "free";

      // draw the marker immediately
      const circle = L.circleMarker([lat, lon], {
        radius: 8,
        color: "white",
        weight: 2,
        fillColor: isFree ? "#34A853" : "#EA4335",
        fillOpacity: 1,
      }).addTo(map);

      // Add click listener to new marker too
      // We need to fetch the full object or mock it effectively to open the sheet
      // For now, let's just reload the page or fetch all toilets again? 
      // Better: just mock the place object
      const mockPlace = {
        id: "unknown", // Ideal if backend returned ID
        name: document.getElementById("name").value,
        lat: lat,
        lon: lon,
        pricing: pricing,
        place_type: "public_toilet", // default
        differently_abled_supported: document.getElementById("accessible").checked,
        rating: 0
      };

      circle.on("click", function (e) {
        L.DomEvent.stopPropagation(e);
        openBottomSheet(mockPlace);
      });

      map.closePopup();
    });

}

// --- Auth Logic ---

function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const business = document.getElementById("business").value;
  const messageEl = document.getElementById("auth-message");

  if (!email || !password || !business) {
    alert("Please fill all fields");
    return;
  }

  fetch("http://127.0.0.1:8000/auth/vendor/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email,
      password: password,
      business_name: business
    })
  })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.detail || "Signup failed";
        if (messageEl) messageEl.innerText = errorMsg;
        alert(errorMsg);
        throw new Error(errorMsg);
      }
      return data;
    })
    .then(data => {
      if (messageEl) messageEl.innerText = data.message;
      alert(data.message || "Signup successful. Please login.");
    })
    .catch(err => console.error(err));
}


function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const messageEl = document.getElementById("auth-message");

  fetch("http://127.0.0.1:8000/auth/vendor/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email,
      password: password
    })
  })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.detail || "Login failed";
        if (messageEl) messageEl.innerText = errorMsg;
        alert(errorMsg);
        throw new Error(errorMsg);
      }
      return data;
    })
    .then(data => {
      if (data.access_token) {
        localStorage.setItem("vendor_token", data.access_token);
        if (messageEl) messageEl.innerText = "Logged in successfully!";
        setTimeout(() => window.location.href = "index.html", 1000);
      }
    })
    .catch(err => console.error(err));
}


// --- Comments Logic ---

function loadComments(locationId) {
  const container = document.getElementById(`sheet-comments`); // Use sheet container
  if (!container) return;

  fetch(`http://127.0.0.1:8000/comments/${locationId}`)
    .then(res => res.json())
    .then(comments => {
      if (comments.length === 0) {
        container.innerHTML = "<i>No reviews yet</i>";
        return;
      }

      container.innerHTML = comments
        .map(c => {
          const stars = "★".repeat(c.rating || 0) + "☆".repeat(5 - (c.rating || 0));
          return `<div>
                <span style="color: #fbbc04;">${stars}</span> 
                ${c.content}
            </div>`;
        })
        .join("");
    });
}

function submitComment(locationId) {
  const input = document.getElementById(`sheet-comment-input`);
  const ratingInput = document.getElementById('rating-value');
  const stars = document.querySelectorAll('.star');

  const content = input.value.trim();
  const rating = parseInt(ratingInput.value) || 0;

  if (!content) {
    alert("Comment cannot be empty");
    return;
  }

  if (content.length < 3) {
    alert("Comment must be at least 3 characters long");
    return;
  }

  if (rating === 0) {
    alert("Please select a star rating");
    return;
  }

  // Ensure location_id is a string (backend expects str)
  const locIdStr = String(locationId);

  fetch("http://127.0.0.1:8000/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location_id: locIdStr,
      content: content,
      rating: rating
    })
  })
    .then(async res => {
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Submission failed:", errorData);
        if (res.status === 422) {
          const detail = errorData.detail;
          let msg = "Validation Error:";
          if (Array.isArray(detail)) {
            detail.forEach(err => {
              msg += `\n- ${err.loc.join('.')}: ${err.msg}`;
            });
          } else {
            msg += ` ${detail}`;
          }
          alert(msg);
        } else {
          alert("Failed to post review: " + (errorData.message || res.statusText));
        }
        throw new Error("HTTP error " + res.status);
      }
      return res.json();
    })
    .then(() => {
      input.value = "";
      // Reset stars
      ratingInput.value = "0";
      stars.forEach(s => s.classList.remove('active'));

      loadComments(locationId); // Reload comments
    })
    .catch(err => {
      console.error("Error submitting comment:", err);
    });
}
