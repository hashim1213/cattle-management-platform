# Farm Assistant AI Agent Setup Guide

## Overview
The Farm Assistant is an AI-powered agent that helps you manage your cattle farm through natural conversation. It can perform CRUD operations (Create, Read, Update, Delete) on your farm data using voice or text commands.

## Features
The AI agent can help you with:

### 🐄 Cattle Management
- **Add cattle**: "Add an animal", "Add cow #123", "Add Angus bull"
- **Update cattle**: "Update cow #123 weight to 850 lbs"
- **Delete cattle**: "Delete cow #123"
- **Get info**: "Show me cow #123", "What cattle are in pen A?"
- **View all**: "Show me all my cattle"
- **Track weight**: "Record weight for cow #123: 900 lbs"

### 🏠 Pens & Barns
- **Add pen**: "Create a new pen called North Pasture"
- **Update pen**: "Update pen capacity to 100"
- **Delete pen**: "Delete pen A"
- **Get info**: "Show me pen information"
- **View distribution**: "How are my cattle distributed?"

### 💊 Inventory
- **Add medication**: "Add 10 bottles of antibiotics"
- **View inventory**: "Show me my inventory", "What medications do I have?"

### 🏥 Health Records
- **Add treatment**: "Treat cow #123 with penicillin, 5ml"
- **Log activity**: "Log feeding activity for pen A"

### 📊 Reports
- **Farm summary**: "What's happening on my farm?"
- **Issues**: "Any issues I should know about?"

## Setup Instructions

### Step 1: Get Firebase Service Account Key

The agent needs Firebase Admin SDK credentials to access your farm data server-side.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (cattleos)
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Go to the "Service accounts" tab
6. Click "Generate new private key"
7. Click "Generate key" to download the JSON file
8. **Keep this file secure** - it grants full access to your Firebase project

### Step 2: Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your account
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy the key (it starts with `sk-`)

**Important**: Keep this key secure and never commit it to version control!

### Step 3: Configure Environment Variables

1. Create a `.env.local` file in the project root:
   ```bash
   touch .env.local
   ```

2. Add your Firebase service account (paste the entire JSON content as a single line):
   ```env
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"cattleos","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
   ```

3. Add your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-your_actual_api_key_here
   ```

4. Restart your development server:
   ```bash
   npm run dev
   ```

### Step 4: Test the Agent

1. Navigate to the **Farm Assistant** page
2. Try a simple command like:
   - "What's happening on my farm?"
   - "Add an animal"
   - "Show me my inventory"

## How It Works

### Natural Language Processing
The agent uses GPT-4 to understand your commands and convert them into structured actions. It intelligently fills in missing information with smart defaults.

### Smart Defaults
When you don't provide complete information, the agent will:
- Generate auto tag numbers (e.g., AUTO_1234)
- Use "Mixed" or "Unknown" for missing breed/sex
- Set weight to 0 (you can update later)
- Use default capacities and locations
- **Mention what defaults it used** so you can update if needed

### Examples

#### Adding Cattle
```
You: "Add an animal"
Agent: ✓ Added new animal! I assigned tag AUTO_1234 since you didn't specify.
        Set breed to 'Mixed' and weight to 0 - you can update these anytime.
        What tag number would you like to use instead?
```

#### Checking Farm Status
```
You: "What's happening on my farm?"
Agent: You have 25 cattle across 3 pens. Pens are 75% full.
       2 inventory items are low on stock.
```

#### Adding with Details
```
You: "Add Angus bull #567"
Agent: ✓ Added Angus bull #567! Set weight to 0 as default.
        What weight should I record?
```

## Voice Commands

The agent supports voice input:
1. Click the **microphone icon**
2. Speak your command clearly
3. The agent will transcribe and execute

## Troubleshooting

### Error: "Farm Assistant is not configured"
- **Cause**: OpenAI API key is missing
- **Solution**: Follow Step 2 above to add your API key

### Error: "Failed to send message"
- **Cause**: Network issues or API quota exceeded
- **Solution**:
  - Check your internet connection
  - Verify your OpenAI API key is valid
  - Check if you have API credits remaining

### Commands Not Working
- **Cause**: AI might not understand the command format
- **Solution**: Try rephrasing or being more specific
  - ❌ "cow"
  - ✅ "Add an animal"
  - ✅ "Add cow #123"

### No Response
- **Cause**: API timeout or rate limiting
- **Solution**: Wait a moment and try again

## Cost Considerations

The agent uses OpenAI's GPT-4 API, which has costs based on usage:
- Typical cost per request: ~$0.01-0.03
- With farm context, expect slightly higher costs
- Monitor your usage at [OpenAI Platform](https://platform.openai.com/usage)

**Tip**: For testing, consider using a lower-cost model by modifying the code to use `gpt-3.5-turbo` instead of `gpt-4-turbo-preview`.

## Advanced Configuration

### Changing the AI Model
Edit `/app/api/agent/chat/route.ts` around line 318:

```typescript
// Change from:
model: "gpt-4-turbo-preview",

// To (for lower cost):
model: "gpt-3.5-turbo",
```

### Customizing Defaults
Edit the SMART DEFAULTS section in `/app/api/agent/chat/route.ts` around line 15.

## Privacy & Security

- Your OpenAI API key is only used server-side
- Farm data is sent to OpenAI for processing
- All data remains in your Firebase database
- Review [OpenAI's data usage policy](https://openai.com/policies/usage-policies)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check server logs for API errors
3. Verify environment variables are set correctly
4. Ensure Firebase is properly configured

## Best Practices

1. **Be Specific**: "Add Angus bull #567" is better than "add cow"
2. **Use Tag Numbers**: Always include tag numbers when updating/deleting
3. **Review Defaults**: The agent will tell you what defaults it used
4. **Voice Commands**: Speak clearly and include key details
5. **Test First**: Try simple commands before complex operations

Happy farming! 🌾🐄
