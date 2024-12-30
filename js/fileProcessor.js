class FileProcessor {
    constructor(vectorStore) {
        this.vectorStore = vectorStore;
        this.progress = 0;
        this.totalSteps = 0;
    }

    updateProgress(increment, message) {
        this.progress += increment;
        const percentage = Math.min(Math.round((this.progress / this.totalSteps) * 100), 100);
        
        document.getElementById('progress-fill').style.width = `${percentage}%`;
        document.getElementById('progress-percentage').textContent = `${percentage}%`;
        document.getElementById('progress-text').textContent = message;
        
        console.log(`Progress: ${percentage}% - ${message}`);
        return percentage;
    }

    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    parseMarkupFile(content) {
        console.log('Parsing markup file...');
        const markup = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.trim().length === 0) continue;
            try {
                const fromCost = parseFloat(line.substring(0, 8).trim());
                const throughCost = parseFloat(line.substring(9, 17).trim());
                const markupMultiplier = parseFloat(line.substring(18, 26).trim());
                
                if (!isNaN(fromCost) && !isNaN(throughCost) && !isNaN(markupMultiplier)) {
                    markup.push({
                        fromCost,
                        throughCost,
                        markup: markupMultiplier
                    });
                    console.log(`Added markup range: $${fromCost}-$${throughCost} -> ${markupMultiplier}x`);
                }
            } catch (e) {
                console.warn('Invalid markup line:', line);
            }
        }
        return markup;
    }

    parseRepairsFile(content) {
        console.log('Parsing repairs file...');
        const repairs = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.length < 82) continue;
            
            try {
                const laborTimeStr = line.substring(61, 66).trim();
                const partsCostStr = line.substring(67, 74).trim();
                const laborCostStr = line.substring(75, 82).trim();

                const repair = {
                    repairNumber: line.substring(0, 6).trim(),
                    repairGroup: line.substring(7, 10).trim(),
                    repairSubGroup: line.substring(11, 14).trim(),
                    description: line.substring(15, 60).trim(),
                    laborTime: laborTimeStr ? parseFloat(laborTimeStr) : 0,
                    partsCost: partsCostStr ? parseFloat(partsCostStr) : 0,
                    regularLaborCost: laborCostStr ? parseFloat(laborCostStr) : 0,
                    associatedParts: []
                };
                
                if (repair.repairNumber && repair.description) {
                    console.log(`Parsed repair: ${repair.repairNumber}, Labor: ${repair.laborTime}hrs, Parts: $${repair.partsCost}`);
                    repairs.push(repair);
                }
            } catch (e) {
                console.warn('Failed to parse repair line:', line);
            }
        }
        return repairs;
    }

    parsePartsFile(content) {
        console.log('Parsing parts file...');
        const parts = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.length < 107) continue;
            
            try {
                const description = line.substring(14, 44).trim();
                const costStr = line.substring(95, 102).trim();
                const quantityStr = line.substring(103, 107).trim();
                
                // Special handling for refrigerants
                if (description.toLowerCase().includes('refrigerant') || 
                    description.toLowerCase().includes('r-410a') || 
                    description.toLowerCase().includes('r410a')) {
                    const part = {
                        repairNumber: line.substring(0, 6).trim(),
                        partNumber: line.substring(7, 13).trim(),
                        description: description,
                        manufacturer: line.substring(45, 48).trim(),
                        manufacturerPartNumber: line.substring(49, 69).trim(),
                        vendorId: line.substring(70, 73).trim(),
                        vendorPartNumber: line.substring(74, 94).trim(),
                        cost: costStr ? parseFloat(costStr) : 40.00,
                        quantity: quantityStr ? parseInt(quantityStr) : 1,
                        isRefrigerant: true
                    };
                    console.log(`Parsed refrigerant: ${part.partNumber}, Cost: $${part.cost}/lb, Qty: ${part.quantity}lb`);
                    parts.push(part);
                } else {
                    const part = {
                        repairNumber: line.substring(0, 6).trim(),
                        partNumber: line.substring(7, 13).trim(),
                        description: description,
                        manufacturer: line.substring(45, 48).trim(),
                        manufacturerPartNumber: line.substring(49, 69).trim(),
                        vendorId: line.substring(70, 73).trim(),
                        vendorPartNumber: line.substring(74, 94).trim(),
                        cost: costStr ? parseFloat(costStr) : 0,
                        quantity: quantityStr ? parseInt(quantityStr) : 1
                    };
                    console.log(`Parsed part: ${part.partNumber}, Cost: $${part.cost}`);
                    parts.push(part);
                }
            } catch (e) {
                console.warn('Failed to parse parts line:', line);
            }
        }
        return parts;
    }

    async processFiles(repairs1File, repairs2File, partsFile, markupFile) {
        console.log('Starting file processing...');
        document.getElementById('progress-container').style.display = 'block';
        
        const estimatedBatches = Math.ceil((repairs1File.size + repairs2File.size + partsFile.size) / 50000);
        this.totalSteps = 4 + 4 + estimatedBatches;
        this.progress = 0;

        try {
            const repairs1Content = await this.readFile(repairs1File);
            this.updateProgress(1, 'Reading Repairs1 file');
            
            const repairs2Content = await this.readFile(repairs2File);
            this.updateProgress(1, 'Reading Repairs2 file');
            
            const partsContent = await this.readFile(partsFile);
            this.updateProgress(1, 'Reading Parts file');
            
            const markupContent = await this.readFile(markupFile);
            this.updateProgress(1, 'Reading Markup file');

            const repairs1 = this.parseRepairsFile(repairs1Content);
            this.updateProgress(1, `Parsed ${repairs1.length} repairs from file 1`);
            
            const repairs2 = this.parseRepairsFile(repairs2Content);
            this.updateProgress(1, `Parsed ${repairs2.length} repairs from file 2`);
            
            const parts = this.parsePartsFile(partsContent);
            this.updateProgress(1, `Parsed ${parts.length} parts`);
            
            const markup = this.parseMarkupFile(markupContent);
            this.updateProgress(1, `Parsed ${markup.length} markup ranges`);

            // Create parts lookup by repair number
            const partsMap = new Map();
            parts.forEach(part => {
                if (!partsMap.has(part.repairNumber)) {
                    partsMap.set(part.repairNumber, []);
                }
                partsMap.get(part.repairNumber).push(part);
            });

            // Associate parts with repairs
            const allItems = [...repairs1, ...repairs2].map(repair => ({
                ...repair,
                associatedParts: partsMap.get(repair.repairNumber) || []
            })).concat(parts).filter(item => 
                item.description && 
                typeof item.description === 'string' && 
                item.description.trim().length > 0
            );

            const batchSize = 50;
            const totalBatches = Math.ceil(allItems.length / batchSize);
            
            for (let i = 0; i < allItems.length; i += batchSize) {
                const batch = allItems.slice(i, i + batchSize);
                const currentBatch = Math.floor(i / batchSize) + 1;
                
                await Promise.all(batch.map(item => this.vectorStore.addItem(item.description, item)));
                
                const progressIncrement = 1 / totalBatches;
                this.updateProgress(progressIncrement, 
                    `Processing batch ${currentBatch}/${totalBatches} (${Math.round((currentBatch/totalBatches) * 100)}%)`
                );
            }

            await this.vectorStore.db.saveData(this.vectorStore.vectors, allItems, markup);
            console.log('File processing complete');
            
            return { repairs1, repairs2, parts, markup };
        } catch (error) {
            console.error('Error processing files:', error);
            throw error;
        }
    }
}
