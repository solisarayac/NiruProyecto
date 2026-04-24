import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://moutwozdogxbntanciwa.supabase.co";
const SUPABASE_ANON_KEY ="x"
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
