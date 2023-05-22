import { load } from 'cheerio';

export interface Env {
  TYPEFULLY_API_KEY: string;
  OPENAI_API_KEY: string;
  TELEGRAM_TOKEN: string;
  TELEGRAM_TARGET_USERNAME: string;
}

const PAYMENT_TRANSLATION: {
  [TPayment: string]: string;
} = {
  Free: '免费',
  'Free Options': '部分免费',
  'Payment Required': '付费',
};

const TOPIC_TRANSLATION: {
  [TTopic: string]: string;
} = {
  '3D Modeling': '3D建模',
  '3D Printer': '3D打印',
  'Ad Blockers': '广告拦截',
  Advertising: '广告',
  Analytics: '数据分析',
  Art: '艺术',
  Blockchain: '区块链',
  Books: '书籍',
  Business: '商业',
  Community: '社区',
  Crypto: '加密货币',
  Data: '数据',
  Database: '数据库',
  'E-Commerce': '电子商务',
  Email: '电子邮件',
  Games: '游戏',
  'Graphics & Design': '图形设计',
  Hardware: '硬件',
  Icons: '图标',
  Illustration: '插画',
  'Indie Games': '独立游戏',
  Languages: '语言',
  Lifestyle: '生活',
  'Maker Tools': '创作者工具',
  Marketing: '市场营销',
  Meditation: '媒体',
  Medium: '媒体',
  Meetings: '会议',
  'Open Source': '开源',
  Photography: '摄影',
  Productivity: '生产力',
  Prototyping: '原型',
  Search: '搜索',
  Shopping: '购物',
  'User Experience': '用户体验',
  'Video Streaming': '视频流媒体',
  'Virtual Reality': '虚拟现实',
  Writing: '写作',
  News: '新闻',
  'Design Tools': '设计工具',
  'Social Media': '社交媒体',
  Sales: '销售',
  Tech: '技术',
  'Email Marketing': '邮件营销',
  'Developer Tools': '开发者工具',
  'Artificial Intelligence': '人工智能',
};

async function tweet(content: string, apiKey: string) {
  await fetch('https://api.typefully.com/v1/drafts/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      content: content,
      'schedule-date': 'next-free-slot',
    }),
  });
}

async function sendToTelegram(content: string, token: string, toUsername: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: `@${toUsername}`,
      text: content,
    }),
  });
}

async function translateSummary(summary: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `下面是一段关于一个产品的描述，请将其翻译为中文，只返回翻译结果，不用作多余解释。\n\n${summary}`,
        },
      ],
    }),
  });

  console.log(
    JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `下面是一段关于一个产品的描述，请将其翻译为中文，只返回翻译结果，不用作多余解释。\n\n${summary}`,
        },
      ],
    })
  );

  const json = (await response.json()) as any;

  return json.choices[0].message.content;
}

const handler: ExportedHandler<Env> = {
  async scheduled(controller, env, ctx) {
    const response = await fetch('https://producthunt.com');
    const html = await response.text();

    const $ = load(html);
    const $items = $('main div[data-test^="post-item-"]').slice(0, 3);
    const items = await Promise.all(
      $items.get().map(async (element) => {
        const $link = $(element).find('a[data-test^="post-name-"]');
        const name = $link.text();
        const link = new URL($link.attr('href') ?? '', 'https://producthunt.com').href;
        const summary = $(element).find('a[data-test$="-tagline"]').text();
        const votes = $(element).find('button[data-test="vote-button"]').text();
        const $info = $(element).find('a[data-test$="-tagline"]').parent().next().first();
        const payment = $info.find('div>div.noOfLines-undefined').text().trim();
        const topic = $info.find('a').text().trim();

        const translatedPayment = PAYMENT_TRANSLATION[payment] ?? payment;
        const translatedTopic = TOPIC_TRANSLATION[topic] ?? topic;
        const translatedSummary = await translateSummary(summary, env.OPENAI_API_KEY);

        return {
          name,
          link,
          summary: translatedSummary ?? summary,
          votes,
          payment: translatedPayment,
          topic: translatedTopic,
        };
      })
    );

    await tweet(
      items
        .map(
          (item) =>
            `「${item.name}」 ▲${item.votes}\n\n${item.summary}\n\n${item.payment ? `💰${item.payment}` : ''} 🌟${item.topic}\n\n${
              item.link
            }`
        )
        .join('\n\n\n\n'),
      env.TYPEFULLY_API_KEY
    );

    for (const item of items) {
      await sendToTelegram(
        `「${item.name}」 ▲${item.votes}\n\n${item.summary}\n\n${item.payment ? `💰${item.payment}` : ''} 🌟${item.topic}\n\n${item.link}`,
        env.TELEGRAM_TOKEN,
        env.TELEGRAM_TARGET_USERNAME
      );
    }
  },
};

export default handler;
