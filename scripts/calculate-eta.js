const { createClient } = require('@supabase/supabase-js');

// This script calculates ETA for all existing waitlist entries
// Run with: node scripts/calculate-eta.js

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Calculate ETA for all waiting entries in a waitlist
// Assumes average service time of 15 minutes per person
async function calculateAndUpdateETA(waitlistId) {
  console.log(`Calculating ETA for waitlist ${waitlistId}`);

  // Get all waiting entries ordered by ticket number
  const { data: entries, error } = await supabase
    .from("waitlist_entries")
    .select("id, ticket_number")
    .eq("waitlist_id", waitlistId)
    .eq("status", "waiting")
    .order("ticket_number", { ascending: true });

  if (error || !entries) {
    console.error(`Error fetching entries for waitlist ${waitlistId}:`, error);
    return;
  }

  if (entries.length === 0) {
    console.log(`No waiting entries for waitlist ${waitlistId}`);
    return;
  }

  // Get current serving number
  const { data: serving } = await supabase
    .from("waitlist_entries")
    .select("ticket_number")
    .eq("waitlist_id", waitlistId)
    .in("status", ["notified", "seated"])
    .order("notified_at", { ascending: false, nullsFirst: false })
    .order("ticket_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentServing = serving?.ticket_number || 0;

  // Calculate ETA for each waiting entry
  const updates = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const position = entry.ticket_number - currentServing - 1; // Position ahead in queue
    const etaMinutes = Math.max(0, position * 15); // 15 minutes per person, minimum 0
    updates.push({ id: entry.id, eta_minutes: etaMinutes });
  }

  // Update all entries in batch
  if (updates.length > 0) {
    const { error: updateError } = await supabase
      .from("waitlist_entries")
      .upsert(updates, { onConflict: 'id' });

    if (updateError) {
      console.error(`Error updating ETA for waitlist ${waitlistId}:`, updateError);
    } else {
      console.log(`Updated ${updates.length} entries for waitlist ${waitlistId}`);
    }
  }
}

async function main() {
  console.log('Starting ETA calculation for all waitlists...');

  // Get all waitlists
  const { data: waitlists, error } = await supabase
    .from("waitlists")
    .select("id, name");

  if (error) {
    console.error('Error fetching waitlists:', error);
    return;
  }

  console.log(`Found ${waitlists.length} waitlists`);

  // Calculate ETA for each waitlist
  for (const waitlist of waitlists) {
    await calculateAndUpdateETA(waitlist.id);
  }

  console.log('ETA calculation completed!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { calculateAndUpdateETA };
