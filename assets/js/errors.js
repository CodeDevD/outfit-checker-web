export class CameraError extends Error {
  constructor(message) {
    super(message);
    this.name = "CameraError";
  }
}

export class GeolocationPermissionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GeolocationPermissionError';
  }
}