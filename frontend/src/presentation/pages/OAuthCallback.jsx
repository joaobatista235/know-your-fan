import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Spinner,
  Text,
  Center,
  VStack,
  Alert,
  AlertIcon,
  Button,
  Box,
  Code,
  Heading,
  Collapse,
  useDisclosure,
  Avatar,
  HStack,
  Badge,
  Divider
} from '@chakra-ui/react'
import { userService } from '../../services/api'

/**
 * Componente que lida com o redirecionamento OAuth
 * Extrai o código da URL e o envia para a janela principal
 * e fecha a janela automaticamente
 */
export const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState({});
  const [userData, setUserData] = useState(null);
  const [followedAccounts, setFollowedAccounts] = useState([]);
  const { isOpen, onToggle } = useDisclosure();
  const [showAdvancedDebug, setShowAdvancedDebug] = useState(false);
  
  useEffect(() => {
    const processCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      
      // Capture and log all URL parameters for debugging
      const allParams = {};
      urlParams.forEach((value, key) => {
        allParams[key] = value;
      });
      
      console.log('OAuth callback URL parameters:', allParams);
      console.log('Callback URL completa:', window.location.href);
      setDebug(allParams);

      // Adicionar um log para depuração da URL atual
      document.title = "OAuth Callback - Processando...";
      
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const denied = urlParams.get('denied');
      const oauthToken = urlParams.get('oauth_token');
      const oauthVerifier = urlParams.get('oauth_verifier');
      const state = urlParams.get('state');
      
      // Verificar o método de autenticação que foi usado
      const authMethod = localStorage.getItem('auth_method') || '';
      console.log('Método de autenticação usado:', authMethod);
      
      // Exibir os estados para depuração
      const storedState = localStorage.getItem('x_oauth2_state');
      console.log('Estado armazenado:', storedState);
      console.log('Estado recebido:', state);
      if (storedState !== state) {
        console.warn('⚠️ ALERTA: Estado armazenado não coincide com o estado recebido!');
      }
      
      // Check if this is a direct redirect callback (not a popup)
      const isDirect = !window.opener && (code || error);
      
      if (isDirect) {
        console.log('Processing direct (non-popup) OAuth callback');
        // Handle direct redirect authentication
        if (code && state) {
          try {
            const redirectUri = `${window.location.origin}/oauth/callback`;
            
            // Get stored state from localStorage
            const storedState = localStorage.getItem('x_oauth2_state');
            const platform = localStorage.getItem('connecting_platform');
            
            if (storedState !== state) {
              console.error('State mismatch:', storedState, state);
              setStatus('error');
              setError('Invalid state parameter. Authentication flow may have been tampered with.');
              return;
            }
            
            console.log('Processing direct OAuth callback with valid state and code');
            setStatus('processing');
            
            // Process the callback on the server
            const response = await userService.processXOAuth2Callback(
              code,
              state,
              redirectUri
            );
            
            console.log('OAuth callback processed successfully:', response);
            
            if (response && response.success) {
              // Store account info for display
              if (response.userInfo) {
                setUserData(response.userInfo);
              }
              
              if (response.followedAccounts) {
                setFollowedAccounts(response.followedAccounts);
                
                // Print detailed follower information to the console
                console.log(`==== Perfil Autenticado do ${platform} ====`);
                if (response.userInfo) {
                  const user = response.userInfo;
                  console.log(`Nome: ${user.name}`);
                  console.log(`Username: ${user.screenName}`);
                  console.log(`ID: ${user.userId}`);
                  console.log(`Foto de Perfil: ${user.profileImageUrl || 'Não disponível'}`);
                }
                
                console.log(`\n==== Lista de ${response.followedAccounts.length} contas seguidas no ${platform} ====`);
                response.followedAccounts.forEach((account, index) => {
                  console.log(`\n${index + 1}. ${account.name} (${account.username})`);
                  console.log(`   Seguidores: ${account.followers}`);
                  if (account.isVerified) console.log('   ✓ Conta verificada');
                  if (account.description) console.log(`   Descrição: ${account.description.substring(0, 100)}${account.description.length > 100 ? '...' : ''}`);
                });
              }
              
              setStatus('success');
            } else {
              setStatus('error');
              setError(response?.error || 'Failed to process authentication');
            }
          } catch (e) {
            console.error('Error processing direct OAuth callback:', e);
            setStatus('error');
            setError(e.message || 'Error processing authentication response');
          }
        } else if (error || denied) {
          console.error('OAuth error or denial:', error || denied);
          setStatus('error');
          setError(error || 'Autenticação foi negada ou cancelada. Você deve aceitar todas as permissões solicitadas para que o aplicativo funcione corretamente.');
        } else {
          setStatus('error');
          setError('Invalid callback parameters');
        }
        return;
      }
      
      // Handle popup OAuth callback
      if (window.opener) {
        console.log('OAuth callback processing with params:', {
          code, error, denied, oauthToken, oauthVerifier, state
        });
        
        // Usar a origem da janela pai
        const targetOrigin = window.location.origin;
        console.log('Posting message to origin:', targetOrigin);
        
        try {
          let messageData = null;
          
          if (code) {
            // OAuth 2.0 resposta
            messageData = { code, state };
            console.log('Sending OAuth 2.0 code to parent');
          } else if (oauthToken && oauthVerifier) {
            // OAuth 1.0a resposta
            messageData = { oauthToken, oauthVerifier };
            console.log('Sending X OAuth 1.0a tokens to parent');
          } else if (denied) {
            messageData = { error: 'Você não concedeu as permissões solicitadas. Para que o aplicativo funcione corretamente, você precisa aceitar todas as permissões solicitadas pelo Twitter/X. Por favor, tente novamente.' };
            console.log('Sending OAuth denial to parent');
          } else if (error) {
            messageData = { error };
            console.log('Sending OAuth error to parent');
          } else {
            // Check if we have any query parameters at all
            if (Object.keys(allParams).length === 0) {
              messageData = { error: 'No parameters received in callback URL' };
              console.log('No parameters in callback URL');
            } else {
              // If we have some parameters but not the ones we expect, try to send whatever we have
              messageData = { error: 'No standard authentication data received', rawParams: allParams };
              console.log('Non-standard OAuth parameters received');
            }
          }
          
          if (messageData) {
            // Before sending message, verify opener is still available
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(messageData, targetOrigin);
              setStatus('success');
              
              // Close the window immediately for OAuth 2.0 responses
              if (code && state) {
                console.log('Auto-closing window for OAuth 2.0 flow...');
                setTimeout(() => {
                  window.close();
                }, 1000);
              } else {
                // For other flows, give user a chance to see success message
                console.log('Will close window after short delay...');
                setTimeout(() => {
                  window.close();
                }, 3000);
              }
            } else {
              console.error('Parent window is no longer available');
              setStatus('error');
              setError('A janela principal foi fechada. Por favor, volte à aplicação e tente novamente.');
            }
          } else {
            setStatus('error');
            setError('No valid data to send to parent window');
          }
        } catch (e) {
          console.error('Error posting message to parent window:', e);
          setStatus('error');
          setError(e.message || 'Error communicating with parent window');
        }
      } else {
        console.error('This window was not opened as a popup and parameters are invalid');
        setStatus('error');
        setError('Esta janela não foi aberta como um popup a partir da aplicação principal e não contem parâmetros válidos de autenticação direta.');
      }
    };
    
    // Small delay to ensure the parent window is ready to receive the message
    setTimeout(() => {
      processCallback();
    }, 500);
  }, [location.search, navigate]);
  
  const returnToApp = () => {
    // Clear auth state
    localStorage.removeItem('x_oauth2_state');
    localStorage.removeItem('connecting_platform');
    
    // Navigate back to social media page
    navigate('/social-media');
  };
  
  const closeWindow = () => {
    console.log('Manual window close requested');
    window.close();
  };
  
  // Debug helper
  const toggleAdvancedDebug = () => {
    setShowAdvancedDebug(prev => !prev);
  };
  
  return (
    <Center minH="100vh">
      <VStack spacing={4} maxW="600px" p={4} textAlign="center">
        <Heading size="md">Twitter/X Authentication</Heading>
        
        {/* Debug button always visible */}
        <Button 
          size="xs" 
          variant="outline" 
          colorScheme="gray" 
          onClick={toggleAdvancedDebug} 
          alignSelf="flex-end"
        >
          {showAdvancedDebug ? "Esconder Debug" : "Mostrar Debug"}
        </Button>
        
        {/* Advanced debug info */}
        {showAdvancedDebug && (
          <Box p={4} bg="gray.50" borderRadius="md" w="100%" mb={4} textAlign="left">
            <Text fontWeight="bold" mb={2}>Informações Avançadas de Debug:</Text>
            <Text fontSize="xs">URL: {window.location.href}</Text>
            <Text fontSize="xs">Estado: {status}</Text>
            <Text fontSize="xs">Erro: {error || "Nenhum"}</Text>
            <Text fontSize="xs">Estado armazenado: {localStorage.getItem('x_oauth2_state') || 'Não disponível'}</Text>
            <Text fontSize="xs">Plataforma: {localStorage.getItem('connecting_platform') || 'Não disponível'}</Text>
            <Text fontSize="xs" fontWeight="bold" mt={2}>Parâmetros da URL:</Text>
            <Code p={2} mt={1} fontSize="xs" w="100%" overflowX="auto" display="block">
              {JSON.stringify(debug, null, 2)}
            </Code>
          </Box>
        )}
        
        {status === 'processing' && (
          <>
            <Spinner size="xl" thickness="4px" speed="0.65s" color="brand.primary" />
            <Text>Processando autenticação...</Text>
            <Text fontSize="sm" color="gray.500">Por favor, aguarde enquanto processamos a autenticação.</Text>
          </>
        )}
        
        {status === 'success' && !window.opener && userData && (
          <>
            <Alert status="success" mb={4}>
              <AlertIcon />
              Autenticação realizada com sucesso!
            </Alert>
            
            <Box p={4} borderWidth="1px" borderRadius="lg" w="100%">
              <VStack align="start" spacing={4}>
                <HStack spacing={4} w="100%">
                  <Avatar 
                    src={userData.profileImageUrl} 
                    name={userData.name}
                    size="xl"
                  />
                  <Box textAlign="left">
                    <Heading size="md">{userData.name}</Heading>
                    <Text color="gray.500">@{userData.screenName}</Text>
                    {userData.verified && (
                      <Badge colorScheme="blue" mt={1}>Verificado</Badge>
                    )}
                    {userData.followersCount && (
                      <Text fontSize="sm" mt={1}>Seguidores: {userData.followersCount}</Text>
                    )}
                  </Box>
                </HStack>
                
                {userData.description && (
                  <Text fontSize="sm">{userData.description}</Text>
                )}
                
                <Divider />
                
                <Box w="100%">
                  <Heading size="sm" mb={2}>Você segue {followedAccounts.length} contas</Heading>
                  <Box maxH="200px" overflowY="auto">
                    {followedAccounts.slice(0, 5).map((account, index) => (
                      <HStack key={index} p={2} borderBottomWidth={index < 4 ? "1px" : "0"}>
                        <Avatar src={account.profileImage} name={account.name} size="sm" />
                        <Box flex="1" textAlign="left">
                          <Text fontWeight="bold" fontSize="sm">{account.name}</Text>
                          <Text fontSize="xs" color="gray.500">{account.username}</Text>
                        </Box>
                        {account.isVerified && (
                          <Badge colorScheme="blue" size="sm">✓</Badge>
                        )}
                      </HStack>
                    ))}
                    {followedAccounts.length > 5 && (
                      <Text fontSize="sm" fontStyle="italic" mt={2}>
                        ...e mais {followedAccounts.length - 5} contas
                      </Text>
                    )}
                  </Box>
                </Box>
              </VStack>
            </Box>
            
            <Button colorScheme="blue" onClick={returnToApp} mt={4}>
              Voltar ao aplicativo
            </Button>
          </>
        )}
        
        {status === 'success' && window.opener && (
          <>
            <Alert status="success">
              <AlertIcon />
              Autenticação realizada com sucesso!
            </Alert>
            <Text>Esta janela será fechada automaticamente...</Text>
            <Button onClick={closeWindow}>Fechar janela</Button>
          </>
        )}
        
        {status === 'error' && (
          <>
            <Alert status="error">
              <AlertIcon />
              Erro na autenticação
            </Alert>
            <Text>{error || 'Ocorreu um erro durante o processo de autenticação.'}</Text>
            <Text>Talvez seja necessário tentar novamente.</Text>
            
            <Box mt={4} p={4} bg="red.50" borderRadius="md">
              <Text fontWeight="bold">Informações de Diagnóstico:</Text>
              <Text fontSize="sm" mt={2}>URL: {window.location.href}</Text>
              <Text fontSize="sm">Erro: {error}</Text>
              <Text fontSize="sm">Estado armazenado: {localStorage.getItem('x_oauth2_state') || 'Não disponível'}</Text>
              <Text fontSize="sm">Plataforma: {localStorage.getItem('connecting_platform') || 'Não disponível'}</Text>
            </Box>
            
            {window.opener ? (
              <Button colorScheme="blue" onClick={closeWindow} mb={2}>Fechar janela</Button>
            ) : (
              <Button colorScheme="blue" onClick={returnToApp} mb={2}>Voltar ao aplicativo</Button>
            )}
            <Button size="sm" onClick={onToggle} variant="outline">
              {isOpen ? 'Ocultar detalhes técnicos' : 'Mostrar detalhes técnicos'}
            </Button>
            <Collapse in={isOpen} animateOpacity>
              <Box p={2} mt={2} bg="gray.50" borderRadius="md" maxWidth="100%" overflowX="auto">
                <Text fontWeight="bold" mb={1} textAlign="left">Parâmetros recebidos:</Text>
                <Code p={2} display="block" whiteSpace="pre" textAlign="left" fontSize="xs">
                  {JSON.stringify(debug, null, 2)}
                </Code>
              </Box>
            </Collapse>
          </>
        )}
      </VStack>
    </Center>
  );
}; 