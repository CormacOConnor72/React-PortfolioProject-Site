const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    console.log('Creating entry:', event.body);

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
        const body = JSON.parse(event.body);

        // Validate required fields
        if (!body.name || !body.type || !body.who || !body.why) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields: name, type, who, why' })
            };
        }

        const entry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: body.name,
            type: body.type,
            who: body.who,
            why: body.why,
            createdAt: new Date().toISOString()
        };

        const command = new PutCommand({
            TableName: 'portfolio-data-entries',
            Item: entry
        });

        await docClient.send(command);

        console.log('Entry created:', entry.id);

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify(entry)
        };
    } catch (error) {
        console.error('Error creating entry:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};