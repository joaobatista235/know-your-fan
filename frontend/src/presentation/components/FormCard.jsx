import { Card, CardBody, HStack, Icon, Heading, Box } from '@chakra-ui/react'

/**
 * FormCard component for consistent form section styling
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content inside the card
 * @param {string} props.title - Title of the card section
 * @param {React.ElementType} props.icon - Icon to display next to the title
 * @param {Object} props.cardProps - Additional props to pass to the Card component
 */
export const FormCard = ({ children, title, icon, cardProps = {} }) => {
  return (
    <Card borderRadius="xl" shadow="sm" {...cardProps}>
      <CardBody>
        <HStack mb={4} spacing={3}>
          <Icon as={icon} color="brand.primary" fontSize="24px" />
          <Heading size="md">{title}</Heading>
        </HStack>
        <Box>{children}</Box>
      </CardBody>
    </Card>
  )
} 