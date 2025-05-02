export const styles = {
  container: {
    minH: '100vh',
    bg: 'var(--chakra-colors-chakra-body-bg)',
    display: 'flex',
    position: 'relative',
  },
  sidebar: {
    width: { base: '280px', md: '280px' },
    bg: 'var(--chakra-colors-brand-secondary-dark)',
    borderRight: '1px solid',
    borderColor: { light: 'gray.200', dark: 'whiteAlpha.100' },
    position: { base: 'fixed', md: 'sticky' },
    top: 0,
    left: 0,
    h: '100vh',
    transform: { base: 'translateX(-100%)', md: 'translateX(0)' },
    transition: 'all 0.3s ease-in-out',
    zIndex: 20,
    overflowY: 'auto',
    '&.open': {
      transform: 'translateX(0)',
      boxShadow: { base: '4px 0 8px rgba(0, 0, 0, 0.3)', md: 'none' },
    }
  },
  sidebarHeader: {
    p: 6,
    borderBottom: '1px solid',
    borderColor: { light: 'gray.200', dark: 'whiteAlpha.100' },
    position: 'sticky',
    top: 0,
    bg: 'var(--chakra-colors-brand-secondary-dark)',
    zIndex: 1,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    img: {
      h: '32px',
    }
  },
  nav: {
    py: 4,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    px: 6,
    py: 3,
    color: { light: 'gray.700', dark: 'gray.300' },
    transition: 'all 0.2s',
    _hover: {
      bg: { light: 'gray.100', dark: 'whiteAlpha.100' },
      color: { light: 'black', dark: 'white' },
    },
    '&.active': {
      bg: '#FFD60A20',
      color: '#FFD60A',
    }
  },
  navIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  main: {
    flex: 1,
    width: { base: '100%', md: 'calc(100% - 280px)' },
    p: { base: '60px 16px 16px', md: 8 },
    minH: '100vh',
    transition: 'padding 0.3s ease-in-out',
  },
  mobileMenuButton: {
    display: { base: 'flex', md: 'none' },
    position: 'fixed',
    top: 4,
    left: 4,
    zIndex: 30,
    bg: 'brand.secondary.dark',
    color: 'white',
    _hover: {
      bg: 'brand.gray.dark',
    },
    _active: {
      bg: 'brand.gray.dark',
    },
  },
  overlay: {
    display: { base: 'block', md: 'none' },
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    bg: 'blackAlpha.600',
    zIndex: 15,
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease-in-out',
    '&.open': {
      opacity: 1,
      pointerEvents: 'auto',
    }
  }
} 