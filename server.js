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
// Lead and Interaction are dynamically loaded per tenant to separate databases
const { getTenantModel } = require('./utils/tenantDb');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatbot_dashboard';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serverless / Atlas Database Connection Middleware
const DEFAULT_ATLAS_URI = 'mongodb://hemanthbvrsst_db_user:rvceChatbot123@ac-ybdlrhg-shard-00-00.gmvea1j.mongodb.net:27017,ac-ybdlrhg-shard-00-01.gmvea1j.mongodb.net:27017,ac-ybdlrhg-shard-00-02.gmvea1j.mongodb.net:27017/rvcn_chatbot?ssl=true&replicaSet=atlas-b9tzmm-shard-0&authSource=admin&appName=ChatbotDashboard';
const DB_URI = process.env.MONGO_URI || DEFAULT_ATLAS_URI;

let isConnecting = false;
async function connectToDatabase(req, res, next) {
    if (mongoose.connection.readyState === 1) {
        return next();
    }
    try {
        if (!isConnecting) {
            isConnecting = true;
            await mongoose.connect(DB_URI, {
                serverSelectionTimeoutMS: 8000,
                connectTimeoutMS: 8000
            });
            console.log('Successfully connected to MongoDB Atlas');
            isConnecting = false;
        } else {
            let attempts = 0;
            while (mongoose.connection.readyState !== 1 && attempts < 20) {
                await new Promise(r => setTimeout(r, 200));
                attempts++;
            }
        }
        next();
    } catch (err) {
        isConnecting = false;
        console.error('MongoDB Atlas Connection Error:', err.message);
        return res.status(500).json({ error: 'Database connection failed: ' + err.message });
    }
}
app.use(connectToDatabase);

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

// Database Seeder / Setup Route
app.post('/api/setup', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);

        // 1. Super Admin (Global Access to All Institutes)
        const superAdminHash = await bcrypt.hash('admin123', salt);
        await User.findOneAndUpdate(
            { username: 'admin' },
            { username: 'admin', passwordHash: superAdminHash, role: 'super_admin', instituteId: null },
            { upsert: true, new: true }
        );

        // 2. RVGHS Institute Admin (RVGHS Only Access)
        const rvghsHash = await bcrypt.hash('rvghs123', salt);
        await User.findOneAndUpdate(
            { username: 'rvghs_admin' },
            { username: 'rvghs_admin', passwordHash: rvghsHash, role: 'institute_admin', instituteId: 'rvghs' },
            { upsert: true, new: true }
        );

        // 3. RVCN Institute Admin (RVCN Only Access)
        const rvcnHash = await bcrypt.hash('rvcn123', salt);
        await User.findOneAndUpdate(
            { username: 'rvcn_admin' },
            { username: 'rvcn_admin', passwordHash: rvcnHash, role: 'institute_admin', instituteId: 'rvcn' },
            { upsert: true, new: true }
        );

        // 4. Ensure Institutes Exist
        await Institute.findOneAndUpdate(
            { instituteId: 'rvghs' },
            { instituteId: 'rvghs', name: 'RV Girls High School', apiKey: 'rvghs_key_12345', status: 'active' },
            { upsert: true }
        );
        await Institute.findOneAndUpdate(
            { instituteId: 'rvcn' },
            { instituteId: 'rvcn', name: 'RV College of Nursing', apiKey: 'rvcn_key_12345', status: 'active' },
            { upsert: true }
        );

        res.json({
            ok: true,
            message: 'Database seeded successfully! You can now log in.',
            accounts: [
                { username: 'admin', password: 'admin123', role: 'Super Admin (All Institutes)' },
                { username: 'rvghs_admin', password: 'rvghs123', role: 'RVGHS Institute Admin' },
                { username: 'rvcn_admin', password: 'rvcn123', role: 'RVCN Institute Admin' }
            ]
        });
    } catch (err) {
        console.error('Setup error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 2. Ingestion Route (For Chatbots to post logs)
app.post('/api/logs', async (req, res) => {
    try {
        const body = req.body || {};
        const institute_id = body.institute_id || body.instituteId || 'rvghs';
        const api_key = body.api_key || body.apiKey || 'rvghs_key_12345';
        const sessionId = body.sessionId || body.s || 'sid_anon';
        const events = body.events || body.logs || (body.q ? [body] : []);

        if (!events || events.length === 0) {
            return res.status(200).json({ success: true, count: 0, message: 'No events provided' });
        }

        // Verify or Auto-Provision Institute
        let institute = await Institute.findOne({ instituteId: institute_id });
        if (!institute) {
            try {
                institute = await Institute.create({
                    instituteId: institute_id,
                    name: institute_id.toUpperCase(),
                    apiKey: api_key,
                    status: 'active',
                    createdAt: new Date()
                });
            } catch(e) {
                // In case of parallel creation
                institute = await Institute.findOne({ instituteId: institute_id });
            }
        }

        const leadDocs = [];
        const interactionDocs = [];

        for (let e of events) {
            const eventType = e.eventType || e.t || 'message';
            const metaData = e.data || e.m || {};

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
                    leadData: leadPayload,
                    createdAt: new Date(e.timestamp || e.d || Date.now())
                });
            }

            // Format interaction
            let interactionId = eventType;
            if (eventType === 'message') {
                interactionId = metaData.intent || e.i || 'unknown';
            } else if (['click', 'hover', 'copy', 'dwell', 'scroll'].includes(eventType)) {
                interactionId = `${eventType}:${metaData.elementId || e.i || ''}`;
            }

            let queryText = metaData.elementText || metaData.query || e.q || '';
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
                metaData: metaData,
                createdAt: new Date(e.timestamp || e.d || Date.now())
            });
        }

        if (leadDocs.length > 0) {
            const TenantLead = getTenantModel(institute_id, 'Lead');
            await TenantLead.insertMany(leadDocs, { ordered: false });
        }
        if (interactionDocs.length > 0) {
            const TenantInteraction = getTenantModel(institute_id, 'Interaction');
            await TenantInteraction.insertMany(interactionDocs, { ordered: false });
        }

        res.json({ success: true, ok: true, message: 'Logs processed successfully', count: interactionDocs.length });
    } catch (err) {
        console.error('Error saving logs:', err.message);
        res.status(500).json({ error: err.message, ok: false });
    }
});

// GET /api/logs - Public endpoint for frontend dashboards to query interactions & leads
app.get('/api/logs', async (req, res) => {
    try {
        const instituteId = req.query.instituteId || req.query.institute_id || 'rvghs';
        const TenantInteraction = getTenantModel(instituteId, 'Interaction');
        const limit = Math.min(parseInt(req.query.limit) || 5000, 10000);

        const interactions = await TenantInteraction.find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        const logs = interactions.map(log => {
            const data = log.metaData || {};
            return {
                _id: log._id,
                id: log._id,
                s: log.sessionId,
                sessionId: log.sessionId,
                t: log.eventType || 'message',
                eventType: log.eventType || 'message',
                i: log.interactionId || 'unknown',
                intent: log.interactionId || 'unknown',
                d: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString(),
                timestamp: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString(),
                createdAt: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString(),
                q: log.queryText || '',
                query: log.queryText || '',
                m: log.metaData || {},
                data: log.metaData || {},
                instituteId: log.instituteId || instituteId,
                ...data
            };
        });

        res.json({ ok: true, success: true, count: logs.length, logs: logs });
    } catch (err) {
        console.error('Error fetching logs:', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.post('/api/logs/batch', async (req, res) => {
    return app._router.handle({ ...req, url: '/api/logs', method: 'POST' }, res);
});

// 3. Dashboard Data Routes (Protected)
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const { role, instituteId } = req.user;
        let totalLeads = 0;
        let totalInteractions = 0;
        const activeInstitutes = role === 'super_admin' ? await Institute.countDocuments({ status: 'active' }) : 1;
        
        if (role === 'super_admin') {
            const institutes = await Institute.find({ status: 'active' });
            for (let inst of institutes) {
                const TenantLead = getTenantModel(inst.instituteId, 'Lead');
                const TenantInteraction = getTenantModel(inst.instituteId, 'Interaction');
                totalLeads += await TenantLead.countDocuments({});
                totalInteractions += await TenantInteraction.countDocuments({});
            }
        } else {
            const TenantLead = getTenantModel(instituteId, 'Lead');
            const TenantInteraction = getTenantModel(instituteId, 'Interaction');
            totalLeads = await TenantLead.countDocuments({});
            totalInteractions = await TenantInteraction.countDocuments({});
        }
        
        res.json({ leads: totalLeads, interactions: totalInteractions, institutes: activeInstitutes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboard/interactions - Returns raw interaction logs for advanced analytics UI
app.get('/api/dashboard/interactions', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'super_admin' && !req.query.instituteId) {
            const institutes = await Institute.find({ status: 'active' });
            let allInteractions = [];
            for (let inst of institutes) {
                const TenantInteraction = getTenantModel(inst.instituteId, 'Interaction');
                const interactions = await TenantInteraction.find({}).sort({ createdAt: -1 }).limit(100).lean();
                interactions.forEach(i => i.instituteId = inst.instituteId);
                allInteractions = allInteractions.concat(interactions);
            }
            allInteractions.sort((a, b) => b.createdAt - a.createdAt);
            allInteractions = allInteractions.slice(0, 1000);
            
            const formattedLogs = allInteractions.map(log => {
                const data = log.metaData || {};
                return {
                    s: log.sessionId,
                    t: log.eventType || 'interaction',
                    i: log.interactionId || 'unknown',
                    d: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString(),
                    q: log.queryText || '',
                    m: log.metaData || {},
                    instituteId: log.instituteId,
                    ...data
                };
            });
            return res.json(formattedLogs);
        }

        let targetInstitute = req.user.role === 'super_admin' ? req.query.instituteId : req.user.instituteId;

        const TenantInteraction = getTenantModel(targetInstitute, 'Interaction');
        const interactions = await TenantInteraction.find({})
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
                instituteId: targetInstitute,
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
        if (req.user.role === 'super_admin' && !req.query.instituteId) {
            const institutes = await Institute.find({ status: 'active' });
            let allLeads = [];
            for (let inst of institutes) {
                const TenantLead = getTenantModel(inst.instituteId, 'Lead');
                const leads = await TenantLead.find({}).sort({ createdAt: -1 }).limit(50).lean();
                leads.forEach(l => l.instituteId = inst.instituteId);
                allLeads = allLeads.concat(leads);
            }
            allLeads.sort((a, b) => b.createdAt - a.createdAt);
            allLeads = allLeads.slice(0, 50);
            
            const formattedLeads = allLeads.map(l => ({
                sessionId: l.sessionId,
                timestamp: l.createdAt,
                data: l.leadData,
                instituteId: l.instituteId
            }));
            return res.json(formattedLeads);
        }

        let targetInstitute = req.user.role === 'super_admin' ? req.query.instituteId : req.user.instituteId;
        
        const TenantLead = getTenantModel(targetInstitute, 'Lead');
        const leads = await TenantLead.find({}).sort({ createdAt: -1 }).limit(50).lean();
        
        // Map to match the frontend expected format
        const formattedLeads = leads.map(l => ({
            sessionId: l.sessionId,
            timestamp: l.createdAt,
            data: l.leadData,
            instituteId: targetInstitute
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
            { id: 'rvce', name: 'RV College of Engineering', key: 'rvce_key_12345' },
            { id: 'rvps', name: 'RV Public School', key: 'rvps_key_12345' },
            { id: 'rvghs', name: 'RV Girls High School', key: 'rvghs_key_12345' }
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
