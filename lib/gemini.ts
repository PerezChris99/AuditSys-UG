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
export const parseTicketQuery = async (query: string): Promise<any> => {
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

export const getFraudScore = async (
    transaction: Pick<Transaction, 'amount' | 'associatedRecordId' | 'agentId' | 'type'>,
    agent: Agent,
    recentTransactions: Transaction[]
): Promise<{ score: number; reason: string }> => {
    const agentRecentTxCount = recentTransactions.filter(t => t.agentId === agent.id).length;

    const schema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.NUMBER, description: 'A fraud propensity score from 1 (very low risk) to 100 (very high risk).' },
            reason: { type: Type.STRING, description: 'A brief, one-sentence justification for the assigned score.' }
        },
        required: ['score', 'reason'],
    };
    
    const prompt = `
        Analyze the following new transaction for potential fraud and return a JSON object with a score and reason.
        
        Context:
        - Agent Name: ${agent.name}
        - Agent Historical Dispute Rate: ${agent.disputeRate.toFixed(2)}%
        - Agent transaction volume in last 24h: ${agentRecentTxCount} transactions.
        
        New Transaction Details:
        - Amount: $${transaction.amount.toFixed(2)}
        - Record Type: ${transaction.associatedRecordId.split('-')[0]}
        
        Assign a score from 1-100. Higher scores for unusually large amounts, high agent dispute rates, or very high recent transaction volume for that agent. A typical, safe transaction should be below 40.
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
        const parsed = JSON.parse(jsonText);
        return {
            score: Math.min(100, Math.max(1, parsed.score || 10)),
            reason: parsed.reason || "AI analysis failed, defaulted to low risk.",
        };
    } catch (error) {
        console.error("Gemini API call failed for fraud score:", error);
        return {
            score: 10,
            reason: "AI analysis unavailable; defaulted to low risk."
        };
    }
};

export const analyzeDiscrepancyEvidence = async (discrepancy: Discrepancy): Promise<string> => {
    const prompt = `
        You are an audit assistant with multi-modal capabilities.
        You have been given a transaction discrepancy and a (simulated) image of a bank deposit slip associated with it. 
        Your task is to analyze the 'image' and report if the amount on the slip matches the discrepancy details.
        
        Discrepancy Details:
        - ID: ${discrepancy.id}
        - Disputed Amount: $${discrepancy.amount.toFixed(2)}
        - Type: ${discrepancy.type}

        Simulated Image Analysis:
        The attached bank slip image clearly shows a cash deposit of **$${(discrepancy.amount + 50).toFixed(2)}**. 
        
        Based on this, what is your conclusion? Is there still a mismatch? Be concise.
    `;
    
    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return `**Analysis Complete:** ${response.text}`;
    } catch (error) {
        console.error("Gemini API call failed for evidence analysis:", error);
        return "Error: Could not generate evidence analysis.";
    }
};

export const getAgentPerformanceReview = async (agent: Agent): Promise<string> => {
    const prompt = `
        You are a helpful and encouraging performance coach for sales agents at an aviation authority.
        Your task is to write a brief, positive performance summary for an agent based on their data.
        Highlight one area of success and one area for improvement with a specific, actionable tip.
        Use markdown for formatting. Be encouraging, not punitive.

        **Agent Data:**
        - Name: ${agent.name}
        - Tickets Sold (all time): ${agent.ticketsSold}
        - Total Revenue (all time): $${agent.totalRevenue.toLocaleString()}
        - Transaction Accuracy: ${agent.accuracy}%
        - Dispute Rate: ${agent.disputeRate}%

        Now, generate the performance review.
    `;
    
    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed for agent review:", error);
        return "Error: Could not generate an AI performance review.";
    }
};

/**
 * Uses Google Search grounding to find an official URL related to a page title.
 */
export const getOfficialUrl = async (pageTitle: string): Promise<{ title: string; uri: string } | null> => {
    const prompt = `Find the single most relevant official Ugandan Aviation Authority website URL for the following topic: "${pageTitle}"`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks && chunks.length > 0 && chunks[0].web) {
            return {
                title: chunks[0].web.title || 'Official Resource',
                uri: chunks[0].web.uri,
            };
        }
        return null;
    } catch (error) {
        console.error("Gemini API call failed for Google Search grounding:", error);
        return null;
    }
};