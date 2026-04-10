## 1. 專案初始化

- [ ] 1.1 使用 `npx create-next-app@latest` 建立 Next.js 15 專案（TypeScript、Tailwind CSS、App Router、src/ 目錄不使用）
- [ ] 1.2 安裝相依套件：`@supabase/supabase-js` 與 `@supabase/ssr`

## 2. 環境設定

- [ ] 2.1 建立 `.env.local`，填入 `NEXT_PUBLIC_SUPABASE_URL` 與 `NEXT_PUBLIC_SUPABASE_ANON_KEY`（從 Supabase Dashboard → Project Settings → API 取得）
- [ ] 2.2 在 Supabase Dashboard → Authentication → Providers 啟用 Google，填入 Google Cloud OAuth Client ID 與 Secret，並將 Callback URL 加入 Google Cloud 允許清單

## 3. Supabase 用戶端工具

- [ ] 3.1 建立 `utils/supabase/server.ts`：使用 `createServerClient` 建立 SSR 用戶端（讀寫 cookies）
- [ ] 3.2 建立 `utils/supabase/client.ts`：使用 `createBrowserClient` 建立瀏覽器用戶端

## 4. Middleware

- [ ] 4.1 建立 `middleware.ts`：呼叫 `supabase.auth.getUser()` 檢查 Session，刷新 cookie；未登入者重導至 `/login`，已登入者訪問 `/login` 重導至 `/`
- [ ] 4.2 設定 `matcher` 排除 `/_next/`、`/favicon.ico`、`/auth/callback`、`/login`

## 5. 登入頁面

- [ ] 5.1 建立 `app/login/actions.ts`：Server Action 呼叫 `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`，以 `redirect()` 導向 Google
- [ ] 5.2 建立 `app/login/page.tsx`：Server Component，顯示「使用 Google 登入」按鈕，提交至 Server Action

## 6. OAuth Callback

- [ ] 6.1 建立 `app/auth/callback/route.ts`：Route Handler 取得 URL 中的 `code`，呼叫 `exchangeCodeForSession(code)`，成功後 `redirect('/')`

## 7. 登出

- [ ] 7.1 建立登出 Server Action：呼叫 `supabase.auth.signOut()`，執行後 `redirect('/login')`
- [ ] 7.2 在適當位置（如首頁 layout）加入登出按鈕，綁定登出 Server Action

## 8. 驗證

- [ ] 8.1 端對端測試：首次 Google 登入後確認 `public.users` 已自動建立記錄（含 name、email、role）
- [ ] 8.2 驗證路由保護：未登入狀態下直接訪問 `/` 應重導至 `/login`
- [ ] 8.3 驗證已登入者訪問 `/login` 應重導至 `/`
- [ ] 8.4 驗證登出後 Session 清除，再次訪問受保護路由應重導至 `/login`
