const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Clearing spin history');

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    // First, scan to get all items
    const scanCommand = new ScanCommand({
      TableName: 'SpinHistory',
      ProjectionExpression: 'id, #ts',
      ExpressionAttributeNames: {
        '#ts': 'timestamp'
      }
    });

    const scanResult = await ddbDocClient.send(scanCommand);
    const items = scanResult.Items || [];

    if (items.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'No items to delete', deleted: 0 })
      };
    }

    // Delete items in batches (DynamoDB batch limit is 25)
    const batchSize = 25;
    let deletedCount = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      const deleteRequests = batch.map(item => ({
        DeleteRequest: {
          Key: {
            id: item.id,
            timestamp: item.timestamp
          }
        }
      }));

      const batchCommand = new BatchWriteCommand({
        RequestItems: {
          SpinHistory: deleteRequests
        }
      });

      await ddbDocClient.send(batchCommand);
      deletedCount += batch.length;
    }

    console.log(`Cleared ${deletedCount} spin records`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Spin history cleared successfully',
        deleted: deletedCount
      })
    };
  } catch (error) {
    console.error('Error clearing spin history:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};