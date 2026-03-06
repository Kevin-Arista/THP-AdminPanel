/**
 * seed-superadmin.ts
 *
 * One-time bootstrap script to grant superadmin access to a user.
 *
 * This solves the chicken-and-egg problem: the admin panel requires
 * profiles.is_superadmin == true, but you need to be inside the panel
 * to set that flag. Instead, this script uses the Supabase SERVICE ROLE
 * key (which bypasses RLS) to directly update the profiles table.
 *
 * Usage:
 *   1. Copy your service role key from:
 *      Supabase Dashboard → Settings → API → service_role (secret)
 *   2. Add it to .env.local:
 *      SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *   3. Sign in to the admin panel via Google once (this creates your profile row)
 *   4. Run:
 *      npx tsx scripts/seed-superadmin.ts your@email.com
 *
 * The script matches on the email column of the profiles table.
 * If your profiles table uses a different identifier, adjust accordingly.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
	console.error(
		"❌  Missing env vars. Ensure .env.local has:\n" +
			"    NEXT_PUBLIC_SUPABASE_URL\n" +
			"    SUPABASE_SERVICE_ROLE_KEY",
	);
	process.exit(1);
}

if (SERVICE_ROLE_KEY === "your-service-role-key-here") {
	console.error(
		"❌  Please replace 'your-service-role-key-here' in .env.local with your real service role key.\n" +
			"    Find it at: Supabase Dashboard → Settings → API → service_role",
	);
	process.exit(1);
}

const targetEmail = process.argv[2];
if (!targetEmail) {
	console.error("❌  Usage: npx tsx scripts/seed-superadmin.ts your@email.com");
	process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
	console.log(`\n🔍  Looking for profile with email: ${targetEmail}\n`);

	// Try matching on an 'email' column first
	const { data: byEmail, error: emailErr } = await admin
		.from("profiles")
		.select("id, email, is_superadmin")
		.eq("email", targetEmail)
		.maybeSingle();

	if (emailErr) {
		console.error("❌  Query error:", emailErr.message);
		process.exit(1);
	}

	let profileId: string | null = null;

	if (byEmail) {
		profileId = byEmail.id;
		console.log(`✅  Found profile by email column (id: ${profileId})`);
		if (byEmail.is_superadmin) {
			console.log("ℹ️   Already a superadmin — nothing to do.");
			process.exit(0);
		}
	} else {
		// Fall back to auth.users lookup via the admin API
		console.log(
			"   No 'email' column match. Trying auth.users lookup…",
		);

		const { data: usersData, error: usersErr } =
			await admin.auth.admin.listUsers();
		if (usersErr) {
			console.error("❌  Could not list auth users:", usersErr.message);
			process.exit(1);
		}

		const matchedUser = usersData.users.find(
			(u) => u.email?.toLowerCase() === targetEmail.toLowerCase(),
		);

		if (!matchedUser) {
			console.error(
				`❌  No auth user found with email '${targetEmail}'.\n` +
					"    Make sure you've signed in at least once via Google to create your profile.",
			);
			process.exit(1);
		}

		profileId = matchedUser.id;
		console.log(`✅  Found auth user (id: ${profileId})`);

		// Check if profile row exists
		const { data: profileCheck } = await admin
			.from("profiles")
			.select("id, is_superadmin")
			.eq("id", profileId)
			.maybeSingle();

		if (!profileCheck) {
			console.error(
				`❌  Auth user exists but no profile row found for id '${profileId}'.\n` +
					"    Sign in to the admin panel at least once to create the profile row,\n" +
					"    then re-run this script.",
			);
			process.exit(1);
		}

		if (profileCheck.is_superadmin) {
			console.log("ℹ️   Already a superadmin — nothing to do.");
			process.exit(0);
		}
	}

	// Grant superadmin
	const { error: updateErr } = await admin
		.from("profiles")
		.update({ is_superadmin: true })
		.eq("id", profileId!);

	if (updateErr) {
		console.error("❌  Update failed:", updateErr.message);
		process.exit(1);
	}

	console.log(`\n🎉  Success! ${targetEmail} is now a superadmin.\n`);
	console.log("    You can now sign in at http://localhost:3001/login\n");
}

main();
