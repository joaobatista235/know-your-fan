import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress, Center } from '@chakra-ui/react'
import { Layout } from './presentation/layouts/Layout'
import { Dashboard } from './presentation/pages/Dashboard'
import { Profile } from './presentation/pages/Profile'
import SocialMedia from './presentation/pages/SocialMedia'
import { Documents } from './presentation/pages/Documents'
import { Events } from './presentation/pages/Events'
import { Settings } from './presentation/pages/Settings'
import { Auth } from './presentation/pages/Auth'
import { OAuthCallback } from './presentation/pages/OAuthCallback'
import { useState, useEffect } from 'react'
import { authService } from './services/api'
import { userService } from './services/api'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const updateAuthState = () => {
    const isAuth = authService.isAuthenticated();
    setIsAuthenticated(isAuth);
    return isAuth;
  };

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Verify token and force refresh profile data if authenticated
        const isAuth = authService.isAuthenticated();
        setIsAuthenticated(isAuth);
        
        // If authenticated, refresh profile data
        if (isAuth) {
          try {
            console.log('Refreshing user profile data...');
            await userService.getProfile();
            console.log('Profile data refreshed');
          } catch (err) {
            console.error('Error refreshing profile data:', err);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    const handleAuthChange = (e) => {
      const { isAuthenticated: newAuthState } = e.detail;
      setIsAuthenticated(newAuthState);
    };
    
    const handleStorageChange = () => {
      updateAuthState();
    };
    
    const handleAuthRefresh = () => {
      if (authService.isAuthenticated()) {
        authService.refreshAuthState();
      }
    };
    
    window.addEventListener(authService.AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-refresh', handleAuthRefresh);
    
    const verifyInterval = setInterval(() => {
      if (authService.isAuthenticated()) {
        authService.refreshAuthState();
      }
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener(authService.AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-refresh', handleAuthRefresh);
      clearInterval(verifyInterval);
    };
  }, []);

  if (isLoading) {
    return (
      <Center minH="100vh" bg="brand.dark">
        <CircularProgress isIndeterminate color="brand.primary" />
      </Center>
    );
  }

  return (
    <Box minH="100vh">
      <Routes>
        <Route path="/auth" element={
          isAuthenticated ? <Navigate to="/profile" replace /> : <Auth />
        } />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="*" element={
          isAuthenticated ? (
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/social-media" element={<SocialMedia />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/events" element={<Events />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/auth" replace state={{ from: location.pathname }} />
          )
        } />
      </Routes>
    </Box>
  )
}

export default App
