// Import a fetch library if you are in a Node.js environment that doesn't have it built-in.
// Netlify functions support modern Node.js versions with fetch included.
// const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // 1. Chỉ chấp nhận phương thức POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 2. Lấy API key từ biến môi trường của Netlify một cách an toàn
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new Error("API key is not configured.");
        }
        
        // 3. Lấy prompt từ yêu cầu của người dùng
        const body = JSON.parse(event.body);
        const userPrompt = body.prompt;
        if (!userPrompt) {
            return { statusCode: 400, body: 'Prompt is required.' };
        }

        // 4. Gọi đến API của Google Gemini
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
        const payload = {
            contents: [{
                parts: [{
                    text: userPrompt
                }]
            }]
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error('Google API Error:', await response.text());
            return { statusCode: response.status, body: 'Failed to get response from Google AI.' };
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
             console.error('Invalid response structure from Google:', result);
             return { statusCode: 500, body: 'Could not parse the response from Google AI.' };
        }

        // 5. Trả kết quả về cho trang web
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text }),
        };

    } catch (error) {
        console.error('Serverless Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
