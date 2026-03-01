import mongoose, { type ConnectOptions as MongoConnectOptions } from 'mongoose'

interface ConnectionOptions extends MongoConnectOptions {
  uri: string
  env: string
}

mongoose.set('strictQuery', false)
mongoose.set('transactionAsyncLocalStorage', true)
mongoose.set('allowDiskUse', true)

export async function connectDatabase({ uri, env, ...opts }: ConnectionOptions) {
  return mongoose
    .connect(uri, {
      appName: `ikki-${env}`,
      maxPoolSize: 100,
      minPoolSize: 10,
      retryWrites: true,
      ...opts,
    })
    .then((c) => {
      return c
    })
}
