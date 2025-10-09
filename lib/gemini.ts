import { GoogleGenAI, Type } from "@google/genai";
import { Agent, Discrepancy, Ticket, Transaction, TransactionStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes recent data to generate high-level auditing insights.
 */
export const getAIInsights = async (recentTickets: Ticket[], recentDiscrepancies: Discrepancy[]): Promise<string> => {
    const totalRevenue = recentTickets.reduce((sum, t) => sum + t.price, 0);
    const voidedCount = recentTickets.filter(t => t.status === TransactionStatus.Void).length;

    const prompt = `
        You are an expert financial auditor for a national aviation authority. Your task is to analyze a summary of recent activity and identify 2-3 potential anomalies or areas of concern that warrant further investigation. Present them as concise, actionable insights in a markdown list.

        Here is the data summary for the last 24 hours:
        - Total Tickets Processed: ${recentTickets.length}
        - Total Revenue from New Tickets: $${totalRevenue.toLocaleString()}
        - Number of Voided Tickets: ${voidedCount}
        - New Discrepancies Flagged: ${recentDiscrepancies.length}

        Based on this data, what are the most critical insights an auditor should focus on?
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed for insights:", error);
        return "Error: Could not retrieve AI insights at this time.";
    }
};

/**
 * Converts a natural language query into a structured filter object for ticket sales.
 */
export const parseNaturalLanguageQuery = async (query: string): Promise<any> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            searchTerm: { type: Type.STRING, description: 'General search term for passenger name, flight number, etc.' },
            startDate: { type: Type.STRING, description: "The start date for the search range in 'YYYY-MM-DD' format." },
            endDate: { type: Type.STRING, description: "The end date for the search range in 'YYYY-MM-DD' format." },
            statuses: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'An array of ticket statuses to filter by (e.g., "Completed", "Void").' },
            minPrice: { type: Type.NUMBER, description: 'The minimum ticket price.' },
            maxPrice: { type: Type.NUMBER, description: 'The maximum ticket price.' },
            origin: { type: Type.STRING, description: 'The 3-letter IATA code for the origin airport.' },
            destination: { type: Type.STRING, description: 'The 3-letter IATA code for the destination airport.' },
        }
    };

    const prompt = `
        Convert the following user request into a JSON object matching the provided schema.
        Today's date is ${new Date().toISOString().split('T')[0]}.
        User request: "${query}"
    `;

    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Gemini API call failed for NLQ:", error);
        throw new Error("Sorry, I couldn't understand that request. Please try rephrasing it.");
    }
};

/**
 * Generates a summary and suggested actions for a specific discrepancy.
 */
export const getDiscrepancySummary = async (
    discrepancy: Discrepancy,
    transaction?: Transaction,
    agent?: Agent
): Promise<string> => {
    const prompt = `
        You are an expert audit assistant. A discrepancy has been flagged in our system. 
        Your task is to provide a brief, clear summary of the issue and suggest 2-3 concrete, actionable next steps for the investigator. 
        Use markdown for formatting.

        **Discrepancy Details:**
        - ID: ${discrepancy.id}
        - Type: "${discrepancy.type}"
        - Disputed Amount: $${discrepancy.amount.toFixed(2)}
        - Status: ${discrepancy.status}
        - Details: ${discrepancy.details}

        **Associated Transaction:**
        - ID: ${transaction?.id || 'N/A'}
        - Amount: $${transaction?.amount.toFixed(2) || 'N/A'}
        - Timestamp: ${transaction ? new Date(transaction.timestamp).toLocaleString() : 'N/A'}

        **Agent Involved:**
        - Name: ${agent?.name || 'N/A'}
        - ID: ${agent?.id || 'N/A'}
        - Historical Dispute Rate: ${agent?.disputeRate || 'N/A'}%

        Based on all this information, provide your summary and suggested next steps.
    `;
    
    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed for discrepancy summary:", error);
        return "Error: Could not generate an AI summary at this time.";
    }
};

/**
 * Converts a natural language query into a structured filter object for the transaction ledger.
 */
export const parseLedgerQuery = async (query: string, agents: Agent[]): Promise<any> => {
    const agentNamesToIds = agents.map(agent => `- ${agent.name} (id: ${agent.id})`).join('\n');

    const schema = {
        type: Type.OBJECT,
        properties: {
            transactionTypes: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'An array of transaction types to filter by (e.g., "Sale", "Fee").' },
            agentId: { type: Type.STRING, description: 'The ID of the agent to filter by. Must be one of the provided agent IDs.' },
            startDate: { type: Type.STRING, description: "The start date for the search range in 'YYYY-MM-DD' format." },
            endDate: { type: Type.STRING, description: "The end date for the search range in 'YYYY-MM-DD' format." },
        }
    };

    const prompt = `
        Convert the following user request into a JSON object matching the provided schema.
        Use the provided list of agents to map a name to its corresponding ID. If an agent name is mentioned, you MUST use their ID in the 'agentId' field.

        Available Agents:
        ${agentNamesToIds}

        Today's date is ${new Date().toISOString().split('T')[0]}.
        User request: "${query}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Gemini API call failed for ledger NLQ:", error);
        throw new Error("Sorry, I couldn't understand that request. Please try rephrasing it.");
    }
};
