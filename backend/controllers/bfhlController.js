
const { processData } = require('../services/graphService');
const config = require('../config');


function handlePost(req, res) {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        error: 'Missing required field: "data"'
      });
    }

    if (!Array.isArray(data)) {
      return res.status(400).json({
        error: '"data" must be an array of strings'
      });
    }


    const result = processData(data);


    return res.json({
      user_id: config.USER_ID,
      email_id: config.EMAIL_ID,
      college_roll_number: config.COLLEGE_ROLL_NUMBER,
      hierarchies: result.hierarchies,
      invalid_entries: result.invalid_entries,
      duplicate_edges: result.duplicate_edges,
      summary: result.summary
    });
  } catch (err) {
    console.error('Error processing /bfhl:', err);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}

module.exports = { handlePost };
