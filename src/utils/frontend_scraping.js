// Enhanced web scraping for frontend - replace the mockWebLookup method

async mockWebLookup(itemText) {
    console.log(`Starting REAL web search for: ${itemText}`);
    
    try {
        // Method 1: Wikipedia API (Most reliable, CORS-enabled)
        const wikiResult = await this.searchWikipediaAPI(itemText);
        if (wikiResult) return wikiResult;
        
        // Method 2: Product data APIs
        const productResult = await this.searchProductAPIs(itemText);
        if (productResult) return productResult;
        
        // Method 3: CORS proxies for general web scraping
        const webResult = await this.searchWithCORSProxy(itemText);
        if (webResult) return webResult;
        
        // Method 4: Fallback to realistic estimates
        return await this.getRealisticData(itemText);
        
    } catch (error) {
        console.error('Complete web lookup failure:', error);
        return null;
    }
}

// Enhanced Wikipedia API search
async searchWikipediaAPI(itemText) {
    try {
        console.log(`🔍 Searching Wikipedia API for: ${itemText}`);
        
        // Step 1: Search for articles
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(itemText)}&limit=3&namespace=0&format=json&origin=*`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (searchData[1] && searchData[1].length > 0) {
            const title = searchData[1][0];
            
            // Step 2: Get detailed content
            const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(title)}&format=json&origin=*`;
            const contentResponse = await fetch(contentUrl);
            const contentData = await contentResponse.json();
            
            const pages = contentData.query.pages;
            const pageId = Object.keys(pages)[0];
            const extract = pages[pageId]?.extract;
            
            if (extract) {
                console.log(`Found Wikipedia content for "${title}"`);
                
                const weight = this.extractWeightFromText(extract.toLowerCase());
                const dimensions = this.extractDimensionsFromText(extract.toLowerCase());
                const category = this.categorizeFromText(extract.toLowerCase(), itemText);
                
                return {
                    name: this.capitalizeWords(itemText),
                    weight: weight || this.estimateRealisticWeight(itemText),
                    dimensions: dimensions,
                    category: category,
                    confidence: weight ? 0.90 : 0.75,
                    source: 'Wikipedia',
                    description: extract.substring(0, 150) + '...'
                };
            }
        }
    } catch (error) {
        console.log('Wikipedia API failed:', error.message);
    }
    return null;
}

// Search product APIs (furniture, electronics, etc.)
async searchProductAPIs(itemText) {
    const apis = [
        // Best Buy API (for electronics)
        {
            name: 'Best Buy',
            url: `https://api.bestbuy.com/v1/products(search=${encodeURIComponent(itemText)})?format=json&apiKey=YOUR_API_KEY`,
            condition: itemText.toLowerCase().includes('tv') || itemText.toLowerCase().includes('electronic')
        },
        
        // Etsy API (for furniture and unique items)
        {
            name: 'Etsy',
            url: `https://openapi.etsy.com/v2/listings/active?keywords=${encodeURIComponent(itemText)}&api_key=YOUR_API_KEY`,
            condition: true
        }
    ];
    
    for (const api of apis) {
        if (api.condition) {
            try {
                console.log(`Trying ${api.name} API for: ${itemText}`);
                const response = await fetch(api.url);
                if (response.ok) {
                    const data = await response.json();
                    const result = this.parseAPIResponse(data, itemText, api.name);
                    if (result) return result;
                }
            } catch (error) {
                console.log(`${api.name} API failed:`, error.message);
            }
        }
    }
    
    return null;
}

// Use CORS proxies for general web scraping
async searchWithCORSProxy(itemText) {
    const proxies = [
        'https://api.allorigins.win/get?url=',
        'https://cors-anywhere.herokuapp.com/',
        'https://proxy.cors.sh/',
        'https://api.codetabs.com/v1/proxy?quest='
    ];
    
    const searchQueries = [
        `${itemText} weight specifications kg`,
        `${itemText} dimensions size`,
        `how much does ${itemText} weigh`
    ];
    
    for (const proxy of proxies) {
        for (const query of searchQueries) {
            try {
                const searchUrl = `https://duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
                const proxyUrl = proxy + encodeURIComponent(searchUrl);
                
                console.log(`Trying proxy search: ${query}`);
                
                const response = await fetch(proxyUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (response.ok) {
                    const data = await response.text();
                    const result = this.parseSearchHTML(data, itemText);
                    if (result) return result;
                }
                
            } catch (error) {
                console.log(`Proxy search failed:`, error.message);
                continue;
            }
        }
    }
    
    return null;
}

// Parse HTML search results for specifications
parseSearchHTML(html, itemText) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const bodyText = doc.body?.textContent?.toLowerCase() || html.toLowerCase();
        
        const weight = this.extractWeightFromText(bodyText);
        const dimensions = this.extractDimensionsFromText(bodyText);
        
        if (weight || dimensions !== 'Variable') {
            return {
                name: this.capitalizeWords(itemText),
                weight: weight || this.estimateRealisticWeight(itemText),
                dimensions: dimensions,
                category: this.categorizeFromText(bodyText, itemText),
                confidence: weight ? 0.80 : 0.65,
                source: 'Web Search'
            };
        }
    } catch (error) {
        console.error('HTML parsing failed:', error);
    }
    return null;
}

// Parse API responses from product APIs
parseAPIResponse(data, itemText, source) {
    try {
        let weight = null;
        let dimensions = 'Variable';
        
        // Best Buy API structure
        if (source === 'Best Buy' && data.products && data.products.length > 0) {
            const product = data.products[0];
            weight = this.extractWeightFromText(JSON.stringify(product).toLowerCase());
        }
        
        // Etsy API structure
        if (source === 'Etsy' && data.results && data.results.length > 0) {
            const listing = data.results[0];
            weight = this.extractWeightFromText(listing.description?.toLowerCase() || '');
        }
        
        if (weight) {
            return {
                name: this.capitalizeWords(itemText),
                weight: weight,
                dimensions: dimensions,
                category: this.categorizeFromText('', itemText),
                confidence: 0.85,
                source: source
            };
        }
    } catch (error) {
        console.error(`${source} API parsing failed:`, error);
    }
    return null;
}