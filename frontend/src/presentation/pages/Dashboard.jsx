import { Box, Grid, Heading, Text, Button, Icon, Card, CardBody, useColorMode } from '@chakra-ui/react'
import { FiUser, FiShare2, FiUpload } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const DashboardCard = ({ icon, title, path }) => {
  const { colorMode } = useColorMode()
  
  return (
    <Card 
      borderRadius="lg"
      _hover={{ 
        transform: 'translateY(-4px)',
        boxShadow: 'lg'
      }}
      transition="all 0.2s"
    >
      <CardBody p={6}>
        <Box mb={4}>
          <Icon as={icon} color="brand.primary" fontSize="24px" />
        </Box>
        <Box mb={4}>
          <Text fontSize="xl" fontWeight="medium">
            {title}
          </Text>
        </Box>
        <Link to={path}>
          <Button
            variant="primary"
            size="lg"
            width="100%"
          >
            Acessar
          </Button>
        </Link>
      </CardBody>
    </Card>
  )
}

export const Dashboard = () => {
  const { colorMode } = useColorMode()
  
  const cards = [
    {
      icon: FiUser,
      title: 'Meu Perfil',
      path: '/profile',
    },
    {
      icon: FiShare2,
      title: 'Redes Sociais',
      path: '/social-media',
    },
    {
      icon: FiUpload,
      title: 'Upload de Documentos',
      path: '/documents',
    },
  ]

  return (
    <Box>
      <Box mb={8}>
        <Heading size="2xl" mb={4}>Conheça seu fã</Heading>
        <Text fontSize="xl" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
          Gerencie suas informações e preferências de fã.
        </Text>
      </Box>

      <Grid
        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
        gap={6}
      >
        {cards.map((card) => (
          <DashboardCard key={card.path} {...card} />
        ))}
      </Grid>
    </Box>
  )
} 