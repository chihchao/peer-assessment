## ADDED Requirements

### Requirement: PageWrapper 組件
系統 SHALL 提供 PageWrapper 組件（`src/components/layout/page-wrapper.tsx`），作為所有認證後頁面的標準容器。  
PageWrapper SHALL 包含：Navbar（頂部）+ 可選 Sidebar（左側） + 主內容區（`<main>`）。  
主內容區 SHALL 有固定 top padding（補 Navbar 高度）與水平 max-width（`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`）。

#### Scenario: 標準頁面結構
- **WHEN** 頁面使用 `<PageWrapper>`
- **THEN** 頁面 SHALL 呈現頂部 Navbar + 中間內容區的標準版面，內容不被 Navbar 遮蓋

#### Scenario: 響應式內容寬度
- **WHEN** 在 375px 手機螢幕檢視
- **THEN** 內容 SHALL 有 16px 水平邊距，無水平捲軸

### Requirement: Navbar 組件
系統 SHALL 提供 Navbar 組件（`src/components/layout/navbar.tsx`），固定於頁面頂部（`fixed top-0 left-0 right-0`，z-sticky），包含：
- 左側：平台 Logo / 名稱
- 右側：登入使用者的 Avatar + 姓名 + 角色 Badge + 登出按鈕
- 高度固定 64px，背景 `bg-white border-b border-border`

Navbar 接受 `user: { name: string; email: string; role: string; avatarUrl?: string }` prop。

#### Scenario: 顯示使用者資訊
- **WHEN** 使用者已登入且 Navbar 渲染
- **THEN** Navbar 右側 SHALL 顯示使用者頭像、姓名與對應角色 Badge

#### Scenario: 角色 Badge 顯示正確
- **WHEN** 使用者 role 為 `teacher`
- **THEN** Navbar 中的 Badge SHALL 顯示綠色「教師」標籤

#### Scenario: 鍵盤導航
- **WHEN** 使用者以 Tab 鍵瀏覽 Navbar
- **THEN** Logo、Avatar 選單、登出按鈕 SHALL 依序可聚焦，focus ring 清晰可見

### Requirement: PageHeader 組件
系統 SHALL 提供 PageHeader 組件（`src/components/layout/page-header.tsx`），顯示頁面標題與可選的副標題、麵包屑（breadcrumb）及右側操作按鈕區。  
PageHeader 使用 `<h1>` 作為標題（font-bold text-2xl text-foreground），確保頁面 heading 層級正確。

#### Scenario: 標準頁面標題
- **WHEN** 頁面使用 `<PageHeader title="互評作業" subtitle="互評平台 - 2026 春季" />`
- **THEN** 頁面頂部顯示清晰的 h1 標題與灰色副標題

#### Scenario: 帶有操作按鈕
- **WHEN** PageHeader 傳入 `actions={<Button>新增作業</Button>}`
- **THEN** 操作按鈕顯示於標題右側（flex justify-between）

### Requirement: 三角色導航結構
系統 SHALL 根據使用者角色（`student` / `teacher` / `ta`）在 Navbar 或 Sidebar 中呈現不同的導航項目，各角色 SHALL 只看到與其權限相符的功能入口。

導航項目映射：
- **Student**：「我的作業」、「互評任務」、「成績查詢」
- **Teacher**：「課程管理」、「作業管理」、「成績總覽」、「學生名單」
- **TA**：「互評管理」、「成績審核」、「學生名單」

#### Scenario: 學生看到學生專屬導航
- **WHEN** role 為 `student` 的使用者登入
- **THEN** 導航 SHALL 顯示「我的作業」、「互評任務」、「成績查詢」，不顯示教師功能

#### Scenario: 教師看到教師專屬導航
- **WHEN** role 為 `teacher` 的使用者登入
- **THEN** 導航 SHALL 顯示「課程管理」等教師功能，不顯示學生功能

#### Scenario: 當前頁面在導航中高亮
- **WHEN** 使用者位於「互評任務」頁面
- **THEN** 導航中「互評任務」項目 SHALL 以 `bg-primary/10 text-primary font-medium` 高亮顯示
