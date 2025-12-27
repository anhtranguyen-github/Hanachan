
import { createClient } from './src/services/supabase/server';
import dotenv from 'dotenv';
dotenv.config();

async function checkUsers() {
    const supabase = createClient();
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
        console.error("Error fetching users:", error);
    } else {
        console.log("Users in DB:", data);
    }
}

checkUsers();
