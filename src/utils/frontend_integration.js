// Replace the mockWebLookup method in your frontend code

async mockWebLookup(itemText) {
    console.log(`Starting REAL web scraping API call for: ${itemText}`);
    
    try {
        // Call your backend scraping service
        const response = await fetch('http://localhost:3001/api/scrape-item', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ itemText })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Backend scraping successful:', result);
        
        return {
            name: result.name,
            weight: result.weight,
            dimensions: result.dimensions || 'Variable',
            category: result.category || 'misc',
            confidence: result.confidence || 0.70,
            source: result.source || 'Web Scraping',
            description: result.description,
            specifications: result.specifications
        };
        
    } catch (error) {
        console.error('Backend scraping failed, trying frontend fallbacks:', error);
        
        // Fallback to frontend methods if backend fails
        try {
            // Try Wikipedia API directly
            const wikiResult = await this.searchWikipediaWorking(itemText);
            if (wikiResult) return wikiResult;
            
            // Try other frontend methods
            const wikidataResult = await this.searchWikidata(itemText);
            if (wikidataResult) return wikidataResult;
            
            // Final fallback to realistic estimates
            return await this.getRealisticData(itemText);
            
        } catch (fallbackError) {
            console.error('All scraping methods failed:', fallbackError);
            return null;
        }
    }
}

// Enhanced status messages for backend integration
showAiStatus(type, message) {
    this.elements.aiStatus.classList.remove('hidden', 'success', 'error');
    this.elements.statusIcon.classList.remove('loading', 'success', 'error');
    
    if (type === 'loading') {
        this.elements.statusIcon.classList.add('loading');
        this.elements.statusIcon.textContent = '🔍';
    } else if (type === 'success') {
        this.elements.aiStatus.classList.add('success');
        this.elements.statusIcon.classList.add('success');
        this.elements.statusIcon.textContent = '✅';
    } else if (type === 'error') {
        this.elements.aiStatus.classList.add('error');
        this.elements.statusIcon.classList.add('error');
        this.elements.statusIcon.textContent = '⚠️';
    }
    
    this.elements.statusText.textContent = message;
}

// Update generateAiItem to use better status messages
async generateAiItem(itemText) {
    if (this.pendingAiItems.has(itemText.toLowerCase())) {
        return null;
    }
    
    this.pendingAiItems.add(itemText.toLowerCase());
    this.showAiStatus('loading', `🔍 Searching multiple sources for "${itemText}"...`);
    
    try {
        const webSearchData = await this.mockWebLookup(itemText);
        
        if (webSearchData) {
            const newItem = {
                id: nextAiItemId++,
                name: webSearchData.name,
                weight: webSearchData.weight,
                dimensions: webSearchData.dimensions,
                category: webSearchData.category,
                type: "ai-generated",
                confidence: webSearchData.confidence,
                source: webSearchData.source,
                originalText: itemText,
                specifications: webSearchData.specifications,
                description: webSearchData.description
            };
            
            aiGeneratedItems.push(newItem);
            allInventoryItems.push(newItem);
            
            this.showAiStatus('success', 
                `✅ Found "${newItem.name}" - ${newItem.weight}kg (${newItem.source}, ${Math.round(newItem.confidence * 100)}% confidence)`
            );
            
            setTimeout(() => {
                this.hideAiStatus();
            }, 5000);
            
            return newItem;
        } else {
            throw new Error('No web data found');
        }
    } catch (error) {
        this.showAiStatus('error', `❌ Couldn't find reliable data for "${itemText}"`);
        setTimeout(() => {
            this.hideAiStatus();
        }, 3000);
        return null;
    } finally {
        this.pendingAiItems.delete(itemText.toLowerCase());
    }
}