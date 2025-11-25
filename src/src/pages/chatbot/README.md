# Fertilizer Advisory Chatbot

## Overview
The Fertilizer Advisory Chatbot is an interactive AI-powered assistant that helps users get fertilizer recommendations for their specific location in Ethiopia. The chatbot uses Groq API for natural language processing and integrates with the NextGen AgroAdvisory system for fertilizer recommendations.

## Features

### Interactive Map Selection
- **Map Integration**: Users can click on an interactive map to select their location instead of manually entering coordinates
- **Geographic Constraints**: Map is restricted to Ethiopia's boundaries (3.4°-14.9°N, 33.0°-48.0°E)
- **Visual Feedback**: Shows a marker at the selected location
- **Coordinate Display**: Displays selected coordinates in real-time
- **Manual Entry**: Users can still manually enter coordinates in lat,lon format

### Bulk File Processing
- **CSV Upload**: Users can upload CSV files containing multiple fertilizer requests
- **Batch Processing**: System processes all records in the uploaded file
- **Automatic Download**: Generates and downloads a new CSV file with fertilizer recommendations
- **Error Handling**: Comprehensive validation and error reporting for invalid data
- **Format Validation**: Ensures CSV files have required columns (No, Crop Type, Fertilizer Type, latitude, longitude)

### Conversation Flow
1. **Welcome**: Bot greets user and explains capabilities
2. **Crop & Fertilizer Selection**: User specifies crop and fertilizer type
3. **Location Selection**: User can either:
   - Click on the interactive map to select location
   - Manually enter coordinates (lat,lon format)
   - Upload a CSV file for bulk processing
4. **Recommendation**: Bot provides fertilizer recommendation based on location

### Supported Crops and Fertilizers
- **Crops**: maize, wheat, and other available crops from the system
- **Fertilizers**: urea, nps, compost, vcompost, and other available types
- **Scenarios**: normal, above, below, dominant (depending on forecast period)

## Technical Implementation

### Map Integration
- Uses Leaflet.js for interactive mapping
- Ethiopia boundary constraints enforced
- Click detection with coordinate validation
- Marker management (move existing or create new)
- Automatic coordinate formatting (3 decimal places)

### API Integration
- **Groq API**: For natural language processing and general conversation
- **NextGen API**: For fertilizer recommendations and layer data
- **Coordinate API**: For location-based fertilizer data retrieval

### State Management
- React hooks for state management
- Conversation flow control
- Map state management
- Coordinate tracking

## Usage Examples

### Map Selection
```
User: "I have maize and need nps fertilizer"
Bot: Shows interactive map with instructions
User: Clicks on map location
Bot: Displays selected coordinates and provides recommendation
```

### Manual Coordinates
```
User: "I have wheat and want urea"
Bot: Prompts for coordinates
User: "9.145,40.489"
Bot: Provides fertilizer recommendation
```

### Bulk File Processing
```
User: Clicks "📎 Attach file" button
User: Uploads CSV file with format:
No,Crop Type,Fertilizer Type,latitude,longitude
1,maize,urea,9.145,40.489
2,wheat,nps,8.980,38.750
Bot: Processes file and downloads results with "Recommended Amount" column
```

## CSV File Format

### Required Columns
- **No**: Record identifier (any format)
- **Crop Type**: Type of crop (maize, wheat, etc.)
- **Fertilizer Type**: Type of fertilizer (urea, nps, compost, etc.)
- **latitude**: Latitude coordinate (decimal degrees)
- **longitude**: Longitude coordinate (decimal degrees)

### Sample CSV Format
```csv
No,Crop Type,Fertilizer Type,latitude,longitude
1,maize,urea,9.145,40.489
2,wheat,nps,8.980,38.750
3,maize,compost,10.200,39.100
```

### Output Format
The system generates a new CSV file with an additional "Recommended Amount" column:
```csv
No,Crop Type,Fertilizer Type,latitude,longitude,Recommended Amount
1,maize,urea,9.145,40.489,"45 kg/ha"
2,wheat,nps,8.980,38.750,"32 kg/ha"
3,maize,compost,10.200,39.100,"2 ton/ha"
```

## Dependencies
- React 18.0.0
- Leaflet.js 1.7.1
- Axios for API calls
- Bootstrap for styling

## File Structure
- `Chatbot.js`: Main component with conversation logic and map integration
- `Chatbot.css`: Styling for chatbot interface and map components
- `README.md`: This documentation file

## Map Features
- **Boundary Constraints**: Restricted to Ethiopia
- **Zoom Controls**: 5-12 zoom levels
- **Tile Layer**: OpenStreetMap tiles
- **Boundary Overlay**: Visual Ethiopia boundary
- **Click Detection**: Validates coordinates within bounds
- **Marker Management**: Single marker with position updates 