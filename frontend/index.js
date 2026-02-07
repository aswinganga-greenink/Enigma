const KOZHIKODE_BOUNDS = [
    [11.05, 75.60],
    [11.45, 76.10]
  ];

// 1. Initialize map 
var map = L.map('map').setView([11.2588, 75.7804], 12);


map.setMinZoom(12); // change to set min zoom
map.setMaxZoom(18); // change to set max zoom
  

// 2. Add tile layer 
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
    noWrap: true
  }).addTo(map);
  
  if (localStorage.getItem("vendor_token")) {
    map.getContainer().style.cursor = "crosshair";
  }
  
  

// 3. Fetch backend data and render markers
fetch("http://localhost:8000/toilets")
  .then(res => res.json())
  .then(data => {
    const bounds = [];

    data.items.forEach(place => {
      const isFree = place.pricing === "free";

      const circle = L.circleMarker(
        [place.lat, place.lon],
        {
          radius: 6,                     
          color: isFree ? "green" : "red",
          fillColor: isFree ? "green" : "red",
          fillOpacity: 0.8,
          weight: 2
        }
      ).addTo(map);

      circle.bindPopup(`
        <strong>${place.name ?? "Unnamed place"}</strong><br/>
        <b>Type:</b> ${place.place_type}<br/>
        <b>Toilet:</b> ${place.pricing}<br/>
        <b>Accessible:</b> ${place.differently_abled_supported ? "Yes" : "No"}<br/>
        <b>Rating:</b> ${place.rating} ⭐

        <div id="comments-${place.id}">
            Loading comments...
        </div>

        <textarea id="comment-input-${place.id}" placeholder="Leave a comment"></textarea>
        <button onclick="submitComment('${place.id}')">Post</button>

      `);

      circle.on("popupopen", function () {
        loadComments(place.id);
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


// Vendor pop up handler

let addPopup;

map.on("click", function (e) {
    const token = localStorage.getItem("vendor_token");
    if (!token) {
      alert("Please login as vendor to add a location");
      return;
    }

  if (addPopup) {
    map.closePopup(addPopup);
  }

  const { lat, lng } = e.latlng;

  const formHtml = `
    <div>
      <strong>Add Toilet Location</strong><br/><br/>
      <input id="name" placeholder="Place name"/><br/><br/>

      <select id="pricing">
        <option value="free">Free</option>
        <option value="paid">Paid</option>
      </select><br/><br/>

      <label>
        Accessible
        <input type="checkbox" id="accessible"/>
      </label><br/><br/>

      <button onclick="submitLocation(${lat}, ${lng})">
        Add
      </button>
    </div>
  `;

  addPopup = L.popup()
    .setLatLng([lat, lng])
    .setContent(formHtml)
    .openOn(map);
});


function submitLocation(lat, lon) {
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
        L.circleMarker([lat, lon], {
          radius: 6,
          color: isFree ? "green" : "red",
          fillColor: isFree ? "green" : "red",
          fillOpacity: 0.8,
          weight: 2
        })
        .addTo(map)
        .bindPopup(`
          <strong>${document.getElementById("name").value}</strong><br/>
          Toilet: ${pricing}<br/>
          Accessible: ${
            document.getElementById("accessible").checked ? "Yes" : "No"
          }
        `);
      
        map.closePopup();
      });
      
  }
  
// auth logic
  function signup() {
    fetch("http://127.0.0.1:8000/auth/vendor/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        business_name: document.getElementById("business").value
      })
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById("auth-status").innerText =
        data.message || "Signup complete. Now login.";
    });
  }
  

  function login() {
    fetch("http://127.0.0.1:8000/auth/vendor/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.access_token) {
        localStorage.setItem("vendor_token", data.access_token);
        document.getElementById("auth-status").innerText = "Logged in ✔";
      } else {
        document.getElementById("auth-status").innerText = "Login failed";
      }
    });
  }

  map.getContainer().style.cursor = "crosshair";

  

// load comments logic

function loadComments(locationId) {
    fetch(`http://127.0.0.1:8000/comments/${locationId}`)
      .then(res => res.json())
      .then(comments => {
        const container = document.getElementById(`comments-${locationId}`);
        if (!container) return;
  
        if (comments.length === 0) {
          container.innerHTML = "<i>No comments yet</i>";
          return;
        }
  
        container.innerHTML = comments
          .map(c => `<p>• ${c.content}</p>`)
          .join("");
      });
  }
//submit logic

function submitComment(locationId) {
    const input = document.getElementById(`comment-input-${locationId}`);
    const content = input.value.trim();
  
    if (!content) return;
  
    fetch("http://127.0.0.1:8000/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location_id: locationId,
        content: content
      })
    })
    .then(() => {
        input.value = "";
      });
      
  }
  