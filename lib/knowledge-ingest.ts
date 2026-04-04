import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { KNOWLEDGE_SOURCES } from './knowledge-sources'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function stripHtml(html: string): string {
  // Remove script and style tags and their content
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '')
  // Remove nav, header, footer
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, '')
  text = text.replace(/<header[\s\S]*?<\/header>/gi, '')
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, '')
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ')
  // Decode common entities
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const words = text.split(/\s+/)
  if (words.length <= chunkSize) return [text]

  const chunks: string[] = []
  let start = 0
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length)
    chunks.push(words.slice(start, end).join(' '))
    if (end >= words.length) break
    start = end - overlap
  }
  return chunks
}

function contentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) throw new Error('VOYAGE_API_KEY not set')

  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'voyage-3',
      input: text.substring(0, 8000),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Voyage API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  return data.data[0].embedding
}

export async function queryKnowledgeBase(query: string, limit: number = 10): Promise<Array<{ content: string; source_name: string; section_reference: string | null }>> {
  try {
    const embedding = await getEmbedding(query)

    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      match_count: limit,
    })

    if (error) {
      // Fallback: try raw SQL if RPC not set up
      console.error('RPC match_knowledge not available, using direct query')
      const { data: fallbackData } = await supabase
        .from('knowledge_base')
        .select('content, source_name, section_reference')
        .limit(limit)

      return fallbackData || []
    }

    return data || []
  } catch (err) {
    console.error('Knowledge base query failed:', err)
    return []
  }
}

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface IngestResult {
  source: string
  url: string
  fetch_ok: boolean
  fetch_status: number | null
  content_length: number
  chunks_total: number
  chunks_added: number
  chunks_updated: number
  chunks_skipped: number
  error?: string
}

export async function ingestSource(source: { url: string; name: string }): Promise<IngestResult> {
  const result: IngestResult = {
    source: source.name,
    url: source.url,
    fetch_ok: false,
    fetch_status: null,
    content_length: 0,
    chunks_total: 0,
    chunks_added: 0,
    chunks_updated: 0,
    chunks_skipped: 0,
  }

  try {
    // Fetch the page with browser UA and 30s timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    let res: Response
    try {
      res = await fetch(source.url, {
        headers: {
          'User-Agent': BROWSER_UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.9',
        },
        signal: controller.signal,
      })
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : 'Unknown fetch error'
      console.error(`[KB Ingest] Fetch failed for ${source.url}: ${msg}`)
      result.error = `Fetch failed: ${msg}`
      return result
    } finally {
      clearTimeout(timeout)
    }

    result.fetch_status = res.status
    if (!res.ok) {
      console.error(`[KB Ingest] HTTP ${res.status} for ${source.url}`)
      result.error = `HTTP ${res.status}`
      return result
    }
    result.fetch_ok = true

    const html = await res.text()
    const text = stripHtml(html)
    result.content_length = text.length

    if (text.length < 200) {
      console.warn(`[KB Ingest] Content too short (${text.length} chars) for ${source.url} - likely blocked or error page`)
      result.error = `Content too short (${text.length} chars) - likely blocked`
      return result
    }

    // Chunk the content
    const chunks = chunkText(text)
    result.chunks_total = chunks.length

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const hash = contentHash(chunk)
      const sectionRef = `${source.name} [chunk ${i + 1}/${chunks.length}]`

      // Check if chunk already exists with same hash
      const { data: existing } = await supabase
        .from('knowledge_base')
        .select('id, content_hash')
        .eq('source_url', source.url)
        .eq('section_reference', sectionRef)
        .single()

      if (existing && existing.content_hash === hash) {
        result.chunks_skipped++
        continue
      }

      // Generate embedding
      const embedding = await getEmbedding(chunk)

      if (existing) {
        // Update existing chunk
        await supabase
          .from('knowledge_base')
          .update({
            content: chunk,
            embedding: embedding as unknown as string,
            content_hash: hash,
            last_fetched_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        result.chunks_updated++
      } else {
        // Insert new chunk
        await supabase
          .from('knowledge_base')
          .insert({
            source_url: source.url,
            source_name: source.name,
            section_reference: sectionRef,
            content: chunk,
            embedding: embedding as unknown as string,
            content_hash: hash,
          })

        result.chunks_added++
      }

      // Rate limit: small delay between embedding calls
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  } catch (err) {
    result.error = err instanceof Error ? err.message : 'Unknown error'
  }

  return result
}

export async function ingestAll(): Promise<{ results: IngestResult[]; totalAdded: number; totalUpdated: number; totalSkipped: number; totalErrors: number }> {
  const results: IngestResult[] = []
  let totalAdded = 0, totalUpdated = 0, totalSkipped = 0, totalErrors = 0

  for (const source of KNOWLEDGE_SOURCES) {
    const result = await ingestSource(source)
    results.push(result)
    totalAdded += result.chunks_added
    totalUpdated += result.chunks_updated
    totalSkipped += result.chunks_skipped
    if (result.error) totalErrors++
  }

  return { results, totalAdded, totalUpdated, totalSkipped, totalErrors }
}
