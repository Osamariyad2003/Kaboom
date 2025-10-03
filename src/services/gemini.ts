import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyCfzjaV9YBI7-D-e9ZooGq8vopJTHKRGFo';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function condenseText(text: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Please condense the following text to be more concise while keeping all essential scientific information and key facts. Make it about 40-50% shorter:

${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return text;
  }
}
