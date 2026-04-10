## Context

本專案為 Next.js 15 App Router 架構，使用 TypeScript（strict）與 Tailwind CSS。目前各頁面（登入、首頁）直接使用 Tailwind utility class，缺乏設計 token 層，導致色彩、間距數值散落在各組件中，無法統一維護。

設計系統採用 **Flat Design** 風格（UI-UX Pro Max 推薦），色彩以海軍藍（`#1E3A5F`）為主色，Plus Jakarta Sans 為唯一字族，符合學術工具的專業氛圍，同時保持高效能（無 shadow/blur 開銷）與 WCAG AA 無障礙標準。

## Goals / Non-Goals

**Goals:**
- 在 `tailwind.config.ts` 建立語意化色彩 token，所有組件透過 token 引用色彩
- 建立 `src/components/ui/` 原子組件庫，採用 shadcn/ui 模式（CVA + Radix UI primitives）
- 建立 `src/components/layout/` 版面組件，支援學生、教師、TA 三種角色的導航差異
- 引入 Plus Jakarta Sans 字型並設定字型 scale
- 所有新組件符合 WCAG AA（對比度 ≥ 4.5:1、鍵盤可操作、aria-label 完整）

**Non-Goals:**
- 不建立 Storybook 或獨立的組件文件站台（可於後續 change 追加）
- 不實作深色模式（Dark Mode），留待後續迭代
- 不替換現有頁面的所有舊樣式，漸進式採用即可
- 不引入 CSS-in-JS 或 styled-components，維持純 Tailwind

## Decisions

### 1. 使用 CVA（class-variance-authority）管理組件變體

**決策**：Button、Badge 等組件採用 `cva()` 定義 variant 與 size，而非條件式字串拼接。

**理由**：CVA 與 Tailwind 整合良好，提供型別安全的 variant props，避免手動管理 className 字串。相較於 Radix Themes 或 shadcn/ui 全套安裝，CVA 只引入單一輕量依賴，保持架構靈活性。

**替代方案**：
- shadcn/ui CLI：自動生成組件但難以客製化 token；本專案需完整掌控設計 token 故不採用
- Tailwind Variants：功能相近，但 CVA 社群較大、文件完整

### 2. 語意化 token 命名策略

**決策**：在 `tailwind.config.ts` 的 `theme.extend.colors` 定義語意名稱，對應至具體 hex 值。CSS 變數（`--color-primary` 等）同步寫入 `globals.css`，供非 Tailwind 的 SVG / CSS 場景使用。

```ts
// tailwind.config.ts
colors: {
  primary:     '#1E3A5F',
  secondary:   '#2563EB',
  accent:      '#059669',
  background:  '#F8FAFC',
  foreground:  '#0F172A',
  muted:       '#F1F3F5',
  border:      '#E4E7EB',
  destructive: '#DC2626',
}
```

**理由**：語意名稱讓組件程式碼不含具體色碼，未來換色只需改 config。

**替代方案**：直接使用 Tailwind 內建 blue-900 等 scale — 缺點是語意不清且換色困難。

### 3. 字型引入方式：Google Fonts CDN via next/font

**決策**：透過 `next/font/google` 引入 Plus Jakarta Sans，在 `src/app/layout.tsx` 套用至 `<html>` 的 className。

**理由**：`next/font` 自動處理 `font-display: swap`、預載與 self-hosting，Zero Layout Shift，符合 Core Web Vitals 標準，無需手動 `@import`。

### 4. 角色導航差異實作策略

**決策**：Navbar / Sidebar 接受 `role: 'student' | 'teacher' | 'ta'` prop，內部以物件映射決定顯示的導航項目，而非三套獨立組件。

**理由**：統一維護一套導航邏輯；角色差異只在資料層（`navItems[role]`），不影響 UI 結構。

## Risks / Trade-offs

- **[風險] CVA 增加依賴**  
  → 緩解：CVA 體積極小（< 2KB gzip），且已廣泛用於 shadcn/ui 生態，維護風險低。

- **[風險] 漸進式採用導致新舊樣式並存**  
  → 緩解：在 `globals.css` 統一 reset，確保舊有 utility class 不與新 token 衝突；舊頁面不強制改寫，但新頁面必須使用新組件。

- **[取捨] 不做 Dark Mode**  
  → 影響：部分使用者可能偏好深色介面；但學術場景主要白天使用，優先確保淺色模式品質，Deep Mode 列為 backlog。

- **[風險] 角色 Badge 色彩對比度**  
  → 緩解：Student（藍）、Teacher（綠）、TA（橙）均需在白底通過 4.5:1 檢驗，設計階段即驗證。

## Migration Plan

1. **Token 先行**：先更新 `tailwind.config.ts` 與 `globals.css`，不改動任何現有頁面
2. **組件建立**：在 `src/components/ui/` 逐一建立原子組件，有完整型別與 prop 定義
3. **版面組件**：建立 Navbar、Sidebar、PageWrapper，在 `layout.tsx` 中替換現有硬碼版面
4. **登入頁套用**：將 `/app/(auth)/login/page.tsx` 中的 Button、Card 換用新組件（`user-auth` capability 更新）
5. **回滾策略**：所有修改均可 git revert；新組件目錄獨立，不影響現有頁面路由

## Open Questions

- 是否需要為 Table 組件整合排序（sort）與分頁（pagination）？建議先建立基礎 Table，排序/分頁留待互評資料表需求確定後再加。
- Modal 是否使用 Radix UI Dialog primitive？Radix 提供完整無障礙支援（focus trap、aria-modal），建議採用，但需確認團隊是否接受增加此依賴。
