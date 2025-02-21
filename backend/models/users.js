const db = require("../helpers/database");

exports.getUserByID = async function getUserByID(id) {
    let query = "SELECT * FROM users WHERE ID = ?";
    let values = [id];
    let data;
    try {
        data = await db.run_query(query, values);
    } catch (err) {
        console.log(err);
    }
    return data;
}