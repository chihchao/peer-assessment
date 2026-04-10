## Context

平台採用 Next.js 15 App Router + Supabase，身份驗證須在 SSR 環境下正常運作。`public.users` 資料表已建立，並有 `on_auth_user_created` trigger 在首次登入時自動同步帳號資料。此次設計僅涵蓋認證機制，不涉及角色權限細節。

## Goals / Non-Goals

**Goals:**
- 使用者可透過 Google 帳號登入與登出
- Session 以 HTTP-only cookie 儲存，支援 Server Component 讀取
- 未登入者存取受保護路由時自動重導至 `/login`
- 已登入者訪問 `/login` 時重導至首頁 `/`

**Non-Goals:**
- 其他 OAuth provider（GitHub、LINE 等）
- Email/Password 登入
- 角色權限控制（由後續 change 處理）
- 記住我 / Session 過期策略

## Decisions

### 1. 使用 `@supabase/ssr` 管理 Session

**選擇**：`@supabase/ssr` 搭配 cookie-based session。

**原因**：Next.js App Router 的 Server Components 無法存取 `localStorage`。`@supabase/ssr` 提供 `createServerClient` / `createBrowserClient`，透過 HTTP-only cookie 在 server 與 client 間共享 session，是 Supabase 官方推薦方案。

**捨棄方案**：`@supabase/auth-helpers-nextjs`（已棄用）。

---

### 2. Middleware 統一守衛路由

**選擇**：在 `middleware.ts` 以 `supabase.auth.getUser()` 檢查 session，統一處理重導邏輯。

**原因**：集中管理，避免在每個 layout/page 重複驗證。Middleware 在每次 request 前執行，也負責刷新 session cookie。

**Matcher 規則**：排除 `/_next/`、`/favicon.ico`、`/auth/callback`、`/login`。

---

### 3. Server Action 觸發 Google OAuth

**選擇**：`app/login/page.tsx` 為 Server Component，登入按鈕透過 Server Action 呼叫 `supabase.auth.signInWithOAuth()`。

**原因**：保持 Server-first 架構，不需在登入頁引入 `'use client'`。`signInWithOAuth` 回傳 redirect URL，Server Action 以 `redirect()` 導向 Google。

---

### 4. Callback Route Handler

**選擇**：`app/auth/callback/route.ts`（Route Handler）接收 Google 回呼，用 `exchangeCodeForSession()` 換取 session 後重導至 `/`。

**原因**：OAuth PKCE flow 需要在 server side 交換 code，不能在 client side 完成。

## Auth Flow

```
使用者
  │
  ▼
GET /login
  │  (未登入，middleware 放行)
  ▼
app/login/page.tsx
  │  [登入按鈕] → Server Action
  ▼
signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })
  │
  ▼
Google 同意頁面
  │
  ▼
GET /auth/callback?code=xxx
  │
  ▼
app/auth/callback/route.ts
  │  exchangeCodeForSession(code)
  │  → 寫入 session cookie
  ▼
redirect('/')
  │
  ▼
首頁（已登入）
```

## File Structure

```
middleware.ts                        # 路由保護 + session 刷新
utils/
  supabase/
    server.ts                        # createServerClient (SSR)
    client.ts                        # createBrowserClient (瀏覽器)
app/
  login/
    page.tsx                         # 登入頁面（Server Component）
    actions.ts                       # Server Action: signInWithOAuth
  auth/
    callback/
      route.ts                       # OAuth code exchange
```

## Risks / Trade-offs

- **Google Provider 需手動啟用**：Supabase Dashboard → Authentication → Providers → Google，需填入 Google Cloud OAuth Client ID/Secret。若未設定，登入流程將在 Supabase 端失敗。→ 在 tasks.md 中列為獨立步驟並加說明。
- **Cookie 大小限制**：Supabase session token 較大，需確認不超過瀏覽器 4KB cookie 限制。`@supabase/ssr` 已處理 chunking，風險低。
- **`getUser()` 每次 request 呼叫 Supabase API**：Middleware 中使用 `getUser()`（非 `getSession()`）以確保 token 未被竄改，會有小量網路延遲。可接受，為官方安全建議。

## Open Questions

（無）
