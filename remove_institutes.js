const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Institute = require('./models/Institute');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    await Institute.deleteMany({ instituteId: { $in: ['rvps', 'rvs', 'rvghs'] } });
    await User.deleteMany({ username: { $in: ['rvpsadmin', 'rvsadmin', 'rvghsadmin'] } });
    console.log('Removed RVPS, RVS, RVGHS');
    process.exit(0);
});
