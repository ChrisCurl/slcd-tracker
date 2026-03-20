import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Setup Google Sheets API
const auth = new google.auth.GoogleAuth({
    keyFilename: './credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

// GET all reservations (for dashboard)
app.get('/api/reservations', async (req: Request, res: Response) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: 'Sheet1!A:H', // Read all columns A through H
        });

        const rows = response.data.values || [];
        const headers = rows[0]; // First row is headers
        const data = rows.slice(1); // Rest is data

        // Convert to array of objects
        const reservations = data.map((row: string[], idx: number) => ({
            id: idx + 1,
            name: row[1],
            email: row[2],
            date: row[3],
            numKids: row[4],
            phone: row[5],
            timestamp: row[6],
            status: row[7],
        }));

        res.json(reservations);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ error: 'Failed to fetch reservations' });
    }
});
// POST new reservation
app.post('/api/reservations', async (req, res) => {
    try {
        const { name, email, date, numKids, phone } = req.body;

        // Validation
        if (!name || !email || !date || !numKids) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Parse numKids as integer
        const kidCount = parseInt(numKids, 10);
        if (isNaN(kidCount) || kidCount < 1) {
            return res.status(400).json({ error: 'Invalid number of kids' });
        }

        // CHECK CAPACITY: Get all existing reservations for this date
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: 'Sheet1!A:H',
        });

        const rows = response.data.values || [];
        const data = rows.slice(1); // Skip header row

        // Count total kids already reserved for this date
        const totalKidsOnDate = data
            .filter((row) => row[3] === date) // row[3] is the date column
            .reduce((sum, row) => sum + parseInt(row[4] || 0, 10), 0); // row[4] is numKids

        const spotsLeft = 6 - totalKidsOnDate;

        // Check if this reservation would exceed capacity
        if (kidCount > spotsLeft) {
            return res.status(400).json({
                error: `Not enough spots for ${date}. Only ${spotsLeft} spot(s) left.`,
                spotsLeft,
                requestedKids: kidCount,
            });
        }

        // Instead of append, find the next empty row and write there
        const allRows = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: 'Sheet1!A:H',
        });

        const nextRow = (allRows.data.values?.length || 1) + 1;

        // If we get here, capacity is OK. Add the reservation.
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `Sheet1!A${nextRow}:H${nextRow}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [
                    [
                        Math.random().toString(36).substr(2, 9), // Simple ID
                        name,
                        email,
                        date,
                        kidCount,
                        phone || '',
                        new Date().toISOString(),
                        'confirmed',
                    ],
                ],
            },
        });

        res.status(201).json({
            success: true,
            message: 'Reservation confirmed!',
            spotsLeftAfter: spotsLeft - kidCount,
        });
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({ error: 'Failed to create reservation' });
    }
});

// DELETE a reservation by row number
app.delete('/api/reservations/:rowNumber', async (req, res) => {
    try {
        const rowNumber = parseInt(req.params.rowNumber, 10);

        if (isNaN(rowNumber) || rowNumber < 2) {
            return res.status(400).json({ error: 'Invalid row number' });
        }

        // Fetch the row to validate it exists and has data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `Sheet1!A${rowNumber}:H${rowNumber}`,
        });

        const row = response.data.values?.[0];

        if (!row || row.length === 0) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        // Null check: ensure the reservation has required fields
        const [id, name, email, date] = row;
        if (!id || !name || !email || !date) {
            return res.status(400).json({ error: 'Invalid reservation data' });
        }

        // Business logic: don't allow deleting past events
        const eventDate = new Date(date);
        const now = new Date();
        if (eventDate < now) {
            return res.status(400).json({
                error: `Cannot delete past events. Event date: ${date}`,
            });
        }

        // Clear the row (set all cells to empty)
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SHEET_ID,
            range: `Sheet1!A${rowNumber}:H${rowNumber}`,
        });

        res.json({
            success: true,
            message: `Reservation for ${name} (${date}) has been cancelled`,
            rowNumber,
        });
    } catch (error) {
        console.error('Error deleting reservation:', error);
        res.status(500).json({ error: 'Failed to delete reservation' });
    }
});

// GET available spots for a specific date
app.get('/api/spots/:date', async (req, res) => {
    try {
        const { date } = req.params;

        if (!date) {
            return res.status(400).json({ error: 'Date parameter required' });
        }

        // Fetch all reservations
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: 'Sheet1!A:H',
        });

        const rows = response.data.values || [];
        const data = rows.slice(1); // Skip header

        // Count kids for this specific date
        const totalKidsOnDate = data
            .filter((row) => row[3] === date && row[3]) // row[3] is date, filter out empty rows
            .reduce((sum, row) => sum + parseInt(row[4] || 0, 10), 0); // row[4] is numKids

        const spotsLeft = Math.max(0, 6 - totalKidsOnDate);
        const isFull = spotsLeft === 0;

        res.json({
            date,
            totalKidsBooked: totalKidsOnDate,
            spotsLeft,
            isFull,
            maxCapacity: 6,
        });
    } catch (error) {
        console.error('Error checking spots:', error);
        res.status(500).json({ error: 'Failed to check available spots' });
    }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});