
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkFunction() {
    console.log('--- RPC Debugger ---')
    console.log('URL:', supabaseUrl)

    try {
        const { data: functions, error: funcError } = await supabase
            .from('pg_proc')
            .select('proname, proargnames')
            .ilike('proname', '%admin_create_user%')

        if (funcError) {
            console.error('Error querying pg_proc:', funcError.message)
        } else {
            console.log('Matching functions found:', JSON.stringify(functions, null, 2))
        }

        // Try to trigger a schema reload if we are super admin (service role usually is)
        console.log('Attempting schema reload...')
        const { error: reloadError } = await supabase.rpc('log_audit_action', {
            _action: 'schema_reload_check',
            _entity_type: 'system'
        })
        console.log('Schema reload attempt (via random RPC) error:', reloadError ? reloadError.message : 'OK')

    } catch (e: any) {
        console.error('Unexpected error:', e.message)
    }
}

checkFunction()
