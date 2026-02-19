import configPromise from '@payload-config'
import { generatePageMetadata, RootPage } from '@payloadcms/next/views'
import type { Metadata } from 'next'
import { importMap } from '../../importMap'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({
    config: configPromise,
    params,
    searchParams,
  })

const Page = ({ params, searchParams }: Args) =>
  RootPage({
    config: configPromise,
    importMap,
    params,
    searchParams,
  })

export default Page
