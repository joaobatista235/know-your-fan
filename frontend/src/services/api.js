import axios from 'axios';

const API_URL = 'http://192.168.5.10:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

const AUTH_CHANGE_EVENT = 'auth-state-changed';

// Add a flag to prevent multiple logout calls when receiving 401 errors
let isRefreshingToken = false;
let isLoggingOut = false;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 errors if not already logging out
    if (error.response && error.response.status === 401 && !isLoggingOut) {
      isLoggingOut = true;
      console.warn('Unauthorized access detected. Logging out...');
      authService.logout();
      isLoggingOut = false;
    }
    return Promise.reject(error);
  }
);

const notifyAuthChange = (isAuthenticated) => {
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { 
      detail: { isAuthenticated } 
    }));
    
    window.dispatchEvent(new Event('storage'));
    
    if (isAuthenticated) {
      window.dispatchEvent(new Event('auth-refresh'));
    }
  }, 50);
};

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      if (response.data && response.data.user && response.data.user.token) {
        localStorage.clear();
        
        localStorage.setItem('authToken', response.data.user.token);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userData', JSON.stringify(response.data.user || {}));
        localStorage.setItem('profileComplete', response.data.user?.profileComplete || 'false');
        localStorage.setItem('tokenTimestamp', Date.now().toString());
        
        notifyAuthChange(true);
        
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Erro no login:', error.response?.data || error.message);
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      const formattedData = {
        email: userData.email,
        password: userData.password,
        display_name: userData.name
      };
      
      const response = await api.post('/api/auth/register', formattedData);
      
      if (response.data && response.data.user && response.data.user.token) {
        localStorage.clear();
        
        localStorage.setItem('authToken', response.data.user.token);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userData', JSON.stringify(response.data.user || {}));
        localStorage.setItem('profileComplete', 'false');
        localStorage.setItem('tokenTimestamp', Date.now().toString());
        
        notifyAuthChange(true);
        
        return response.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro no cadastro:', error.response?.data || error.message);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userData');
    localStorage.removeItem('profileComplete');
    localStorage.removeItem('tokenTimestamp');
    
    notifyAuthChange(false);
  },
  
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    
    if (!token || !isAuth) {
      return false;
    }
    
    // Check if token has the right format
    const isValidFormat = token && typeof token === 'string' && token.split('.').length === 3;
    if (!isValidFormat) {
      return false;
    }
    
    // Check token expiration (if it's older than 12 hours, consider it expired)
    const tokenTimestamp = parseInt(localStorage.getItem('tokenTimestamp') || '0', 10);
    const now = Date.now();
    const MAX_TOKEN_AGE = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    
    if (now - tokenTimestamp > MAX_TOKEN_AGE) {
      // Token is too old, clear auth state
      authService.logout();
      return false;
    }
    
    return true;
  },
  
  refreshAuthState: async () => {
    // Skip if already refreshing or not authenticated
    if (isRefreshingToken || !authService.isAuthenticated()) {
      return false;
    }
    
    try {
      isRefreshingToken = true;
      
      // Verify the token with the backend
      const token = localStorage.getItem('authToken');
      const response = await api.post('/api/auth/verify', { token });
      
      if (response.data && response.data.valid) {
        // Update the token timestamp
        localStorage.setItem('tokenTimestamp', Date.now().toString());
        isRefreshingToken = false;
        return true;
      } else {
        // Token is invalid, logout
        authService.logout();
        isRefreshingToken = false;
        return false;
      }
    } catch (error) {
      console.error('Error refreshing auth state:', error);
      isRefreshingToken = false;
      return authService.isAuthenticated(); // Still return current auth state
    }
  },
  
  getToken: () => {
    return localStorage.getItem('authToken');
  },
  
  getUserData: () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },
  
  isProfileComplete: () => {
    return localStorage.getItem('profileComplete') === 'true';
  },
  
  setProfileComplete: (status) => {
    localStorage.setItem('profileComplete', status ? 'true' : 'false');
  },
  
  AUTH_CHANGE_EVENT
};

export const userService = {
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/users/profile', profileData);
      
      if (response.data && response.data.user) {
        const userData = authService.getUserData() || {};
        const updatedUserData = { ...userData, ...response.data.user };
        
        // If we sent an image with our update and the profile was marked as having an image
        if (profileData.profileImage && response.data.user.has_profile_image) {
          // Store the image in userData for offline access
          updatedUserData.profileImage = profileData.profileImage;
        }
        
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        localStorage.setItem('profileComplete', 'true');
        
        notifyAuthChange(true);
        
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error.response?.data || error.message);
      
      // Check if the error is related to Firestore being unavailable
      if (error.response?.data?.error?.includes('Firestore database is not available') || 
          error.response?.status === 503) {
        
        console.warn('Firestore unavailable. Using localStorage fallback for profile data.');
        
        // Fallback: Store profile data in localStorage
        const userData = authService.getUserData() || {};
        
        // Create updated userData by merging existing with new profile data
        const updatedUserData = { 
          ...userData,
          ...profileData,
          profileComplete: true
        };
        
        // If we have an image, store it directly in the userData
        if (profileData.profileImage) {
          updatedUserData.profileImage = profileData.profileImage;
          updatedUserData.has_profile_image = true;
        }
        
        // Store updated data
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        localStorage.setItem('profileComplete', 'true');
        localStorage.setItem('usingLocalStorageFallback', 'true');
        
        // Notify that auth state changed
        notifyAuthChange(true);
        
        // Return a mock response similar to what the API would return
        return {
          message: "Profile updated successfully (offline mode)",
          user: updatedUserData
        };
      }
      
      throw error;
    }
  },
  
  getProfileImage: async () => {
    try {
      // First try to get from localStorage
      const userData = authService.getUserData() || {};
      
      // Check if we have a profile image in userData
      if (userData.profileImage) {
        console.log('Using profile image from localStorage');
        return userData.profileImage;
      }
      
      // If not in localStorage and we're in fallback mode, return null
      if (localStorage.getItem('usingLocalStorageFallback') === 'true') {
        return null;
      }
      
      // Otherwise try to get from the server
      try {
        const response = await api.get('/api/users/profile/image');
        
        if (response.data && response.data.profile_image) {
          // Store the image in userData for future use
          userData.profileImage = response.data.profile_image;
          localStorage.setItem('userData', JSON.stringify(userData));
          
          return response.data.profile_image;
        }
      } catch (apiError) {
        // If it's a 404, that's normal - user hasn't uploaded an image yet
        if (apiError.response && apiError.response.status === 404) {
          console.log('User has no profile image yet');
          return null;
        }
        
        // For other errors, rethrow
        throw apiError;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter imagem do perfil:', error.response?.data || error.message);
      
      // If we're in fallback mode, try to get from localStorage
      if (localStorage.getItem('usingLocalStorageFallback') === 'true') {
        const userData = authService.getUserData() || {};
        return userData.profileImage || null;
      }
      
      return null;
    }
  }
};

export default api; 