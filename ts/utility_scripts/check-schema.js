/**
 * check-schema.js
 * Utility script to verify the Supabase database schema for the 'students' table.
 * It manually loads environment variables and checks for available columns.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        if (key && !key.startsWith('#')) {
            process.env[key] = value;
        }
    }
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    const { data: cols, error } = await supabase.rpc('get_table_columns', { table_name: 'students' });
    
    if (error) {
        // Fallback: SELECT one record
        const { data, error: err2 } = await supabase.from('students').select('*').limit(1);
        if (err2) {
            console.error('Error:', err2);
        } else {
            console.log('Columns:', Object.keys(data[0] || {}));
        }
    } else {
        console.log('Columns:', cols);
    }
}

checkSchema();
