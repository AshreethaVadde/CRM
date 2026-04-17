const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Bill = require('./models/Bill');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const today = new Date();
        const oldDate1 = new Date(today); oldDate1.setDate(today.getDate() - 70);
        const oldDate2 = new Date(today); oldDate2.setDate(today.getDate() - 85);
        const oldDate3 = new Date(today); oldDate3.setDate(today.getDate() - 120);

        const c1 = await Customer.create({
            name: 'Rachel Zane', phone: '9876543001', email: 'rachel.testing.crm@yopmail.com',
            totalSpending: 12500, visits: 6, rewardPoints: 450, lastVisitDate: oldDate1
        });
        const c2 = await Customer.create({
            name: 'Harvey Specter', phone: '9876543002', email: 'harvey.testing.crm@yopmail.com',
            totalSpending: 45000, visits: 12, rewardPoints: 2100, lastVisitDate: oldDate2
        });
        const c3 = await Customer.create({
            name: 'Donna Paulsen', phone: '9876543003', email: 'donna.testing.crm@yopmail.com',
            totalSpending: 8000, visits: 3, rewardPoints: 120, lastVisitDate: oldDate3
        });

        await Bill.insertMany([
            { customerId: c1._id, amount: 2500, subtotal: 2500, total: 2500, items: [{ name: 'Jacket', quantity: 1, price: 2500 }], paymentMethod: 'Card', createdAt: oldDate1 },
            { customerId: c1._id, amount: 10000, subtotal: 10000, total: 10000, items: [{ name: 'Dress', quantity: 2, price: 5000 }], paymentMethod: 'UPI', createdAt: new Date(oldDate1.getTime() - 10*24*60*60*1000) },
            
            { customerId: c2._id, amount: 20000, subtotal: 20000, total: 20000, items: [{ name: 'Suit', quantity: 1, price: 20000 }], paymentMethod: 'Card', createdAt: oldDate2 },
            { customerId: c2._id, amount: 25000, subtotal: 25000, total: 25000, items: [{ name: 'Watch', quantity: 1, price: 25000 }], paymentMethod: 'Card', createdAt: new Date(oldDate2.getTime() - 20*24*60*60*1000) },

            { customerId: c3._id, amount: 8000, subtotal: 8000, total: 8000, items: [{ name: 'Shoes', quantity: 1, price: 8000 }], paymentMethod: 'Cash', createdAt: oldDate3 }
        ]);

        console.log('✅ 3 inactive customers with rich histories added successfully.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
