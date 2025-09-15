const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Getting spin history:', event.queryStringParameters);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    const params = event.queryStringParameters || {};
    const limit = parseInt(params.limit) || 50;
    const typeFilter = params.type;

    // Scan the table
    const command = new ScanCommand({
      TableName: 'SpinHistory',
      Limit: Math.min(limit * 2, 200) // Get more than needed to handle filtering
    });

    const result = await ddbDocClient.send(command);
    let spins = result.Items || [];

    // Apply type filter if specified
    if (typeFilter && typeFilter !== 'all') {
      spins = spins.filter(spin => spin.entryType === typeFilter);
    }

    // Sort by timestamp descending (most recent first)
    spins.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply limit after filtering and sorting
    spins = spins.slice(0, limit);

    console.log(`Returning ${spins.length} spins`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(spins)
    };
  } catch (error) {
    console.error('Error getting spin history:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};