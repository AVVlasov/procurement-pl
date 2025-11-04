import React, { useState } from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Switch,
  NativeSelect,
  Field,
  Dialog,
  Input,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { FiSettings, FiUser, FiBell, FiShield, FiEdit } from 'react-icons/fi'
import { MainLayout } from '../../components/layout/MainLayout'
import { useAuth } from '../../hooks/useAuth'
import { useChangePasswordMutation, useDeleteAccountMutation, useUpdateProfileMutation } from '../../__data__/api/authApi'
import { useToast } from '../../hooks/useToast'
import { PasswordInput } from '../../components/ui/password-input'
import { useDispatch } from 'react-redux'
import { updateUser } from '../../__data__/slices/authSlice'

const SettingsPage = () => {
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user, company, logout } = useAuth()
  const userEmail = user?.email || ''
  const companyId = company?.id
  
  // Загружаем настройки уведомлений из localStorage
  const loadNotificationSettings = () => {
    try {
      const saved = localStorage.getItem('notificationSettings')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          notifications: parsed.notificationsEnabled !== false,
          email: parsed.emailUpdatesEnabled === true,
        }
      }
    } catch (e) {
      console.error('Error loading notification settings:', e)
    }
    return { notifications: true, email: false }
  }
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(loadNotificationSettings().notifications)
  const [emailUpdatesEnabled, setEmailUpdatesEnabled] = useState(loadNotificationSettings().email)
  const [language, setLanguage] = useState(i18n.language)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    position: user?.position || '',
    phone: user?.phone || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmation: '',
  })
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation()
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation()
  const [deleteAccount, { isLoading: isDeletingAccount }] = useDeleteAccountMutation()
  const { success: showSuccess, error: showError, warning: showWarning } = useToast()

  const handleLanguageChange = (value: string) => {
    setLanguage(value)
    i18n.changeLanguage(value)
    showSuccess(t('settings.messages.languageChanged'))
  }

  const handleToggleNotifications = (checked: boolean) => {
    setNotificationsEnabled(checked)
    try {
      const current = loadNotificationSettings()
      localStorage.setItem('notificationSettings', JSON.stringify({
        notificationsEnabled: checked,
        emailUpdatesEnabled: current.email,
      }))
      showSuccess(t('settings.messages.notificationsUpdated'))
    } catch (e) {
      console.error('Error saving notification settings:', e)
    }
  }

  const handleToggleEmailUpdates = (checked: boolean) => {
    setEmailUpdatesEnabled(checked)
    try {
      const current = loadNotificationSettings()
      localStorage.setItem('notificationSettings', JSON.stringify({
        notificationsEnabled: current.notifications,
        emailUpdatesEnabled: checked,
      }))
      showSuccess(t('settings.messages.emailUpdated'))
    } catch (e) {
      console.error('Error saving email settings:', e)
    }
  }

  const handleUpdateProfile = async () => {
    if (!profileForm.firstName || !profileForm.lastName) {
      showWarning(t('settings.profile.validation.required'))
      return
    }

    try {
      const result = await updateProfile(profileForm).unwrap()
      if (result.user) {
        dispatch(updateUser(result.user))
      }
      showSuccess(t('messages.profile_updated'))
      setEditProfileOpen(false)
    } catch (err) {
      console.error('[SettingsPage] updateProfile error:', err)
      showError(t('settings.profile.updateError'))
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showWarning(t('settings.password.validation.required'))
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showWarning(t('settings.password.validation.mismatch'))
      return
    }

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }).unwrap()

      showSuccess(t('settings.password.success'))
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setChangePasswordOpen(false)
    } catch (err) {
      console.error('[SettingsPage] changePassword error:', err)
      showError(t('settings.password.error'))
    }
  }

  const handleDeleteAccount = async () => {
    if (!deleteForm.password || !deleteForm.confirmation) {
      showWarning(t('settings.delete.validation.required'))
      return
    }

    if (userEmail && deleteForm.confirmation.trim().toLowerCase() !== userEmail.toLowerCase()) {
      showWarning(t('settings.delete.validation.confirmation', { email: userEmail }))
      return
    }

    try {
      await deleteAccount({ password: deleteForm.password }).unwrap()
      showSuccess(t('settings.delete.success'))
      setDeleteAccountOpen(false)
      setDeleteForm({ password: '', confirmation: '' })
      logout()
      navigate('/auth/login')
    } catch (err) {
      console.error('[SettingsPage] deleteAccount error:', err)
      showError(t('settings.delete.error'))
    }
  }

  return (
    <MainLayout>
      <Box>
        <HStack mb={6}>
          <Text fontSize="2xl" fontWeight="bold">
            {t('nav.settings')}
          </Text>
        </HStack>

        <VStack gap={6} align="stretch">

          <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
            <HStack mb={4} justify="space-between">
              <HStack>
                <FiUser />
                <Text fontWeight="semibold">{t('settings.profile.title')}</Text>
              </HStack>
              <Button 
                colorPalette="blue" 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setProfileForm({
                    firstName: user?.firstName || '',
                    lastName: user?.lastName || '',
                    position: user?.position || '',
                    phone: user?.phone || '',
                  })
                  setEditProfileOpen(true)
                }}
              >
                <FiEdit />
                <Text ml={2}>{t('buttons.edit')}</Text>
              </Button>
            </HStack>
            <VStack gap={4} align="stretch">
              <HStack justify="space-between">
                <Text>{t('settings.profile.name')}</Text>
                <Text fontWeight="medium">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : t('settings.profile.unknown')}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text>{t('settings.profile.email')}</Text>
                <Text fontWeight="medium">{userEmail || t('settings.profile.unknown')}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text>{t('settings.profile.company')}</Text>
                <Text fontWeight="medium">{company?.name || t('settings.profile.unknown')}</Text>
              </HStack>
              {user?.position && (
                <HStack justify="space-between">
                  <Text>{t('settings.profile.position')}</Text>
                  <Text fontWeight="medium">{user.position}</Text>
                </HStack>
              )}
              {user?.phone && (
                <HStack justify="space-between">
                  <Text>{t('settings.profile.phone')}</Text>
                  <Text fontWeight="medium">{user.phone}</Text>
                </HStack>
              )}
            </VStack>
          </Box>

          <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
            <HStack mb={4}>
              <FiBell />
              <Text fontWeight="semibold">{t('settings.notifications.title')}</Text>
            </HStack>
            <VStack gap={4} align="stretch">
              <HStack justify="space-between">
                <VStack align="start" gap={1}>
                  <Text fontWeight="medium">{t('settings.notifications.pushTitle')}</Text>
                  <Text fontSize="sm" color="gray.600">
                    {t('settings.notifications.pushDescription')}
                  </Text>
                </VStack>
                <Switch.Root checked={notificationsEnabled} onCheckedChange={(value) => handleToggleNotifications(Boolean(value.checked))}>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </HStack>

              <HStack justify="space-between">
                <VStack align="start" gap={1}>
                  <Text fontWeight="medium">{t('settings.notifications.emailTitle')}</Text>
                  <Text fontSize="sm" color="gray.600">
                    {t('settings.notifications.emailDescription')}
                  </Text>
                </VStack>
                <Switch.Root checked={emailUpdatesEnabled} onCheckedChange={(value) => handleToggleEmailUpdates(Boolean(value.checked))}>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </HStack>
            </VStack>
          </Box>

          <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
            <HStack mb={4}>
              <FiSettings />
              <Text fontWeight="semibold">{t('settings.language.title')}</Text>
            </HStack>
            <VStack gap={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="medium">{t('settings.language.interface')}</Text>
                <NativeSelect.Root value={language} onChange={(event) => handleLanguageChange(event.target.value)} size="sm" w="200px">
                  <NativeSelect.Field>
                    <option value="ru">{t('settings.language.ru')}</option>
                    <option value="en">{t('settings.language.en')}</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </HStack>
            </VStack>
          </Box>

          <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
            <HStack mb={4}>
              <FiShield />
              <Text fontWeight="semibold">{t('settings.security.title')}</Text>
            </HStack>
            <VStack gap={4} align="stretch">
              <Button variant="outline" colorPalette="blue" size="sm" onClick={() => setChangePasswordOpen(true)}>
                {t('settings.actions.changePassword')}
              </Button>
              <Button variant="outline" colorPalette="red" size="sm" onClick={() => setDeleteAccountOpen(true)}>
                {t('settings.actions.deleteAccount')}
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Box>

      <Dialog.Root open={editProfileOpen} onOpenChange={(details) => setEditProfileOpen(details.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('settings.profile.editTitle')}</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4} align="stretch">
                <Field.Root required>
                  <Field.Label>{t('settings.profile.firstName')}</Field.Label>
                  <Input 
                    value={profileForm.firstName} 
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, firstName: event.target.value }))} 
                    placeholder={t('settings.profile.firstNamePlaceholder')}
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>{t('settings.profile.lastName')}</Field.Label>
                  <Input 
                    value={profileForm.lastName} 
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, lastName: event.target.value }))} 
                    placeholder={t('settings.profile.lastNamePlaceholder')}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t('settings.profile.position')}</Field.Label>
                  <Input 
                    value={profileForm.position} 
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, position: event.target.value }))} 
                    placeholder={t('settings.profile.positionPlaceholder')}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t('settings.profile.phone')}</Field.Label>
                  <Input 
                    value={profileForm.phone} 
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))} 
                    placeholder={t('settings.profile.phonePlaceholder')}
                  />
                </Field.Root>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={() => setEditProfileOpen(false)}>
                {t('settings.actions.cancel')}
              </Button>
              <Button colorPalette="blue" onClick={handleUpdateProfile} loading={isUpdatingProfile}>
                {t('buttons.save')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      <Dialog.Root open={changePasswordOpen} onOpenChange={(details) => {
        if (!details.open) {
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        }
        setChangePasswordOpen(details.open)
      }}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('settings.password.title')}</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4} align="stretch">
                <Field.Root required>
                  <Field.Label>{t('settings.password.current')}</Field.Label>
                  <PasswordInput
                    placeholder={t('settings.password.currentPlaceholder')}
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>{t('settings.password.new')}</Field.Label>
                  <PasswordInput
                    placeholder={t('settings.password.newPlaceholder')}
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>{t('settings.password.confirm')}</Field.Label>
                  <PasswordInput
                    placeholder={t('settings.password.confirmPlaceholder')}
                    value={passwordForm.confirmPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  />
                </Field.Root>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={() => setChangePasswordOpen(false)}>
                {t('settings.actions.cancel')}
              </Button>
              <Button colorPalette="blue" onClick={handlePasswordChange} loading={isChangingPassword}>
                {t('settings.password.submit')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      <Dialog.Root open={deleteAccountOpen} onOpenChange={(details) => {
        if (!details.open) {
          setDeleteForm({ password: '', confirmation: '' })
        }
        setDeleteAccountOpen(details.open)
      }}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('settings.delete.title')}</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4} align="stretch">
                <Text fontSize="sm" color="gray.600">
                  {t('settings.delete.description', { email: userEmail || t('settings.profile.unknown') })}
                </Text>
                <Field.Root required>
                  <Field.Label>{t('settings.delete.password')}</Field.Label>
                  <PasswordInput
                    placeholder={t('settings.delete.passwordPlaceholder')}
                    value={deleteForm.password}
                    onChange={(event) => setDeleteForm((prev) => ({ ...prev, password: event.target.value }))}
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>{t('settings.delete.confirmation', { email: userEmail || t('settings.profile.unknown') })}</Field.Label>
                  <Input
                    value={deleteForm.confirmation}
                    onChange={(event) => setDeleteForm((prev) => ({ ...prev, confirmation: event.target.value }))}
                    placeholder={userEmail || ''}
                  />
                </Field.Root>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={() => setDeleteAccountOpen(false)}>
                {t('settings.actions.cancel')}
              </Button>
              <Button colorPalette="red" onClick={handleDeleteAccount} loading={isDeletingAccount}>
                {t('settings.delete.submit')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </MainLayout>
  )
}

export { SettingsPage }
