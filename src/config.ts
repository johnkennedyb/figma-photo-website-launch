const API_BASE_URL = import.meta.env.PROD
  ? 'https://figma-photo-website-launch.onrender.com'
  : 'http://localhost:3002';

const WS_BASE_URL = import.meta.env.PROD
  ? 'wss://figma-photo-website-launch.onrender.com'
  : `http://localhost:${import.meta.env.VITE_SERVER_PORT || 3002}`;

export { API_BASE_URL, WS_BASE_URL };
export default API_BASE_URL;
