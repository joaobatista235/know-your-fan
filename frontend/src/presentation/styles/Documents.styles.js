export const styles = {
  container: {
    maxW: '800px',
    mx: 'auto',
    py: { base: 4, md: 8 },
    px: { base: 4, md: 0 },
  },
  header: {
    mb: { base: 6, md: 12 },
  },
  subtitle: {
    color: 'gray.400',
    fontSize: { base: 'md', md: 'lg' },
    mb: { base: 6, md: 12 },
  },
  uploadSection: {
    bg: 'brand.secondary',
    borderRadius: 'xl',
    p: { base: 4, md: 8 },
    mb: 8,
  },
  dropzone: {
    border: '2px dashed',
    borderColor: 'brand.primary',
    borderRadius: 'xl',
    p: { base: 6, md: 8 },
    bg: 'brand.gray',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minH: '200px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    _hover: {
      bg: 'rgba(255, 214, 10, 0.05)',
    },
  },
  fileList: {
    mt: 6,
    width: '100%',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    bg: 'brand.gray',
    p: { base: 3, md: 4 },
    borderRadius: 'lg',
    mb: 3,
    flexWrap: { base: 'wrap', md: 'nowrap' },
    gap: { base: 2, md: 0 },
  },
  fileIcon: {
    color: 'brand.primary',
    fontSize: '24px',
    mr: 3,
    flexShrink: 0,
  },
  fileName: {
    color: 'white',
    flex: 1,
    wordBreak: 'break-all',
  },
  progressSection: {
    mt: 6,
    width: '100%',
  },
  infoSection: {
    bg: 'brand.secondary',
    borderRadius: 'xl',
    p: { base: 4, md: 8 },
  },
  infoIcon: {
    color: 'brand.primary',
    fontSize: '20px',
    mr: 2,
    flexShrink: 0,
  },
  supportedList: {
    mt: 4,
    spacing: 3,
  },
  supportedItem: {
    display: 'flex',
    alignItems: 'center',
    color: 'gray.300',
  },
  checkIcon: {
    color: 'green.500',
    mr: 2,
    flexShrink: 0,
  },
  uploadButton: {
    width: '100%',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  uploadButtonContainer: {
    width: '100%',
    mt: 6,
  }
} 