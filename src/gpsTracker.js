import L from 'leaflet';

export class GPSTracker {
  constructor(options = {}) {
    this.watchId = null;
    this.points = [];
    this.polyline = null;
    this.isTracking = false;
    this.startTime = null;
    this.lastTime = null;
    this.map = options.map || null;
    this.onLocationUpdate = options.onLocationUpdate || (() => {});
    this.onError = options.onError || (() => {});
    this.gpsReady = false;
    this.lastValidAccuracy = null;
  }

  start() {
    if (this.isTracking) return;
    this.isTracking = true;
    this.points = [];
    this.startTime = Date.now();
    this.lastTime = this.startTime;
    this.polyline = L.polyline([], {
      color: '#2563eb',
      weight: 4,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.map);

    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this._handlePosition(position),
        (error) => this._handleError(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }

  stop() {
    if (!this.isTracking) return;
    this.isTracking = false;
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  _handlePosition(position) {
    const { latitude, longitude, accuracy, speed } = position.coords;
    const now = Date.now();

    // Detect GPS readiness based on accuracy improving over time
    if (!this.gpsReady) {
      if (accuracy < 50) {
        this.gpsReady = true;
        this.onLocationUpdate({ gpsReady: true });
      } else if (this.lastValidAccuracy && accuracy < this.lastValidAccuracy * 0.9) {
        // Accuracy is improving
        this.lastValidAccuracy = accuracy;
      } else if (!this.lastValidAccuracy) {
        this.lastValidAccuracy = accuracy;
      }
    }

    // Only record points if GPS is ready
    if (this.gpsReady) {
      const point = {
        lat: latitude,
        lng: longitude,
        timestamp: now,
        accuracy: accuracy,
        speed: speed // in m/s, may be null
      };

      this.points.push(point);
      this.polyline.addLatLng([latitude, longitude]);

      // Auto-pan map to follow current position
      if (this.map) {
        this.map.setView([latitude, longitude], this.map.getZoom(), { animate: false });
      }

      const elapsed = (now - this.startTime) / 1000; // seconds
      const distance = this._calculateDistance();
      const speedKmh = speed !== null ? speed * 3.6 : 0; // m/s to km/h
      const avgSpeed = distance > 0 && elapsed > 0 ? (distance / 1000) / (elapsed / 3600) : 0;
      const pace = speedKmh > 0 ? (60 / speedKmh) : 0; // min/km

      this.onLocationUpdate({
        latitude,
        longitude,
        speed: speedKmh,
        avgSpeed: avgSpeed,
        distance: distance,
        time: elapsed,
        pointCount: this.points.length,
        gpsReady: this.gpsReady
      });
    }

    this.lastTime = now;
  }

  _handleError(error) {
    console.warn('GPS Error:', error.code, error.message);
    let message = 'Location error';
    if (error.code === error.PERMISSION_DENIED) {
      message = 'Permission denied. Enable location in device settings.';
    } else if (error.code === error.TIMEOUT) {
      message = 'Location timeout. Check if GPS is enabled.';
    } else if (error.code === error.POSITION_UNAVAILABLE) {
      message = 'Location unavailable.';
    }
    this.onError({ message, code: error.code });
  }

  _calculateDistance() {
    // Calculate total distance in meters using Haversine formula
    let distance = 0;
    for (let i = 1; i < this.points.length; i++) {
      const p1 = this.points[i - 1];
      const p2 = this.points[i];
      const d = L.latLng(p1.lat, p1.lng).distanceTo(L.latLng(p2.lat, p2.lng));
      distance += d;
    }
    return distance;
  }

  getTrack() {
    return {
      points: this.points,
      startTime: this.startTime,
      endTime: this.lastTime,
      duration: (this.lastTime - this.startTime) / 1000,
      distance: this._calculateDistance()
    };
  }

  clearPolyline() {
    if (this.polyline && this.map) {
      this.map.removeLayer(this.polyline);
      this.polyline = null;
    }
  }
}
