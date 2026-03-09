/** @type {import("prettier").Config} */
const config = {
  trailingComma: 'es5',
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  printWidth: 120,
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  importOrder: [
    '^(bun|node):',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@/config$',
    '',
    '^@/lib/(.*)$',
    '',
    '^@/db/(.*)$',
    '',
    '^@/modules/(.*)$',
    '',
    '^@/(.*)$',
    '',
    '^../(.*)$',
    '',
    '^[./]',
  ],
  importOrderParserPlugins: ['typescript', 'decorators-legacy'],
  importOrderTypeScriptVersion: '5.0.0',
}

module.exports = config
