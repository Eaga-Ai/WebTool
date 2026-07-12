# Overseas Pain Radar MVP

轻量静态双语 MVP：资料来自 `assets/data.js` 的人工演示数据；不会调用模型、爬虫或任何第三方 API。

## 本地预览

用任意静态服务器打开根目录，例如 `npx serve .`，然后访问 `index.html`。

## 更新资料

在 `assets/data.js` 增加或修改一条记录。发布前应由人工核对原始链接、短摘与证据等级。字段结构已按未来 Airtable/Supabase 导入预留。

## 部署

这是纯静态站点，可部署到 Vercel：导入仓库后将框架预设选择为 Other，输出目录保持根目录。不要把 DeepSeek、Airtable、Make 的密钥写入前端。

## 说明

机会工作台的数据仅写入访问者浏览器的 localStorage；复制与下载均为 Markdown，不上传服务器。
