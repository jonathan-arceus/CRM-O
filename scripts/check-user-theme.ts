
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseServiceKey = 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MjA4MzY3MjcxMn0.fy590I0PtV6tWYYqGpK0R-r3rsagWq9t3LIzIYk4hG0EUlwpJb_ZO3p-yEhE7x-XrU4lxkr9p3TSOIUkGGtOqg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUser() {
    console.log('--- Super Admin Role Check ---')

    const { data: users } = await supabase.from('profiles').select('id, full_name, email')
    for (const user of users || []) {
        const { data: roles } = await supabase
            .from('user_dynamic_roles')
            .select('role_id, dynamic_roles(name)')
            .eq('user_id', user.id)

        console.log(`User: ${user.email}, Roles:`, roles?.map(r => r.dynamic_roles?.name))
    }
}

checkUser()
