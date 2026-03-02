const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');

mongoose.connect('mongodb://localhost:27017/realestate').then(async () => {
    console.log('Connected to MongoDB');
    
    const duplicates = await Booking.aggregate([
        { $group: { _id: "$bookingId", count: { $sum: 1 }, ids: { $push: "$_id" } } },
        { $match: { count: { $gt: 1 } } }
    ]);
    
    console.log('Found duplicates:', duplicates);
    
    let deleted = 0;
    for (const doc of duplicates) {
        const toDelete = doc.ids.slice(1);
        await Booking.deleteMany({ _id: { $in: toDelete } });
        deleted += toDelete.length;
        console.log(`Deleted ${toDelete.length} duplicates for bookingId ${doc._id}`);
    }
    
    console.log(`Total deleted: ${deleted}`);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
