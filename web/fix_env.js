const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const content = `DATABASE_URL="postgresql://postgres:hisplan123@localhost:5432/hisplan"
GROK_API_KEY="xai-dummy-key"
`;

try {
    fs.writeFileSync(envPath, content, 'utf8');
    console.log('Successfully wrote .env file');
} catch (err) {
    console.error('Error writing .env file:', err);
    process.exit(1);
}
