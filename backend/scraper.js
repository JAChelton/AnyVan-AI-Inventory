// backend/scraper.js - Enhanced Web scraping service with Firecrawl
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FirecrawlApp = require('@mendable/firecrawl-js').default;

const app = express();
app.use(cors());
app.use(express.json());

class WebScraper {
    constructor() {
        // Initialize Firecrawl with API key from environment
        this.firecrawl = new FirecrawlApp({ 
            apiKey: process.env.FIRECRAWL_API_KEY 
        });
        console.log('Firecrawl initialized');
    }

    // Enhanced realistic database with freezer coverage
    getEnhancedRealisticData(itemText) {
        const cleanedText = itemText.toLowerCase()
            .replace(/^\d+\s+/, '')
            .replace(/\b(weber|gas|electric|manual|automatic|large|small|medium|mini)\s+/g, '')
            .trim();

        const enhancedDatabase = {
            // Freezers & Refrigeration - EXPANDED
            'freezer': { weight: 65, dimensions: '140×70×85cm', category: 'appliances', confidence: 0.85 },
            'chest freezer': { weight: 65, dimensions: '140×70×85cm', category: 'appliances', confidence: 0.88 },
            'double freezer': { weight: 90, dimensions: '160×80×90cm', category: 'appliances', confidence: 0.85 },
            'double chest freezer': { weight: 90, dimensions: '160×80×90cm', category: 'appliances', confidence: 0.88 },
            'upright freezer': { weight: 55, dimensions: '60×65×180cm', category: 'appliances', confidence: 0.85 },
            'deep freezer': { weight: 70, dimensions: '150×75×85cm', category: 'appliances', confidence: 0.85 },
            'large freezer': { weight: 85, dimensions: '160×80×90cm', category: 'appliances', confidence: 0.85 },
            'small freezer': { weight: 45, dimensions: '100×60×70cm', category: 'appliances', confidence: 0.85 },
            
            // BBQ & Outdoor Cooking
            'bbq': { weight: 45, dimensions: '120×60×90cm', category: 'outdoor', confidence: 0.85 },
            'barbecue': { weight: 50, dimensions: '130×65×95cm', category: 'outdoor', confidence: 0.85 },
            'grill': { weight: 40, dimensions: '110×55×85cm', category: 'outdoor', confidence: 0.80 },
            'gas grill': { weight: 45, dimensions: '120×60×90cm', category: 'outdoor', confidence: 0.85 },
            'charcoal grill': { weight: 35, dimensions: '100×55×80cm', category: 'outdoor', confidence: 0.85 },
            
            // Exercise Equipment
            'exercise bike': { weight: 45, dimensions: '110×50×140cm', category: 'fitness', confidence: 0.88 },
            'stationary bike': { weight: 42, dimensions: '105×48×135cm', category: 'fitness', confidence: 0.88 },
            'bike': { weight: 20, dimensions: '95×30×140cm', category: 'fitness', confidence: 0.75 },
            'treadmill': { weight: 85, dimensions: '180×80×140cm', category: 'fitness', confidence: 0.90 },
            'elliptical': { weight: 70, dimensions: '170×70×160cm', category: 'fitness', confidence: 0.88 },
            'rowing machine': { weight: 35, dimensions: '220×50×55cm', category: 'fitness', confidence: 0.85 },
            'weight bench': { weight: 25, dimensions: '120×35×45cm', category: 'fitness', confidence: 0.85 },
            
            // Musical Instruments
            'piano': { weight: 180, dimensions: '150×60×110cm', category: 'musical', confidence: 0.95 },
            'upright piano': { weight: 200, dimensions: '155×65×115cm', category: 'musical', confidence: 0.95 },
            'grand piano': { weight: 400, dimensions: '200×150×100cm', category: 'musical', confidence: 0.95 },
            'keyboard': { weight: 15, dimensions: '130×35×15cm', category: 'musical', confidence: 0.85 },
            'drum kit': { weight: 35, dimensions: '150×120×120cm', category: 'musical', confidence: 0.85 },
            'guitar': { weight: 3, dimensions: '100×35×10cm', category: 'musical', confidence: 0.90 },
            
            // Large Furniture & Recreation
            'pool table': { weight: 320, dimensions: '280×150×80cm', category: 'recreation', confidence: 0.92 },
            'billiard table': { weight: 350, dimensions: '290×160×82cm', category: 'recreation', confidence: 0.92 },
            'ping pong table': { weight: 45, dimensions: '275×152×76cm', category: 'recreation', confidence: 0.88 },
            'table tennis table': { weight: 45, dimensions: '275×152×76cm', category: 'recreation', confidence: 0.88 },
            'foosball table': { weight: 65, dimensions: '140×75×90cm', category: 'recreation', confidence: 0.85 },
            
            // Hot Tubs & Spas
            'hot tub': { weight: 450, dimensions: '220×220×90cm', category: 'outdoor', confidence: 0.88 },
            'jacuzzi': { weight: 500, dimensions: '240×240×95cm', category: 'outdoor', confidence: 0.88 },
            'spa': { weight: 480, dimensions: '230×230×92cm', category: 'outdoor', confidence: 0.85 },
            'sauna': { weight: 200, dimensions: '200×150×200cm', category: 'outdoor', confidence: 0.80 },
            
            // Appliances
            'wine fridge': { weight: 55, dimensions: '60×60×140cm', category: 'appliances', confidence: 0.85 },
            'beer fridge': { weight: 45, dimensions: '50×55×85cm', category: 'appliances', confidence: 0.85 },
            'mini fridge': { weight: 25, dimensions: '44×47×46cm', category: 'appliances', confidence: 0.85 },
            
            // Aquarium & Pets
            'aquarium': { weight: 40, dimensions: '120×45×55cm', category: 'aquarium', confidence: 0.85 },
            'fish tank': { weight: 35, dimensions: '100×40×50cm', category: 'aquarium', confidence: 0.85 },
            'terrarium': { weight: 25, dimensions: '80×40×60cm', category: 'aquarium', confidence: 0.80 },
            
            // Tools & Workshop
            'tool chest': { weight: 35, dimensions: '70×35×40cm', category: 'tools', confidence: 0.85 },
            'toolbox': { weight: 15, dimensions: '50×25×30cm', category: 'tools', confidence: 0.85 },
            'workbench': { weight: 80, dimensions: '150×60×85cm', category: 'tools', confidence: 0.85 },
            'air compressor': { weight: 45, dimensions: '60×40×70cm', category: 'tools', confidence: 0.85 },
            'generator': { weight: 55, dimensions: '70×50×55cm', category: 'tools', confidence: 0.85 },
            
            // Garden & Outdoor
            'garden shed': { weight: 150, dimensions: '240×180×200cm', category: 'outdoor', confidence: 0.82 },
            'shed': { weight: 120, dimensions: '200×150×180cm', category: 'outdoor', confidence: 0.80 },
            'greenhouse': { weight: 85, dimensions: '300×200×200cm', category: 'outdoor', confidence: 0.80 },
            'gazebo': { weight: 120, dimensions: '300×300×250cm', category: 'outdoor', confidence: 0.75 },
            'trampoline': { weight: 75, dimensions: '400×400×90cm', category: 'outdoor', confidence: 0.85 },
            
            // Security & Storage
            'safe': { weight: 120, dimensions: '60×45×35cm', category: 'security', confidence: 0.90 },
            'gun safe': { weight: 200, dimensions: '80×50×40cm', category: 'security', confidence: 0.90 },
            'filing cabinet': { weight: 40, dimensions: '40×60×130cm', category: 'storage', confidence: 0.88 },
            
            // Gaming & Entertainment
            'arcade machine': { weight: 135, dimensions: '70×85×180cm', category: 'recreation', confidence: 0.88 },
            'pinball machine': { weight: 125, dimensions: '140×75×180cm', category: 'recreation', confidence: 0.90 },
            'jukebox': { weight: 95, dimensions: '80×65×160cm', category: 'recreation', confidence: 0.85 }
        };

        // Exact match first
        if (enhancedDatabase[cleanedText]) {
            const item = enhancedDatabase[cleanedText];
            console.log(`✅ Found exact match in enhanced database: ${cleanedText}`);
            return {
                name: this.capitalizeWords(itemText),
                weight: item.weight,
                dimensions: item.dimensions,
                category: item.category,
                confidence: item.confidence,
                source: 'Product Database',
                description: `Professional specifications for ${itemText}`
            };
        }

        // Partial matching with better scoring
        const partialMatches = [];
        for (const [key, value] of Object.entries(enhancedDatabase)) {
            const keyWords = key.split(' ');
            const cleanedWords = cleanedText.split(' ');
            
            let matchScore = 0;
            let totalWords = Math.max(keyWords.length, cleanedWords.length);
            
            keyWords.forEach(keyWord => {
                if (cleanedWords.some(cleanedWord => 
                    cleanedWord.includes(keyWord) || keyWord.includes(cleanedWord)
                )) {
                    matchScore++;
                }
            });
            
            const matchRatio = matchScore / totalWords;
            
            if (matchRatio >= 0.5) {
                partialMatches.push({
                    key, value, score: matchRatio, wordMatches: matchScore
                });
            }
        }
        
        // Sort by match quality
        partialMatches.sort((a, b) => {
            if (a.score !== b.score) return b.score - a.score;
            return b.wordMatches - a.wordMatches;
        });
        
        if (partialMatches.length > 0) {
            const bestMatch = partialMatches[0];
            console.log(`✅ Found partial match: ${bestMatch.key} (score: ${bestMatch.score})`);
            
            return {
                name: this.capitalizeWords(itemText),
                weight: bestMatch.value.weight,
                dimensions: bestMatch.value.dimensions,
                category: bestMatch.value.category,
                confidence: bestMatch.value.confidence - 0.05,
                source: 'Product Database',
                description: `Specifications based on similar item: ${bestMatch.key}`
            };
        }
        
        return null;
    }

    // Method 1: Firecrawl-powered product search
    async scrapeProductSites(itemText) {
        try {
            console.log(`🔥 Firecrawl search for: ${itemText}`);
            
            // Define target sites for product information
            const productSites = [
                `https://www.google.com/search?q=${encodeURIComponent(itemText + ' specifications weight dimensions')}`,
                `https://www.amazon.com/s?k=${encodeURIComponent(itemText)}`,
                `https://www.homedepot.com/s/${encodeURIComponent(itemText)}`,
                `https://www.wayfair.com/keyword.php?keyword=${encodeURIComponent(itemText)}`
            ];

            // Try each site with Firecrawl
            for (const url of productSites.slice(0, 2)) { // Limit to 2 sites to avoid rate limits
                try {
                    console.log(`🔥 Scraping: ${new URL(url).hostname}`);
                    
                    const scrapeResult = await this.firecrawl.scrapeUrl(url, {
                        formats: ['markdown', 'extract'],
                        extract: {
                            schema: {
                                type: 'object',
                                properties: {
                                    productName: { type: 'string' },
                                    weight: { type: 'string' },
                                    dimensions: { type: 'string' },
                                    specifications: { type: 'string' },
                                    description: { type: 'string' }
                                }
                            }
                        },
                        timeout: 10000
                    });

                    if (scrapeResult.success && scrapeResult.data) {
                        const extractedData = scrapeResult.data.extract || {};
                        const markdown = scrapeResult.data.markdown || '';
                        
                        // Extract specifications from structured data or markdown
                        const weight = this.extractWeightFromData(extractedData, markdown);
                        const dimensions = this.extractDimensionsFromData(extractedData, markdown);
                        
                        if (weight || dimensions !== 'Variable') {
                            return {
                                name: extractedData.productName || this.capitalizeWords(itemText),
                                weight: weight || this.estimateWeight(itemText),
                                dimensions: dimensions,
                                category: this.categorizeItem(itemText),
                                confidence: weight ? 0.90 : 0.75,
                                source: `Firecrawl - ${new URL(url).hostname}`,
                                description: extractedData.description || extractedData.specifications,
                                specifications: extractedData
                            };
                        }
                    }
                } catch (siteError) {
                    console.log(`Firecrawl failed for ${new URL(url).hostname}:`, siteError.message);
                    continue;
                }
            }
            
        } catch (error) {
            console.error('Firecrawl product search failed:', error);
        }
        return null;
    }

    // Method 2: Enhanced Wikipedia search with Firecrawl
    async scrapeWikipediaWithFirecrawl(itemText) {
        try {
            console.log(`🔥 Firecrawl Wikipedia search for: ${itemText}`);
            
            // First, get Wikipedia search results
            const searchResponse = await axios.get(`https://en.wikipedia.org/w/api.php`, {
                params: {
                    action: 'opensearch',
                    search: itemText,
                    limit: 3,
                    namespace: 0,
                    format: 'json'
                },
                timeout: 5000
            });
            
            if (searchResponse.data[1] && searchResponse.data[1].length > 0) {
                const title = searchResponse.data[1][0];
                const wikipediaUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
                
                // Use Firecrawl to extract structured data from Wikipedia
                const scrapeResult = await this.firecrawl.scrapeUrl(wikipediaUrl, {
                    formats: ['markdown', 'extract'],
                    extract: {
                        schema: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                summary: { type: 'string' },
                                specifications: { type: 'string' },
                                weight: { type: 'string' },
                                dimensions: { type: 'string' },
                                infobox: { type: 'object' }
                            }
                        }
                    },
                    timeout: 8000
                });
                
                if (scrapeResult.success && scrapeResult.data) {
                    const extractedData = scrapeResult.data.extract || {};
                    const markdown = scrapeResult.data.markdown || '';
                    
                    const weight = this.extractWeightFromData(extractedData, markdown);
                    const dimensions = this.extractDimensionsFromData(extractedData, markdown);
                    
                    return {
                        name: extractedData.title || title,
                        weight: weight || this.estimateWeight(itemText),
                        dimensions: dimensions,
                        category: this.categorizeFromText(markdown.toLowerCase(), itemText),
                        confidence: weight ? 0.88 : 0.75,
                        source: 'Firecrawl - Wikipedia',
                        description: extractedData.summary || markdown.substring(0, 200) + '...',
                        wikipediaTitle: title
                    };
                }
            }
        } catch (error) {
            console.error('Firecrawl Wikipedia search failed:', error);
        }
        return null;
    }

    // Enhanced data extraction methods for Firecrawl results
    extractWeightFromData(extractedData, markdown) {
        // Check extracted structured data first
        if (extractedData.weight) {
            const weight = this.extractWeightFromText(extractedData.weight.toLowerCase());
            if (weight) return weight;
        }
        
        // Check specifications
        if (extractedData.specifications) {
            const weight = this.extractWeightFromText(extractedData.specifications.toLowerCase());
            if (weight) return weight;
        }
        
        // Check infobox data
        if (extractedData.infobox && typeof extractedData.infobox === 'object') {
            for (const [key, value] of Object.entries(extractedData.infobox)) {
                if (key.toLowerCase().includes('weight') && typeof value === 'string') {
                    const weight = this.extractWeightFromText(value.toLowerCase());
                    if (weight) return weight;
                }
            }
        }
        
        // Fallback to markdown content
        return this.extractWeightFromText(markdown.toLowerCase());
    }

    extractDimensionsFromData(extractedData, markdown) {
        // Check extracted structured data first
        if (extractedData.dimensions) {
            const dimensions = this.extractDimensionsFromText(extractedData.dimensions.toLowerCase());
            if (dimensions !== 'Variable') return dimensions;
        }
        
        // Check specifications
        if (extractedData.specifications) {
            const dimensions = this.extractDimensionsFromText(extractedData.specifications.toLowerCase());
            if (dimensions !== 'Variable') return dimensions;
        }
        
        // Check infobox data
        if (extractedData.infobox && typeof extractedData.infobox === 'object') {
            for (const [key, value] of Object.entries(extractedData.infobox)) {
                if ((key.toLowerCase().includes('dimension') || key.toLowerCase().includes('size')) && typeof value === 'string') {
                    const dimensions = this.extractDimensionsFromText(value.toLowerCase());
                    if (dimensions !== 'Variable') return dimensions;
                }
            }
        }
        
        // Fallback to markdown content
        return this.extractDimensionsFromText(markdown.toLowerCase());
    }

    // Utility methods (keeping existing ones)
    extractWeightFromText(text) {
        const weightPatterns = [
            /(?:weighs?|weight|mass)[\s:]*(?:about|around|approximately|roughly)?\s*(\d+(?:\.\d+)?)\s*(?:kg|kilogram|kilograms)/gi,
            /(?:weighs?|weight|mass)[\s:]*(?:about|around|approximately|roughly)?\s*(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)/gi,
            /(\d+(?:\.\d+)?)\s*(?:kg|kilogram|kilograms)(?:\s+(?:in\s+)?weight)?/gi,
            /(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)(?:\s+(?:in\s+)?weight)?/gi,
            /weight[\s:]+(\d+(?:\.\d+)?)\s*(?:kg|lb)/gi
        ];
        
        for (const pattern of weightPatterns) {
            pattern.lastIndex = 0;
            const matches = [...text.matchAll(pattern)];
            
            for (const match of matches) {
                let weight = parseFloat(match[1]);
                
                if (match[0].toLowerCase().includes('lb') || match[0].toLowerCase().includes('pound')) {
                    weight = weight * 0.453592;
                }
                
                if (weight >= 0.5 && weight <= 5000) {
                    return Math.round(weight);
                }
            }
        }
        
        return null;
    }

    extractDimensionsFromText(text) {
        const dimensionPatterns = [
            /(?:dimensions?|size|measures?)[\s:]*(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)\s*(?:x|×|by)?\s*(\d+(?:\.\d+)?)?\s*(?:cm|mm|m|inch|ft)/gi,
            /(\d+(?:\.\d+)?)\s*(?:x|×)\s*(\d+(?:\.\d+)?)\s*(?:x|×)?\s*(\d+(?:\.\d+)?)?\s*(?:cm|mm)/gi
        ];
        
        for (const pattern of dimensionPatterns) {
            pattern.lastIndex = 0;
            const match = pattern.exec(text);
            if (match) {
                const dim1 = Math.round(parseFloat(match[1]));
                const dim2 = Math.round(parseFloat(match[2]));
                const dim3 = match[3] ? Math.round(parseFloat(match[3])) : null;
                
                if (dim1 > 0 && dim2 > 0) {
                    let dimensions = `${dim1}×${dim2}`;
                    if (dim3 && dim3 > 0) {
                        dimensions += `×${dim3}`;
                    }
                    return dimensions + 'cm';
                }
            }
        }
        
        return 'Variable';
    }

    categorizeFromText(text, itemText) {
        const lowerText = text.toLowerCase();
        const lowerItem = itemText.toLowerCase();
        
        const categoryKeywords = {
            'musical': ['music', 'instrument', 'piano', 'guitar', 'drum'],
            'fitness': ['exercise', 'fitness', 'gym', 'workout', 'training'],
            'furniture': ['furniture', 'table', 'chair', 'sofa', 'bed'],
            'appliances': ['appliance', 'machine', 'electronic', 'kitchen', 'freezer'],
            'outdoor': ['garden', 'outdoor', 'patio', 'yard', 'shed', 'bbq'],
            'tools': ['tool', 'equipment', 'workshop', 'construction']
        };
        
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => lowerItem.includes(keyword) || lowerText.includes(keyword))) {
                return category;
            }
        }
        
        return 'misc';
    }

    categorizeItem(itemText) {
        return this.categorizeFromText('', itemText);
    }

    estimateWeight(itemText) {
        const lowerText = itemText.toLowerCase();
        let baseWeight = 20;
        
        if (lowerText.includes('piano')) return 180;
        if (lowerText.includes('treadmill')) return 85;
        if (lowerText.includes('safe')) return 120;
        if (lowerText.includes('pool table')) return 300;
        if (lowerText.includes('exercise bike')) return 45;
        if (lowerText.includes('freezer')) return 65;
        if (lowerText.includes('bbq') || lowerText.includes('grill')) return 45;
        
        if (lowerText.includes('large')) baseWeight *= 2;
        if (lowerText.includes('small')) baseWeight *= 0.5;
        if (lowerText.includes('heavy')) baseWeight *= 3;
        if (lowerText.includes('double')) baseWeight *= 1.5;
        
        return Math.max(1, Math.round(baseWeight));
    }

    capitalizeWords(str) {
        return str.replace(/\b\w/g, l => l.toUpperCase());
    }

    async cleanup() {
        // Firecrawl doesn't require explicit cleanup like Puppeteer
        console.log('Firecrawl cleanup completed');
    }
}

// Initialize scraper
const scraper = new WebScraper();

// API endpoint
app.post('/api/scrape-item', async (req, res) => {
    const { itemText } = req.body;
    
    if (!itemText) {
        return res.status(400).json({ error: 'itemText is required' });
    }
    
    console.log(`🚀 API request for: ${itemText}`);
    
    try {
        // Try enhanced database first (fastest and most reliable)
        let result = scraper.getEnhancedRealisticData(itemText);
        if (result) {
            console.log('✅ Enhanced database success');
            return res.json(result);
        }
        
        // Try Firecrawl product search
        result = await scraper.scrapeProductSites(itemText);
        if (result) {
            console.log('✅ Firecrawl product search success');
            return res.json(result);
        }
        
        // Try Firecrawl Wikipedia search
        result = await scraper.scrapeWikipediaWithFirecrawl(itemText);
        if (result) {
            console.log('✅ Firecrawl Wikipedia success');
            return res.json(result);
        }
        
        // Fallback to estimated data
        const fallbackResult = {
            name: scraper.capitalizeWords(itemText),
            weight: scraper.estimateWeight(itemText),
            dimensions: 'Variable',
            category: scraper.categorizeItem(itemText),
            confidence: 0.60,
            source: 'Estimated'
        };
        
        console.log('📊 Using fallback estimate');
        res.json(fallbackResult);
        
    } catch (error) {
        console.error('Scraping API error:', error);
        res.status(500).json({ error: 'Scraping failed', message: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        firecrawl: !!process.env.FIRECRAWL_API_KEY ? 'configured' : 'missing_api_key'
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await scraper.cleanup();
    process.exit(0);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Enhanced Firecrawl scraping server running on port ${PORT}`);
    console.log(`🔥 Firecrawl API key: ${process.env.FIRECRAWL_API_KEY ? 'configured' : 'MISSING - Please set FIRECRAWL_API_KEY'}`);
});

module.exports = { WebScraper };