import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock @supabase/ssr
const mockGetUser = vi.fn()
const mockSetAll = vi.fn()
const mockGetAll = vi.fn(() => [])

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

// Mock next/headers (not used in middleware, but needed if imported)
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

// Import AFTER mocks are set up
const { proxy } = await import('../proxy')

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(`http://localhost:3000${path}`))
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated user from / to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const response = await proxy(makeRequest('/'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login')
  })

  it('redirects authenticated user from /login to /', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@gmail.com' } },
      error: null,
    })
    const response = await proxy(makeRequest('/login'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/')
    expect(response.headers.get('location')).not.toContain('/login')
  })

  it('passes through authenticated user on protected route', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@gmail.com' } },
      error: null,
    })
    const response = await proxy(makeRequest('/dashboard'))
    expect(response.status).toBe(200)
  })
})
