# Blackbox AI Integration for Actualités Enrichment

## Overview

The Blackbox AI API is now integrated into the AccesDirectAide actualités pipeline to automatically enrich news articles with:

1. **FALC Summaries** (Facile à Lire et à Comprendre) - Simplified, accessible summaries
2. **Change Summaries** ("Ce que ça change") - What the news means for users
3. **Next Steps** ("Que faire maintenant") - Actionable steps users should take
4. **Enhanced Topic Classification** - AI-powered topic detection with reasoning
5. **Impact Detection** - Intelligent classification of news impact (alerte/important/info)

## Architecture

### Files Added

- `/vercel/sandbox/api/lib/actualites/ai-enrichment.js` - Core AI enrichment module
- `/vercel/sandbox/.env.local` - Environment configuration (gitignored)

### Files Modified

- `/vercel/sandbox/api/lib/actualites/connectors/BaseConnector.js` - Integrated AI enrichment into ingestion pipeline

## How It Works

### 1. API Configuration

The module uses the Blackbox AI API at `https://api.blackbox.ai/v1/chat/completions`:

```javascript
const BLACKBOX_API_KEY = process.env.BLACKBOX_API_KEY;
```

**Current API Key** (configured in `.env.local`):
```
BLACKBOX_API_KEY=bb_cef7606af0a40214c42f5f8abbdbfb485c011216849accf10f31543ed0e5506e
```

### 2. Enrichment Functions

#### `generateFALCSummary()`
Creates simple, accessible summaries following FALC guidelines:
- Short, simple sentences
- Clear vocabulary (no jargon)
- 3-4 sentences max
- Preserves essential information

#### `extractChangeSummary()`
Analyzes what concretely changes:
- Which rights/aids/amounts change?
- For whom?
- Since when?

Returns `null` if nothing significant changes.

#### `extractNextSteps()`
Provides actionable guidance:
- Required steps
- Documents to prepare
- Important deadlines
- Where to get information

Returns `null` if no action required.

#### `enhanceTopicClassification()`
AI-powered topic detection that:
- Considers the full context
- Handles disambiguation (e.g., "international" vs "nouveaux_arrivants")
- Returns topics + primary topic + reasoning
- Validates against available topic taxonomy

#### `detectImpactWithReasoning()`
Classifies impact level with explanation:
- **alerte**: Short deadline, risk of losing rights, fraud, crisis, urgency
- **important**: New aid, revaluation, procedure change, extended eligibility
- **info**: Reminder, general publication, minor update

#### `enrichArticle()` (Pipeline)
Main orchestrator that runs all enrichments in parallel for performance.

### 3. Integration into BaseConnector

The `BaseConnector.run()` method now:

1. Discovers & parses articles (existing logic)
2. **Optionally calls `enrichArticle()`** if `BLACKBOX_API_KEY` is set
3. Merges AI enrichments with rule-based classification
4. Falls back gracefully if AI enrichment fails

**Auto-enabled when**: `process.env.BLACKBOX_API_KEY` is set
**Can be disabled**: Pass `useAI: false` to `connector.run()`

### 4. Data Flow

```
Raw Article
    ↓
Rule-based Classification (topics, impact, audience)
    ↓
AI Enrichment (if API key set)
    ↓
Merged Result (AI enrichments override rule-based when available)
    ↓
Database Upsert
```

## Usage

### Automatic (Recommended)

When `BLACKBOX_API_KEY` is set in environment, AI enrichment happens automatically during ingestion:

```javascript
const connector = new RssConnector(config);
const articles = await connector.run({ limit: 20 }); // AI enrichment enabled
```

### Manual Control

```javascript
// Disable AI enrichment
const articles = await connector.run({ limit: 20, useAI: false });

// Or call enrichment directly
import { enrichArticle } from './api/lib/actualites/ai-enrichment.js';

const enrichments = await enrichArticle({
  title: "...",
  excerpt: "...",
  content: "...",
  topics: ["logement", "handicap"],
  impact: "important"
});
```

## API Request Format

```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "Tu es un expert en simplification de l'information administrative française. Tu réponds de manière concise, factuelle et actionnable."
    },
    {
      "role": "user",
      "content": "<specific prompt>"
    }
  ],
  "max_tokens": 500,
  "temperature": 0.3
}
```

## Error Handling

The integration is **graceful and non-blocking**:

1. If `BLACKBOX_API_KEY` is not set → AI enrichment is skipped
2. If API request fails → Warning logged, ingestion continues
3. If JSON parsing fails → Warning logged, field remains empty
4. If AI returns invalid data → Validation filters it out

**Key principle**: AI enrichment failures never block article ingestion.

## Performance Considerations

- **Parallel execution**: All 5 enrichment functions run concurrently via `Promise.all()`
- **Token limits**: Configured per function (150-500 tokens)
- **Low temperature**: Set to 0.3 for factual, consistent responses
- **Text truncation**: Long content is truncated to 800-1500 chars before sending to API

## Security

- API key stored in `.env.local` (gitignored)
- No user-provided content injected into prompts without sanitization
- Text length limits prevent excessive API costs
- Responses validated before database insertion

## Monitoring & Observability

Logs include:
```
[AI Enrichment] Enriching article: <title>...
[AI Enrichment] Enriched N fields
[AI Enrichment] Blackbox API error (status): <error>
[<ConnectorName>] AI enrichment failed, continuing without it: <error>
```

**Recommended**: Monitor these logs via Sentry or logging aggregator to track:
- AI enrichment success rate
- API errors
- Average enrichment time
- Cost per article

## Cost Estimation

Assuming **gpt-4o** pricing:
- Input: ~$5/1M tokens
- Output: ~$15/1M tokens

Per article (~2000 input tokens, ~500 output tokens):
- Cost: ~$0.02 per article
- 1000 articles/month: ~$20/month

**Optimization**: Consider running AI enrichment only on:
- `impact = 'important'` or `impact = 'alerte'`
- `source_type = 'official'`
- New articles (not refreshes)

## Testing AI Enrichment

```bash
# Set API key
export BLACKBOX_API_KEY=bb_cef7606af0a40214c42f5f8abbdbfb485c011216849accf10f31543ed0e5506e

# Run ingestion pipeline
node scripts/ingest-actualites.js

# Check logs for "[AI Enrichment]" messages
```

## Future Enhancements

1. **Caching**: Store AI responses to avoid re-enriching unchanged articles
2. **Batch processing**: Group multiple articles into single API call
3. **Model selection**: Allow config to choose between gpt-4o / claude-sonnet-4
4. **Fact-checking**: Validate AI claims against official sources
5. **Multi-language**: Generate FALC summaries in multiple languages
6. **User feedback**: Allow users to rate AI summaries for continuous improvement

## Troubleshooting

### "BLACKBOX_API_KEY not set, skipping AI enrichment"
→ Check `.env.local` file exists and key is correct

### "Blackbox API error (401)"
→ API key is invalid or expired

### "Blackbox API error (429)"
→ Rate limit exceeded, implement backoff or reduce ingestion frequency

### "Failed to parse topic classification response"
→ AI returned non-JSON, check API model version

### No AI fields in database
→ Verify connector calls `map()` with `aiEnrichments` parameter

---

**Status**: ✅ Integrated and ready to use
**Next Steps**: Deploy to Vercel, set `BLACKBOX_API_KEY` in dashboard, monitor logs
