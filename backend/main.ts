import { Hono, Context } from 'hono' // Contextを追加
import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts'
import { SudachiAnalyzer } from 'sudachi-wasm'

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

    const parser = new DOMParser()
    const document = parser.parseFromString(html, 'text/html')

    const articleElement = document?.querySelector('article') || document?.querySelector('main') || document?.body
    const textContent = articleElement?.textContent || ''

    const cleanText = textContent.replace(/<script\b[^<]*(?:(?!<\/script>)[^<]*)*<\/script>/gi, '')
                                 .replace(/<style\b[^<]*(?:(?!<\/style>)[^<]*)*<\/style>/gi, '')
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
    const analyzer = new SudachiAnalyzer()

    const jsonString = await analyzer.tokenize(text) // JSON文字列が返される
    const tokens = JSON.parse(jsonString) // JSONをパース

    // tokensの型が不明なため、any[]として扱うか、SudachiAnalyzerのドキュメントで型を確認
    return c.json({ tokens: (tokens as any[]).map(token => token.surface) })
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: `Internal server error: ${error.message}` }, 500)
    }
    return c.json({ error: `Internal server error: Unknown error` }, 500)
  }
})

Deno.serve(app.fetch)