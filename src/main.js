import './style.css';
import 'leaflet/dist/leaflet.css';
import { initMap } from './map.js';

const toggleButton = document.getElementById('theme-toggle');

function applyTheme(isDark) {
  document.body.classList.toggle('dark', isDark);
  localStorage.setItem('maptrail-theme', isDark ? 'dark' : 'light');
  toggleButton.textContent = isDark ? 'Light mode' : 'Dark mode';
}

const savedTheme = localStorage.getItem('maptrail-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(savedTheme ? savedTheme === 'dark' : prefersDark);

toggleButton.addEventListener('click', () => {
  const isDark = !document.body.classList.contains('dark');
  applyTheme(isDark);
});

initMap();
