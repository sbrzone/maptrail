import './style.css';
import 'leaflet/dist/leaflet.css';
import { initMap } from './map.js';
import { GPSTracker } from './gpsTracker.js';
import { DrivingMode } from './drivingMode.js';

const toggleButton = document.getElementById('theme-toggle');
let map = null;
let gpsTracker = null;
let drivingMode = null;

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

map = initMap();

// Initialize GPS Tracker
gpsTracker = new GPSTracker({
  map: map,
  onLocationUpdate: (data) => {
    if (drivingMode) {
      if (data.gpsReady !== undefined) {
        updateGpsStatus(data.gpsReady);
      }
      if (data.speed !== undefined) {
        drivingMode.updateSpeedometer(data.speed);
      }
      if (data.distance !== undefined) {
        drivingMode.updateTripComputer(data);
      }
    }
  },
  onError: (error) => {
    console.error('GPS Error:', error);
    updateGpsStatus(false, error.message);
  }
});

// Initialize Driving Mode
drivingMode = new DrivingMode(map);
drivingMode.init(gpsTracker);

// Set up UI controls
const recordButton = document.getElementById('record-button');
const stopButton = document.getElementById('stop-button');
const speedLimitInput = document.getElementById('speed-limit-input');

recordButton.addEventListener('click', () => {
  drivingMode.startRecording();
  recordButton.disabled = true;
  recordButton.classList.add('recording');
  stopButton.disabled = false;
});

stopButton.addEventListener('click', () => {
  const track = drivingMode.stopRecording();
  console.log('Track saved:', track);
  recordButton.disabled = false;
  recordButton.classList.remove('recording');
  stopButton.disabled = true;
});

speedLimitInput.addEventListener('change', (e) => {
  drivingMode.setSpeedLimit(parseFloat(e.target.value) || 60);
});

function updateGpsStatus(isReady, message = '') {
  const statusEl = document.getElementById('gps-status');
  if (isReady) {
    statusEl.textContent = '✓ GPS Ready';
    statusEl.classList.add('ready');
    statusEl.classList.remove('error');
  } else {
    statusEl.textContent = `✗ GPS ${message || 'Acquiring...'}`;
    statusEl.classList.remove('ready');
    if (message) statusEl.classList.add('error');
  }
  statusEl.classList.add('visible');
}

// Initial GPS status display
const statusEl = document.getElementById('gps-status');
statusEl.textContent = 'Acquiring GPS...';
statusEl.classList.add('visible');
