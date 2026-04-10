### Requirement: Button 組件
系統 SHALL 提供 Button 組件（`src/components/ui/button.tsx`），支援以下 variant：
- `default`：主色背景（`bg-primary text-white`），hover 降低亮度
- `secondary`：次要色背景（`bg-secondary text-white`）
- `outline`：透明背景 + border，hover 填色
- `ghost`：無背景無邊框，hover 淡色背景
- `destructive`：危險操作（`bg-destructive text-white`）

Size variant：`sm`（h-8）、`default`（h-10）、`lg`（h-12）。  
Button SHALL 在非同步操作期間接受 `isLoading` prop，顯示 spinner 並設為 disabled。  
所有可互動狀態（hover/focus/active/disabled）SHALL 有明確視覺區分。

#### Scenario: 主要 CTA Button
- **WHEN** 使用者看到頁面中的主要操作按鈕
- **THEN** Button SHALL 以 `bg-primary text-white` 顯示，hover 時背景色加深

#### Scenario: Loading 狀態
- **WHEN** `isLoading={true}` 傳入 Button
- **THEN** Button SHALL 顯示旋轉 spinner、禁止點擊，且保持原有寬度不跳動

#### Scenario: 鍵盤可操作
- **WHEN** 使用者以 Tab 鍵聚焦 Button
- **THEN** SHALL 顯示 2px focus ring（`ring-2 ring-primary`），Enter/Space 觸發點擊

### Requirement: Input 組件
系統 SHALL 提供 Input 組件（`src/components/ui/input.tsx`），包含：
- 明顯的 label（透過 `label` prop 或搭配 Label 組件）
- placeholder 文字
- 錯誤狀態（`error` prop）：紅色邊框 + 錯誤訊息顯示於欄位下方
- disabled 狀態：減少不透明度（opacity-50）+ 不可互動

Input 的 height SHALL ≥ 44px 以符合觸控標準。

#### Scenario: 正常輸入
- **WHEN** 使用者點擊 Input 欄位並輸入文字
- **THEN** 欄位顯示 focus 狀態（border-secondary）且文字清晰可讀

#### Scenario: 驗證錯誤顯示
- **WHEN** `error="此欄位為必填"` 傳入 Input
- **THEN** 邊框變紅（border-destructive），錯誤訊息顯示於欄位正下方，aria-describedby 連結錯誤訊息元素

### Requirement: Card 組件
系統 SHALL 提供 Card 組件（`src/components/ui/card.tsx`），包含 CardHeader、CardContent、CardFooter 子組件。  
Card 使用 `bg-white border border-border rounded-xl`，無 box-shadow（Flat Design 規範）。

#### Scenario: 標準內容卡片
- **WHEN** 開發者使用 `<Card><CardHeader>標題</CardHeader><CardContent>內容</CardContent></Card>`
- **THEN** 呈現白色圓角卡片，邊框清晰，內距一致（CardHeader/Footer p-6、CardContent px-6 pb-6）

### Requirement: Badge 組件（角色識別）
系統 SHALL 提供 Badge 組件（`src/components/ui/badge.tsx`），支援角色語意 variant：
- `student`：藍色（`bg-secondary/10 text-secondary`）
- `teacher`：綠色（`bg-accent/10 text-accent`）
- `ta`：橙色（`bg-orange-100 text-orange-700`）
- `default`：灰色（`bg-muted text-foreground`）

所有 Badge 色彩組合 SHALL 在白色背景上達到 WCAG AA 對比度（≥ 4.5:1）。

#### Scenario: 顯示學生角色
- **WHEN** Badge 傳入 `variant="student"`
- **THEN** 顯示藍底藍字標籤，文字可讀且圓角為 `rounded-full`

#### Scenario: 顯示教師角色
- **WHEN** Badge 傳入 `variant="teacher"`
- **THEN** 顯示綠底綠字標籤

### Requirement: Avatar 組件
系統 SHALL 提供 Avatar 組件（`src/components/ui/avatar.tsx`），顯示使用者 Google 頭像（`<Image>` 元素），當圖片載入失敗時 SHALL fallback 至姓名首字母（`AvatarFallback`）。  
Avatar size：`sm`(32px)、`default`(40px)、`lg`(56px)。

#### Scenario: 頭像正常顯示
- **WHEN** 使用者有 Google 頭像 URL
- **THEN** Avatar 顯示圓形裁切的頭像圖片

#### Scenario: 頭像載入失敗
- **WHEN** 頭像 URL 無效或網路失敗
- **THEN** Avatar SHALL 顯示使用者名稱第一個字母的灰色圓形 fallback

### Requirement: Toast 通知組件
系統 SHALL 提供 Toast 通知系統（`src/components/ui/toast.tsx` + `useToast` hook），支援：
- `success`（綠色）、`error`（紅色）、`warning`（橙色）、`info`（藍色）四種 variant
- 自動於 4 秒後消失
- 顯示位置：右下角（`fixed bottom-4 right-4`）
- Toast SHALL 不奪取鍵盤 focus，使用 `aria-live="polite"` 供螢幕閱讀器朗讀

#### Scenario: 成功通知
- **WHEN** 呼叫 `toast.success("儲存成功")`
- **THEN** 右下角出現綠色 Toast，4 秒後自動消失

#### Scenario: 螢幕閱讀器朗讀
- **WHEN** Toast 出現
- **THEN** 螢幕閱讀器 SHALL 朗讀 Toast 內容，且頁面 focus 不移動至 Toast
