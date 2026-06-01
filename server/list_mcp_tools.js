import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import dotenv from 'dotenv';
dotenv.config();

async function showConnectSchema() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sera';
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', 'mongodb-mcp-server'],
      env: { ...process.env, MONGODB_CONNECTION_STRING: mongoUri }
    });
    const client = new Client({ name: 'test-mcp-client', version: '1.0.0' }, { capabilities: {} });
    await client.connect(transport);
    const response = await client.listTools();
    const connectTool = response.tools.find(t => t.name === 'connect');
    console.log('CONNECT TOOL SCHEMA:');
    console.log(JSON.stringify(connectTool, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

showConnectSchema();
