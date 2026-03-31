import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('niist_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear and redirect if we are not already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('niist_token')
        localStorage.removeItem('niist_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
