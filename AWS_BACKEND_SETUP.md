# AWS Backend Setup Guide for Global Metrics

This guide walks you through implementing the backend infrastructure needed to support persistent, site-wide spin tracking and global metrics.

## 📋 Overview

You need to add 4 new Lambda functions and 1 new DynamoDB table to your existing AWS infrastructure to support:
- Recording every spin to persistent storage
- Retrieving global spin history
- Calculating site-wide metrics and statistics
- Managing spin data

---

## 🗄️ Step 1: Create DynamoDB Table

### Create `SpinHistory` Table

1. **Go to AWS Console → DynamoDB → Tables → Create Table**

2. **Table Configuration:**
   ```
   Table name: SpinHistory
   Partition key: id (String)
   Sort key: timestamp (String)
   ```

3. **Settings:**
   - Use default settings (On-demand billing recommended)
   - No need for additional indexes initially

4. **Expected Table Schema:**
   ```json
   {
     "id": "spin_12345678-1234-1234-1234-123456789abc",
     "entryId": "entry_abc123",
     "entryName": "Pizza Night Planning",
     "entryType": "Event",
     "entryWho": "Everyone",
     "filter": "all",
     "weightedMode": false,
     "timestamp": "2025-01-15T14:30:00.000Z",
     "sessionId": "session_1737023400_abc123def",
     "createdAt": "2025-01-15T14:30:00.000Z"
   }
   ```

---

## ⚡ Step 2: Create Lambda Functions

### Function 1: `recordSpin`

**Purpose:** Handle POST /spins - Record new spin events

1. **Create Lambda Function:**
   - Runtime: Node.js 18.x
   - Function name: `recordSpin`

2. **Function Code:**
   ```javascript
   const AWS = require('aws-sdk');
   const { v4: uuidv4 } = require('uuid');
   const dynamodb = new AWS.DynamoDB.DocumentClient();

   exports.handler = async (event) => {
     console.log('Recording spin:', event.body);

     try {
       const body = JSON.parse(event.body);

       // Validate required fields
       if (!body.entryId || !body.entryName || !body.sessionId) {
         return {
           statusCode: 400,
           headers: {
             'Access-Control-Allow-Origin': '*',
             'Access-Control-Allow-Headers': 'Content-Type',
             'Access-Control-Allow-Methods': 'POST, OPTIONS'
           },
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

       await dynamodb.put({
         TableName: 'SpinHistory',
         Item: spinRecord
       }).promise();

       console.log('Spin recorded:', spinRecord.id);

       return {
         statusCode: 200,
         headers: {
           'Access-Control-Allow-Origin': '*',
           'Access-Control-Allow-Headers': 'Content-Type',
           'Access-Control-Allow-Methods': 'POST, OPTIONS'
         },
         body: JSON.stringify(spinRecord)
       };
     } catch (error) {
       console.error('Error recording spin:', error);
       return {
         statusCode: 500,
         headers: {
           'Access-Control-Allow-Origin': '*',
           'Access-Control-Allow-Headers': 'Content-Type',
           'Access-Control-Allow-Methods': 'POST, OPTIONS'
         },
         body: JSON.stringify({ error: 'Internal server error' })
       };
     }
   };
   ```

3. **Add DynamoDB Permissions:**
   - Go to Configuration → Permissions
   - Add policy: `AmazonDynamoDBFullAccess` (or create custom policy for SpinHistory table)

---

### Function 2: `getSpinHistory`

**Purpose:** Handle GET /spins - Retrieve spin history with filtering

1. **Create Lambda Function:**
   - Runtime: Node.js 18.x
   - Function name: `getSpinHistory`

2. **Function Code:**
   ```javascript
   const AWS = require('aws-sdk');
   const dynamodb = new AWS.DynamoDB.DocumentClient();

   exports.handler = async (event) => {
     console.log('Getting spin history:', event.queryStringParameters);

     try {
       const params = event.queryStringParameters || {};
       const limit = parseInt(params.limit) || 50;
       const typeFilter = params.type;

       // Scan the table (note: for production, consider using GSI for better performance)
       const scanParams = {
         TableName: 'SpinHistory',
         Limit: Math.min(limit, 100) // Cap at 100 for performance
       };

       const result = await dynamodb.scan(scanParams).promise();
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
         headers: {
           'Access-Control-Allow-Origin': '*',
           'Access-Control-Allow-Headers': 'Content-Type',
           'Access-Control-Allow-Methods': 'GET, OPTIONS'
         },
         body: JSON.stringify(spins)
       };
     } catch (error) {
       console.error('Error getting spin history:', error);
       return {
         statusCode: 500,
         headers: {
           'Access-Control-Allow-Origin': '*',
           'Access-Control-Allow-Headers': 'Content-Type',
           'Access-Control-Allow-Methods': 'GET, OPTIONS'
         },
         body: JSON.stringify({ error: 'Internal server error' })
       };
     }
   };
   ```

---

### Function 3: `getGlobalMetrics`

**Purpose:** Handle GET /metrics - Calculate and return site-wide statistics

1. **Create Lambda Function:**
   - Runtime: Node.js 18.x
   - Function name: `getGlobalMetrics`

2. **Function Code:**
   ```javascript
   const AWS = require('aws-sdk');
   const dynamodb = new AWS.DynamoDB.DocumentClient();

   exports.handler = async (event) => {
     console.log('Calculating global metrics');

     try {
       // Get all spins (in production, consider using pagination)
       const result = await dynamodb.scan({
         TableName: 'SpinHistory'
       }).promise();

       const spins = result.Items || [];
       const now = new Date();
       const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
       const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

       // Calculate metrics
       const totalSpins = spins.length;
       const uniqueUsers = new Set(spins.map(spin => spin.sessionId)).size;

       const todaySpins = spins.filter(spin =>
         new Date(spin.timestamp) >= today
       ).length;

       const weekSpins = spins.filter(spin =>
         new Date(spin.timestamp) >= weekAgo
       ).length;

       // Calculate top entries
       const entryCounts = {};
       spins.forEach(spin => {
         const key = spin.entryName;
         entryCounts[key] = (entryCounts[key] || 0) + 1;
       });

       const topEntries = Object.entries(entryCounts)
         .map(([name, count]) => ({ name, count }))
         .sort((a, b) => b.count - a.count)
         .slice(0, 10);

       const metrics = {
         totalSpins,
         uniqueUsers,
         todaySpins,
         weekSpins,
         topEntries,
         lastUpdated: now.toISOString()
       };

       console.log('Metrics calculated:', metrics);

       return {
         statusCode: 200,
         headers: {
           'Access-Control-Allow-Origin': '*',
           'Access-Control-Allow-Headers': 'Content-Type',
           'Access-Control-Allow-Methods': 'GET, OPTIONS'
         },
         body: JSON.stringify(metrics)
       };
     } catch (error) {
       console.error('Error calculating metrics:', error);
       return {
         statusCode: 500,
         headers: {
           'Access-Control-Allow-Origin': '*',
           'Access-Control-Allow-Headers': 'Content-Type',
           'Access-Control-Allow-Methods': 'GET, OPTIONS'
         },
         body: JSON.stringify({ error: 'Internal server error' })
       };
     }
   };
   ```

---

### Function 4: `clearSpinHistory`

**Purpose:** Handle DELETE /spins - Clear all spin history (admin function)

1. **Create Lambda Function:**
   - Runtime: Node.js 18.x
   - Function name: `clearSpinHistory`

2. **Function Code:**
   ```javascript
   const AWS = require('aws-sdk');
   const dynamodb = new AWS.DynamoDB.DocumentClient();

   exports.handler = async (event) => {
     console.log('Clearing spin history');

     try {
       // First, scan to get all items
       const scanResult = await dynamodb.scan({
         TableName: 'SpinHistory',
         ProjectionExpression: 'id, #ts',
         ExpressionAttributeNames: {
           '#ts': 'timestamp'
         }
       }).promise();

       const items = scanResult.Items || [];

       if (items.length === 0) {
         return {
           statusCode: 200,
           headers: {
             'Access-Control-Allow-Origin': '*',
             'Access-Control-Allow-Headers': 'Content-Type',
             'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
           },
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

         await dynamodb.batchWrite({
           RequestItems: {
             SpinHistory: deleteRequests
           }
         }).promise();

         deletedCount += batch.length;
       }

       console.log(`Cleared ${deletedCount} spin records`);

       return {
         statusCode: 200,
         headers: {
           'Access-Control-Allow-Origin': '*',
           'Access-Control-Allow-Headers': 'Content-Type',
           'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
         },
         body: JSON.stringify({
           message: 'Spin history cleared successfully',
           deleted: deletedCount
         })
       };
     } catch (error) {
       console.error('Error clearing spin history:', error);
       return {
         statusCode: 500,
         headers: {
           'Access-Control-Allow-Origin': '*',
           'Access-Control-Allow-Headers': 'Content-Type',
           'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
         },
         body: JSON.stringify({ error: 'Internal server error' })
       };
     }
   };
   ```

---

## 🚀 Step 3: Update API Gateway

### Add New Routes to Existing API

1. **Go to API Gateway → Your existing API → Resources**

2. **Create `/spins` resource:**
   - Actions → Create Resource
   - Resource Name: `spins`
   - Resource Path: `/spins`

3. **Add Methods to `/spins`:**

   **POST Method:**
   - Actions → Create Method → POST
   - Integration Type: Lambda Function
   - Lambda Function: `recordSpin`
   - Save

   **GET Method:**
   - Actions → Create Method → GET
   - Integration Type: Lambda Function
   - Lambda Function: `getSpinHistory`
   - Save

   **DELETE Method:**
   - Actions → Create Method → DELETE
   - Integration Type: Lambda Function
   - Lambda Function: `clearSpinHistory`
   - Save

4. **Create `/metrics` resource:**
   - Actions → Create Resource
   - Resource Name: `metrics`
   - Resource Path: `/metrics`

5. **Add GET Method to `/metrics`:**
   - Actions → Create Method → GET
   - Integration Type: Lambda Function
   - Lambda Function: `getGlobalMetrics`
   - Save

6. **Enable CORS for all new methods:**
   - Select each method → Actions → Enable CORS
   - Allow all origins (`*`) and headers
   - Deploy changes

7. **Deploy API:**
   - Actions → Deploy API
   - Stage: `prod`

---

## 🧪 Step 4: Test Your Implementation

### Test with curl or Postman:

```bash
# Test recording a spin
curl -X POST https://your-api-id.execute-api.region.amazonaws.com/prod/spins \
  -H "Content-Type: application/json" \
  -d '{
    "entryId": "test123",
    "entryName": "Test Entry",
    "entryType": "Test",
    "entryWho": "Tester",
    "filter": "all",
    "weightedMode": false,
    "sessionId": "test_session_123"
  }'

# Test getting spin history
curl https://your-api-id.execute-api.region.amazonaws.com/prod/spins?limit=10

# Test getting metrics
curl https://your-api-id.execute-api.region.amazonaws.com/prod/metrics
```

---

## 🔧 Step 5: Update Your Frontend (Optional)

Your frontend is already configured to use these endpoints! Just make sure your `API_BASE_URL` in `dataService.js` points to your deployed API.

---

## 🚨 Important Notes

### Performance Considerations:
- **DynamoDB Scans**: The current implementation uses `scan` operations which can be expensive for large datasets
- **For Production**: Consider adding a Global Secondary Index (GSI) on `timestamp` for better query performance
- **Caching**: Consider adding CloudFront or Lambda caching for metrics endpoint

### Security Considerations:
- **CORS**: Currently allows all origins (`*`) - restrict to your domain in production
- **Authentication**: Consider adding API authentication for admin functions like `clearSpinHistory`
- **Rate Limiting**: Consider adding rate limiting to prevent abuse

### Cost Optimization:
- **DynamoDB**: Use On-Demand billing initially, switch to Provisioned if usage is predictable
- **Lambda**: Current functions should stay within free tier for moderate usage
- **API Gateway**: First 1 million requests per month are free

---

## 📊 Expected API Responses

### POST /spins Response:
```json
{
  "id": "spin_12345678-1234-1234-1234-123456789abc",
  "entryId": "entry_abc123",
  "entryName": "Pizza Night Planning",
  "entryType": "Event",
  "entryWho": "Everyone",
  "filter": "all",
  "weightedMode": false,
  "timestamp": "2025-01-15T14:30:00.000Z",
  "sessionId": "session_1737023400_abc123def",
  "createdAt": "2025-01-15T14:30:00.000Z"
}
```

### GET /metrics Response:
```json
{
  "totalSpins": 1247,
  "uniqueUsers": 23,
  "todaySpins": 45,
  "weekSpins": 312,
  "topEntries": [
    {
      "name": "Pizza Night Planning",
      "count": 89
    },
    {
      "name": "Movie Choice",
      "count": 67
    }
  ],
  "lastUpdated": "2025-01-15T14:30:00.000Z"
}
```

---

## 🎉 You're Done!

After implementing these backend changes, your frontend will automatically start tracking global metrics and displaying site-wide statistics. Users will see:

- 🌍 Global spin counts across all users
- 👥 Active user metrics
- 🏆 Most popular decisions globally
- 📊 Real-time activity updates

The implementation is designed to fail gracefully - if the backend is unavailable, local functionality continues to work normally.