#!/usr/bin/env bun
/**
 * Debug parser - see what's being extracted
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { parseServerContract } from './lib/contract-parser'

const moduleName = process.argv[2] || 'location'
const PROJECT_ROOT = '/Users/rizqynugroho9/workspace/ikki/erp'
const serverContractPath = join(PROJECT_ROOT, 'apps/server/src/modules', moduleName, `${moduleName}.contract.ts`)

const content = readFileSync(serverContractPath, 'utf-8')
const contract = parseServerContract(content, moduleName)

console.log('\n📊 PARSED CONTRACT DEBUG')
console.log('='.repeat(60))

console.log('\n🎯 Enums:')
contract.enums.forEach((e) => {
  console.log(`  • ${e.name} → ${e.typeName}`)
  console.log(`    Values: ${e.values.join(', ')}`)
})

console.log('\n📋 Schemas:')
contract.schemas.forEach((schema, name) => {
  console.log(`  • ${name} (entity: ${schema.isEntity}, mutation: ${schema.isMutation})`)
  console.log(`    Fields: ${schema.fields.length}`)
  schema.fields.forEach((f) => {
    const mods = []
    if (f.isNullable) mods.push('nullable')
    if (f.isOptional) mods.push('optional')
    console.log(`      - ${f.name}: ${f.type} ${mods.join(', ')}`)
  })
})

console.log('\n🔄 Type Mapping:')
contract.typeMapping.forEach((v, k) => {
  console.log(`  ${k} → ${v}`)
})
