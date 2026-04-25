// Central API configuration
const API_BASE = process.env.NODE_ENV === 'production'
  ? "https://backend-bice-chi-19.vercel.app/api/v1"
  : "http://localhost:5000/api/v1";

export default API_BASE;
