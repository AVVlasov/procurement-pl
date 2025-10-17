import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { URLs } from '../urls'

export interface MessageThread {
  id: string
  participants: string[]
  lastMessage: string
  lastMessageAt: string
  unreadCount?: number
}

export interface MessageItem {
  id: string
  senderCompanyId: string
  text: string
  timestamp: string
}

export const messagesApi = createApi({
  reducerPath: 'messagesApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${URLs.apiUrl}` }),
  tagTypes: ['Messages'],
  endpoints: (builder) => ({
    getThreads: builder.query<MessageThread[], void>({
      query: () => '/messages/threads',
      providesTags: ['Messages'],
      pollingInterval: 5000,
    }),
    getThreadMessages: builder.query<MessageItem[], string>({
      query: (threadId) => `/messages/${threadId}`,
      providesTags: (result, error, threadId) => [{ type: 'Messages', id: threadId }],
    }),
    sendMessage: builder.mutation<MessageItem, { threadId: string; senderCompanyId?: string; text: string }>({
      query: ({ threadId, senderCompanyId, text }) => ({
        url: `/messages/${threadId}`,
        method: 'POST',
        body: { senderCompanyId, text },
      }),
      invalidatesTags: (result, error, { threadId }) => [{ type: 'Messages', id: threadId }],
    }),
  }),
})

export const { useGetThreadsQuery, useGetThreadMessagesQuery, useSendMessageMutation } = messagesApi


