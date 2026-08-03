require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

// Models
const User = require('./models/User');
const Institute = require('./models/Institute');
const Lead = require('./models/Lead');
const Interaction = require('./models/Interaction');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatbot_dashboard';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied, missing token' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// --- Routes ---

// 1. Authentication Route (Login)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user._id, role: user.role, instituteId: user.instituteId, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, role: user.role, instituteId: user.instituteId, username: user.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Ingestion Route (For Chatbots to post logs)
app.post('/api/logs', async (req, res) => {
    try {
        const { institute_id, api_key, sessionId, events } = req.body;

        if (!institute_id || !api_key || !sessionId || !events) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify Institute
        const institute = await Institute.findOne({ instituteId: institute_id, apiKey: api_key, status: 'active' });
        if (!institute) return res.status(401).json({ error: 'Unauthorized institute' });

        const leadDocs = [];
        const interactionDocs = [];

        for (let e of events) {
            const eventType = e.eventType || 'unknown';
            const metaData = e.data || {};

            // Auto-detect leads (email/phone)
            let isLead = (eventType === 'form_submit');
            let textToScan = JSON.stringify(metaData);

            const emailMatch = textToScan.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            const phoneMatch = textToScan.match(/[0-9]{10}/);

            if (emailMatch || phoneMatch) isLead = true;

            if (isLead) {
                let leadPayload = metaData.leadData || metaData;
                if (!leadPayload.email && emailMatch) leadPayload.email = emailMatch[0];
                if (!leadPayload.phone && phoneMatch) leadPayload.phone = phoneMatch[0];
                if (!leadPayload.name) {
                    const nameMatch = textToScan.match(/(?:Name|Full Name)[\:\s]+([a-zA-Z\s]+)(?:Phone|Email|$)/i);
                    leadPayload.name = nameMatch ? nameMatch[1].trim() : 'Chat Visitor';
                }

                leadDocs.push({
                    instituteId: institute_id,
                    sessionId: sessionId,
                    leadData: leadPayload
                });
            }

            // Format interaction
            let interactionId = eventType;
            if (eventType === 'message') {
                interactionId = metaData.intent || 'unknown';
            } else if (['click', 'hover', 'copy', 'dwell', 'scroll'].includes(eventType)) {
                interactionId = `${eventType}:${metaData.elementId || ''}`;
            }

            let queryText = metaData.elementText || metaData.query || '';
            if (!queryText) {
                if (eventType === 'heartbeat') queryText = `User active on page (Dwell: ${metaData.dwellTimeSeconds || 0}s)`;
                else if (eventType === 'page_load') queryText = 'Opened Chatbot';
                else queryText = eventType;
            }

            interactionDocs.push({
                instituteId: institute_id,
                sessionId: sessionId,
                eventType: eventType,
                interactionId: interactionId,
                queryText: queryText,
                metaData: metaData
            });
        }

        if (leadDocs.length > 0) await Lead.insertMany(leadDocs);
        if (interactionDocs.length > 0) await Interaction.insertMany(interactionDocs);

        res.json({ success: true, message: 'Logs processed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Dashboard Data Routes (Protected)
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const { role, instituteId } = req.user;
        const query = role === 'super_admin' ? {} : { instituteId };

        const totalLeads = await Lead.countDocuments(query);
        const totalInteractions = await Interaction.countDocuments(query);
        const activeInstitutes = role === 'super_admin' ? await Institute.countDocuments({ status: 'active' }) : 1;

        res.json({ leads: totalLeads, interactions: totalInteractions, institutes: activeInstitutes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboard/interactions - Returns raw interaction logs for advanced analytics UI
app.get('/api/dashboard/interactions', authenticateToken, async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'institute_admin') {
            filter.instituteId = req.user.instituteId;
        }

        const interactions = await Interaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(1000)
            .lean();

        // Map Interaction documents to the expected dashboard format
        const formattedLogs = interactions.map(log => {
            const data = log.metaData || {};
            return {
                s: log.sessionId,
                t: log.eventType || 'interaction',
                i: log.interactionId || 'unknown',
                d: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString(),
                q: log.queryText || '',
                m: log.metaData || {},
                ...data
            };
        });

        res.json(formattedLogs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/dashboard/leads', authenticateToken, async (req, res) => {
    try {
        const { role, instituteId } = req.user;
        const query = role === 'super_admin' ? {} : { instituteId };

        const leads = await Lead.find(query).sort({ createdAt: -1 }).limit(50).lean();
        
        // Map to match the frontend expected format
        const formattedLeads = leads.map(l => ({
            sessionId: l.sessionId,
            timestamp: l.createdAt,
            data: l.leadData
        }));
        
        res.json(formattedLeads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Seed Endpoint (For initial setup only, to be removed in production)
app.post('/api/setup', async (req, res) => {
    try {
        const institutes = [
            { id: 'rvcn', name: 'RV College of Nursing', key: 'rvcn_key_12345' },
            { id: 'rvce', name: 'RV College of Engineering', key: 'rvce_key_12345' }
        ];

        // Create Institutes
        for (const inst of institutes) {
            const exists = await Institute.findOne({ instituteId: inst.id });
            if (!exists) {
                await Institute.create({ instituteId: inst.id, name: inst.name, apiKey: inst.key });
            }
        }

        // Create Super Admin (Master)
        const adminExists = await User.findOne({ username: 'superadmin' });
        if (!adminExists) {
            const hash = await bcrypt.hash('admin123', 10);
            await User.create({ username: 'superadmin', passwordHash: hash, role: 'super_admin' });
        }

        // Create Institute Admins
        for (const inst of institutes) {
            const username = inst.id + 'admin';
            const password = inst.id + '123';
            const exists = await User.findOne({ username });
            if (!exists) {
                const hash = await bcrypt.hash(password, 10);
                await User.create({ username, passwordHash: hash, role: 'institute_admin', instituteId: inst.id });
            }
        }

        res.json({ message: 'Seed data generated successfully for all 5 institutes.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend routing for SPA
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server (ignored by Vercel, used for localhost)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

// Required for Vercel serverless deployment
module.exports = app;
