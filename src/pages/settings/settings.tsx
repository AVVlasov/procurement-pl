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
  Textarea,
  Checkbox,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { FiSettings, FiSave, FiUser, FiBell, FiShield } from 'react-icons/fi'
import { MainLayout } from '../../components/layout/MainLayout'
import { useAuth } from '../../hooks/useAuth'
import { useCreateExperienceMutation } from '../../__data__/api/experienceApi'
import { useChangePasswordMutation, useDeleteAccountMutation } from '../../__data__/api/authApi'
import { useToast } from '../../hooks/useToast'
import { PasswordInput } from '../../components/ui/password-input'

const SettingsPage = () => {
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()
  const { user, company, logout } = useAuth()
  const userEmail = user?.email || ''
  const companyId = company?.id
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailUpdatesEnabled, setEmailUpdatesEnabled] = useState(false)
  const [language, setLanguage] = useState(i18n.language)
  const [createExperienceOpen, setCreateExperienceOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [experienceForm, setExperienceForm] = useState({
    confirmed: false,
    customer: '',
    subject: '',
    volume: '',
    contact: '',
    comment: '',
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
  const [createExperience, { isLoading: isCreatingExperience }] = useCreateExperienceMutation()
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
  }

  const handleToggleEmailUpdates = (checked: boolean) => {
    setEmailUpdatesEnabled(checked)
  }

  const handleResetExperienceForm = () => {
    setExperienceForm({ confirmed: false, customer: '', subject: '', volume: '', contact: '', comment: '' })
  }

  const handleSaveSettings = () => {
    showSuccess(t('settings.messages.saved'))
  }

  const handleCreateExperience = async () => {
    if (!companyId) {
      showError(t('settings.messages.noCompany'))
      return
    }

    try {
      await createExperience({ companyId, data: experienceForm }).unwrap()
      showSuccess(t('settings.experience.success'))
      setCreateExperienceOpen(false)
      handleResetExperienceForm()
    } catch (err) {
      console.error('[SettingsPage] createExperience error:', err)
      showError(t('settings.experience.error'))
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

  const experienceTitle = company?.name || t('settings.experience.defaultCompanyTitle')

  return (
    <MainLayout>
      <Box>
        <HStack mb={6} justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">
            {t('nav.settings')}
          </Text>
          <Button colorPalette="blue" size="sm" onClick={handleSaveSettings}>
            <FiSave />
            <Text ml={2}>{t('settings.actions.save')}</Text>
          </Button>
        </HStack>

        <VStack gap={6} align="stretch">
          <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
            <HStack mb={4} justify="space-between">
              <Text fontWeight="semibold">{t('settings.experience.title')}</Text>
              <Button colorPalette="green" size="sm" onClick={() => setCreateExperienceOpen(true)}>
                {t('settings.experience.add')}
              </Button>
            </HStack>
            <Text fontSize="sm" color="gray.600">
              {t('settings.experience.description', { company: experienceTitle })}
            </Text>
          </Box>

          <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
            <HStack mb={4}>
              <FiUser />
              <Text fontWeight="semibold">{t('settings.profile.title')}</Text>
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

      <Dialog.Root open={createExperienceOpen} onOpenChange={(details) => {
        if (!details.open) {
          handleResetExperienceForm()
        }
        setCreateExperienceOpen(details.open)
      }}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('settings.experience.modal.title')}</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4} align="stretch">
                <Field.Root>
                  <Checkbox.Root
                    checked={experienceForm.confirmed}
                    onCheckedChange={(details) => setExperienceForm((prev) => ({ ...prev, confirmed: Boolean(details.checked) }))}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>{t('settings.experience.modal.confirmed')}</Checkbox.Label>
                  </Checkbox.Root>
                </Field.Root>
                <Field.Root required>
                  <Field.Label>{t('settings.experience.modal.customer')}</Field.Label>
                  <Input value={experienceForm.customer} onChange={(event) => setExperienceForm((prev) => ({ ...prev, customer: event.target.value }))} />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>{t('settings.experience.modal.subject')}</Field.Label>
                  <Input value={experienceForm.subject} onChange={(event) => setExperienceForm((prev) => ({ ...prev, subject: event.target.value }))} />
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t('settings.experience.modal.volume')}</Field.Label>
                  <Input value={experienceForm.volume} onChange={(event) => setExperienceForm((prev) => ({ ...prev, volume: event.target.value }))} />
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t('settings.experience.modal.contact')}</Field.Label>
                  <Input value={experienceForm.contact} onChange={(event) => setExperienceForm((prev) => ({ ...prev, contact: event.target.value }))} />
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t('settings.experience.modal.comment')}</Field.Label>
                  <Textarea value={experienceForm.comment} onChange={(event) => setExperienceForm((prev) => ({ ...prev, comment: event.target.value }))} rows={4} />
                </Field.Root>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={() => setCreateExperienceOpen(false)}>
                {t('settings.actions.cancel')}
              </Button>
              <Button colorPalette="green" onClick={handleCreateExperience} loading={isCreatingExperience}>
                {t('settings.actions.save')}
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
