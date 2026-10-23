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

            // --- Robust Lead Detection Filter ---
            let isLead = (eventType === 'form_submit');
            let leadPayload = null;

            if (metaData.leadData && typeof metaData.leadData === 'object') {
                leadPayload = { ...metaData.leadData };
                isLead = true;
            } else if (eventType === 'form_submit') {
                leadPayload = { ...metaData };
                isLead = true;
            }

            // Only scan user-entered text (NEVER scan userAgent or browser headers)
            const textToScan = (metaData.query || metaData.message || (eventType === 'message' ? metaData.elementText : '')) || '';
            const emailMatch = textToScan.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            const phoneMatch = textToScan.match(/\b[6-9]\d{9}\b/);

            // Filter out crawler bots and school domain contact emails
            const isBotEmail = emailMatch && /claudebot|anthropic|crawler|googlebot|bingbot|yandex|spider/i.test(emailMatch[0]);
            const isSchoolEmail = emailMatch && /@(rvei\.edu\.in|rvcn\.edu\.in|rvce\.edu\.in|rvghs\.edu\.in|rvps\.edu\.in|rvpucollege\.edu\.in|ssmrv\.edu\.in|nmkrv\.edu\.in)/i.test(emailMatch[0]);

            if ((emailMatch && !isBotEmail && !isSchoolEmail) || phoneMatch) {
                isLead = true;
                if (!leadPayload) leadPayload = {};
                if (!leadPayload.email && emailMatch && !isBotEmail && !isSchoolEmail) leadPayload.email = emailMatch[0];
                if (!leadPayload.phone && phoneMatch) leadPayload.phone = phoneMatch[0];
            }

            if (isLead && leadPayload) {
                const finalEmail = leadPayload.email || '';
                const finalUa = metaData.userAgent || '';
                const isBot = /claudebot|anthropic|crawler|googlebot|bingbot|spider/i.test(finalEmail) ||
                              /claudebot|anthropic|crawler|googlebot|bingbot|spider/i.test(finalUa);

                if (!isBot) {
                    if (!leadPayload.name) {
                        const nameMatch = textToScan.match(/(?:Name|Full Name)[\:\s]+([a-zA-Z\s]+)(?:Phone|Email|$)/i);
                        leadPayload.name = nameMatch ? nameMatch[1].trim() : (eventType === 'form_submit' ? 'Enquiry Visitor' : 'Chat Visitor');
                    }
                    delete leadPayload.userAgent;

                    leadDocs.push({
                        instituteId: institute_id,
                        sessionId: sessionId,
                        leadData: leadPayload
                    });
                }
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

        if (leadDocs.length > 0) {
            const TenantLead = getTenantModel(institute_id, 'Lead');
            await TenantLead.insertMany(leadDocs);
        }
        if (interactionDocs.length > 0) {
            const TenantInteraction = getTenantModel(institute_id, 'Interaction');
            await TenantInteraction.insertMany(interactionDocs);
        }

        res.json({ success: true, message: 'Logs processed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 2.1 Direct Telemetry Route (For real-time widget stream dual-write)
app.post('/api/telemetry', async (req, res) => {
    try {
        const { instituteId, instituteName, event, data, timestamp, sessionId } = req.body;
        const targetInst = instituteId || 'rvpu-north';
        const sessId = sessionId || ('sess_' + Date.now());

        const TenantInteraction = getTenantModel(targetInst, 'Interaction');
        const interactionDoc = {
            instituteId: targetInst,
            sessionId: sessId,
            eventType: event || 'interaction',
            queryText: data ? (data.query || data.message || (typeof data === 'string' ? data : '')) : '',
            metaData: data || {},
            createdAt: timestamp ? new Date(timestamp) : new Date()
        };
        await TenantInteraction.create(interactionDoc);

        // Auto capture leads
        if (event === 'lead_submitted' || (data && (data.phone || data.email || data.leadData))) {
            const TenantLead = getTenantModel(targetInst, 'Lead');
            await TenantLead.create({
                instituteId: targetInst,
                sessionId: sessId,
                leadData: data.leadData || data,
                createdAt: timestamp ? new Date(timestamp) : new Date()
            });
        }

        res.json({ success: true, message: 'Telemetry successfully logged to Atlas' });
    } catch (err) {
        console.error('Telemetry ingestion error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 3. Dashboard Data Routes (Protected)
app.get('/api/institutes', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'super_admin') {
            const institutes = await Institute.find({ status: 'active' }).select('instituteId name status');
            return res.json(institutes);
        }
        const institute = await Institute.findOne({ instituteId: req.user.instituteId, status: 'active' }).select('instituteId name status');
        res.json(institute ? [institute] : []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const { role, instituteId } = req.user;
        let totalLeads = 0;
        let totalInteractions = 0;
        const activeInstitutes = role === 'super_admin' ? await Institute.countDocuments({ status: 'active' }) : 1;
        const instituteStats = [];
        
        if (role === 'super_admin') {
            const institutes = await Institute.find({ status: 'active' });
            for (let inst of institutes) {
                try {
                    const TenantLead = getTenantModel(inst.instituteId, 'Lead');
                    const TenantInteraction = getTenantModel(inst.instituteId, 'Interaction');
                    const instLeads = await TenantLead.countDocuments({});
                    const instInteractions = await TenantInteraction.countDocuments({});
                    totalLeads += instLeads;
                    totalInteractions += instInteractions;
                    instituteStats.push({
                        instituteId: inst.instituteId,
                        name: inst.name,
                        leads: instLeads,
                        interactions: instInteractions,
                        status: inst.status
                    });
                } catch (e) {
                    console.error(`Error loading stats for ${inst.instituteId}:`, e.message);
                    instituteStats.push({
                        instituteId: inst.instituteId,
                        name: inst.name,
                        leads: 0,
                        interactions: 0,
                        status: inst.status
                    });
                }
            }
        } else {
            const TenantLead = getTenantModel(instituteId, 'Lead');
            const TenantInteraction = getTenantModel(instituteId, 'Interaction');
            totalLeads = await TenantLead.countDocuments({});
            totalInteractions = await TenantInteraction.countDocuments({});
            const inst = await Institute.findOne({ instituteId });
            instituteStats.push({
                instituteId: instituteId,
                name: inst ? inst.name : instituteId.toUpperCase(),
                leads: totalLeads,
                interactions: totalInteractions,
                status: 'active'
            });
        }
        
        res.json({ leads: totalLeads, interactions: totalInteractions, institutes: activeInstitutes, instituteStats });
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
                try {
                    const TenantInteraction = getTenantModel(inst.instituteId, 'Interaction');
                    const interactions = await TenantInteraction.find({}).sort({ createdAt: -1 }).limit(1000).lean();
                    interactions.forEach(i => i.instituteId = inst.instituteId);
                    allInteractions = allInteractions.concat(interactions);
                } catch (e) {
                    console.error(`Error loading interactions for ${inst.instituteId}:`, e.message);
                }
            }
            allInteractions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            allInteractions = allInteractions.slice(0, 2000);
            
            const formattedLogs = allInteractions.map(log => {
                const data = log.metaData || {};
                const dateIso = log.createdAt ? (log.createdAt.toISOString ? log.createdAt.toISOString() : new Date(log.createdAt).toISOString()) : new Date().toISOString();
                return {
                    s: log.sessionId,
                    t: log.eventType || 'interaction',
                    i: log.interactionId || 'unknown',
                    d: dateIso,
                    timestamp: dateIso,
                    createdAt: dateIso,
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
            .limit(1500)
            .lean();

        // Map Interaction documents to the expected dashboard format
        const formattedLogs = interactions.map(log => {
            const data = log.metaData || {};
            const dateIso = log.createdAt ? (log.createdAt.toISOString ? log.createdAt.toISOString() : new Date(log.createdAt).toISOString()) : new Date().toISOString();
            return {
                s: log.sessionId,
                t: log.eventType || 'interaction',
                i: log.interactionId || 'unknown',
                d: dateIso,
                timestamp: dateIso,
                createdAt: dateIso,
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
                try {
                    const TenantLead = getTenantModel(inst.instituteId, 'Lead');
                    const leads = await TenantLead.find({}).sort({ createdAt: -1 }).limit(100).lean();
                    leads.forEach(l => l.instituteId = inst.instituteId);
                    allLeads = allLeads.concat(leads);
                } catch (e) {
                    console.error(`Error loading leads for ${inst.instituteId}:`, e.message);
                }
            }
            allLeads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            allLeads = allLeads.slice(0, 200);
            
            const formattedLeads = allLeads.map(l => ({
                sessionId: l.sessionId,
                timestamp: l.createdAt,
                createdAt: l.createdAt,
                data: l.leadData,
                leadData: l.leadData,
                instituteId: l.instituteId
            }));
            return res.json(formattedLeads);
        }

        let targetInstitute = req.user.role === 'super_admin' ? req.query.instituteId : req.user.instituteId;
        
        const TenantLead = getTenantModel(targetInstitute, 'Lead');
        const leads = await TenantLead.find({}).sort({ createdAt: -1 }).limit(100).lean();
        
        // Map to match both frontend expected formats (data/leadData and timestamp/createdAt)
        const formattedLeads = leads.map(l => ({
            sessionId: l.sessionId,
            timestamp: l.createdAt,
            createdAt: l.createdAt,
            data: l.leadData,
            leadData: l.leadData,
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
            { id: 'rvghs', name: 'RV Girls High School', key: 'rvghs_key_12345' },
            { id: 'rvpu-north', name: 'RV PU College North', key: 'rvpu_north_key_12345' },
            { id: 'rvpu-south', name: 'RV PU College South', key: 'rvpu_south_key_12345' },
            { id: 'rvpu-ecity', name: 'RV PU College Electronic City', key: 'rvpu_ecity_key_12345' },
            { id: 'rvpu-harohalli', name: 'RV PU College Harohalli', key: 'rvpu_harohalli_key_12345' },
            { id: 'ssmrvpu', name: 'SSMRV PU College', key: 'ssmrvpu_key_12345' },
            { id: 'rvpu-mysore', name: 'RV PU College Mysuru', key: 'rvpu_mysore_key_12345' },
            { id: 'nmkrvpu', name: 'NMKRV PU College for Women', key: 'nmkrvpu_key_12345' }
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

        res.json({ message: 'Seed data generated successfully for all 11 institutes (including all 7 RVPU campuses).' });
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
