// AI utility functions for text extraction and formatting

export interface ApiKeyStatus {
  key: string;
  isWorking: boolean;
  lastUsed: number;
  errorCount: number;
  successCount: number;
}

// Multiple Gemini API keys for better reliability and load distribution
export const GEMINI_API_KEYS = [
  process.env.NEXT_PUBLIC_GEMINI_API_KEY_1,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY_2,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY_3,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY_4,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY_5,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY_6,
].filter(Boolean) as string[];

// Log API keys status (without exposing full keys)
if (typeof window === 'undefined') {
  console.log(`[Server] Loaded ${GEMINI_API_KEYS.length} API keys from environment`);
} else {
  console.log(`[Client] Loaded ${GEMINI_API_KEYS.length} API keys from environment`);
}

// Fallback API keys for load balancing - using the new provided key
const FALLBACK_API_KEYS = [
  "AIzaSyADFy9g965oV8Qv7V_FjCNgqud8dCsUL9E",
  "AIzaSyADFy9g965oV8Qv7V_FjCNgqud8dCsUL9E", // Duplicate for load balancing
  "AIzaSyADFy9g965oV8Qv7V_FjCNgqud8dCsUL9E",
  "AIzaSyADFy9g965oV8Qv7V_FjCNgqud8dCsUL9E",
  "AIzaSyADFy9g965oV8Qv7V_FjCNgqud8dCsUL9E",
  "AIzaSyADFy9g965oV8Qv7V_FjCNgqud8dCsUL9E",
];

export const getApiKeys = (): string[] => {
  const keys = GEMINI_API_KEYS.length > 0 ? GEMINI_API_KEYS : FALLBACK_API_KEYS;
  if (typeof window === 'undefined') {
    console.log(`[Server] Using ${keys.length} API keys (${GEMINI_API_KEYS.length > 0 ? 'from env' : 'fallback'})`);
  }
  return keys;
};

/**
 * Get the best working API key based on competition (least used, most successful)
 */
export const getWorkingApiKey = (
  apiKeyStatuses: ApiKeyStatus[]
): string | null => {
  const workingKeys = apiKeyStatuses
    .filter((status) => status.isWorking)
    .sort((a, b) => {
      // Sort by success rate first, then by last used time
      const aSuccessRate =
        a.successCount / Math.max(a.successCount + a.errorCount, 1);
      const bSuccessRate =
        b.successCount / Math.max(b.successCount + b.errorCount, 1);

      if (Math.abs(aSuccessRate - bSuccessRate) < 0.1) {
        // If success rates are similar, use least recently used
        return a.lastUsed - b.lastUsed;
      }
      return bSuccessRate - aSuccessRate; // Higher success rate first
    });

  return workingKeys.length > 0 ? workingKeys[0].key : null;
};

/**
 * Update API key status after a request
 */
export const updateApiKeyStatus = (
  apiKeyStatuses: ApiKeyStatus[],
  apiKey: string,
  success: boolean,
  error?: string
): ApiKeyStatus[] => {
  return apiKeyStatuses.map((status) => {
    if (status.key === apiKey) {
      // Check if error is quota exceeded (429) - mark as not working immediately
      const isQuotaExceeded = error?.includes("429") || error?.includes("RESOURCE_EXHAUSTED") || error?.includes("quota");
      
      return {
        ...status,
        // Mark as not working immediately if quota exceeded, otherwise check error count
        isWorking: success ? true : (isQuotaExceeded ? false : status.errorCount < 5),
        lastUsed: Date.now(),
        errorCount: success ? 0 : status.errorCount + 1,
        successCount: success ? status.successCount + 1 : status.successCount,
      };
    }
    return status;
  });
};

/**
 * Convert ArrayBuffer to Base64 string
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * Convert Base64 string to ArrayBuffer
 */
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Extract text from image using Gemini API with failover
 */
export const extractTextFromImageWithFailover = async (
  file: File,
  apiKeyStatuses: ApiKeyStatus[],
  maxRetries: number = 3
): Promise<string> => {
  const prompt =
    "Extract all structured data from this image that could be represented in a table. Return the data as a single block of raw, unformatted text without any commentary or headings. Just the raw data.";

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = getWorkingApiKey(apiKeyStatuses);
    if (!apiKey) {
      throw new Error("No working API keys available");
    }

    try {
      const base64ImageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () =>
          resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64ImageData,
                },
              },
            ],
          },
        ],
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        const generatedText =
          result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (generatedText) {
          return generatedText;
        } else {
          throw new Error("No text generated from API response");
        }
      } else {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(
        `Attempt ${attempt + 1} failed for API key ${apiKey}:`,
        error
      );

      if (attempt === maxRetries - 1) {
        throw error;
      }
    }
  }

  throw new Error("All retry attempts failed");
};

/**
 * Format text as table using Gemini API with failover
 */
export const formatTextAsTableWithFailover = async (
  text: string,
  apiKeyStatuses: ApiKeyStatus[],
  maxRetries: number = 3
): Promise<Record<string, any>[]> => {
  const prompt = `Extract equipment/inventory data from this text and format it as a JSON array. Each item should have these exact columns:

Required columns:
- Item_Description: The name/description of the equipment (e.g., "Screen", "CPU", "hp screen")
- Quantity: Number of items (extract numbers only, e.g., "1", "2")
- Serial_Number: Serial number or identifier (e.g., "1H35070V93", "1HF5MOW3X", "1HFSAMOW2R", "AH 35070 V2H")
- Tag_Number: Tag number or code (e.g., "MOHDIG125/SCR587", "MOH/AIG125/CPU 1131", "CPU2024", "SCR 513")
- Status: Status of the item (e.g., "New", "CPU 1127", "2014")

IMPORTANT PATTERNS TO RECOGNIZE:

1. CPU Items:
   - "1 CPU 1 1HF5MOW3X MOH/ΔIG1951 CPU 1127"
   - "1 CPU 1 1HF5110YJZ MOH/AIG125/CPU 1131"
   - "1 CPU 1 1HFSAMOW2R CPU2024"

2. Screen Items:
   - "1 Screen 1 1H35070V93 MOHDIG125/SCR587"
   - "1 Screen 1 1H35070V93 SCR 513"
   - "1 Screen 1H 350 70T 94 MOHIDIG125/SCR234"

3. Serial Number Patterns:
   - Starts with "1H", "AH", "1HF", "1HFS" followed by alphanumeric characters
   - May contain spaces: "1H 350 70T 94", "AH 35070 V2H"
   - Examples: "1H35070V93", "1HF5MOW3X", "1HFSAMOW2R"

4. Tag Number Patterns:
   - MOH patterns: "MOHDIG125/SCR587", "MOH/AIG125/CPU 1131", "MOH/ΔIG1951"
   - CPU patterns: "CPU2024", "CPU109P", "CPU 1131"
   - SCR patterns: "SCR 513", "SCR587", "SCR011"

Instructions:
1. Look for the specific patterns above
2. Extract each line as a separate row
3. Parse Serial_Number and Tag_Number accurately - they are distinct fields
4. Handle spaces in serial numbers correctly
5. If any column is missing, use empty string ""
6. Return ONLY a valid JSON array

Text to process:
${text}

Example format:
[
  {
    "Item_Description": "CPU",
    "Quantity": "1",
    "Serial_Number": "1HF5MOW3X",
    "Tag_Number": "MOH/ΔIG1951",
    "Status": "CPU 1127"
  },
  {
    "Item_Description": "Screen",
    "Quantity": "1",
    "Serial_Number": "1H35070V93",
    "Tag_Number": "MOHDIG125/SCR587",
    "Status": "New"
  }
]`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = getWorkingApiKey(apiKeyStatuses);
    if (!apiKey) {
      throw new Error("No working API keys available");
    }

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                Item_Description: { type: "string" },
                Quantity: { type: "string" },
                Serial_Number: { type: "string" },
                Tag_Number: { type: "string" },
                Status: { type: "string" },
              },
            },
          },
        },
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        let generatedJson = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log("API Response:", result);
        console.log("Generated JSON:", generatedJson);

        if (generatedJson) {
          console.log("Generated JSON:", generatedJson);

          // Try multiple JSON extraction methods
          let parsedData = null;

          // Method 1: Direct parsing
          try {
            parsedData = JSON.parse(generatedJson);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              console.log(
                "Successfully parsed direct JSON with",
                parsedData.length,
                "items"
              );
              // Update API key status on success
              updateApiKeyStatus(apiKeyStatuses, apiKey, true);
              return parsedData;
            }
          } catch (e) {
            console.log("Direct parsing failed, trying other methods...");
          }

          // Method 2: Clean up and parse
          try {
            const cleanedJsonString = generatedJson
              .replace(/```json|```/g, "")
              .replace(/^[^{]*/, "") // Remove any text before the first {
              .replace(/[^}]*$/, "") // Remove any text after the last }
              .trim();

            if (cleanedJsonString) {
              parsedData = JSON.parse(cleanedJsonString);
              if (Array.isArray(parsedData) && parsedData.length > 0) {
                console.log(
                  "Successfully parsed cleaned JSON with",
                  parsedData.length,
                  "items"
                );
                // Update API key status on success
                updateApiKeyStatus(apiKeyStatuses, apiKey, true);
                return parsedData;
              }
            }
          } catch (e) {
            console.log("Cleaned parsing failed, trying extraction...");
          }

          // Method 3: Extract JSON array from response
          try {
            const jsonMatch = generatedJson.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
              console.log("Found JSON array match:", jsonMatch[0]);
              parsedData = JSON.parse(jsonMatch[0]);
              if (Array.isArray(parsedData) && parsedData.length > 0) {
                console.log(
                  "Successfully parsed extracted JSON with",
                  parsedData.length,
                  "items"
                );
                // Update API key status on success
                updateApiKeyStatus(apiKeyStatuses, apiKey, true);
                return parsedData;
              }
            }
          } catch (e) {
            console.log("Extraction parsing failed, trying fallback...");
          }

          // Method 4: Try to find any valid JSON in the response
          try {
            const jsonPattern = /\[[\s\S]*?\]/g;
            let match;
            while ((match = jsonPattern.exec(generatedJson)) !== null) {
              try {
                const testData = JSON.parse(match[0]);
                if (Array.isArray(testData) && testData.length > 0) {
                  console.log(
                    "Successfully parsed pattern-matched JSON with",
                    testData.length,
                    "items"
                  );
                  // Update API key status on success
                  updateApiKeyStatus(apiKeyStatuses, apiKey, true);
                  return testData;
                }
              } catch (e) {
                // Continue to next match
              }
            }
          } catch (e) {
            console.log("Pattern matching failed");
          }
        }
        console.log("No valid JSON found, falling back to pattern matching");
        // Don't throw error, use fallback parsing instead
        return fallbackTableParsing(text);
      } else {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);

        // Handle specific error codes
        if (response.status === 503) {
          console.log("API overloaded (503), will try next key or fallback");
          throw new Error(
            `API Overloaded: ${response.status} ${response.statusText}`
          );
        } else if (response.status === 429) {
          console.log("Quota exceeded (429) for API key, marking as not working");
          // Mark this key as not working immediately for quota errors
          updateApiKeyStatus(
            apiKeyStatuses,
            apiKey,
            false,
            `Quota exceeded: ${errorText}`
          );
          throw new Error(
            `API Quota Exceeded: This API key has reached its usage limit. Please check your billing details or try a different key. Status: ${response.status}`
          );
        } else {
          throw new Error(
            `API Error: ${response.status} ${response.statusText} - ${errorText}`
          );
        }
      }
    } catch (error) {
      console.error(
        `Attempt ${attempt + 1} failed for API key ${apiKey}:`,
        error
      );

      // Check if it's a quota error and mark key as not working
      const isQuotaError = error instanceof Error && 
        (error.message.includes("429") || 
         error.message.includes("quota") || 
         error.message.includes("RESOURCE_EXHAUSTED"));
      
      updateApiKeyStatus(
        apiKeyStatuses,
        apiKey,
        false,
        error instanceof Error ? error.message : "Unknown error"
      );

      if (attempt === maxRetries - 1) {
        // If quota error, provide helpful message
        if (isQuotaError) {
          throw new Error(
            `API Quota Exceeded: All API keys have reached their usage limits. Please check your billing details at https://ai.dev/usage?tab=rate-limit`
          );
        }
        throw error;
      }
    }
  }

  // If all AI attempts fail, try a simple fallback parsing
  console.log("AI formatting failed, attempting fallback parsing...");
  return fallbackTableParsing(text);
};

/**
 * Fallback table parsing when AI fails
 */
const fallbackTableParsing = (text: string): Record<string, any>[] => {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  const result: Record<string, any>[] = [];

  console.log("Fallback parsing text:", text);
  console.log("Lines to process:", lines);

  // Look for specific patterns from your equipment data
  const patterns = [
    // Pattern 1: CPU items with complex tag numbers - "1 CPU 1 1HF5MOW3X MOH/ΔIG1951 CPU 1127"
    /^(\d+)\s+([A-Za-z]+)\s+(\d+)\s+([A-Z0-9]+)\s+(MOH[\/\\][ΔD]IG[A-Z0-9\/\\]*?)\s+((?:CPU|\d{4})?\s*\d+)\s+([A-Za-z]+)$/,

    // Pattern 2: CPU items with simple tag numbers - "1 CPU 1 1HF5110YJZ MOH/AIG125/CPU 1131"
    /^(\d+)\s+([A-Za-z]+)\s+(\d+)\s+([A-Z0-9]+)\s+(MOH[\/\\][A-Z0-9\/\\]*?)\s+([A-Za-z]+)$/,

    // Pattern 3: CPU items with CPU prefix tag - "1 CPU 1 1HFSAMOW2R CPU2024"
    /^(\d+)\s+([A-Za-z]+)\s+(\d+)\s+([A-Z0-9]+)\s+(CPU[A-Z0-9]+)\s+([A-Za-z]+)$/,

    // Pattern 4: Screen items with MOH tag numbers - "1 Screen 1 1H35070V93 MOHDIG125/SCR587"
    /^(\d+)\s+([A-Za-z]+)\s+(\d+)\s+([A-Z0-9]+)\s+(MOH[A-Z0-9\/\\]*?)\s+([A-Za-z]+)$/,

    // Pattern 5: Screen items with SCR tag numbers - "1 Screen 1 1H35070V93 SCR 513"
    /^(\d+)\s+([A-Za-z]+)\s+(\d+)\s+([A-Z0-9]+)\s+(SCR[A-Z0-9\s]*?)\s+([A-Za-z]+)$/,

    // Pattern 6: Items with spaces in serial numbers - "1 Screen 1H 350 70T 94 MOHIDIG125/SCR234"
    /^(\d+)\s+([A-Za-z]+)\s+([A-Z0-9\s]+)\s+(MOH[A-Z0-9\/\\]*?)\s+([A-Za-z]+)$/,

    // Pattern 7: Items with spaces in serial and SCR tags - "1 Screen 1H 350 70T 94 SCR 234"
    /^(\d+)\s+([A-Za-z]+)\s+([A-Z0-9\s]+)\s+(SCR[A-Z0-9\s]*?)\s+([A-Za-z]+)$/,

    // Pattern 8: Simple format without row numbers - "Screen 1 1H35070V93 MOHDIG125/SCR587 New"
    /^([A-Za-z]+)\s+(\d+)\s+([A-Z0-9\s]+)\s+(MOH[A-Z0-9\/\\]*?)\s+([A-Za-z]+)$/,

    // Pattern 9: Simple format with SCR tags - "Screen 1 1H35070V93 SCR 513 New"
    /^([A-Za-z]+)\s+(\d+)\s+([A-Z0-9\s]+)\s+(SCR[A-Z0-9\s]*?)\s+([A-Za-z]+)$/,

    // Pattern 10: CPU with simple format - "CPU 1 1HF5110YJZ CPU109P New"
    /^([A-Za-z]+)\s+(\d+)\s+([A-Z0-9\s]+)\s+(CPU[A-Z0-9]+)\s+([A-Za-z]+)$/,

    // Pattern 11: Legacy patterns for backward compatibility
    /^(\d+)\s+([A-Za-z\s]+)\s+(\d+)\s+([A-Z0-9]+)\s+([A-Z0-9/]+)\s+([A-Z0-9]+)\s+([A-Za-z]+)$/,
    /^(\d+)\s+([A-Za-z\s]+)\s+(\d+)\s+([A-Z0-9]+)\s+([A-Z0-9/]+)\s+([A-Z0-9]+)$/,

    // Pattern 12: Comma-separated format
    /^([^,]+),(\d+),([^,]+),([^,]+)/,

    // Pattern 13: Space-separated format
    /^(.+?)\s+(\d+)\s+([^\s]+)\s+(.+)$/,

    // Pattern 14: Numbered list format
    /^\d+\.\s*(.+?)\s+(\d+)\s+([^\s]+)\s+(.+)$/,
  ];

  for (const line of lines) {
    let matched = false;
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = line.match(pattern);
      if (match) {
        console.log("Pattern matched:", pattern, "for line:", line);

        if (i === 0) {
          // Pattern 1: CPU items with complex tag numbers - "1 CPU 1 1HF5MOW3X MOH/ΔIG1951 CPU 1127"
          result.push({
            Item_Description: match[2]?.trim() || "",
            Quantity: match[3]?.trim() || "",
            Serial_Number: match[4]?.trim() || "",
            Tag_Number: match[5]?.trim() || "",
            Status: match[6]?.trim() || "",
          });
        } else if (i === 1) {
          // Pattern 2: CPU items with simple tag numbers - "1 CPU 1 1HF5110YJZ MOH/AIG125/CPU 1131"
          result.push({
            Item_Description: match[2]?.trim() || "",
            Quantity: match[3]?.trim() || "",
            Serial_Number: match[4]?.trim() || "",
            Tag_Number: match[5]?.trim() || "",
            Status: match[6]?.trim() || "",
          });
        } else if (i === 2) {
          // Pattern 3: CPU items with CPU prefix tag - "1 CPU 1 1HFSAMOW2R CPU2024"
          result.push({
            Item_Description: match[2]?.trim() || "",
            Quantity: match[3]?.trim() || "",
            Serial_Number: match[4]?.trim() || "",
            Tag_Number: match[5]?.trim() || "",
            Status: match[6]?.trim() || "",
          });
        } else if (i === 3) {
          // Pattern 4: Screen items with MOH tag numbers - "1 Screen 1 1H35070V93 MOHDIG125/SCR587"
          result.push({
            Item_Description: match[2]?.trim() || "",
            Quantity: match[3]?.trim() || "",
            Serial_Number: match[4]?.trim() || "",
            Tag_Number: match[5]?.trim() || "",
            Status: match[6]?.trim() || "",
          });
        } else if (i === 4) {
          // Pattern 5: Screen items with SCR tag numbers - "1 Screen 1 1H35070V93 SCR 513"
          result.push({
            Item_Description: match[2]?.trim() || "",
            Quantity: match[3]?.trim() || "",
            Serial_Number: match[4]?.trim() || "",
            Tag_Number: match[5]?.trim() || "",
            Status: match[6]?.trim() || "",
          });
        } else if (i === 5) {
          // Pattern 6: Items with spaces in serial numbers - "1 Screen 1H 350 70T 94 MOHIDIG125/SCR234"
          result.push({
            Item_Description: match[2]?.trim() || "",
            Quantity: match[3]?.trim() || "",
            Serial_Number: match[4]?.trim() || "",
            Tag_Number: match[5]?.trim() || "",
            Status: match[6]?.trim() || "",
          });
        } else if (i === 6) {
          // Pattern 7: Items with spaces in serial and SCR tags - "1 Screen 1H 350 70T 94 SCR 234"
          result.push({
            Item_Description: match[2]?.trim() || "",
            Quantity: match[3]?.trim() || "",
            Serial_Number: match[4]?.trim() || "",
            Tag_Number: match[5]?.trim() || "",
            Status: match[6]?.trim() || "",
          });
        } else if (i === 7) {
          // Pattern 8: Simple format without row numbers - "Screen 1 1H35070V93 MOHDIG125/SCR587 New"
          result.push({
            Item_Description: match[1]?.trim() || "",
            Quantity: match[2]?.trim() || "",
            Serial_Number: match[3]?.trim() || "",
            Tag_Number: match[4]?.trim() || "",
            Status: match[5]?.trim() || "",
          });
        } else if (i === 8) {
          // Pattern 9: Simple format with SCR tags - "Screen 1 1H35070V93 SCR 513 New"
          result.push({
            Item_Description: match[1]?.trim() || "",
            Quantity: match[2]?.trim() || "",
            Serial_Number: match[3]?.trim() || "",
            Tag_Number: match[4]?.trim() || "",
            Status: match[5]?.trim() || "",
          });
        } else if (i === 9) {
          // Pattern 10: CPU with simple format - "CPU 1 1HF5110YJZ CPU109P New"
          result.push({
            Item_Description: match[1]?.trim() || "",
            Quantity: match[2]?.trim() || "",
            Serial_Number: match[3]?.trim() || "",
            Tag_Number: match[4]?.trim() || "",
            Status: match[5]?.trim() || "",
          });
        } else if (i === 10) {
          // Pattern 11: Legacy 6-part pattern
          result.push({
            Item_Description: match[2]?.trim() || "",
            Quantity: match[3]?.trim() || "",
            Serial_Number: match[4]?.trim() || "",
            Tag_Number: match[5]?.trim() || "",
            Status: match[7]?.trim() || "",
          });
        } else if (i === 11) {
          // Pattern 12: Legacy 5-part pattern
          result.push({
            Item_Description: match[2]?.trim() || "",
            Quantity: match[3]?.trim() || "",
            Serial_Number: match[4]?.trim() || "",
            Tag_Number: match[5]?.trim() || "",
            Status: "New", // Default status
          });
        } else if (i === 12) {
          // Pattern 13: Comma-separated format
          result.push({
            Item_Description: match[1]?.trim() || "",
            Quantity: match[2]?.trim() || "",
            Serial_Number: match[3]?.trim() || "",
            Tag_Number: match[4]?.trim() || "",
            Status: "New", // Default status
          });
        } else if (i === 13) {
          // Pattern 14: Space-separated format
          result.push({
            Item_Description: match[1]?.trim() || "",
            Quantity: match[2]?.trim() || "",
            Serial_Number: match[3]?.trim() || "",
            Tag_Number: match[4]?.trim() || "",
            Status: "New", // Default status
          });
        } else if (i === 14) {
          // Pattern 15: Numbered list format
          result.push({
            Item_Description: match[1]?.trim() || "",
            Quantity: match[2]?.trim() || "",
            Serial_Number: match[3]?.trim() || "",
            Tag_Number: match[4]?.trim() || "",
            Status: "New", // Default status
          });
        } else {
          // Fallback for any other patterns
          result.push({
            Item_Description: match[2]?.trim() || match[1]?.trim() || "",
            Quantity: match[3]?.trim() || match[2]?.trim() || "1",
            Serial_Number: match[4]?.trim() || match[3]?.trim() || "",
            Tag_Number: match[5]?.trim() || match[4]?.trim() || "",
            Status: match[6]?.trim() || match[5]?.trim() || "New",
          });
        }
        matched = true;
        break;
      }
    }

    if (!matched) {
      console.log("No pattern matched for line:", line);
    }
  }

  // If no patterns matched, create a simple structure
  if (result.length === 0) {
    console.log("No patterns matched, creating simple structure");
    lines.forEach((line, index) => {
      if (line.trim()) {
        result.push({
          Item_Description: line.trim(),
          Quantity: "",
          Serial_Number: "",
          Tag_Number: "",
          Status: "",
          Row_Number: index + 1,
        });
      }
    });
  }

  console.log("Fallback parsing result:", result);
  return result;
};

/**
 * Initialize API key statuses
 */
export const initializeApiKeyStatuses = (): ApiKeyStatus[] => {
  return getApiKeys().map((key) => ({
    key,
    isWorking: true,
    lastUsed: 0,
    errorCount: 0,
    successCount: 0,
  }));
};

/**
 * Expense recommendation interface
 */
export interface ExpenseRecommendation {
  category: string;
  recommendedAmount: number;
  percentage: number;
  description: string;
  priority: "essential" | "important" | "optional";
}

export interface ExpensePlan {
  salary: number;
  expenses: ExpenseRecommendation[];
  savings: {
    recommendedAmount: number;
    percentage: number;
    description: string;
  };
  emergencyFund: {
    recommendedAmount: number;
    percentage: number;
    description: string;
  };
  totalExpenses: number;
  remaining: number;
  recommendations: string[];
}

/**
 * Get expense recommendations from Gemini API
 */
export const getExpenseRecommendations = async (
  netSalary: number,
  apiKeyStatuses: ApiKeyStatus[],
  maxRetries: number = 3
): Promise<ExpensePlan> => {
  const prompt = `You are a financial advisor AI. Help create a comprehensive expense and savings plan based on a net salary of $${netSalary.toLocaleString()} per month.

Provide a detailed budget breakdown following these principles:
1. Essential expenses (housing, utilities, food, transportation) should be 50-60% of income
2. Savings should be 20-30% of income
3. Emergency fund should be part of savings allocation
4. Personal/entertainment should be 10-15% of income
5. Remaining can be for investments or extra savings

Return ONLY a valid JSON object with this exact structure:
{
  "expenses": [
    {
      "category": "Category name (e.g., Housing/Rent)",
      "recommendedAmount": number in dollars,
      "percentage": number representing percentage of salary,
      "description": "Brief explanation",
      "priority": "essential" | "important" | "optional"
    }
  ],
  "savings": {
    "recommendedAmount": number in dollars,
    "percentage": number representing percentage of salary,
    "description": "Savings plan explanation"
  },
  "emergencyFund": {
    "recommendedAmount": number in dollars,
    "percentage": number representing percentage of salary,
    "description": "Emergency fund explanation"
  },
  "recommendations": [
    "Array of actionable financial advice strings"
  ]
}

Make sure:
- Total expenses + savings + emergency fund should equal approximately 100% of salary
- Include essential categories: Housing/Rent, Utilities, Food/Groceries, Transportation, Healthcare, Insurance
- Include important categories: Personal Care, Entertainment, Subscriptions
- Provide realistic amounts based on the salary range
- Prioritize savings and emergency fund
- Give practical, actionable recommendations`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = getWorkingApiKey(apiKeyStatuses);
    if (!apiKey) {
      throw new Error("No working API keys available");
    }

    try {
      // Try Gemini 2.0 Flash models first, then fallback to 1.5
      const modelEndpoints = [
        "gemini-2.0-flash-exp",      // Gemini 2.0 Flash Experimental
        "gemini-2.0-flash",          // Gemini 2.0 Flash
        "gemini-2.0-flash-thinking-exp", // Gemini 2.0 Flash Thinking
        "gemini-1.5-flash-latest",   // Fallback to 1.5 Flash Latest
        "gemini-1.5-flash"           // Fallback to 1.5 Flash
      ];
      
      let lastError: Error | null = null;
      
      for (const model of modelEndpoints) {
        try {
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          
          const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  expenses: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        category: { type: "string" },
                        recommendedAmount: { type: "number" },
                        percentage: { type: "number" },
                        description: { type: "string" },
                        priority: {
                          type: "STRING",
                          enum: ["essential", "important", "optional"],
                        },
                      },
                      required: [
                        "category",
                        "recommendedAmount",
                        "percentage",
                        "description",
                        "priority",
                      ],
                    },
                  },
                  savings: {
                    type: "OBJECT",
                    properties: {
                      recommendedAmount: { type: "number" },
                      percentage: { type: "number" },
                      description: { type: "string" },
                    },
                    required: ["recommendedAmount", "percentage", "description"],
                  },
                  emergencyFund: {
                    type: "OBJECT",
                    properties: {
                      recommendedAmount: { type: "number" },
                      percentage: { type: "number" },
                      description: { type: "string" },
                    },
                    required: ["recommendedAmount", "percentage", "description"],
                  },
                  recommendations: {
                    type: "ARRAY",
                    items: { type: "string" },
                  },
                },
                required: ["expenses", "savings", "emergencyFund", "recommendations"],
              },
            },
          };

          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          
          if (response.status === 404) {
            // Model not found, try next model
            console.log(`Model ${model} not found, trying next...`);
            lastError = new Error(`Model ${model} not available`);
            continue;
          }

          if (response.ok) {
            const result = await response.json();
            let generatedJson =
              result?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (generatedJson) {
              try {
                const parsedData = JSON.parse(generatedJson);
                const totalExpenses = parsedData.expenses.reduce(
                  (sum: number, exp: ExpenseRecommendation) =>
                    sum + exp.recommendedAmount,
                  0
                );
                const totalSavings =
                  parsedData.savings.recommendedAmount +
                  parsedData.emergencyFund.recommendedAmount;
                const remaining = netSalary - totalExpenses - totalSavings;

                updateApiKeyStatus(apiKeyStatuses, apiKey, true);
                console.log(`Successfully got recommendations using model: ${model}`);
                return {
                  salary: netSalary,
                  expenses: parsedData.expenses,
                  savings: parsedData.savings,
                  emergencyFund: parsedData.emergencyFund,
                  totalExpenses,
                  remaining,
                  recommendations: parsedData.recommendations || [],
                };
              } catch (parseError) {
                console.error("JSON parsing error:", parseError);
                lastError = new Error("Failed to parse API response");
                continue; // Try next model
              }
            } else {
              lastError = new Error("No content generated from API");
              continue; // Try next model
            }
          } else {
            const errorText = await response.text();
            
            // Handle quota exceeded errors specifically
            if (response.status === 429) {
              // Only log once, not for every model attempt
              if (model === modelEndpoints[0]) {
                console.warn(`API Quota Exceeded for API key. Trying next API key...`);
              }
              updateApiKeyStatus(
                apiKeyStatuses,
                apiKey,
                false,
                `Quota exceeded: ${errorText}`
              );
              // Don't continue to next model if it's a quota error - try next API key instead
              throw new Error(
                `API Quota Exceeded: This API key has reached its usage limit. Please check your billing details at https://ai.dev/usage?tab=rate-limit or try a different key.`
              );
            }
            
            // For 404 (model not found), try next model silently
            if (response.status === 404) {
              console.log(`Model ${model} not found, trying next...`);
              lastError = new Error(`Model ${model} not available`);
              continue;
            }
            
            // For other errors, log and try next model
            if (response.status !== 404) {
              console.error(`API Error for ${model}: ${response.status} ${response.statusText}`);
              lastError = new Error(
                `API Error: ${response.status} ${response.statusText}`
              );
            }
            continue; // Try next model
          }
        } catch (modelError) {
          // Only log non-quota errors to reduce console noise
          const isQuotaError = modelError instanceof Error && 
            (modelError.message.includes("429") || 
             modelError.message.includes("quota") || 
             modelError.message.includes("RESOURCE_EXHAUSTED"));
          
          if (!isQuotaError) {
            console.log(`Model ${model} error:`, modelError instanceof Error ? modelError.message : String(modelError));
          }
          lastError = modelError instanceof Error ? modelError : new Error(String(modelError));
          // Continue to next model
          continue;
        }
      }
      
      // If all models failed, throw the last error
      if (lastError) {
        throw lastError;
      }
      throw new Error("All model endpoints failed");
    } catch (error) {
      // Check if it's a quota error and mark key as not working
      const isQuotaError = error instanceof Error && 
        (error.message.includes("429") || 
         error.message.includes("quota") || 
         error.message.includes("RESOURCE_EXHAUSTED"));
      
      if (isQuotaError) {
        // Mark as not working immediately for quota errors
        updateApiKeyStatus(
          apiKeyStatuses,
          apiKey,
          false,
          error instanceof Error ? error.message : "Quota exceeded"
        );
        // Only log once per API key attempt
        if (attempt === 0) {
          console.warn(`API key quota exceeded. Trying next available key...`);
        }
      } else {
        updateApiKeyStatus(
          apiKeyStatuses,
          apiKey,
          false,
          error instanceof Error ? error.message : "Unknown error"
        );
        console.error(
          `Attempt ${attempt + 1} failed for API key:`,
          error instanceof Error ? error.message : String(error)
        );
      }

      if (attempt === maxRetries - 1) {
        // On final attempt, provide helpful error message
        if (isQuotaError) {
          throw new Error(
            `All API keys have reached their quota limits. Please check your billing at https://ai.dev/usage?tab=rate-limit or add new API keys to your .env.local file.`
          );
        }
        throw error;
      }
    }
  }

  throw new Error("All retry attempts failed - all API keys have been exhausted. Please check your API key quotas.");
};
