import { useState } from 'react'
import {
  Box,
  Button,
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
  Badge,
  VStack,
  Divider,
  Image,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react'
import { FiUpload, FiCheck, FiAlertCircle, FiFile, FiX, FiFileText, FiInfo } from 'react-icons/fi'
import { userService } from '../../services/api'

const FIELD_TRANSLATIONS = {
  'rg': 'RG',
  'data_emissao': 'Data de Emissão',
  'endereco': 'Endereço',
  'cep': 'CEP',
  'confianca': 'Confiança',
  'raw_text': 'Texto Extraído',
  'data_processamento': 'Data de Processamento',
  'dimensoes': 'Dimensões',
  'face_detected': 'Face Detectada',
  'formato_original': 'Formato Original',
  'nome_arquivo': 'Nome do Arquivo',
  'qualidade_imagem': 'Qualidade da Imagem',
  'tipo_documento': 'Tipo de Documento',
  'nome_completo': 'Nome Completo',
  'cpf': 'CPF',
  'data_nascimento': 'Data de Nascimento',
  'categoria_cnh': 'Categoria CNH'
}

const DOCUMENT_TYPE_TRANSLATIONS = {
  'rg': 'RG',
  'cnh': 'CNH',
  'address_proof': 'Comprovante de Residência',
  'profile_photo': 'Foto de Perfil',
  'other': 'Outro',
  'unknown': 'Desconhecido'
}

// Campos prioritários para exibição (na ordem)
const PRIORITY_FIELDS = ['nome_completo', 'cpf', 'data_nascimento', 'categoria_cnh'];

export const Documents = () => {
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [documentResult, setDocumentResult] = useState(null)
  const { colorMode } = useColorMode()
  const toast = useToast()
  const [isPdf, setIsPdf] = useState(false)
  const [processedImageUrl, setProcessedImageUrl] = useState(null)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      const isPdfFile = selectedFile.type === 'application/pdf' ||
        selectedFile.name.toLowerCase().endsWith('.pdf')
      setIsPdf(isPdfFile)

      const fileUrl = URL.createObjectURL(selectedFile)
      setFilePreview(fileUrl)
      setProcessedImageUrl(null)

      setDocumentResult(null)
    }
  }

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
      reader.readAsDataURL(file)
    })
  }

  const getStatusBadge = (status) => {
    if (!status) return null;

    let color;
    let label;

    switch (status) {
      case 'analyzed':
        color = 'blue';
        label = 'Analisado';
        break;
      case 'valid':
        color = 'green';
        label = 'Validado';
        break;
      case 'invalid':
        color = 'red';
        label = 'Inválido';
        break;
      case 'error':
        color = 'orange';
        label = 'Erro na análise';
        break;
      case 'insufficient':
        color = 'yellow';
        label = 'Dados insuficientes';
        break;
      case 'ocr_unavailable':
        color = 'purple';
        label = 'Análise Básica';
        break;
      default:
        color = 'gray';
        label = 'Pendente';
    }

    return <Badge colorScheme={color}>{label}</Badge>;
  }

  const formatConfidence = (confidence) => {
    if (confidence === undefined || confidence === null) return "0%";
    return `${(confidence * 100).toFixed(1)}%`;
  }

  const formatBooleanValue = (value) => {
    if (value === true) return 'Sim';
    if (value === false) return 'Não';
    return 'Não disponível';
  };

  const formatFieldValue = (key, value) => {
    if (value === undefined || value === null) return 'N/A';

    if (key === 'face_detected' || typeof value === 'boolean') {
      return formatBooleanValue(value);
    }

    return value;
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, selecione um arquivo para enviar.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setDocumentResult(null)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)

      try {
        const base64Content = await convertFileToBase64(file)
        const documentData = {
          file_name: file.name,
          content: base64Content,
        }
        const requestData = {
          document: documentData
        }
        await userService.analyzeDocument(requestData)
          .then(response => {
            clearInterval(progressInterval)
            setUploadProgress(100)
            if (response && response.result) {
              const result = response.result
              if (filePreview) {
                result.preview = filePreview
              }
              if (result.processed_image) {
                setProcessedImageUrl(`data:image/jpeg;base64,${result.processed_image}`)
              }
              result.extracted_data = result.extracted_data || {}
              result.face_verification = result.face_verification || { verified: false }
              result.analysis_result = {
                status: result.success ? 'analyzed' : 'error',
                message: response.message || 'Documento analisado',
                confidence: 0.8
              }
              result.file_name = documentData.file_name
              setDocumentResult(result)

              toast({
                title: 'Análise concluída',
                description: response.message || 'Seu documento foi analisado.',
                status: result.success ? 'success' : 'warning',
                duration: 5000,
                isClosable: true,
              })
            }
          })
          .catch(err => {
            clearInterval(progressInterval)
            console.error('Error during document analysis:', err)
            throw err
          })
      } catch (err) {
        clearInterval(progressInterval)
        console.error('Error processing file:', err)

        toast({
          title: 'Erro ao processar arquivo',
          description: 'Não foi possível analisar o documento. Tente novamente mais tarde.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('Upload error:', error)

      toast({
        title: 'Erro na análise',
        description: error?.response?.data?.error || 'Não foi possível analisar o documento. Tente novamente mais tarde.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setUploading(false)
    }
  }

  // Função unificada para limpar estados, usada tanto para remover quanto para novo upload
  const clearDocumentState = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview)
    }
    setFile(null)
    setFilePreview(null)
    setDocumentResult(null)
  }

  // Aliases para melhor semântica
  const removeFile = clearDocumentState
  const newUpload = clearDocumentState

  const renderDocumentPreview = () => {
    if (processedImageUrl) {
      return (
        <Box>
          <Heading size="sm" mb={2}>Documento Processado</Heading>
          <Box
            p={2}
            borderRadius="md"
            border="1px solid"
            borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
            mb={4}
          >
            <Image
              src={processedImageUrl}
              alt="Documento processado"
              maxH="300px"
              mx="auto"
              objectFit="contain"
              borderRadius="md"
              onError={() => console.error("Error loading processed image")}
            />
          </Box>
        </Box>
      );
    }

    if (!filePreview) {
      return null;
    }

    if (isPdf) {
      return (
        <Box>
          <Heading size="sm" mb={2}>Documento Original (PDF)</Heading>
          <Box
            p={2}
            borderRadius="md"
            border="1px solid"
            borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
            mb={4}
            textAlign="center"
          >
            <Icon as={FiFileText} fontSize="64px" color="red.500" />
            <Text mt={2} fontWeight="medium">{file?.name}</Text>
          </Box>
        </Box>
      );
    }

    return (
      <Box>
        <Heading size="sm" mb={2}>Documento Original</Heading>
        <Box
          p={2}
          borderRadius="md"
          border="1px solid"
          borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
          mb={4}
        >
          <Image
            src={filePreview}
            alt="Documento enviado"
            maxH="300px"
            mx="auto"
            objectFit="contain"
            borderRadius="md"
            onError={() => console.error("Error loading preview image")}
          />
        </Box>
      </Box>
    );
  }

  // Função auxiliar para renderizar um campo de dados extraídos
  const renderExtractedField = (key, value) => {
    if (value === undefined || value === null || value === "") return null;
    
    return (
      <HStack key={key} mb={2} justifyContent="space-between">
        <Text fontWeight="bold">{FIELD_TRANSLATIONS[key] || key}:</Text>
        <Text>{formatFieldValue(key, value)}</Text>
      </HStack>
    );
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
          {!file && !documentResult ? (
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
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={uploading}
                accept="image/jpeg,image/png,image/jpg,application/pdf"
              />
              <Icon as={FiUpload} fontSize="32px" color="brand.primary" mb={4} />
              <Text fontSize="lg" fontWeight="medium" mb={2}>
                Arraste seu arquivo ou clique para selecionar
              </Text>
              <Text color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                Suportamos arquivos PDF, JPG e PNG
              </Text>
            </Box>
          ) : documentResult ? (
            <Box mt={4} width="100%">
              <VStack spacing={6} align="stretch">
                <HStack>
                  <Icon as={FiFileText} fontSize="24px" color="brand.primary" />
                  <Heading size="md">Resultado da Análise</Heading>
                </HStack>

                {/* Document Preview */}
                {renderDocumentPreview()}

                <Box p={4} borderRadius="md" bg={colorMode === 'dark' ? 'brand.gray.dark' : 'gray.50'}>
                  <HStack mb={2} justifyContent="space-between">
                    <Text fontWeight="bold">Documento:</Text>
                    <Text>{documentResult.file_name}</Text>
                  </HStack>

                  <HStack mb={2} justifyContent="space-between">
                    <Text fontWeight="bold">Tipo:</Text>
                    <Text>{DOCUMENT_TYPE_TRANSLATIONS[documentResult.detection_info?.document_type] || documentResult.file_type}</Text>
                  </HStack>

                  <HStack mb={2} justifyContent="space-between">
                    <Text fontWeight="bold">Status:</Text>
                    {getStatusBadge(documentResult?.analysis_result?.status)}
                  </HStack>

                  <HStack mb={2} justifyContent="space-between">
                    <Text fontWeight="bold">Confiança:</Text>
                    <Text>{formatConfidence(documentResult?.analysis_result?.confidence)}</Text>
                  </HStack>

                  {documentResult?.analysis_result?.message && (
                    <HStack mb={2} justifyContent="space-between">
                      <Text fontWeight="bold">Mensagem:</Text>
                      <Text>{documentResult.analysis_result.message}</Text>
                    </HStack>
                  )}
                </Box>

                {documentResult?.extracted_data && Object.keys(documentResult.extracted_data).some(key =>
                  documentResult.extracted_data[key] && key !== "confianca"
                ) && (
                    <>
                      <Divider />
                      <Box>
                        <Heading size="sm" mb={3}>Dados Extraídos</Heading>

                        {/* Todos os dados extraídos em uma única listagem */}
                        <Box p={4} borderRadius="md" bg={colorMode === 'dark' ? 'brand.gray.dark' : 'gray.50'}>
                          {/* Renderizar campos prioritários primeiro */}
                          {PRIORITY_FIELDS.map(key =>
                            renderExtractedField(key, documentResult.extracted_data[key])
                          )}

                          {/* Demais dados extraídos (excluindo os prioritários e campos especiais) */}
                          {Object.entries(documentResult.extracted_data)
                            .filter(([key]) => 
                              !PRIORITY_FIELDS.includes(key) && 
                              key !== "confianca")
                            .map(([key, value]) => 
                              renderExtractedField(key, value)
                            )}
                        </Box>
                      </Box>
                    </>
                  )}

                <Button
                  mt={4}
                  variant="primary"
                  leftIcon={<Icon as={FiUpload} />}
                  onClick={newUpload}
                >
                  Enviar novo documento
                </Button>

                {/* Informações técnicas da imagem */}
                {documentResult?.image_analysis && (
                  <Accordion allowToggle mt={3}>
                    <AccordionItem
                      border="1px solid"
                      borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
                      borderRadius="md"
                    >
                      <h2>
                        <AccordionButton py={3}>
                          <Box as="span" flex='1' textAlign='left' fontWeight="medium">
                            <Icon as={FiInfo} mr={2} />
                            Informações da Imagem
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        <Box
                          p={3}
                          borderRadius="md"
                          bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
                          fontSize="sm"
                        >
                          {Object.entries(documentResult.image_analysis).map(([key, value]) =>
                            value !== null && typeof value !== 'object' && (
                              <HStack key={key} mb={2} justifyContent="space-between">
                                <Text fontWeight="bold">{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                                <Text>{value.toString()}</Text>
                              </HStack>
                            )
                          )}
                        </Box>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                )}
              </VStack>
            </Box>
          ) : (
            <Box mt={6} width="100%">
              {file && (
                <List spacing={3}>
                  <ListItem
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
                    {!uploading && (
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={removeFile}
                        leftIcon={<Icon as={FiX} />}
                        isDisabled={uploading}
                      >
                        Remover
                      </Button>
                    )}
                  </ListItem>
                </List>
              )}

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
                    Analisando documento... {uploadProgress}%
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
                    isDisabled={uploading || !file}
                  >
                    Enviar Documento
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
            O sistema usa análise de imagem para extrair informações relevantes.
          </Text>
        </CardBody>
      </Card>
    </Box>
  )
} 