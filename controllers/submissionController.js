const { getAllSubmissions } = require("../models/submissionModel");

exports.getSubmissionsPage = async (req, res) => {
  try {
    const submissions = await getAllSubmissions();
    res.render("submissions", { submissions });
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).send("Failed to load submissions");
  }
};
