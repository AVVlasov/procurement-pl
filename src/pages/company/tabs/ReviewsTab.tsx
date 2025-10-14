import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Textarea,
  Avatar,
  Badge,
  Flex,
  useDisclosure,
  Dialog,
  Field,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiStar, FiMessageSquare } from 'react-icons/fi'
import { useToast } from '../../../hooks/useToast'

interface Review {
  id: string
  author: {
    name: string
    company: string
    avatar?: string
  }
  rating: number
  comment: string
  date: string
  verified: boolean
}

// Mock data
const mockReviews: Review[] = [
  {
    id: '1',
    author: {
      name: 'Иван Петров',
      company: 'ООО "Партнер"',
      avatar: '',
    },
    rating: 5,
    comment: 'Отличная компания! Все сроки соблюдены, качество на высоте.',
    date: '2025-01-15',
    verified: true,
  },
  {
    id: '2',
    author: {
      name: 'Мария Сидорова',
      company: 'ЗАО "Инвест"',
      avatar: '',
    },
    rating: 4,
    comment: 'Хорошее сотрудничество, рекомендую.',
    date: '2024-12-20',
    verified: true,
  },
]

export const ReviewsTab = () => {
  const { t } = useTranslation('company')
  const toast = useToast()
  const { open, onOpen, onClose } = useDisclosure()
  const [reviews] = useState<Review[]>(mockReviews)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0'

  const handleSubmitReview = () => {
    // TODO: Implement review submission
    toast.success(t('common:labels.success'), 'Отзыв успешно отправлен')
    setRating(0)
    setComment('')
    onClose()
  }

  const RatingStars = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
    <HStack gap={1}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Box
          key={star}
          as={FiStar}
          boxSize={6}
          color={star <= value ? 'yellow.400' : 'gray.300'}
          fill={star <= value ? 'yellow.400' : 'none'}
          cursor={onChange ? 'pointer' : 'default'}
          onClick={() => onChange?.(star)}
        />
      ))}
    </HStack>
  )

  const ReviewCard = ({ review }: { review: Review }) => (
    <Box
      p={6}
      borderWidth="1px"
      borderRadius="lg"
      _hover={{ shadow: 'md' }}
      transition="all 0.2s"
    >
      <VStack align="stretch" gap={4}>
        <HStack justify="space-between">
          <HStack gap={3}>
            <Avatar.Root size="md" name={review.author.name} src={review.author.avatar}>
              <Avatar.Fallback>{review.author.name[0]}</Avatar.Fallback>
            </Avatar.Root>
            <VStack align="start" gap={0}>
              <HStack>
                <Text fontWeight="bold">{review.author.name}</Text>
                {review.verified && (
                  <Badge colorPalette="green" fontSize="xs">
                    Верифицирован
                  </Badge>
                )}
              </HStack>
              <Text fontSize="sm" color="gray.500">
                {review.author.company}
              </Text>
            </VStack>
          </HStack>
          <VStack align="end" gap={1}>
            <RatingStars value={review.rating} />
            <Text fontSize="xs" color="gray.500">
              {new Date(review.date).toLocaleDateString('ru-RU')}
            </Text>
          </VStack>
        </HStack>
        <Text>{review.comment}</Text>
      </VStack>
    </Box>
  )

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between">
        <Heading size="lg">{t('reviews.title')}</Heading>
        <Button
          colorPalette="brand"
          onClick={onOpen}
        >
          <FiMessageSquare />
          {t('reviews.write_review')}
        </Button>
      </HStack>

      {/* Rating Summary */}
      <Flex
        p={6}
        borderWidth="1px"
        borderRadius="lg"
        bg="brand.50"
        align="center"
        justify="space-between"
      >
        <VStack align="start" gap={2}>
          <Text fontSize="sm" fontWeight="medium" color="gray.600">
            {t('reviews.rating')}
          </Text>
          <HStack>
            <Text fontSize="4xl" fontWeight="bold">
              {averageRating}
            </Text>
            <RatingStars value={Math.round(parseFloat(averageRating))} />
          </HStack>
          <Text fontSize="sm" color="gray.500">
            На основе {reviews.length} отзывов
          </Text>
        </VStack>
      </Flex>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <VStack gap={4} align="stretch">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </VStack>
      ) : (
        <Flex
          p={12}
          borderWidth="1px"
          borderRadius="lg"
          justify="center"
          direction="column"
          align="center"
          color="gray.500"
        >
          <Box as={FiMessageSquare} boxSize={12} mb={4} />
          <Text fontSize="lg">{t('reviews.no_reviews')}</Text>
        </Flex>
      )}

      {/* Write Review Dialog */}
      <Dialog.Root open={open} onOpenChange={(e) => e.open ? onOpen() : onClose()} size="lg">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('reviews.write_review')}</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={6}>
                <Field.Root required>
                  <Field.Label>{t('reviews.your_rating')}</Field.Label>
                  <RatingStars value={rating} onChange={setRating} />
                </Field.Root>

                <Field.Root required>
                  <Field.Label>{t('reviews.your_review')}</Field.Label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={6}
                    placeholder="Поделитесь своим опытом сотрудничества..."
                  />
                </Field.Root>

                <Box
                  p={4}
                  bg="blue.50"
                  borderRadius="md"
                  borderLeftWidth="4px"
                  borderLeftColor="blue.500"
                  w="full"
                >
                  <Text fontSize="sm" color="blue.800">
                    {t('reviews.verified_partners_only')}
                  </Text>
                </Box>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" mr={3} onClick={onClose}>
                {t('common:buttons.cancel')}
              </Button>
              <Button
                colorPalette="brand"
                onClick={handleSubmitReview}
                disabled={rating === 0 || comment.trim() === ''}
              >
                {t('reviews.submit')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </VStack>
  )
}

