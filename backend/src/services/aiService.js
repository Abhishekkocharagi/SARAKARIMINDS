const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require('pdf-parse');
const fs = require('fs');

// Initialize Gemini
// Make sure GOOGLE_GEMINI_API_KEY is in your .env file
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || 'dummy-key');

/**
 * Summarize a newspaper PDF for government exam candidates.
 * @param {string} filePath - Absolute path to the PDF file.
 * @returns {Promise<{summary: string, success: boolean, originalLength: number}>}
 */
exports.summarizeNewspaperPDF = async (filePath) => {
    console.log(`AI Service: Starting analysis of ${filePath}`);
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found at ${filePath}`);
        }

        const dataBuffer = fs.readFileSync(filePath);

        // Extract text from ALL PDF pages
        console.log("AI Service: Extracting text from all pages...");
        const data = await pdfParse(dataBuffer); // No page limit
        const text = data.text;

        if (!text || text.length < 100) {
            return {
                summary: "Could not extract sufficient text from the PDF. It might be an image-only PDF.",
                success: false
            };
        }

        console.log(`AI Service: Extracted ${text.length} characters. Generating summary...`);

        // Use Gemini to summarize
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            You are an expert curriculum designer for 'SarkariMinds'. 
            
            TASK: Scan the ENTIRE newspaper text provided below.
            
            CRITICAL INSTRUCTIONS:
            1. **Filter Out Advertisements**: Completely ignore all commercial ads, classifieds, and marketing content.
            2. **Identify Exam Topics**: Extract only news related to Polity, Economy, Science, International Relations, and National news.
            3. **Summarize by Importance**: Group the findings into meaningful sections.
            4. **Format**: Use bullet points. Highlight key terms in **bold**.
            5. **Target**: Make it useful for government exam (UPSC/SSC) revision.
            
            NEWSPAPER TEXT:
            ${text.substring(0, 200000)} 
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        console.log("AI Service: Summary generated successfully.");

        return {
            summary,
            success: true,
            originalLength: text.length
        };

    } catch (error) {
        console.error("AI Service Error:", error);
        return {
            summary: "Automatic summarization failed. Please review the error logs or summarize manually.",
            success: false,
            error: error.message
        };
    }
};
