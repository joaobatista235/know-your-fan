import { useState } from 'react'
import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  useToast,
  Progress,
  List,
  ListItem,
  Icon,
  HStack,
  Card,
  CardBody,
  useColorMode,
} from '@chakra-ui/react'
import { FiUpload, FiCheck, FiAlertCircle, FiFile, FiX } from 'react-icons/fi'

export const Documents = () => {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { colorMode } = useColorMode()
  const toast = useToast()

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const handleUpload = async () => {
    setUploading(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          toast({
            title: 'Upload concluído',
            description: 'Seus documentos foram enviados e estão sendo validados.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          })
          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Box maxWidth="800px" mx="auto" py={8} px={{ base: 4, md: 0 }}>
      <Box mb={12}>
        <Heading size="2xl">Upload de Documentos</Heading>
        <Text mt={2} color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
          Faça o upload dos seus documentos para validação.
        </Text>
      </Box>

      <Card borderRadius="xl" mb={8}>
        <CardBody p={{ base: 4, md: 8 }}>
          <Box
            as="label"
            htmlFor="file-upload"
            border="2px dashed"
            borderColor="brand.primary"
            borderRadius="xl"
            p={{ base: 6, md: 8 }}
            bg={colorMode === 'dark' ? 'brand.gray.dark' : 'gray.50'}
            textAlign="center"
            cursor="pointer"
            transition="all 0.2s"
            minH="200px"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            _hover={{
              bg: colorMode === 'dark' ? 'rgba(255, 214, 10, 0.05)' : 'rgba(255, 214, 10, 0.02)',
            }}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <Icon as={FiUpload} fontSize="32px" color="brand.primary" mb={4} />
            <Text fontSize="lg" fontWeight="medium" mb={2}>
              Arraste seus arquivos ou clique para selecionar
            </Text>
            <Text color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
              Suportamos arquivos PDF, JPG e PNG
            </Text>
          </Box>

          {files.length > 0 && (
            <Box mt={6} width="100%">
              <List spacing={3}>
                {files.map((file, index) => (
                  <ListItem 
                    key={index} 
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    bg={colorMode === 'dark' ? 'brand.gray.dark' : 'gray.50'}
                    p={{ base: 3, md: 4 }}
                    borderRadius="lg"
                    mb={3}
                    flexWrap={{ base: 'wrap', md: 'nowrap' }}
                    gap={{ base: 2, md: 0 }}
                  >
                    <HStack flex={1}>
                      <Icon as={FiFile} color="brand.primary" fontSize="24px" mr={3} flexShrink={0} />
                      <Text color={colorMode === 'dark' ? 'white' : 'gray.700'} flex={1} wordBreak="break-all">{file.name}</Text>
                    </HStack>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => removeFile(index)}
                      leftIcon={<Icon as={FiX} />}
                    >
                      Remover
                    </Button>
                  </ListItem>
                ))}
              </List>

              {uploading ? (
                <Box mt={6} width="100%">
                  <Progress
                    value={uploadProgress}
                    size="sm"
                    colorScheme="yellow"
                    borderRadius="full"
                    bg={colorMode === 'dark' ? 'brand.gray.dark' : 'gray.100'}
                  />
                  <Text mt={2} textAlign="center">
                    Enviando... {uploadProgress}%
                  </Text>
                </Box>
              ) : (
                <Box width="100%" mt={6}>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleUpload}
                    leftIcon={<Icon as={FiUpload} />}
                    width="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    gap={2}
                  >
                    Enviar Documentos
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </CardBody>
      </Card>

      <Card borderRadius="xl">
        <CardBody p={{ base: 4, md: 8 }}>
          <Heading size="md" mb={6} display="flex" alignItems="center">
            <Icon as={FiAlertCircle} color="brand.primary" fontSize="20px" mr={2} flexShrink={0} />
            Documentos Aceitos
          </Heading>
          <List mt={4} spacing={3}>
            <ListItem display="flex" alignItems="center" color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}>
              <Icon as={FiCheck} color="green.500" mr={2} flexShrink={0} />
              <Text>RG ou CNH</Text>
            </ListItem>
            <ListItem display="flex" alignItems="center" color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}>
              <Icon as={FiCheck} color="green.500" mr={2} flexShrink={0} />
              <Text>Comprovante de Residência</Text>
            </ListItem>
            <ListItem display="flex" alignItems="center" color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}>
              <Icon as={FiCheck} color="green.500" mr={2} flexShrink={0} />
              <Text>Foto de Perfil</Text>
            </ListItem>
          </List>

          <Text mt={6} color={colorMode === 'dark' ? 'gray.400' : 'gray.600'} fontSize="sm">
            Seus documentos serão validados usando IA para garantir autenticidade.
            Todos os arquivos são criptografados e armazenados com segurança.
          </Text>
        </CardBody>
      </Card>
    </Box>
  )
} 