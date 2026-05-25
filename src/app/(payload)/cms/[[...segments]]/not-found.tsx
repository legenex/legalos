/* eslint-disable @typescript-eslint/no-explicit-any */
import config from '@payload-config'
import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views'
import type { Metadata } from 'next'
import { importMap } from '../importMap'

type Args = {
  params: Promise<{ segments?: string[] }>
  searchParams: Promise<Record<string, string | string[]>>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params: params as any, searchParams: searchParams as any })

const NotFound = ({ params, searchParams }: Args) =>
  NotFoundPage({ config, params: params as any, searchParams: searchParams as any, importMap })

export default NotFound
