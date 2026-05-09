import { z } from 'zod'

export const COINS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC', 'DOT', 'AVAX', 'LINK', 'UNI'] as const
export const INVESTOR_TYPES = ['HODLer', 'Day Trader', 'NFT Collector'] as const
export const CONTENT_TYPES = ['Market News', 'Charts', 'Social', 'Fun'] as const

export const quizSchema = z.object({
  coins: z.array(z.enum(COINS)).min(1, 'Select at least one coin'),
  investor_types: z
    .array(z.enum(INVESTOR_TYPES))
    .min(1, 'Select at least one investor type')
    .max(2, 'Maximum 2 investor types'),
  content_types: z.array(z.enum(CONTENT_TYPES)).min(1, 'Select at least one content type'),
})

export type QuizFormValues = z.infer<typeof quizSchema>
