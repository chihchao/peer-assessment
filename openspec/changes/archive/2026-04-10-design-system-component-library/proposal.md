## Why

本專案目前缺乏統一的設計語言與可重用組件庫，各頁面的視覺風格、色彩、字型與間距規範不一致，導致開發速度慢且維護成本高。建立設計系統（Design System）與組件庫，可確保三種角色（學生、教師、TA）的操作介面保持一致的專業感與可用性。

## What Changes

- 新增 Tailwind CSS 設計 token（色彩、字型、間距、圓角、陰影）設定至 `tailwind.config.ts`
- 新增 `src/components/ui/` 原子組件庫（Button、Input、Card、Badge、Avatar、Table、Modal、Toast）
- 新增 `src/components/layout/` 版面組件（Navbar、Sidebar、PageHeader、PageWrapper）
- 新增全域 CSS 變數（`src/app/globals.css`）對應設計 token
- 引入 Plus Jakarta Sans 字型（Google Fonts）
- 建立角色識別 Badge 系統（Student / Teacher / TA 三色標籤）
- 所有組件符合 WCAG AA 無障礙標準（對比度、鍵盤導航、aria-label）

## Capabilities

### New Capabilities

- `design-tokens`: 定義全域設計 token — 色彩系統、字型 scale、間距 scale、圓角、z-index 層級
- `ui-components`: 原子層組件庫，包含 Button、Input、Card、Badge、Avatar、Table、Modal、Toast
- `layout-components`: 版面層組件，包含 Navbar、Sidebar、PageHeader、PageWrapper，支援三種角色的導航結構

### Modified Capabilities

- `user-auth`: 登入頁面（`/login`）套用新設計系統的 Button、Card 與色彩 token，維持既有 Google OAuth 流程不變

## Impact

- **檔案異動**：`tailwind.config.ts`、`src/app/globals.css`、`src/app/layout.tsx`（引入字型）
- **新增目錄**：`src/components/ui/`、`src/components/layout/`
- **依賴新增**：Google Fonts（Plus Jakarta Sans，CDN 載入，無額外 npm 套件）
- **無 breaking change**：現有頁面可漸進式採用新組件；舊樣式不會被強制移除
