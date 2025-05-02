import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  VStack,
  Spinner,
  Divider,
  useColorMode,
  useToast,
  Flex,
} from '@chakra-ui/react'
import { FiUser, FiMapPin, FiTarget, FiSave, FiImage } from 'react-icons/fi'
import cep from 'cep-promise'

// Components
import { FormField } from '../components/FormField'
import { FormCard } from '../components/FormCard'
import { PageHeader } from '../components/PageHeader'
import { ProfileAvatar } from '../components/ProfileAvatar'
import { MaskedInput } from '../components/MaskedInput'

// Hooks and utils
import { useFormValidation } from '../hooks/useFormValidation'
import { validationPatterns, formatCPF, formatCEP } from '../utils/validations'

export const Profile = () => {
  const { colorMode } = useColorMode()
  const toast = useToast()
  const [loadingCep, setLoadingCep] = useState(false)
  const [profileImage, setProfileImage] = useState('')

  // Form validation
  const { 
    values, 
    errors, 
    touched,
    isSubmitting,
    handleChange, 
    handleBlur,
    handleSubmit,
    setFormValues
  } = useFormValidation(
    {
      name: '',
      cpf: '',
      dateOfBirth: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      favoriteGames: '',
      favoriteTeams: '',
      recentEvents: '',
    },
    {
      name: { 
        required: true,
        minLength: { value: 3, message: 'Nome deve ter pelo menos 3 caracteres' }
      },
      cpf: { 
        required: true,
        pattern: validationPatterns.cpf
      },
      cep: {
        required: true,
        pattern: validationPatterns.cep
      },
    }
  )

  // Handle CEP search when the value changes
  useEffect(() => {
    const searchCep = async () => {
      if (values.cep && values.cep.length === 8) {
        handleCepSearch(values.cep);
      }
    }
    
    searchCep();
  }, [values.cep]);

  const handleCepSearch = async (cepValue) => {
    setLoadingCep(true)
    try {
      const cepData = await cep(cepValue)
      setFormValues({
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
  }

  const onSubmit = async () => {
    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: 'Perfil atualizado',
      description: 'Suas informações foram atualizadas com sucesso.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    })
  }

  return (
    <Box maxWidth="800px" mx="auto" py={8}>
      <PageHeader 
        title="Meu Perfil" 
        subtitle="Mantenha suas informações atualizadas para uma melhor experiência."
      />

      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(onSubmit);
      }}>
        <VStack spacing={6} align="stretch">
          {/* Profile Image */}
          <FormCard 
            title="Foto de Perfil"
            icon={FiImage}
          >
            <Flex justifyContent="center" py={4}>
              <ProfileAvatar
                src={profileImage}
                name={values.name}
                onImageChange={setProfileImage}
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
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Digite seu nome completo"
                isRequired
                error={touched.name && errors.name}
              />

              <MaskedInput
                name="cpf"
                label="CPF"
                value={values.cpf}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Digite seu CPF"
                isRequired
                error={touched.cpf && errors.cpf}
                formatFn={formatCPF}
              />

              <FormField
                name="dateOfBirth"
                label="Data de Nascimento"
                type="date"
                value={values.dateOfBirth}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Box>
          </FormCard>

          {/* Address */}
          <FormCard 
            title="Endereço"
            icon={FiMapPin}
          >
            <Box display="grid" gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
              <MaskedInput
                name="cep"
                label="CEP"
                value={values.cep}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Digite seu CEP"
                isRequired
                error={touched.cep && errors.cep}
                formatFn={formatCEP}
                rightElement={loadingCep ? <Spinner size="sm" color="brand.primary" /> : null}
              />

              <FormField
                name="street"
                label="Rua"
                value={values.street}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nome da rua"
              />

              <FormField
                name="number"
                label="Número"
                value={values.number}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Número"
              />

              <FormField
                name="complement"
                label="Complemento"
                value={values.complement}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Apto, bloco, etc."
              />

              <FormField
                name="neighborhood"
                label="Bairro"
                value={values.neighborhood}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Bairro"
              />

              <FormField
                name="city"
                label="Cidade"
                value={values.city}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Cidade"
              />

              <FormField
                name="state"
                label="Estado"
                value={values.state}
                onChange={handleChange}
                onBlur={handleBlur}
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
                value={values.favoriteGames}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ex: CS:GO, Valorant, League of Legends"
              />

              <FormField
                name="favoriteTeams"
                label="Times Favoritos da FURIA"
                value={values.favoriteTeams}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ex: FURIA CS:GO, FURIA Valorant"
              />

              <FormField
                name="recentEvents"
                label="Eventos Recentes"
                value={values.recentEvents}
                onChange={handleChange}
                onBlur={handleBlur}
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