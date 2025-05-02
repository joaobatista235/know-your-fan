import { useState, useRef } from 'react'
import {
  Box,
  Avatar,
  IconButton,
  useColorMode,
  VStack,
  Text,
  useToast,
} from '@chakra-ui/react'
import { FiCamera } from 'react-icons/fi'

/**
 * ProfileAvatar component with image upload functionality
 * 
 * @param {Object} props
 * @param {string} props.src - Current avatar image source
 * @param {Function} props.onImageChange - Function called when image is changed
 * @param {string} props.name - User's name for fallback
 * @param {string} props.size - Avatar size (sm, md, lg, xl, 2xl)
 */
export const ProfileAvatar = ({
  src,
  onImageChange,
  name = '',
  size = 'xl',
}) => {
  const { colorMode } = useColorMode()
  const [hovering, setHovering] = useState(false)
  const fileInputRef = useRef(null)
  const toast = useToast()

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione uma imagem válida.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      onImageChange && onImageChange(event.target.result)
    }
    reader.readAsDataURL(file)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <VStack spacing={3}>
      <Box
        position="relative"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <Avatar
          src={src}
          name={name}
          size={size}
          border="3px solid"
          borderColor="brand.primary"
          bg={colorMode === 'dark' ? 'brand.gray.dark' : 'gray.100'}
        />
        
        <IconButton
          aria-label="Change profile picture"
          icon={<FiCamera />}
          position="absolute"
          bottom="0"
          right="0"
          borderRadius="full"
          size="sm"
          bg="brand.primary"
          color="black"
          opacity={hovering ? 1 : 0.7}
          _hover={{ opacity: 1 }}
          onClick={triggerFileInput}
        />
        
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </Box>
      
      <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
        Clique para alterar
      </Text>
    </VStack>
  )
} 