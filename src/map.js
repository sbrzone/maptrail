import L from 'leaflet';

export function initMap() {
  const map = L.map('map', {
    zoomControl: true,
    attributionControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 15);

        L.circleMarker([latitude, longitude], {
          radius: 8,
          color: '#2563eb',
          fillColor: '#60a5fa',
          fillOpacity: 0.9
        }).addTo(map);
      },
      (error) => {
        console.warn('Geolocation failed:', error.message);
        map.setView([40.7128, -74.006], 11);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  } else {
    map.setView([40.7128, -74.006], 11);
  }

  return map;
}
