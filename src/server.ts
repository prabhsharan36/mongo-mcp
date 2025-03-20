import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import dotenv from "dotenv";
dotenv.config();
import express, { Application } from "express";
import queryRoutes from "./routes/queryRoutes";
import * as bodyParser from "body-parser";
import { buildCollectionSchema } from "./database/schema";
import { connectToMongoDB, db } from "./database/client";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// async function main() {
//   const app: Application = express();
//   app.use(express.json());
//   app.use(bodyParser.urlencoded({ extended: true }));

//   // MongoDB Connection
//   await connectToMongoDB(process.env.MONGODB_URL || "");

//   // Routes
//   app.use("/api", queryRoutes);

//   const PORT = process.env.PORT || 3000;
//   app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
//   });

//   const server = new McpServer({ name: "mongo-mcp", version: "1.0.0" });

//   server.resource(
//     "greeting",
//     new ResourceTe
//     async (uri, { name }) => ({
//       contents: [
//         {
//           uri: uri.href,
//           text: `Hello, ${name}!`,
//         },
//       ],
//     })
//   );

//   // MCP Endpoint
//   app.get("/sse", async (req, res) => {
//     const transport = new SSEServerTransport("/messages", res);
//     await server.connect(transport);
//   });

//   app.post("/messages", async (req, res) => {
//     // Note: to support multiple simultaneous connections, these messages will
//     // need to be routed to a specific matching transport. (This logic isn't
//     // implemented here, for simplicity.)
//     // await transport.handlePostMessage(req, res);
//   });

//   async function makeNWSRequest<T>(url: string): Promise<T | null> {
//     const headers = {
//       "User-Agent": "weather-app/1.0",
//       Accept: "application/geo+json",
//     };

//     try {
//       const response = await fetch(url, { headers });
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       return (await response.json()) as T;
//     } catch (error) {
//       console.error("Error making NWS request:", error);
//       return null;
//     }
//   }

//   interface AlertsResponse {
//     features: AlertFeature[];
//   }

//   interface AlertFeature {
//     properties: {
//       event?: string;
//       areaDesc?: string;
//       severity?: string;
//       status?: string;
//       headline?: string;
//     };
//   }

//   server.tool(
//     "get-alerts",
//     "Get weather alerts for a state",
//     {
//       state: z
//         .string()
//         .length(2)
//         .describe("Two-letter state code (e.g. CA, NY)"),
//     },
//     async ({ state }) => {
//       const stateCode = state.toUpperCase();
//       const alertsUrl = `https://api.weather.gov/alerts?area=${stateCode}`;
//       const alertsData = await makeNWSRequest<AlertsResponse>(alertsUrl);

//       if (!alertsData) {
//         return {
//           content: [
//             {
//               type: "text",
//               text: "Failed to retrieve alerts data",
//             },
//           ],
//         };
//       }

//       const features = alertsData.features || [];
//       if (features.length === 0) {
//         return {
//           content: [
//             {
//               type:
//               text: `No active alerts for ${stateCode}`,
//             },
//           ],
//         };
//       }

//       const formattedAlerts = features.map(formatAlert);
//       const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join(
//         "\n"
//       )}`;

//       return {
//         content: [
//           {
//             type: "text",
//             text: alertsText,
//           },
//         ],
//       };
//     }
//   );

//   function formatAlert(feature: AlertFeature): string {
//     const props = feature.properties;
//     return [
//       `Event: ${props.event || "Unknown"}`,
//       `Area: ${props.areaDesc || "Unknown"}`,
//       `Severity: ${props.severity || "Unknown"}`,
//       `Status: ${props.status || "Unknown"}`,
//       `Headline: ${props.headline || "No headline"}`,
//       "---",
//     ].join("\n");
//   }

//   const transport = new StdioServerTransport();
//   await server.connect(transport);
//   console.error("Weather MCP Server running on stdio");

//   const collections = await db.listCollections().toArray();
//   const collectionNames = collections.map((col) => col.name);

//   const result = await buildCollectionSchema(db.collection("visits"));
// }

// main();

const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather-app/1.0";

// Create server instance
const server = new McpServer({
  name: "weather",
  version: "1.0.0",
});

// Helper function for making NWS API requests
async function makeNWSRequest<T>(url: string): Promise<T | null> {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/geo+json",
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making NWS request:", error);
    return null;
  }
}

interface AlertFeature {
  properties: {
    event?: string;
    areaDesc?: string;
    severity?: string;
    status?: string;
    headline?: string;
  };
}

// Format alert data
function formatAlert(feature: AlertFeature): string {
  const props = feature.properties;
  return [
    `Event: ${props.event || "Unknown"}`,
    `Area: ${props.areaDesc || "Unknown"}`,
    `Severity: ${props.severity || "Unknown"}`,
    `Status: ${props.status || "Unknown"}`,
    `Headline: ${props.headline || "No headline"}`,
    "---",
  ].join("\n");
}

interface ForecastPeriod {
  name?: string;
  temperature?: number;
  temperatureUnit?: string;
  windSpeed?: string;
  windDirection?: string;
  shortForecast?: string;
}

interface AlertsResponse {
  features: AlertFeature[];
}

interface PointsResponse {
  properties: {
    forecast?: string;
  };
}

interface ForecastResponse {
  properties: {
    periods: ForecastPeriod[];
  };
}

// Register weather tools
server.tool(
  "get-alerts",
  "Get weather alerts for a state",
  {
    state: z.string().length(2).describe("Two-letter state code (e.g. CA, NY)"),
  },
  async ({ state }) => {
    const stateCode = state.toUpperCase();
    const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
    const alertsData = await makeNWSRequest<AlertsResponse>(alertsUrl);

    if (!alertsData) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve alerts data",
          },
        ],
      };
    }

    const features = alertsData.features || [];
    if (features.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No active alerts for ${stateCode}`,
          },
        ],
      };
    }

    const formattedAlerts = features.map(formatAlert);
    const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join(
      "\n"
    )}`;

    return {
      content: [
        {
          type: "text",
          text: alertsText,
        },
      ],
    };
  }
);

server.tool(
  "get-forecast",
  "Get weather forecast for a location",
  {
    latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
    longitude: z
      .number()
      .min(-180)
      .max(180)
      .describe("Longitude of the location"),
  },
  async ({ latitude, longitude }) => {
    // Get grid point data
    const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(
      4
    )},${longitude.toFixed(4)}`;
    const pointsData = await makeNWSRequest<PointsResponse>(pointsUrl);

    if (!pointsData) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`,
          },
        ],
      };
    }

    const forecastUrl = pointsData.properties?.forecast;
    if (!forecastUrl) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to get forecast URL from grid point data",
          },
        ],
      };
    }

    // Get forecast data
    const forecastData = await makeNWSRequest<ForecastResponse>(forecastUrl);
    if (!forecastData) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve forecast data",
          },
        ],
      };
    }

    const periods = forecastData.properties?.periods || [];
    if (periods.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No forecast periods available",
          },
        ],
      };
    }

    // Format forecast periods
    const formattedForecast = periods.map((period: ForecastPeriod) =>
      [
        `${period.name || "Unknown"}:`,
        `Temperature: ${period.temperature || "Unknown"}°${
          period.temperatureUnit || "F"
        }`,
        `Wind: ${period.windSpeed || "Unknown"} ${period.windDirection || ""}`,
        `${period.shortForecast || "No forecast available"}`,
        "---",
      ].join("\n")
    );

    const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join(
      "\n"
    )}`;

    return {
      content: [
        {
          type: "text",
          text: forecastText,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
