// backend/scraper.js - Web scraping service
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

class WebScraper {
    constructor() {
        this.browser = null;
        this.initBrowser();
    }

    async initBrowser() {
        try {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            console.log('Browser initialized');
        } catch (error) {
            console.error('Browser init failed:', error);
        }
    }

    // Method 1: Google Shopping scraping
    async scrapeGoogleShopping(itemText) {
        try {
            console.log(`Scraping Google Shopping for: ${itemText}`);
            
            if (!this.browser) await this.initBrowser();
            const page = await this.browser.newPage();
            
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            
            const searchUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(itemText + ' weight specifications')}`;
            await page.goto(searchUrl, { waitUntil: 'networkidle2' });
            
            const products = await page.evaluate(() => {
                const items = [];
                const productElements = document.querySelectorAll('[data-sh-sr]');
                
                productElements.forEach(el => {
                    const title = el.querySelector('h3')?.textContent;
                    const price = el.querySelector('[data-price]')?.textContent;
                    const description = el.querySelector('.translate-content')?.textContent;
                    
                    if (title && description) {
                        items.push({ title, price, description });
                    }
                });
                
                return items.slice(0, 5);
            });
            
            await page.close();
            
            // Extract specifications from product descriptions
            for (const product of products) {
                const weight = this.extractWeightFromText(product.description.toLowerCase());
                const dimensions = this.extractDimensionsFromText(product.description.toLowerCase());
                
                if (weight || dimensions !== 'Variable') {
                    return {
                        name: this.capitalizeWords(itemText),
                        weight: weight || this.estimateWeight(itemText),
                        dimensions: dimensions,
                        category: this.categorizeItem(itemText),
                        confidence: weight ? 0.90 : 0.75,
                        source: 'Google Shopping',
                        productTitle: product.title,
                        price: product.price
                    };
                }
            }
            
        } catch (error) {
            console.error('Google Shopping scraping failed:', error);
        }
        return null;
    }

    // Method 2: Amazon product scraping
    async scrapeAmazon(itemText) {
        try {
            console.log(`Scraping Amazon for: ${itemText}`);
            
            if (!this.browser) await this.initBrowser();
            const page = await this.browser.newPage();
            
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            
            const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(itemText)}`;
            await page.goto(searchUrl, { waitUntil: 'networkidle2' });
            
            // Get first product link
            const firstProductUrl = await page.evaluate(() => {
                const firstProduct = document.querySelector('[data-asin] h2 a');
                return firstProduct ? 'https://www.amazon.com' + firstProduct.getAttribute('href') : null;
            });
            
            if (firstProductUrl) {
                await page.goto(firstProductUrl, { waitUntil: 'networkidle2' });
                
                const productData = await page.evaluate(() => {
                    const specifications = {};
                    
                    // Extract from product details
                    const detailRows = document.querySelectorAll('#productDetails_detailBullets_sections1 tr, #productDetails_techSpec_section_1 tr');
                    detailRows.forEach(row => {
                        const key = row.querySelector('td:first-child')?.textContent?.trim();
                        const value = row.querySelector('td:last-child')?.textContent?.trim();
                        if (key && value) {
                            specifications[key.toLowerCase()] = value;
                        }
                    });
                    
                    // Extract from feature bullets
                    const features = Array.from(document.querySelectorAll('#feature-bullets li span'))
                        .map(el => el.textContent.trim())
                        .join(' ');
                    
                    return { specifications, features };
                });
                
                await page.close();
                
                const allText = JSON.stringify(productData).toLowerCase();
                const weight = this.extractWeightFromText(allText);
                const dimensions = this.extractDimensionsFromText(allText);
                
                if (weight || dimensions !== 'Variable') {
                    return {
                        name: this.capitalizeWords(itemText),
                        weight: weight || this.estimateWeight(itemText),
                        dimensions: dimensions,
                        category: this.categorizeItem(itemText),
                        confidence: weight ? 0.88 : 0.70,
                        source: 'Amazon',
                        specifications: productData.specifications
                    };
                }
            }
            
        } catch (error) {
            console.error('Amazon scraping failed:', error);
        }
        return null;
    }

    // Method 3: Manufacturer websites scraping
    async scrapeManufacturerSites(itemText) {
        const manufacturerSites = [
            'https://www.ikea.com/us/en/search/products/?q=',
            'https://www.wayfair.com/keyword.php?keyword=',
            'https://www.homedepot.com/s/',
            'https://www.lowes.com/search?searchTerm='
        ];
        
        for (const baseUrl of manufacturerSites) {
            try {
                console.log(`Scraping ${baseUrl} for: ${itemText}`);
                
                if (!this.browser) await this.initBrowser();
                const page = await this.browser.newPage();
                
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
                
                const searchUrl = baseUrl + encodeURIComponent(itemText);
                await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 10000 });
                
                // Generic product page scraping
                const productData = await page.evaluate(() => {
                    const text = document.body.textContent.toLowerCase();
                    const specs = {};
                    
                    // Look for specification tables
                    const specTables = document.querySelectorAll('table, .specifications, .product-details, .specs');
                    specTables.forEach(table => {
                        const cells = table.querySelectorAll('td, th, li, span');
                        cells.forEach(cell => {
                            const cellText = cell.textContent.trim();
                            if (cellText.includes('weight') || cellText.includes('dimension') || cellText.includes('size')) {
                                specs[Math.random()] = cellText;
                            }
                        });
                    });
                    
                    return { text: text.substring(0, 5000), specs };
                });
                
                await page.close();
                
                const weight = this.extractWeightFromText(productData.text);
                const dimensions = this.extractDimensionsFromText(productData.text);
                
                if (weight || dimensions !== 'Variable') {
                    const siteName = new URL(baseUrl).hostname.replace('www.', '');
                    return {
                        name: this.capitalizeWords(itemText),
                        weight: weight || this.estimateWeight(itemText),
                        dimensions: dimensions,
                        category: this.categorizeItem(itemText),
                        confidence: weight ? 0.85 : 0.70,
                        source: siteName,
                        specifications: productData.specs
                    };
                }
                
            } catch (error) {
                console.error(`Manufacturer site scraping failed for ${baseUrl}:`, error);
                continue;
            }
        }
        
        return null;
    }

    // Method 4: Wikipedia + Wikidata comprehensive search
    async scrapeWikipedia(itemText) {
        try {
            console.log(`Comprehensive Wikipedia search for: ${itemText}`);
            
            // Search Wikipedia
            const searchResponse = await axios.get(`https://en.wikipedia.org/w/api.php`, {
                params: {
                    action: 'opensearch',
                    search: itemText,
                    limit: 3,
                    namespace: 0,
                    format: 'json'
                }
            });
            
            if (searchResponse.data[1] && searchResponse.data[1].length > 0) {
                const title = searchResponse.data[1][0];
                
                // Get full article content
                const contentResponse = await axios.get(`https://en.wikipedia.org/w/api.php`, {
                    params: {
                        action: 'query',
                        prop: 'extracts|pageprops',
                        titles: title,
                        explaintext: true,
                        format: 'json'
                    }
                });
                
                const pages = contentResponse.data.query.pages;
                const pageId = Object.keys(pages)[0];
                const extract = pages[pageId]?.extract;
                
                if (extract) {
                    const weight = this.extractWeightFromText(extract.toLowerCase());
                    const dimensions = this.extractDimensionsFromText(extract.toLowerCase());
                    
                    return {
                        name: this.capitalizeWords(itemText),
                        weight: weight || this.estimateWeight(itemText),
                        dimensions: dimensions,
                        category: this.categorizeFromText(extract.toLowerCase(), itemText),
                        confidence: weight ? 0.88 : 0.75,
                        source: 'Wikipedia',
                        description: extract.substring(0, 200) + '...',
                        wikipediaTitle: title
                    };
                }
            }
        } catch (error) {
            console.error('Wikipedia comprehensive search failed:', error);
        }
        return null;
    }

    // Utility methods (same as frontend)
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
            'appliances': ['appliance', 'machine', 'electronic', 'kitchen'],
            'outdoor': ['garden', 'outdoor', 'patio', 'yard', 'shed'],
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
        
        if (lowerText.includes('large')) baseWeight *= 2;
        if (lowerText.includes('small')) baseWeight *= 0.5;
        if (lowerText.includes('heavy')) baseWeight *= 3;
        
        return Math.max(1, Math.round(baseWeight));
    }

    capitalizeWords(str) {
        return str.replace(/\b\w/g, l => l.toUpperCase());
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
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
    
    console.log(`API request for: ${itemText}`);
    
    try {
        // Try different scraping methods in order of reliability
        let result = await scraper.scrapeWikipedia(itemText);
        if (result) {
            console.log('✅ Wikipedia success');
            return res.json(result);
        }
        
        result = await scraper.scrapeGoogleShopping(itemText);
        if (result) {
            console.log('✅ Google Shopping success');
            return res.json(result);
        }
        
        result = await scraper.scrapeAmazon(itemText);
        if (result) {
            console.log('✅ Amazon success');
            return res.json(result);
        }
        
        result = await scraper.scrapeManufacturerSites(itemText);
        if (result) {
            console.log('✅ Manufacturer sites success');
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
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await scraper.cleanup();
    process.exit(0);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Web scraping server running on port ${PORT}`);
});

module.exports = { WebScraper };