import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to generate icon
function generateIcon(size) {
  // Create canvas
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Fill background with #08465e (dark blue)
  ctx.fillStyle = '#08465e';
  ctx.fillRect(0, 0, size, size);
  
  // Draw large "M" in white
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.floor(size * 0.7)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', size / 2, size / 2);
  
  // Return buffer
  return canvas.toBuffer('image/png');
}

// Generate and save icons
const sizes = [192, 512];
const iconDir = path.join(__dirname, 'public', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Generate icons for each size
sizes.forEach(size => {
  const iconBuffer = generateIcon(size);
  
  // Save as maskable icon
  fs.writeFileSync(path.join(iconDir, `maskable-${size}.png`), iconBuffer);
  
  // Also save as favicon
  fs.writeFileSync(path.join(iconDir, `favicon-${size}.png`), iconBuffer);
  
  console.log(`Generated ${size}x${size} icon`);
});

console.log('All icons generated successfully!');
