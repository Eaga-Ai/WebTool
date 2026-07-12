# Overseas Pain Radar MVP

轻量静态双语 MVP：前端资料来自 `assets/data.js` 的内置演示或人工录入数据。网站本身不会实时抓取第三方资料；独立 ingestion 脚本只负责生成待审核候选，不会自动发布。

## 本地预览

用任意静态服务器打开根目录，例如 `npx serve .`，然后访问 `index.html`。

## 更新资料

在 `assets/data.js` 增加或修改一条记录。发布前应由人工核对原始链接、短摘与证据等级。字段结构已按未来 Airtable/Supabase 导入预留。

## 候选资料采集

采集脚本位于 `scripts/ingest.py`，只使用 Python 标准库，不需要安装额外依赖。它从 Reddit RSS、Hacker News Algolia API 和 GitHub Issues Search API 获取候选线索，合并到 `data/pending-review.json`。

运行全部来源：

```powershell
python scripts/ingest.py
```

先测试、不写入文件：

```powershell
python scripts/ingest.py --dry-run
```

只运行单个来源：

```powershell
python scripts/ingest.py --source reddit
python scripts/ingest.py --source hn
python scripts/ingest.py --source github
```

### 配置来源与关键词

编辑 `data/ingestion-config.json`：

- `match_keywords`：用于标记候选记录命中的词组，不决定自动发布。
- `reddit.feed_urls`：可添加多个 Reddit RSS 地址。
- `hacker_news.queries`：每个关键词分别请求 Hacker News Algolia API。
- `github.queries`：填写 GitHub Issues Search 查询语法。
- `hits_per_query` / `items_per_query`：限制每个查询获取的候选数量。

GitHub 未配置 Token 时也能访问公开接口，但限额较低。需要提高限额时，在当前终端设置环境变量，密钥不要提交到仓库：

```powershell
$env:GITHUB_TOKEN="your_token_here"
python scripts/ingest.py --source github
```

### 去重与人工审核

脚本读取现有 `data/pending-review.json`，若 `source_url` 已存在就跳过。每条新记录固定为：

- `status: pending_review`
- `source_verified: false`
- `is_demo: false`
- `ai_extract: {}`

人工发布前必须：

1. 打开 `source_url`，确认链接、发布时间、作者语境和原文仍然存在。
2. 删除广告、招聘、纯技术报错、重复转述和缺乏具体任务的记录。
3. 补充忠实翻译、用户类型、具体任务、当前方案、证据等级及理由。
4. 将审核通过的资料手工转换为 `assets/data.js` 的正式字段。
5. 确认 `source_verified` 后再发布；不要把整个 `pending-review.json` 直接接入前端。

`source_metadata` 保留不同平台的作者、查询词、仓库接口或讨论链接等原始字段；`ai_extract` 预留给后续离线整理，第一版保持为空。

## 部署

这是纯静态站点，可部署到 Vercel：导入仓库后将框架预设选择为 Other，输出目录保持根目录。不要把 DeepSeek、Airtable、Make 的密钥写入前端。

## 说明

机会工作台的数据仅写入访问者浏览器的 localStorage；复制与下载均为 Markdown，不上传服务器。
