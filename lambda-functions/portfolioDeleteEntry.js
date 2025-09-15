const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    console.log('Deleting entry:', event.pathParameters);

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const id = event.pathParameters.id;

        if (!id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing entry ID in path parameters' })
            };
        }

        const command = new DeleteCommand({
            TableName: 'portfolio-data-entries',
            Key: { id: id }
        });

        await docClient.send(command);

        console.log('Entry deleted:', id);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Entry deleted successfully' })
        };
    } catch (error) {
        console.error('Error deleting entry:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};