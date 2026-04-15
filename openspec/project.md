# 專案憲章：互評平台

## 1. 專案概述 (Project Overview)
本專案是一個基於 Web 的學生報告互評平台。
- 核心目標：建立一個高效、穩定且具備良好使用者體驗的非同步學習環境。
- 使用者角色：包含學生 (Student)、教師 (Teacher) 與助教 (TA)。

## 2. 技術棧 (Tech Stack)
所有的開發必須嚴格遵守以下技術選型，禁止引入未經討論的第三方庫。
- 前端框架：Next.js 15+ (App Router)。
- 後端與資料庫：Supabase (PostgreSQL)。
- 身份驗證：Supabase Auth (整合 Next.js Middleware)。
- 樣式處理：Tailwind CSS。
- 語言：TypeScript (Strict Mode)。

## 3. 架構與開發規範 (Architectural Conventions)
- 元件原則：採用原子設計 (Atomic Design)，並優先使用 Server Components 以優化效能。
- 資料安全：嚴格執行 Supabase RLS (Row Level Security) 策略，禁止在前端直接繞過安全層存取資料。
- 狀態管理：優先使用 Next.js Server Actions 處理資料變更，保持資料流向清晰。
- 目錄結構：遵循 OpenSpec 標準目錄（`specs/`, `changes/`, `archive/`）進行規格管理。

## 4. 代碼質量與工具 (Code Quality & Tooling)
- ESLint：使用 `eslint-config-next` 進行靜態檢查。所有提交必須通過 Lint 檢查，禁止出現代碼異味 (Code Smell)。
- TypeScript：嚴禁使用 `any` 型別。所有函式與 API 回傳值必須定義明確的 Interface 或 Type。
- 自動化驗證：在執行 `/opsx:archive` 前，必須通過 `openspec validate --strict` 驗證規格格式。

## 5. 資料庫規範 (Database Conventions)

## 6. 註冊與登入
- 使用 Supabase Auth 進行身份驗證，僅搭配使用 Google OAuth，不使用其他登入方式。
- 所有使用者資料必須存儲在 `users` 表中，包含 `id`, `email`, `name`, `role` 等欄位。

