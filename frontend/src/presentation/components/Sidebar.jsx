import { Box, VStack, Text, Image, useColorMode } from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'
import { FiHome, FiUser, FiShare2, FiUpload, FiCalendar, FiSettings, FiLogOut } from 'react-icons/fi'
import { styles } from '../styles/Layout.styles'
import FuriaLogo from '../../assets/furia-logo.png'

export const Sidebar = ({ isOpen }) => {
  const location = useLocation()
  const { colorMode } = useColorMode()

  const menuItems = [
    { icon: FiHome, text: 'Início', path: '/' },
    { icon: FiUser, text: 'Meu Perfil', path: '/profile' },
    { icon: FiShare2, text: 'Redes Sociais', path: '/social-media' },
    { icon: FiUpload, text: 'Upload de Documentos', path: '/documents' },
    { icon: FiCalendar, text: 'Histórico de Eventos', path: '/events' },
    { icon: FiSettings, text: 'Configurações', path: '/settings' },
    { icon: FiLogOut, text: 'Sair', path: '/logout' },
  ]

  const sidebarBg = colorMode === 'dark' ? '#141414' : '#FFFFFF'
  const borderColor = colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.200'

  return (
    <Box 
      as="aside" 
      width={{ base: '280px', md: '280px' }}
      bg={sidebarBg}
      borderRight="1px solid"
      borderColor={borderColor}
      position={{ base: 'fixed', md: 'sticky' }}
      top={0}
      left={0}
      h="100vh"
      transform={{ base: isOpen ? 'translateX(0)' : 'translateX(-100%)', md: 'translateX(0)' }}
      transition="all 0.3s ease-in-out"
      zIndex={20}
      overflowY="auto"
      boxShadow={isOpen ? { base: '4px 0 8px rgba(0, 0, 0, 0.3)', md: 'none' } : 'none'}
    >
      <Link to="/">
        <Box 
          p={6}
          pl={{ base: 14, md: 6 }}
          borderBottom="1px solid"
          borderColor={borderColor}
          position="sticky"
          top={0}
          bg={sidebarBg}
          zIndex={1}
        >
          <Box display="flex" alignItems="center" gap={3}>
            <Image src={FuriaLogo} alt="FURIA" h="32px" />
            <Text fontSize="xl" fontWeight="bold" color={colorMode === 'dark' ? 'white' : 'gray.800'}>FURIA</Text>
          </Box>
        </Box>
      </Link>

      <VStack as="nav" py={4} spacing={1} align="stretch">
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Box
              display="flex"
              alignItems="center"
              gap={3}
              px={6}
              py={3}
              color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}
              transition="all 0.2s"
              _hover={{
                bg: colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.100',
                color: colorMode === 'dark' ? 'white' : 'black',
              }}
              className={location.pathname === item.path ? 'active' : ''}
              sx={{
                '&.active': {
                  bg: '#FFD60A20',
                  color: '#FFD60A',
                }
              }}
            >
              <Box as={item.icon} fontSize="20px" flexShrink={0} />
              <Text>{item.text}</Text>
            </Box>
          </Link>
        ))}
      </VStack>
    </Box>
  )
} 