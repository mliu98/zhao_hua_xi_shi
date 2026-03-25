# PRD: 朝花夕拾 — 从静态原型到可用记忆存档应用

## Problem Statement

用户希望将个人的地点记忆——照片、手写日记、阅读书籍——以原始形式永久保存，并通过地图和时间线重新找回。当前代码库是一个漂亮的静态原型，数据全部硬编码，没有持久化存储，无法真正使用。

## Solution

接入 Supabase 作为后端（数据库 + 文件存储），将静态原型改造为真实可用的个人记忆存档应用。用户可以在地图上添加曾去过的地点，为每个地点上传照片、记录手写或文字笔记、关联当时阅读的书籍（含读书笔记和摘录）。所有内容通过地图视图和时间线视图自由浏览，不做推荐或整理。

## User Stories

### 地点管理
1. 作为用户，我希望通过点击地图上的任意位置来创建一个新地点，这样我可以精确标记我去过的地方。
2. 作为用户，我希望通过输入城市名、地标名来搜索并定位一个地点，这样我可以方便地找到记忆中的位置。
3. 作为用户，我希望在搜索地点时看到候选结果列表，这样我可以选择最准确的一个。
4. 作为用户，我希望为每个地点设置一个自定义名称，这样地图上的标记对我来说是有意义的。
5. 作为用户，我希望在地图上看到我所有添加过的地点 pin，这样我可以直观看到自己走过的地方。
6. 作为用户，我希望点击地图上的 pin 进入该地点的记忆页面，这样我可以浏览那里的所有内容。
7. 作为用户，我希望多次去过同一地点的记忆都汇聚在同一个 pin 下，这样地图保持简洁。

### 照片记忆（Photo）
8. 作为用户，我希望为某个地点上传一张照片作为记忆，这样我可以保存那个地方的视觉影像。
9. 作为用户，我希望上传的照片被存储在云端，这样不会因为清除浏览器缓存而丢失。
10. 作为用户，我希望每条照片记忆自动记录当时的日期，这样我知道它属于哪个时间点。
11. 作为用户，我希望为照片添加一个简短描述（可选），这样我可以为这张图片加注上下文。

### 文字/手写笔记（Note）
12. 作为用户，我希望上传一张手写日记的照片作为笔记，这样手写内容得以原样保存。
13. 作为用户，我希望直接在应用内输入文字笔记，这样我可以记录当时的想法而不必手写。
14. 作为用户，我希望文字笔记和手写笔记都归属于 note 类型，在视觉上有统一但有所区分的呈现风格。
15. 作为用户，我希望每条笔记记忆自动附带日期，这样它们在时间线上有明确位置。

### 书籍关联（Book）
16. 作为用户，我希望搜索书名来关联一本书，这样书的封面和作者信息可以自动填充。
17. 作为用户，我希望在搜索不到某本书时手动输入书名、作者并上传封面图，这样冷门书籍也能被记录。
18. 作为用户，我希望为一本书写读书笔记（长文），这样我可以保存自己的理解和感受。
19. 作为用户，我希望为一本书添加多条独立的摘录（quotes），这样每一句打动我的话都有自己的位置。
20. 作为用户，我希望可以增删书籍摘录，这样我可以管理自己的引用列表。
21. 作为用户，我希望书籍记忆以简洁优美的卡片形式呈现（封面缩略图 + 书名 + 作者），这样视觉上与照片和笔记和谐共存。

### 地点记忆页面
22. 作为用户，我希望进入一个地点后看到该地点所有记忆以散落拼贴的方式排列，这样页面有自然、手工感。
23. 作为用户，我希望每条记忆的位置和旋转角度是稳定的（不随刷新改变），这样页面不会跳动。
24. 作为用户，我希望点击某条记忆进入它的详情页，这样我可以完整查看内容。
25. 作为用户，我希望在地点记忆页面有一个"添加记忆"入口，这样我可以直接在当前地点下新增内容。

### 记忆详情页
26. 作为用户，我希望查看照片记忆时图片以全尺寸展示，这样我能看清细节。
27. 作为用户，我希望查看书籍记忆时能看到封面、书名、作者、读书笔记和所有摘录，这样我能回顾完整的阅读记录。
28. 作为用户，我希望查看笔记记忆时，文字笔记以排版优美的方式呈现，手写照片以图片方式展示。
29. 作为用户，我希望每条记忆显示它的日期和所属地点，这样我知道它的时空背景。

### 时间线视图
30. 作为用户，我希望通过时间线视图看到所有地点的所有记忆按时间倒序排列，这样我可以像翻日记一样回顾过去。
31. 作为用户，我希望时间线中每条记忆显示所属地点名称，这样我不会失去空间感。
32. 作为用户，我希望时间线和地图视图可以方便地相互切换，这样我可以从不同角度浏览记忆。

### 通用
33. 作为用户，我希望所有数据持久化保存在 Supabase，这样不会因为浏览器操作丢失内容。
34. 作为用户，我希望应用保持当前的复古纸感视觉风格，这样记忆存档的氛围不被破坏。

## Implementation Decisions

### 数据库 Schema（Supabase PostgreSQL）

**`locations` 表**
- `id` UUID PRIMARY KEY
- `name` TEXT — 用户自定义名称
- `lat` FLOAT — 纬度
- `lng` FLOAT — 经度
- `created_at` TIMESTAMPTZ

**`memories` 表**
- `id` UUID PRIMARY KEY
- `location_id` UUID REFERENCES locations
- `type` ENUM('photo', 'note', 'book')
- `date` DATE — 用户指定的记忆日期
- `created_at` TIMESTAMPTZ

**`memory_photos` 表**（type = photo）
- `memory_id` UUID REFERENCES memories
- `image_url` TEXT — Supabase Storage 公开 URL
- `caption` TEXT NULLABLE

**`memory_notes` 表**（type = note）
- `memory_id` UUID REFERENCES memories
- `note_type` ENUM('handwritten', 'text')
- `image_url` TEXT NULLABLE — 手写笔记图片 URL
- `content` TEXT NULLABLE — 文字笔记内容

**`memory_books` 表**（type = book）
- `memory_id` UUID REFERENCES memories
- `title` TEXT
- `author` TEXT
- `cover_url` TEXT NULLABLE
- `reading_notes` TEXT NULLABLE

**`book_quotes` 表**
- `id` UUID PRIMARY KEY
- `memory_id` UUID REFERENCES memories
- `content` TEXT
- `order` INT — 排序

**Supabase Storage**
- Bucket：`memory-images`，公开访问
- 存储：照片、手写笔记图片、书籍封面（手动上传时）

### 模块设计

**`supabaseClient`**
- 初始化 Supabase JS client，读取环境变量 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
- 导出单例 client

**`locationService`**
- `getLocations()` — 读取所有地点
- `createLocation(name, lat, lng)` — 新增地点
- `searchByName(query)` — 调用 Nominatim API，返回候选地点列表（name, lat, lng）

**`memoryService`**
- `getMemoriesByLocation(locationId)` — 读取某地点所有记忆（含子表 join）
- `getAllMemories()` — 读取全部记忆，按 date 倒序（供 Timeline 使用）
- `createPhotoMemory(locationId, date, imageFile, caption)` — 上传图片后写库
- `createNoteMemory(locationId, date, noteType, content?, imageFile?)` — 写库
- `createBookMemory(locationId, date, bookData, quotes[])` — 写库

**`storageService`**
- `uploadImage(file, path)` — 上传到 Supabase Storage，返回公开 URL

**`bookSearchService`**
- `searchBooks(query)` — 调用 Open Library Search API，返回 `{title, author, coverUrl}[]`
- `getBookDetails(olid)` — 获取封面 URL

**`pseudoRandom`**
- `getMemoryLayout(memoryId)` — 输入 UUID，输出 `{x: number, y: number, rotation: number}`，使用确定性哈希算法，同一 id 永远返回相同结果

### 地图实现
- 继续使用 Leaflet + React Leaflet
- 地点 pin 从 Supabase 动态加载
- 地名搜索：前端调用 Nominatim `https://nominatim.openstreetmap.org/search`
- 点击地图空白处：捕获 lat/lng，弹出命名对话框创建地点

### 开发阶段
1. **Phase 1**：Supabase 接入 + 地点管理（创建、搜索、地图展示）
2. **Phase 2**：Photo 记忆（上传、存储、展示）
3. **Phase 3**：Note 记忆（文字 + 手写图片）
4. **Phase 4**：Book 记忆（Open Library 搜索 + 手动 + quotes）
5. **Phase 5**：Timeline 视图

## Testing Decisions

**什么是好的测试**：只测模块对外暴露的行为（输入 → 输出），不测内部实现细节。测试应该在模块接口不变的情况下，无论内部如何重构都能通过。

**需要测试的模块**：

- `locationService`：测试 `createLocation` 的参数校验、`searchByName` 对 Nominatim 响应的解析逻辑（mock HTTP）
- `memoryService`：测试各类型 memory 的创建逻辑、`getAllMemories` 返回的排序是否正确（mock Supabase client）
- `storageService`：测试文件上传成功/失败时的返回值（mock Supabase Storage）
- `bookSearchService`：测试对 Open Library API 响应的解析和转换（mock HTTP）
- `pseudoRandom`：测试同一 id 永远返回相同的 `{x, y, rotation}`，以及输出值在预期范围内——这是纯函数，无需 mock

UI 组件暂不写测试。

## Out of Scope

- 用户账号与身份验证（当前为公开访问）
- 多用户支持
- 记忆的编辑和删除功能
- 推送通知或提醒
- 社交功能（分享、评论）
- 移动端原生 App（iOS/Android）
- GPS 实时定位
- 离线支持
- 图片压缩/处理
- 搜索和筛选记忆

## Further Notes

- Nominatim 使用需遵守使用条款：需设置 `User-Agent` header，避免频繁请求（加 debounce）
- Open Library API 免费无需 key，封面图 URL 格式：`https://covers.openlibrary.org/b/id/{cover_id}-M.jpg`
- Supabase 免费套餐存储上限 1GB，对个人使用完全够用
- `pseudoRandom` 建议使用 mulberry32 或类似的简单确定性哈希，避免引入额外依赖
- 视觉风格（复古纸感、衬线字体、暖色调）需在所有新增界面中保持一致
