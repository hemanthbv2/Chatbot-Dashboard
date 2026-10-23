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
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Built-in default credentials mapping (supports both underscored and non-underscored formats)
        const DEFAULT_ACCOUNTS = {
            'admin': { pass: 'admin123', role: 'super_admin', instituteId: null },
            'superadmin': { pass: 'admin123', role: 'super_admin', instituteId: null },
            'rvghs_admin': { pass: 'rvghs123', role: 'institute_admin', instituteId: 'rvghs' },
            'rvghsadmin': { pass: 'rvghs123', role: 'institute_admin', instituteId: 'rvghs' },
            'rvcn_admin': { pass: 'rvcn123', role: 'institute_admin', instituteId: 'rvcn' },
            'rvcnadmin': { pass: 'rvcn123', role: 'institute_admin', instituteId: 'rvcn' },
            'rvce_admin': { pass: 'rvce123', role: 'institute_admin', instituteId: 'rvce' },
            'rvceadmin': { pass: 'rvce123', role: 'institute_admin', instituteId: 'rvce' },
            'rvps_admin': { pass: 'rvps123', role: 'institute_admin', instituteId: 'rvps' },
            'rvpsadmin': { pass: 'rvps123', role: 'institute_admin', instituteId: 'rvps' },
            'rvpu_north_admin': { pass: 'rvpu_north123', role: 'institute_admin', instituteId: 'rvpu-north' },
            'rvpu-northadmin': { pass: 'rvpu_north123', role: 'institute_admin', instituteId: 'rvpu-north' },
            'rvpu_south_admin': { pass: 'rvpu_south123', role: 'institute_admin', instituteId: 'rvpu-south' },
            'rvpu-southadmin': { pass: 'rvpu_south123', role: 'institute_admin', instituteId: 'rvpu-south' },
            'rvpu_ecity_admin': { pass: 'rvpu_ecity123', role: 'institute_admin', instituteId: 'rvpu-ecity' },
            'rvpu-ecityadmin': { pass: 'rvpu_ecity123', role: 'institute_admin', instituteId: 'rvpu-ecity' },
            'rvpu_harohalli_admin': { pass: 'rvpu_harohalli123', role: 'institute_admin', instituteId: 'rvpu-harohalli' },
            'rvpu-harohalliadmin': { pass: 'rvpu_harohalli123', role: 'institute_admin', instituteId: 'rvpu-harohalli' },
            'ssmrvpu_admin': { pass: 'ssmrvpu123', role: 'institute_admin', instituteId: 'ssmrvpu' },
            'ssmrvpuadmin': { pass: 'ssmrvpu123', role: 'institute_admin', instituteId: 'ssmrvpu' },
            'rvpu_mysore_admin': { pass: 'rvpu_mysore123', role: 'institute_admin', instituteId: 'rvpu-mysore' },
            'rvpu-mysoreadmin': { pass: 'rvpu_mysore123', role: 'institute_admin', instituteId: 'rvpu-mysore' },
            'nmkrvpu_admin': { pass: 'nmkrvpu123', role: 'institute_admin', instituteId: 'nmkrvpu' },
            'nmkrvpuadmin': { pass: 'nmkrvpu123', role: 'institute_admin', instituteId: 'nmkrvpu' }
        };

        let user = await User.findOne({ username });

        // Auto-provision if it's a default system account
        if (!user && DEFAULT_ACCOUNTS[username] && DEFAULT_ACCOUNTS[username].pass === password) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            user = await User.create({
                username: username,
                passwordHash: hash,
                role: DEFAULT_ACCOUNTS[username].role,
                instituteId: DEFAULT_ACCOUNTS[username].instituteId
            });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials. Click \"Run Initial Setup (Seed DB)\" or verify credentials.' });
        }

        let validPassword = await bcrypt.compare(password, user.passwordHash);

        // Fallback for default accounts in case salt differed
        if (!validPassword && DEFAULT_ACCOUNTS[username] && DEFAULT_ACCOUNTS[username].pass === password) {
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(password, salt);
            await user.save();
            validPassword = true;
        }

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, instituteId: user.instituteId, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, role: user.role, instituteId: user.instituteId, username: user.username });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Database Seeder / Setup Route (All 11 Institutes & Accounts)
app.post('/api/setup', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);

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

        // 1. Ensure all institutes exist
        for (const inst of institutes) {
            await Institute.findOneAndUpdate(
                { instituteId: inst.id },
                { instituteId: inst.id, name: inst.name, apiKey: inst.key, status: 'active' },
                { upsert: true, new: true }
            );
        }

        // 2. Super Admin Accounts
        const superAdminHash = await bcrypt.hash('admin123', salt);
        await User.findOneAndUpdate(
            { username: 'admin' },
            { username: 'admin', passwordHash: superAdminHash, role: 'super_admin', instituteId: null },
            { upsert: true, new: true }
        );
        await User.findOneAndUpdate(
            { username: 'superadmin' },
            { username: 'superadmin', passwordHash: superAdminHash, role: 'super_admin', instituteId: null },
            { upsert: true, new: true }
        );

        // 3. Institute Admin Accounts (both format variations)
        for (const inst of institutes) {
            const pass = (inst.id.replace(/-/g, '_') + '123').toLowerCase();
            const hash = await bcrypt.hash(pass, salt);

            // standard format: rvghsadmin / rvceadmin
            const cleanId = inst.id.replace(/-/g, '');
            await User.findOneAndUpdate(
                { username: cleanId + 'admin' },
                { username: cleanId + 'admin', passwordHash: hash, role: 'institute_admin', instituteId: inst.id },
                { upsert: true, new: true }
            );

            // underscore format: rvghs_admin / rvce_admin
            const underId = inst.id.replace(/-/g, '_');
            await User.findOneAndUpdate(
                { username: underId + '_admin' },
                { username: underId + '_admin', passwordHash: hash, role: 'institute_admin', instituteId: inst.id },
                { upsert: true, new: true }
            );
        }

        res.json({
            ok: true,
            message: 'Database seeded successfully for all 11 institutes! You can now log in.'
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
                        leadData: leadPayload,
                        createdAt: new Date(e.timestamp || e.d || Date.now())
                    });
                }
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

        // 1. Store Raw Telemetry Ingestion Log (Zero-Loss Archive)
        try {
            const TenantRawLog = getTenantModel(institute_id, 'RawLog');
            await TenantRawLog.create({
                instituteId: institute_id,
                sessionId: sessionId,
                payload: req.body,
                receivedAt: new Date()
            });
        } catch(rawErr) {
            console.warn('Raw log archiving note:', rawErr.message);
        }

        // 2. Save Leads
        if (leadDocs.length > 0) {
            const TenantLead = getTenantModel(institute_id, 'Lead');
            await TenantLead.insertMany(leadDocs, { ordered: false });
        }

        // 3. Save Interactions
        if (interactionDocs.length > 0) {
            const TenantInteraction = getTenantModel(institute_id, 'Interaction');
            await TenantInteraction.insertMany(interactionDocs, { ordered: false });
        }

        // 4. Update / Aggregate Complete Session State
        try {
            const TenantSession = getTenantModel(institute_id, 'Session');
            const msgCount = interactionDocs.filter(i => i.eventType === 'message').length;
            const clkCount = interactionDocs.filter(i => i.eventType === 'click').length;
            const maxDwell = Math.max(...events.map(e => e.data?.dwellTimeSeconds || 0), 0);
            const latestIntent = interactionDocs[interactionDocs.length - 1]?.interactionId || '';

            await TenantSession.findOneAndUpdate(
                { sessionId: sessionId },
                {
                    $setOnInsert: { instituteId: institute_id, startTime: new Date() },
                    $set: {
                        lastActive: new Date(),
                        lastIntent: latestIntent,
                        deviceInfo: events[0]?.data?.device || events[0]?.data?.platform || {}
                    },
                    $inc: {
                        eventCount: interactionDocs.length,
                        messageCount: msgCount,
                        clickCount: clkCount
                    },
                    $max: {
                        dwellSeconds: maxDwell
                    }
                },
                { upsert: true, new: true }
            );
        } catch (sessErr) {
            console.warn('Session aggregation note:', sessErr.message);
        }

        res.json({ success: true, ok: true, message: 'All telemetry, sessions, and interactions recorded successfully', count: interactionDocs.length });
    } catch (err) {
        console.error('Error saving logs:', err.message);
        res.status(500).json({ error: err.message, ok: false });
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
