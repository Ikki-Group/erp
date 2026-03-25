import pino, { type TransportTargetOptions } from 'pino'

import { env } from '@/config/env'

const isDev = env.NODE_ENV === 'development'

const targets: TransportTargetOptions[] = []

// Standard Output Transport
if (isDev || env.LOG_PRETTY) {
  targets.push({
    target: 'pino-pretty',
    options: { colorize: true, ignore: 'pid,hostname,req.headers,module,res', translateTime: 'SYS:standard' },
  })
} else {
  targets.push({
    target: 'pino/file',
    options: { destination: 1 }, // 1 is stdout
  })
}

// Axiom Transport
if (env.AXIOM_TOKEN) {
  targets.push({ target: '@axiomhq/pino', options: { dataset: env.AXIOM_DATASET, token: env.AXIOM_TOKEN } })
}

const transport = pino.transport({ targets })

const logger = pino({ level: env.LOG_LEVEL, timestamp: pino.stdTimeFunctions.isoTime }, transport)

export { logger }
