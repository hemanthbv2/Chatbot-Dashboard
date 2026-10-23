const mongoose = require('mongoose');

// Import schemas directly
const leadSchema = require('../models/Lead');
const interactionSchema = require('../models/Interaction');
const sessionSchema = require('../models/Session');
const rawLogSchema = require('../models/RawLog');

// Cache connections so we don't open a new one for every request
const tenantConnections = {};

const getTenantModel = (instituteId, modelName) => {
    // 1. Check if master connection is established (server.js calls mongoose.connect)
    if (mongoose.connection.readyState !== 1) {
        throw new Error('Master Database connection is not ready.');
    }

    // 2. Create or retrieve tenant-specific database connection
    if (!tenantConnections[instituteId]) {
        // useDb switches the logical database but reuses the underlying connection pool
        const dbName = `chatbot_${instituteId}`;
        tenantConnections[instituteId] = mongoose.connection.useDb(dbName, { useCache: true });
        console.log(`[DB] Opened tenant database: ${dbName}`);
    }

    const tenantDb = tenantConnections[instituteId];

    // 3. Bind and return the requested model to the tenant database
    let schema;
    if (modelName === 'Lead') schema = leadSchema;
    else if (modelName === 'Interaction') schema = interactionSchema;
    else if (modelName === 'Session') schema = sessionSchema;
    else if (modelName === 'RawLog') schema = rawLogSchema;
    else throw new Error(`Model ${modelName} not supported in tenant db`);

    return tenantDb.model(modelName, schema);
};

module.exports = { getTenantModel };
