import { useState, useEffect } from 'react'
import { Box, IconButton, useColorMode } from '@chakra-ui/react'
import { FiMenu, FiX } from 'react-icons/fi'
import { Sidebar } from '../components/Sidebar'

export const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { colorMode } = useColorMode()

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const mainBg = colorMode === 'dark' ? '#0A0A0A' : '#F8F9FA'

  return (
    <Box 
      minH="100vh" 
      bg={mainBg}
      display="flex" 
      position="relative"
    >
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        position="fixed"
        top={4}
        left={isSidebarOpen ? 'calc(280px - 48px)' : 4}
        zIndex={30}
        icon={isSidebarOpen ? <FiX fontSize="24px" /> : <FiMenu fontSize="24px" />}
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        bg="transparent"
        color="brand.primary"
        _hover={{
          bg: 'transparent',
          color: 'brand.hover',
        }}
        _active={{
          bg: 'transparent',
          transform: 'scale(0.95)',
        }}
        boxShadow="none"
        transition="left 0.3s ease-in-out"
      />
      
      <Sidebar isOpen={isSidebarOpen} />
      
      <Box 
        as="main" 
        flex={1}
        width={{ base: '100%', md: 'calc(100% - 280px)' }}
        p={{ base: '60px 16px 16px', md: 8 }}
        minH="100vh"
        transition="padding 0.3s ease-in-out"
        bg={mainBg}
        onClick={() => isSidebarOpen && setIsSidebarOpen(false)}
      >
        {children}
      </Box>

      <Box
        display={{ base: 'block', md: 'none' }}
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={15}
        opacity={isSidebarOpen ? 1 : 0}
        pointerEvents={isSidebarOpen ? 'auto' : 'none'}
        transition="opacity 0.3s ease-in-out"
        onClick={() => setIsSidebarOpen(false)}
      />
    </Box>
  )
} 