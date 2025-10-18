import React, { useState } from 'react'
import { Box, Text, VStack, HStack, Button, Switch, NativeSelect, Field, Dialog, Input, Textarea, Checkbox } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiSettings, FiSave, FiUser, FiBell, FiShield } from 'react-icons/fi'
import { MainLayout } from '../../components/layout/MainLayout'
import { useAuth } from '../../hooks/useAuth'
import { useCreateExperienceMutation } from '../../__data__/api/experienceApi'
import { useToast } from '../../hooks/useToast'

const SettingsPage = () => {
  const { t, i18n } = useTranslation('common')
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(false)
  const [language, setLanguage] = useState(i18n.language)
  const { company } = useAuth()
  const companyId = company?.id || 'company-123'
  const [openAddExp, setOpenAddExp] = useState(false)
  const [createExperience, { isLoading: isAdding }] = useCreateExperienceMutation()
  const { success, error } = useToast()
  const [form, setForm] = useState({
    confirmed: false,
    customer: '',
    subject: '',
    volume: '',
    contact: '',
    comment: '',
  })

  const handleLanguageChange = (value: string) => {
    setLanguage(value)
    i18n.changeLanguage(value)
  }

  const handleSave = () => {
    // Здесь будет логика сохранения настроек
    console.log('Settings saved')
  }

  const handleCreateExperience = async () => {
    try {
      await createExperience({ companyId, data: form }).unwrap()
      success('Запись опыта добавлена')
      setOpenAddExp(false)
      setForm({ confirmed: false, customer: '', subject: '', volume: '', contact: '', comment: '' })
    } catch (e) {
      error('Ошибка сохранения')
    }
  }

  return (
    <MainLayout>
      <Box>
        <HStack mb={6} justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">
            {t('nav.settings')}
          </Text>
          <Button colorPalette="blue" size="sm" onClick={handleSave}>
            <FiSave />
            <Text ml={2}>Сохранить</Text>
          </Button>
        </HStack>

        <VStack gap={6} align="stretch">
          {/* Опыт работы (CRUD) */}
          <Box
            bg="white"
            p={6}
            borderRadius="lg"
            shadow="sm"
            borderWidth="1px"
            borderColor="gray.200"
          >
            <HStack mb={4} justify="space-between">
              <Text fontWeight="semibold">Опыт работы</Text>
              <Button colorPalette="green" size="sm" onClick={() => setOpenAddExp(true)}>
                Добавить запись
              </Button>
            </HStack>
            <Text fontSize="sm" color="gray.600">
              Добавляйте подтвержденные кейсы: заказчик, предмет закупки, объем и контакты.
            </Text>
          </Box>
          {/* Профиль */}
          <Box
            bg="white"
            p={6}
            borderRadius="lg"
            shadow="sm"
            borderWidth="1px"
            borderColor="gray.200"
          >
            <HStack mb={4}>
              <FiUser />
              <Text fontWeight="semibold">Профиль</Text>
            </HStack>
            <VStack gap={4} align="stretch">
              <HStack justify="space-between">
                <Text>Имя пользователя</Text>
                <Text fontWeight="medium">Иван Иванов</Text>
              </HStack>
              <HStack justify="space-between">
                <Text>Email</Text>
                <Text fontWeight="medium">ivan@company.com</Text>
              </HStack>
              <HStack justify="space-between">
                <Text>Компания</Text>
                <Text fontWeight="medium">ООО "ТехноПартнер"</Text>
              </HStack>
            </VStack>
          </Box>

          {/* Уведомления */}
          <Box
            bg="white"
            p={6}
            borderRadius="lg"
            shadow="sm"
            borderWidth="1px"
            borderColor="gray.200"
          >
            <HStack mb={4}>
              <FiBell />
              <Text fontWeight="semibold">Уведомления</Text>
            </HStack>
            <VStack gap={4} align="stretch">
              <HStack justify="space-between">
                <VStack align="start" gap={1}>
                  <Text fontWeight="medium">Push-уведомления</Text>
                  <Text fontSize="sm" color="gray.600">
                    Получать уведомления в браузере
                  </Text>
                </VStack>
                <Switch.Root
                  checked={notifications}
                  onCheckedChange={(e) => setNotifications(e.checked)}
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </HStack>
              
              <HStack justify="space-between">
                <VStack align="start" gap={1}>
                  <Text fontWeight="medium">Email-уведомления</Text>
                  <Text fontSize="sm" color="gray.600">
                    Получать уведомления на email
                  </Text>
                </VStack>
                <Switch.Root
                  checked={emailUpdates}
                  onCheckedChange={(e) => setEmailUpdates(e.checked)}
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </HStack>
            </VStack>
          </Box>

          {/* Язык */}
          <Box
            bg="white"
            p={6}
            borderRadius="lg"
            shadow="sm"
            borderWidth="1px"
            borderColor="gray.200"
          >
            <HStack mb={4}>
              <FiSettings />
              <Text fontWeight="semibold">Язык и регион</Text>
            </HStack>
            <VStack gap={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="medium">Язык интерфейса</Text>
                <NativeSelect.Root
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  size="sm"
                  w="200px"
                >
                  <NativeSelect.Field>
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </HStack>
            </VStack>
          </Box>

          {/* Безопасность */}
          <Box
            bg="white"
            p={6}
            borderRadius="lg"
            shadow="sm"
            borderWidth="1px"
            borderColor="gray.200"
          >
            <HStack mb={4}>
              <FiShield />
              <Text fontWeight="semibold">Безопасность</Text>
            </HStack>
            <VStack gap={4} align="stretch">
              <Button variant="outline" colorPalette="blue" size="sm">
                Изменить пароль
              </Button>
              <Button variant="outline" colorPalette="red" size="sm">
                Удалить аккаунт
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Box>

      {/* Dialog добавления опыта */}
      <Dialog.Root open={openAddExp} onOpenChange={(e) => setOpenAddExp(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Новая запись опыта</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4} align="stretch">
                <Field.Root>
                  <Checkbox.Root checked={form.confirmed} onCheckedChange={(e) => setForm({ ...form, confirmed: e.checked })}>
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>Подтверждено</Checkbox.Label>
                  </Checkbox.Root>
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Заказчик</Field.Label>
                  <Input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
                </Field.Root>
                <Field.Root required>
                  <Field.Label>Предмет закупки</Field.Label>
                  <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Объем</Field.Label>
                  <Input value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Контакты</Field.Label>
                  <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Комментарий</Field.Label>
                  <Textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={4} />
                </Field.Root>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" onClick={() => setOpenAddExp(false)}>
                Отмена
              </Button>
              <Button colorPalette="green" onClick={handleCreateExperience} loading={isAdding}>
                Сохранить
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </MainLayout>
  )
}

export { SettingsPage }
