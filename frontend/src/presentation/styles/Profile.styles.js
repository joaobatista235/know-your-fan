export const styles = {
  container: {
    maxW: '800px',
    mx: 'auto',
    py: 8,
  },
  header: {
    mb: 12,
  },
  subtitle: {
    color: 'gray.400',
    fontSize: 'lg',
    mb: 12,
  },
  form: {
    width: '100%',
  },
  section: {
    bg: 'brand.secondary',
    borderRadius: 'xl',
    p: 8,
    mb: 8,
  },
  sectionTitle: {
    fontSize: '2xl',
    mb: 8,
    color: 'white',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: { base: '1fr', md: 'repeat(2, 1fr)' },
    gap: 8,
  },
  formControl: {
    mb: 6,
  },
  input: {
    bg: 'brand.gray',
    border: '1px solid',
    borderColor: 'whiteAlpha.200',
    _focus: {
      borderColor: 'brand.primary',
      boxShadow: '0 0 0 1px var(--chakra-colors-brand-primary)',
      bg: 'brand.gray',
    },
    _hover: {
      borderColor: 'brand.primary',
    },
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 4,
    mt: 8,
  },
  uploadButton: {
    variant: 'outline',
    borderColor: 'brand.primary',
    color: 'brand.primary',
    _hover: {
      bg: 'rgba(255, 221, 0, 0.1)',
    },
  },
  socialSection: {
    bg: 'brand.secondary',
    borderRadius: 'lg',
    p: 6,
  },
} 