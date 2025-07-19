// src/utils/csvService.js

import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import path from 'path';

/**
 * Create a CSV file from supplement status data
 * @param {Array} data - The supplement status data
 * @param {String} filePath - Path where to save the CSV file
 * @returns {Promise<void>}
 */
export const createCsvFile = async (data, filePath) => {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Set up headers for CSV
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'date', title: 'Date' },
        { id: 'time', title: 'Time' },
        { id: 'supplementName', title: 'Supplement Name' },
        { id: 'supplementForm', title: 'Form' },
        { id: 'status', title: 'Status' }
      ]
    });

    // Format the data (capitalize status, etc.)
    const formattedData = data.map(item => ({
      ...item,
      status: capitalizeFirstLetter(item.status)
    }));

    // Write data to CSV file
    await csvWriter.writeRecords(formattedData);
    
    return true;
  } catch (error) {
    console.error('Error creating CSV file:', error);
    throw error;
  }
};

/**
 * Parse CSV file to JSON
 * @param {String} filePath - Path to the CSV file
 * @returns {Promise<Array>} - Parsed data as JSON
 */
export const parseCsvToJson = async (filePath) => {
  // This function could be implemented if needed for future use
  // Using a library like 'csv-parser' would be recommended
  throw new Error('Not implemented yet');
};

/**
 * Helper function to capitalize first letter of a string
 * @param {String} string - Input string
 * @returns {String} - String with first letter capitalized
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}