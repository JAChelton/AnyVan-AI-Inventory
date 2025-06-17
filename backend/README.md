# AI Inventory Scraper Backend

Enhanced web scraping backend using Firecrawl for reliable data extraction.

## Features

- **Firecrawl Integration**: Advanced web scraping with structured data extraction
- **Enhanced Product Database**: Comprehensive database of common items with specifications
- **Multi-source Search**: Wikipedia, product sites, and manufacturer websites
- **Intelligent Fallbacks**: Smart estimation when web data isn't available
- **Rate Limiting**: Respectful scraping with built-in delays

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Firecrawl**:
   - Sign up at [Firecrawl.dev](https://firecrawl.dev)
   - Get your API key
   - Add to `.env` file:
   ```
   FIRECRAWL_API_KEY=your_api_key_here
   ```

3. **Start the Server**:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## API Endpoints

### POST /api/scrape-item
Scrape item specifications from multiple sources.

**Request Body**:
```json
{
  "itemText": "exercise bike"
}
```

**Response**:
```json
{
  "name": "Exercise Bike",
  "weight": 45,
  "dimensions": "110×50×140cm",
  "category": "fitness",
  "confidence": 0.88,
  "source": "Firecrawl - amazon.com",
  "description": "Professional exercise bike specifications"
}
```

### GET /api/health
Health check endpoint with Firecrawl status.

## Environment Variables

- `FIRECRAWL_API_KEY`: Your Firecrawl API key (required)
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)

## Scraping Strategy

1. **Enhanced Database**: Check built-in database first (fastest)
2. **Firecrawl Product Search**: Search major retailer sites
3. **Firecrawl Wikipedia**: Extract from Wikipedia articles
4. **Smart Estimation**: Intelligent fallback based on item type

## Rate Limits

Firecrawl has built-in rate limiting. The service automatically handles:
- Request throttling
- Retry logic
- Error handling

## Supported Sites

- Amazon
- Home Depot
- Wayfair
- Wikipedia
- Google Search Results

## Error Handling

The service includes comprehensive error handling:
- Network timeouts
- API rate limits
- Invalid responses
- Graceful fallbacks