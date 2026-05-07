# PRD: 朝花夕拾 — 个人地点记忆存档应用

## Problem Statement

用户希望将个人的地点记忆——照片、视频、手写日记、阅读书籍——以原始形式永久保存，并通过地图、书架和时间线重新找回。

## Solution

以 Supabase 为后端（PostgreSQL + 文件存储），为用户提供一个私人的记忆存档工具。用户可以在地图上标记曾去过的地点，为每个地点上传照片/视频、记录手写或文字笔记、关联当时阅读的书籍（含读书笔记和摘录）。内容通过地图、书架和时间线三种视角自由浏览，不做推荐或整理。

## 设计风格

**主题**：复古纸感 + 水墨书卷

- **色板**：暖米色底（`#f5f2eb`）、深棕墨色文字（`#322e2a`）、中棕（`#635e59`）、浅棕（`#9a948d`）
- **字体**：LXGW WenKai（中文手写风格）为主字体，Crimson Text / Lora 衬线字体为西文备选，所有正文使用衬线字体
- **纸张质感**：SVG fractal noise 叠加纸张纹理（不透明度极低），营造真实纸张触感
- **视觉语言**：无圆角、无强烈阴影，以棕色系细线分割，整体扁平简洁，避免 Material / iOS 风格
- **动画**：Motion 库处理页面过渡，保持流畅但克制
- **一致性要求**：所有新增界面和组件必须沿用此色板和字体，不引入其他颜色或现代感控件

## User Stories

### 地点管理
1. 作为用户，我希望通过搜索城市名、地标名来找到地点，并从候选列表中选择最准确的一个。
2. 作为用户，我希望地点支持层级关系（如城市 → 国家），多次去同一城市的记忆汇聚在同一个 pin 下。
3. 作为用户，我希望在地图上看到所有地点的 pin，叶子节点用实心标记，有子地点的父节点用空心圆环标记。
4. 作为用户，我希望悬停在地图 pin 上时，看到该地点的随机照片和文字片段预览卡片。
5. 作为用户，我希望点击地图 pin 进入该地点的记忆页面，浏览该地点（含子地点）的所有记忆。

### 照片 / 视频记忆（Photo）
6. 作为用户，我希望为某个地点上传一张或多张照片，每张有可选描述。
7. 作为用户，我希望上传视频（≤ 50 MB），应用自动提取第一帧作为缩略图展示。
8. 作为用户，我希望多媒体内容存储在云端，不因清除缓存而丢失。
9. 作为用户，我希望在详情页看到多图/多视频画廊，支持缩放和前后翻页。

### 文字 / 手写笔记（Note）
10. 作为用户，我希望直接在应用内输入文字笔记。
11. 作为用户，我希望上传手写日记照片（可多张），可附加文字注解。
12. 作为用户，我希望手写笔记图片以"翻开书页"的双页展开样式呈现，保留手写的临场感。

### 书籍关联（Book）
13. 作为用户，我希望通过搜索书名自动填充书的封面和作者（来自 Open Library）。
14. 作为用户，我希望在搜索不到时手动输入书名、作者并上传封面图。
15. 作为用户，我希望为一本书写读书笔记，并添加多条独立摘录，支持增删。
16. 作为用户，我希望书籍可以关联地点，也可以不关联地点独立存在。
17. 作为用户，我希望在书架视图以书脊形式浏览所有书籍，按年份筛选，点击进入书籍详情。

### 地点记忆页面
18. 作为用户，我希望进入地点后看到该地点（含子地点）所有记忆以 masonry 拼贴方式排列。
19. 作为用户，我希望在地点记忆页面直接添加新记忆。
20. 作为用户，我希望点击某条记忆进入详情页，查看完整内容，并可编辑或删除。

### 时间线视图
21. 作为用户，我希望通过时间线视图看到所有记忆按时间倒序排列，每条显示所属地点名称。
22. 作为用户，我希望地图视图、书架视图、时间线视图可以方便地相互切换。

### 记忆编辑 / 删除
23. 作为用户，我希望编辑已有记忆的内容：修改描述、增删图片、更改日期。
24. 作为用户，我希望删除一条记忆（及其关联文件），操作不可逆需二次确认。

### 通用
25. 作为用户，我希望上传多文件时看到进度指示，知道当前上传状态。
26. 作为用户，所有数据持久化保存在 Supabase，不因浏览器操作丢失。

## Implementation Decisions

### 数据库 Schema（Supabase PostgreSQL）

**`locations` 表**
- `id` UUID PRIMARY KEY
- `name` TEXT
- `lat` FLOAT, `lng` FLOAT
- `parent_id` UUID REFERENCES locations NULLABLE — 层级结构
- `created_at` TIMESTAMPTZ

**`memories` 表**
- `id` UUID PRIMARY KEY
- `location_id` UUID REFERENCES locations NULLABLE
- `type` ENUM('photo', 'note', 'book')
- `date` DATE
- `created_at` TIMESTAMPTZ

**`memory_photos` 表**
- `memory_id` UUID REFERENCES memories
- `caption` TEXT NULLABLE

**`photo_images` 表**
- `id` UUID PRIMARY KEY
- `memory_id` UUID REFERENCES memories
- `image_url` TEXT NULLABLE
- `video_url` TEXT NULLABLE
- `thumbnail_url` TEXT NULLABLE — 视频第一帧
- `media_type` ENUM('photo', 'video')
- `order` INT

**`memory_notes` 表**
- `memory_id` UUID REFERENCES memories
- `note_type` ENUM('handwritten', 'text')
- `content` TEXT NULLABLE

**`note_images` 表**
- `id` UUID PRIMARY KEY
- `memory_id` UUID REFERENCES memories
- `image_url` TEXT
- `order` INT

**`books` 表**
- `id` UUID PRIMARY KEY
- `title` TEXT, `author` TEXT
- `cover_url` TEXT NULLABLE
- `reading_notes` TEXT NULLABLE
- `read_date` DATE NULLABLE
- `location_id` UUID REFERENCES locations NULLABLE
- `created_at` TIMESTAMPTZ

**`book_quotes` 表**
- `id` UUID PRIMARY KEY
- `book_id` UUID REFERENCES books
- `content` TEXT
- `order` INT

**`memory_books` 表**（memories 与 books 的关联）
- `memory_id` UUID REFERENCES memories
- `book_id` UUID REFERENCES books

**Supabase Storage Buckets**
- `photos/` — 照片
- `videos/` — 视频
- `notes/` — 手写笔记图片
- `books/` — 书籍封面

### 核心模块

**`supabaseClient`** — 初始化单例，读取 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`

**`locationService`**
- `getLocations()` / `createLocation(name, lat, lng, parentId?)` / `deleteLocation(id)`
- `buildLocationTree()` — 构建层级树，支持聚合子地点记忆
- `searchByName(query)` — Nominatim API，带 debounce，设置 `User-Agent`

**`memoryService`**
- `getMemoriesByLocation(locationId, includeDescendants?)` — 含子地点聚合
- `getAllMemories()` — 按 date 倒序，供时间线使用
- `createPhotoMemory / createNoteMemory / createBookMemory` — 各类型写库
- `updateMemory / deleteMemory` — 编辑和删除（含 Storage 文件清理）

**`bookService`**
- `getBooks(year?)` — 按年份筛选，供书架使用
- `createBook / updateBook / deleteBook`
- 书脊颜色：基于 book ID 哈希到 8 色调色板，确定性稳定

**`storageService`**
- `uploadImage(file, path, onProgress?)` — 上传并返回公开 URL
- `uploadVideo(file, path, onProgress?)` — 同上，附带缩略图生成

**`bookSearchService`**
- `searchBooks(query)` — Open Library Search API，返回 `{title, author, coverUrl}[]`
- 封面 URL 格式：`https://covers.openlibrary.org/b/id/{cover_id}-M.jpg`

**`pseudoRandom`**
- `getMemoryLayout(memoryId)` — mulberry32 哈希，输出稳定的 `{x, y, rotation}`

### 视图架构

三个主视图通过底部 Tab 切换：

| Tab | 视图 | 核心功能 |
|-----|------|----------|
| 地图 | MapScreen | Leaflet 地图 + 层级 pin + hover 卡片 |
| 书架 | BookshelfScreen | 书脊排列 + 年份筛选 + BookDetailScreen |
| 时间线 | TimelineScreen | 全部记忆倒序 + 地点标签 |

地点详情页（LocationMemoryScreen）通过路由导航，不占用主 Tab。

### 地图实现
- Leaflet + React Leaflet
- 叶子节点：实心圆形标记；父节点：空心圆环标记
- 悬停卡片：随机展示该地点的一张照片 + 一段文字片段
- 地名搜索：Nominatim，`User-Agent` header 必须设置，输入 debounce 400ms

## Testing Decisions

只测模块对外暴露的行为，不测内部实现。

| 模块 | 测试重点 |
|------|----------|
| `locationService` | 参数校验、Nominatim 响应解析（mock HTTP）、层级树构建 |
| `memoryService` | 各类型创建逻辑、时间线排序正确性（mock Supabase client）|
| `bookService` | 书脊颜色确定性、年份过滤正确性 |
| `storageService` | 上传成功/失败返回值（mock Supabase Storage）|
| `bookSearchService` | Open Library 响应解析（mock HTTP）|
| `pseudoRandom` | 同一 id 永远返回相同结果，输出值在范围内（纯函数，无需 mock）|

UI 组件不写测试。

## 已完成功能（截至 2026-04）

- [x] Phase 1：Supabase 接入 + 地点管理（含层级地点、地图 pin、Nominatim 搜索）
- [x] Phase 2：Photo 记忆（多图上传、视频支持、进度指示）
- [x] Phase 3：Note 记忆（文字 + 手写，双页展开布局）
- [x] Phase 4：Book 记忆（Open Library 搜索、书架视图、书脊颜色、年份筛选）
- [x] Phase 5：Timeline 视图
- [x] 记忆编辑 / 删除（含文件清理）
- [x] 地图 hover 预览卡片
- [x] 图片懒加载

## Out of Scope

- 用户账号与身份验证（当前为公开访问）
- 多用户支持
- 推送通知或提醒
- 社交功能（分享、评论）
- 移动端原生 App
- GPS 实时定位
- 离线支持
- 图片压缩/处理
- 记忆搜索和筛选

## Further Notes

- Nominatim 使用条款：必须设置 `User-Agent` header，避免频繁请求（debounce）
- Open Library API 免费无需 key
- Supabase 免费套餐存储上限 1GB，个人使用足够
- 视频上传限制 50 MB/文件，在前端做大小校验
- 书脊颜色使用 mulberry32 哈希确保稳定，不依赖额外库
