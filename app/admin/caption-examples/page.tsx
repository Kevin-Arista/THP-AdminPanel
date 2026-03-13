import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function formatDate(iso: string | null) {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export default async function CaptionExamplesPage() {
	const supabase = await createClient();

	const { data: examples, error } = await supabase
		.from("caption_examples")
		.select("id, caption, priority, image_id, created_datetime_utc")
		.order("priority", { ascending: false })
		.order("created_datetime_utc", { ascending: false });

	return (
		<div style={{ maxWidth: "1100px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					justifyContent: "space-between",
					marginBottom: "1.5rem",
					flexWrap: "wrap",
					gap: "0.75rem",
				}}>
				<div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
					<h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f0f0ff" }}>
						Caption Examples
					</h1>
					<span style={{ fontSize: "0.8rem", color: "#5a5a7a" }}>
						{examples?.length ?? 0} total
					</span>
				</div>
				<Link
					href="/admin/caption-examples/new"
					style={{
						padding: "0.5rem 1rem",
						fontSize: "0.85rem",
						fontWeight: 600,
						color: "#0d0d1a",
						background: "#4ecdc4",
						borderRadius: "8px",
						textDecoration: "none",
					}}>
					+ New Caption Example
				</Link>
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
						gridTemplateColumns: "64px 1fr 72px 200px 110px 72px",
						gap: "1rem",
						padding: "0.6rem 1.25rem",
						background: "#11112a",
						borderBottom: "1px solid #2a2a4a",
						fontSize: "0.7rem",
						fontWeight: 700,
						letterSpacing: "0.08em",
						textTransform: "uppercase",
						color: "#5a5a7a",
					}}>
					<span>ID</span>
					<span>Caption</span>
					<span>Priority</span>
					<span>Image ID</span>
					<span>Created</span>
					<span></span>
				</div>

				{!examples || examples.length === 0 ? (
					<p
						style={{
							color: "#5a5a7a",
							padding: "1.5rem 1.25rem",
							fontSize: "0.85rem",
						}}>
						No caption examples found.
					</p>
				) : (
					examples.map((ex, i) => {
						const caption = ex.caption ?? "";
						const truncated =
							caption.length > 60 ? caption.slice(0, 60) + "…" : caption;

						return (
							<div
								key={ex.id}
								style={{
									display: "grid",
									gridTemplateColumns: "64px 1fr 72px 200px 110px 72px",
									gap: "1rem",
									padding: "0.75rem 1.25rem",
									borderBottom: i < examples.length - 1 ? "1px solid #1e1e3a" : "none",
									alignItems: "center",
									fontSize: "0.83rem",
								}}>
								<span
									style={{ color: "#5a5a7a", fontVariantNumeric: "tabular-nums" }}>
									{ex.id}
								</span>
								<span style={{ color: "#e0e0f0", fontSize: "0.82rem", lineHeight: 1.4 }}>
									{truncated || <span style={{ color: "#3a3a5a" }}>—</span>}
								</span>
								<span style={{ color: "#e0e0f0" }}>{ex.priority ?? 0}</span>
								<span
									style={{
										color: "#5a5a7a",
										fontSize: "0.75rem",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}>
									{ex.image_id ?? "—"}
								</span>
								<span style={{ color: "#5a5a7a", fontSize: "0.78rem" }}>
									{formatDate(ex.created_datetime_utc ?? null)}
								</span>
								<Link
									href={`/admin/caption-examples/${ex.id}`}
									style={{
										color: "#4ecdc4",
										fontSize: "0.78rem",
										fontWeight: 600,
										textDecoration: "none",
									}}>
									Edit
								</Link>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
