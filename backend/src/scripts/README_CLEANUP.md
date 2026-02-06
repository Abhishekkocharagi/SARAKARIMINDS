# Account Deletion Cleanup

This script automatically deletes user accounts that have passed their 30-day grace period.

## Setup

### Option 1: Manual Execution
Run the script manually:
```bash
cd backend
node src/scripts/cleanupExpiredAccounts.js
```

### Option 2: Automated Cron Job (Recommended)

#### On Linux/Mac:
1. Open crontab:
```bash
crontab -e
```

2. Add this line to run daily at 2 AM:
```
0 2 * * * cd /path/to/SARAKARIMINDS/backend && node src/scripts/cleanupExpiredAccounts.js >> /var/log/account-cleanup.log 2>&1
```

#### On Windows:
1. Open Task Scheduler
2. Create a new task:
   - **Trigger**: Daily at 2:00 AM
   - **Action**: Start a program
   - **Program**: `node`
   - **Arguments**: `src/scripts/cleanupExpiredAccounts.js`
   - **Start in**: `C:\Users\arunp\mmm\SARAKARIMINDS\backend`

### Option 3: Using node-cron (In-App)

Add to your `server.js`:

```javascript
const cron = require('node-cron');
const { exec } = require('child_process');

// Run cleanup daily at 2 AM
cron.schedule('0 2 * * *', () => {
    console.log('Running account cleanup...');
    exec('node src/scripts/cleanupExpiredAccounts.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`Cleanup error: ${error}`);
            return;
        }
        console.log(`Cleanup output: ${stdout}`);
    });
});
```

Then install node-cron:
```bash
npm install node-cron
```

## How It Works

1. Connects to MongoDB
2. Finds all users with `scheduledDeletionDate` <= current date
3. For each user:
   - Removes from all connections
   - Removes from followers/following lists
   - Deletes connection documents
   - Deletes all posts
   - Deletes the user account
4. Logs results and exits

## Testing

To test with a shorter grace period, temporarily modify the deletion scheduling in `userController.js`:

```javascript
// For testing: 1 minute instead of 30 days
deletionDate.setMinutes(deletionDate.getMinutes() + 1);
```

Then run the cleanup script after 1 minute to verify it works.
