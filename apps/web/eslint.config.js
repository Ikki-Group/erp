//  @ts-check

import url from 'node:url'
import eslintReact from '@eslint-react/eslint-plugin'
import { tanstackConfig } from '@tanstack/eslint-config'
import { defineConfig } from 'eslint/config'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export default defineConfig([
  tanstackConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [eslintReact.configs['recommended-typescript']],
    // languageOptions: {
    //   parser: tseslint.parser,
    //   parserOptions: {
    //     projectService: true,
    //     tsconfigRootDir: __dirname,
    //     warnOnUnsupportedTypeScriptVersion: false,
    //   },
    // },
    rules: {
      '@eslint-react/no-missing-key': 'warn',
    },
  },
])
