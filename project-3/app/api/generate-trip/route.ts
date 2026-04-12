import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize the AI client using your secret key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    // Grab the user's input from the frontend (The Sandbox Ideas)
    const body = await req.json();
    const { location, days, ideas } = body; 

    // THE PROMPT
    const prompt = `
      You are an expert, local travel agent. 
      Plan a highly logical ${days}-day trip to ${location} incorporating the following user ideas and constraints: "${ideas}".
      
      RULES:
      - Only suggest real, well-known locations and restaurants.
      - Ensure geographical logic (don't put things across the city from each other back-to-back).
      - You MUST return your answer in valid JSON format. Do not include any intro or outro text.
      
      Your JSON output must exactly match this structure:
      {
        "tripName": "Creative name for the trip",
        "itinerary": [
          {
            "day": 1,
            "theme": "Theme of the day",
            "activities": [
              { "time": "9:00 AM", "description": "Specific location and activity" }
            ]
          }
        ]
      }
    `;

    // 3. Send to Gemini 2.5 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    // 4. Clean the response
    // Sometimes AI wraps JSON in markdown blocks (```json ... ```). 
    // We strip that out so JSON.parse doesn't throw an error.
    const rawText = response.text || '';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    // 5. Send the perfect data back to your React frontend!
    return NextResponse.json(JSON.parse(cleanJson));

  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate trip. Please try again.' }, 
      { status: 500 }
    );
  }
}