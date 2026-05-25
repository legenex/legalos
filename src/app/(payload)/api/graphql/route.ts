/* eslint-disable @typescript-eslint/no-explicit-any */
import config from '@payload-config'
import { GRAPHQL_POST, REST_OPTIONS } from '@payloadcms/next/routes'

export const POST = GRAPHQL_POST(config) as any
export const OPTIONS = REST_OPTIONS(config) as any
