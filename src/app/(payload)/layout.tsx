/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ServerFunctionClient } from 'payload'
import config from '@payload-config'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './cms/importMap'
// Pre-built Payload UI stylesheet. Imported in the layout (not the page) so Next.js
// emits <link rel="stylesheet"> rather than only <link rel="preload"> for it — the
// page-level CSS chunk under (payload)/cms/[[...segments]] otherwise gets preload-only,
// which leaves the admin unstyled in the browser.
import '@payloadcms/ui/css'
import './cms/global.scss'

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  } as any)
}

const Layout = ({ children }: { children: React.ReactNode }) =>
  RootLayout({ config, importMap, serverFunction, children } as any)

export default Layout
