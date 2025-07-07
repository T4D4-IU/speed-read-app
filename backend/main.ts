import { Hono, Context } from 'hono/'
import { cors } from 'hono/cors' // 修正
import * as kuromoji from 'https://code4fukui.github.io/kuromoji-es/kuromoji.js' // 修正

// console.log('kuromoji object:', kuromoji); // 削除

const app = new Hono()

app.use(
  '*',
  cors({
    origin: '*', // Allow all origins
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly allow common methods
    allowHeaders: ['Content-Type', 'Authorization'], // Explicitly allow common headers
  })
)

app.get('/', (c: Context) => {
  return c.text('Hello Hono!')
})

app.post('/extract-text', async (c: Context) => {
  const { url } = await c.req.json()
  if (!url) {
    return c.json({ error: 'URL is required' }, 400)
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      return c.json({ error: `Failed to fetch URL: ${response.statusText}` }, response.status)
    }
    const html = await response.text()

    let cleanText = html.replace(/<script\b[^<]*(?:(?!<\/script>)[^<]*)*<\/script>/gi, '')
                        .replace(/<style\b[^<]*(?:(?!<\/style>)[^<]*)*<\/style>/gi, '')
                        .replace(/<[^>]*>/g, '')
                        .replace(/\s+/g, ' ').trim()

    return c.json({ text: cleanText })
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: `Internal server error: ${error.message}` }, 500)
    }
    return c.json({ error: `Internal server error: Unknown error` }, 500)
  }
})

let kuromojiTokenizer: any | null = null; // kuromojiのTokenizerインスタンスを保持する変数

app.post('/tokenize', async (c: Context) => {
  const { text } = await c.req.json()
  if (!text) {
    return c.json({ error: 'Text is required' }, 400)
  }

  try {
    if (!kuromojiTokenizer) {
      // kuromojiの辞書ファイルをロード
      kuromojiTokenizer = await kuromoji.kuromoji.createTokenizer(); // createTokenizerを使用
    }

    const tokens = kuromojiTokenizer.tokenize(text);
    return c.json({ tokens: tokens.map(token => token.surface_form) }) // kuromojiのトークン形式に合わせて修正
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: `Internal server error: ${error.message}` }, 500)
    }
    return c.json({ error: `Internal server error: Unknown error` }, 500)
  }
})

Deno.serve(app.fetch)