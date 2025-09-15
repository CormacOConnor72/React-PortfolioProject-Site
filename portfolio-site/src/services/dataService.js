// AWS API service for shared data entries
const API_BASE_URL = 'https://n9x7n282md.execute-api.us-east-1.amazonaws.com/prod';

class DataService {
  // Get all entries from AWS DynamoDB
  async getAllEntries() {
    try {
      console.log('Fetching entries from AWS API...');
      const response = await fetch(`${API_BASE_URL}/entries`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched entries:', data);
      
      // Sort by creation date (newest first)
      return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error fetching entries:', error);
      throw error;
    }
  }

  // Create new entry in AWS DynamoDB
  async createEntry(entryData) {
    try {
      console.log('Creating entry:', entryData);
      const response = await fetch(`${API_BASE_URL}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newEntry = await response.json();
      console.log('Created entry:', newEntry);
      return newEntry;
    } catch (error) {
      console.error('Error creating entry:', error);
      throw error;
    }
  }

  // Delete entry from AWS DynamoDB
  async deleteEntry(entryId) {
    try {
      console.log('Deleting entry:', entryId);
      const response = await fetch(`${API_BASE_URL}/entries/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Entry deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  }

  // Clear all entries (for testing - calls delete on each entry)
  async clearAllEntries() {
    try {
      const entries = await this.getAllEntries();
      const deletePromises = entries.map(entry => this.deleteEntry(entry.id));
      await Promise.all(deletePromises);
      console.log('All entries cleared');
      return true;
    } catch (error) {
      console.error('Error clearing all entries:', error);
      throw error;
    }
  }

  // === SPIN HISTORY METHODS ===

  // Record a spin in the global spin history
  async recordSpin(spinData) {
    try {
      console.log('Recording spin:', spinData);
      const response = await fetch(`${API_BASE_URL}/spins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId: spinData.entryId,
          entryName: spinData.entryName,
          entryType: spinData.entryType,
          entryWho: spinData.entryWho,
          filter: spinData.filter || 'all',
          weightedMode: spinData.weightedMode || false,
          timestamp: new Date().toISOString(),
          sessionId: this.getSessionId()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const recordedSpin = await response.json();
      console.log('Spin recorded:', recordedSpin);
      return recordedSpin;
    } catch (error) {
      console.error('Error recording spin:', error);
      // Don't throw error - let the spin continue even if recording fails
      return null;
    }
  }

  // Get global spin history with optional filters
  async getSpinHistory(limit = 50, type = null) {
    try {
      let url = `${API_BASE_URL}/spins?limit=${limit}`;
      if (type && type !== 'all') {
        url += `&type=${encodeURIComponent(type)}`;
      }

      console.log('Fetching spin history from AWS API...');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched spin history:', data);

      // Sort by timestamp (newest first)
      return data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error fetching spin history:', error);
      throw error;
    }
  }

  // Get global metrics/statistics
  async getGlobalMetrics() {
    try {
      console.log('Fetching global metrics from AWS API...');
      const response = await fetch(`${API_BASE_URL}/metrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const metrics = await response.json();
      console.log('Fetched global metrics:', metrics);
      return metrics;
    } catch (error) {
      console.error('Error fetching global metrics:', error);
      throw error;
    }
  }

  // Clear all spin history (admin function)
  async clearSpinHistory() {
    try {
      console.log('Clearing spin history...');
      const response = await fetch(`${API_BASE_URL}/spins`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Spin history cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing spin history:', error);
      throw error;
    }
  }

  // Get or create a session ID for tracking
  getSessionId() {
    let sessionId = localStorage.getItem('wheelSessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('wheelSessionId', sessionId);
    }
    return sessionId;
  }
}

// Export a single instance
export const dataService = new DataService();
export default dataService;