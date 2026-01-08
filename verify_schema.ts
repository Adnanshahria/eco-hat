
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
    console.log("Checking if 'phone' column exists in 'users'...");

    // Try to select the 'phone' column specifically
    const { data, error } = await supabase
        .from("users")
        .select("phone")
        .limit(1);

    if (error) {
        console.error("Verification FAILED:", error.message);
        if (error.code === "PGRST204" || error.message.includes("does not exist")) {
            console.log("CONCLUSION: The 'phone' column is MISSING. The user HAS NOT run the repair_schema.sql yet.");
        } else {
            console.log("CONCLUSION: Some other error occurred.");
        }
    } else {
        console.log("Verification SUCCESS: 'phone' column found.");
        console.log("CONCLUSION: The user successfully ran the SQL.");
    }
}

checkColumn();
