import React, { useMemo, useState } from 'react'
import { Box, HStack, VStack, Heading, Table, Button, Text, NativeSelect } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../hooks/useAuth'
import { useGetCompanyExperienceQuery } from '../../../__data__/api/companiesApi'

type SortBy = 'date' | 'customer'

export const ExperienceTab = () => {
  const { t } = useTranslation('company')
  const { company } = useAuth()
  const companyId = company?.id || 'company-123'

  const { data: items = [], isLoading } = useGetCompanyExperienceQuery(companyId)

  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
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

  return (
    <VStack gap={4} align="stretch">
      <HStack justify="space-between">
        <Heading size="lg">{t('experience.title', 'Опыт работы')}</Heading>
        <HStack gap={2}>
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
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading && (
            <Table.Row>
              <Table.Cell colSpan={7}>{t('common:labels.loading')}</Table.Cell>
            </Table.Row>
          )}
          {!isLoading && pageItems.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={7}>{t('experience.empty', 'Нет записей опыта')}</Table.Cell>
            </Table.Row>
          )}
          {!isLoading && pageItems.map((e: any) => (
            <Table.Row key={e.id}>
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
    </VStack>
  )
}


