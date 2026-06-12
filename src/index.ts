import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

// Configuration interface
interface BondoraConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
}

// Bondora API Client
class BondoraApiClient {
  private baseUrl = "https://api.bondora.com/api/v1";
  private config: BondoraConfig;

  constructor(config: BondoraConfig) {
    this.config = config;
  }

  private async makeRequest(method: string, endpoint: string, data?: any) {
    try {
      const isGet = method.toUpperCase() === 'GET';
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          "Content-Type": "application/json",
        },
        params: isGet ? data : undefined,
        data: !isGet ? data : undefined,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error("Authentication failed. Please check your access token.");
      }
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  async getAccountBalance() {
    return this.makeRequest("GET", "/account/balance");
  }

  async getInvestments(pageSize = 100, pageNr = 1) {
    return this.makeRequest("GET", "/account/investments", {
      PageSize: pageSize,
      PageNr: pageNr,
    });
  }

  async getAuctions(pageSize = 100, pageNr = 1) {
    return this.makeRequest("GET", "/auctions", {
      PageSize: pageSize,
      PageNr: pageNr,
    });
  }

  async makeBid(auctionId: string, amount: number) {
    return this.makeRequest("POST", `/bid/${auctionId}/${amount}`);
  }

  async getBids(pageSize = 100, pageNr = 1) {
    return this.makeRequest("GET", "/bids", {
      PageSize: pageSize,
      PageNr: pageNr,
    });
  }

  async getSecondaryMarket(pageSize = 100, pageNr = 1) {
    return this.makeRequest("GET", "/secondarymarket", {
      PageSize: pageSize,
      PageNr: pageNr,
    });
  }

  async buySecondaryMarket(itemId: string) {
    return this.makeRequest("POST", `/secondarymarket/buy/${itemId}`);
  }

  async sellSecondaryMarket(loanPartId: string, desiredDiscountRate?: number, desiredPremiumRate?: number) {
    return this.makeRequest("POST", "/secondarymarket/sell", {
      LoanPartId: loanPartId,
      DesiredDiscountRate: desiredDiscountRate,
      DesiredPremiumRate: desiredPremiumRate,
    });
  }
  async cancelSecondaryMarket(itemIds: string[]) {
    return this.makeRequest("POST", "/secondarymarket/cancel", {
      ItemIds: itemIds,
    });
  }

  async getEventLog(pageSize = 100, pageNr = 1) {
    return this.makeRequest("GET", "/eventlog", {
      PageSize: pageSize,
      PageNr: pageNr,
    });
  }
}

// Create MCP Server
async function createBondoraMcpServer() {
  const server = new McpServer({
    name: "bondora-mcp",
    version: "1.0.0",
  });

  // Initialize API client with environment variables
  const config: BondoraConfig = {
    clientId: process.env.BONDORA_CLIENT_ID || "",
    clientSecret: process.env.BONDORA_CLIENT_SECRET || "",
    accessToken: process.env.BONDORA_ACCESS_TOKEN || "",
    refreshToken: process.env.BONDORA_REFRESH_TOKEN || "",
  };

  const bondoraClient = new BondoraApiClient(config);

  // Tool: Get account balance
  server.tool(
    "get_account_balance",
    {},
    async () => {
      try {
        const balance = await bondoraClient.getAccountBalance();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(balance, null, 2),
          }],
        };
      } catch (error: any) {
        return {          content: [{
            type: "text",
            text: `Error: ${error.message}`,
          }],
        };
      }
    }
  );

  // Tool: Get investments
  server.tool(
    "get_investments",
    {
      pageSize: z.number().optional().default(100),
      pageNr: z.number().optional().default(1),
    },
    async ({ pageSize, pageNr }) => {
      try {
        const investments = await bondoraClient.getInvestments(pageSize, pageNr);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(investments, null, 2),
          }],
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message}`,
          }],
        };
      }
    }
  );

  // Tool: Get available auctions
  server.tool(
    "get_auctions",
    {
      pageSize: z.number().optional().default(100),
      pageNr: z.number().optional().default(1),
    },
    async ({ pageSize, pageNr }) => {
      try {
        const auctions = await bondoraClient.getAuctions(pageSize, pageNr);
        return {
          content: [{            type: "text",
            text: JSON.stringify(auctions, null, 2),
          }],
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message}`,
          }],
        };
      }
    }
  );

  // Add remaining tools with similar pattern
  const toolDefinitions = [
    {
      name: "make_bid",
      schema: { auctionId: z.string(), amount: z.number() },
      handler: async (args: any) => bondoraClient.makeBid(args.auctionId, args.amount),
    },
    {
      name: "get_bids",
      schema: { pageSize: z.number().optional().default(100), pageNr: z.number().optional().default(1) },
      handler: async (args: any) => bondoraClient.getBids(args.pageSize, args.pageNr),
    },
    {
      name: "get_secondary_market",
      schema: { pageSize: z.number().optional().default(100), pageNr: z.number().optional().default(1) },
      handler: async (args: any) => bondoraClient.getSecondaryMarket(args.pageSize, args.pageNr),
    },
    {
      name: "buy_secondary_market",
      schema: { itemId: z.string() },
      handler: async (args: any) => bondoraClient.buySecondaryMarket(args.itemId),
    },
    {
      name: "sell_secondary_market",
      schema: { 
        loanPartId: z.string(), 
        desiredDiscountRate: z.number().optional(), 
        desiredPremiumRate: z.number().optional() 
      },
      handler: async (args: any) => bondoraClient.sellSecondaryMarket(
        args.loanPartId, args.desiredDiscountRate, args.desiredPremiumRate
      ),
    },    {
      name: "cancel_secondary_market",
      schema: { itemIds: z.array(z.string()) },
      handler: async (args: any) => bondoraClient.cancelSecondaryMarket(args.itemIds),
    },
    {
      name: "get_event_log",
      schema: { pageSize: z.number().optional().default(100), pageNr: z.number().optional().default(1) },
      handler: async (args: any) => bondoraClient.getEventLog(args.pageSize, args.pageNr),
    },
  ];

  // Register all tools
  toolDefinitions.forEach(({ name, schema, handler }) => {
    server.tool(name, schema as any, async (args: any) => {
      try {
        const result = await handler(args);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          }],
        };
      } catch (error: any) {
        return {
          content: [{
            type: "text" as const,
            text: `Error: ${error.message}`,
          }],
        };
      }
    });
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("Bondora MCP server started successfully");
}

// Run the server
createBondoraMcpServer().catch((error) => {
  console.error("Failed to start Bondora MCP server:", error);
  process.exit(1);
});