## 1. 設計 Token 與全域設定

- [x] 1.1 安裝 `class-variance-authority` 套件（`npm install class-variance-authority`）
- [x] 1.2 更新 `tailwind.config.ts`：在 `theme.extend.colors` 加入語意化色彩 token（primary/secondary/accent/background/foreground/muted/border/destructive）
- [x] 1.3 更新 `tailwind.config.ts`：在 `theme.extend.zIndex` 加入語意化 z-index（base/dropdown/sticky/modal/toast）
- [x] 1.4 更新 `src/app/globals.css`：加入對應的 CSS 變數（`--color-primary` 等）與全域 reset（`body { font-family: var(--font-plus-jakarta-sans) }`）
- [x] 1.5 更新 `src/app/layout.tsx`：透過 `next/font/google` 引入 Plus Jakarta Sans（weights: 300/400/500/600/700），套用至 `<html>` className

## 2. 原子組件庫（src/components/ui/）

- [x] 2.1 建立 `src/components/ui/button.tsx`：使用 CVA 定義 variant（default/secondary/outline/ghost/destructive）與 size（sm/default/lg），支援 `isLoading` prop（spinner + disabled）
- [x] 2.2 建立 `src/components/ui/input.tsx`：包含 label、placeholder、error prop（紅色邊框 + 下方錯誤訊息 + aria-describedby）、disabled 狀態，高度 ≥ 44px
- [x] 2.3 建立 `src/components/ui/card.tsx`：導出 Card、CardHeader、CardContent、CardFooter，樣式為 `bg-white border border-border rounded-xl`，無 box-shadow
- [x] 2.4 建立 `src/components/ui/badge.tsx`：使用 CVA 定義角色 variant（student/teacher/ta/default），驗證各色彩組合在白底的對比度 ≥ 4.5:1
- [x] 2.5 建立 `src/components/ui/avatar.tsx`：包含 AvatarImage（Next.js `<Image>`）與 AvatarFallback（首字母），size variant（sm/default/lg）
- [x] 2.6 建立 `src/components/ui/toast.tsx` 與 `src/hooks/use-toast.ts`：支援 success/error/warning/info variant，4 秒自動消失，固定右下角，`aria-live="polite"`
- [x] 2.7 建立 `src/components/ui/index.ts`：統一 re-export 所有 ui 組件

## 3. 版面組件（src/components/layout/）

- [x] 3.1 建立 `src/components/layout/page-wrapper.tsx`：包含 Navbar + `<main>`（加上 Navbar 高度的 pt）+ max-w-7xl 水平容器
- [x] 3.2 建立 `src/components/layout/navbar.tsx`：固定頂部 64px，含 Logo 文字、使用者 Avatar + 姓名 + 角色 Badge、登出按鈕；接受 `user` prop（name/email/role/avatarUrl）
- [x] 3.3 在 Navbar 實作三角色導航項目映射（navItems 物件依 role 決定顯示項目，current page 高亮）
- [x] 3.4 建立 `src/components/layout/page-header.tsx`：使用 `<h1>` 標題 + 可選副標題 + 可選右側 actions slot
- [x] 3.5 建立 `src/components/layout/index.ts`：統一 re-export 所有 layout 組件

## 4. 登入頁面套用設計系統（user-auth 更新）

- [x] 4.1 更新 `src/app/(auth)/login/page.tsx`：以 Card 組件包裹登入區塊，Button（variant="default"）取代現有按鈕，背景改用 `bg-background`
- [x] 4.2 確認登入頁在 375px / 768px 寬度下版面正常，無水平捲軸

## 5. 首頁套用設計系統

- [x] 5.1 更新 `src/app/(main)/page.tsx`：以 PageWrapper + PageHeader 取代現有版面，使用者資訊改用 Avatar + Badge 顯示
- [x] 5.2 確認首頁在 375px / 1440px 寬度下版面正常

## 6. 無障礙與品質驗證

- [x] 6.1 執行 `npm run lint` 確認所有新檔案通過 ESLint（eslint-config-next）
- [x] 6.2 以 axe DevTools 或 Lighthouse 掃描登入頁與首頁，確認無 WCAG AA 錯誤
- [x] 6.3 鍵盤導航測試：Tab 遍歷 Navbar 所有可互動元素，focus ring 清晰可見
- [x] 6.4 確認所有 Badge 色彩組合（student/teacher/ta）在白底對比度 ≥ 4.5:1（可用 WebAIM Contrast Checker 驗證）
