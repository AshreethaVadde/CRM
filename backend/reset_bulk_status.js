const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const AppSettings = require('./models/AppSettings');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        console.log('Connecting to database to reset bulk offer status...');
        
        // 1. Reset lastInactivityMessageSentAt for all customers
        const updateResult = await Customer.updateMany(
            {}, 
            { $set: { lastInactivityMessageSentAt: null } }
        );
        console.log(`Reset lastInactivityMessageSentAt for ${updateResult.modifiedCount} customers.`);

        // 2. Clear the global cooldown tracking
        const unsetResult = await AppSettings.deleteOne({ key: 'lastBulkOfferSentDate' });
        console.log(`Cleared global bulk offer cooldown (Deleted ${unsetResult.deletedCount} settings).`);

        console.log('✅ Status reset completely. The bulk button is now unlocked and ready for testing.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
