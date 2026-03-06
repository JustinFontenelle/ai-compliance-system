const express = require("express");
const router = express.Router();
const validateRequest = require("../middleware/validateRequest");
const processChecklist = require("../services/aiProcessing");

router.post("/generate", validateRequest, async (req, res) => {
const result = await processChecklist(req.body.text);
res.json({ result });
});

module.exports = router;