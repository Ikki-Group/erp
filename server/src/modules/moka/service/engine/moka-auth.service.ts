import type { Logger } from 'pino'

export class MokaAuthService {
  public token: string | null = null
  public mokaBusinessId: number | null = null
  public mokaOutletId: number | null = null

  constructor(
    private readonly logger: Logger,
    private readonly credentials: { email: string; password: string }
  ) {}

  async ensureAuthenticated() {
    if (this.token) return

    this.logger.info({ email: this.credentials.email }, 'Logging into Moka')

    const response = await fetch('https://backoffice.mokapos.com/api/v2/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: this.credentials.email,
        password: this.credentials.password,
      }),
    })

    if (!response.ok) {
      throw new Error(`Moka login failed: ${response.statusText}`)
    }

    const data: any = await response.json()
    this.token = data.access_token
  }

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    await this.ensureAuthenticated()

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, { ...options, headers })

    if (response.status === 401) {
      this.token = null
      return this.fetch(url, options)
    }

    return response
  }
}
