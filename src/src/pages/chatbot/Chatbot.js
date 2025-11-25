import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Configuration from "../../conf/Configuration";
import './Chatbot.css';

// Declare L as a global variable for Leaflet
/* global L */

// Groq API key is pulled from REACT_APP_GROQ_API environment variable

function Chatbot() {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [availableLayers, setAvailableLayers] = useState([]);
    const [currentStep, setCurrentStep] = useState('initial'); // initial, collecting_data, coordinates, result
    const [selectedLayer, setSelectedLayer] = useState('');
    const [coordinates, setCoordinates] = useState({ lat: '', lon: '' });
    const [showMap, setShowMap] = useState(false);
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [collectedData, setCollectedData] = useState({
        crop: null,
        fertilizer: null,
        coordinates: null
    });
    const [isTyping, setIsTyping] = useState(false);
    const [chatStatus, setChatStatus] = useState('online');
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [fileUploadRef, setFileUploadRef] = useState(null);
    const messagesEndRef = useRef(null);
    const mapContainerRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Quick action buttons
    const quickActions = [
        { text: "🌾 Wheat Fertilizer", action: "I need fertilizer recommendations for wheat" },
        { text: "🌽 Maize Fertilizer", action: "I need fertilizer recommendations for maize" },
        { text: "📍 Find My Location", action: "I need help finding my location" },
        { text: "📎 Attach file", action: "file_upload" },
        { text: "❓ How does the bot work?", action: "How does the bot work?" }
    ];

    // Initialize chatbot with welcome message
    useEffect(() => {
        const welcomeMessage = {
            id: Date.now(),
            type: 'bot',
            content: "Hello! 👋 I'm your AI fertilizer advisor. I can help you get personalized fertilizer recommendations for your crops and location. What would you like to know?",
            timestamp: new Date(),
            showQuickActions: true
        };
        setMessages([welcomeMessage]);
        loadAvailableLayers();
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Initialize map when showMap becomes true
    const initializeMap = useCallback(() => {
        // Check if Leaflet is available
        if (typeof L === 'undefined') {
            console.error('Leaflet not loaded - please check if Leaflet.js is properly included');
            return;
        }

        // Check if map container exists
        if (!mapContainerRef.current) {
            console.error('Map container not found');
            return;
        }

        try {
            const ethiopiaBounds = [
                [3.4, 33.0], // Southwest coordinates
                [14.9, 48.0]  // Northeast coordinates
            ];

            console.log('Initializing map...');
            const newMap = L.map(mapContainerRef.current, {
                maxBounds: ethiopiaBounds,
                maxBoundsViscosity: 1.0,
                minZoom: 5,
                maxZoom: 12
            }).setView([9.0, 38.7], 6); // Center of Ethiopia

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                noWrap: true
            }).addTo(newMap);

            // Add Ethiopia boundary overlay
            L.rectangle(ethiopiaBounds, {
                color: "#3388ff",
                weight: 2,
                fillOpacity: 0.1
            }).addTo(newMap);

            // Add click handler to map
            newMap.on('click', function(e) {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                
                console.log('Map clicked:', lat, lng);
                
                // Only allow clicks within Ethiopia bounds
                if (lat >= 3.4 && lat <= 14.9 && lng >= 33.0 && lng <= 48.0) {
                    // Update marker
                    if (marker) {
                        marker.setLatLng([lat, lng]);
                    } else {
                        const newMarker = L.marker([lat, lng]).addTo(newMap);
                        setMarker(newMarker);
                    }
                    
                    // Update coordinates
                    const newCoordinates = { lat: lat.toFixed(3), lon: lng.toFixed(3) };
                    setCoordinates(newCoordinates);
                    console.log('Coordinates updated:', newCoordinates);
                    
                    // Force re-render by updating a state
                    setShowMap(prev => prev);
                } else {
                    console.log('Click outside Ethiopia bounds');
                }
            });

            setMap(newMap);
            console.log('Map initialized successfully');
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }, [marker]);

    useEffect(() => {
        if (showMap && mapContainerRef.current && !map) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                initializeMap();
            }, 100);
        }
        
        // Cleanup map when showMap becomes false
        if (!showMap && map) {
            map.remove();
            setMap(null);
            setMarker(null);
        }
    }, [showMap, initializeMap, map]);

    const loadAvailableLayers = async () => {
        try {
            const response = await axios.get('https://webapi.nextgenagroadvisory.com/layers_fertilizer');
            if (response.data && response.data.layers) {
                setAvailableLayers(response.data.layers.map(layer => layer.name));
            }
        } catch (error) {
            console.error('Error loading layers:', error);
        }
    };

    // Parse layer name to extract crop and fertilizer type
    const parseLayerName = (layerName) => {
        const parts = layerName.split('_');
        if (parts.length >= 4) {
            const crop = parts[1]; // Second part after first underscore
            let fertilizer = parts[2]; // Third part
            // Handle optimal_nutrients_n and optimal_nutrients_p as special cases
            if (fertilizer === 'optimal' && parts[3] === 'nutrients') {
                if (parts[4] === 'n') {
                    fertilizer = 'n'; // nitrogen
                } else if (parts[4] === 'p') {
                    fertilizer = 'p'; // phosphorus
                } else {
                    fertilizer = parts.slice(2, 5).join('_');
                }
            }
            // Handle yieldtypes_optimal as a special case for yield layers
            else if (fertilizer === 'yieldtypes' && parts[3] === 'optimal') {
                fertilizer = 'yieldtypes_optimal';
            }
            const scenario = parts[parts.length - 1]; // Last part (above, below, normal, dominant)
            return { crop, fertilizer, scenario };
        }
        return null;
    };

    // Get available crops and fertilizers from layers
    const getAvailableCropsAndFertilizers = () => {
        const crops = new Set();
        const fertilizers = new Set();
        
        availableLayers.forEach(layer => {
            const parsed = parseLayerName(layer);
            if (parsed) {
                crops.add(parsed.crop);
                // Map 'n' to 'n (nitrogen)' and 'p' to 'p (phosphorus)' for display
                if (parsed.fertilizer === 'n') {
                    fertilizers.add('nitrogen');
                } else if (parsed.fertilizer === 'p') {
                    fertilizers.add('phosphorus');
                } else {
                    fertilizers.add(parsed.fertilizer);
                }
            }
        });
        
        return {
            crops: Array.from(crops).sort(),
            fertilizers: Array.from(fertilizers).sort()
        };
    };

    // Find the best matching layer based on crop and fertilizer
    const findMatchingLayer = (cropInput, fertilizerInput) => {
        const cropLower = cropInput.toLowerCase();
        let fertilizerLower = fertilizerInput.toLowerCase();

        // Map user input 'nitrogen' to 'n' and 'phosphorus' to 'p' for matching
        if (fertilizerLower === 'nitrogen') {
            fertilizerLower = 'n';
        } else if (fertilizerLower === 'phosphorus') {
            fertilizerLower = 'p';
        }

        // Map user input 'yield' or 'yieldtypes' to 'yieldtypes_optimal'
        if (fertilizerLower === 'yield' || fertilizerLower === 'yieldtypes') {
            fertilizerLower = 'yieldtypes_optimal';
        }

        // First try to find dominant scenario
        let matchingLayer = availableLayers.find(layer => {
            const parsed = parseLayerName(layer);
            return parsed && 
                   parsed.crop.toLowerCase() === cropLower && 
                   parsed.fertilizer.toLowerCase() === fertilizerLower &&
                   parsed.scenario === 'dominant';
        });
        
        // If no dominant found, try normal
        if (!matchingLayer) {
            matchingLayer = availableLayers.find(layer => {
                const parsed = parseLayerName(layer);
                return parsed && 
                       parsed.crop.toLowerCase() === cropLower && 
                       parsed.fertilizer.toLowerCase() === fertilizerLower &&
                       parsed.scenario === 'normal';
            });
        }
        
        return matchingLayer;
    };

    const sendMessageToGroq = async (userMessage, conversationContext = '') => {
        try {
            const { crops, fertilizers } = getAvailableCropsAndFertilizers();
            
            const systemPrompt = `You are an expert in site specific Fertilizer recommendation. Your goal is to help users get fertilizer recommendations by collecting 3 pieces of information:
1. Crop type
2. Fertilizer type  
3. Location coordinates

CRITICAL WARNING: You MUST NEVER generate or make up your own fertilizer recommendations or yield values. You are strictly forbidden from providing any numerical values, calculations, or recommendations that you generate yourself.

ALL fertilizer recommendation values and yield values MUST come exclusively from the following endpoint (handled by the system): https://webapi.nextgenagroadvisory.com/coordinates/{layer}/{coorStr}/{date}

You are only allowed to present values that are returned by this specific API endpoint. If no data is available from the endpoint, you must clearly state that no data was found for that location/combination.

All fertilizer recommendations are given in kg/ha (kilograms per hectare), EXCEPT for compost and vcompost, which are given in ton/ha (tons per hectare). Please always include the correct unit in your responses when providing a recommendation.

IMPORTANT: When presenting a fertilizer recommendation or yield value, you must always round off the value to the nearest integer according to mathematical rules. Present both the original value and the rounded value in your response. For example: "Your recommendation value is 42.7 kg/ha. After round off, the final recommendation is 43 kg/ha."

Available crops: ${crops.join(', ')}
Available fertilizers: ${fertilizers.join(', ')}

IMPORTANT: The fertilizer type 'n' or 'nitrogen' corresponds to 'optimal_nutrients_n' in the data, and 'p' or 'phosphorus' corresponds to 'optimal_nutrients_p'. Users may refer to these as 'n', 'nitrogen', 'p', or 'phosphorus'. Please map user requests for 'n' or 'nitrogen' to 'optimal_nutrients_n', and 'p' or 'phosphorus' to 'optimal_nutrients_p' when matching layers.

IMPORTANT: For compost and vcompost, the recommendation unit is ton/ha (tons per hectare). Always mention this unit in your response when providing compost or vcompost recommendations.

IMPORTANT: For yield value requests, users may refer to 'yieldtypes_optimal' using phrases such as 'yield', 'yield value', 'optimal yield', 'best yield', or similar wording. You must intelligently identify these intents and map them to 'yieldtypes_optimal' when matching layers. When providing a recommendation for this, clearly state it as the optimal yield (not a fertilizer recommendation) and specify the unit as kg/ha.

REMEMBER: You are a data presenter, not a calculator. You can only present values that come from the API endpoint. Never invent, estimate, or calculate values yourself, except for rounding off the value to the nearest integer as instructed above.

Current collected data: ${JSON.stringify(collectedData)}

CRITICAL: You must respond with ONLY ONE valid JSON object. No text before or after. No multiple JSON objects. Only return this single JSON object:

{"response":"Your conversational response to the user","extracted_data":{"crop":"extracted crop or null","fertilizer":"extracted fertilizer or null","coordinates":"extracted coordinates or null"},"missing_data":["list of missing data points"],"next_action":"what to do next (collect_data, get_recommendation, show_map, etc)"}

SPECIAL INSTRUCTIONS FOR "HOW DOES THE BOT WORK?":
If the user asks "How does the bot work?" or similar questions about how to use the chatbot, provide a comprehensive guide like this:

"I'm your AI fertilizer advisor! Here's how I work to get you personalized fertilizer recommendations:

I need 3 things to provide fertilizer recommendations:

🌾 Crop Type: Tell me what crop you're growing
Available crops: ${crops.join(', ')}

🌱 Fertilizer Type: Specify which fertilizer you need
Available fertilizers: ${fertilizers.join(', ')}

📍 Location: Provide your coordinates in Ethiopia (latitude, longitude) or I can help you find them on a map!

I'll then analyze your specific location's soil, climate, and crop needs to give you the perfect recommendation!

Ready to get started? Just tell me your crop and fertilizer type! 🚀"

IMPORTANT: Before providing a fertilizer recommendation, always analyze the user's latest message for intent and clarity.
- If the message is unclear, off-topic, or not a valid fertilizer request (e.g., random words, greetings, or unrelated questions), do NOT provide a recommendation.
- Instead, respond conversationally and ask the user to clarify their request or redirect them back to fertilizer advice.
- Only provide a fertilizer recommendation or yield values if the user's intent is clear and relevant. Both fertilizer recommendation values and yield values are always retrieved from the following endpoint (handled by the system): https://webapi.nextgenagroadvisory.com/coordinates/{layer}/{coorStr}/{date}. You do not need to perform any calculations yourself; simply present the value as returned by the system, with the correct context and units.

SPECIAL INSTRUCTIONS FOR COORDINATES:
- When asking for coordinates, always offer the map option naturally in your response
- Include phrases like "Don't you know your exact coordinates? I can help you with a map!" or "Would you like me to show you a map to help you find your location?"
- If the user responds positively (yes, sure, okay, etc.), set next_action to "show_map"
- When showing map, include helpful instructions like "Feel free to click on your location on the map"

If the user asks for explainability—such as "Why did you recommend this?" or any similar questions about the reasoning behind the recommendation—respond with an intelligent explanation like the following:

"The recommended fertilizer value is derived from your location's specific soil properties, climate conditions, and topographic features, along with the crop's nutrient requirements. These recommendations are generated by a machine learning model that analyzes multiple environmental and agronomic factors.

At the moment, I don't have access to the full dataset needed to provide a more detailed breakdown. Once my developer grants access to the complete data, I'll be able to offer a more in-depth explanation."

Then, continue the conversation in a helpful and engaging manner with statements such as:

"If you have any more questions or need assistance, I'm here to help"

If user provides coordinates, extract them in format "lat,lon". Valid Ethiopia coordinates: latitude 3.4-14.9, longitude 33.0-48.0.

If user asks about other topics, provide general responses and redirect to fertilizer recommendations.`;

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.REACT_APP_GROQ_API}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "meta-llama/llama-4-scout-17b-16e-instruct",
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: conversationContext + "\n\nUser: " + userMessage
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });

            const data = await response.json();
            const content = data.choices[0].message.content;
            
            console.log('Raw Groq response:', content);
            
            try {
                // Clean the content - remove any extra text or malformed JSON
                let cleanContent = content.trim();
                
                // Try to find the first valid JSON object
                const jsonStart = cleanContent.indexOf('{');
                const jsonEnd = cleanContent.lastIndexOf('}');
                
                if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                    cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
                }
                
                // Try to parse as JSON first
                const parsed = JSON.parse(cleanContent);
                console.log('Parsed JSON response:', parsed);
                return parsed;
            } catch (parseError) {
                console.error('Failed to parse Groq response as JSON:', content);
                console.error('Parse error:', parseError);
                
                // Try to extract just the response text from the malformed JSON
                const responseMatch = content.match(/"response":"([^"]+)"/);
                if (responseMatch) {
                    return {
                        response: responseMatch[1],
                        extracted_data: {},
                        missing_data: [],
                        next_action: "collect_data"
                    };
                }
                
                // If it's not valid JSON, treat the entire content as the response
                return {
                    response: content,
                    extracted_data: {},
                    missing_data: [],
                    next_action: "collect_data"
                };
            }
        } catch (error) {
            console.error('Error calling Groq API:', error);
            return {
                response: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
                extracted_data: {},
                missing_data: [],
                next_action: "collect_data"
            };
        }
    };

    const getFertilizerRecommendation = async (layer, lat, lon) => {
        try {
            const coorData = [{ lat: parseFloat(lat), lon: parseFloat(lon) }];
            const coorStr = JSON.stringify(coorData);
            const date = "2024-07";
            
            const response = await axios.post(
                `https://webapi.nextgenagroadvisory.com/coordinates/${layer}/${coorStr}/${date}`
            );
            
            return response.data;
        } catch (error) {
            console.error('Error getting fertilizer recommendation:', error);
            throw error;
        }
    };

    const handleMapLocationSelect = async () => {
        if (!coordinates.lat || !coordinates.lon) {
            const mapErrorPrompt = `The user tried to use the selected location but no location was selected on the map. 

Please provide a helpful, conversational response that explains they need to click on the map first to select a location within Ethiopia. Do not use any markdown formatting like ** or * - just plain text.`;
            
            const errorResponse = await sendMessageToGroq(mapErrorPrompt);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: errorResponse.response || errorResponse,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }

        // Update collected data with coordinates
        const updatedData = {
            ...collectedData,
            coordinates: `${coordinates.lat},${coordinates.lon}`
        };
        setCollectedData(updatedData);

        // Check what data is missing and ask for it intelligently
        const missingData = [];
        if (!updatedData.crop) missingData.push('crop');
        if (!updatedData.fertilizer) missingData.push('fertilizer');

        if (missingData.length === 0) {
            // All data is available, get recommendation
            await getRecommendationWithData(updatedData);
        } else {
            // Ask for missing data
            const { crops, fertilizers } = getAvailableCropsAndFertilizers();
            
            let missingDataPrompt = '';
            if (missingData.length === 2) {
                // Both crop and fertilizer are missing
                missingDataPrompt = `The user selected their location (${coordinates.lat}, ${coordinates.lon}) but hasn't provided their crop and fertilizer type yet.

Available crops: ${crops.join(', ')}
Available fertilizers: ${fertilizers.join(', ')}

Please provide a helpful, conversational response that acknowledges their location selection and asks them to provide both their crop and fertilizer type. Give examples of how they can phrase their request.`;
            } else if (missingData.includes('crop')) {
                // Only crop is missing
                missingDataPrompt = `The user selected their location (${coordinates.lat}, ${coordinates.lon}) and provided fertilizer type "${updatedData.fertilizer}" but hasn't specified their crop yet.

Available crops: ${crops.join(', ')}

Please provide a helpful, conversational response that acknowledges their location and fertilizer selection, and asks them to specify which crop they want fertilizer recommendations for.`;
            } else if (missingData.includes('fertilizer')) {
                // Only fertilizer is missing
                missingDataPrompt = `The user selected their location (${coordinates.lat}, ${coordinates.lon}) and provided crop "${updatedData.crop}" but hasn't specified their fertilizer type yet.

Available fertilizers: ${fertilizers.join(', ')}

Please provide a helpful, conversational response that acknowledges their location and crop selection, and asks them to specify which fertilizer type they want recommendations for.`;
            }

            const botResponse = await sendMessageToGroq(missingDataPrompt);
            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: botResponse.response || botResponse,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
            setShowMap(false);
            setCurrentStep('collecting_data');
        }
    };

    const getRecommendationWithData = async (data) => {
        const matchingLayer = findMatchingLayer(data.crop, data.fertilizer);
        
        if (!matchingLayer) {
            const availableCombinations = availableLayers.map(layer => {
                const parsed = parseLayerName(layer);
                return parsed ? `${parsed.crop} + ${parsed.fertilizer}` : layer;
            }).filter((item, index, arr) => arr.indexOf(item) === index);
            
            const errorPrompt = `The user requested ${data.crop} with ${data.fertilizer} fertilizer, but this combination is not available. 

Available combinations are:
${availableCombinations.join('\n')}

Please provide a helpful, conversational response that explains this combination isn't available and suggests alternative crops or fertilizers they could try. Do not use any markdown formatting like ** or * - just plain text.`;
            
            const errorResponse = await sendMessageToGroq(errorPrompt);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: errorResponse.response || errorResponse,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            setCurrentStep('initial');
            setCollectedData({ crop: null, fertilizer: null, coordinates: null });
            return;
        }

        setSelectedLayer(matchingLayer);
        const parsed = parseLayerName(matchingLayer);
        
        // Generate getting recommendation message
        const gettingRecommendationPrompt = `The user is getting a ${parsed.fertilizer === 'yieldtypes_optimal' ? 'yield value' : 'fertilizer recommendation'} for:
Crop: ${parsed.crop}
${parsed.fertilizer === 'yieldtypes_optimal' ? '' : `Fertilizer: ${parsed.fertilizer}`}
Location: ${data.coordinates}

Please provide a simple, conversational response that acknowledges we're getting their ${parsed.fertilizer === 'yieldtypes_optimal' ? 'yield value' : 'fertilizer recommendation'} and asks them to wait. Include the crop${parsed.fertilizer === 'yieldtypes_optimal' ? '' : ', fertilizer,'} and location information naturally in the response. Do not use any markdown formatting like ** or * - just plain text.`;
        
        const botResponse = await sendMessageToGroq(gettingRecommendationPrompt);
        const botMessage = {
            id: Date.now(),
            type: 'bot',
            content: botResponse.response || botResponse,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
        setShowMap(false);
        setIsLoading(true);

        try {
            const [lat, lon] = data.coordinates.split(',');
            const recommendation = await getFertilizerRecommendation(matchingLayer, lat, lon);
            
            let resultMessage = '';
            if (recommendation && recommendation.length > 0 && recommendation[0].value) {
                if (parsed.fertilizer === 'yieldtypes_optimal') {
                    // Yield value response
                    const successPrompt = `The user received a successful yield value:
Crop: ${parsed.crop}
Location: ${data.coordinates}
Yield Value: ${recommendation[0].value}

Please provide a conversational response that celebrates their successful yield result and includes all the above information naturally. Make sure to clearly state this is a yield value (not a fertilizer recommendation) and specify the unit as kg/ha. Also ask if there's anything else they'd like to know about yield or fertilizers. Do not use any markdown formatting like ** or * - just plain text.`;
                    resultMessage = await sendMessageToGroq(successPrompt);
                } else {
                    // Fertilizer recommendation response
                    const successPrompt = `The user received a successful fertilizer recommendation:
Crop: ${parsed.crop}
Fertilizer: ${parsed.fertilizer}
Location: ${data.coordinates}
Recommendation Value: ${recommendation[0].value}

Please provide a conversational response that celebrates their successful recommendation and includes all the above information naturally. Also ask if there's anything else they'd like to know about fertilizers. Do not use any markdown formatting like ** or * - just plain text.`;
                    resultMessage = await sendMessageToGroq(successPrompt);
                }
            } else {
                const noDataPrompt = `The user requested fertilizer data for location ${data.coordinates} but no data was found for this location. 

Please provide a helpful, conversational response that acknowledges no data was found and suggests trying with a different location. Do not use any markdown formatting like ** or * - just plain text.`;
                
                resultMessage = await sendMessageToGroq(noDataPrompt);
            }

            const resultBotMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: resultMessage.response || resultMessage,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, resultBotMessage]);
        } catch (error) {
            const apiErrorPrompt = `There was an error retrieving the fertilizer recommendation for location ${data.coordinates}. 

Please provide a helpful, conversational response that acknowledges the error and suggests checking coordinates or trying again. Do not use any markdown formatting like ** or * - just plain text.`;
            
            const errorResponse = await sendMessageToGroq(apiErrorPrompt);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: errorResponse.response || errorResponse,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setCurrentStep('initial');
            setCollectedData({ crop: null, fertilizer: null, coordinates: null });
        }
    };

    const handleQuickAction = (action) => {
        if (action === "file_upload") {
            handleFileUpload();
        } else {
            setInputMessage(action);
            handleSendMessage(action);
        }
    };

    const handleFileUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            const errorMessage = {
                id: Date.now(),
                type: 'bot',
                content: "❌ Please upload a CSV file. Only .csv files are supported.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }

        setIsProcessingFile(true);
        
        const processingMessage = {
            id: Date.now(),
            type: 'bot',
            content: "📎 Processing your CSV file... Please wait while I analyze the data and generate fertilizer recommendations.",
            timestamp: new Date()
        };
        setMessages(prev => [...prev, processingMessage]);

        try {
            const csvData = await parseCSVFile(file);
            const processedData = await processCSVData(csvData);
            await generateAndDownloadCSV(processedData);
            
            const successMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: `✅ Successfully processed ${processedData.length} records and generated fertilizer recommendations! Your file has been downloaded.`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, successMessage]);
        } catch (error) {
            console.error('Error processing file:', error);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: `❌ Error processing file: ${error.message}. Please check your CSV format and try again.`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsProcessingFile(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const parseCSVFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csv = e.target.result;
                    const lines = csv.split('\n').filter(line => line.trim());
                    
                    if (lines.length < 2) {
                        throw new Error('CSV file must have at least a header row and one data row');
                    }

                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                    const requiredHeaders = ['no', 'crop type', 'fertilizer type', 'latitude', 'longitude'];
                    
                    // Check if all required headers are present
                    const missingHeaders = requiredHeaders.filter(header => 
                        !headers.some(h => h.includes(header.replace(' ', '')) || h === header)
                    );
                    
                    if (missingHeaders.length > 0) {
                        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
                    }

                    const data = [];
                    for (let i = 1; i < lines.length; i++) {
                        const values = lines[i].split(',').map(v => v.trim());
                        if (values.length >= 5 && values[0] && values[1] && values[2] && values[3] && values[4]) {
                            data.push({
                                no: values[0],
                                cropType: values[1],
                                fertilizerType: values[2],
                                latitude: parseFloat(values[3]),
                                longitude: parseFloat(values[4])
                            });
                        }
                    }

                    if (data.length === 0) {
                        throw new Error('No valid data rows found in CSV file');
                    }

                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    };

    const processCSVData = async (csvData) => {
        const processedData = [];
        
        for (const row of csvData) {
            try {
                // Validate coordinates
                if (isNaN(row.latitude) || isNaN(row.longitude)) {
                    processedData.push({
                        ...row,
                        recommendedAmount: 'Invalid coordinates',
                        error: 'Invalid latitude or longitude'
                    });
                    continue;
                }

                // Check if coordinates are within Ethiopia bounds
                if (row.latitude < 3.4 || row.latitude > 14.9 || row.longitude < 33.0 || row.longitude > 48.0) {
                    processedData.push({
                        ...row,
                        recommendedAmount: 'Outside Ethiopia',
                        error: 'Coordinates outside Ethiopia bounds'
                    });
                    continue;
                }

                // Find matching layer
                const matchingLayer = findMatchingLayer(row.cropType, row.fertilizerType);
                
                if (!matchingLayer) {
                    processedData.push({
                        ...row,
                        recommendedAmount: 'No data available',
                        error: `No matching layer found for ${row.cropType} + ${row.fertilizerType}`
                    });
                    continue;
                }

                // Get fertilizer recommendation
                const recommendation = await getFertilizerRecommendation(matchingLayer, row.latitude, row.longitude);
                
                if (recommendation && recommendation.length > 0 && recommendation[0].value) {
                    const value = recommendation[0].value;
                    const roundedValue = Math.round(value);
                    processedData.push({
                        ...row,
                        recommendedAmount: `${roundedValue} ${getFertilizerUnit(row.fertilizerType)}`,
                        error: null
                    });
                } else {
                    processedData.push({
                        ...row,
                        recommendedAmount: 'No data available',
                        error: 'No recommendation data found for this location'
                    });
                }
            } catch (error) {
                console.error(`Error processing row ${row.no}:`, error);
                processedData.push({
                    ...row,
                    recommendedAmount: 'Processing error',
                    error: error.message
                });
            }
        }
        
        return processedData;
    };

    const getFertilizerUnit = (fertilizerType) => {
        const lowerType = fertilizerType.toLowerCase();
        if (lowerType.includes('compost') || lowerType.includes('vcompost')) {
            return 'ton/ha';
        }
        return 'kg/ha';
    };

    const generateAndDownloadCSV = (processedData) => {
        // Create CSV content
        const headers = ['No', 'Crop Type', 'Fertilizer Type', 'latitude', 'longitude', 'Recommended Amount'];
        const csvContent = [
            headers.join(','),
            ...processedData.map(row => [
                row.no,
                row.cropType,
                row.fertilizerType,
                row.latitude,
                row.longitude,
                `"${row.recommendedAmount}"`
            ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `fertilizer_recommendations_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleSendMessage = async (messageText = null) => {
        const textToSend = messageText || inputMessage;
        if (!textToSend.trim()) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: textToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        setIsTyping(true);

        try {
            // Create conversation context for Groq
            const conversationContext = messages.map(msg => 
                `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
            ).join('\n');

            const groqResponse = await sendMessageToGroq(textToSend, conversationContext);
            
            // Update collected data with any new information
            const newCollectedData = { ...collectedData };
            if (groqResponse.extracted_data.crop) {
                newCollectedData.crop = groqResponse.extracted_data.crop;
            }
            if (groqResponse.extracted_data.fertilizer) {
                newCollectedData.fertilizer = groqResponse.extracted_data.fertilizer;
            }
            if (groqResponse.extracted_data.coordinates) {
                newCollectedData.coordinates = groqResponse.extracted_data.coordinates;
            }
            
            setCollectedData(newCollectedData);

            let botResponse = groqResponse.response;

            // Handle next action based on Groq response
            if (groqResponse.next_action === 'get_recommendation') {
                // We have all data, get recommendation
                await getRecommendationWithData(newCollectedData);
                return;
            } else if (groqResponse.next_action === 'show_map') {
                // Add map button to response with helpful instructions
                botResponse += '\n\n🗺️ Click here to open map and find your Location\n\n💡 Feel free to click on your location on the map within Ethiopia to select it.';
                setCurrentStep('coordinates');
            } else if (groqResponse.next_action === 'collect_data') {
                setCurrentStep('collecting_data');
            }

            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: botResponse,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: "I'm sorry, I encountered an error. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (timestamp) => {
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chatbot-wrapper">
            {/* Chat Header */}
            <div className="chat-header">
                <div className="chat-header-content">
                    <div className="chat-avatar">
                        <div className="avatar-icon">🤖</div>
                        <div className="status-indicator online"></div>
                    </div>
                    <div className="chat-info">
                        <h3>Fertilizer AI Assistant</h3>
                        <p className="status-text">Online • Ready to help</p>
                    </div>
                    <div className="chat-actions">
                        <button className="action-btn" title="Clear chat">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="chat-messages">
                {messages.map((message) => (
                    <div key={message.id} className={`message ${message.type}`}>
                        {message.type === 'bot' && (
                            <div className="message-avatar">
                                <div className="avatar-icon">🤖</div>
                            </div>
                        )}
                        <div className="message-bubble">
                            <div className="message-content">
                                {message.content.split('\n').map((line, index) => {
                                    // Check if this line contains the map button
                                    if (line.includes('🗺️ Click here to open map and find your Location')) {
                                        return (
                                            <div key={index}>
                                                <button 
                                                    className="map-button"
                                                    onClick={() => setShowMap(true)}
                                                >
                                                    🗺️ Click here to open map and find your Location
                                                </button>
                                            </div>
                                        );
                                    }
                                    return <div key={index}>{line}</div>;
                                })}
                            </div>
                            <div className="message-time">
                                {formatTime(message.timestamp)}
                            </div>
                            {message.showQuickActions && (
                                <div className="quick-actions">
                                    {quickActions.map((action, index) => (
                                        <button
                                            key={index}
                                            className="quick-action-btn"
                                            onClick={() => handleQuickAction(action.action)}
                                        >
                                            {action.text}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="message bot">
                        <div className="message-avatar">
                            <div className="avatar-icon">🤖</div>
                        </div>
                        <div className="message-bubble">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}
                {isProcessingFile && (
                    <div className="message bot">
                        <div className="message-avatar">
                            <div className="avatar-icon">🤖</div>
                        </div>
                        <div className="message-bubble">
                            <div className="file-processing-indicator">
                                <div className="processing-spinner"></div>
                                <span>Processing CSV file...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Map Container */}
            {showMap && (
                <div className="map-container">
                    <div className="map-instructions">
                        <p>💡 Click anywhere on the map within Ethiopia to select your location</p>
                        {/* Move buttons to top for better visibility on small screens */}
                        <div className="map-top-controls">
                            {coordinates.lat && coordinates.lon && (
                                <div className="coordinates-display-top">
                                    📍 Selected: {coordinates.lat}, {coordinates.lon}
                                </div>
                            )}
                            <div className="map-top-buttons">
                                <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={handleMapLocationSelect}
                                    disabled={!coordinates.lat || !coordinates.lon}
                                    style={{ 
                                        opacity: (!coordinates.lat || !coordinates.lon) ? 0.5 : 1,
                                        visibility: 'visible'
                                    }}
                                >
                                    ✅ Use Selected Location
                                </button>
                                <button 
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setShowMap(false)}
                                >
                                    ❌ Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                    <div ref={mapContainerRef} className="map" style={{ height: '300px', width: '100%' }}>
                        {typeof L === 'undefined' && (
                            <div className="map-error">
                                <p>⚠️ Map loading... If the map doesn't appear, please enter coordinates manually.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Chat Input */}
            <div className="chat-input-container">
                <div className="input-wrapper">
                    <textarea
                        ref={inputRef}
                        className="chat-input"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={currentStep === 'coordinates' ? "Enter coordinates (lat,lon) or click on map above..." : "Type your message here..."}
                        rows="1"
                    />
                    <button
                        className="send-button"
                        onClick={() => handleSendMessage()}
                        disabled={isLoading || !inputMessage.trim()}
                    >
                        <span className="send-icon">➤</span>
                    </button>
                </div>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            
        </div>
    );
}

export default Chatbot; 