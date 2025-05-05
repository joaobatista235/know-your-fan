// import { useState } from 'react'
import {
  Box,
  VStack,
  Switch,
  FormControl,
  FormLabel,
  Select,
  Divider,
  Button,
  useToast,
  useColorMode,
} from '@chakra-ui/react'
import { FiBell, FiLock, FiSun, FiMoon, FiTrash2, FiSave } from 'react-icons/fi'

import { PageHeader } from '../components/PageHeader'
import { FormCard } from '../components/FormCard'

export const Settings = () => {
  const { colorMode, toggleColorMode } = useColorMode()
  // const [settings, setSettings] = useState({
  //   emailNotifications: true,
  //   pushNotifications: true,
  //   profilePrivacy: 'public',
  // })
  // const [isSubmitting, setIsSubmitting] = useState(false)

  const toast = useToast()

  // const handleChange = (field, value) => {
  //   setSettings(prev => ({
  //     ...prev,
  //     [field]: value
  //   }))
  // }

  // const handleSave = async () => {
  //   setIsSubmitting(true)
    
  //   await new Promise(resolve => setTimeout(resolve, 1000))
    
  //   toast({
  //     title: 'Configurações salvas',
  //     description: 'Suas preferências foram atualizadas com sucesso.',
  //     status: 'success',
  //     duration: 3000,
  //     isClosable: true,
  //   })
    
  //   setIsSubmitting(false)
  // }

  const handleDeleteAccount = () => {
    toast({
      title: 'Atenção',
      description: 'Entre em contato com o suporte para excluir sua conta.',
      status: 'warning',
      duration: 5000,
      isClosable: true,
    })
  }

  return (
    <Box maxWidth="800px" mx="auto" py={8}>
      <PageHeader 
        title="Configurações"
        subtitle="Gerencie suas preferências e configurações da conta."
      />

      <VStack spacing={6} align="stretch">
        {/* Notifications
        <FormCard
          title="Notificações"
          icon={FiBell}
        >
          <VStack spacing={4} align="stretch">
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel mb={0}>Notificações por e-mail</FormLabel>
              <Switch
                colorScheme="yellow"
                isChecked={settings.emailNotifications}
                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
              />
            </FormControl>
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel mb={0}>Notificações push</FormLabel>
              <Switch
                colorScheme="yellow"
                isChecked={settings.pushNotifications}
                onChange={(e) => handleChange('pushNotifications', e.target.checked)}
              />
            </FormControl>
          </VStack>
        </FormCard> */}

        {/* Privacy */}
        {/* <FormCard
          title="Privacidade"
          icon={FiLock}
        >
          <FormControl>
            <FormLabel>Visibilidade do perfil</FormLabel>
            <Select
              value={settings.profilePrivacy}
              onChange={(e) => handleChange('profilePrivacy', e.target.value)}
              _hover={{ borderColor: 'brand.primary' }}
            >
              <option value="public">Público</option>
              <option value="private">Privado</option>
            </Select>
          </FormControl>
        </FormCard> */}

        {/* Theme */}
        <FormCard
          title="Tema"
          icon={colorMode === 'dark' ? FiMoon : FiSun}
        >
          <FormControl display="flex" alignItems="center" justifyContent="space-between">
            <FormLabel mb={0}>
              {colorMode === 'dark' ? 'Modo escuro' : 'Modo claro'}
            </FormLabel>
            <Switch
              colorScheme="yellow"
              isChecked={colorMode === 'dark'}
              onChange={toggleColorMode}
            />
          </FormControl>
        </FormCard>

        {/* Account */}
        <FormCard
          title="Gerenciar Conta"
          icon={FiTrash2}
          cardProps={{ borderColor: 'red.500' }}
        >
          <Box>
            <FormControl mb={4}>
              <FormLabel color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                Ao excluir sua conta, todos os seus dados serão permanentemente removidos.
                Esta ação não pode ser desfeita.
              </FormLabel>
            </FormControl>
            <Button
              colorScheme="red"
              variant="outline"
              leftIcon={<FiTrash2 />}
              onClick={handleDeleteAccount}
            >
              Excluir minha conta
            </Button>
          </Box>
        </FormCard>

        <Divider borderColor={colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.200'} />

        {/* Action Buttons */}
        <Box display="flex" justifyContent="flex-end" gap={4}>
          <Button variant="ghost">Cancelar</Button>
          <Button 
            variant="primary" 
            // onClick={handleSave} 
            // isLoading={isSubmitting}
            loadingText="Salvando..."
            leftIcon={<FiSave />}
          >
            Salvar alterações
          </Button>
        </Box>
      </VStack>
    </Box>
  )
} 