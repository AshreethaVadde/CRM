const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const AppSettings = require('./models/AppSettings');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        console.log('Connecting to database to make Hasini inactive and unlock bulk buttons...');
        
        // 1. Find Hasini and set lastVisitDate to older than 3 days (e.g. 10 days ago)
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        
        const hasiniRegex = new RegExp('hasini', 'i');
        const hasiniCust = await Customer.findOne({ name: hasiniRegex });
        
        if (hasiniCust) {
            hasiniCust.lastVisitDate = tenDaysAgo;
            hasiniCust.lastInactivityMessageSentAt = null;
            await hasiniCust.save();
            console.log(`Successfully made "${hasiniCust.name}" inactive (last visited 10 days ago).`);
        } else {
            console.log('Could not find a customer named Hasini.');
        }

        // 2. Clear lastInactivityMessageSentAt for all inactive customers to be safe
        const updateResult = await Customer.updateMany(
            {}, 
            { $set: { lastInactivityMessageSentAt: null } }
        );
        console.log(`Reset lastInactivityMessageSentAt status for all customers.`);

        // 3. Clear the global cooldown tracking
        await AppSettings.deleteOne({ key: 'lastBulkOfferSentDate' });
        console.log(`Cleared global bulk offer cooldown.`);

        console.log('✅ Hasini is inactive. The bulk button is unlocked and ready for testing.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
