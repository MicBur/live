const fs = require('fs');
const path = require('path');

async function testReceiptUpload() {
    const imagePath = 'C:/Users/micbu/.gemini/antigravity/brain/888d34a4-7324-412d-9b65-29f477428038/dashboard_with_camera_1764403318060.png';

    if (!fs.existsSync(imagePath)) {
        console.error('Test image not found at:', imagePath);
        return;
    }

    const formData = new FormData();
    const fileContent = fs.readFileSync(imagePath);
    const blob = new Blob([fileContent], { type: 'image/png' });
    formData.append('file', blob, 'test_receipt.png');

    try {
        console.log('Sending request to http://localhost:3000/api/analyze-receipt...');
        const response = await fetch('http://localhost:3000/api/analyze-receipt', {
            method: 'POST',
            body: formData
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text.substring(0, 3000)); // Print first 3000 chars
    } catch (error) {
        console.error('Error:', error);
    }
}

testReceiptUpload();
