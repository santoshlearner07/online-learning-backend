const cron = require('node-cron');
const ScheduleClass = require('../models/ScheduleClass');


const initCronJobs = () => {
    cron.schedule('0 * * * *', async () => {
        console.log('--- Running Auto-Complete Cron Job ---');
        
        try {
            const now = new Date();

            // Find all UPCOMING classes where the endTime has already passed
            const result = await ScheduleClass.updateMany(
                {
                    status: 'UPCOMING',
                    endTime: { $lt: now } // $lt means "Less Than"
                },
                {
                    $set: { status: 'COMPLETED' }
                }
            );

            console.log(`Successfully auto-completed ${result.modifiedCount} classes.`);
        } catch (error) {
            console.error('Cron Job Error:', error);
        }
    });
};

module.exports = initCronJobs;