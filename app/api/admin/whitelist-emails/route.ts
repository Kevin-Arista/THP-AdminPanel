import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertSuperadmin() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return null;

	const { data: profile } = await supabase
		.from("profiles")
		.select("is_superadmin")
		.eq("id", user.id)
		.single();

	return profile?.is_superadmin ? user : null;
}

// POST /api/admin/whitelist-emails — create a new whitelisted email address
export async function POST(request: Request) {
	const user = await assertSuperadmin();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	if (!body?.email_address) {
		return NextResponse.json(
			{ error: "email_address is required" },
			{ status: 400 },
		);
	}

	const admin = createAdminClient();
	const { data, error } = await admin
		.from("whitelist_email_addresses")
		.insert({
			email_address: body.email_address,
		})
		.select()
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json(data, { status: 201 });
}
