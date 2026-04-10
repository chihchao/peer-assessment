## MODIFIED Requirements

### Requirement: Google OAuth 登入
系統 SHALL 提供 Google OAuth 作為唯一登入方式。使用者點擊登入按鈕後，系統 SHALL 將使用者導向 Google 同意頁面，完成授權後返回平台並建立有效 Session。  
登入頁面（`/login`）SHALL 使用設計系統的 Button（variant="default"）與 Card 組件，套用 Plus Jakarta Sans 字型與 `bg-background` 背景色，視覺風格符合整體設計系統。

#### Scenario: 首次登入成功
- **WHEN** 未登入的使用者前往 `/login` 並點擊「使用 Google 登入」按鈕
- **THEN** 系統將使用者導向 Google OAuth 同意頁面，授權完成後重導至首頁 `/`，並在 `public.users` 建立對應記錄

#### Scenario: 再次登入成功
- **WHEN** 已曾登入過的使用者再次點擊「使用 Google 登入」
- **THEN** 系統完成 OAuth 流程後重導至首頁 `/`，`public.users` 記錄更新 email 與 name

#### Scenario: 登入按鈕視覺符合設計系統
- **WHEN** 使用者瀏覽 `/login` 頁面
- **THEN** 登入按鈕 SHALL 使用 Button 組件（variant="default"，`bg-primary text-white`），頁面背景為 `bg-background`，文字使用 Plus Jakarta Sans
