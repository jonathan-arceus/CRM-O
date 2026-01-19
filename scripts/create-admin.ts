
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdmin() {
  const email = 'admin@example.com'
  const password = 'superuser123'
  const fullName = 'Super Admin'

  console.log(`Creating user ${email}...`)

  // 1. Create the user in Auth
  const { data: user, error: createUserError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName
    }
  })

  if (createUserError) {
    console.error('Error creating user:', createUserError.message)
    // If user already exists, try to get their ID to ensure role assignment
    if (createUserError.message.includes('already registered')) {
        console.log('User already exists, fetching details...')
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existingUser = users.find(u => u.email === email)
        if (existingUser) {
            await assignRole(existingUser.id)
            return
        }
    }
    return
  }

  if (!user.user) {
    console.error('User creation failed, no user returned')
    return
  }

  console.log('User created:', user.user.id)
  await assignRole(user.user.id)
}

async function assignRole(userId: string) {
    // 2. Assign super_admin role
    // Default Organization ID from migration: 00000000-0000-0000-0000-000000000001
    // Super Admin Role ID from migration: 00000000-0000-0000-0001-000000000001

    const text = `
    INSERT INTO public.user_dynamic_roles (user_id, organization_id, role_id)
    VALUES ($1, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001')
    ON CONFLICT (user_id, organization_id) DO UPDATE 
    SET role_id = '00000000-0000-0000-0001-000000000001';
    `

    // We can't use supabase.from().insert() easily if we want to force this specific ID insertion/upsert cleanly 
    // without worrying about RLS if we were using anon key, but we are using service key so RLS is bypassed.
    // However, the RPC interface or just direct table manipulation is fine.
    
    const { error: roleError } = await supabase
        .from('user_dynamic_roles')
        .upsert({
            user_id: userId,
            organization_id: '00000000-0000-0000-0000-000000000001',
            role_id: '00000000-0000-0000-0001-000000000001'
        }, { onConflict: 'user_id, organization_id' })

    if (roleError) {
        console.error('Error assigning role:', roleError.message, roleError.details)
    } else {
        console.log('Super admin role assigned successfully.')
        console.log('\nLogin credentials:')
        console.log('Email: admin@example.com')
        console.log('Password: superuser123')
    }
}

createAdmin()
