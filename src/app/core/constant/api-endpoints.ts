import { environment } from "../../../environment/environment";

const API = environment.apiBaseUrl;

export const API_ENDPOINTS = {
  // Room Temperature (DHT22)
  roomTemp: {
    create: `${API}/room-temp`,
    getAll: `${API}/room-temp`,
    latest: `${API}/room-temp/latest`
  },

  // Human/Skin Temperature (MLX90614)
  humanTemp: {
    create: `${API}/human-temp`,
    getAll: `${API}/human-temp`,
    latest: `${API}/human-temp/latest`
  },

  // Gas Detection (MQ135)
  gas: {
    create: `${API}/gas`,
    getAll: `${API}/gas`,
    latest: `${API}/gas/latest`
  },

  // Heart Rate (MAX30105)
  heartRate: {
    create: `${API}/heart`,
    getAll: `${API}/heart`,
    latest: `${API}/heart/latest`
  },

  // Skincare AI Analysis
  skincare: {
    analyze: `${API}/skincare/analyze`,  // NEW: AI analysis endpoint
    status: `${API}/skincare/status`
  },

  // Sensor Control
  control: {
    status: `${API}/control/status`,
    enableAll: `${API}/control/enable-all`,
    disableAll: `${API}/control/disable-all`,
    toggleSensor: (sensorName: string) => `${API}/control/sensor/${sensorName}`
  }
};