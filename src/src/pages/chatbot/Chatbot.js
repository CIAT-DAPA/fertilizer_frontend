import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Configuration from "../../conf/Configuration";
import './Chatbot.css';

// Declare L as a global variable for Leaflet
/* global L */

// Groq API key is pulled from REACT_APP_GROQ_API environment variable

const RECOMMENDATION_FERTILIZERS = ['dap', 'urea'];

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

const emptyCollectedData = () => ({
    crop: null,
    coordinates: null,
    farmSizeHa: null,
});

const formatCropName = (crop) => {
    if (!crop) return '';
    return crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase();
};

const extractFarmSizeFromText = (text) => {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:ha|hectare|hectares)\b/i);
    return match ? parseFloat(match[1]) : null;
};

const scaleKgForFarm = (kgPerHa, farmHa) => {
    if (kgPerHa == null || Number.isNaN(kgPerHa) || !farmHa) return null;
    return Math.round(kgPerHa * farmHa);
};

const buildRecommendationMessage = ({ crop, farmHa, dapKg, ureaKg, expectedYieldKg }) => {
    const cropLabel = formatCropName(crop);
    const yieldStr =
        expectedYieldKg != null ? expectedYieldKg.toLocaleString() : null;

    const mainLines = [
        `For your ${cropLabel} crop on ${farmHa} ha, apply ${dapKg} kg of DAP and ${ureaKg} kg of Urea.`,
        `Here's your ${cropLabel} plan for ${farmHa} ha: ${dapKg} kg DAP and ${ureaKg} kg Urea.`,
        `On ${farmHa} ha of ${cropLabel}, you'll need ${dapKg} kg DAP and ${ureaKg} kg Urea.`,
    ];

    const yieldLines = yieldStr
        ? [
              ` With this, the expected yield you can get is ${yieldStr} kg.`,
              ` Applied well, you could reach about ${yieldStr} kg.`,
              ` If you follow good field practices, expected yield is around ${yieldStr} kg.`,
          ]
        : [];

    const agronomicBlocks = [
        `As good agronomic practice, plant on time, prepare the land well, use correct spacing, control weeds early, apply fertilizer when there is enough moisture, and monitor pests and diseases regularly.`,
        `To get the most from this recommendation, plant on time, prepare land well, keep proper spacing, control weeds early, apply fertilizer with adequate soil moisture, and watch for pests and diseases.`,
        `I also advise: plant on time, good land preparation, correct plant spacing, early weed control, apply fertilizer when moisture is sufficient, and check crops regularly for pests and diseases.`,
        `For best results, follow sound agronomy—timely planting, well-prepared soil, appropriate spacing, early weed management, fertilizer application with enough moisture, and regular pest and disease monitoring.`,
        `Remember, alongside these fertilizer rates: timely planting, thorough land prep, correct spacing, early weed control, moist conditions when applying fertilizer, and regular scouting for pests and diseases.`,
    ];

    const closingQuestions = [
        `Would you like a recommendation for another location or crop?`,
        `Need the same advice for a different field or crop?`,
        `Want me to check another crop or location for you?`,
        `Shall we run another recommendation—different crop or coordinates?`,
        `Happy to help with another farm size, crop, or location if you need one.`,
    ];

    let message = pickRandom(mainLines);
    if (yieldLines.length) {
        message += pickRandom(yieldLines);
    }
    message += `\n\n${pickRandom(agronomicBlocks)}\n\n${pickRandom(closingQuestions)}`;
    return message;
};

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
    const [collectedData, setCollectedData] = useState(emptyCollectedData());
    const [isTyping, setIsTyping] = useState(false);
    const [chatStatus, setChatStatus] = useState('online');
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [fileUploadRef, setFileUploadRef] = useState(null);
    const messagesEndRef = useRef(null);
    const mapContainerRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        document.body.classList.add('chatbot-page-active');
        return () => document.body.classList.remove('chatbot-page-active');
    }, []);

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
            content: "Hello! 👋 I'm your AI fertilizer advisor. Tell me your crop, farm size in hectares, and location — I'll recommend how much fertilizer to apply and your expected yield. What would you like to know?",
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
            const response = await axios.get(`${Configuration.get_url_api_base()}layers_fertilizer`);
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

    // Get available crops from layers (recommendations always use DAP + Urea)
    const getAvailableCrops = () => {
        const crops = new Set();

        availableLayers.forEach(layer => {
            const parsed = parseLayerName(layer);
            if (parsed && parsed.fertilizer !== 'yieldtypes' && parsed.fertilizer !== 'yieldtypes_optimal') {
                crops.add(parsed.crop);
            }
        });

        return Array.from(crops).sort();
    };

    // Find the best matching layer based on crop and fertilizer
    const findMatchingLayer = (cropInput, fertilizerInput) => {
        const cropLower = cropInput.toLowerCase();
        let fertilizerLower = fertilizerInput.toLowerCase();
        let isYieldRequest = false;

        // Map user input 'nitrogen' to 'n' and 'phosphorus' to 'p' for matching
        if (fertilizerLower === 'nitrogen') {
            fertilizerLower = 'n';
        } else if (fertilizerLower === 'phosphorus') {
            fertilizerLower = 'p';
        }

        // Map user input 'yield', 'yieldtypes', or 'yieldtypes_optimal' to 'yieldtypes_optimal'
        // Always use dominant scenario for yield requests
        if (fertilizerLower === 'yield' || fertilizerLower === 'yieldtypes' || fertilizerLower === 'yieldtypes_optimal') {
            fertilizerLower = 'yieldtypes_optimal';
            isYieldRequest = true;
        }

        // For yield requests, always look for dominant scenario only
        if (isYieldRequest) {
            return availableLayers.find(layer => {
                const parsed = parseLayerName(layer);
                return parsed && 
                       parsed.crop.toLowerCase() === cropLower && 
                       parsed.fertilizer.toLowerCase() === fertilizerLower &&
                       parsed.scenario === 'dominant';
            });
        }

        // For fertilizers, first try to find dominant scenario
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
            // Check if API key is available
            if (!process.env.REACT_APP_GROQ_API) {
                console.error('REACT_APP_GROQ_API is not defined');
                return {
                    response: "I'm sorry, the API configuration is missing. Please contact the administrator.",
                    extracted_data: {},
                    missing_data: [],
                    next_action: "collect_data"
                };
            }
            
            const crops = getAvailableCrops();

            const systemPrompt = `You are an expert in site-specific fertilizer recommendation for Ethiopian farmers. Your goal is to collect exactly 3 pieces of information, then the system fetches data and builds the final recommendation message.

REQUIRED INFORMATION (collect intelligently — ask only for what is still missing):
1. Crop type
2. Farm size in hectares (ha)
3. Location coordinates in Ethiopia

DO NOT ask the user to choose a fertilizer type. The system selects products automatically when it delivers the final recommendation.

CRITICAL — PRODUCT NAMES IN CONVERSATION:
- While collecting information or chatting, NEVER mention specific fertilizer product names (DAP, Urea, NPS, compost, etc.). Use only general terms: "fertilizer", "fertilizer recommendations", "fertilizer amounts".
- The system builds the final message with specific products and kg amounts; you do not repeat those names before that step.
- ONLY if the user explicitly asks what fertilizer types are available (e.g. "which fertilizers do you recommend?"), you may say this advisor provides site-specific DAP and Urea amounts plus expected yield.
- If the user names a product while requesting advice, acknowledge their request in general terms (e.g. "I'll get fertilizer recommendations for your crop") without repeating product names unless they asked what is available.

CRITICAL: You MUST NEVER invent fertilizer amounts, yield values, or totals. The system fetches kg/ha from the API and multiplies by farm size. You only collect missing fields and converse naturally.

Available crops: ${crops.join(', ')}

When the user gives farm size, extract a numeric hectares value (e.g. "2 ha", "1.5 hectares", "farm is 3ha"). Store as a number in farm_size_ha.

When all three fields are present (crop, farm_size_ha, coordinates), set next_action to "get_recommendation". Do not ask for fertilizer type.

LANGUAGE TONE: Clear, professional, agriculture-appropriate. Avoid words like "thrilled", "fantastic", or "amazing".

Current collected data: ${JSON.stringify(collectedData)}

CRITICAL: Respond with ONLY ONE valid JSON object:

{"response":"Your conversational response","extracted_data":{"crop":"extracted crop or null","coordinates":"lat,lon or null","farm_size_ha":number or null},"missing_data":["crop","farm_size_ha","coordinates"],"next_action":"collect_data|get_recommendation|show_map"}

SPECIAL INSTRUCTIONS FOR "HOW DOES THE BOT WORK?":
If the user asks how the bot works, explain:

"I provide site-specific fertilizer recommendations and expected yield for your farm. I need three things:

🌾 Crop — e.g. ${crops.slice(0, 3).join(', ')}${crops.length > 3 ? ', and more' : ''}
📐 Farm size — your area in hectares (ha)
📍 Location — coordinates in Ethiopia, or I can show you a map

I'll calculate fertilizer amounts for your whole farm and your expected harvest. Specific products and kg totals appear in the final recommendation."

IMPORTANT: Before triggering a recommendation, ensure intent is clear. Greetings and off-topic messages should get a friendly redirect, not next_action get_recommendation.

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

            const apiKey = process.env.REACT_APP_GROQ_API;
            console.log('API Key check:', apiKey ? `Present (length: ${apiKey.length})` : 'MISSING');
            
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
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

            // Check if response is ok
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Groq API error response:', response.status, errorData);
                throw new Error(`API request failed: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            
            // Check if data has the expected structure
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('Unexpected API response structure:', data);
                throw new Error('Unexpected API response format');
            }
            
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
            console.error('API Key available:', !!process.env.REACT_APP_GROQ_API);
            console.error('Error details:', error.message, error.response?.status, error.response?.data);
            
            // Provide more specific error message
            let errorMessage = "I'm sorry, I'm having trouble processing your request right now. Please try again.";
            if (!process.env.REACT_APP_GROQ_API) {
                errorMessage = "I'm sorry, the API configuration is missing. Please contact the administrator.";
            } else if (error.response?.status === 401) {
                errorMessage = "I'm sorry, there's an authentication issue. Please contact the administrator.";
            }
            
            return {
                response: errorMessage,
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
            const date = "2026-07";
            
            const response = await axios.post(
                `${Configuration.get_url_api_base()}coordinates/${layer}/${coorStr}/${date}`
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

        const missingData = [];
        if (!updatedData.crop) missingData.push('crop');
        if (!updatedData.farmSizeHa) missingData.push('farm_size_ha');

        if (missingData.length === 0) {
            await getCombinedRecommendation(updatedData);
        } else {
            const crops = getAvailableCrops();

            let missingDataPrompt = '';
            if (missingData.length === 2) {
                missingDataPrompt = `The user selected location (${coordinates.lat}, ${coordinates.lon}) but has not given crop or farm size (hectares).

Available crops: ${crops.join(', ')}

Ask for crop and farm size in ha. Do not ask for fertilizer type. Use only the word "fertilizer" — never say DAP, Urea, or other product names. Plain text only, no markdown.`;
            } else if (missingData.includes('crop')) {
                missingDataPrompt = `The user selected location (${coordinates.lat}, ${coordinates.lon}) and farm size ${updatedData.farmSizeHa} ha but not crop.

Available crops: ${crops.join(', ')}

Ask which crop they grow. Plain text only.`;
            } else if (missingData.includes('farm_size_ha')) {
                missingDataPrompt = `The user selected location (${coordinates.lat}, ${coordinates.lon}) and crop "${updatedData.crop}" but not farm size.

Ask for farm area in hectares (ha). Do not ask for fertilizer type. Use only "fertilizer" — never product names like DAP or Urea. Plain text only.`;
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

    const getApiValue = (apiResponse) => {
        if (apiResponse && apiResponse.length > 0 && apiResponse[0].value != null) {
            return parseFloat(apiResponse[0].value);
        }
        return null;
    };

    const getCombinedRecommendation = async (data) => {
        const farmHa = parseFloat(data.farmSizeHa);
        if (!farmHa || farmHa <= 0) {
            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: 'Please tell me your farm size in hectares (for example, "2 ha" or "1.5 hectares") so I can calculate fertilizer amounts for your field.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
            setCurrentStep('collecting_data');
            return;
        }

        const missingLayers = RECOMMENDATION_FERTILIZERS.filter(
            (f) => !findMatchingLayer(data.crop, f)
        );

        if (missingLayers.length > 0) {
            const crops = getAvailableCrops();
            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: `I could not find fertilizer data for ${formatCropName(data.crop)} at this time. Available crops include: ${crops.join(', ')}. Please try another crop or contact support if you believe this crop should be supported.`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
            setCurrentStep('initial');
            setCollectedData(emptyCollectedData());
            return;
        }

        const dapLayer = findMatchingLayer(data.crop, 'dap');
        const ureaLayer = findMatchingLayer(data.crop, 'urea');
        const yieldLayer = findMatchingLayer(data.crop, 'yield');

        const waitingMessage = {
            id: Date.now(),
            type: 'bot',
            content: `Getting fertilizer and yield recommendations for your ${formatCropName(data.crop)} on ${farmHa} ha at ${data.coordinates}…`,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, waitingMessage]);
        setShowMap(false);
        setIsLoading(true);

        try {
            const [lat, lon] = data.coordinates.split(',').map((s) => s.trim());

            const [dapResponse, ureaResponse, yieldResponse] = await Promise.all([
                getFertilizerRecommendation(dapLayer, lat, lon),
                getFertilizerRecommendation(ureaLayer, lat, lon),
                yieldLayer
                    ? getFertilizerRecommendation(yieldLayer, lat, lon)
                    : Promise.resolve(null),
            ]);

            const dapPerHa = getApiValue(dapResponse);
            const ureaPerHa = getApiValue(ureaResponse);
            const yieldPerHa = yieldResponse ? getApiValue(yieldResponse) : null;

            if (dapPerHa == null || ureaPerHa == null) {
                const botMessage = {
                    id: Date.now() + 1,
                    type: 'bot',
                    content: `No fertilizer data was found for ${formatCropName(data.crop)} at ${data.coordinates}. Please try a different location within Ethiopia or check your coordinates.`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMessage]);
                return;
            }

            const dapKg = scaleKgForFarm(dapPerHa, farmHa);
            const ureaKg = scaleKgForFarm(ureaPerHa, farmHa);
            const expectedYieldKg =
                yieldPerHa != null ? scaleKgForFarm(yieldPerHa, farmHa) : null;

            setSelectedLayer(dapLayer);

            const resultContent = buildRecommendationMessage({
                crop: data.crop,
                farmHa,
                dapKg,
                ureaKg,
                expectedYieldKg,
            });

            const resultBotMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: resultContent,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, resultBotMessage]);
        } catch (error) {
            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: `There was an error retrieving recommendations for ${data.coordinates}. Please check your coordinates and try again.`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setCurrentStep('initial');
            setCollectedData(emptyCollectedData());
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

        const fileName = file.name.toLowerCase();
        const isCsv = fileName.endsWith('.csv');
        const isXlsx = fileName.endsWith('.xlsx');

        if (!isCsv && !isXlsx) {
            const errorMessage = {
                id: Date.now(),
                type: 'bot',
                content: "❌ Please upload a CSV (.csv) or Excel (.xlsx) file.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }

        setIsProcessingFile(true);
        
        const processingMessage = {
            id: Date.now(),
            type: 'bot',
            content: "📎 Processing your file... Please wait while I analyze the data and generate fertilizer recommendations.",
            timestamp: new Date()
        };
        setMessages(prev => [...prev, processingMessage]);

        try {
            const parsedFile = await parseUploadedFile(file);
            const processedData = await processBulkData(parsedFile.rows);
            generateAndDownloadFile(processedData, parsedFile.headers, parsedFile.fileFormat);
            
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
                content: `❌ Error processing file: ${error.message}. Please check your file format and try again.`,
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

    const FERTILIZER_OUTPUT_COLUMNS = ['DAP (kg/ha)', 'Urea (kg/ha)'];

    const normalizeHeader = (header) =>
        String(header ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

    const findColumnIndex = (headers, candidates) => {
        const normalized = headers.map(normalizeHeader);
        for (const candidate of candidates) {
            const idx = normalized.findIndex(
                (h) =>
                    h === candidate ||
                    h.replace(/\s/g, '') === candidate.replace(/\s/g, '') ||
                    h.includes(candidate.replace(/\s/g, ''))
            );
            if (idx !== -1) return idx;
        }
        return -1;
    };

    const findColumnKey = (headers, candidates) => {
        const idx = findColumnIndex(headers, candidates);
        return idx === -1 ? null : headers[idx];
    };

    const getRequiredColumnKeys = (headers) => {
        const cropKey = findColumnKey(headers, ['crop type', 'crop']);
        const latKey = findColumnKey(headers, ['latitude', 'lat']);
        const lonKey = findColumnKey(headers, ['longitude', 'lon', 'lng']);
        return { cropKey, latKey, lonKey };
    };

    const hasRequiredColumns = (headers) => {
        const { cropKey, latKey, lonKey } = getRequiredColumnKeys(headers);
        return Boolean(cropKey && latKey && lonKey);
    };

    const validateRequiredColumns = (headers) => {
        const { cropKey, latKey, lonKey } = getRequiredColumnKeys(headers);

        const missing = [];
        if (!cropKey) missing.push('Crop Type');
        if (!latKey) missing.push('latitude');
        if (!lonKey) missing.push('longitude');
        if (missing.length > 0) {
            throw new Error(`Missing required columns: ${missing.join(', ')}`);
        }

        return { cropKey, latKey, lonKey };
    };

    const detectHeaderRowIndex = (sheetRows, maxScanRows = 30) => {
        const scanLimit = Math.min(sheetRows.length, maxScanRows);
        for (let rowIndex = 0; rowIndex < scanLimit; rowIndex += 1) {
            const headers = sheetRows[rowIndex].map((header) => String(header ?? '').trim());
            if (hasRequiredColumns(headers)) {
                return rowIndex;
            }
        }
        return -1;
    };

    const extractSheetTable = (sheetRows) => {
        const headerRowIndex = detectHeaderRowIndex(sheetRows);
        if (headerRowIndex === -1) {
            return null;
        }

        const headers = sheetRows[headerRowIndex].map((header) => String(header ?? '').trim());
        const dataRows = sheetRows.slice(headerRowIndex + 1).filter((row) =>
            row.some((cell) => String(cell ?? '').trim() !== '')
        );

        return { headers, dataRows };
    };

    const buildRowsFromSheetData = (headers, rawRows) => {
        const { cropKey, latKey, lonKey } = validateRequiredColumns(headers);
        const rows = [];

        for (const rawRow of rawRows) {
            const cells = {};
            headers.forEach((header, index) => {
                const value = Array.isArray(rawRow)
                    ? rawRow[index]
                    : rawRow[header];
                cells[header] = value == null ? '' : value;
            });

            const cropType = String(cells[cropKey] ?? '').trim();
            const latitude = parseFloat(cells[latKey]);
            const longitude = parseFloat(cells[lonKey]);

            if (cropType && !Number.isNaN(latitude) && !Number.isNaN(longitude)) {
                rows.push({ cells, cropType, latitude, longitude });
            }
        }

        if (rows.length === 0) {
            throw new Error('No valid data rows found in file');
        }

        return { headers, rows };
    };

    const parseCsvFile = (file) =>
        new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    try {
                        const headers = results.meta.fields || [];
                        if (headers.length === 0) {
                            throw new Error('File must have a header row');
                        }
                        resolve({
                            ...buildRowsFromSheetData(headers, results.data),
                            fileFormat: 'csv',
                        });
                    } catch (error) {
                        reject(error);
                    }
                },
                error: (error) => reject(new Error(error.message || 'Failed to parse CSV file')),
            });
        });

    const parseXlsxFile = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workbook = XLSX.read(e.target.result, { type: 'array' });
                    if (!workbook.SheetNames.length) {
                        throw new Error('Excel file has no worksheets');
                    }

                    let lastError = null;

                    for (const sheetName of workbook.SheetNames) {
                        const sheet = workbook.Sheets[sheetName];
                        const sheetRows = XLSX.utils.sheet_to_json(sheet, {
                            header: 1,
                            defval: '',
                            raw: false,
                        });

                        const table = extractSheetTable(sheetRows);
                        if (!table || table.dataRows.length === 0) {
                            continue;
                        }

                        try {
                            resolve({
                                ...buildRowsFromSheetData(table.headers, table.dataRows),
                                fileFormat: 'xlsx',
                            });
                            return;
                        } catch (error) {
                            lastError = error;
                        }
                    }

                    if (lastError) {
                        throw lastError;
                    }

                    throw new Error(
                        'No worksheet found with required columns (Crop Type, latitude, longitude). ' +
                        'Add these columns to your data, or use the sheet that includes them.'
                    );
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read Excel file'));
            reader.readAsArrayBuffer(file);
        });

    const parseUploadedFile = (file) => {
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.csv')) {
            return parseCsvFile(file);
        }
        if (fileName.endsWith('.xlsx')) {
            return parseXlsxFile(file);
        }
        throw new Error('Unsupported file type');
    };

    const formatKgHaRate = (value) => {
        if (value == null || Number.isNaN(value)) return 'No data available';
        return String(Math.round(value));
    };

    const processBulkData = async (rows) => {
        const processedData = [];

        for (const row of rows) {
            try {
                if (Number.isNaN(row.latitude) || Number.isNaN(row.longitude)) {
                    processedData.push({
                        ...row,
                        dapKgHa: 'Invalid coordinates',
                        ureaKgHa: 'Invalid coordinates',
                        error: 'Invalid latitude or longitude',
                    });
                    continue;
                }

                if (
                    row.latitude < 3.4 ||
                    row.latitude > 14.9 ||
                    row.longitude < 33.0 ||
                    row.longitude > 48.0
                ) {
                    processedData.push({
                        ...row,
                        dapKgHa: 'Outside Ethiopia',
                        ureaKgHa: 'Outside Ethiopia',
                        error: 'Coordinates outside Ethiopia bounds',
                    });
                    continue;
                }

                const dapLayer = findMatchingLayer(row.cropType, 'dap');
                const ureaLayer = findMatchingLayer(row.cropType, 'urea');

                if (!dapLayer || !ureaLayer) {
                    processedData.push({
                        ...row,
                        dapKgHa: dapLayer ? 'No data available' : 'Not available for crop',
                        ureaKgHa: ureaLayer ? 'No data available' : 'Not available for crop',
                        error: `Fertilizer data not available for ${row.cropType}`,
                    });
                    continue;
                }

                const [dapResponse, ureaResponse] = await Promise.all([
                    getFertilizerRecommendation(dapLayer, row.latitude, row.longitude),
                    getFertilizerRecommendation(ureaLayer, row.latitude, row.longitude),
                ]);

                const dapPerHa = getApiValue(dapResponse);
                const ureaPerHa = getApiValue(ureaResponse);

                processedData.push({
                    ...row,
                    dapKgHa: formatKgHaRate(dapPerHa),
                    ureaKgHa: formatKgHaRate(ureaPerHa),
                    error:
                        dapPerHa == null || ureaPerHa == null
                            ? 'No recommendation data found for this location'
                            : null,
                });
            } catch (error) {
                console.error(`Error processing row (${row.cropType}, ${row.latitude}, ${row.longitude}):`, error);
                processedData.push({
                    ...row,
                    dapKgHa: 'Processing error',
                    ureaKgHa: 'Processing error',
                    error: error.message,
                });
            }
        }

        return processedData;
    };

    const escapeCsvValue = (value) => {
        const str = value == null ? '' : String(value);
        if (/[",\n\r]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const buildOutputRows = (processedData, originalHeaders) => {
        const outputHeaders = [...originalHeaders, ...FERTILIZER_OUTPUT_COLUMNS];
        const outputRows = processedData.map((row) => [
            ...originalHeaders.map((header) => row.cells[header] ?? ''),
            row.dapKgHa ?? '',
            row.ureaKgHa ?? '',
        ]);
        return { outputHeaders, outputRows };
    };

    const downloadCsvFile = (processedData, originalHeaders) => {
        const { outputHeaders, outputRows } = buildOutputRows(processedData, originalHeaders);
        const csvContent = [
            outputHeaders.map(escapeCsvValue).join(','),
            ...outputRows.map((row) => row.map(escapeCsvValue).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute(
            'download',
            `fertilizer_recommendations_${new Date().toISOString().split('T')[0]}.csv`
        );
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const downloadXlsxFile = (processedData, originalHeaders) => {
        const { outputHeaders, outputRows } = buildOutputRows(processedData, originalHeaders);
        const worksheetData = [outputHeaders, ...outputRows];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Recommendations');
        XLSX.writeFile(
            workbook,
            `fertilizer_recommendations_${new Date().toISOString().split('T')[0]}.xlsx`
        );
    };

    const generateAndDownloadFile = (processedData, originalHeaders, fileFormat) => {
        if (fileFormat === 'xlsx') {
            downloadXlsxFile(processedData, originalHeaders);
            return;
        }
        downloadCsvFile(processedData, originalHeaders);
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
            
            const newCollectedData = { ...collectedData };
            const extracted = groqResponse.extracted_data || {};

            if (extracted.crop) {
                newCollectedData.crop = extracted.crop;
            }
            if (extracted.coordinates) {
                newCollectedData.coordinates = extracted.coordinates;
            }
            if (extracted.farm_size_ha != null && extracted.farm_size_ha !== '') {
                newCollectedData.farmSizeHa = parseFloat(extracted.farm_size_ha);
            }

            const parsedFarmHa = extractFarmSizeFromText(textToSend);
            if (parsedFarmHa != null) {
                newCollectedData.farmSizeHa = parsedFarmHa;
            }

            setCollectedData(newCollectedData);

            let botResponse = groqResponse.response;

            const readyForRecommendation =
                newCollectedData.crop &&
                newCollectedData.coordinates &&
                newCollectedData.farmSizeHa > 0;

            if (groqResponse.next_action === 'get_recommendation' || readyForRecommendation) {
                if (readyForRecommendation) {
                    await getCombinedRecommendation(newCollectedData);
                    return;
                }
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
                                <span>Processing file...</span>
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
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            
        </div>
    );
}

export default Chatbot; 