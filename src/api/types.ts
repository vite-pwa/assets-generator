import type { AppleDeviceSize, AppleSplashScreenName } from '../types.ts'

export interface HtmlLink {
  rel: string
  media: string
  href: string
}

export type HtmlLinkType = 'string' | 'link'
export type HtmlLinkReturnType<T> =
    T extends 'string' ? string :
      T extends 'link' ? HtmlLink :
        never

export interface HtmlLinkOptions {
  size: AppleDeviceSize
  landscape: boolean
  addMediaScreen: boolean
  xhtml?: boolean
  name?: AppleSplashScreenName
  basePath?: string
  dark?: boolean
}
