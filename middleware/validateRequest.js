function validateRequest(req, res, next) {
  const userText = req.body.text;

  if (!userText || typeof userText !== "string") {
    return res.status(400).json({
      error: "Invalid request: text input is required"
    });
  }

  next();
}

module.exports = validateRequest;