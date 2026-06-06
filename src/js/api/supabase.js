import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://loyewnmzvvizkitrpnlt.supabase.co";
const supabaseKey = "sb_publishable_a0SNy3NBzn-xQ8x2WBpw0g_gQe-4auH";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
