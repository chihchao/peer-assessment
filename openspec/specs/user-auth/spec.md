### Requirement: Google OAuth 登入
系統 SHALL 提供 Google OAuth 作為唯一登入方式。使用者點擊登入按鈕後，系統 SHALL 將使用者導向 Google 同意頁面，完成授權後返回平台並建立有效 Session。

#### Scenario: 首次登入成功
- **WHEN** 未登入的使用者前往 `/login` 並點擊「使用 Google 登入」按鈕
- **THEN** 系統將使用者導向 Google OAuth 同意頁面，授權完成後重導至首頁 `/`，並在 `public.users` 建立對應記錄

#### Scenario: 再次登入成功
- **WHEN** 已曾登入過的使用者再次點擊「使用 Google 登入」
- **THEN** 系統完成 OAuth 流程後重導至首頁 `/`，`public.users` 記錄更新 email 與 name

### Requirement: Session 持久化
系統 SHALL 以 HTTP-only cookie 儲存 Session，使 Server Components 與 Client Components 皆可讀取登入狀態。

#### Scenario: 重新整理頁面後仍保持登入
- **WHEN** 已登入的使用者重新整理頁面
- **THEN** 系統 SHALL 維持登入狀態，不要求重新登入

### Requirement: 路由保護
系統 SHALL 保護所有需驗證的路由，未登入者 SHALL 被重導至 `/login`。

#### Scenario: 未登入存取受保護頁面
- **WHEN** 未登入的使用者直接存取 `/`（或其他受保護路由）
- **THEN** 系統 SHALL 立即重導至 `/login`

#### Scenario: 已登入者存取登入頁
- **WHEN** 已登入的使用者訪問 `/login`
- **THEN** 系統 SHALL 重導至首頁 `/`

### Requirement: 登出
系統 SHALL 提供登出功能，登出後 Session SHALL 立即失效，使用者 SHALL 被重導至 `/login`。

#### Scenario: 登出成功
- **WHEN** 已登入的使用者執行登出操作
- **THEN** 系統清除 Session cookie 並將使用者重導至 `/login`
