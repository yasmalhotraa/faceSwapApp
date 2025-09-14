// controllers/submissionController.js
const {
  getAllSubmissions,
  getSubmissionsByUser,
} = require("../models/submissionModel");

// Get all submissions (admin view)
const getSubmissionsPage = async (req, res) => {
  try {
    const submissions = await getAllSubmissions();
    res.render("submissions", { submissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res
      .status(500)
      .render("submissions", {
        submissions: [],
        error: "Failed to load submissions",
      });
  }
};

// Show the "My Submissions" search page
const getMySubmissionsPage = (req, res) => {
  res.render("my-submissions", {
    submissions: null,
    searched: false,
    searchTerm: "",
    error: null,
  });
};

// Handle "My Submissions" search
const searchMySubmissions = async (req, res) => {
  try {
    const { searchTerm } = req.body;

    if (!searchTerm || !searchTerm.trim()) {
      return res.render("my-submissions", {
        submissions: null,
        searched: true,
        searchTerm: "",
        error: "Please enter your email or phone number",
      });
    }

    const submissions = await getSubmissionsByUser(searchTerm.trim());

    res.render("my-submissions", {
      submissions,
      searched: true,
      searchTerm: searchTerm.trim(),
      error: null,
    });
  } catch (error) {
    console.error("Error searching submissions:", error);
    res.render("my-submissions", {
      submissions: null,
      searched: true,
      searchTerm: req.body.searchTerm || "",
      error: "Failed to search submissions",
    });
  }
};

module.exports = {
  getSubmissionsPage,
  getMySubmissionsPage,
  searchMySubmissions,
};
