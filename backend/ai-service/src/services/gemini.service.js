const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../config");
const logger = require("../utils/logger");

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const generateContent = async (prompt, options = {}) => {
	const { useBatching = false, batchSize = 15, targetCount = 200 } = options;

	// If batching is not requested, use original single call approach
	if (!useBatching) {
		return await generateSingleContent(prompt);
	}

	// Use batching for large question sets
	return await generateBatchedContent(prompt, targetCount, batchSize);
};

const generateSingleContent = async (prompt) => {
	try {
		const model = genAI.getGenerativeModel({
			model: "gemini-1.5-flash",
			generationConfig: {
				temperature: 0.7,
				maxOutputTokens: 4096, // Reduced to prevent truncation
				topP: 0.9,
				topK: 50,
			},
		});
		logger.info("Generating content with Gemini AI.");

		const result = await model.generateContent(prompt);
		const response = await result.response;
		let text = response.text();
		text = text.replace(/```json|```/g, "").trim();

		logger.info("Successfully generated content from AI.");

		// Log response length for debugging
		logger.info(`Response length: ${text.length} characters`);

		// Check if response seems truncated
		if (text.length > 3000 && !text.trim().endsWith('}') && !text.trim().endsWith(']')) {
			logger.warn("Response appears to be truncated - reducing batch size recommended");
		}

		let parsedResponse;
		try {
			parsedResponse = JSON.parse(text);
		} catch (parseError) {
			logger.warn("Initial JSON parse failed, attempting to fix issues...");

			// Try multiple fix strategies for large responses
			let fixedText = text;

			// Strategy 1: Fix common JSON syntax issues
			fixedText = fixedText
				.replace(/,\s*}/g, '}')
				.replace(/,\s*]/g, ']')
				.replace(/\n/g, ' ')
				.replace(/\r/g, '')
				.trim();

			try {
				parsedResponse = JSON.parse(fixedText);
				logger.info("Successfully fixed JSON with strategy 1");
			} catch (secondError) {
				// Strategy 2: Handle truncated JSON by finding last complete object/array
				logger.warn("Strategy 1 failed, attempting to recover truncated JSON...");

				try {
					// Find the last complete bracket structure
					let lastValidJson = '';
					if (fixedText.startsWith('[')) {
						// Array case - find last complete ]
						const lastBracket = fixedText.lastIndexOf(']');
						if (lastBracket > 0) {
							lastValidJson = fixedText.substring(0, lastBracket + 1);
						}
					} else if (fixedText.startsWith('{')) {
						// Object case - find last complete }
						const lastBrace = fixedText.lastIndexOf('}');
						if (lastBrace > 0) {
							lastValidJson = fixedText.substring(0, lastBrace + 1);
						}
					}

					if (lastValidJson) {
						parsedResponse = JSON.parse(lastValidJson);
						logger.info("Successfully recovered truncated JSON with strategy 2");
					} else {
						throw new Error("Could not recover JSON structure");
					}
				} catch (thirdError) {
					// Strategy 3: Try to extract partial data
					logger.warn("All JSON recovery strategies failed, extracting partial data...");

					// Look for any complete JSON objects in the text
					const jsonPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
					const matches = fixedText.match(jsonPattern);

					if (matches && matches.length > 0) {
						const partialData = [];
						matches.forEach(match => {
							try {
								const obj = JSON.parse(match);
								partialData.push(obj);
							} catch (e) {
								// Skip invalid matches
							}
						});

						if (partialData.length > 0) {
							parsedResponse = partialData;
							logger.info(`Extracted ${partialData.length} partial objects from corrupted response`);
						} else {
							throw new Error("No recoverable data found");
						}
					} else {
						throw new Error("No JSON patterns found in response");
					}
				}
			}
		}

		return Array.isArray(parsedResponse) ? parsedResponse : [];
	} catch (error) {
		logger.error({
			message: "Error in Gemini AI content generation",
			error: error.message,
		});
		if (error.message.includes("JSON")) {
			logger.error("Failed to parse AI response as JSON.");
		}
		return [];
	}
};

const generateBatchedContent = async (basePrompt, targetCount = 200, batchSize = 15) => {
	const batches = Math.ceil(targetCount / batchSize);
	const allQuestions = [];
	let successfulBatches = 0;
	let failedBatches = 0;

	logger.info(`Generating ${targetCount} questions in ${batches} batches of ${batchSize}.`);

	for (let i = 0; i < batches; i++) {
		const startNum = i * batchSize + 1;
		const endNum = Math.min((i + 1) * batchSize, targetCount);
		const questionsInBatch = endNum - startNum + 1;

		// Simple, clear prompt to minimize response size
		const batchPrompt = `Generate exactly ${questionsInBatch} questions following this format:
${basePrompt}

Requirements:
- Number from ${startNum} to ${endNum}
- Return as valid JSON array only
- Keep responses concise
- No extra text outside JSON

Example format: ["question":"...","answer":"..."},...]`;

		logger.info(`Generating batch ${i + 1}/${batches} (questions ${startNum}-${endNum})`);

		let retryCount = 0;
		const maxRetries = 3;
		let batchSuccess = false;

		while (retryCount <= maxRetries && !batchSuccess) {
			try {
				const batchQuestions = await generateSingleContent(batchPrompt);
				if (batchQuestions && batchQuestions.length > 0) {
					allQuestions.push(...batchQuestions);
					successfulBatches++;
					logger.info(`✓ Batch ${i + 1} completed: ${batchQuestions.length} questions generated.`);
					batchSuccess = true;
				} else {
					throw new Error("Empty response received");
				}
			} catch (error) {
				retryCount++;
				logger.error(`✗ Batch ${i + 1}, attempt ${retryCount} failed:`, error.message);

				if (retryCount <= maxRetries) {
					// Exponential backoff
					const delay = Math.min(2000 * retryCount, 6000);
					logger.info(`Retrying batch ${i + 1} in ${delay}ms...`);
					await new Promise(resolve => setTimeout(resolve, delay));
				} else {
					failedBatches++;
					logger.error(`✗ Batch ${i + 1} failed after ${maxRetries} attempts - skipping`);
				}
			}
		}

		// Progressive delay - longer delays as we generate more
		const delay = Math.min(1000 + (i * 100), 3000);
		if (i < batches - 1) {
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}

	logger.info(`Generation complete: ${allQuestions.length} total questions`);
	logger.info(`Success rate: ${successfulBatches}/${batches} batches (${failedBatches} failed)`);

	if (failedBatches > 0) {
		logger.warn(`Consider using smaller batch size if failures persist`);
	}

	return allQuestions;
};
module.exports = {
	generateContent,
};
