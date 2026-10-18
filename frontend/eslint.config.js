import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: fileURLToPath(new URL('.', import.meta.url)),
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  { ignores: ['dist/**', 'coverage/**', 'playwright-report/**'] },
  ...compat.config(JSON.parse(readFileSync(new URL('.eslintrc.json', import.meta.url), 'utf8'))),
]
