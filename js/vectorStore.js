class VectorStore {
    constructor() {
        this.vectors = [];
        this.items = [];
        this.initialized = false;
        this.model = null;
        this.db = new SearchDatabase();
        this.tradeTerms = {};
        console.log('Initializing VectorStore with trade terminology...');
    }

    async initialize() {
        console.log('Initializing VectorStore...');
        try {
            await this.db.initialize();
            await this.initializeTradeTerms();
            
            let retries = 3;
            while (retries > 0) {
                try {
                    console.log('Loading Universal Sentence Encoder...');
                    this.model = await use.load();
                    break;
                } catch (e) {
                    retries--;
                    if (retries === 0) throw e;
                    console.log(`Model load failed, retrying... (${retries} attempts left)`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            console.log('Model loaded successfully');
            const data = await this.db.loadData();
            if (data && data.vectors && data.vectors.length > 0 && data.items && data.items.length > 0) {
                this.vectors = data.vectors;
                this.items = data.items;
                this.initialized = true;
                console.log(`Successfully loaded ${this.vectors.length} vectors and trade terms from IndexedDB`);
                return true;
            }
            this.initialized = true;
            console.log('No cached data found, starting fresh');
            return false;
        } catch (e) {
            console.error('Failed to initialize vector store:', e);
            throw e;
        }
    }

    async initializeTradeTerms() {
        console.log('Loading comprehensive trade terminology...');
        
        // Refrigerant mappings with all variations
        this.tradeTerms['refrigerants'] = {
            'r410a': ['r-410a', '410a', 'puron', 'az20', '410 freon', 'r410', 'r 410a'],
            'r22': ['r-22', 'r22 freon', 'freon', '22', 'r 22'],
            'r407c': ['r-407c', '407c', '407 freon', 'r407', 'r 407c'],
            'r134a': ['r-134a', '134a', '134 freon', 'r134', 'r 134a'],
            'r404a': ['r-404a', '404a', '404 freon', 'r404', 'r 404a'],
            'r32': ['r-32', '32', 'r32 freon', 'r 32'],
            'r454b': ['r-454b', '454b', 'r454', 'r 454b'],
            'r407a': ['r-407a', '407a', '407a freon', 'r407', 'r 407a'],
            'r417a': ['r-417a', '417a', 'mo59', 'r417', 'r 417a'],
            'r422d': ['r-422d', '422d', 'mo29', 'r422', 'r 422d'],
            'r438a': ['r-438a', '438a', 'mo99', 'r438', 'r 438a'],
            'r421a': ['r-421a', '421a', 'choice r421a', 'r421', 'r 421a'],
            'r427a': ['r-427a', '427a', 'forane 427a', 'r427', 'r 427a'],
            'r453a': ['r-453a', '453a', 'rs-70', 'r453', 'r 453a'],
            'r458a': ['r-458a', '458a', 'r458', 'r 458a'],
            'r420a': ['r-420a', '420a', 'r420', 'r 420a', 'rb276'],
            'r416a': ['r-416a', '416a', 'fr12', 'r416', 'r 416a'],
            'r414b': ['r-414b', '414b', 'hot shot', 'r414', 'r 414b'],
            'r422b': ['r-422b', '422b', 'nu22b', 'r422', 'r 422b'],
            'r422c': ['r-422c', '422c', 'os24', 'r422', 'r 422c']
        };

        // HVAC Terms
        this.tradeTerms['hvac'] = {
            'compressor': ['comp', 'pump', 'ac compressor'],
            'condenser': ['outdoor coil', 'condenser coil', 'outdoor unit'],
            'evaporator': ['evap coil', 'indoor coil', 'a coil', 'cooling coil'],
            'txv': ['thermal expansion valve', 'expansion valve', 'metering device'],
            'air handler': ['ahu', 'indoor unit', 'blower unit'],
            'heat pump': ['hp', 'reverse cycle', 'heating cooling unit'],
            'furnace': ['heater', 'heating unit', 'gas furnace'],
            'thermostat': ['tstat', 't-stat', 'temperature control'],
            'capacitor': ['cap', 'run cap', 'start cap'],
            'contactor': ['magnetic contactor', 'power relay', 'starter'],
            'disconnect': ['service disconnect', 'safety switch', 'pull out'],
            'filter drier': ['drier', 'filter dryer', 'liquid line drier'],
            'recovery machine': ['reclaim machine', 'refrigerant recovery unit'],
            'vacuum pump': ['vac pump', 'evacuation pump'],
            'manifold gauges': ['gauge set', 'charging manifold', 'test kit'],
            'micron gauge': ['vacuum gauge', 'electronic vacuum gauge'],
            'superheat': ['sh', 'superheat temperature'],
            'subcooling': ['sc', 'subcool', 'subcooling temperature']
        };

        // Plumbing Terms
        this.tradeTerms['plumbing'] = {
            'pex': ['cross-linked polyethylene', 'flexible water line'],
            'cpvc': ['chlorinated polyvinyl chloride', 'plastic pipe'],
            'copper': ['cu', 'copper pipe', 'copper tubing'],
            'pvc': ['polyvinyl chloride', 'drain pipe'],
            'abs': ['acrylonitrile butadiene styrene', 'black pipe'],
            'p-trap': ['trap', 'drain trap', 'sink trap'],
            'cleanout': ['co', 'cleanout access', 'drain cleanout'],
            'ball valve': ['shutoff valve', 'isolation valve'],
            'gate valve': ['main valve', 'full port valve'],
            'check valve': ['backflow preventer', 'one way valve'],
            'pressure reducer': ['prv', 'pressure reducing valve'],
            'vacuum breaker': ['avb', 'anti-siphon valve']
        };

        // Electrical Terms
        this.tradeTerms['electrical'] = {
            'disconnect': ['service disconnect', 'safety switch', 'pull out'],
            'contactor': ['magnetic contactor', 'power relay', 'starter'],
            'capacitor': ['cap', 'run cap', 'start cap'],
            'transformer': ['xfmr', 'trafo', '24v transformer'],
            'circuit breaker': ['breaker', 'cb', 'overcurrent protection'],
            'wire nut': ['wire connector', 'marette', 'wire splice'],
            'conduit': ['emt', 'rigid', 'flex'],
            'junction box': ['j-box', 'junction', 'pull box'],
            'multimeter': ['dmm', 'meter', 'tester'],
            'voltage drop': ['vd', 'voltage loss', 'line loss']
        };

        console.log('Trade terminology loaded successfully');
    }

    async addItem(text, metadata) {
        try {
            if (!this.model) {
                throw new Error('Model not initialized');
            }
            
            console.log(`Processing item for embedding: ${text.substring(0, 50)}...`);
            const enhancedText = this.enhanceSearchText(text);
            const embedding = await this.generateEmbedding(enhancedText);
            if (embedding) {
                this.vectors.push(embedding);
                this.items.push(metadata);
            }
        } catch (error) {
            console.error('Failed to add item:', error);
            throw error;
        }
    }

    enhanceSearchText(text) {
        console.log('Enhancing search text with trade terminology...');
        let enhanced = text.toLowerCase();
        
        // Add trade terms to search text
        Object.values(this.tradeTerms).forEach(category => {
            Object.entries(category).forEach(([formal, variations]) => {
                if (enhanced.includes(formal)) {
                    variations.forEach(term => {
                        if (!enhanced.includes(term)) {
                            enhanced += ` ${term}`;
                        }
                    });
                }
                variations.forEach(term => {
                    if (enhanced.includes(term) && !enhanced.includes(formal)) {
                        enhanced += ` ${formal}`;
                        variations.forEach(altTerm => {
                            if (term !== altTerm && !enhanced.includes(altTerm)) {
                                enhanced += ` ${altTerm}`;
                            }
                        });
                    }
                });
            });
        });

        console.log(`Enhanced text created: ${enhanced.substring(0, 50)}...`);
        return enhanced;
    }

    async search(query, k = 5) {
        if (!this.initialized || !this.vectors.length) {
            throw new Error('Vector store not initialized or empty');
        }
        try {
            console.log(`Processing search query: ${query}`);
            const enhancedQuery = this.enhanceSearchText(query);
            console.log(`Enhanced query: ${enhancedQuery}`);
            
            const queryEmbedding = await this.generateEmbedding(enhancedQuery);
            const scores = this.vectors.map(vector => {
                return this.cosineSimilarity(queryEmbedding, vector);
            });

            const indices = Array.from(Array(scores.length).keys())
                .sort((a, b) => scores[b] - scores[a])
                .slice(0, k);

            const results = indices.map(i => ({
                ...this.items[i],
                score: scores[i]
            }));

            console.log(`Found ${results.length} results for enhanced query`);
            return results;
        } catch (error) {
            console.error('Search failed:', error);
            throw error;
        }
    }

    // Previous methods remain unchanged
    cosineSimilarity(a, b) {
        try {
            const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
            const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
            const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
            return dotProduct / (magnitudeA * magnitudeB);
        } catch (error) {
            console.error('Cosine similarity calculation failed:', error);
            return 0;
        }
    }

    async generateEmbedding(text) {
        if (!text || typeof text !== 'string') {
            throw new Error('Input text must be a non-empty string');
        }
        
        try {
            if (!this.model) {
                console.log('Model not initialized, loading...');
                this.model = await use.load();
            }
            
            const cleanText = text.trim().substring(0, 1000);
            const embeddings = await this.model.embed([cleanText]);
            const embeddingArray = Array.from(embeddings.dataSync());
            
            if (!embeddingArray || embeddingArray.length === 0) {
                throw new Error('Failed to generate embedding');
            }
            
            return embeddingArray;
        } catch (error) {
            console.error('Embedding generation failed:', error);
            throw error;
        }
    }

    async saveToCache() {
        console.log('Saving to IndexedDB...');
        try {
            if (!this.vectors.length || !this.items.length) {
                throw new Error('No data to save');
            }
            
            await this.db.saveData(this.vectors, this.items);
            console.log(`Successfully saved ${this.vectors.length} vectors to IndexedDB`);
            return true;
        } catch (e) {
            console.error('Failed to save to IndexedDB:', e);
            return false;
        }
    }

    async clearCache() {
        console.log('Clearing cache...');
        try {
            await this.db.clearData();
            this.vectors = [];
            this.items = [];
            console.log('Cache cleared successfully');
        } catch (e) {
            console.error('Failed to clear cache:', e);
            throw e;
        }
    }

    hasData() {
        return this.initialized && 
               this.vectors.length > 0 && 
               this.items.length > 0 && 
               this.vectors.length === this.items.length;
    }
}
