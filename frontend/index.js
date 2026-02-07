const KOZHIKODE_BOUNDS = [
    [11.05, 75.60],
    [11.45, 76.10]
  ];

// 1. Initialize map 
var map = L.map('map').setView([11.2588, 75.7804], 12);


map.setMinZoom(10);
map.setMaxZoom(18);
  

// 2. Add tile layer 
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
    noWrap: true
  }).addTo(map);
  
  

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
          radius: 6,                     // small, clean
          color: isFree ? "green" : "red",
          fillColor: isFree ? "green" : "red",
          fillOpacity: 0.8,
          weight: 2
        }
      ).addTo(map);

      circle.bindPopup(`
        <strong>${place.name ?? "Unnamed place"}</strong><br/>
        Type: ${place.place_type}<br/>
        Toilet: ${place.pricing}<br/>
        Rating: ${place.rating}
      `);

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

