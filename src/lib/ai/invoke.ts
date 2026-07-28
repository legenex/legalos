import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { hasBannedSignals } from './banned-vocab'

let client: Anthropic | null = null

const getClient = (): Anthropic => {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    client = new Anthropic({ apiKey })
  }
  return client
}

/**
 * An image to send alongside the prompt. Base64 payload only — a URL would make
 * the model's provider fetch it, which we cannot audit or scope.
 */
export type InvokeLLMImage = {
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  /** Raw base64, no `data:` prefix. */
  dataBase64: string
}

export type InvokeLLMArgs<TSchema extends z.ZodTypeAny> = {
  system: string
  user: string
  schema: TSchema
  schemaName: string
  model?: 'claude-opus-4-7' | 'claude-sonnet-4-6' | 'claude-haiku-4-5-20251001'
  maxTokens?: number
  enforceNoBannedVocab?: boolean
  maxRetries?: number
  /**
   * Optional images for vision prompts (e.g. deriving a palette from a
   * screenshot). Sent as content blocks before the text, which is the ordering
   * Anthropic recommends when the text refers to the images.
   */
  images?: InvokeLLMImage[]
}

export const invokeLLM = async <TSchema extends z.ZodTypeAny>(
  args: InvokeLLMArgs<TSchema>,
): Promise<z.infer<TSchema>> => {
  const {
    system,
    user,
    schema,
    schemaName,
    model = 'claude-sonnet-4-6',
    maxTokens = 4096,
    enforceNoBannedVocab = false,
    maxRetries = 2,
    images,
  } = args
  const client = getClient()

  const imageBlocks = (images ?? []).map((img) => ({
    type: 'image' as const,
    source: { type: 'base64' as const, media_type: img.mediaType, data: img.dataBase64 },
  }))

  const toolSchema = zodToJsonSchema(schema)
  let attempt = 0
  let lastError: string | null = null

  while (attempt <= maxRetries) {
    const additionalUser =
      attempt === 0
        ? user
        : `${user}\n\n[retry ${attempt}] Previous output failed validation: ${lastError}. Return only valid JSON conforming to the tool schema, and remove any banned vocabulary.`

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: [
        {
          role: 'user',
          content: imageBlocks.length
            ? [...imageBlocks, { type: 'text' as const, text: additionalUser }]
            : additionalUser,
        },
      ],
      tools: [
        {
          name: schemaName,
          description: `Return structured output conforming to the ${schemaName} schema.`,
          input_schema: toolSchema,
        },
      ],
      tool_choice: { type: 'tool', name: schemaName },
    })

    const toolUse = response.content.find((c) => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      lastError = 'no tool_use block in response'
      attempt += 1
      continue
    }

    const parsed = schema.safeParse(toolUse.input)
    if (!parsed.success) {
      lastError = parsed.error.message
      attempt += 1
      continue
    }

    if (enforceNoBannedVocab) {
      const flat = JSON.stringify(parsed.data)
      const check = hasBannedSignals(flat)
      if (!check.ok) {
        lastError = check.reasons.join('; ')
        attempt += 1
        continue
      }
    }

    return parsed.data
  }

  throw new Error(`invokeLLM failed after ${maxRetries + 1} attempts: ${lastError}`)
}

// Minimal Zod -> JSON Schema converter for Anthropic tool_use input_schema.
// Handles the subset we use: object, string, number, boolean, array, enum,
// nullable, optional, default, effects (preprocess/refine), record, and both
// plain and discriminated unions. Anything unrecognised falls through to {}.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const zodToJsonSchema = (schema: z.ZodTypeAny): any => {
  const def = schema._def
  switch (def.typeName) {
    case 'ZodString': {
      const out: Record<string, unknown> = { type: 'string' }
      if (def.checks) {
        for (const c of def.checks) {
          if (c.kind === 'min') out.minLength = c.value
          if (c.kind === 'max') out.maxLength = c.value
        }
      }
      return out
    }
    case 'ZodNumber':
      return { type: 'number' }
    case 'ZodBoolean':
      return { type: 'boolean' }
    case 'ZodLiteral':
      return { const: def.value }
    case 'ZodEnum':
      return { type: 'string', enum: def.values }
    case 'ZodArray':
      return { type: 'array', items: zodToJsonSchema(def.type) }
    case 'ZodOptional':
      return zodToJsonSchema(def.innerType)
    case 'ZodDefault':
      // Unwrap to the inner type; the default is applied by Zod at parse time.
      return zodToJsonSchema(def.innerType)
    case 'ZodEffects':
      // z.preprocess / .refine / .transform — describe the underlying schema.
      return zodToJsonSchema(def.schema)
    case 'ZodNullable':
      return { anyOf: [zodToJsonSchema(def.innerType), { type: 'null' }] }
    case 'ZodRecord':
      return { type: 'object', additionalProperties: def.valueType ? zodToJsonSchema(def.valueType) : true }
    case 'ZodAny':
    case 'ZodUnknown':
      return {}
    case 'ZodObject': {
      const shape = def.shape() as Record<string, z.ZodTypeAny>
      const required: string[] = []
      const properties: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = zodToJsonSchema(value)
        if (!(value as { isOptional?: () => boolean }).isOptional?.()) required.push(key)
      }
      return { type: 'object', properties, required, additionalProperties: false }
    }
    case 'ZodUnion':
      return { anyOf: def.options.map((o: z.ZodTypeAny) => zodToJsonSchema(o)) }
    case 'ZodDiscriminatedUnion': {
      // _def.options is an array in some Zod versions and a Map in others.
      const opts = Array.isArray(def.options) ? def.options : Array.from(def.options.values())
      return { anyOf: (opts as z.ZodTypeAny[]).map((o) => zodToJsonSchema(o)) }
    }
    default:
      return {}
  }
}
