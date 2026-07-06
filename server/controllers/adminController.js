const {
  getOverviewStats,
  getEngagementStats,
  getUserAnalytics,
  getRecentActivity,
} = require("../models/adminModel");

async function getOverview(req, res) {
  try {
    const stats = await getOverviewStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    console.error("Failed to fetch admin overview:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin overview.",
    });
  }
}

async function getEngagement(req, res) {
  try {
    const stats = await getEngagementStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    console.error("Failed to fetch admin engagement:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin engagement.",
    });
  }
}

async function getUsers(req, res) {
  try {
    const users = await getUserAnalytics();

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    console.error("Failed to fetch admin users:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin users.",
    });
  }
}

async function getActivity(req, res) {
  try {
    const activity = await getRecentActivity();

    return res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (err) {
    console.error("Failed to fetch admin activity:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin activity.",
    });
  }
}

module.exports = {
  getOverview,
  getEngagement,
  getUsers,
  getActivity,
};

// // async function getOverview(req, res) {
// //   try {
// //     const stats = await getOverviewStats();

// //     return res.status(200).json({
// //       success: true,
// //       data: stats,
// //     });
// //   } catch (err) {
// //     console.error("Failed to fetch admin overview:", err);

// //     return res.status(500).json({
// //       success: false,
// //       message: "Failed to fetch admin overview.",
// //     });
// //   }
// // }

// // module.exports = {
// //   getOverview,
// // };