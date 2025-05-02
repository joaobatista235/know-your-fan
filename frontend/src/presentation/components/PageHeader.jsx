import { Box, Heading, Text, useColorMode } from '@chakra-ui/react'

/**
 * PageHeader component for consistent page title styling
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Page subtitle/description
 * @param {string} props.mb - Margin bottom spacing
 * @param {Object} props.containerProps - Additional props for the container
 */
export const PageHeader = ({ 
  title, 
  subtitle, 
  mb = 8,
  containerProps = {}
}) => {
  const { colorMode } = useColorMode()
  
  return (
    <Box mb={mb} {...containerProps}>
      <Heading size="2xl">{title}</Heading>
      {subtitle && (
        <Text 
          mt={2} 
          color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
        >
          {subtitle}
        </Text>
      )}
    </Box>
  )
} 