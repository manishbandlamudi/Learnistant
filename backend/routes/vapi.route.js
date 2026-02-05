import express from "express";
import axios from "axios";

const vapiRouter = express.Router();

// ✅ Route to get assistant details with enhanced validation
vapiRouter.post("/assistant", async (req, res) => {
  try {
    const { assistantId } = req.body;
    
    if (!assistantId) {
      return res.status(400).json({ 
        error: "Assistant ID is required",
        example: { assistantId: "your-assistant-id-here" }
      });
    }

    if (!process.env.VAPI_SECRET_KEY) {
      console.error("❌ VAPI_SECRET_KEY environment variable is not set");
      return res.status(500).json({ 
        error: "VAPI_SECRET_KEY not configured",
        details: "Check your environment variables"
      });
    }

    if (typeof assistantId !== 'string' || assistantId.trim().length < 10) {
      return res.status(400).json({
        error: "Invalid Assistant ID format",
        details: "Assistant ID should be a valid string",
        received: assistantId
      });
    }

    console.log("🔍 Getting assistant:", assistantId);
    console.log("🔑 Using VAPI_SECRET_KEY:", process.env.VAPI_SECRET_KEY?.slice(0, 8) + "...");

    const response = await axios.get(
      `https://api.vapi.ai/assistant/${assistantId.trim()}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.VAPI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000 
      }
    );

    console.log("✅ Assistant found:", response.data.name || "Unnamed");
    
    res.json({
      success: true,
      assistant: response.data,
      metadata: {
        name: response.data.name,
        model: response.data.model?.provider,
        voice: response.data.voice?.provider,
        created: response.data.createdAt
      }
    });

  } catch (error) {
    console.error("❌ Vapi API error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    });

    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: "Authentication failed",
        details: "Invalid VAPI_SECRET_KEY. Please check your API key"
      });
    }

    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: "Assistant not found",
        details: "The specified Assistant ID does not exist",
        assistantId: req.body.assistantId
      });
    }

    res.status(error.response?.status || 500).json({ 
      error: "Failed to get assistant details",
      details: error.response?.data || error.message,
      status: error.response?.status
    });
  }
});

// ✅ Route to list all assistants
vapiRouter.get("/assistants", async (req, res) => {
  try {
    const { limit = 100, cursor } = req.query;

    if (!process.env.VAPI_SECRET_KEY) {
      return res.status(500).json({ 
        error: "VAPI_SECRET_KEY not configured",
        details: "Check your environment variables"
      });
    }

    console.log("📋 Getting all assistants...");

    const url = new URL("https://api.vapi.ai/assistant");
    url.searchParams.append('limit', limit.toString());
    if (cursor) url.searchParams.append('cursor', cursor);

    const response = await axios.get(url.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.VAPI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });

    const assistants = response.data;
    console.log(`✅ Found ${assistants.length} assistants`);

    const assistantSummary = assistants.map(assistant => ({
      id: assistant.id,
      name: assistant.name || 'Unnamed',
      model: assistant.model?.provider || 'Unknown',
      voice: assistant.voice?.provider || 'Unknown',
      created: assistant.createdAt
    }));

    res.json({
      success: true,
      assistants: assistants,
      summary: assistantSummary,
      count: assistants.length,
      metadata: {
        total: assistants.length,
        limit: parseInt(limit),
        hasMore: assistants.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error("❌ Vapi API error:", error.message);

    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: "Authentication failed",
        details: "Invalid VAPI_SECRET_KEY"
      });
    }

    res.status(error.response?.status || 500).json({ 
      error: "Failed to get assistants list",
      details: error.response?.data || error.message,
      status: error.response?.status
    });
  }
});

// ✅ Route to initiate phone calls
vapiRouter.post("/call", async (req, res) => {
  try {
    const { assistantId, customer, assistantOverrides } = req.body;
    
    if (!assistantId) {
      return res.status(400).json({ error: "Assistant ID is required" });
    }

    if (!customer?.number) {
      return res.status(400).json({ 
        error: "Customer phone number is required",
        details: "Must be in E.164 format"
      });
    }

    if (!process.env.VAPI_SECRET_KEY) {
      return res.status(500).json({ error: "VAPI_SECRET_KEY not configured" });
    }

    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(customer.number)) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    console.log("📞 Initiating call:", {
      assistantId,
      phoneNumber: customer.number
    });

    const callPayload = {
      assistantId: assistantId.trim(),
      customer: {
        number: customer.number.trim(),
        name: customer.name || undefined,
        email: customer.email || undefined
      }
    };

    if (assistantOverrides) {
      callPayload.assistantOverrides = assistantOverrides;
    }

    const response = await axios.post(
      "https://api.vapi.ai/call",
      callPayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.VAPI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000
      }
    );

    console.log("✅ Call initiated successfully:", response.data.id);

    res.json({
      success: true,
      call: response.data,
      metadata: {
        callId: response.data.id,
        status: response.data.status,
        createdAt: response.data.createdAt
      }
    });

  } catch (error) {
    console.error("❌ Vapi call error:", error.message);
    res.status(error.response?.status || 500).json({ 
      error: "Failed to initiate call",
      details: error.response?.data || error.message,
      status: error.response?.status
    });
  }
});

// ✅ Health check route
vapiRouter.get("/health", (req, res) => {
  const hasSecretKey = !!process.env.VAPI_SECRET_KEY;
  const secretKeyPrefix = process.env.VAPI_SECRET_KEY?.slice(0, 8) + "..." || "Not set";
  
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    vapi: {
      hasSecretKey,
      secretKeyPrefix,
      apiUrl: "https://api.vapi.ai"
    },
    server: {
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
  });
});

// ✅ Validate assistant configuration
vapiRouter.post("/validate", async (req, res) => {
  try {
    const { assistantId } = req.body;
    
    if (!assistantId) {
      return res.status(400).json({ error: "Assistant ID required" });
    }

    if (!process.env.VAPI_SECRET_KEY) {
      return res.status(500).json({ error: "VAPI_SECRET_KEY not configured" });
    }

    const response = await axios.get(
      `https://api.vapi.ai/assistant/${assistantId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.VAPI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const assistant = response.data;
    
    const validation = {
      hasName: !!assistant.name,
      hasModel: !!assistant.model,
      hasVoice: !!assistant.voice,
      hasFirstMessage: !!assistant.firstMessage,
      modelProvider: assistant.model?.provider,
      voiceProvider: assistant.voice?.provider,
      isActive: assistant.status !== 'inactive'
    };

    const issues = [];
    if (!validation.hasName) issues.push("Assistant name is missing");
    if (!validation.hasModel) issues.push("Model configuration is missing");
    if (!validation.hasVoice) issues.push("Voice configuration is missing");
    if (!validation.isActive) issues.push("Assistant is inactive");

    res.json({
      success: true,
      assistant: {
        id: assistant.id,
        name: assistant.name,
        status: assistant.status
      },
      validation,
      issues,
      ready: issues.length === 0
    });

  } catch (error) {
    console.error("Validation error:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: "Validation failed",
      details: error.response?.data || error.message
    });
  }
});

// ✅ NEW: Route to update assistant tools
vapiRouter.post("/assistant/update-tools", async (req, res) => {
  try {
    const { assistantId } = req.body;

    if (!assistantId) {
      return res.status(400).json({ error: "Assistant ID is required" });
    }

    if (!process.env.VAPI_SECRET_KEY) {
      return res.status(500).json({ error: "VAPI_SECRET_KEY not configured" });
    }

    const tools = [
      {
        type: "function",
        name: "google_search",
        description: "Search Google with a query",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "The search query" }
          },
          required: ["query"]
        }
      },
      {
        type: "function",
        name: "youtube_search",
        description: "Search YouTube with a query",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "The search query" }
          },
          required: ["query"]
        }
      },
      {
        type: "function",
        name: "open_app",
        description: "Open a web app like YouTube, Instagram, etc.",
        parameters: {
          type: "object",
          properties: {
            app_name: { type: "string", description: "Name of the app to open" }
          },
          required: ["app_name"]
        }
      }
    ];

    console.log("🛠️ Updating tools for assistant:", assistantId);

    const response = await axios.patch(
      `https://api.vapi.ai/assistant/${assistantId}`,
      { tools },
      {
        headers: {
          Authorization: `Bearer ${process.env.VAPI_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Tools updated successfully:", response.data.name);

    res.json({
      success: true,
      assistant: response.data,
      toolsUpdated: tools.map(t => t.name)
    });

  } catch (error) {
    console.error("❌ Failed to update tools:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to update assistant tools",
      details: error.response?.data || error.message
    });
  }
});

export default vapiRouter;
