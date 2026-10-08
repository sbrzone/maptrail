export class DrivingMode {
  constructor(map) {
    this.map = map;
    this.isRecording = false;
    this.tracker = null;
    this.currentMarker = null;
    this.speedAlert = false;
    this.speedLimit = 60; // km/h default
    this.alertSound = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=='); // Silent placeholder
  }

  init(gpsTracker) {
    this.tracker = gpsTracker;
  }

  setSpeedLimit(limitKmh) {
    this.speedLimit = limitKmh;
  }

  startRecording() {
    if (this.isRecording) return;
    this.isRecording = true;
    this.tracker.start();
  }

  stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    this.tracker.stop();
    return this.tracker.getTrack();
  }

  updateSpeedometer(speed) {
    const speedometer = document.getElementById('speedometer-value');
    if (speedometer) {
      speedometer.textContent = Math.round(speed);
    }

    // Check speed alert
    if (speed > this.speedLimit && !this.speedAlert) {
      this.speedAlert = true;
      this._triggerSpeedAlert();
    } else if (speed <= this.speedLimit) {
      this.speedAlert = false;
    }
  }

  updateTripComputer(data) {
    const avgSpeedEl = document.getElementById('avg-speed');
    const distanceEl = document.getElementById('distance');
    const timeEl = document.getElementById('trip-time');

    if (avgSpeedEl) {
      avgSpeedEl.textContent = Math.round(data.avgSpeed);
    }
    if (distanceEl) {
      const distKm = (data.distance / 1000).toFixed(2);
      distanceEl.textContent = distKm;
    }
    if (timeEl) {
      timeEl.textContent = this._formatTime(data.time);
    }
  }

  _triggerSpeedAlert() {
    // Vibrate if available
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    // Play sound (beep)
    try {
      this.alertSound.currentTime = 0;
      this.alertSound.play().catch(() => {});
    } catch (e) {
      // Ignore if sound fails
    }
  }

  _formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}
