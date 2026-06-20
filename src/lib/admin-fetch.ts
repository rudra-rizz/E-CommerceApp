export async function adminFetch<T = any>(
  url: string,
  options?: { method?: string; headers?: Record<string, string>; body?: any }
): Promise<T> {
  const method = options?.method || 'GET'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }
  const body = options?.body !== undefined ? JSON.stringify(options.body) : undefined
  const res = await fetch(url, { method, headers, body })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Request failed')
  return json as T
}

type Filter = { method: string; column: string; value: any; conditions?: any[] }
type Options = { select?: string; order?: { column: string; ascending?: boolean }; range?: { from: number; to: number }; limit?: number; single?: boolean; maybeSingle?: boolean }

export const adminApi = {
  select: (table: string, filters?: Filter[], options?: Options) =>
    adminFetch('/api/admin/query', { method: 'POST', body: { action: 'select', table, filters, options } }),

  insert: (table: string, data: any, options?: Options) =>
    adminFetch('/api/admin/query', { method: 'POST', body: { action: 'insert', table, data, options } }),

  update: (table: string, data: any, filters: Filter[], options?: Options) =>
    adminFetch('/api/admin/query', { method: 'POST', body: { action: 'update', table, data, filters, options } }),

  delete: (table: string, filters: Filter[]) =>
    adminFetch('/api/admin/query', { method: 'POST', body: { action: 'delete', table, filters } }),

  count: (table: string, filters?: Filter[]) =>
    adminFetch<{ count: number }>('/api/admin/query', { method: 'POST', body: { action: 'count', table, filters } }),
}
