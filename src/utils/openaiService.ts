// OpenAI Service for Assistant API integration
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  response: string;
  error?: string;
}

class OpenAIService {
  private apiKey: string;
  private assistantId: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.assistantId = import.meta.env.VITE_OPENAI_ASSISTANT_ID || '';
  }

  async createThread(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/threads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to create thread: ${response.statusText}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }

  async addMessageToThread(threadId: string, message: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          role: 'user',
          content: message
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to add message: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding message to thread:', error);
      throw error;
    }
  }

  async runAssistant(threadId: string): Promise<string> {
    try {
      // Create a run
      const runResponse = await fetch(`${this.baseUrl}/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          assistant_id: this.assistantId
        })
      });

      if (!runResponse.ok) {
        throw new Error(`Failed to create run: ${runResponse.statusText}`);
      }

      const runData = await runResponse.json();
      const runId = runData.id;

      // Poll for completion
      let runStatus = 'queued';
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      while (runStatus !== 'completed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const statusResponse = await fetch(`${this.baseUrl}/threads/${threadId}/runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });

        if (!statusResponse.ok) {
          throw new Error(`Failed to check run status: ${statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        attempts++;

        if (runStatus === 'failed' || runStatus === 'cancelled' || runStatus === 'expired') {
          throw new Error(`Run failed with status: ${runStatus}`);
        }
      }

      if (runStatus !== 'completed') {
        throw new Error('Run timed out');
      }

      // Get the messages
      const messagesResponse = await fetch(`${this.baseUrl}/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!messagesResponse.ok) {
        throw new Error(`Failed to get messages: ${messagesResponse.statusText}`);
      }

      const messagesData = await messagesResponse.json();
      const assistantMessages = messagesData.data.filter((msg: any) => msg.role === 'assistant');
      
      if (assistantMessages.length === 0) {
        throw new Error('No assistant response found');
      }

      // Get the latest assistant message
      const latestMessage = assistantMessages[0];
      const content = latestMessage.content[0];
      
      if (content.type === 'text') {
        return content.text.value;
      } else {
        throw new Error('Unexpected message content type');
      }
    } catch (error) {
      console.error('Error running assistant:', error);
      throw error;
    }
  }

  async sendMessage(message: string): Promise<OpenAIResponse> {
    try {
      if (!this.apiKey || !this.assistantId) {
        throw new Error('OpenAI API key or Assistant ID not configured');
      }

      // Create a new thread for each conversation
      const threadId = await this.createThread();
      
      // Add the user message to the thread
      await this.addMessageToThread(threadId, message);
      
      // Run the assistant and get the response
      const response = await this.runAssistant(threadId);
      
      return { response };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return {
        response: "I apologize, but I'm experiencing technical difficulties. Please try again later or contact our support team at support@inspiresolutions.asia for immediate assistance.",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const openaiService = new OpenAIService();