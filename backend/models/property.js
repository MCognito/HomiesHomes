const db = require("../helpers/database");

// Get house by the houseID
exports.getById = async function getById(id) {
  let query = "SELECT * FROM property WHERE ID = ?";
  let values = [id];
  let data = await db.run_query(query, values);
  return data;
};

// Get all houses
exports.getAll = async function getAll() {
  let query = "SELECT * FROM property;";
  let data = await db.run_query(query);
  return data;
};

// Create a new house that is available
exports.addProperty = async function addProperty(property) {
  let query = "INSERT INTO property SET ?";
  let data = await db.run_query(query, property);
  return data;
};

exports.updateProperty = async function updateProperty(id, property) {
  let query = "UPDATE property SET ? WHERE ID = ?";
  let values = [property, id];
  let data = await db.run_query(query, values);
  return data;
};

exports.deleteProperty = async function deleteProperty(id) {
  let query = "DELETE FROM property WHERE ID = ?";
  let values = [id];
  let data = await db.run_query(query, values);
  return data;
};
