## Why

目前平台沒有任何身份驗證機制，使用者無法登入或識別自身身份。為了讓學生、教師與助教能夠安全地存取各自的功能，必須先建立認證基礎。

## What Changes

- 新增 Google OAuth 登入入口（`/login` 頁面）
- 新增 OAuth callback 處理路由（`/auth/callback`）
- 新增 Next.js Middleware 實施路由保護，未登入者重導至 `/login`
- 新增 Supabase SSR 用戶端工具（server/client 兩版本）
- 首次登入時自動同步 Google 帳號資訊至 `public.users`（透過已建立的 DB trigger）

## Capabilities

### New Capabilities

- `user-auth`: 使用者透過 Google OAuth 登入與登出，Session 以 SSR cookie 管理，並由 Middleware 保護所有需驗證的路由

### Modified Capabilities

（無）

## Impact

- **相依套件**：`@supabase/supabase-js`、`@supabase/ssr`
- **新增檔案**：`middleware.ts`、`app/login/page.tsx`、`app/auth/callback/route.ts`、`utils/supabase/server.ts`、`utils/supabase/client.ts`
- **環境變數**：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Supabase 設定**：需在 Supabase Dashboard 手動啟用 Google OAuth provider
