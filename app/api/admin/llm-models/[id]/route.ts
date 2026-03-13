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

// PUT /api/admin/llm-models/[id] — update an LLM model
export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await assertSuperadmin();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;
	const body = await request.json().catch(() => null);
	if (!body?.name || !body?.llm_provider_id || !body?.provider_model_id) {
		return NextResponse.json(
			{ error: "name, llm_provider_id, and provider_model_id are required" },
			{ status: 400 },
		);
	}

	const admin = createAdminClient();
	const { data, error } = await admin
		.from("llm_models")
		.update({
			name: body.name,
			llm_provider_id: body.llm_provider_id,
			provider_model_id: body.provider_model_id,
			is_temperature_supported: body.is_temperature_supported ?? false,
		})
		.eq("id", id)
		.select()
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json(data);
}

// DELETE /api/admin/llm-models/[id] — delete an LLM model
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await assertSuperadmin();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;

	const admin = createAdminClient();
	const { error } = await admin.from("llm_models").delete().eq("id", id);

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ success: true });
}
