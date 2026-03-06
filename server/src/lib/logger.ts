import { ConsoleTransport, LogLayer } from 'loglayer'
import { serializeError } from 'serialize-error'

const logger = new LogLayer({
  errorSerializer: serializeError,
  copyMsgOnOnlyError: true,
  transport: [
    new ConsoleTransport({
      logger: console,
      messageField: 'msg',
    }),
    // getSimplePrettyTerminal({
    //   runtime: 'node',
    //   viewMode: 'expanded',
    //   maxInlineDepth: 10,
    //   collapseArrays: true,
    //   flattenNestedObjects: false,
    // }),
  ],
})

export { logger }
