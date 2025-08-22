import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

export function createZodResolver<T extends z.ZodTypeAny>(schema: T) {
  return zodResolver(schema)
}
