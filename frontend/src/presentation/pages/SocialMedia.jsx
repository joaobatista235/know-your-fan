import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  Heading,
  Text,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Grid,
  Card,
  CardBody,
  Button,
  Image,
  useColorMode,
  Spinner,
  List,
  ListItem,
  Avatar,
  HStack,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react'
import { userService } from '../../services/api'

const OAUTH_URLS = {
  X: 'https://api.twitter.com/oauth/authenticate',
  Instagram: 'https://api.instagram.com/oauth/authorize'
}

const OAUTH_CLIENT_ID = '12345678'; 

const SOCIAL_LOGOS = {
  X: "https://img.freepik.com/vetores-gratis/novo-design-de-icone-x-do-logotipo-do-twitter-em-2023_1017-45418.jpg?semt=ais_hybrid&w=740",
  Instagram: "https://static.cdninstagram.com/rsrc.php/v3/yt/r/30PrGfR3xhB.png"
}

export const SocialMedia = () => {
  const [connectedAccounts, setConnectedAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [followedAccounts, setFollowedAccounts] = useState({})
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const { colorMode } = useColorMode()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    const loadConnectedAccounts = async () => {
      try {
        setIsLoading(true)
        const response = await userService.getSocialAccounts()
        if (response && response.accounts) {
          setConnectedAccounts(response.accounts.map(acc => acc.platform))
          
          const followedData = {}
          response.accounts.forEach(acc => {
            followedData[acc.platform] = acc.followedAccounts || []
          })
          setFollowedAccounts(followedData)
        }
      } catch (error) {
        console.error('Error loading social accounts:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadConnectedAccounts()
  }, [])

  const handleConnect = (platform) => {
    setIsLoading(true)
    
    setConnectedAccounts(prev => [...prev, platform + '_connecting'])
    
    localStorage.setItem('connecting_platform', platform)
    
    // Usar URL de callback com 127.0.0.1 conforme recomendado pelo Twitter
    const redirectUri = `http://127.0.0.1:5173/oauth/callback`;
    
    const width = 600
    const height = 700  // Increased height to accommodate Twitter auth screen
    const left = window.innerWidth / 2 - width / 2
    const top = window.innerHeight / 2 - height / 2
    
    let authUrl;
    
    if (platform === 'X') {
      userService.getXRequestTokenV2(redirectUri)
        .then(response => {
          if (response && response.auth_url) {
            localStorage.setItem('x_oauth2_state', response.state || '');
            
            // Force using a new window each time with a cache-busting random parameter
            const randomParam = Math.random().toString(36).substring(2, 15);
            
            // Add special flags to allow popups and ensure the Twitter login loads properly
            const popupSettings = [
              `width=${width}`,
              `height=${height}`,
              `left=${left}`,
              `top=${top}`,
              'scrollbars=yes',
              'resizable=yes',
              'status=yes',
              'location=yes',
              'toolbar=no',
              'menubar=no'
            ].join(',');
            
            console.log(`Opening Twitter/X auth popup with settings: ${popupSettings}`);
            console.log(`Auth URL: ${response.auth_url}`);
            
            const popup = window.open(
              response.auth_url, 
              `TwitterAuth_${randomParam}`, 
              popupSettings
            );
            
            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
              handleConnectionError(platform, 'Por favor, permita popups para este site para conectar sua conta.');
              return;
            }
            
            // Try to focus the popup
            popup.focus();
            
            // Set up message listener for the callback
            const messageListener = (event) => {
              if (event.origin !== window.location.origin) {
                console.log(`Ignoring message from different origin: ${event.origin}`);
                return;
              }
              
              console.log('OAuth 2.0 message received:', event.data);
              
              if (!event.data.code && !event.data.error) {
                console.log('Unrecognized message format:', event.data);
                return;
              }
              
              if (event.data.error) {
                console.error('Error in OAuth callback:', event.data.error);
                handleConnectionError(platform, `Erro na autenticação: ${event.data.error}`);
              } else {
                handleOAuth2Callback(event);
              }
              
              window.removeEventListener('message', messageListener);
            };
            
            window.addEventListener('message', messageListener, false);
            
            // Simple check for popup closed
            const checkPopupClosed = setInterval(() => {
              if (popup.closed) {
                clearInterval(checkPopupClosed);
                window.removeEventListener('message', messageListener);
                
                if (connectedAccounts.includes(platform + '_connecting')) {
                  handleConnectionError(platform, 'A janela de autenticação foi fechada antes de concluir. Verifique se você permitiu o acesso ao aplicativo.');
                }
              }
            }, 1000);
            
            // Set timeout for the authentication process
            setTimeout(() => {
              clearInterval(checkPopupClosed);
              window.removeEventListener('message', messageListener);
              
              if (connectedAccounts.includes(platform + '_connecting')) {
                handleConnectionError(platform, 'A conexão expirou. Por favor, tente novamente.');
              }
            }, 120000);
          } else {
            handleConnectionError(platform, 'Failed to get authentication URL');
          }
        })
        .catch(error => {
          console.error('Error getting auth URL:', error);
          handleConnectionError(platform, 
            error.response?.data?.details || 
            error.response?.data?.error || 
            'Problemas de comunicação com o Twitter. Tente novamente mais tarde.');
        });
    } else {
      authUrl = `${OAUTH_URLS[platform]}?redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&client_id=${OAUTH_CLIENT_ID}&scope=user_profile,user_media`
      
      const popup = window.open(authUrl, `${platform}Auth`, 
        `width=${width},height=${height},left=${left},top=${top}`)
      
      checkPopupAndSetListeners(popup, platform)
    }
  }

  const checkPopupAndSetListeners = (popup, platform) => {
    const messageListener = (event) => {
      if (event.origin !== window.location.origin) return;
      
      console.log('Message received:', event.data);
      
      if (!event.data.code && !event.data.oauthToken && !event.data.error) return;
      
      handleOAuthCallback(event);
      
      window.removeEventListener('message', messageListener);
    };
    
    window.addEventListener('message', messageListener, false);
    
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      handleConnectionError(platform, 'Por favor, permita popups para este site para conectar sua conta.')
      return
    }
    
    const checkPopupClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopupClosed)
        window.removeEventListener('message', messageListener)
        
        if (connectedAccounts.includes(platform + '_connecting')) {
          handleConnectionError(platform, 'A janela de autenticação foi fechada antes de concluir.')
        }
      }
    }, 1000)
    
    setTimeout(() => {
      clearInterval(checkPopupClosed)
      window.removeEventListener('message', messageListener)
      
      if (connectedAccounts.includes(platform + '_connecting')) {
        handleConnectionError(platform, 'A conexão expirou. Por favor, tente novamente.')
      }
    }, 120000)
  }

  const handleConnectionError = (platform, message) => {
    setConnectedAccounts(prev => prev.filter(p => p !== platform + '_connecting'))
    setIsLoading(false)
    
    // Mensagem personalizada para quando o usuário negou permissões
    let finalMessage = message;
    if (message.includes('denied') || message.includes('canceled') || message.includes('acesso negado')) {
      finalMessage = 'Você não concedeu as permissões necessárias para o aplicativo. Precisamos dessas permissões para verificar seu perfil de fã. Por favor, tente novamente e aceite todas as permissões solicitadas pelo Twitter/X.';
    }
    
    toast({
      title: 'Erro na conexão',
      description: finalMessage,
      status: 'error',
      duration: 5000,
      isClosable: true,
    })
  }
  
  const handleOAuthCallback = async (event) => {
    console.log('OAuth callback received:', event.data);
    
    if (!event.data.code && !event.data.oauthToken && !event.data.error) {
      console.log('Invalid callback data received');
      return;
    }
    
    try {
      setIsLoading(true)
      const platform = localStorage.getItem('connecting_platform')
      localStorage.removeItem('connecting_platform')
      
      console.log(`Processing ${platform} callback with data:`, event.data);
      
      let response;
      
      if (event.data.oauthToken && event.data.oauthVerifier && platform === 'X') {
        console.log('Processing X OAuth data with tokens');
        
        // Recuperar o token_id armazenado anteriormente
        const tokenId = localStorage.getItem('x_token_id') || '';
        localStorage.removeItem('x_token_id');
        
        response = await userService.connectSocialAccount({
          platform,
          oauth_token: event.data.oauthToken,
          oauth_verifier: event.data.oauthVerifier,
          token_id: tokenId
        });
        console.log('X callback response:', response);
      } else if (event.data.code) {
        console.log('Processing OAuth code data');
        response = await userService.connectSocialAccount({
          platform,
          code: event.data.code
        });
        console.log('OAuth code callback response:', response);
      } else if (event.data.error) {
        console.error('Error in OAuth callback:', event.data.error);
        throw new Error(event.data.error);
      } else {
        console.error('No valid authentication data received');
        throw new Error('No authentication data received');
      }
      
      if (response && response.success) {
        setConnectedAccounts(prev => prev.filter(p => p !== platform + '_connecting'))
        setConnectedAccounts(prev => [...prev, platform])
        
        if (response.followedAccounts) {
          setFollowedAccounts(prev => ({
            ...prev,
            [platform]: response.followedAccounts
          }))
        }
        
        const userInfo = response.userInfo ? 
          (platform === 'X' ? `@${response.userInfo.screenName}` : response.userInfo.username) : 
          platform;
          
        toast({
          title: 'Conta conectada',
          description: `Sua conta do ${userInfo} foi conectada com sucesso.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (error) {
      const platform = localStorage.getItem('connecting_platform') || ''
      localStorage.removeItem('connecting_platform')
      
      console.error('Error connecting account:', error)
      setConnectedAccounts(prev => prev.filter(p => p !== platform + '_connecting'))
      
      toast({
        title: 'Erro na conexão',
        description: error.message || 'Não foi possível conectar sua conta. Tente novamente mais tarde.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuth2Callback = async (event) => {
    console.log('OAuth 2.0 callback received:', event.data);
    
    if (!event.data.code && !event.data.error) {
      console.log('Invalid callback data received');
      return;
    }
    
    try {
      setIsLoading(true)
      const platform = localStorage.getItem('connecting_platform')
      const state = localStorage.getItem('x_oauth2_state')
      
      localStorage.removeItem('connecting_platform')
      localStorage.removeItem('x_oauth2_state')
      
      console.log(`Processing ${platform} OAuth 2.0 callback with code`);
      
      let response;
      
      if (event.data.code && platform === 'X') {
        console.log('Processing X OAuth 2.0 data with code');
        
        const redirectUri = `${window.location.origin}/oauth/callback`;
        
        response = await userService.processXOAuth2Callback(
          event.data.code,
          state,
          redirectUri
        );
        
        console.log('X OAuth 2.0 callback response:', response);
      } else if (event.data.error) {
        console.error('Error in OAuth 2.0 callback:', event.data.error);
        throw new Error(event.data.error);
      } else {
        console.error('No valid authentication data received');
        throw new Error('No authentication data received');
      }
      
      if (response && response.success) {
        setConnectedAccounts(prev => prev.filter(p => p !== platform + '_connecting'))
        setConnectedAccounts(prev => [...prev, platform])
        
        if (response.followedAccounts) {
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
          
          setFollowedAccounts(prev => ({
            ...prev,
            [platform]: response.followedAccounts
          }))
        }
        
        const userInfo = response.userInfo ? 
          (platform === 'X' ? `@${response.userInfo.screenName}` : response.userInfo.username) : 
          platform;
          
        toast({
          title: 'Conta conectada',
          description: `Sua conta do ${userInfo} foi conectada com sucesso.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (error) {
      const platform = localStorage.getItem('connecting_platform') || ''
      localStorage.removeItem('connecting_platform')
      localStorage.removeItem('x_oauth2_state')
      
      console.error('Error connecting account via OAuth 2.0:', error)
      setConnectedAccounts(prev => prev.filter(p => p !== platform + '_connecting'))
      
      toast({
        title: 'Erro na conexão',
        description: error.message || 'Não foi possível conectar sua conta. Tente novamente mais tarde.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isConnected = (platform) => connectedAccounts.includes(platform)
  
  const isConnecting = (platform) => connectedAccounts.includes(platform + '_connecting')
  
  const viewFollowedAccounts = (platform) => {
    setSelectedPlatform(platform)
    onOpen()
  }

  return (
    <Box maxW="1200px" mx="auto" p={8}>
      <Box mb={8}>
        <Heading size="2xl">Aplicativos e contas</Heading>
        <Text mt={2} color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
          Gerenciar permissões para aplicativos e contas conectadas.
        </Text>
      </Box>

      <Tabs variant="line" colorScheme="yellow">
        <TabList borderBottomColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}>
          <Tab 
            _selected={{ color: 'brand.primary', borderColor: 'brand.primary' }}
            _hover={{ color: 'brand.hover' }}
          >
            CONTAS
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            {isLoading ? (
              <Box display="flex" justifyContent="center" py={10}>
                <Spinner size="xl" color="brand.primary" />
              </Box>
            ) : (
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
                {/* X (anteriormente Twitter) */}
                <Card borderRadius="xl">
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Box bg={colorMode === 'dark' ? 'brand.gray.dark' : 'gray.100'} p={4} borderRadius="lg" display="flex" justifyContent="center">
                        <Image
                          src={SOCIAL_LOGOS.X}
                          alt="X"
                          boxSize="36px"
                        />
                      </Box>
                      <Box>
                        <Heading size="md" mb={2}>X</Heading>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                          Conecte sua conta X (anteriormente Twitter) para validar seu perfil.
                        </Text>
                      </Box>
                      
                      {isConnected('X') ? (
                        <VStack spacing={3} align="stretch">
                          <Button
                            variant="outline"
                            colorScheme="gray"
                            size="sm"
                            onClick={() => viewFollowedAccounts('X')}
                          >
                            Ver perfis seguidos ({followedAccounts['X']?.length || 0})
                          </Button>
                          <Button
                            variant="outline"
                            colorScheme="red"
                            size="sm"
                            onClick={() => {
                              setIsLoading(true);
                              userService.disconnectSocialAccount('X')
                                .then(response => {
                                  if (response.success) {
                                    setConnectedAccounts(prev => prev.filter(p => p !== 'X'));
                                    setFollowedAccounts(prev => {
                                      const newState = {...prev};
                                      delete newState['X'];
                                      return newState;
                                    });
                                    toast({
                                      title: 'Conta desconectada',
                                      description: 'Sua conta do X foi desconectada com sucesso.',
                                      status: 'info',
                                      duration: 3000,
                                      isClosable: true,
                                    });
                                  }
                                })
                                .catch(error => {
                                  console.error('Error disconnecting account:', error);
                                  toast({
                                    title: 'Erro na desconexão',
                                    description: 'Não foi possível desconectar sua conta. Tente novamente.',
                                    status: 'error',
                                    duration: 3000,
                                    isClosable: true,
                                  });
                                })
                                .finally(() => {
                                  setIsLoading(false);
                                });
                            }}
                          >
                            Desconectar
                          </Button>
                        </VStack>
                      ) : (
                        <VStack spacing={2}>
                          <Button
                            variant="primary"
                            onClick={() => handleConnect('X')}
                            isLoading={isConnecting('X')}
                            loadingText="Conectando..."
                            isDisabled={isLoading && !isConnecting('X')}
                            width="100%"
                          >
                            Conectar com Popup
                          </Button>
                          <Text fontSize="xs" color="gray.500" mt={1} textAlign="left">
                            Ao conectar, o Twitter/X solicitará que você aceite várias permissões. 
                            Todas essas permissões são necessárias para verificar seu perfil de fã.
                          </Text>
                        </VStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Instagram */}
                {/* <Card borderRadius="xl">
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Box bg={colorMode === 'dark' ? 'brand.gray.dark' : 'gray.100'} p={4} borderRadius="lg" display="flex" justifyContent="center">
                        <Image
                          src={SOCIAL_LOGOS.Instagram}
                          alt="Instagram"
                          boxSize="48px"
                        />
                      </Box>
                      <Box>
                        <Heading size="md" mb={2}>Instagram</Heading>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                          Conecte sua conta Instagram para validar seu perfil.
                        </Text>
                      </Box>
                      
                      {isConnected('Instagram') ? (
                        <VStack spacing={3} align="stretch">
                          <Button
                            variant="outline"
                            colorScheme="gray"
                            size="sm"
                            onClick={() => viewFollowedAccounts('Instagram')}
                          >
                            Ver perfis seguidos ({followedAccounts['Instagram']?.length || 0})
                          </Button>
                          <Button
                            variant="outline"
                            colorScheme="red"
                            size="sm"
                            onClick={() => {
                              setIsLoading(true);
                              userService.disconnectSocialAccount('Instagram')
                                .then(response => {
                                  if (response.success) {
                                    setConnectedAccounts(prev => prev.filter(p => p !== 'Instagram'));
                                    setFollowedAccounts(prev => {
                                      const newState = {...prev};
                                      delete newState['Instagram'];
                                      return newState;
                                    });
                                    toast({
                                      title: 'Conta desconectada',
                                      description: 'Sua conta do Instagram foi desconectada com sucesso.',
                                      status: 'info',
                                      duration: 3000,
                                      isClosable: true,
                                    });
                                  }
                                })
                                .catch(error => {
                                  console.error('Error disconnecting account:', error);
                                  toast({
                                    title: 'Erro na desconexão',
                                    description: 'Não foi possível desconectar sua conta. Tente novamente.',
                                    status: 'error',
                                    duration: 3000,
                                    isClosable: true,
                                  });
                                })
                                .finally(() => {
                                  setIsLoading(false);
                                });
                            }}
                          >
                            Desconectar
                          </Button>
                        </VStack>
                      ) : (
                        <Button
                          variant="primary"
                          onClick={() => handleConnect('Instagram')}
                          isLoading={isConnecting('Instagram')}
                          loadingText="Conectando..."
                          isDisabled={isLoading && !isConnecting('Instagram')}
                        >
                          Conectar
                        </Button>
                      )}
                    </VStack>
                  </CardBody>
                </Card> */}
              </Grid>
            )}

            <Box mt={8} p={6} borderRadius="xl" bg={colorMode === 'dark' ? 'brand.secondary.dark' : 'gray.50'} borderWidth="1px" borderColor={colorMode === 'dark' ? 'transparent' : 'gray.200'}>
              <Heading size="md" mb={4}>Sobre a Validação de Perfil</Heading>
              <Text color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                Suas redes sociais serão validadas usando IA para garantir que são autênticas 
                e relevantes para seu perfil de fã. Isso ajuda a manter a integridade da 
                plataforma e garante métricas precisas de engajamento dos fãs.
              </Text>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Modal para exibir contas seguidas */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Perfis seguidos no {selectedPlatform}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedPlatform && followedAccounts[selectedPlatform]?.length > 0 ? (
              <List spacing={3}>
                {followedAccounts[selectedPlatform].map(account => (
                  <ListItem key={account.id} p={3} borderWidth="1px" borderRadius="md">
                    <HStack spacing={4} alignItems="flex-start">
                      <Avatar src={account.profileImage} name={account.name} />
                      <Box flex="1">
                        <HStack>
                          <Text fontWeight="bold">{account.name}</Text>
                          {account.isVerified && (
                            <Badge colorScheme="blue">Verificado</Badge>
                          )}
                          <Badge colorScheme="purple">{account.followers} seguidores</Badge>
                        </HStack>
                        <Text color="gray.500">{account.username}</Text>
                        {account.description && (
                          <Text fontSize="sm" mt={1} color="gray.600" noOfLines={2}>
                            {account.description}
                          </Text>
                        )}
                      </Box>
                    </HStack>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Text textAlign="center" py={6} color="gray.500">
                Nenhum perfil encontrado.
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default SocialMedia; 