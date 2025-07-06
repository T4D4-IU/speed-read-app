import { Hono, Context } from 'hono/'
// import { DOMParser } from 'https://esm.sh/linkedom@0.16.1/esm/index.js' // 削除
import loadSudachi from 'npm:@hiogawa/sudachi.wasm' // 修正

const app = new Hono()

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

app.post('/tokenize', async (c: Context) => {
  const { text } = await c.req.json()
  if (!text) {
    return c.json({ error: 'Text is required' }, 400)
  }

  try {
    const sudachi = await loadSudachi() // loadSudachi関数を呼び出す

    const tokens = sudachi.tokenize(text) // インスタンスメソッドを呼び出し
    return c.json({ tokens: tokens.map(token => token.surface) })
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: `Internal server error: ${error.message}` }, 500)
    }
    return c.json({ error: `Internal server error: Unknown error` }, 500)
  }
})

Deno.serve(app.fetch)