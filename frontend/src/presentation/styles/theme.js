import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#0A0A0A' : '#F8F9FA',
        color: props.colorMode === 'dark' ? '#FFFFFF' : '#000000',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      },
      '*': {
        transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
      },
      'input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active': {
        WebkitTextFillColor: props.colorMode === 'dark' ? '#FFFFFF' : '#000000',
        WebkitBoxShadow: `0 0 0 30px ${props.colorMode === 'dark' ? '#141414' : '#FFFFFF'} inset !important`,
        transition: 'background-color 5000s ease-in-out 0s',
      },
      'input:-webkit-autofill::first-line': {
        color: props.colorMode === 'dark' ? '#FFFFFF' : '#000000',
      }
    })
  },
  colors: {
    brand: {
      primary: '#FFD60A',
      secondary: {
        dark: '#141414',
        light: '#FFFFFF'
      },
      hover: '#FFE433',
      dark: '#0A0A0A',
      gray: {
        dark: '#141414',
        light: '#F8F9FA'
      },
    }
  },
  components: {
    Input: {
      baseStyle: (props) => ({
        field: {
          bg: props.colorMode === 'dark' ? '#141414' : '#FFFFFF',
          border: '1px solid',
          borderColor: props.colorMode === 'dark' ? '#333333' : '#E2E8F0',
          borderRadius: '12px',
          height: '56px',
          fontSize: '1rem',
          color: props.colorMode === 'dark' ? 'white' : 'black',
          _placeholder: {
            color: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
          },
          _focus: {
            borderColor: '#FFD60A',
            boxShadow: '0 0 0 1px #FFD60A',
            bg: props.colorMode === 'dark' ? '#141414' : '#FFFFFF',
          },
          _hover: {
            borderColor: '#FFD60A',
          }
        }
      }),
      defaultProps: {
        variant: null,
      }
    },
    Card: {
      baseStyle: (props) => ({
        container: {
          bg: props.colorMode === 'dark' ? '#141414' : '#FFFFFF',
          boxShadow: props.colorMode === 'dark' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          borderWidth: '1px',
          borderColor: props.colorMode === 'dark' ? 'transparent' : '#E2E8F0',
        }
      })
    },
    Button: {
      baseStyle: {
        borderRadius: '12px',
        fontWeight: 'medium',
        height: '56px',
        fontSize: '1rem',
      },
      variants: {
        primary: {
          bg: '#FFD60A',
          color: '#000000',
          _hover: {
            bg: '#FFE433',
          }
        },
        outline: (props) => ({
          bg: 'transparent',
          border: '1px solid',
          borderColor: '#FFD60A',
          color: props.colorMode === 'dark' ? '#FFD60A' : '#000000',
          _hover: {
            bg: props.colorMode === 'dark' ? 'rgba(255, 214, 10, 0.1)' : 'rgba(255, 214, 10, 0.2)',
          }
        }),
        ghost: (props) => ({
          bg: 'transparent',
          color: props.colorMode === 'dark' ? 'white' : 'gray.800',
          _hover: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50',
          }
        })
      }
    },
    FormLabel: {
      baseStyle: (props) => ({
        fontSize: 'sm',
        fontWeight: 'medium',
        mb: 2,
        color: props.colorMode === 'dark' ? 'white' : 'gray.700',
      })
    },
    Heading: {
      baseStyle: (props) => ({
        color: props.colorMode === 'dark' ? 'white' : 'gray.900',
        fontWeight: 'bold',
      })
    },
    Text: {
      baseStyle: (props) => ({
        color: props.colorMode === 'dark' ? '#CCCCCC' : 'gray.600',
      })
    },
    Select: {
      baseStyle: (props) => ({
        field: {
          bg: props.colorMode === 'dark' ? '#141414' : '#FFFFFF',
          border: '1px solid',
          borderColor: props.colorMode === 'dark' ? '#333333' : '#E2E8F0',
          color: props.colorMode === 'dark' ? 'white' : 'black',
          _hover: {
            borderColor: '#FFD60A',
          }
        }
      })
    },
    Switch: {
      baseStyle: (props) => ({
        track: {
          bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
          _checked: {
            bg: 'brand.primary',
          }
        }
      })
    }
  }
})

export default theme 