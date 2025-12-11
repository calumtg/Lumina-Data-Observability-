import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { DataAsset, LineageEdge } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface GraphContext {
  nodes: DataAsset[];
  edges: LineageEdge[];
  selectedNodeId?: string;
}

export const analyzeGraphWithGemini = async (
  query: string,
  context: GraphContext
): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Please check your configuration.";
  }

  // Minimize context size by mapping only essential fields
  const simplifiedNodes = context.nodes.map(n => ({
    id: n.id,
    label: n.label,
    type: n.type,
    status: n.status,
    quality: n.qualityScore,
    owner: n.owner
  }));

  const systemInstruction = `
    You are an expert Data Observability Assistant for a platform called "Lumina".
    Your role is to help Data Engineers and Auditors understand the data lineage graph.
    
    Context:
    - You are provided with a JSON representation of a Directed Acyclic Graph (DAG) of data assets.
    - Nodes represent tables, streams, models, or dashboards.
    - Edges represent data flow.
    - Status can be HEALTHY, WARNING, or ERROR.
    
    Tasks:
    1. If the user asks about errors, trace the lineage to find the root cause (upstream errors).
    2. If the user asks about impact, trace downstream dependencies.
    3. Be concise and professional.
    
    Current Graph Data:
    Nodes: ${JSON.stringify(simplifiedNodes)}
    Edges: ${JSON.stringify(context.edges)}
    Currently Selected Node: ${context.selectedNodeId || 'None'}
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for factual analysis
      }
    });

    return response.text || "I could not generate an analysis at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error communicating with the AI service.";
  }
};
