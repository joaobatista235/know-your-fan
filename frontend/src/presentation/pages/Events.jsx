import { 
  Box, 
  Heading, 
  Text, 
  useColorMode, 
  VStack, 
  HStack, 
  Grid, 
  Badge, 
  Flex, 
  Image, 
  Icon, 
  Button, 
  Tabs, 
  TabList, 
  Tab, 
  TabPanels, 
  TabPanel,
  Input,
  InputGroup,
  InputLeftElement,
  Card,
  CardBody,
  Divider,
  Avatar,
  Link,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Tag,
  TagLabel
} from '@chakra-ui/react'
import { SearchIcon, CalendarIcon, StarIcon, ExternalLinkIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { useState } from 'react'

// Dados simulados de eventos
const MOCK_EVENTS = [
  {
    id: '1',
    title: 'FURIA vs. Liquid - ESL Pro League Season 15',
    description: 'FURIA enfrenta Team Liquid na fase de grupos da ESL Pro League Season 15',
    date: '2023-11-15T14:00:00',
    location: 'Online',
    category: 'CS2',
    image: 'https://cdn.dribbble.com/userupload/11627402/file/original-519eba43b5e06c4036ad54fe2b6e496f.png',
    featured: true,
    result: 'Vitória - 2:0',
    status: 'completed',
    social: {
      source: 'twitter',
      author: 'FURIA',
      handle: '@FURIA',
      profileImage: 'https://ui-avatars.com/api/?name=FURIA&background=FD0054&color=fff',
      verified: true
    }
  },
  {
    id: '2',
    title: 'FURIA vs. Astralis - BLAST Premier Fall',
    description: 'Confronto decisivo contra Astralis no BLAST Premier Fall Series 2023',
    date: '2023-12-05T16:30:00',
    location: 'Copenhagen, Dinamarca',
    category: 'CS2',
    image: 'https://cdn.dribbble.com/userupload/11627402/file/original-519eba43b5e06c4036ad54fe2b6e496f.png',
    featured: true,
    status: 'upcoming',
    social: {
      source: 'twitter',
      author: 'BLAST Premier',
      handle: '@BLASTPremier',
      profileImage: 'https://ui-avatars.com/api/?name=BLAST&background=1DA1F2&color=fff',
      verified: true
    }
  },
  {
    id: '3',
    title: 'FURIA vs. paiN - CBCS Copa',
    description: 'Clássico brasileiro entre FURIA e paiN Gaming pela CBCS Copa 2023',
    date: '2023-11-10T19:00:00',
    location: 'São Paulo, Brasil',
    category: 'CS2',
    image: 'https://cdn.dribbble.com/userupload/11627402/file/original-519eba43b5e06c4036ad54fe2b6e496f.png',
    result: 'Vitória - 16:12',
    status: 'completed',
    social: {
      source: 'twitter',
      author: 'CBCS',
      handle: '@CBCSesports',
      profileImage: 'https://ui-avatars.com/api/?name=CBCS&background=F9A825&color=fff',
      verified: true
    }
  },
  {
    id: '4',
    title: 'FURIA vs. 100 Thieves - VCT Americas',
    description: 'FURIA enfrenta 100 Thieves no VCT Americas 2023',
    date: '2023-12-12T21:00:00',
    location: 'Los Angeles, EUA',
    category: 'VALORANT',
    image: 'https://cdn.dribbble.com/userupload/11627402/file/original-519eba43b5e06c4036ad54fe2b6e496f.png',
    featured: false,
    status: 'upcoming',
    social: {
      source: 'twitter',
      author: 'VALORANT Esports',
      handle: '@ValorantEsports',
      profileImage: 'https://ui-avatars.com/api/?name=VAL&background=FA4454&color=fff',
      verified: true
    }
  },
  {
    id: '5',
    title: 'FURIA vs. FaZe - IEM Katowice 2023',
    description: 'Grande confronto contra FaZe Clan no IEM Katowice 2023',
    date: '2023-02-10T12:30:00',
    location: 'Katowice, Polônia',
    category: 'CS2',
    image: 'https://cdn.dribbble.com/userupload/11627402/file/original-519eba43b5e06c4036ad54fe2b6e496f.png',
    result: 'Derrota - 0:2',
    status: 'completed',
    social: {
      source: 'twitter',
      author: 'ESL Counter-Strike',
      handle: '@ESLCS',
      profileImage: 'https://ui-avatars.com/api/?name=ESL&background=FFD700&color=000',
      verified: true
    }
  },
  {
    id: '6',
    title: 'FURIA vs. LOUD - CBLOL 2023',
    description: 'FURIA enfrenta LOUD na final do CBLOL Split 2 2023',
    date: '2023-09-09T16:00:00',
    location: 'São Paulo, Brasil',
    category: 'League of Legends',
    image: 'https://cdn.dribbble.com/userupload/11627402/file/original-519eba43b5e06c4036ad54fe2b6e496f.png',
    featured: true,
    result: 'Derrota - 2:3',
    status: 'completed',
    social: {
      source: 'twitter',
      author: 'CBLOL',
      handle: '@CBLOL',
      profileImage: 'https://ui-avatars.com/api/?name=CBLOL&background=0BC6E3&color=fff',
      verified: true
    }
  },
  {
    id: '7',
    title: 'FURIA vs. NaVi - BLAST World Final',
    description: 'Confronto épico contra Natus Vincere na final do BLAST World Final 2023',
    date: '2023-12-20T18:00:00',
    location: 'Abu Dhabi, UAE',
    category: 'CS2',
    image: 'https://cdn.dribbble.com/userupload/11627402/file/original-519eba43b5e06c4036ad54fe2b6e496f.png',
    featured: true,
    status: 'upcoming',
    social: {
      source: 'twitter',
      author: 'FURIA',
      handle: '@FURIA',
      profileImage: 'https://ui-avatars.com/api/?name=FURIA&background=FD0054&color=fff',
      verified: true
    }
  }
];

export const Events = () => {
  const { colorMode } = useColorMode();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Filtrar eventos baseado nas categorias e busca
  const filteredEvents = MOCK_EVENTS.filter(event => {
    const matchesCategory = activeFilter === 'all' || event.category === activeFilter;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  // Separar eventos em passados e futuros
  const upcomingEvents = filteredEvents.filter(event => event.status === 'upcoming');
  const pastEvents = filteredEvents.filter(event => event.status === 'completed');
  
  // Formatar data
  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Abrir detalhes do evento
  const openEventDetails = (event) => {
    setSelectedEvent(event);
    onOpen();
  };
  
  // Renderizar card de evento
  const EventCard = ({ event }) => {
    const isPast = event.status === 'completed';
    
    return (
      <Card 
        direction={'row'} 
        overflow='hidden'
        variant="outline"
        cursor="pointer"
        onClick={() => openEventDetails(event)}
        transition="all 0.2s"
        _hover={{ 
          transform: 'translateY(-3px)', 
          boxShadow: 'md',
          borderColor: colorMode === 'dark' ? 'yellow.500' : 'yellow.400'
        }}
        bg={colorMode === 'dark' ? 'gray.800' : 'white'}
        borderColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
        borderWidth="1px"
        borderRadius="xl"
        mb={4}
      >
        <HStack spacing={0} width="100%">
          {/* Imagem do evento */}
          <Box 
            width={{ base: '100px', md: '160px' }} 
            height={{ base: '100px', md: '160px' }}
            minW={{ base: '100px', md: '160px' }}
            position="relative"
            overflow="hidden"
          >
            <Image
              objectFit='cover'
              width="100%"
              height="100%"
              src={event.image}
              alt={event.title}
              opacity={isPast ? 0.7 : 1}
              filter={isPast ? 'grayscale(30%)' : 'none'}
            />
            {event.featured && (
              <Tag 
                position="absolute" 
                top={2} 
                left={2} 
                size="sm" 
                colorScheme="yellow"
                borderRadius="full"
              >
                <StarIcon mr={1} boxSize={3} />
                <TagLabel>Destaque</TagLabel>
              </Tag>
            )}
          </Box>
          
          {/* Conteúdo do evento */}
          <CardBody py={3} px={4}>
            <VStack align="start" spacing={1} height="100%">
              <Flex justifyContent="space-between" width="100%" alignItems="center">
                <Badge 
                  colorScheme={
                    event.category === 'CS2' ? 'red' :
                    event.category === 'VALORANT' ? 'purple' :
                    event.category === 'League of Legends' ? 'blue' : 'gray'
                  }
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  fontSize="xs"
                >
                  {event.category}
                </Badge>
                <HStack>
                  <Icon as={CalendarIcon} boxSize={3} color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} />
                  <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                    {formatEventDate(event.date)}
                  </Text>
                </HStack>
              </Flex>
              
              <Heading size="sm" mt={1} noOfLines={1}>
                {event.title}
              </Heading>
              
              <Text fontSize="sm" noOfLines={2} color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                {event.description}
              </Text>
              
              <Flex mt="auto" width="100%" justifyContent="space-between" alignItems="center">
                <HStack spacing={2}>
                  <Avatar size="xs" src={event.social.profileImage} name={event.social.author} />
                  <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                    {event.social.handle}
                  </Text>
                </HStack>
                
                {isPast && event.result && (
                  <Badge 
                    colorScheme={event.result.includes('Vitória') ? 'green' : 'red'} 
                    variant="subtle"
                    px={2}
                    py={0.5}
                  >
                    {event.result}
                  </Badge>
                )}
                
                {!isPast && (
                  <Badge 
                    colorScheme="blue" 
                    variant="subtle"
                    px={2}
                    py={0.5}
                  >
                    Em breve
                  </Badge>
                )}
              </Flex>
            </VStack>
          </CardBody>
          
          <Box 
            display="flex" 
            alignItems="center" 
            pr={3}
            pl={0}
            color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}
          >
            <ChevronRightIcon boxSize={6} />
          </Box>
        </HStack>
      </Card>
    );
  };
  
  return (
    <Box maxWidth="1000px" mx="auto" py={8} px={4}>
      <Heading size="2xl" mb={2}>Histórico de Eventos</Heading>
      <Text fontSize="xl" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'} mb={8}>
        Acompanhe os eventos da FURIA nos eSports.
      </Text>
      
      {/* Filtros e busca */}
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        justify="space-between"
        align={{ base: 'stretch', md: 'center' }}
        mb={6}
        gap={4}
      >
        <HStack spacing={2} overflowX="auto" py={1} flexWrap={{ base: 'nowrap', md: 'wrap' }}>
          <Button 
            size="sm" 
            borderRadius="full" 
            colorScheme={activeFilter === 'all' ? 'yellow' : 'gray'}
            variant={activeFilter === 'all' ? 'solid' : 'outline'}
            onClick={() => setActiveFilter('all')}
          >
            Todos
          </Button>
          <Button 
            size="sm" 
            borderRadius="full" 
            colorScheme={activeFilter === 'CS2' ? 'red' : 'gray'}
            variant={activeFilter === 'CS2' ? 'solid' : 'outline'}
            onClick={() => setActiveFilter('CS2')}
          >
            CS2
          </Button>
          <Button 
            size="sm" 
            borderRadius="full" 
            colorScheme={activeFilter === 'VALORANT' ? 'purple' : 'gray'}
            variant={activeFilter === 'VALORANT' ? 'solid' : 'outline'}
            onClick={() => setActiveFilter('VALORANT')}
          >
            VALORANT
          </Button>
          <Button 
            size="sm" 
            borderRadius="full" 
            colorScheme={activeFilter === 'League of Legends' ? 'blue' : 'gray'}
            variant={activeFilter === 'League of Legends' ? 'solid' : 'outline'}
            onClick={() => setActiveFilter('League of Legends')}
          >
            LoL
          </Button>
        </HStack>
        
        <InputGroup maxW={{ base: '100%', md: '300px' }}>
          <InputLeftElement pointerEvents='none'>
            <SearchIcon color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} />
          </InputLeftElement>
          <Input 
            placeholder='Buscar evento...' 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            borderRadius="full"
            bg={colorMode === 'dark' ? 'gray.800' : 'white'}
          />
        </InputGroup>
      </Flex>
      
      {/* Tabs para Próximos e Anteriores */}
      <Tabs variant="line" colorScheme="yellow" mb={8}>
        <TabList borderBottomColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}>
          <Tab 
            _selected={{ color: 'brand.primary', borderColor: 'brand.primary' }}
            _hover={{ color: 'brand.hover' }}
          >
            PRÓXIMOS
          </Tab>
          <Tab 
            _selected={{ color: 'brand.primary', borderColor: 'brand.primary' }}
            _hover={{ color: 'brand.hover' }}
          >
            ANTERIORES
          </Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel px={0} py={4}>
            {upcomingEvents.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text>Nenhum evento futuro encontrado para os filtros selecionados.</Text>
              </Box>
            ) : (
              <VStack spacing={4} align="stretch">
                {upcomingEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </VStack>
            )}
          </TabPanel>
          
          <TabPanel px={0} py={4}>
            {pastEvents.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text>Nenhum evento passado encontrado para os filtros selecionados.</Text>
              </Box>
            ) : (
              <VStack spacing={4} align="stretch">
                {pastEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </VStack>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Modal de detalhes do evento */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg={colorMode === 'dark' ? 'gray.800' : 'white'}>
          {selectedEvent && (
            <>
              <ModalHeader pb={1}>{selectedEvent.title}</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Box borderRadius="md" overflow="hidden" mb={4}>
                  <Image 
                    src={selectedEvent.image} 
                    alt={selectedEvent.title} 
                    w="100%" 
                    h="200px" 
                    objectFit="cover"
                  />
                </Box>
                
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4} mb={4}>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>Data e Hora</Text>
                    <Text>{formatEventDate(selectedEvent.date)}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>Local</Text>
                    <Text>{selectedEvent.location}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>Categoria</Text>
                    <Badge 
                      colorScheme={
                        selectedEvent.category === 'CS2' ? 'red' :
                        selectedEvent.category === 'VALORANT' ? 'purple' :
                        selectedEvent.category === 'League of Legends' ? 'blue' : 'gray'
                      }
                    >
                      {selectedEvent.category}
                    </Badge>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>Status</Text>
                    {selectedEvent.status === 'completed' ? (
                      <Badge colorScheme={selectedEvent.result?.includes('Vitória') ? 'green' : 'red'}>
                        {selectedEvent.result || 'Finalizado'}
                      </Badge>
                    ) : (
                      <Badge colorScheme="blue">Em breve</Badge>
                    )}
                  </Box>
                </Grid>
                
                <Text fontWeight="bold" fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} mb={1}>Descrição</Text>
                <Text mb={4}>{selectedEvent.description}</Text>
                
                <Divider mb={4} />
                
                <HStack mb={4}>
                  <Avatar size="md" src={selectedEvent.social.profileImage} name={selectedEvent.social.author} />
                  <Box>
                    <HStack>
                      <Text fontWeight="bold">{selectedEvent.social.author}</Text>
                      {selectedEvent.social.verified && (
                        <Badge colorScheme="blue" variant="solid" borderRadius="full" p={0.5}>
                          ✓
                        </Badge>
                      )}
                    </HStack>
                    <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                      {selectedEvent.social.handle}
                    </Text>
                  </Box>
                </HStack>
              </ModalBody>
              
              <ModalFooter>
                {selectedEvent.status === 'upcoming' && (
                  <Button colorScheme="yellow" mr={3} leftIcon={<StarIcon />}>
                    Receber Notificação
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  mr={3} 
                  onClick={onClose}
                >
                  Fechar
                </Button>
                <Link 
                  href={`https://twitter.com/${selectedEvent.social.handle.substring(1)}`} 
                  isExternal
                >
                  <Button 
                    variant="ghost" 
                    colorScheme="blue" 
                    rightIcon={<ExternalLinkIcon />}
                  >
                    Ver no Twitter
                  </Button>
                </Link>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Box>
  )
} 