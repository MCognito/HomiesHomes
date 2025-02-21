// Description: Helper functions for database operations.

const mysql = require("promise-mysql");
const info = require("../config");

// Runs a query on the database.
exports.run_query = async function run_query(query, values) {
  try {
    const connection = await mysql.createConnection(info.config); // Establish connection to database
    let data = await connection.query(query, values); // Await the result of the query
    await connection.end(); // If successful, close the connection
    return data;
    // If there is an error, log it and throw an error
  } catch (error) {
    console.error(error, query, values);
    throw "Database query error";
  }
};
