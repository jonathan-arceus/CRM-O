
import fs from 'fs';
import path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

try {
    console.log('Reading .env.local...');
    const envLocalContent = fs.readFileSync(envLocalPath, 'utf-8');

    console.log('Parsing keys...');
    const localConfig: Record<string, string> = {};

    const lines = envLocalContent.split(/\r?\n/);
    lines.forEach(line => {
        // Match KEY="VALUE"
        const match = line.match(/^([A-Z_]+)="(.+)"$/);
        if (match) {
            localConfig[match[1]] = match[2];
        }
    });

    const apiUrl = localConfig['API_URL'];
    const anonKey = localConfig['ANON_KEY'];
    const serviceKey = localConfig['SERVICE_ROLE_KEY'];

    if (!apiUrl || !anonKey || !serviceKey) {
        console.error('Failed to find required keys in .env.local');
        console.log('Found keys:', Object.keys(localConfig));
        process.exit(1);
    }

    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Helper to update or append
    const updateKey = (key: string, value: string) => {
        const regex = new RegExp(`^${key}=.*`, 'm');
        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}="${value}"`);
        } else {
            envContent += `\n${key}="${value}"`;
        }
    };

    updateKey('VITE_SUPABASE_URL', apiUrl);
    updateKey('VITE_SUPABASE_PUBLISHABLE_KEY', anonKey);
    updateKey('SUPABASE_SERVICE_ROLE_KEY', serviceKey);

    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log('Successfully updated .env with local keys.');

} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
