// lib/upload.js

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'public/uploads/avatars');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function saveAvatar(file, userId) {
  try {
    // Get file extension
    const ext = path.extname(file.name);
    const filename = `${userId}-${uuidv4()}${ext}`;
    const filepath = path.join(uploadDir, filename);
    
    // Convert buffer to base64 and save
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
    
    // Return the public URL
    return `/uploads/avatars/${filename}`;
  } catch (error) {
    console.error('Error saving avatar:', error);
    throw error;
  }
}

export async function deleteAvatar(avatarUrl) {
  if (!avatarUrl) return;
  
  try {
    const filename = path.basename(avatarUrl);
    const filepath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    console.error('Error deleting avatar:', error);
  }
}