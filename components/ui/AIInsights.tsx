import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { marked } from 'marked';
import { SparklesIcon, CopyIcon, StopIcon, CheckCircleIcon } from './Icons';

// Initialize the Gemini client. In a real app, API_KEY would be server-side.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type Message = {
    id: string;
    role: 'user' | 'model';
    content: string;
    isStreaming?: boolean;
};

const AIInsights: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

    const chatSession = useRef<Chat | null>(null);
    const stopGenerationRef = useRef(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat to the latest message
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Initialize chat session on component mount
    useEffect(() => {
        const initChat = () => {
            chatSession.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: 'You are an expert financial auditor for the Ugandan Aviation Authority named AuditSys AI. Your purpose is to help users analyze financial data, identify anomalies, and understand system reports. Be concise, professional, and provide actionable information. Use markdown for formatting.',
                },
            });
            setMessages([
                {
                    id: crypto.randomUUID(),
                    role: 'model',
                    content: 'Hello! I am your AI Auditor Assistant. Ask me to analyze anomalies or summarize agent performance.',
                },
            ]);
        };
        initChat();
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        setIsLoading(true);
        stopGenerationRef.current = false;
        setError('');

        const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: input };
        const modelMessageId = crypto.randomUUID();
        setMessages(prev => [
            ...prev,
            userMessage,
            { id: modelMessageId, role: 'model', content: '', isStreaming: true },
        ]);
        setInput('');

        try {
            if (!chatSession.current) throw new Error("Chat session not initialized.");
            
            const stream = await chatSession.current.sendMessageStream({ message: input });

            for await (const chunk of stream) {
                if (stopGenerationRef.current) {
                    break;
                }
                const chunkText = chunk.text;
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === modelMessageId ? { ...msg, content: msg.content + chunkText } : msg
                    )
                );
            }
        } catch (err: any) {
            setError('Failed to get response from AI. Please try again.');
            setMessages(prev => prev.filter(msg => msg.id !== modelMessageId));
        } finally {
            setIsLoading(false);
            setMessages(prev =>
                prev.map(msg => (msg.id === modelMessageId ? { ...msg, isStreaming: false } : msg))
            );
        }
    };
    
    const handleStopGeneration = () => {
        stopGenerationRef.current = true;
    };

    const handleCopy = (text: string, id: string) => {
        if (copiedMessageId) return; // Prevent spamming copy
        navigator.clipboard.writeText(text);
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000);
    };

    const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
        const isUser = message.role === 'user';
        const parsedContent = { __html: marked.parse(message.content) as string };
    
        return (
            <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-lg lg:max-w-xl px-4 py-2 rounded-xl ${isUser ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={parsedContent} />
                    {message.role === 'model' && (
                        <div className="flex justify-end items-center pt-2 mt-2 border-t border-gray-300/50">
                            {message.isStreaming && (
                                <button onClick={handleStopGeneration} className="p-1 text-gray-500 hover:text-red-600" title="Stop generating">
                                    <StopIcon className="h-5 w-5" />
                                </button>
                            )}
                            {!message.isStreaming && message.content && (
                                <button onClick={() => handleCopy(message.content, message.id)} className="p-1 text-gray-500 hover:text-primary-600" title="Copy text">
                                     {copiedMessageId === message.id ? (
                                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <CopyIcon className="h-5 w-5" />
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow h-full flex flex-col">
            <div className="flex items-center mb-4 border-b pb-3">
                <SparklesIcon className="h-6 w-6 text-primary-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-700">AI Auditor Chat</h3>
            </div>

            <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto pr-2">
                {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
                {isLoading && messages[messages.length - 1]?.isStreaming && (
                    <div className="flex justify-start">
                        <div className="max-w-lg lg:max-w-xl px-4 py-2 rounded-xl bg-gray-200 text-gray-800">
                             <div className="flex items-center space-x-2">
                                <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            
            <form onSubmit={handleSendMessage} className="mt-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask the AI auditor..."
                        className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 disabled:bg-primary-300"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AIInsights;
