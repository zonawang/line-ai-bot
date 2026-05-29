const express = require('express');
const line = require('@line/bot-sdk');
require('dotenv').config();

// Verify environmental variables are loaded
if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
  console.error('⚠️  [Error] Environment variables LINE_CHANNEL_ACCESS_TOKEN or LINE_CHANNEL_SECRET are not set!');
  console.error('⚠️  Please check if you have copied .env.example to .env and filled in the real tokens.');
}

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'placeholder_token',
  channelSecret: process.env.LINE_CHANNEL_SECRET || 'placeholder_secret',
};

// Create LINE SDK Messaging API Client (V9+ style)
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

const app = express();

// Health check endpoint
app.get('/', (req, res) => {
  res.send('LINE Echo Bot is running! Use POST /webhook for LINE webhook events.');
});

// Register a webhook handler
// Note: line.middleware needs the raw body to verify signature, 
// so do NOT use express.json() middleware BEFORE this route.
app.post('/webhook', line.middleware(config), (req, res) => {
  if (!req.body || !req.body.events) {
    return res.status(400).send('No events found in request body.');
  }

  console.log(`🤖 Received ${req.body.events.length} webhook event(s) from LINE.`);

  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('❌ Error handling events:', err);
      res.status(500).end();
    });
});

// Event handler for incoming LINE events
async function handleEvent(event) {
  // We only care about message events of type 'text'
  if (event.type !== 'message') {
    console.log(`👉 Event ignored: [${event.type}] type event.`);
    return null;
  }

  if (event.message.type !== 'text') {
    console.log(`👉 Message event ignored: Non-text message type [${event.message.type}].`);
    return null;
  }

  const userId = event.source.userId;
  const userMessage = event.message.text;

  console.log(`💬 User (${userId}): "${userMessage}"`);

  // Create response message (echo back the text)
  const echoResponse = {
    type: 'text',
    text: userMessage
  };

  try {
    console.log(`📨 Replying message to user: "${userMessage}"`);
    // Reply using the replyToken
    const replyResult = await client.replyMessage({
      replyToken: event.replyToken,
      messages: [echoResponse]
    });
    console.log('✅ Reply sent successfully.');
    return replyResult;
  } catch (error) {
    console.error('❌ Error replying message:', error);
    throw error;
  }
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 ==========================================`);
  console.log(`🚀 LINE Echo Bot server is listening on port ${PORT}`);
  console.log(`🚀 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`🚀 ==========================================\n`);
});
