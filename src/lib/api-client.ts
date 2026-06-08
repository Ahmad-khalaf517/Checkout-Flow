export interface ApiClientOptions {
  baseUrl?: string
  timeoutMs?: number
  defaultHeaders?: HeadersInit
}

export interface ApiClientRequestOptions extends RequestInit {
  timeoutMs?: number
}

export class ApiClient {
  private readonly baseUrl: string

  private readonly timeoutMs: number

  private readonly defaultHeaders: HeadersInit

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? import.meta.env.REACT_APP_API_BASE_URL ?? ""
    this.timeoutMs = options.timeoutMs ?? 30_000
    this.defaultHeaders = options.defaultHeaders ?? { "Content-Type": "application/json" }
  }

  async request<T>(path: string, options: ApiClientRequestOptions = {}): Promise<T> {
    const controller = new AbortController()
    const timeout = options.timeoutMs ?? this.timeoutMs
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...(options.headers ?? {}),
        },
        signal: controller.signal,
      })

      const json = (await response.json().catch(() => null)) as T | { error?: { message?: string } } | null
      if (!response.ok) {
        const message =
          typeof json === "object" && json !== null && "error" in json
            ? json.error?.message ?? `Request failed with status ${response.status}`
            : `Request failed with status ${response.status}`
        throw new Error(message)
      }

      return json as T
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Request timed out", { cause: error })
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  get<T>(path: string, options: ApiClientRequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" })
  }

  post<T>(path: string, body?: unknown, options: ApiClientRequestOptions = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  }
}

export const apiClient = new ApiClient()
