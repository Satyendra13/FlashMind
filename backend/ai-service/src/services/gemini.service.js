const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../config");
const logger = require("../utils/logger");

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

// A small number of questions can be generated directly.
const DIRECT_GENERATION_THRESHOLD = 25;
const MAX_RETRIES = 2; // Max retries per API call.

/**
 * Main function to generate questions. Automatically uses the best strategy.
 * @param {string} basePrompt - The prompt containing JSON structure and other rules.
 * @param {number} totalQuestions - The total number of questions requested.
 * @param {string} content - The source content for the quiz.
 * @returns {Promise<Array>} A promise that resolves to an array of question objects.
 */
const generateContent = async (basePrompt, totalQuestions, content) => {
	if (totalQuestions <= DIRECT_GENERATION_THRESHOLD) {
		// For small amounts, a single direct request is fast and effective.
		logger.info(`Generating ${totalQuestions} questions via single direct request.`);
		const fullPrompt = `Generate exactly ${totalQuestions} unique quiz questions. ${basePrompt}`;
		return await _executeModelRequest(fullPrompt, totalQuestions);
	} else {
		// For larger amounts, use the robust topic-based generation to ensure diversity.
		logger.info(`Question count (${totalQuestions}) is high. Using Topic-Based Generation strategy.`);
		return await _generateByTopic(basePrompt, totalQuestions, content);
	}
};

/**
 * THE GOLD STANDARD METHOD: Generate questions by first identifying topics.
 * This is the best way to prevent repetition in large sets.
 * @param {string} basePrompt - The prompt with JSON rules.
 * @param {number} targetCount - The total number of questions to generate.
 * @param {string} content - The source content.
 * @returns {Promise<Array>}
 */
const _generateByTopic = async (basePrompt, targetCount, content) => {
	logger.info("--- Step 1: Extracting distinct topics from content. ---");
	const allQuestions = [];
	try {
		// Dynamically decide how many topics to ask for. Aim for 3-5 questions per topic.
		const numTopics = Math.ceil(targetCount / 4);
		const questionsPerTopic = Math.ceil(targetCount / numTopics);

		const topicPrompt = `Based on the following content, identify ${numTopics} distinct topics, themes, or key subject areas that can be used to create quiz questions. Return the topics as a simple JSON array of strings.

Example: ["Topic A", "Topic B", "Topic C"]

Content:
"""
${content}
"""`;

		const topicResponse = await _executeModelRequest(topicPrompt, 1, false); // No JSON fixing needed here
		const topics = Array.isArray(topicResponse) ? topicResponse : JSON.parse(topicResponse);

		if (!topics || topics.length === 0) {
			throw new Error("Failed to extract any topics from the content.");
		}
		logger.info(`Successfully extracted ${topics.length} topics. Now generating questions for each.`);

		// --- Step 2: Generate questions for each identified topic ---
		for (let i = 0; i < topics.length; i++) {
			const topic = topics[i];
			logger.info(`--- Generating questions for Topic ${i + 1}/${topics.length}: "${topic}" ---`);

			// This prompt is highly specific and focused, reducing repetition.
			const questionPrompt = `Generate exactly ${questionsPerTopic} unique quiz questions **specifically about the following topic: "${topic}"**.
${basePrompt}`;

			try {
				const batchQuestions = await _executeModelRequest(questionPrompt, questionsPerTopic);
				allQuestions.push(...batchQuestions);
				logger.info(`✓ Added ${batchQuestions.length} questions for "${topic}". Total: ${allQuestions.length}`);
			} catch (batchError) {
				logger.error(`✗ Failed to generate questions for topic "${topic}". Skipping. Error: ${batchError.message}`);
			}
			// Delay between topic requests to manage rate limits
			if (i < topics.length - 1) {
				await new Promise(resolve => setTimeout(resolve, 1500));
			}
		}

		logger.info(`Topic-based generation complete. Total questions: ${allQuestions.length}`);
		return allQuestions.slice(0, targetCount); // Ensure we don't exceed the target count

	} catch (error) {
		logger.error(`Topic-based generation failed: ${error.message}.`);
		logger.warn("Falling back to the simple batching method.");
		// Fallback to the old batching method if topic extraction fails
		return await _generateInBatches_Fallback(basePrompt, targetCount, 20);
	}
};


/**
 * Internal function to execute an API call with retries and basic parsing.
 * @param {string} prompt - The final prompt to send.
 * @param {number} expectedCount - The number of items we expect back.
 * @param {boolean} [fixJson=true] - Whether to run the advanced JSON repair logic.
 * @returns {Promise<any>}
 */
const _executeModelRequest = async (prompt, expectedCount, fixJson = true) => {
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
				return items; // Success!
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
	throw lastError; // All retries failed
};


/**
 * FALLBACK METHOD: A simple batching function with a stronger prompt to encourage diversity.
 * @returns {Promise<Array>}
 */
const _generateInBatches_Fallback = async (basePrompt, targetCount, batchSize) => {
	// Implementation is similar to the old batching, but with a much stronger prompt.
	// This is kept as a fallback in case topic generation fails.
	logger.warn("Executing fallback batch generation. Question diversity may be lower.");
	const totalBatches = Math.ceil(targetCount / batchSize);
	const allQuestions = [];
	for (let i = 0; i < totalBatches; i++) {
		const questionsInBatch = Math.min(batchSize, targetCount - allQuestions.length);
		if (questionsInBatch <= 0) break;

		const batchPrompt = `You are creating a large, DIVERSE quiz set in parts.
This is PART ${i + 1} of ${totalBatches}.
**CRITICAL INSTRUCTION: To avoid repetition, focus on different facts, concepts, or sections of the content than you would for other parts. Do NOT repeat questions that would logically belong in an earlier part.**
Generate ${questionsInBatch} unique questions based on these rules:
${basePrompt}`;
		try {
			const batchQuestions = await _executeModelRequest(batchPrompt, questionsInBatch);
			allQuestions.push(...batchQuestions);
		} catch (error) {
			logger.error(`Fallback Batch ${i + 1} failed and will be skipped.`)
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
	// This robust parsing logic remains the same.
	if (!text || text.trim() === "") {
		throw new Error("Cannot parse an empty string.");
	}
	try {
		return JSON.parse(text);
	} catch (e) {
		logger.warn("Initial JSON parse failed. Attempting cleanup strategies...");
	}
	let fixedText = text.replace(/,\s*([}\]])/g, "$1");
	try {
		return JSON.parse(fixedText);
	} catch (e) {
		logger.warn("Syntax fix failed.");
	}
	try {
		const startIndex = fixedText.indexOf('[');
		if (startIndex !== -1) {
			const lastBracket = fixedText.lastIndexOf(']');
			if (lastBracket > startIndex) {
				return JSON.parse(fixedText.substring(startIndex, lastBracket + 1));
			}
		}
	} catch (e) {
		logger.warn("Truncation fix failed.");
	}
	throw new Error("Failed to parse AI response as JSON after multiple attempts.");
};

module.exports = {
	generateContent,
};