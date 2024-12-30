# CHUCK (Comprehensive Helper for Understanding Component Knowledge)

A web-based search application for HVAC, Electrical, and Plumbing parts and repairs using AI-powered semantic search.

## Overview

This application processes standardized repair and parts data files, creates semantic embeddings for intelligent search, and provides a user-friendly interface for finding relevant parts and repairs. It uses TensorFlow.js Universal Sentence Encoder for semantic search capabilities and IndexedDB for client-side data persistence.

## Core Features

- Semantic search for parts and repairs
- Persistent data storage using IndexedDB
- Automatic markup calculation based on cost ranges
- Collapsible search results with detailed information
- Parts-to-repair associations
- Real-time cost calculations including markup

## Technical Architecture

### Data Processing
- **FileProcessor**: Handles parsing of standardized text files
  - processes the contents of the repair, parts, and markup files and creates embeddings

### Search Components
- **VectorStore**: Manages semantic embeddings and search functionality
  - Creates embeddings using TensorFlow.js Universal Sentence Encoder
  - Performs cosine similarity search
  - Caches embeddings in IndexedDB

### Data Storage
- **SearchDatabase**: Manages IndexedDB operations
  - Stores vectors (embeddings)
  - Stores items (parts and repairs)
  - Stores markup ranges
  - Handles data versioning

### User Interface
- **SearchEngine**: Manages search results display
  - Formats search results
  - Calculates total costs with markup
  - Links repairs with associated parts
  - Provides collapsible detail views

## File Structure

├── index.html # Main application page
├── styles.css # Application styling
└── js/
├── app.js # Application initialization and control
├── fileProcessor.js # File parsing and processing
├── vectorStore.js # Semantic search functionality
├── searchEngine.js # Search results formatting
└── indexedDB.js # Database operations

## Data File Specifications

### Repairs.txt Format
- Positions 1-6: Repair Number
- Positions 8-10: Repair Group
- Positions 16-60: Description
- Positions 62-66: Labor Time
- Positions 68-74: Parts Cost
- Positions 76-82: Regular Labor Cost

### Parts.txt Format
- Positions 1-6: Part Number
- Positions 8-13: Stock Number
- Positions 14-44: Description
- Positions 45-49: Manufacturer
- Positions 50-57: Cost
- Positions 58-62: Quantity

### Markup.txt Format
- Positions 1-8: From Cost
- Positions 10-17: Through Cost
- Positions 19-26: Markup Percentage

## Core Functions

### Initialization
initialize()
Loads Universal Sentence Encoder
Checks for existing data in IndexedDB
Sets up search interface or shows setup page=

### File Processing
processFiles()
Parses input files
Creates embeddings
Stores data in IndexedDB
Updates progress indicator

### Search Operations
search()
Creates embedding for search query
Performs cosine similarity comparison
Returns ranked results
Calculates costs with markup

### Data Storage
saveData()
Stores vectors and items
Manages data versioning
Handles transaction atomicity

## Search Algorithm

1. Convert search query to embedding vector
2. Compare against stored vectors using cosine similarity
3. Rank results by similarity score
4. Apply markup based on cost ranges
5. Format results with associated parts

## Data Flow

1. User uploads standardized text files
2. FileProcessor parses and validates data
3. VectorStore creates embeddings
4. SearchDatabase stores data
5. User performs searches
6. SearchEngine formats and displays results

## Error Handling

- Validates file formats and content
- Provides fallbacks for missing data
- Handles IndexedDB storage limits
- Manages transaction failures
- Provides user feedback for errors