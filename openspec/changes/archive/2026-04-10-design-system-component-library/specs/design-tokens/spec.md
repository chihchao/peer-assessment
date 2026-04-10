## ADDED Requirements

### Requirement: 色彩 token 系統
系統 SHALL 在 `tailwind.config.ts` 的 `theme.extend.colors` 定義語意化色彩 token，所有組件 SHALL 透過 token 名稱（如 `bg-primary`）引用色彩，禁止在組件中直接使用 hex 值。同步的 CSS 變數 SHALL 寫入 `src/app/globals.css`。

Token 定義：
- `primary`: `#1E3A5F`（主色，深藍）
- `secondary`: `#2563EB`（次要互動色，中藍）
- `accent`: `#059669`（強調/CTA 色，綠）
- `background`: `#F8FAFC`（頁面背景）
- `foreground`: `#0F172A`（主要文字）
- `muted`: `#F1F3F5`（次要背景/卡片）
- `border`: `#E4E7EB`（邊框）
- `destructive`: `#DC2626`（危險/刪除操作）

#### Scenario: 組件使用 token 色彩
- **WHEN** 開發者為 Button 設定主色背景
- **THEN** 程式碼應為 `className="bg-primary text-white"` 而非 `className="bg-[#1E3A5F] text-white"`

#### Scenario: CSS 變數可在非 Tailwind 場景使用
- **WHEN** SVG 或行內 style 需要引用主色
- **THEN** 可使用 `var(--color-primary)` 取得對應色值

### Requirement: 字型 scale 系統
系統 SHALL 透過 `next/font/google` 引入 Plus Jakarta Sans（weights: 300/400/500/600/700），並在 `src/app/layout.tsx` 的 `<html>` 元素套用。`tailwind.config.ts` SHALL 將 `fontFamily.sans` 設為 Plus Jakarta Sans。

#### Scenario: 頁面字型正確載入
- **WHEN** 使用者開啟任何頁面
- **THEN** 所有文字 SHALL 以 Plus Jakarta Sans 呈現，且 Lighthouse 不應出現 FOIT（invisible text flash）

#### Scenario: 字型支援多字重
- **WHEN** 組件需要 Bold 標題（font-bold）或 Medium 標籤（font-medium）
- **THEN** 字型 SHALL 正確渲染對應字重，不降級至假粗體

### Requirement: 間距與圓角 scale
系統 SHALL 使用 Tailwind 內建 4px base 間距 scale（p-1=4px、p-2=8px...），不自訂間距值。組件圓角 SHALL 統一：Button `rounded-lg`（8px）、Card `rounded-xl`（12px）、Badge `rounded-full`。

#### Scenario: 組件間距一致
- **WHEN** 開發者建立新的 Card 組件
- **THEN** 內部 padding SHALL 使用標準 scale（如 `p-6` = 24px），不使用任意值（如 `p-[22px]`）

### Requirement: z-index 層級系統
系統 SHALL 在 `tailwind.config.ts` 定義語意化 z-index：`z-base`(0)、`z-dropdown`(10)、`z-sticky`(20)、`z-modal`(40)、`z-toast`(100)。

#### Scenario: Modal 覆蓋 Sidebar
- **WHEN** Modal 開啟時
- **THEN** Modal 的 z-index(`z-modal`=40) SHALL 高於 Sidebar 的 z-index(`z-sticky`=20)，確保正確遮蓋
