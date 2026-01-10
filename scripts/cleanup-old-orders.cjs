const { Client } = require('pg')

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Okapi14111999!@db.umblyhwumtadlvgccdwg.supabase.co:5432/postgres'

async function setupOrderCleanup() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })

  try {
    await client.connect()
    console.log('Connected to database\n')

    // Create a function to delete orders older than 1 month
    console.log('Creating cleanup function...')
    await client.query(`
      CREATE OR REPLACE FUNCTION delete_old_grocery_orders()
      RETURNS INTEGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        deleted_count INTEGER;
      BEGIN
        -- First delete order items for old orders
        DELETE FROM grocery_order_items
        WHERE order_id IN (
          SELECT id FROM grocery_orders
          WHERE created_at < NOW() - INTERVAL '1 month'
        );

        -- Then delete the orders themselves
        DELETE FROM grocery_orders
        WHERE created_at < NOW() - INTERVAL '1 month';

        GET DIAGNOSTICS deleted_count = ROW_COUNT;

        RAISE NOTICE 'Deleted % old orders', deleted_count;
        RETURN deleted_count;
      END;
      $$;
    `)
    console.log('Created delete_old_grocery_orders() function')

    // Check if pg_cron extension is available
    const { rows: extensions } = await client.query(`
      SELECT * FROM pg_available_extensions WHERE name = 'pg_cron'
    `)

    if (extensions.length > 0) {
      console.log('\npg_cron extension is available!')

      // Try to enable pg_cron
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS pg_cron')
        console.log('Enabled pg_cron extension')

        // Schedule the cleanup to run daily at 3 AM
        await client.query(`
          SELECT cron.schedule(
            'cleanup-old-grocery-orders',
            '0 3 * * *',
            $$SELECT delete_old_grocery_orders()$$
          )
        `)
        console.log('Scheduled daily cleanup at 3 AM')
      } catch (cronError) {
        console.log('Could not enable pg_cron (may require Supabase Pro):', cronError.message)
        console.log('The cleanup function is created - you can call it manually.')
      }
    } else {
      console.log('\npg_cron not available on this Supabase plan.')
      console.log('The cleanup function is created - call it manually or via Edge Function.')
    }

    // Run cleanup now to delete any existing old orders
    console.log('\nRunning initial cleanup...')
    const { rows } = await client.query('SELECT delete_old_grocery_orders() as deleted_count')
    console.log(`Deleted ${rows[0].deleted_count} old orders`)

    console.log('\n========================================')
    console.log('CLEANUP SETUP COMPLETE!')
    console.log('========================================')
    console.log('\nTo manually run cleanup:')
    console.log('  SELECT delete_old_grocery_orders();')
    console.log('\nOrders older than 1 month will be permanently deleted.')

  } catch (err) {
    console.error('Error:', err.message)
    console.error(err)
  } finally {
    await client.end()
  }
}

// Also allow running a one-time cleanup
async function runCleanupNow() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })

  try {
    await client.connect()
    const { rows } = await client.query('SELECT delete_old_grocery_orders() as deleted_count')
    console.log(`Cleaned up ${rows[0].deleted_count} old orders`)
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await client.end()
  }
}

// Check command line args
if (process.argv[2] === '--run') {
  runCleanupNow()
} else {
  setupOrderCleanup()
}
