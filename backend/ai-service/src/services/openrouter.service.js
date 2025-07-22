const config = require('../config');
const logger = require('../utils/logger');

const DIRECT_GENERATION_THRESHOLD = 25;
const MAX_RETRIES = 2;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'moonshotai/kimi-k2:free';

const generateContent = async (basePrompt, totalQuestions, content) => {
    if (totalQuestions <= DIRECT_GENERATION_THRESHOLD) {
        logger.info(`Generating ${totalQuestions} questions via single direct request (OpenRouter).`);
        const fullPrompt = `Generate exactly ${totalQuestions} unique quiz questions. ${basePrompt}`;
        return await _executeModelRequest(fullPrompt, totalQuestions);
    } else {
        logger.info(`Question count (${totalQuestions}) is high. Using Topic-Based Generation strategy (OpenRouter).`);
        return await _generateByTopic(basePrompt, totalQuestions, content);
    }
};

const _generateByTopic = async (basePrompt, targetCount, content) => {
    logger.info("--- Step 1: Extracting distinct topics from content (OpenRouter). ---");
    const allQuestions = [];
    try {
        const numTopics = Math.ceil(targetCount / 4);
        const questionsPerTopic = Math.ceil(targetCount / numTopics);

        const topicPrompt = `Based on the following content, identify ${numTopics} distinct topics, themes, or key subject areas that can be used to create quiz questions. Return the topics as a simple JSON array of strings.\n\nExample: [\"Topic A\", \"Topic B\", \"Topic C\"]\n\nContent:\n\"\"\"\n${content}\n\"\"\"`;

        const topicResponse = await _executeModelRequest(topicPrompt, 1, false);
        const topics = Array.isArray(topicResponse) ? topicResponse : JSON.parse(topicResponse);

        if (!topics || topics.length === 0) {
            throw new Error("Failed to extract any topics from the content.");
        }
        logger.info(`Successfully extracted ${topics.length} topics. Now generating questions for each. (OpenRouter)`);

        for (let i = 0; i < topics.length; i++) {
            const topic = topics[i];
            logger.info(`--- Generating questions for Topic ${i + 1}/${topics.length}: \"${topic}\" (OpenRouter) ---`);
            const questionPrompt = `Generate exactly ${questionsPerTopic} unique quiz questions **specifically about the following topic: \"${topic}\"**.\n${basePrompt}`;
            try {
                const batchQuestions = await _executeModelRequest(questionPrompt, questionsPerTopic);
                allQuestions.push(...batchQuestions);
                logger.info(`✓ Added ${batchQuestions.length} questions for \"${topic}\". Total: ${allQuestions.length} (OpenRouter)`);
            } catch (batchError) {
                logger.error(`✗ Failed to generate questions for topic \"${topic}\". Skipping. Error: ${batchError.message} (OpenRouter)`);
            }
            if (i < topics.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }
        logger.info(`Topic-based generation complete. Total questions: ${allQuestions.length} (OpenRouter)`);
        return allQuestions.slice(0, targetCount);
    } catch (error) {
        logger.error(`Topic-based generation failed: ${error.message} (OpenRouter).`);
        logger.warn("Falling back to the simple batching method (OpenRouter).\n");
        return await _generateInBatches_Fallback(basePrompt, targetCount, 20);
    }
};

const _executeModelRequest = async (prompt, expectedCount, fixJson = true) => {
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.openrouterApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: OPENROUTER_MODEL,
                    messages: [
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                }),
            });
            if (!response.ok) {
                throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
                ? data.choices[0].message.content.replace(/```json|```/g, '').trim()
                : '';
            if (!text) throw new Error('Received an empty response from OpenRouter.');
            const parsedResponse = fixJson ? await _fixAndParseJson(text) : JSON.parse(text);
            const items = Array.isArray(parsedResponse) ? parsedResponse : [parsedResponse];
            if (items.length > 0) {
                return items;
            } else {
                throw new Error('Parsed response is empty.');
            }
        } catch (error) {
            lastError = error;
            logger.error(`Attempt ${attempt} failed (OpenRouter): ${error.message}`);
            if (attempt < MAX_RETRIES) {
                const delay = 1500 * attempt;
                logger.info(`Retrying in ${delay / 1000}s... (OpenRouter)`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
};

const _generateInBatches_Fallback = async (basePrompt, targetCount, batchSize) => {
    logger.warn('Executing fallback batch generation. Question diversity may be lower. (OpenRouter)');
    const totalBatches = Math.ceil(targetCount / batchSize);
    const allQuestions = [];
    for (let i = 0; i < totalBatches; i++) {
        const questionsInBatch = Math.min(batchSize, targetCount - allQuestions.length);
        if (questionsInBatch <= 0) break;
        const batchPrompt = `You are creating a large, DIVERSE quiz set in parts.\nThis is PART ${i + 1} of ${totalBatches}.\n**CRITICAL INSTRUCTION: To avoid repetition, focus on different facts, concepts, or sections of the content than you would for other parts. Do NOT repeat questions that would logically belong in an earlier part.**\nGenerate ${questionsInBatch} unique questions based on these rules:\n${basePrompt}`;
        try {
            const batchQuestions = await _executeModelRequest(batchPrompt, questionsInBatch);
            allQuestions.push(...batchQuestions);
        } catch (error) {
            logger.error(`Fallback Batch ${i + 1} failed and will be skipped. (OpenRouter)`);
        }
    }
    return allQuestions;
};

const _fixAndParseJson = async (text) => {
    if (!text || text.trim() === '') {
        throw new Error('Cannot parse an empty string.');
    }
    try {
        return JSON.parse(text);
    } catch (e) {
        logger.warn('Initial JSON parse failed. Attempting cleanup strategies... (OpenRouter)');
    }
    let fixedText = text.replace(/,\s*([}\]])/g, '$1');
    try {
        return JSON.parse(fixedText);
    } catch (e) {
        logger.warn('Syntax fix failed. (OpenRouter)');
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
        logger.warn('Truncation fix failed. (OpenRouter)');
    }
    throw new Error('Failed to parse OpenRouter response as JSON after multiple attempts.');
};

module.exports = {
    generateContent,
}; 