
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const Joi = require("joi");

dotenv.config();
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Joi schema for validation
const payoutSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    "number.base": `"amount" must be a number`,
    "number.positive": `"amount" must be a positive value`,
    "any.required": `"amount" is required`,
  }),
  customerName: Joi.string().required().messages({
    "string.base": `"customerName" must be a string`,
    "string.min": `"customerName" must be at least 3 characters`,
    "any.required": `"customerName" is required`,
  }),
  customerPhoneNumber: Joi.string()
    .pattern(/^\d{10}$/)
    .required()
    .messages({
      "string.pattern.base": `"customerPhoneNumber" must be a 10-digit number`,
      "any.required": `"customerPhoneNumber" is required`,
    }),
  customerEmail: Joi.string().email().required().messages({
    "string.email": `"customerEmail" must be a valid email`,
    "any.required": `"customerEmail" is required`,
  }),
  transactionType: Joi.string().valid("NEFT", "IMPS", "RTGS","UPI",).required().messages({
    "any.only": `"transactionType" must be one of [NEFT, IMPS, RTGS,UPI]`,
    "any.required": `"transactionType" is required`,
  }),
  destinationBank: Joi.string().required().messages({
    "any.required": `"destinationBank" is required`,
  }),
  accountNumber: Joi.string().pattern(/^\d+$/).required().messages({
    "string.pattern.base": `"accountNumber" must be a numeric value`,
    "any.required": `"accountNumber" is required`,
  }),
  beneficiaryLocation: Joi.string().required().messages({
    "any.required": `"beneficiaryLocation" is required`,
  }),
  ifsc: Joi.string().required().messages({
    "any.required": `"ifsc" is required`,
  }),
  merchantID: Joi.string().required().messages({
    "any.required": `"merchantID" is required`,
  }),
  affiliateID: Joi.string().required().messages({
    "any.required": `"affiliateID" is required`,
  }),
  reference: Joi.string().alphanum().required().messages({
    "string.alphanum": `"reference" must be alphanumeric`,
    "any.required": `"reference" is required`,
  }),
});

// Payout API route
app.post("/api/v1/payouts/initiate", async (req, res) => {
  // Validate request body
  const { error, value } = payoutSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      status: false,
      error: "Validation error",
      details: error.details.map((detail) => detail.message),
    });
  }

  try {
    // Call the external API with headers
    const response = await axios.post(
      "https://prod-server.flipopay.com/api/v1/payouts/initiate",
      value,
      {
        headers: {
          "X-Secret-Key": process.env.FLIPOPAY_SECRET_KEY,
        },
      }
    );

  
    res.status(200).json({
      status: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Error calling payout API:", error.message);
    res.status(error.response?.status || 500).json({
      status: false,
      error: error.response?.data || "An error occurred while initiating the payout.",
    });
  }
});


app.post('/webhook/flipopay', (req, res) => {
  try {
      const webhookData = req.body;
      // Log the received data (For Debugging)
      console.log('Webhook data received:', webhookData);
      // Process the webhook data
      if (!crn) {
          console.error('Invalid webhook payload: missing crn');
          return res.status(400).send({ message: 'Bad Request: Missing crn' });
      }
      res.status(200).send({ message: 'Webhook processed successfully' });

  } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send({ message: 'Internal Server Error' });
  }
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    status: false,
    error: "API URL not found",
    message: `The requested URL ${req.originalUrl} was not found on this server.`,
  });
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`A Node.js API is listening on port: ${PORT}`);
});
