const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Bill = require('./models/Bill');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        console.log('Connecting to database...');
        
        // Delete previously added customers
        const emailsToDelete = [
            'rachel.testing.crm@yopmail.com', 
            'harvey.testing.crm@yopmail.com', 
            'donna.testing.crm@yopmail.com'
        ];
        
        const deletedCusts = await Customer.find({ email: { $in: emailsToDelete } });
        const deletedIds = deletedCusts.map(c => c._id);
        
        if (deletedIds.length > 0) {
            await Bill.deleteMany({ customerId: { $in: deletedIds } });
            await Customer.deleteMany({ _id: { $in: deletedIds } });
            console.log('Deleted previous 3 customers and their bills.');
        }

        const today = new Date();
        const oldDate1 = new Date(today); oldDate1.setDate(today.getDate() - 95);
        const oldDate2 = new Date(today); oldDate2.setDate(today.getDate() - 110);
        const oldDate3 = new Date(today); oldDate3.setDate(today.getDate() - 140);

        const c1 = await Customer.create({
            name: 'Mike Ross', phone: '9876543004', email: 'mike.testing.crm@yopmail.com',
            totalSpending: 6500, visits: 4, rewardPoints: 120, lastVisitDate: oldDate1
        });
        const c2 = await Customer.create({
            name: 'Jessica Pearson', phone: '9876543005', email: 'jessica.testing.crm@yopmail.com',
            totalSpending: 85000, visits: 18, rewardPoints: 4500, lastVisitDate: oldDate2
        });
        const c3 = await Customer.create({
            name: 'Louis Litt', phone: '9876543006', email: 'louis.testing.crm@yopmail.com',
            totalSpending: 12000, visits: 5, rewardPoints: 300, lastVisitDate: oldDate3
        });

        await Bill.insertMany([
            { customerId: c1._id, amount: 6500, subtotal: 6500, total: 6500, items: [{ name: 'Briefcase', quantity: 1, price: 6500 }], paymentMethod: 'Card', createdAt: oldDate1 },
            
            { customerId: c2._id, amount: 45000, subtotal: 45000, total: 45000, items: [{ name: 'Designer Dress', quantity: 1, price: 45000 }], paymentMethod: 'Card', createdAt: oldDate2 },
            { customerId: c2._id, amount: 40000, subtotal: 40000, total: 40000, items: [{ name: 'Luxury Bag', quantity: 1, price: 40000 }], paymentMethod: 'Card', createdAt: new Date(oldDate2.getTime() - 20*24*60*60*1000) },

            { customerId: c3._id, amount: 12000, subtotal: 12000, total: 12000, items: [{ name: 'Dictaphone', quantity: 3, price: 4000 }], paymentMethod: 'Cash', createdAt: oldDate3 }
        ]);

        console.log('✅ 3 NEW inactive customers with rich histories added successfully.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
