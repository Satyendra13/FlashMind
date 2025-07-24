const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../config");
const logger = require("../utils/logger");

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

const DIRECT_GENERATION_THRESHOLD = 25;
const MAX_RETRIES = 2;

/**
 * Prepares the content, regardless of format (string or object), into a single string for the AI prompt.
 * @param {string|{englishNoteContent?: string, hindiNoteContent?: string}} content - The source content.
 * @returns {string} A single, combined string ready for the prompt.
 */
const _prepareContentForPrompt = (content) => {
	if (!content) {
		return "";
	}
	if (typeof content === 'object' && content !== null) {
		const parts = [];
		if (content.englishNoteContent && content.englishNoteContent.trim()) {
			parts.push(`English Content:\n${content.englishNoteContent.trim()}`);
		}
		if (content.hindiNoteContent && content.hindiNoteContent.trim()) {
			parts.push(`Hindi Content:\n${content.hindiNoteContent.trim()}`);
		}
		return parts.join('\n\n---\n\n');
	}
	if (typeof content === 'string') {
		return content.trim();
	}
	return "";
};

/**
 * Creates the prompt constraint to ensure generation is based on provided content.
 * @param {string} contentString - A single, prepared string of source content.
 * @returns {string} The prompt snippet to be added.
 */
const _createContentConstraint = (contentString) => {
	if (contentString && contentString.length > 0) {
		return `\nAll questions and answers MUST be derived exclusively from the following text. Do not use any external knowledge.\n\nText:\n"""\n${contentString}\n"""`;
	}
	return '';
};

/**
 * Main function to generate questions. Automatically uses the best strategy.
 * @param {string} basePrompt - The prompt containing JSON structure and other rules.
 * @param {number | null} totalQuestions - The total number of questions requested. If null/0, will generate max possible.
 * @param {string|object} content - The source content for the quiz.
 * @returns {Promise<Array>} A promise that resolves to an array of question objects.
 */
const generateContent = async (basePrompt, totalQuestions, content) => {
	const preparedContentString = _prepareContentForPrompt(content);
	const contentConstraintPrompt = _createContentConstraint(preparedContentString);

	// --- NEW: "Max Generation" Mode ---
	if (!totalQuestions || totalQuestions <= 0) {
		logger.info('totalQuestions is not set. Attempting to generate maximum possible questions from content.');

		if (!preparedContentString) {
			logger.warn('Cannot generate max questions because no content was provided. Returning empty array.');
			return [];
		}

		// A special prompt to instruct the AI to be exhaustive.
		const maxQuestionsPrompt = `Your task is to generate the maximum number of high-quality, unique quiz questions possible from the text provided below. Cover all significant facts, concepts, and details. Do not create trivial questions. ${basePrompt}${contentConstraintPrompt}`;
		
		// Use a single, direct request for this task.
		return await _executeModelRequest(maxQuestionsPrompt, 100); // Expecting a large number
	} else {
		// --- Original Logic for a specific number of questions ---
		if (totalQuestions <= DIRECT_GENERATION_THRESHOLD) {
			logger.info(`Generating ${totalQuestions} questions via single direct request.`);
			const fullPrompt = `Generate exactly ${totalQuestions} unique quiz questions. ${basePrompt}${contentConstraintPrompt}`;
			return await _executeModelRequest(fullPrompt, totalQuestions);
		} else {
			if (!preparedContentString) {
				logger.warn(`Topic-Based Generation requires content to generate ${totalQuestions} questions. Falling back to simple batching.`);
				return await _generateInBatches_Fallback(basePrompt, totalQuestions, 20, preparedContentString);
			}
			logger.info(`Question count (${totalQuestions}) is high. Using Topic-Based Generation strategy.`);
			return await _generateByTopic(basePrompt, totalQuestions, preparedContentString);
		}
	}
};


/**
 * Generates questions by first identifying topics from the content string.
 * @param {string} basePrompt - The prompt with JSON rules.
 * @param {number} targetCount - The total number of questions to generate.
 * @param {string} contentString - The prepared source content string.
 * @returns {Promise<Array>}
 */
const _generateByTopic = async (basePrompt, targetCount, contentString) => {
	logger.info("--- Step 1: Extracting distinct topics from content. ---");
	const allQuestions = [];
	const contentConstraintPrompt = _createContentConstraint(contentString);

	try {
		const numTopics = Math.ceil(targetCount / 4);
		const questionsPerTopic = Math.ceil(targetCount / numTopics);

		const topicPrompt = `Based on the following content, identify ${numTopics} distinct topics, themes, or key subject areas that can be used to create quiz questions. Return the topics as a simple JSON array of strings.\n\nExample: ["Topic A", "Topic B", "Topic C"]\n\nContent:\n"""\n${contentString}\n"""`;

		const topicResponse = await _executeModelRequest(topicPrompt, 1, false);
		const topics = Array.isArray(topicResponse) ? topicResponse : JSON.parse(topicResponse);

		if (!topics || topics.length === 0) {
			throw new Error("Failed to extract any topics from the content.");
		}
		logger.info(`Successfully extracted ${topics.length} topics. Now generating questions for each.`);

		for (let i = 0; i < topics.length; i++) {
			const topic = topics[i];
			logger.info(`--- Generating questions for Topic ${i + 1}/${topics.length}: "${topic}" ---`);

			const questionPrompt = `Generate exactly ${questionsPerTopic} unique quiz questions **specifically about the following topic: "${topic}"**.
${basePrompt}${contentConstraintPrompt}`;

			try {
				const batchQuestions = await _executeModelRequest(questionPrompt, questionsPerTopic);
				allQuestions.push(...batchQuestions);
				logger.info(`✓ Added ${batchQuestions.length} questions for "${topic}". Total: ${allQuestions.length}`);
			} catch (batchError) {
				logger.error(`✗ Failed to generate questions for topic "${topic}". Skipping. Error: ${batchError.message}`);
			}
			if (i < topics.length - 1) {
				await new Promise(resolve => setTimeout(resolve, 1500));
			}
		}

		logger.info(`Topic-based generation complete. Total questions: ${allQuestions.length}`);
		return allQuestions.slice(0, targetCount);

	} catch (error) {
		logger.error(`Topic-based generation failed: ${error.message}.`);
		logger.warn("Falling back to the simple batching method.");
		return await _generateInBatches_Fallback(basePrompt, targetCount, 20, contentString);
	}
};

/**
 * Internal function to execute a Gemini API call with retries and parsing.
 * @param {string} prompt - The final prompt to send.
 * @param {number} expectedCount - The number of items we expect back (for logging/context).
 * @param {boolean} [fixJson=true] - Whether to run the advanced JSON repair logic.
 * @returns {Promise<any>}
 */
const _executeModelRequest = async (prompt, expectedCount, fixJson = true) => {
	// ... This function remains unchanged ...
	let lastError = null;
	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		try {
			const model = genAI.getGenerativeModel({
				model: "gemini-1.5-flash",
				generationConfig: {
					temperature: 0.4,
					topP: 0.9,
				},
			});

			logger.info(`Calling Gemini AI (Attempt ${attempt}/${MAX_RETRIES}).`);
			const result = await model.generateContent(prompt);
			const text = result.response.text().replace(/```json|```/g, "").trim();

			if (!text) throw new Error("Received an empty response from the AI.");

			const parsedResponse = fixJson ? await _fixAndParseJson(text) : JSON.parse(text);
			const items = Array.isArray(parsedResponse) ? parsedResponse : [parsedResponse];

			if (items.length > 0) {
				return items;
			} else {
				throw new Error("Parsed response is empty.");
			}
		} catch (error) {
			lastError = error;
			logger.error(`Attempt ${attempt} failed: ${error.message}`);
			if (attempt < MAX_RETRIES) {
				const delay = 1500 * attempt;
				logger.info(`Retrying in ${delay / 1000}s...`);
				await new Promise(resolve => setTimeout(resolve, delay));
			}
		}
	}
	throw lastError;
};

/**
 * FALLBACK METHOD: A simple batching function with diversity prompts.
 * @param {string} basePrompt
 * @param {number} targetCount
 * @param {number} batchSize
 * @param {string} contentString - The prepared source content string.
 * @returns {Promise<Array>}
 */
const _generateInBatches_Fallback = async (basePrompt, targetCount, batchSize, contentString) => {
	// ... This function remains unchanged ...
	logger.warn("Executing fallback batch generation. Question diversity may be lower.");
	const totalBatches = Math.ceil(targetCount / batchSize);
	const allQuestions = [];
	const contentConstraintPrompt = _createContentConstraint(contentString);

	for (let i = 0; i < totalBatches; i++) {
		const questionsInBatch = Math.min(batchSize, targetCount - allQuestions.length);
		if (questionsInBatch <= 0) break;

		const batchPrompt = `You are creating a large, DIVERSE quiz set in parts.
This is PART ${i + 1} of ${totalBatches}.
**CRITICAL INSTRUCTION: To avoid repetition, focus on different facts, concepts, or sections of the content than you would for other parts. Do NOT repeat questions that would logically belong in an earlier part.**
Generate ${questionsInBatch} unique questions based on these rules:
${basePrompt}${contentConstraintPrompt}`;
		try {
			const batchQuestions = await _executeModelRequest(batchPrompt, questionsInBatch);
			allQuestions.push(...batchQuestions);
		} catch (error) {
			logger.error(`Fallback Batch ${i + 1} failed and will be skipped.`);
		}
	}
	return allQuestions;
};

/**
 * A helper function containing robust JSON parsing and fixing logic.
 * @param {string} text - The raw text response from the AI.
 * @returns {Promise<any>} The parsed JSON object or array.
 */
const _fixAndParseJson = async (text) => {
	// ... This function remains unchanged ...
	const originalText = text;
	if (!text || text.trim() === "") {
		throw new Error("Cannot parse an empty string.");
	}
	try {
		return JSON.parse(text);
	} catch (e) {
		logger.warn("Initial JSON parse failed. Attempting cleanup strategies...");
	}
	let fixedText = text.replace(/```json|```/g, "").trim();
	try {
		return JSON.parse(fixedText);
	} catch (e) {
		// Proceed
	}
	let syntaxFixedText = fixedText.replace(/,\s*([}\]])/g, "$1");
	try {
		return JSON.parse(syntaxFixedText);
	} catch (e) {
		logger.warn("Syntax fix (trailing comma) failed.");
	}
	try {
		const firstOpen = syntaxFixedText.search(/[[{]/);
		if (firstOpen === -1) {
			throw new Error("No JSON start token '[' or '{' found.");
		}
		const matchingClose = syntaxFixedText[firstOpen] === '{' ? '}' : ']';
		const lastClose = syntaxFixedText.lastIndexOf(matchingClose);
		if (lastClose > firstOpen) {
			const jsonCandidate = syntaxFixedText.substring(firstOpen, lastClose + 1);
			return JSON.parse(jsonCandidate);
		} else {
			throw new Error("Could not find a matching closing token for the JSON structure.");
		}
	} catch (e) {
		logger.warn(`Final extraction logic failed. Error: ${e.message}`);
		logger.debug(`Original text that failed all parsing attempts: ${originalText}`);
	}
	throw new Error("Failed to parse AI response as JSON after multiple attempts.");
};

/**
 * Processes an image with a given prompt to generate structured note data.
 * @param {string} prompt The prompt to send to the AI model.
 * @param {string} image The base64 encoded image data.
 * @param {string} mimeType The MIME type of the image (e.g., "image/jpeg", "image/png").
 * @returns {Promise<object>} A structured object parsed from the AI's JSON response.
 */
const generateTextFromImage = async (prompt, image, mimeType) => {
	// ... This function remains unchanged ...
	const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
	const imagePart = {
		inlineData: { data: image, mimeType },
	};
	try {
		logger.info("Calling Gemini AI to analyze image and generate structured note.");
		const result = await model.generateContent([prompt, imagePart]);
		const rawResponse = result.response.text();
		if (!rawResponse || rawResponse.trim() === '') {
			logger.error("Image processing failed: AI returned an empty response.");
			throw new Error("Received an empty response from the AI for the image.");
		}
		logger.debug(`Raw AI response for image: ${rawResponse}`);
		const jsonObject = await _fixAndParseJson(rawResponse);
		logger.info("Successfully parsed structured note from image response.");
		return jsonObject;
	} catch (error) {
		logger.error(`Image processing failed: ${error.message}`);
		throw new Error("Failed to process image and generate structured note from AI service.");
	}
};


module.exports = {
	generateContent,
	generateTextFromImage,
};