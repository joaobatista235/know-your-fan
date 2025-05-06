import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});

const AUTH_CHANGE_EVENT = 'auth-state-changed';

let isRefreshingToken = false;
let isLoggingOut = false;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add cache busting parameter to every request
    const cacheBuster = Date.now();
    const separator = config.url.includes('?') ? '&' : '?';
    config.url = `${config.url}${separator}_cb=${cacheBuster}`;
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Verificar se é um erro 401 e não vem dos endpoints relacionados ao Twitter/OAuth
    if (error.response && 
        error.response.status === 401 && 
        !isLoggingOut &&
        !error.config.url.includes('/api/oauth/') &&
        !error.config.url.includes('/social-accounts/')) {
      isLoggingOut = true;
      localStorage.clear();
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Função simplificada para limpar cache
const clearBrowserCaches = async () => {
  if (window.caches) {
    try {
      const keys = await window.caches.keys();
      for (let name of keys) {
        await window.caches.delete(name);
      }
    } catch {} // eslint-disable-line no-empty
  }
  
  try {
    sessionStorage.clear();
  } catch {} // eslint-disable-line no-empty
};

const authService = {
  login: async (email, password) => {
    // Limpar storage antes para evitar dados misturados
    localStorage.clear();
    
    const response = await api.post('/api/auth/login', { email, password });
    
    if (response.data && response.data.user && response.data.user.token) {
      // Armazenar token e dados básicos de autenticação
      localStorage.setItem('authToken', response.data.user.token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('tokenTimestamp', Date.now().toString());
      localStorage.setItem('currentUserEmail', email);
      localStorage.setItem('uid', response.data.user.uid || '');
      
      // Despachar evento de autenticação
      window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { 
        detail: { isAuthenticated: true, email: email }
      }));
    }
    
    return response.data;
  },
  
  register: async (userData) => {
    // Limpar storage antes para evitar dados misturados
    localStorage.clear();
    
    const formattedData = {
      email: userData.email,
      password: userData.password,
      display_name: userData.name || userData.displayName,
    };
    
    const response = await api.post('/api/auth/register', formattedData);
    
    if (response.data && response.data.user && response.data.user.token) {
      // Armazenar token e dados básicos de autenticação
      localStorage.setItem('authToken', response.data.user.token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('tokenTimestamp', Date.now().toString());
      localStorage.setItem('currentUserEmail', userData.email);
      localStorage.setItem('uid', response.data.user.uid || '');
      
      // Despachar evento de autenticação
      window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { 
        detail: { isAuthenticated: true, email: userData.email }
      }));
    }
    
    return response.data;
  },
  
  verifyToken: async () => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await api.post('/api/auth/verify', { token });
      return response.data && response.data.valid;
    } catch {
      localStorage.clear();
      return false;
    }
  },
  
  logout: () => {
    isLoggingOut = true;
    localStorage.clear();
    clearBrowserCaches();
    window.location.href = '/auth';
  },
  
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    
    if (!token || !isAuth) {
      return false;
    }
    
    const isValidFormat = token && typeof token === 'string' && token.split('.').length === 3;
    if (!isValidFormat) {
      return false;
    }

    const tokenTimestamp = parseInt(localStorage.getItem('tokenTimestamp') || '0', 10);
    const now = Date.now();
    const MAX_TOKEN_AGE = 12 * 60 * 60 * 1000;
    
    if (now - tokenTimestamp > MAX_TOKEN_AGE) {
      authService.logout();
      return false;
    }
    
    return true;
  },
  
  refreshAuthState: async () => {
    if (isRefreshingToken || !authService.isAuthenticated()) {
      return false;
    }
    
    try {
      isRefreshingToken = true;
      
      const token = localStorage.getItem('authToken');
      
      const response = await api.post('/api/auth/verify', { token });
      
      if (response.data && response.data.valid) {
        localStorage.setItem('tokenTimestamp', Date.now().toString());
        isRefreshingToken = false;
        return true;
      } else {
        authService.logout();
        isRefreshingToken = false;
        return false;
      }
    } catch {
      isRefreshingToken = false;
      return authService.isAuthenticated();
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

const userService = {
  updateProfile: async (profileData) => {
    // Verificar se temos uma imagem de perfil grande
    let useFormData = false;
    let profileImage = null;
    
    if (profileData.profileImage) {
      // Se temos uma imagem, extrair e enviar separadamente
      profileImage = profileData.profileImage;
      delete profileData.profileImage;
      useFormData = true;
    }
    
    let response;
    
    if (useFormData) {
      // Usar FormData para enviar a imagem grande
      const formData = new FormData();
      
      // Adicionar os dados do perfil como JSON
      formData.append('profileData', JSON.stringify(profileData));
      
      // Extrair a parte de dados da string base64
      if (profileImage.includes(',')) {
        const [header, data] = profileImage.split(',');
        const mimeType = header.split(':')[1].split(';')[0];
        
        // Converter base64 para Blob
        const binaryString = atob(data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        
        // Adicionar a imagem como um arquivo
        formData.append('profileImage', blob, 'profile-image.' + mimeType.split('/')[1]);
      } else {
        // Fallback se não tiver o formato esperado
        formData.append('profileImageBase64', profileImage);
      }
      
      // Enviar com o cabeçalho correto para FormData
      response = await api.put('/api/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } else {
      // Método normal para dados sem imagem
      response = await api.put('/api/users/profile', profileData);
    }
    
    if (response.data && response.data.user) {
      const userData = response.data.user;
      localStorage.setItem('userData', JSON.stringify(userData));
    }
    
    return response.data;
  },
  
  getProfile: async (extraParams = '') => {
    try {
      const cacheBuster = Date.now();
      const currentUserEmail = localStorage.getItem('currentUserEmail');
      
      let url = `/api/users/profile?_=${cacheBuster}`;
      
      if (currentUserEmail) {
        url += `&email=${encodeURIComponent(currentUserEmail)}`;
      }
      
      if (extraParams && extraParams.trim() !== '') {
        const params = extraParams.startsWith('?') ? extraParams.substring(1) : extraParams;
        url += `&${params}`;
      }
      
      const response = await api.get(url);
      
      if (response.data && response.data.user) {
        const userData = response.data.user;
        
        if (currentUserEmail && userData.email !== currentUserEmail) {
          throw new Error('Profile data mismatch');
        }
        
        localStorage.setItem('userData', JSON.stringify(userData));
        return userData;
      }
      return null;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },
  
  getProfileImage: async (extraParams = '') => {
    try {
      const cacheBuster = Date.now();
      const currentUserEmail = localStorage.getItem('currentUserEmail');
      
      let url = `/api/users/profile/image?_=${cacheBuster}`;
      
      if (currentUserEmail) {
        url += `&email=${encodeURIComponent(currentUserEmail)}`;
      }
      
      if (extraParams && extraParams.trim() !== '') {
        const params = extraParams.startsWith('?') ? extraParams.substring(1) : extraParams;
        url += `&${params}`;
      }
      
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (!userData.has_profile_image) {
        return null;
      }
      
      const response = await api.get(url);
      
      if (response.data && response.data.profile_image) {
        return response.data.profile_image;
      }
      
      if (userData.profile_image) {
        return userData.profile_image;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching profile image:', error);
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData.profile_image) {
        return userData.profile_image;
      }
      return null;
    }
  },
  
  analyzeDocument: async (data) => {
    const requestData = data.document ? data : { document: data };
    
    const response = await api.post('/api/document/analyze', requestData);
    return response.data;
  },
  
  getSocialAccounts: async () => {
    const response = await api.get('/api/users/social-accounts');
    return response.data;
  },
  
  getXRequestToken: async (callbackUrl) => {
    const params = callbackUrl ? `?callback_url=${encodeURIComponent(callbackUrl)}` : '';
    const response = await api.get(`/api/oauth/x/request-token${params}`);
    return response.data;
  },
  
  getXRequestTokenV2: async (callbackUrl) => {
    // Use 127.0.0.1 por padrão se nenhum callbackUrl for fornecido
    const defaultCallback = `http://127.0.0.1:5173/oauth/callback`;
    const finalCallbackUrl = callbackUrl || defaultCallback;
    console.log('Usando URL de callback para OAuth 2.0:', finalCallbackUrl);
    
    const params = finalCallbackUrl ? `?callback_url=${encodeURIComponent(finalCallbackUrl)}` : '';
    const response = await api.get(`/api/oauth/x/v2/request-token${params}`);
    return response.data;
  },
  
  processXOAuth2Callback: async (code, state, redirect_uri) => {
    try {
      console.log('Processing OAuth 2.0 callback with parameters:');
      console.log('Code:', code.substring(0, 10) + '...');
      console.log('State:', state);
      console.log('Redirect URI:', redirect_uri);
      
      // Verifique o parâmetro state
      const storedState = localStorage.getItem('x_oauth2_state');
      console.log('Stored state:', storedState);
      
      if (state !== storedState) {
        console.error('State mismatch:', { received: state, stored: storedState });
      }
      
      const response = await api.post('/api/oauth/x/v2/callback', {
        code,
        state,
        redirect_uri
      });
      
      // Log completo de resposta para debug
      console.log('X OAuth 2.0 callback response status:', response.status);
      console.log('X OAuth 2.0 callback response data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error processing X OAuth 2.0 callback:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },
  
  connectSocialAccount: async (data) => {
    const response = await api.post('/api/users/social-accounts/connect', data);
    return response.data;
  },
  
  disconnectSocialAccount: async (platform) => {
    const response = await api.delete(`/api/users/social-accounts/${platform}`);
    return response.data;
  },
  
  getXCurrentUser: async () => {
    try {
      console.log('Attempting to retrieve current X user session...');
      const response = await api.get('/api/oauth/x/v2/current-user');
      console.log('X current user response received:', response.status);
      return response.data;
    } catch (error) {
      console.error('Error getting current X user:', error);
      
      // Provide a more detailed error message based on the status code
      let errorMessage = 'Failed to get current user session';
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        // Server responded with a status code outside of 2xx range
        switch (error.response.status) {
          case 401:
            errorMessage = 'Sessão expirada ou inválida';
            break;
          case 404:
            errorMessage = 'Nenhuma conta do Twitter/X conectada';
            break;
          case 500:
            errorMessage = 'Erro no servidor ao processar solicitação';
            break;
          default:
            errorMessage = error.response.data?.error || errorMessage;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Sem resposta do servidor. Verifique sua conexão.';
      }
      
      return {
        success: false,
        error: errorMessage,
        details: error.response?.data?.details || error.message
      };
    }
  }
};

export { authService, userService };
export default api; 