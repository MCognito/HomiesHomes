/**
 * API Configuration
 * Central place to manage all API endpoints
 */

// Set this to your backend server address
const API_BASE_URL = "https://gammacairo-deltareward-9000.codio-box.uk";

// All the API endpoints our app uses
export const API_ENDPOINTS = {
  // User management
  users: `${API_BASE_URL}/users`,
  login: `${API_BASE_URL}/login`,
  register: `${API_BASE_URL}/register`,

  // Property listings
  properties: `${API_BASE_URL}/properties`,

  // User interactions
  bookings: `${API_BASE_URL}/bookings`,
  favourites: `${API_BASE_URL}/favourites`,

  // Agent application system
  agentRequest: `${API_BASE_URL}/agent-requests/status`, // Get user's request status
  agentRequests: `${API_BASE_URL}/agent-requests`, // Create/manage requests
};

export default API_BASE_URL;
