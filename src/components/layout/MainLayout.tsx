import React, { ReactNode, useState } from 'react'
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Avatar,
  Text,
  VStack,
  Button,
  Drawer,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  FiHome,
  FiSearch,
  FiUser,
  FiMail,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiGlobe,
  FiMenu,
  FiX,
} from 'react-icons/fi'
import { logout } from '../../__data__/slices/authSlice'
import { useAuth } from '../../hooks/useAuth'
import { colors } from '../../utils/colorMode'

interface MainLayoutProps {
  children: ReactNode
}

interface NavItemProps {
  icon: React.ElementType
  label: string
  path: string
  onClick: () => void
}

const NavItem = ({ icon: Icon, label, onClick }: NavItemProps) => {
  return (
    <Flex
      align="center"
      p={3}
      mx={4}
      borderRadius="lg"
      role="group"
      cursor="pointer"
      transition="all 0.2s ease-in-out"
      color="gray.700"
      _hover={{
        bg: 'orange.500',
        color: 'white',
      }}
      onClick={onClick}
      minH="48px"
    >
      <Box as={Icon} w={5} h={5} flexShrink={0} />
      <Text ml={4} fontSize="sm" fontWeight="medium">
        {label}
      </Text>
    </Flex>
  )
}

const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  const navItems = [
    { icon: FiHome, label: t('nav.dashboard'), path: '/dashboard' },
    { icon: FiSearch, label: t('nav.search'), path: '/search' },
    { icon: FiUser, label: t('nav.profile'), path: '/company/profile' },
    { icon: FiMail, label: t('nav.messages'), path: '/messages' },
    { icon: FiFileText, label: t('nav.requests'), path: '/requests' },
    { icon: FiSettings, label: t('nav.settings'), path: '/settings' },
  ]

  const handleNavClick = (path: string) => {
    navigate(path)
    onClose?.()
  }

  return (
    <Box
      bg={colors.bg.primary}
      borderRight="1px"
      borderRightColor={colors.border.primary}
      w={60}
      pos="fixed"
      h="full"
      display={{ base: 'none', md: 'block' }}
      zIndex="sticky"
    >
      <Flex 
        h="20" 
        alignItems="center" 
        mx={8} 
        justifyContent="space-between"
      >
        <Text 
          fontSize="2xl" 
          fontWeight="bold" 
          color="brand.500"
        >
          B2B Platform
        </Text>
      </Flex>
      <VStack gap={1} align="stretch">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            onClick={() => handleNavClick(item.path)}
          />
        ))}
      </VStack>
    </Box>
  )
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { t, i18n } = useTranslation('common')
  const { user } = useAuth()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/auth/login')
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ru' ? 'en' : 'ru'
    i18n.changeLanguage(newLang)
  }

  const navItems = [
    { icon: FiHome, label: t('nav.dashboard'), path: '/dashboard' },
    { icon: FiSearch, label: t('nav.search'), path: '/search' },
    { icon: FiUser, label: t('nav.profile'), path: '/company/profile' },
    { icon: FiMail, label: t('nav.messages'), path: '/messages' },
    { icon: FiFileText, label: t('nav.requests'), path: '/requests' },
    { icon: FiSettings, label: t('nav.settings'), path: '/settings' },
  ]

  return (
    <Box minH="100vh" bg={colors.bg.secondary}>
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer */}
      <Drawer.Root 
        open={isMobileMenuOpen} 
        onOpenChange={(e) => setIsMobileMenuOpen(e.open)}
        placement="left"
      >
        <Drawer.Backdrop />
        <Drawer.Content maxW="280px">
          <Drawer.Header>
            <Text fontSize="xl" fontWeight="bold" color="brand.500">
              B2B Platform
            </Text>
            <Drawer.CloseTrigger asChild>
              <IconButton size="sm" variant="ghost">
                <Box as={FiX} w={4} h={4} />
              </IconButton>
            </Drawer.CloseTrigger>
          </Drawer.Header>
          <Drawer.Body p={0}>
            <VStack gap={1} align="stretch">
              {navItems.map((item) => (
                <NavItem
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  onClick={() => {
                    navigate(item.path)
                    setIsMobileMenuOpen(false)
                  }}
                />
              ))}
            </VStack>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>

      {/* Main content area */}
      <Box ml={{ base: 0, md: 60 }} transition="margin-left 0.3s">
        {/* Header */}
        <Flex
          px={{ base: 3, md: 4 }}
          height={{ base: '16', md: '20' }}
          alignItems="center"
          bg={colors.bg.primary}
          borderBottomWidth="1px"
          borderBottomColor={colors.border.primary}
          justifyContent="space-between"
          flexShrink={0}
        >
          {/* Mobile menu button and logo */}
          <HStack gap={3}>
            <IconButton
              display={{ base: 'flex', md: 'none' }}
              size="sm"
              variant="ghost"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Открыть меню"
            >
              <Box as={FiMenu} w={5} h={5} />
            </IconButton>

            {/* Mobile logo - only visible when sidebar is hidden */}
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="brand.500"
              display={{ base: 'flex', md: 'none' }}
            >
              B2B Platform
            </Text>
          </HStack>

          <Flex gap={{ base: 2, md: 4 }} ml="auto" align="center">
            <IconButton
              size={{ base: 'xs', md: 'sm' }}
              variant="ghost"
              onClick={toggleLanguage}
              aria-label={t('nav.change_language')}
            >
              <Box as={FiGlobe} w={{ base: 3, md: 4 }} h={{ base: 3, md: 4 }} />
            </IconButton>

            <Flex gap={2} align="center">
              <Avatar.Root size={{ base: 'xs', md: 'sm' }} name={user?.firstName || 'User'}>
                <Avatar.Fallback>{(user?.firstName || 'U')[0]}</Avatar.Fallback>
              </Avatar.Root>
              <VStack
                display={{ base: 'none', lg: 'flex' }}
                alignItems="flex-start"
                gap={0}
              >
                <Text fontSize="sm" fontWeight="medium">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.firstName || 'User'}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {user?.company?.name || ''}
                </Text>
              </VStack>
            </Flex>

            <Button
              size={{ base: 'xs', md: 'sm' }}
              variant="ghost"
              onClick={handleLogout}
              colorPalette="red"
            >
              <Box as={FiLogOut} w={{ base: 3, md: 4 }} h={{ base: 3, md: 4 }} />
              <Text ml={{ base: 1, md: 2 }} fontSize={{ base: 'xs', md: 'sm' }}>
                {t('nav.logout')}
              </Text>
            </Button>
          </Flex>
        </Flex>

        {/* Main content */}
        <Box p={{ base: 3, md: 4 }} flex="1" overflow="auto">
          {children}
        </Box>
      </Box>
    </Box>
  )
}
