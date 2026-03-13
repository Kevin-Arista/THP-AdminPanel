import { createClient } from "@/lib/supabase/server";

function formatDate(iso: string | null) {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export default async function HumorFlavorsPage() {
	const supabase = await createClient();

	const { data: flavors, error } = await supabase
		.from("humor_flavors")
		.select("id, slug, description, created_datetime_utc")
		.order("id", { ascending: true });

	return (
		<div style={{ maxWidth: "900px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					gap: "1rem",
					marginBottom: "1.5rem",
				}}>
				<h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f0f0ff" }}>
					Humor Flavors
				</h1>
				<span style={{ fontSize: "0.8rem", color: "#5a5a7a" }}>
					{flavors?.length ?? 0} total · read-only
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
						gridTemplateColumns: "60px 160px 1fr 110px",
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
					<span>Slug</span>
					<span>Description</span>
					<span>Created</span>
				</div>

				{!flavors || flavors.length === 0 ? (
					<p
						style={{
							color: "#5a5a7a",
							padding: "1.5rem 1.25rem",
							fontSize: "0.85rem",
						}}>
						No humor flavors found.
					</p>
				) : (
					flavors.map((f, i) => (
						<div
							key={f.id}
							style={{
								display: "grid",
								gridTemplateColumns: "60px 160px 1fr 110px",
								gap: "1rem",
								padding: "0.75rem 1.25rem",
								borderBottom:
									i < flavors.length - 1 ? "1px solid #1e1e3a" : "none",
								alignItems: "center",
								fontSize: "0.83rem",
							}}>
							<span style={{ color: "#5a5a7a", fontSize: "0.78rem" }}>
								{f.id}
							</span>
							<span
								style={{
									color: "#4ecdc4",
									fontFamily: "monospace",
									fontSize: "0.82rem",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap" as const,
								}}>
								{f.slug ?? "—"}
							</span>
							<span
								style={{
									color: "#e0e0f0",
									lineHeight: 1.4,
									fontSize: "0.82rem",
								}}>
								{f.description ?? (
									<span style={{ color: "#3a3a5a", fontStyle: "italic" }}>
										No description
									</span>
								)}
							</span>
							<span style={{ color: "#5a5a7a", fontSize: "0.78rem" }}>
								{formatDate(f.created_datetime_utc ?? null)}
							</span>
						</div>
					))
				)}
			</div>
		</div>
	);
}
