import { createClient } from "@/lib/supabase/server";

function formatDate(iso: string | null) {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function truncate(text: string | null, maxLen: number): string {
	if (!text) return "—";
	return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

export default async function CaptionRequestsPage() {
	const supabase = await createClient();

	const { data: requests, error } = await supabase
		.from("caption_requests")
		.select(
			`id, profile_id, image_id, created_datetime_utc,
			profiles (email),
			images (url, image_description)`,
		)
		.order("created_datetime_utc", { ascending: false });

	return (
		<div style={{ maxWidth: "1100px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					gap: "1rem",
					marginBottom: "1.5rem",
				}}>
				<h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f0f0ff" }}>
					Caption Requests
				</h1>
				<span style={{ fontSize: "0.8rem", color: "#5a5a7a" }}>
					{requests?.length ?? 0} total · read-only
				</span>
			</div>

			{error && (
				<div
					style={{
						color: "#ff6b6b",
						background: "rgba(255,107,107,0.1)",
						border: "1px solid rgba(255,107,107,0.3)",
						borderRadius: "8px",
						padding: "0.75rem 1rem",
						marginBottom: "1rem",
						fontSize: "0.85rem",
					}}>
					{error.message}
				</div>
			)}

			<div
				style={{
					background: "#16213e",
					border: "1px solid #2a2a4a",
					borderRadius: "12px",
					overflow: "hidden",
				}}>
				{/* Header */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "260px 1fr 1fr 110px",
						gap: "1rem",
						padding: "0.6rem 1.25rem",
						background: "#11112a",
						borderBottom: "1px solid #2a2a4a",
						fontSize: "0.7rem",
						fontWeight: 700,
						letterSpacing: "0.08em",
						textTransform: "uppercase" as const,
						color: "#5a5a7a",
					}}>
					<span>ID</span>
					<span>User</span>
					<span>Image</span>
					<span>Created</span>
				</div>

				{!requests || requests.length === 0 ? (
					<p
						style={{
							color: "#5a5a7a",
							padding: "1.5rem 1.25rem",
							fontSize: "0.85rem",
						}}>
						No caption requests found.
					</p>
				) : (
					requests.map((r, i) => {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const row = r as any;
						const profile = row.profiles as { email: string | null } | null;
						const image = row.images as {
							url: string | null;
							image_description: string | null;
						} | null;

						const imageLabel =
							image?.image_description
								? truncate(image.image_description, 50)
								: truncate(image?.url ?? null, 50);

						return (
							<div
								key={r.id}
								style={{
									display: "grid",
									gridTemplateColumns: "260px 1fr 1fr 110px",
									gap: "1rem",
									padding: "0.75rem 1.25rem",
									borderBottom:
										i < requests.length - 1 ? "1px solid #1e1e3a" : "none",
									alignItems: "center",
									fontSize: "0.83rem",
								}}>
								<span
									style={{
										color: "#5a5a7a",
										fontFamily: "monospace",
										fontSize: "0.72rem",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap" as const,
									}}
									title={r.id}>
									{r.id}
								</span>
								<span
									style={{
										color: "#e0e0f0",
										fontSize: "0.82rem",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap" as const,
									}}>
									{profile?.email ?? (
										<span
											style={{
												color: "#5a5a7a",
												fontFamily: "monospace",
												fontSize: "0.72rem",
											}}>
											{truncate(r.profile_id, 20)}
										</span>
									)}
								</span>
								<span
									style={{
										color: "#8888aa",
										fontSize: "0.8rem",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap" as const,
									}}>
									{imageLabel}
								</span>
								<span style={{ color: "#5a5a7a", fontSize: "0.78rem" }}>
									{formatDate(r.created_datetime_utc ?? null)}
								</span>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
