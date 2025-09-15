const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Recording spin:', event.body);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    const body = JSON.parse(event.body);

    // Validate required fields
    if (!body.entryId || !body.entryName || !body.sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const now = new Date().toISOString();
    const spinRecord = {
      id: `spin_${uuidv4()}`,
      entryId: body.entryId,
      entryName: body.entryName,
      entryType: body.entryType || 'Unknown',
      entryWho: body.entryWho || 'Unknown',
      filter: body.filter || 'all',
      weightedMode: body.weightedMode || false,
      timestamp: body.timestamp || now,
      sessionId: body.sessionId,
      createdAt: now
    };

    const command = new PutCommand({
      TableName: 'SpinHistory',
      Item: spinRecord
    });

    await ddbDocClient.send(command);

    console.log('Spin recorded:', spinRecord.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(spinRecord)
    };
  } catch (error) {
    console.error('Error recording spin:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};