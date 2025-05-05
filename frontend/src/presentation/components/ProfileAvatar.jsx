import { useState, useRef, useEffect } from 'react'
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
import { userService } from '../../services/api'

/**
 * ProfileAvatar component with image upload functionality
 * 
 * @param {Object} props
 * @param {string} props.src - Current avatar image source (base64 data)
 * @param {Function} props.onImageChange - Function called when image is changed, passes (base64Image, base64Image)
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
  const [localSrc, setLocalSrc] = useState(src)
  const fileInputRef = useRef(null)
  const toast = useToast()
  const avatarAttr = {
    bg: colorMode === 'dark' ? '#141414' : 'white',
    color: colorMode === 'dark' ? 'white' : '#141414',
  }

  useEffect(() => {
    const loadProfileImage = async () => {
      if (!src) {
        try {
          const base64Image = await userService.getProfileImage();
          console.log(base64Image)
          if (base64Image) {
            setLocalSrc(base64Image);
            if (onImageChange) {
              onImageChange(base64Image, base64Image);
            }
          }
        } catch (error) {
          console.error('Error loading profile image:', error);
        }
      }
    };
    
    loadProfileImage();
  }, [src, onImageChange]);

  // Update local source when prop changes
  useEffect(() => {
    if (src) {
      setLocalSrc(src);
    }
  }, [src]);

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

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 2MB.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64Image = event.target.result;
      setLocalSrc(base64Image);
      onImageChange && onImageChange(base64Image, base64Image)
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
          src={localSrc}
          name={name}
          size={size}
          border="3px solid"
          borderColor="brand.primary"
          {...avatarAttr}
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