const express = require("express");

const { authenticate } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/adminMiddleware");

const {
  getOverview,
  getEngagement,
  getUsers,
  getActivity,
} = require("../controllers/adminController");

const router = express.Router();

router.get(
  "/test",
  authenticate,
  requireAdmin,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access confirmed",
      data: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
    });
  }
);

router.get(
  "/overview",
  authenticate,
  requireAdmin,
  getOverview
);

router.get(
  "/engagement",
  authenticate,
  requireAdmin,
  getEngagement
);

router.get(
  "/users",
  authenticate,
  requireAdmin,
  getUsers
);

router.get(
  "/activity",
  authenticate,
  requireAdmin,
  getActivity
);

module.exports = router;
// const express = require("express");

// const { authenticate } = require("../middleware/authMiddleware");
// const { requireAdmin } = require("../middleware/adminMiddleware");

// const {
//   getOverview,
//   getEngagement,
//   getUsers,
// } = require("../controllers/adminController");

// const router = express.Router();

// router.get(
//   "/test",
//   authenticate,
//   requireAdmin,
//   (req, res) => {
//     res.status(200).json({
//       success: true,
//       message: "Admin access confirmed",
//       data: {
//         id: req.user.id,
//         email: req.user.email,
//         role: req.user.role,
//       },
//     });
//   }
// );

// router.get(
//   "/overview",
//   authenticate,
//   requireAdmin,
//   getOverview
// );

// router.get(
//   "/engagement",
//   authenticate,
//   requireAdmin,
//   getEngagement
// );

// router.get(
//   "/users",
//   authenticate,
//   requireAdmin,
//   getUsers
// );

// module.exports = router;