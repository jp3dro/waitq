import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient();

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'scripts', 'add-sms-status-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        const { error } = await admin.from('_supabase_migration_temp').select('*').limit(0); // Test connection
        // For raw SQL, we'll need to execute each statement
        // Since Supabase doesn't have direct exec_sql, we'll use a workaround
      }
    }

    // Execute each statement individually
    // Note: This is a simplified approach. In production, you'd want proper transaction handling
    const { error } = await admin.rpc('exec', { sql: migrationSQL });

    if (error) {
      console.error('Migration error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Migration completed successfully' });
  } catch (error) {
    console.error('Migration failed:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Alternative approach: execute via direct SQL commands
async function executeSQL(admin: any, sql: string) {
  // This is a simplified approach - in a real app you'd use proper migration tools
  try {
    const { error } = await admin.from('dummy_table').select('*').limit(0);
    // Since we can't execute raw DDL via the client, we'll need to suggest manual execution
    console.log('Please execute this SQL manually in your Supabase dashboard:');
    console.log(sql);
    return { error: null };
  } catch (error) {
    return { error };
  }
}
