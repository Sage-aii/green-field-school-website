// This is your Netlify Function file: netlify/functions/submit-contact.js

// Import the SendGrid Node.js library.
// Netlify Functions will automatically install this dependency if you declare it in a package.json.
// We'll address package.json setup right after this.
const sgMail = require('@sendgrid/mail');

// Set the SendGrid API key from environment variables.
// This is secure because Netlify injects it at build time, not exposing it to the frontend.
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Define the handler for the Netlify Function.
// It receives an 'event' object (containing request details) and a 'context' object.
exports.handler = async (event, context) => {
  // Only allow POST requests. If not POST, return a 405 Method Not Allowed error.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' }, // Tell the client which methods are allowed
    };
  }

  // Parse the incoming request body.
  // Netlify Functions can parse various body types, but for form submissions, it's usually JSON.
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    // If the body is not valid JSON, return a 400 Bad Request error.
    console.error('JSON parsing error:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Bad Request - Invalid JSON' }),
    };
  }

  // Extract form fields from the parsed data.
  // Add more validation here if needed (e.g., check for empty fields).
  const { name, email, subject, message } = data;

  // Basic validation to ensure required fields are present.
  if (!name || !email || !subject || !message) {
    return {
      statusCode: 422, // 422 Unprocessable Entity often used for validation errors
      body: JSON.stringify({ message: 'Missing required fields (Name, Email, Subject, Message)' }),
    };
  }

  // Define the email content using SendGrid's mail object structure.
  const msg = {
    to: process.env.CONTACT_EMAIL_TO,   // Recipient email address (from Netlify ENV)
    from: process.env.CONTACT_EMAIL_FROM, // Verified sender email address (from Netlify ENV)
    replyTo: email, // Set reply-to to the user's email
    subject: `Contact Form: ${subject} from ${name}`, // Email subject
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`, // Plain text content
    html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `, // HTML content (replaces newlines with <br> for readability)
  };

  try {
    // Send the email using SendGrid.
    await sgMail.send(msg);

    // If the email sends successfully, return a 200 OK response.
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Message sent successfully!' }),
    };
  } catch (error) {
    // If there's an error sending the email, log it and return a 500 Internal Server Error.
    console.error('SendGrid email error:', error);
    // You might want to return a more generic error message to the user for security.
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to send message. Please try again later.' }),
      // Optionally, you can include more specific error details during development:
      // body: JSON.stringify({ message: 'Failed to send message', details: error.response.body }),
    };
  }
};