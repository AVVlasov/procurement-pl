import React, { useMemo, useState } from 'react'
import { 
  Box, HStack, VStack, Heading, Table, Button, Text, NativeSelect, Input, 
  Textarea, Dialog, Field
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { 
  useGetCompanyExperienceQuery, 
  useCreateCompanyExperienceMutation,
  useUpdateCompanyExperienceMutation,
  useDeleteCompanyExperienceMutation
} from '../../../__data__/api/companiesApi'

type SortBy = 'date' | 'customer'

interface ExperienceForm {
  customer: string
  subject: string
  volume: string
  contact: string
  comment: string
  confirmed: boolean
}

export const ExperienceTab = ({ companyId: propCompanyId, isOwnCompany }: { companyId?: string; isOwnCompany?: boolean }) => {
  const { t } = useTranslation('company')
  const { company } = useAuth()
  const { success, error } = useToast()
  const finalCompanyId = propCompanyId || company?.id || 'skip'
  const isEditingOwn = isOwnCompany !== false

  const { data: items = [], isLoading, refetch } = useGetCompanyExperienceQuery(finalCompanyId, { skip: !propCompanyId && !company?.id })
  const [createExperience, { isLoading: isCreating }] = useCreateCompanyExperienceMutation()
  const [updateExperience, { isLoading: isUpdating }] = useUpdateCompanyExperienceMutation()
  const [deleteExperience, { isLoading: isDeleting }] = useDeleteCompanyExperienceMutation()

  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ExperienceForm>({
    customer: '',
    subject: '',
    volume: '',
    contact: '',
    comment: '',
    confirmed: false
  })
  const pageSize = 10

  const sorted = useMemo(() => {
    const arr = [...items]
    arr.sort((a: any, b: any) => {
      let cmp = 0
      if (sortBy === 'customer') cmp = String(a.customer).localeCompare(String(b.customer))
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return arr
  }, [items, sortBy, sortOrder])

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize)

  const handleAddNew = () => {
    setFormData({
      customer: '',
      subject: '',
      volume: '',
      contact: '',
      comment: '',
      confirmed: false
    })
    setEditingId(null)
    setIsFormOpen(true)
  }

  const handleEdit = (item: any) => {
    setFormData({
      customer: item.customer,
      subject: item.subject,
      volume: item.volume,
      contact: item.contact,
      comment: item.comment,
      confirmed: item.confirmed || false
    })
    setEditingId(item._id || item.id)
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    if (!formData.customer.trim() || !formData.subject.trim()) {
      error(t('common:labels.fill_required_fields') || 'Заполните обязательные поля')
      return
    }

    try {
      if (editingId) {
        await updateExperience({
          companyId: finalCompanyId,
          experienceId: editingId,
          data: formData
        }).unwrap()
        success(t('common:labels.success') || 'Опыт обновлен')
      } else {
        await createExperience({
          companyId: finalCompanyId,
          data: formData
        }).unwrap()
        success(t('common:labels.success') || 'Опыт добавлен')
      }
      setIsFormOpen(false)
      refetch()
    } catch (err) {
      error(t('common:errors.server_error') || 'Ошибка при сохранении')
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот опыт?')) {
      try {
        await deleteExperience({
          companyId: finalCompanyId,
          experienceId: id
        }).unwrap()
        success(t('common:labels.success') || 'Опыт удален')
        refetch()
      } catch (err) {
        error(t('common:errors.server_error') || 'Ошибка при удалении')
      }
    }
  }

  return (
    <VStack gap={4} align="stretch">
      <HStack justify="space-between">
        <Heading size="lg">{t('experience.title', 'Опыт работы')}</Heading>
        <HStack gap={2}>
          {isEditingOwn && (
            <Button colorPalette="brand" onClick={handleAddNew} size="sm">
              <FiPlus />
              {t('common:buttons.add')}
            </Button>
          )}
          <NativeSelect.Root value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} size="sm">
            <NativeSelect.Field>
              <option value="date">{t('experience.sort.date', 'По дате')}</option>
              <option value="customer">{t('experience.sort.customer', 'По заказчику')}</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <NativeSelect.Root value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} size="sm">
            <NativeSelect.Field>
              <option value="desc">{t('search:sort.desc')}</option>
              <option value="asc">{t('search:sort.asc')}</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </HStack>
      </HStack>

      <Table.Root variant="line">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{t('experience.confirmed', 'Подтверждено')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('experience.customer', 'Заказчик')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('experience.subject', 'Предмет закупки')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('experience.volume', 'Объем')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('experience.contact', 'Контакты')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('experience.comment', 'Комментарий')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('experience.date', 'Дата')}</Table.ColumnHeader>
            {isEditingOwn && <Table.ColumnHeader>{t('common:labels.actions')}</Table.ColumnHeader>}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading && (
            <Table.Row>
              <Table.Cell colSpan={isEditingOwn ? 8 : 7}>{t('common:labels.loading')}</Table.Cell>
            </Table.Row>
          )}
          {!isLoading && pageItems.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={isEditingOwn ? 8 : 7}>{t('experience.empty', 'Нет записей опыта')}</Table.Cell>
            </Table.Row>
          )}
          {!isLoading && pageItems.map((e: any) => (
            <Table.Row key={e.id || e._id}>
              <Table.Cell>
                <Box as="span" color={e.confirmed ? 'green.600' : 'gray.500'} fontWeight="medium">
                  {e.confirmed ? t('experience.yes', 'Да') : t('experience.no', 'Нет')}
                </Box>
              </Table.Cell>
              <Table.Cell>{e.customer}</Table.Cell>
              <Table.Cell>{e.subject}</Table.Cell>
              <Table.Cell>{e.volume}</Table.Cell>
              <Table.Cell>{e.contact}</Table.Cell>
              <Table.Cell>{e.comment}</Table.Cell>
              <Table.Cell>
                {new Date(e.createdAt).toLocaleDateString('ru-RU')}
              </Table.Cell>
              {isEditingOwn && (
                <Table.Cell>
                  <HStack gap={2}>
                    <Button 
                      size="xs" 
                      variant="outline" 
                      colorPalette="blue"
                      onClick={() => handleEdit(e)}
                    >
                      <FiEdit2 />
                    </Button>
                    <Button 
                      size="xs" 
                      variant="outline" 
                      colorPalette="red"
                      onClick={() => handleDelete(e._id || e.id)}
                    >
                      <FiTrash2 />
                    </Button>
                  </HStack>
                </Table.Cell>
              )}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <HStack justify="space-between">
        <Text fontSize="sm" color="gray.600">
          {t('common:labels.all')}: {total}
        </Text>
        <HStack>
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            {t('common:buttons.back')}
          </Button>
          <Text fontSize="sm">
            {page} / {totalPages}
          </Text>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            {t('common:buttons.next')}
          </Button>
        </HStack>
      </HStack>

      {/* Add/Edit Dialog */}
      <Dialog.Root open={isFormOpen} onOpenChange={(details) => setIsFormOpen(details.open)}>
        <Dialog.Backdrop />
        {/* @ts-ignore */}
        <Dialog.Positioner>
          {/* @ts-ignore */}
          <Dialog.Content maxW="600px">
            {/* @ts-ignore */}
            <Dialog.Header>
              {/* @ts-ignore */}
              <Dialog.Title>
                {editingId ? t('experience.edit') : t('experience.add')}
              </Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4} align="stretch">
                {/* @ts-ignore */}
                <Field.Root required>
                  {/* @ts-ignore */}
                  <Field.Label>{t('experience.customer')}</Field.Label>
                  <Input
                    placeholder={t('experience.customer')}
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  />
                </Field.Root>

                {/* @ts-ignore */}
                <Field.Root required>
                  {/* @ts-ignore */}
                  <Field.Label>{t('experience.subject')}</Field.Label>
                  <Input
                    placeholder={t('experience.subject')}
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </Field.Root>

                {/* @ts-ignore */}
                <Field.Root>
                  {/* @ts-ignore */}
                  <Field.Label>{t('experience.volume')}</Field.Label>
                  <Input
                    placeholder={t('experience.volume')}
                    value={formData.volume}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                  />
                </Field.Root>

                {/* @ts-ignore */}
                <Field.Root>
                  {/* @ts-ignore */}
                  <Field.Label>{t('experience.contact')}</Field.Label>
                  <Input
                    placeholder={t('experience.contact')}
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  />
                </Field.Root>

                {/* @ts-ignore */}
                <Field.Root>
                  {/* @ts-ignore */}
                  <Field.Label>{t('experience.comment')}</Field.Label>
                  <Textarea
                    placeholder={t('experience.comment')}
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    minH="100px"
                    resize="none"
                  />
                </Field.Root>

                <HStack alignItems="center" gap={2}>
                  <input
                    type="checkbox"
                    id="confirmed"
                    checked={formData.confirmed}
                    onChange={(e) => setFormData({ ...formData, confirmed: e.target.checked })}
                    style={{ width: '1.25rem', height: '1.25rem' }}
                  />
                  <label htmlFor="confirmed">{t('experience.confirmed')}</label>
                </HStack>
              </VStack>
            </Dialog.Body>
            {/* @ts-ignore */}
            <Dialog.Footer>
              <HStack gap={3} justify="flex-end">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  {t('common:buttons.cancel')}
                </Button>
                <Button
                  colorPalette="brand"
                  onClick={handleSave}
                  loading={isCreating || isUpdating}
                >
                  {t('common:buttons.save')}
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </VStack>
  )
}


