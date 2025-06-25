import { createClient } from '@/lib/supabase/server';

export async function ThemeLoader() {
    const supabase = createClient();
    const { data } = await supabase
        .from('clan_settings')
        .select('primary_color')
        .eq('id', 1)
        .single();

    const primaryColor = data?.primary_color || '#afea6f'; // Fallback color

    const css = `:root { --primary: ${primaryColor}; }`;

    return (
        <style dangerouslySetInnerHTML={{ __html: css }} />
    );
} 