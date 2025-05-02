import { useState } from 'react'
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
} from '@chakra-ui/react'

export const SocialMedia = () => {
  const [connectedAccounts, setConnectedAccounts] = useState([])
  const { colorMode } = useColorMode()
  const toast = useToast()

  const handleConnect = (platform) => {
    setConnectedAccounts(prev => [...prev, platform])
    toast({
      title: 'Conta conectada',
      description: `Sua conta do ${platform} foi conectada com sucesso.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const isConnected = (platform) => connectedAccounts.includes(platform)

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
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
              {/* Twitter */}
              <Card borderRadius="xl">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Box bg={colorMode === 'dark' ? 'brand.gray.dark' : 'gray.100'} p={4} borderRadius="lg" display="flex" justifyContent="center">
                      <Image
                        src="https://abs.twimg.com/responsive-web/client-web/icon-ios.b1fc727a.png"
                        alt="Twitter"
                        boxSize="48px"
                      />
                    </Box>
                    <Box>
                      <Heading size="md" mb={2}>Twitter</Heading>
                    </Box>
                    <Button
                      variant={isConnected('Twitter') ? 'outline' : 'primary'}
                      onClick={() => handleConnect('Twitter')}
                      isDisabled={isConnected('Twitter')}
                    >
                      {isConnected('Twitter') ? 'Conectado' : 'Conectar'}
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {/* Instagram */}
              <Card borderRadius="xl">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Box bg={colorMode === 'dark' ? 'brand.gray.dark' : 'gray.100'} p={4} borderRadius="lg" display="flex" justifyContent="center">
                      <Image
                        src="https://static.cdninstagram.com/rsrc.php/v3/yt/r/30PrGfR3xhB.png"
                        alt="Instagram"
                        boxSize="48px"
                      />
                    </Box>
                    <Box>
                      <Heading size="md" mb={2}>Instagram</Heading>
                    </Box>
                    <Button
                      variant={isConnected('Instagram') ? 'outline' : 'primary'}
                      onClick={() => handleConnect('Instagram')}
                      isDisabled={isConnected('Instagram')}
                    >
                      {isConnected('Instagram') ? 'Conectado' : 'Conectar'}
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </Grid>

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
    </Box>
  )
} 