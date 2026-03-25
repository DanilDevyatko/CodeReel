import type { HighlighterCore } from 'shiki/core'
import type { ThemedToken } from '@shikijs/types'
import { editorThemes } from './themes'
import type { ThemeId } from '../types/scene'

const tokenCache = new Map<string, Promise<ThemedToken[][]>>()
let highlighterPromise: Promise<HighlighterCore> | null = null

function resolveLanguage(language: string | undefined) {
  const normalized = language?.trim().toLowerCase()

  switch (normalized) {
    case 'js':
    case 'javascript':
      return 'javascript'
    case 'ts':
    case 'typescript':
      return 'typescript'
    case 'tsx':
      return 'tsx'
    case 'jsx':
      return 'jsx'
    case 'html':
      return 'html'
    case 'css':
      return 'css'
    case 'json':
      return 'json'
    case 'shell':
    case 'sh':
    case 'bash':
      return 'bash'
    default:
      return 'typescript'
  }
}

export async function warmHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = Promise.all([
      import('shiki/core'),
      import('shiki/engine/javascript'),
      import('@shikijs/langs/bash'),
      import('@shikijs/langs/css'),
      import('@shikijs/langs/html'),
      import('@shikijs/langs/javascript'),
      import('@shikijs/langs/json'),
      import('@shikijs/langs/jsx'),
      import('@shikijs/langs/tsx'),
      import('@shikijs/langs/typescript'),
      import('@shikijs/themes/catppuccin-mocha'),
      import('@shikijs/themes/dark-plus'),
      import('@shikijs/themes/nord'),
    ]).then(
      ([
        { createHighlighterCore },
        { createJavaScriptRegexEngine },
        { default: bash },
        { default: css },
        { default: html },
        { default: javascript },
        { default: json },
        { default: jsx },
        { default: tsx },
        { default: typescript },
        { default: catppuccinMocha },
        { default: darkPlus },
        { default: nord },
      ]) =>
        createHighlighterCore({
          langs: [...javascript, ...typescript, ...tsx, ...jsx, ...html, ...css, ...json, ...bash],
          themes: [darkPlus, catppuccinMocha, nord],
          engine: createJavaScriptRegexEngine(),
        }),
    )
  }

  return highlighterPromise
}

export async function highlightCode(code: string, language: string | undefined, themeId: ThemeId) {
  const lang = resolveLanguage(language)
  const theme = editorThemes[themeId].shikiTheme
  const cacheKey = `${theme}:${lang}:${code}`

  let result = tokenCache.get(cacheKey)

  if (!result) {
    result = warmHighlighter().then((highlighter) =>
      highlighter.codeToTokensBase(code, {
        lang,
        theme,
      }),
    )

    tokenCache.set(cacheKey, result)
  }

  return result
}
