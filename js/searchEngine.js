class SearchEngine {
    constructor(vectorStore) {
        this.vectorStore = vectorStore;
        this.markup = [];
        this.laborRate = 95.00;
    }

    async initialize() {
        console.log('Initializing SearchEngine...');
        try {
            const data = await this.vectorStore.db.loadData();
            if (data && data.markup) {
                this.markup = data.markup;
                console.log('Loaded markup ranges:', this.markup);
            }
            if (data && data.laborRate) {
                this.laborRate = parseFloat(data.laborRate);
                console.log('Loaded labor rate:', this.laborRate);
            }
            await this.vectorStore.initialize();
        } catch (error) {
            console.error('Failed to initialize SearchEngine:', error);
            throw error;
        }
    }

    calculateMarkup(cost) {
        console.log('Calculating markup for cost:', cost);
        if (!cost || cost <= 0) {
            console.log('Zero or negative cost, returning 0');
            return 0;
        }

        const fixedCost = parseFloat(cost.toFixed(2));
        const markupRange = this.markup.find(range => 
            fixedCost >= parseFloat(range.fromCost) && 
            fixedCost <= parseFloat(range.throughCost)
        );

        if (markupRange) {
            const markedUpCost = fixedCost * markupRange.markup;
            console.log(`Applied ${markupRange.markup}x markup to $${fixedCost} = $${markedUpCost}`);
            return markedUpCost;
        }

        console.warn('No markup range found for cost:', fixedCost);
        return fixedCost;
    }

    calculateTotal(result) {
        console.log('Calculating total for result:', result);
        
        // Calculate labor cost
        const laborHours = parseFloat(result.laborTime) || 0;
        const laborCost = laborHours * this.laborRate;
        console.log(`Labor: ${laborHours}hrs * $${this.laborRate}/hr = $${laborCost}`);
        
        // Calculate parts cost with markup
        let partsTotal = 0;
        if (result.associatedParts && result.associatedParts.length > 0) {
            partsTotal = result.associatedParts.reduce((sum, part) => {
                const partCost = parseFloat(part.cost) || 0;
                const quantity = parseInt(part.quantity) || 1;
                const markedUpCost = this.calculateMarkup(partCost);
                console.log(`Part ${part.partNumber}: $${partCost} x ${quantity} with markup = $${markedUpCost * quantity}`);
                return sum + (markedUpCost * quantity);
            }, 0);
        } else if (result.partsCost) {
            partsTotal = this.calculateMarkup(parseFloat(result.partsCost));
            console.log(`Parts total with markup: $${partsTotal}`);
        }

        const total = laborCost + partsTotal;
        console.log(`Final total: Labor($${laborCost}) + Parts($${partsTotal}) = $${total}`);
        
        return total;
    }

    formatSearchResult(result) {
        const total = this.calculateTotal(result);
        return {
            ...result,
            formattedTotal: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(total)
        };
    }

    async search(query) {
        if (!this.vectorStore.hasData()) {
            throw new Error('Search index not loaded');
        }

        try {
            const results = await this.vectorStore.search(query);
            return this.formatResults(results);
        } catch (error) {
            console.error('Search failed:', error);
            throw error;
        }
    }

    formatResults(results) {
        return results.map(result => {
            const formattedResult = this.formatSearchResult(result);
            const isRepair = 'repairNumber' in result;
            
            let resultHTML = `<div class="search-result ${isRepair ? 'repair' : 'part'}">`;
            
            if (isRepair) {
                const laborCost = (parseFloat(result.laborTime) || 0) * this.laborRate;
                resultHTML += `
                    <div class="result-header">
                        <div class="repair-info">
                            <h3>Repair #${result.repairNumber}</h3>
                            <p class="repair-group">${result.repairGroup || ''}</p>
                            <p class="repair-description">${result.description || 'No description available'}</p>
                        </div>
                        <div class="cost-info">
                            <span class="total-label">Total:</span>
                            <span class="total-amount">${formattedResult.formattedTotal}</span>
                        </div>
                    </div>
                    <div class="result-details">
                        <div class="labor-section">
                            <h4>Labor Details</h4>
                            <p>Time: ${result.laborTime} hours</p>
                            <p>Rate: ${new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                            }).format(this.laborRate)}/hr</p>
                            <p>Labor Cost: ${new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                            }).format(laborCost)}</p>
                        </div>`;

                if (formattedResult.associatedParts && formattedResult.associatedParts.length > 0) {
                    resultHTML += `
                        <div class="parts-section">
                            <h4>Required Parts</h4>
                            <table class="parts-table">
                                <thead>
                                    <tr>
                                        <th>Part #</th>
                                        <th>Description</th>
                                        <th>Manufacturer</th>
                                        <th>Mfr Part #</th>
                                        <th>Qty</th>
                                        <th>Base Cost</th>
                                        <th>Marked Up</th>
                                        <th>Extended</th>
                                    </tr>
                                </thead>
                                <tbody>`;
                    
                    formattedResult.associatedParts.forEach(part => {
                        const baseCost = parseFloat(part.cost) || 0;
                        const quantity = parseInt(part.quantity) || 1;
                        const markedUpCost = this.calculateMarkup(baseCost);
                        const extendedCost = markedUpCost * quantity;
                        
                        resultHTML += `
                            <tr>
                                <td>${part.partNumber}</td>
                                <td>${part.description}</td>
                                <td>${part.manufacturer || ''}</td>
                                <td>${part.manufacturerPartNumber || ''}</td>
                                <td>${quantity}</td>
                                <td>${new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD'
                                }).format(baseCost)}</td>
                                <td>${new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD'
                                }).format(markedUpCost)}</td>
                                <td>${new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD'
                                }).format(extendedCost)}</td>
                            </tr>`;
                    });
                    
                    resultHTML += `
                                </tbody>
                            </table>
                        </div>`;
                }
            } else {
                const baseCost = parseFloat(result.cost) || 0;
                const markedUpCost = this.calculateMarkup(baseCost);
                
                resultHTML += `
                    <div class="result-header">
                        <div class="part-info">
                            <h3>Part #${result.partNumber}</h3>
                            <p class="part-description">${result.description || 'No description available'}</p>
                        </div>
                        <div class="cost-info">
                            <span class="total-label">Total:</span>
                            <span class="total-amount">${formattedResult.formattedTotal}</span>
                        </div>
                    </div>
                    <div class="result-details">
                        <div class="part-details">
                            ${result.manufacturer ? `<p><strong>Manufacturer:</strong> ${result.manufacturer}</p>` : ''}
                            ${result.manufacturerPartNumber ? `<p><strong>Mfr Part #:</strong> ${result.manufacturerPartNumber}</p>` : ''}
                            <p><strong>Base Cost:</strong> ${new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                            }).format(baseCost)}</p>
                            <p><strong>Marked Up Cost:</strong> ${new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                            }).format(markedUpCost)}</p>
                        </div>
                    </div>`;
            }
            
            resultHTML += `</div>`;
            return resultHTML;
        }).join('');
    }

    async clearCache() {
        console.log('Clearing search engine cache...');
        try {
            await this.vectorStore.clearCache();
            this.markup = [];
            this.laborRate = 0;
            console.log('Search engine cache cleared');
        } catch (error) {
            console.error('Failed to clear search engine cache:', error);
            throw error;
        }
    }

    hasData() {
        return this.vectorStore.hasData() && 
               Array.isArray(this.markup) && 
               this.markup.length > 0 && 
               typeof this.laborRate === 'number' && 
               this.laborRate > 0;
    }
}
