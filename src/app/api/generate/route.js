// app/api/chat/route.js

import { ChatGroq } from "@langchain/groq";
import { NextResponse } from "next/server";

// Initialize the ChatGroq client with your API key and desired model.
const chatGroq = new ChatGroq({
  apiKey: process.env.CHAT_GROQ_API_KEY,
  model: "llama3-70b-8192", // or your preferred Chat Groq model
});

export async function POST(req) {
  try {
    // Use req.json() to properly parse the request body.
    const { model, domain, request, stage = "analyze", previousResponses = [] } = await req.json();
    console.log(model, domain, request, stage, previousResponses);

    // Personalized system prompt: clearly explain the task and desired output format.
    const systemPrompt = `You are an expert prompt engineer specializing in creating effective prompts specifically for ${model} (Chat Groq).
Your task is to help the user build a well-structured prompt for the ${domain} domain.

For ${model}, follow these guidelines:
- Use an OpenAI-compatible chat JSON format with explicit roles (system, user, assistant).
- In the "analyze" stage, identify any missing details and ask clarifying questions.
- In the "questions" stage, integrate all additional details to generate a final, refined prompt.
- Always output your response in strict JSON format exactly as specified.

Now, proceed based on the conversation stage.`;

    let userPrompt = "";

    // Phase 1: "analyze" – identify missing details and ask follow-up questions.
    if (stage === "analyze") {
      userPrompt = `Analyze this prompt request: "${request}"
For the ${domain} domain using ${model}, identify key missing details and points that need clarification.

Provide your response in the following JSON format exactly:
{
  "analysis": "A brief analysis of the current request",
  "followUpQuestions": [
    "Question 1 about missing crucial information",
    "Question 2 about potential clarifications needed",
    "Question 3 about specific requirements or constraints"
  ],
  "stage": "questions",
  "currentUnderstanding": "A summary of what we understand so far from the request"
}`;
    }
    // Phase 2: "questions" – generate a refined prompt based on additional follow-up details.
    else if (stage === "questions") {
      userPrompt = `Based on the initial request: "${request}"
And incorporating the additional details: ${JSON.stringify(previousResponses)}
Create a comprehensive, refined prompt for ${model} in the ${domain} domain.

Provide your response in the following JSON format exactly:
{
  "refinedPrompt": "The complete, well-structured prompt",
  "suggestedFollowUps": [
    "Potential follow-up 1",
    "Potential follow-up 2",
    "Potential follow-up 3"
  ],
  "explanation": "Explanation on why this prompt structure works well",
  "stage": "complete"
}`;
    }

    // Invoke the Chat Groq model using the invoke() method with our messages.
    const completion = await chatGroq.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], { response_format: { type: "json_object" } });
    
    // Log the raw completion for debugging if needed.
    console.log("Chat Groq completion:", completion.content);

    // Parse and return the JSON response.
    const result = JSON.parse(completion.content || "{}");
    console.log(result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating prompt:", error);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
}
