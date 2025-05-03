import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  VStack,
  Spinner,
  Divider,
  useColorMode,
  useToast,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  InputGroup,
  InputRightElement,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
} from '@chakra-ui/react'
import { FiUser, FiMapPin, FiTarget, FiSave, FiImage } from 'react-icons/fi'
import cep from 'cep-promise'
import { useLocation } from 'react-router-dom'

import { FormField } from '../components/FormField'
import { FormCard } from '../components/FormCard'
import { PageHeader } from '../components/PageHeader'
import { ProfileAvatar } from '../components/ProfileAvatar'

import { useZodForm } from '../hooks/useZodForm'
import { maskCPF, maskCEP, removeNonDigits } from '../utils/masks'
import { profileSchema, profileDefaultValues } from '../../domain/schemas/profileSchema'
import { authService, userService } from '../../services/api'

export const Profile = () => {
  const { colorMode } = useColorMode()
  const toast = useToast()
  const location = useLocation()
  const [loadingCep, setLoadingCep] = useState(false)
  const [profileImage, setProfileImage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [showProfileAlert, setShowProfileAlert] = useState(
    location.state?.showProfileAlert || !authService.isProfileComplete()
  )

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
    watch,
    setValue,
    register,
    reset,
  } = useZodForm(profileSchema, profileDefaultValues)

  const cepValue = watch('cep')
  const cpfValue = watch('cpf')
  
  useEffect(() => {
    if (cpfValue) {
      const formatted = maskCPF(cpfValue);
      if (formatted !== cpfValue) {
        setValue('cpf', formatted);
      }
    }
  }, [cpfValue, setValue]);

  useEffect(() => {
    if (cepValue) {
      const formatted = maskCEP(cepValue);
      if (formatted !== cepValue) {
        setValue('cep', formatted);
      }
    }
  }, [cepValue, setValue]);
  
  const updateFormValues = useCallback((values) => {
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        setValue(key, value);
      }
    });
  }, [setValue]);

  useEffect(() => {
    const userData = authService.getUserData()
    if (userData) {
      // Update form with user data
      const formData = {
        name: userData.display_name || '',
        cpf: userData.cpf || '',
        dateOfBirth: userData.date_of_birth || '',
        cep: userData.cep || '',
        street: userData.street || '',
        number: userData.number || '',
        complement: userData.complement || '',
        neighborhood: userData.neighborhood || '',
        city: userData.city || '',
        state: userData.state || '',
        favorite_games: userData.favorite_games || '',
        favorite_teams: userData.favorite_teams || '',
        recent_events: userData.recent_events || '',
      }
      
      reset(formData)
      
      // Set profile image if it exists
      if (userData.profileImage) {
        setProfileImage(userData.profileImage)
      }
    }
  }, [updateFormValues, reset])

  const handleCepSearch = useCallback(async (cepValue) => {
    if (!cepValue || cepValue.length < 8) return;
    
    setLoadingCep(true)
    try {
      const cleanCep = removeNonDigits(cepValue);
      const cepData = await cep(cleanCep)
      updateFormValues({
        street: cepData.street || '',
        neighborhood: cepData.neighborhood || '',
        city: cepData.city || '',
        state: cepData.state || '',
      })
    } catch (err) {
      toast({
        title: 'Erro ao buscar CEP',
        description: 'Verifique o CEP informado e tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      console.error('Erro na busca do CEP:', err)
    } finally {
      setLoadingCep(false)
    }
  }, [toast, updateFormValues])

  useEffect(() => {
    const cleanCep = removeNonDigits(cepValue);
    if (cleanCep && cleanCep.length === 8) {
      const timer = setTimeout(() => {
        handleCepSearch(cleanCep)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [cepValue, handleCepSearch])

  const handleCpfChange = (e) => {
    const formattedValue = maskCPF(e.target.value);
    setValue('cpf', formattedValue);
  };

  const handleCepChange = (e) => {
    const formattedValue = maskCEP(e.target.value);
    setValue('cep', formattedValue);
  };

  const handleProfileImageChange = useCallback((image, file) => {
    setProfileImage(image)
    setImageFile(file)
  }, [])

  const onSubmit = async (formData) => {
    try {
      let imageData = null;
      if (imageFile) {
        try {
          // Use the base64 image data
          imageData = imageFile;
        } catch (imageError) {
          toast({
            title: 'Erro ao processar imagem',
            description: 'Não foi possível processar sua foto de perfil, mas seus dados serão salvos.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          console.error('Erro ao processar imagem:', imageError);
        }
      }

      const profileData = {
        display_name: formData.name,
        cpf: removeNonDigits(formData.cpf),
        date_of_birth: formData.dateOfBirth,
        cep: removeNonDigits(formData.cep),
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        favorite_games: formData.favoriteGames,
        favorite_teams: formData.favoriteTeams,
        recent_events: formData.recentEvents,
        profileImage: imageData,
      }

      // Remove undefined values
      Object.keys(profileData).forEach(key => 
        profileData[key] === undefined && delete profileData[key]
      );

      const response = await userService.updateProfile(profileData);

      // If user has a profile image, store it locally
      if (response?.user?.has_profile_image && imageData) {
        // The image is already in profileImage state
        setProfileImage(imageData);
      }

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      setShowProfileAlert(false)
    } catch (error) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.response?.data?.message || error.message || 'Ocorreu um erro ao atualizar o perfil.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Box maxWidth="800px" mx="auto" py={8}>
      <PageHeader
        title="Meu Perfil"
        subtitle="Mantenha suas informações atualizadas para uma melhor experiência."
      />

      {showProfileAlert && (
        <Alert
          status="info"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          borderRadius="md"
          mb={6}
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Complete seu perfil
          </AlertTitle>
          <AlertDescription maxWidth="sm" mb={3}>
            Por favor, preencha suas informações pessoais para ter acesso completo à plataforma FURIA.
          </AlertDescription>
          <CloseButton
            position="absolute"
            right="8px"
            top="8px"
            onClick={() => setShowProfileAlert(false)}
          />
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={6} align="stretch">
          {/* Profile Image */}
          <FormCard
            title="Foto de Perfil"
            icon={FiImage}
          >
            <Flex justifyContent="center" py={4}>
              <ProfileAvatar
                src={profileImage}
                name={watch('name')}
                onImageChange={handleProfileImageChange}
              />
            </Flex>
          </FormCard>

          {/* Personal Information */}
          <FormCard
            title="Informações Pessoais"
            icon={FiUser}
          >
            <Box display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
              <FormField
                name="name"
                label="Nome Completo"
                control={control}
                placeholder="Digite seu nome completo"
                isRequired
              />

              {/* Campo CPF com máscara aplicada diretamente */}
              <FormControl isInvalid={!!errors.cpf} isRequired mb={4}>
                <FormLabel htmlFor="cpf">CPF</FormLabel>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="Digite seu CPF"
                  value={cpfValue || ''}
                  onChange={handleCpfChange}
                  h="56px"
                  data-lpignore="true"
                  autoCorrect="off"
                  spellCheck="false"
                  {...register('cpf')}
                />
                {errors.cpf && (
                  <FormErrorMessage>
                    {errors.cpf.message}
                  </FormErrorMessage>
                )}
              </FormControl>

              <FormField
                name="dateOfBirth"
                label="Data de Nascimento"
                control={control}
                type="date"
              />
            </Box>
          </FormCard>

          {/* Address */}
          <FormCard
            title="Endereço"
            icon={FiMapPin}
          >
            <Box display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
              {/* Campo CEP com máscara aplicada diretamente */}
              <FormControl isInvalid={!!errors.cep} isRequired mb={4}>
                <FormLabel htmlFor="cep">CEP</FormLabel>
                <InputGroup>
                  <Input
                    id="cep"
                    type="text"
                    placeholder="Digite seu CEP"
                    value={cepValue || ''}
                    onChange={handleCepChange}
                    h="56px"
                    data-lpignore="true"
                    autoCorrect="off"
                    spellCheck="false"
                    {...register('cep')}
                  />
                  {loadingCep && (
                    <InputRightElement h="56px" pr={4}>
                      <Spinner size="sm" color="brand.primary" />
                    </InputRightElement>
                  )}
                </InputGroup>
                {errors.cep && (
                  <FormErrorMessage>
                    {errors.cep.message}
                  </FormErrorMessage>
                )}
              </FormControl>

              <FormField
                name="street"
                label="Rua"
                control={control}
                placeholder="Nome da rua"
              />

              <FormField
                name="number"
                label="Número"
                control={control}
                placeholder="Número"
              />

              <FormField
                name="complement"
                label="Complemento"
                control={control}
                placeholder="Apto, bloco, etc."
              />

              <FormField
                name="neighborhood"
                label="Bairro"
                control={control}
                placeholder="Bairro"
              />

              <FormField
                name="city"
                label="Cidade"
                control={control}
                placeholder="Cidade"
              />

              <FormField
                name="state"
                label="Estado"
                control={control}
                placeholder="Estado"
              />
            </Box>
          </FormCard>

          {/* Preferences */}
          <FormCard
            title="Preferências de Fã"
            icon={FiTarget}
          >
            <Box display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
              <FormField
                name="favoriteGames"
                label="Jogos Favoritos"
                control={control}
                placeholder="Ex: CS:GO, Valorant, League of Legends"
              />

              <FormField
                name="favoriteTeams"
                label="Times Favoritos da FURIA"
                control={control}
                placeholder="Ex: FURIA CS:GO, FURIA Valorant"
              />

              <FormField
                name="recentEvents"
                label="Eventos Recentes"
                control={control}
                placeholder="Eventos que você participou recentemente"
              />
            </Box>
          </FormCard>

          <Divider borderColor={colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.200'} />

          {/* Action Buttons */}
          <Box display="flex" justifyContent="flex-end" gap={4}>
            <Button variant="ghost">Cancelar</Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              loadingText="Salvando..."
              leftIcon={<FiSave />}
            >
              Salvar Alterações
            </Button>
          </Box>
        </VStack>
      </form>
    </Box>
  )
} 