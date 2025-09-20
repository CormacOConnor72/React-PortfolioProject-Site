const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Calculating global metrics');

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    // Get all spins (in production, consider using pagination for large datasets)
    const spinsCommand = new ScanCommand({
      TableName: 'SpinHistory'
    });

    const spinsResult = await ddbDocClient.send(spinsCommand);
    const spins = spinsResult.Items || [];

    // Get current active entries to filter against
    const entriesCommand = new ScanCommand({
      TableName: 'portfolio-data-entries'
    });

    const entriesResult = await ddbDocClient.send(entriesCommand);
    const activeEntries = entriesResult.Items || [];
    const activeEntryNames = new Set(activeEntries.map(entry => entry.name));
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

    // Calculate top entries (only include entries that still exist)
    const entryCounts = {};
    spins.forEach(spin => {
      const key = spin.entryName;
      if (activeEntryNames.has(key)) {
        entryCounts[key] = (entryCounts[key] || 0) + 1;
      }
    });

    const topEntries = Object.entries(entryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate type distribution (only include types from entries that still exist)
    const typeCounts = {};
    spins.forEach(spin => {
      if (activeEntryNames.has(spin.entryName)) {
        const type = spin.entryType || 'Unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
    });

    const typeDistribution = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    const metrics = {
      totalSpins,
      uniqueUsers,
      todaySpins,
      weekSpins,
      topEntries,
      typeDistribution,
      averageSpinsPerUser: uniqueUsers > 0 ? Math.round((totalSpins / uniqueUsers) * 10) / 10 : 0,
      lastUpdated: now.toISOString()
    };

    console.log('Metrics calculated:', metrics);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(metrics)
    };
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};