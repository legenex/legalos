/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from 'next'
import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'

type Args = {
  params: Promise<{ segments?: string[] }>
  searchParams: Promise<Record<string, string | string[]>>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params: params as any, searchParams: searchParams as any })

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, params: params as any, searchParams: searchParams as any, importMap })

export default Page
