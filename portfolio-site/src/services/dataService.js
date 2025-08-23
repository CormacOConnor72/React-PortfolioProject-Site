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
}

// Export a single instance
export const dataService = new DataService();
export default dataService;