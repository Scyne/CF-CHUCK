let vectorStore;
let fileProcessor;
let searchEngine;

async function initializeApp() {
    try {
        vectorStore = new VectorStore();
        const hasData = await vectorStore.initialize();
        fileProcessor = new FileProcessor(vectorStore);
        searchEngine = new SearchEngine(vectorStore);
        
        // Initialize search engine after vector store
        await searchEngine.initialize();
        
        if (!hasData || !searchEngine.hasData()) {
            console.log('No data found, showing settings page');
            document.getElementById('settings-page').style.display = 'block';
            document.querySelector('.search-section').style.display = 'none';
            document.getElementById('searchInput').disabled = true;
        } else {
            console.log('Data found, showing search interface');
            document.querySelector('.search-section').style.display = 'block';
            document.getElementById('searchInput').disabled = false;
            document.getElementById('settings-page').style.display = 'none';
        }
    } catch (error) {
        console.error('Initialization error:', error);
        document.getElementById('settings-page').style.display = 'block';
        document.querySelector('.search-section').style.display = 'none';
        document.getElementById('searchInput').disabled = true;
    }
}

async function search() {
    const query = document.getElementById('searchInput').value;
    const resultsDiv = document.getElementById('results');
    
    if (!query) {
        resultsDiv.innerHTML = '<div class="no-results">Please enter a search term</div>';
        return;
    }

    if (!searchEngine || !searchEngine.hasData()) {
        resultsDiv.innerHTML = '<div class="error">Search index not loaded. Please load data files first.</div>';
        return;
    }

    try {
        resultsDiv.innerHTML = '<div class="loading">Searching...</div>';
        const results = await searchEngine.search(query);
        resultsDiv.innerHTML = results || '<div class="no-results">No results found</div>';
    } catch (error) {
        console.error('Search error:', error);
        resultsDiv.innerHTML = '<div class="error">Search failed. Please try again.</div>';
    }
}

async function processFiles() {
    const repairs1File = document.getElementById('repairs1').files[0];
    const repairs2File = document.getElementById('repairs2').files[0];
    const partsFile = document.getElementById('parts').files[0];
    const markupFile = document.getElementById('markup').files[0];

    if (!repairs1File || !repairs2File || !partsFile || !markupFile) {
        alert('Please select all required files');
        return;
    }

    try {
        document.getElementById('progress-container').style.display = 'block';
        document.getElementById('settings-page').style.display = 'none';

        await fileProcessor.processFiles(repairs1File, repairs2File, partsFile, markupFile);
        await searchEngine.initialize();
        
        document.querySelector('.search-section').style.display = 'block';
        document.getElementById('searchInput').disabled = false;
        document.getElementById('progress-container').style.display = 'none';
    } catch (error) {
        console.error('Error processing files:', error);
        alert('Error processing files. Please check the console for details.');
        document.getElementById('progress-container').style.display = 'none';
        document.getElementById('settings-page').style.display = 'block';
    }
}

async function clearCache() {
    try {
        await vectorStore.clearCache();
        await searchEngine.clearCache();
        document.querySelector('.search-section').style.display = 'none';
        document.getElementById('searchInput').disabled = true;
        document.getElementById('results').innerHTML = '';
        document.getElementById('settings-page').style.display = 'block';
    } catch (error) {
        console.error('Error clearing cache:', error);
        alert('Error clearing cache. Please try again.');
    }
}

function toggleSettings() {
    const settingsPage = document.getElementById('settings-page');
    const searchSection = document.querySelector('.search-section');
    
    if (settingsPage.style.display === 'none') {
        settingsPage.style.display = 'block';
        searchSection.style.display = 'none';
    } else {
        settingsPage.style.display = 'none';
        searchSection.style.display = 'block';
    }
}

function toggleDetails(index) {
    const details = document.getElementById(`details-${index}`);
    const button = document.getElementById(`toggle-${index}`);
    
    if (!details || !button) return;
    
    const isExpanded = details.style.display !== 'none';
    details.style.display = isExpanded ? 'none' : 'block';
    button.textContent = isExpanded ? '▼' : '▲';
}

// Add event listener for enter key in search input
document.getElementById('searchInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        search();
    }
});

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', initializeApp);
