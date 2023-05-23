## ProductHunt 每日摘要

[![Twitter](https://img.shields.io/static/v1?style=social&label=Follow&message=ph_summary&logo=twitter)](https://twitter.com/ph_summary)
[![Twitter](https://img.shields.io/static/v1?style=social&label=Subscribe&message=PHSummary&logo=telegram)](https://t.me/PHSummary)

该项目会在每天中午 12 点抓取 ProductHunt 的当日排名，并将投票前三的产品介绍翻译为中文自动发送到 Twitter 账号 [ph_summary](https://twitter.com/ph_summary) 和 Telegram 频道 [PHSummary](https://t.me/PHSummary)。

该项目部署在 [Cloudflare Workers](https://workers.cloudflare.com) 之上，使用了 Cron 定时器在每天中午 11 点 55 分自动执行。如果你也有类似需求或想法，可以以该项目作为参考。

执行时的完整流程如下：

- 抓取 [Product Hunt](https://producthunt.com) 的主页
- 使用 [cheerio](https://cheerio.js.org) 解析 HTML 结构并提取数据
- 使用 [OpenAI](https://platform.openai.com) 的 ChatGPT API 翻译产品简述
- 使用 [Typefully](https://typefully.com) 的 API 在 [Twitter 账号](https://twitter.com/ph_summary) 发送推文
- 使用 [Telegram](https://telegram.org) 的 API 向 [Telegram 频道](https://t.me/PHSummary) 发送消息

### 本地测试

1. 安装依赖

```sh
npm install
```

2. 配置环境变量，在项目根目录创建 `.dev.vars` 文件并在 [环境变量](#环境变量) 中填入正确的值。

3. 启动服务

```sh
npm run start
```

4. 测试定时执行脚本

```sh
npm run test
```

> 如果想要 Telegram 的机器人在频道中发送消息，需要将该机器人添加到频道的管理员中。

### 部署

直接执行以下命令可将该脚本部署到 Cloudflare Workers 中

```sh
npm run deploy
```

如果是首次部署，在部署成功后，需到该 Worker 的控制台中配置相应的 [环境变量](#环境变量)。

### 环境变量

该脚本会用到的一些敏感信息，将会使用环境变量的形式进行访问。在本地开发测试时，会使用项目根目录的 `.dev.vars` 文件作为变量来源。在部署到 Cloudflare Workers 时，可在对应 Worker 中进行配置。具体变量如下：

```sh
# Typefully 的 API Key，用于发送推文
TYPEFULLY_API_KEY = XXX
# OpenAI 的 API Key，用于翻译简述到中文
OPENAI_API_KEY = sk-XXX
# Telegram Bot 的 Token，用于向频道中发送消息
TELEGRAM_TOKEN = XXX
# Telegram 的频道用户名，用于指定将要发送消息的频道
TELEGRAM_TARGET_USERNAME = XXX
```

### License

MIT
