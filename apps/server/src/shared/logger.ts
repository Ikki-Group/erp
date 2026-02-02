import { getSimplePrettyTerminal } from '@loglayer/transport-simple-pretty-terminal'
import { LogLayer } from 'loglayer'
import { serializeError } from 'serialize-error'

const logger = new LogLayer({
  errorSerializer: serializeError,
  copyMsgOnOnlyError: true,
  transport: [
    // new ConsoleTransport({
    //   logger: console,
    // }),
    getSimplePrettyTerminal({
      runtime: 'node',
      viewMode: 'expanded',
    }),
  ],
})

export { logger }
