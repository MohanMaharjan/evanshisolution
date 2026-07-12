// app/api/terminal-config/route.js

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Adjust this import based on your project structure

// GET - Fetch terminal configuration for a batch
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    // Validate batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: parseInt(batchId) },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Fetch terminal config
    let config = await prisma.terminalConfig.findUnique({
      where: { batchId: parseInt(batchId) },
    });

    // Parse the termWeeks JSON string to array
    if (config && config.termWeeks) {
      try {
        config = {
          ...config,
          termWeeks: JSON.parse(config.termWeeks),
        };
      } catch (parseError) {
        console.error('Error parsing termWeeks:', parseError);
        config.termWeeks = [7, 12]; // Default fallback
      }
    }

    return NextResponse.json({
      success: true,
      config: config || null,
    });
  } catch (error) {
    console.error('Error fetching terminal config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch terminal configuration' },
      { status: 500 }
    );
  }
}

// POST - Create or update terminal configuration
export async function POST(request) {
  try {
    const body = await request.json();
    const { batchId, termCount, termWeeks, examDays, semesterDuration } = body;

    // Validation
    if (!batchId) {
      return NextResponse.json(
        { success: false, error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    // Validate batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: parseInt(batchId) },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!termCount || termCount < 1 || termCount > 4) {
      return NextResponse.json(
        { success: false, error: 'Term count must be between 1 and 4' },
        { status: 400 }
      );
    }

    if (!termWeeks || !Array.isArray(termWeeks) || termWeeks.length !== termCount) {
      return NextResponse.json(
        { success: false, error: 'Term weeks array must match term count' },
        { status: 400 }
      );
    }

    if (!examDays || examDays < 1 || examDays > 10) {
      return NextResponse.json(
        { success: false, error: 'Exam days must be between 1 and 10' },
        { status: 400 }
      );
    }

    if (!semesterDuration || semesterDuration < 8 || semesterDuration > 24) {
      return NextResponse.json(
        { success: false, error: 'Semester duration must be between 8 and 24 weeks' },
        { status: 400 }
      );
    }

    // Validate that term weeks don't exceed semester duration
    const maxTermWeek = Math.max(...termWeeks);
    const minTermWeek = Math.min(...termWeeks);
    
    if (maxTermWeek >= semesterDuration) {
      return NextResponse.json(
        { success: false, error: `Term weeks cannot exceed semester duration (${semesterDuration} weeks)` },
        { status: 400 }
      );
    }

    if (minTermWeek < 1) {
      return NextResponse.json(
        { success: false, error: 'Term weeks must be at least 1' },
        { status: 400 }
      );
    }

    // Validate that term weeks are in ascending order and have minimum gap
    for (let i = 1; i < termWeeks.length; i++) {
      if (termWeeks[i] <= termWeeks[i - 1]) {
        return NextResponse.json(
          { success: false, error: 'Term weeks must be in ascending order' },
          { status: 400 }
        );
      }
      
      // Optional: Ensure minimum gap of 2 weeks between terms
      if (termWeeks[i] - termWeeks[i - 1] < 2) {
        return NextResponse.json(
          { success: false, error: 'Minimum 2 weeks gap required between terms' },
          { status: 400 }
        );
      }
    }

    // Convert termWeeks array to JSON string for storage
    const termWeeksJson = JSON.stringify(termWeeks);

    // Upsert the configuration
    const config = await prisma.terminalConfig.upsert({
      where: {
        batchId: parseInt(batchId),
      },
      update: {
        termCount,
        termWeeks: termWeeksJson,
        examDays,
        semesterDuration,
        updatedAt: new Date(),
      },
      create: {
        batchId: parseInt(batchId),
        termCount,
        termWeeks: termWeeksJson,
        examDays,
        semesterDuration,
      },
    });

    // Parse the stored JSON for response
    const responseConfig = {
      ...config,
      termWeeks: JSON.parse(config.termWeeks),
    };

    return NextResponse.json({
      success: true,
      message: 'Terminal configuration saved successfully',
      config: responseConfig,
    });
  } catch (error) {
    console.error('Error saving terminal config:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Configuration already exists for this batch' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to save terminal configuration' },
      { status: 500 }
    );
  }
}

// PUT - Update specific fields (alternative to POST)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { batchId, ...updateData } = body;

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    // Check if config exists
    const existingConfig = await prisma.terminalConfig.findUnique({
      where: { batchId: parseInt(batchId) },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { success: false, error: 'Configuration not found. Use POST to create.' },
        { status: 404 }
      );
    }

    // Validate update data
    if (updateData.termWeeks) {
      updateData.termWeeks = JSON.stringify(updateData.termWeeks);
    }

    const config = await prisma.terminalConfig.update({
      where: { batchId: parseInt(batchId) },
      data: updateData,
    });

    // Parse termWeeks for response
    const responseConfig = {
      ...config,
      termWeeks: JSON.parse(config.termWeeks),
    };

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      config: responseConfig,
    });
  } catch (error) {
    console.error('Error updating terminal config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update terminal configuration' },
      { status: 500 }
    );
  }
}

// DELETE - Remove terminal configuration
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    // Check if config exists
    const existingConfig = await prisma.terminalConfig.findUnique({
      where: { batchId: parseInt(batchId) },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { success: false, error: 'Configuration not found' },
        { status: 404 }
      );
    }

    await prisma.terminalConfig.delete({
      where: { batchId: parseInt(batchId) },
    });

    return NextResponse.json({
      success: true,
      message: 'Terminal configuration deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting terminal config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete terminal configuration' },
      { status: 500 }
    );
  }
}