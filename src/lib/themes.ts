import type { ThemeId } from '../types/scene'

export interface EditorTheme {
  id: ThemeId
  label: string
  shikiTheme: ThemeId
  appBackground: string
  canvasBackground: string
  frameBackground: string
  frameBorder: string
  panelBackground: string
  textPrimary: string
  textSecondary: string
  accent: string
  accentSoft: string
  lineHighlight: string
  placeholderPalette: string[]
}

export const editorThemes: Record<ThemeId, EditorTheme> = {
  'dark-plus': {
    id: 'dark-plus',
    label: 'VS Code Dark+',
    shikiTheme: 'dark-plus',
    appBackground: 'radial-gradient(circle at top, #172554 0%, #0f172a 46%, #020617 100%)',
    canvasBackground: 'linear-gradient(180deg, #081120 0%, #0b1529 52%, #070c16 100%)',
    frameBackground: 'rgba(15, 23, 42, 0.94)',
    frameBorder: 'rgba(148, 163, 184, 0.18)',
    panelBackground: 'rgba(9, 16, 31, 0.78)',
    textPrimary: '#eff6ff',
    textSecondary: '#93a4bc',
    accent: '#60a5fa',
    accentSoft: 'rgba(96, 165, 250, 0.18)',
    lineHighlight: 'rgba(96, 165, 250, 0.14)',
    placeholderPalette: ['#60a5fa', '#34d399', '#f59e0b', '#f472b6', '#c084fc'],
  },
  'catppuccin-mocha': {
    id: 'catppuccin-mocha',
    label: 'Catppuccin Mocha',
    shikiTheme: 'catppuccin-mocha',
    appBackground: 'radial-gradient(circle at top, #3b1f4f 0%, #181825 45%, #09090f 100%)',
    canvasBackground: 'linear-gradient(180deg, #181825 0%, #1e1e2e 55%, #11111b 100%)',
    frameBackground: 'rgba(30, 30, 46, 0.94)',
    frameBorder: 'rgba(203, 166, 247, 0.18)',
    panelBackground: 'rgba(24, 24, 37, 0.8)',
    textPrimary: '#f5e0dc',
    textSecondary: '#a6adc8',
    accent: '#f5c2e7',
    accentSoft: 'rgba(245, 194, 231, 0.18)',
    lineHighlight: 'rgba(245, 194, 231, 0.14)',
    placeholderPalette: ['#89b4fa', '#f38ba8', '#a6e3a1', '#fab387', '#cba6f7'],
  },
  nord: {
    id: 'nord',
    label: 'Nord',
    shikiTheme: 'nord',
    appBackground: 'radial-gradient(circle at top, #22405b 0%, #111827 44%, #020617 100%)',
    canvasBackground: 'linear-gradient(180deg, #18212f 0%, #1f2937 48%, #131a24 100%)',
    frameBackground: 'rgba(31, 41, 55, 0.94)',
    frameBorder: 'rgba(136, 192, 208, 0.2)',
    panelBackground: 'rgba(17, 24, 39, 0.8)',
    textPrimary: '#eceff4',
    textSecondary: '#cbd5e1',
    accent: '#88c0d0',
    accentSoft: 'rgba(136, 192, 208, 0.18)',
    lineHighlight: 'rgba(136, 192, 208, 0.15)',
    placeholderPalette: ['#88c0d0', '#81a1c1', '#a3be8c', '#ebcb8b', '#b48ead'],
  },
}
