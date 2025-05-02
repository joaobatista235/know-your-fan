import { Box, Heading, Text, useColorMode } from '@chakra-ui/react'

export const Events = () => {
  const { colorMode } = useColorMode()
  
  return (
    <Box maxWidth="800px" mx="auto" py={8}>
      <Heading size="2xl" mb={4}>Histórico de Eventos</Heading>
      <Text fontSize="xl" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
        Acompanhe seus eventos e atividades relacionados à FURIA.
      </Text>
    </Box>
  )
} 