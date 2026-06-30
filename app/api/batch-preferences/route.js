// app/api/batch-preferences/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/batch-preferences - Fetch all batch preferences
export async function GET(request) {
  try {
    // Since you might not have a BatchPreference model, we'll store preferences in a simple way
    // You can create a BatchPreference model or use localStorage
    // For now, returning empty array
    return NextResponse.json({ batchPreferences: [] });
  } catch (error) {
    console.error('Error fetching batch preferences:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// POST /api/batch-preferences - Save batch preference
export async function POST(request) {
  try {
    const body = await request.json();
    // Store preference - you might want to save this in a database table
    // For now, just acknowledge receipt
    return NextResponse.json({ 
      message: 'Preference saved',
      preference: body 
    });
  } catch (error) {
    console.error('Error saving batch preference:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save preference' },
      { status: 500 }
    );
  }
}