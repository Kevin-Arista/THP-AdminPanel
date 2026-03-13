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

// PUT /api/admin/caption-examples/[id] — update a caption example
export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await assertSuperadmin();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;
	const numericId = parseInt(id, 10);
	const body = await request.json().catch(() => null);
	if (!body?.image_description || !body?.caption || !body?.explanation) {
		return NextResponse.json(
			{ error: "image_description, caption, and explanation are required" },
			{ status: 400 },
		);
	}

	const admin = createAdminClient();
	const { data, error } = await admin
		.from("caption_examples")
		.update({
			image_description: body.image_description,
			caption: body.caption,
			explanation: body.explanation,
			priority: body.priority ?? 0,
			image_id: body.image_id ?? null,
			modified_datetime_utc: new Date().toISOString(),
		})
		.eq("id", numericId)
		.select()
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json(data);
}

// DELETE /api/admin/caption-examples/[id] — delete a caption example
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await assertSuperadmin();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;
	const numericId = parseInt(id, 10);

	const admin = createAdminClient();
	const { error } = await admin
		.from("caption_examples")
		.delete()
		.eq("id", numericId);

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ success: true });
}
