const { Client } = require('pg')

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Okapi14111999!@db.umblyhwumtadlvgccdwg.supabase.co:5432/postgres'

async function verify() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })

  try {
    await client.connect()
    console.log('Connected to Supabase\n')
    console.log('==================================================')

    // 1. Check staff profiles
    console.log('\n1. STAFF PROFILES')
    const { rows: staff } = await client.query(`
      SELECT id, full_name, email, role
      FROM staff_profiles
      ORDER BY role, full_name
    `)
    if (staff.length === 0) {
      console.log('   NO STAFF FOUND')
    } else {
      staff.forEach(s => {
        const email = s.email || 'no email'
        console.log('   [OK] ' + s.full_name + ' (' + s.role + ') - ' + email)
      })
      console.log('   Total: ' + staff.length + ' staff members')
    }

    // 2. Check players
    console.log('\n2. PLAYERS')
    const { rows: players } = await client.query(`
      SELECT id, first_name, last_name, email, status, user_id
      FROM players
      ORDER BY first_name
    `)
    if (players.length === 0) {
      console.log('   NO PLAYERS FOUND')
    } else {
      players.forEach(p => {
        const email = p.email || 'no email'
        const linked = p.user_id ? ' [linked]' : ' [NOT linked]'
        console.log('   [OK] ' + p.first_name + ' ' + p.last_name + ' - ' + email + ' (' + p.status + ')' + linked)
      })
      console.log('   Total: ' + players.length + ' players')
    }

    // 3. Check grocery items
    console.log('\n3. GROCERY ITEMS')
    const { rows: groceryItems } = await client.query(`
      SELECT category, COUNT(*) as count
      FROM grocery_items
      WHERE in_stock = true
      GROUP BY category
      ORDER BY category
    `)
    if (groceryItems.length === 0) {
      console.log('   NO GROCERY ITEMS FOUND')
    } else {
      groceryItems.forEach(g => console.log('   [OK] ' + g.category + ': ' + g.count + ' items'))
      const total = groceryItems.reduce((sum, g) => sum + parseInt(g.count), 0)
      console.log('   Total: ' + total + ' grocery items')
    }

    // 4. Check houses and rooms
    console.log('\n4. HOUSES & ROOMS')
    const { rows: houses } = await client.query(`SELECT id, name FROM houses ORDER BY name`)
    const { rows: rooms } = await client.query(`SELECT id, house_id, name FROM rooms ORDER BY house_id, name`)
    if (houses.length === 0) {
      console.log('   NO HOUSES FOUND')
    } else {
      houses.forEach(h => {
        const houseRooms = rooms.filter(r => r.house_id === h.id)
        console.log('   [OK] ' + h.name + ': ' + houseRooms.length + ' rooms')
      })
      console.log('   Total: ' + houses.length + ' houses, ' + rooms.length + ' rooms')
    }

    // 5. Check recent orders (to see if system is being used)
    console.log('\n5. RECENT ACTIVITY')
    const { rows: orders } = await client.query(`
      SELECT COUNT(*) as count FROM grocery_orders WHERE created_at > NOW() - INTERVAL '30 days'
    `)
    console.log('   Grocery orders (last 30 days): ' + orders[0].count)

    const { rows: wellness } = await client.query(`
      SELECT COUNT(*) as count FROM wellness_logs WHERE created_at > NOW() - INTERVAL '30 days'
    `)
    console.log('   Wellness logs (last 30 days): ' + wellness[0].count)

    console.log('\n==================================================')
    console.log('VERIFICATION COMPLETE')

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await client.end()
  }
}

verify()
