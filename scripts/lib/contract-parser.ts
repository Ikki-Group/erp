/**
 * Contract Parser
 *
 * Extracts Zod schemas, enums, and field definitions from server contract files.
 * Maps server contract patterns to web DTO patterns automatically.
 */

export interface ParsedEnum {
	name: string
	typeName: string // e.g., LocationTypeEnum → LocationTypeDto
	values: string[]
	description?: string
}

export interface ParsedSchema {
	name: string
	typeName: string
	fields: ParsedField[]
	isEntity: boolean // LocationDto (entity) vs LocationFilterDto (filter)
	isMutation: boolean // LocationMutationDto
}

export interface ParsedField {
	name: string
	type: string
	isNullable: boolean
	isOptional: boolean
	hasDefault: boolean
	description?: string
	raw: string // Original Zod code
}

export interface ParsedContract {
	moduleName: string
	enums: ParsedEnum[]
	schemas: Map<string, ParsedSchema>
	typeMapping: Map<string, string> // LocationTypeEnum → LocationTypeDto
}

export function parseServerContract(contractContent: string, moduleName: string): ParsedContract {
	const enums = parseEnums(contractContent)
	const schemas = parseSchemas(contractContent)

	// Build type mapping for enums: LocationTypeEnum → LocationTypeDto
	const typeMapping = new Map<string, string>()
	enums.forEach((e) => {
		typeMapping.set(e.name, e.typeName)
	})

	// Debug logging (can be removed)
	if (process.env.DEBUG) {
		console.log(`[DEBUG] Found ${enums.length} enums, ${schemas.size} schemas`)
	}

	return {
		moduleName,
		enums,
		schemas,
		typeMapping,
	}
}

/* ============================================================================= */
/* ENUM PARSING */
/* ============================================================================= */

function parseEnums(content: string): ParsedEnum[] {
	const enums: ParsedEnum[] = []

	// More flexible: match z.enum with multiline values
	// Handles both:
	//   z.enum(['a', 'b'])
	//   z.enum([
	//     'a',
	//     'b',
	//   ])
	const enumRegex = /export const (\w+Enum)\s*=\s*z\.enum\s*\(\s*\[([\s\S]*?)\]\s*\)/g
	let match

	while ((match = enumRegex.exec(content)) !== null) {
		const name = match[1]
		const valuesStr = match[2]

		// Parse enum values, handling comments
		const values = valuesStr
			.split(/[,\n]/)
			.map((line) => {
				// Remove comments
				const cleaned = line.split(/\/\/|\/\*/)[0].trim()
				// Extract quoted string
				const stringMatch = cleaned.match(/['"]([^'"]+)['"]/)?.[1]
				return stringMatch || null
			})
			.filter((v): v is string => v !== null && v.length > 0)

		// Extract description from preceding JSDoc comment
		const startIndex = Math.max(0, match.index - 300)
		const before = content.substring(startIndex, match.index)
		const description = before.match(/\/\*\*[\s\S]*?\*\//)?.[0]

		const typeName = name.replace('Enum', 'Dto') // LocationTypeEnum → LocationTypeDto

		enums.push({
			name,
			typeName,
			values,
			description,
		})
	}

	return enums
}

/* ============================================================================= */
/* SCHEMA PARSING */
/* ============================================================================= */

function parseSchemas(content: string): Map<string, ParsedSchema> {
	const schemas = new Map<string, ParsedSchema>()

	// Find all `export const XxxDto = z.object({...})`
	// Also find non-exported schemas like `const LocationMutationDto = z.object(...)`
	const schemaNameRegex = /(?:export\s+)?const\s+(\w+Dto|\w+MutationDto)\s*=\s*z\.object\s*\(/g
	let match

	const startPositions = []
	while ((match = schemaNameRegex.exec(content)) !== null) {
		startPositions.push({
			name: match[1],
			startPos: match.index + match[0].length,
		})
	}

	for (let i = 0; i < startPositions.length; i++) {
		const { name, startPos } = startPositions[i]
		const nextStartPos = startPositions[i + 1]?.startPos ?? content.length

		// Find the closing }) for this schema
		const substring = content.substring(startPos, nextStartPos + 500) // +500 for safety
		const closingIndex = findMatchingBracket(substring, '{', '}')

		if (closingIndex === -1) continue

		const schemaBody = substring.substring(0, closingIndex + 1)
		const fields = parseSchemaFields(schemaBody)

		const isEntity = name.endsWith('Dto') && !name.includes('Filter') && !name.includes('Mutation')
		const isMutation =
			name.includes('Mutation') || name.includes('Create') || name.includes('Update')

		schemas.set(name, {
			name,
			typeName: name,
			fields,
			isEntity,
			isMutation,
		})
	}

	return schemas
}

function parseSchemaFields(schemaBody: string): ParsedField[] {
	const fields: ParsedField[] = []

	// More robust parsing: handle multi-line fields, comments, etc.
	const cleanedBody = schemaBody
		.replace(/\/\/.*$/gm, '') // Remove line comments
		.replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments

	const lines = cleanedBody.split('\n').map((l) => l.trim())

	for (const line of lines) {
		if (!line || line === '{' || line === '}' || !line.includes(':')) continue

		// Skip spreads (handled separately)
		if (line.startsWith('...')) continue

		// Match: fieldName: validator[.chain]
		// Handle both simple (name: zp.str,) and complex validators
		const match = line.match(/^(\w+):\s*(.+?)(?:,)?$/)
		if (!match) continue

		const fieldName = match[1]
		let zSchema = match[2].trim()

		// Remove trailing comma if present
		if (zSchema.endsWith(',')) {
			zSchema = zSchema.slice(0, -1).trim()
		}

		const isNullable = zSchema.includes('.nullable()')
		const isOptional = zSchema.includes('.optional()') || zSchema.includes('?.optional()')
		const hasDefault = zSchema.includes('.default(')

		fields.push({
			name: fieldName,
			type: extractZType(zSchema),
			isNullable,
			isOptional,
			hasDefault,
			raw: line,
		})
	}

	return fields
}

function extractZType(zSchema: string): string {
	// zp.str → 'string'
	// zp.id → 'id'
	// zc.strTrim → 'strTrim'
	// LocationTypeEnum → 'LocationTypeEnum'
	// zq.search → 'search'

	if (zSchema.includes('z.enum')) return 'enum'
	if (zSchema.match(/^z[cp]\.\w+/)) {
		const match = zSchema.match(/z[cp]\.(\w+)/)
		return match?.[1] ?? 'unknown'
	}
	if (zSchema.match(/^\w+\b/)) {
		return zSchema.split(/[\s.]/)[0]
	}
	return 'unknown'
}

function findMatchingBracket(str: string, open: string, close: string): number {
	let depth = 0
	for (let i = 0; i < str.length; i++) {
		if (str[i] === open) depth++
		if (str[i] === close) depth--
		if (depth === 0) return i
	}
	return -1
}
