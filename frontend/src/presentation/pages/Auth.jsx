import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  Input,
  Text,
  Heading,
  VStack,
  IconButton,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  useColorMode,
  Image,
  useToast,
  FormErrorMessage,
} from '@chakra-ui/react';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import furiaAuth from '../../assets/furia-auth.png';
import { authService } from '../../services/api';
import { useNavigate } from 'react-router-dom'

export const Auth = () => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const [showLogin, setShowLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [errors, setErrors] = useState({});

  const navigate = useNavigate()

  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/');
    }
  });

  const validateForm = () => {
    const newErrors = {};

    if (!email) newErrors.email = 'E-mail é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'E-mail inválido';

    if (!password) newErrors.password = 'Senha é obrigatória';
    else if (password.length < 6) newErrors.password = 'Senha deve ter pelo menos 6 caracteres';

    if (!showLogin && !name) newErrors.name = 'Nome é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (showLogin) {
        // Autenticação com email/senha
        const loginEmail = email.trim().toLowerCase();
        await authService.login(loginEmail, password);

        toast({
          title: 'Login realizado com sucesso',
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'top',
        });

        // Redirecionar para o perfil após login bem-sucedido
        setTimeout(() => {
          window.location.href = '/profile';
        }, 1000);
      } else {
        // Registrar novo usuário
        const registerEmail = email.trim().toLowerCase();
        await authService.register({ name, email: registerEmail, password });

        toast({
          title: 'Cadastro realizado com sucesso',
          description: 'Agora complete seu perfil para aproveitar todos os recursos!',
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'top',
        });

        // Redirecionar para o perfil após registro bem-sucedido
        setTimeout(() => {
          window.location.href = '/profile';
        }, 1000);
      }
    } catch (error) {
      console.error('Erro de autenticação:', error);

      const errorMessage = error.response?.data?.message ||
        (showLogin ? 'Falha no login. Verifique seus dados.' : 'Falha no cadastro. Tente novamente.');

      toast({
        title: 'Erro',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });

      setIsSubmitting(false);
    }
  };

  const toggleView = () => {
    setShowLogin(!showLogin);
    setErrors({});
  };

  return (
    <Box
      minH="100vh"
      width="100%"
      bg={colorMode === 'dark' ? 'brand.dark' : 'gray.50'}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        maxW="1000px"
        w="100%"
        h={{ base: "auto", md: "600px" }}
        borderRadius="20px"
        overflow="hidden"
        boxShadow="xl"
        position="relative"
      >
        <Box
          w="100%"
          h="100%"
          position="relative"
          display="flex"
          flexDir={{ base: "column", md: "row" }}
        >
          {/* Painel com a imagem */}
          <Box
            position="absolute"
            top="0"
            left={{ base: "0", md: showLogin ? "0" : "50%" }}
            width={{ base: "100%", md: "50%" }}
            height="100%"
            transition="left 0.6s ease-in-out"
            zIndex="1"
          >
            {/* Imagem de fundo */}
            <Box
              position="relative"
              width="100%"
              height="100%"
              overflow="hidden"
            >
              <Image
                src={furiaAuth}
                alt="Background"
                objectFit="cover"
                w="100%"
                h="100%"
                position="absolute"
                top="0"
                left="0"
              />

              {/* Conteúdo sobreposto */}
              <Box
                position="relative"
                zIndex="1"
                p={{ base: 6, md: 10 }}
                color="white"
                textAlign="center"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                h="100%"
                bg="rgba(0, 0, 0, 0.5)"
              >
                <Heading size="2xl" mb={6} textShadow="1px 1px 3px rgba(0, 0, 0, 0.5)">
                  {showLogin ? 'Bem-vindo de volta!' : 'Olá Guerreiro!'}
                </Heading>
                <Text fontSize="lg" mb={10} textShadow="1px 1px 3px rgba(0, 0, 0, 0.5)">
                  {showLogin
                    ? 'Para se manter conectado conosco, faça login com suas informações pessoais'
                    : 'Junte-se à nossa comunidade hoje e aproveite todos os nossos recursos'}
                </Text>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={toggleView}
                  borderColor="white"
                  color="white"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
                  isDisabled={isSubmitting}
                >
                  {showLogin ? 'CRIAR CONTA' : 'ENTRAR'}
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Formulário */}
          <Box
            position="absolute"
            top="0"
            left={{ base: "0", md: showLogin ? "50%" : "0" }}
            width={{ base: "100%", md: "50%" }}
            height="100%"
            transition="left 0.6s ease-in-out"
            zIndex="1"
            bg={colorMode === 'dark' ? 'brand.gray.dark' : 'white'}
            p={{ base: 6, md: 10 }}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <VStack spacing={8} align="center" w="100%" justify="center">
              <Heading size="xl" mb={2}>
                {showLogin ? 'Entrar' : 'Criar Conta'}
              </Heading>

              <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} mb={6}>
                {showLogin ? 'Acesse sua conta com seu e-mail e senha' : 'Preencha os dados abaixo para se registrar'}
              </Text>

              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <VStack spacing={5} w="100%">
                  {!showLogin && (
                    <FormControl isRequired isInvalid={!!errors.name}>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none" h="100%">
                          <FaUser color={colorMode === 'dark' ? '#666' : '#CBD5E0'} />
                        </InputLeftElement>
                        <Input
                          placeholder="Nome"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </InputGroup>
                      <FormErrorMessage>{errors.name}</FormErrorMessage>
                    </FormControl>
                  )}

                  <FormControl isRequired isInvalid={!!errors.email}>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none" h="100%">
                        <FaEnvelope color={colorMode === 'dark' ? '#666' : '#CBD5E0'} />
                      </InputLeftElement>
                      <Input
                        placeholder="E-mail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </InputGroup>
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.password}>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none" h="100%">
                        <FaLock color={colorMode === 'dark' ? '#666' : '#CBD5E0'} />
                      </InputLeftElement>
                      <Input
                        placeholder="Senha"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <InputRightElement h="100%" display="flex" alignItems="center" justifyContent="center">
                        <IconButton
                          variant="ghost"
                          aria-label="Mostrar senha"
                          icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                          onClick={() => setShowPassword(!showPassword)}
                          size="sm"
                          _hover={{ bg: 'transparent' }}
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>

                  {showLogin && (
                    <Text
                      alignSelf="flex-end"
                      fontSize="sm"
                      color="brand.primary"
                      cursor="pointer"
                      _hover={{ textDecoration: 'underline' }}
                    >
                      Esqueceu sua senha?
                    </Text>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    w="100%"
                    mt={6}
                    isLoading={isSubmitting}
                    loadingText={showLogin ? "Entrando..." : "Cadastrando..."}
                  >
                    {showLogin ? 'ENTRAR' : 'CADASTRAR'}
                  </Button>
                </VStack>
              </form>
            </VStack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Auth; 