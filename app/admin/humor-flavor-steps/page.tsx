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

export default async function HumorFlavorStepsPage() {
	const supabase = await createClient();

	const { data: steps, error } = await supabase
		.from("humor_flavor_steps")
		.select(
			"id, humor_flavor_id, order_by, description, llm_model_id, llm_system_prompt, llm_user_prompt, created_datetime_utc",
		)
		.order("humor_flavor_id", { ascending: true })
		.order("order_by", { ascending: true });

	return (
		<div style={{ maxWidth: "1200px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					gap: "1rem",
					marginBottom: "1.5rem",
				}}>
				<h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f0f0ff" }}>
					Humor Flavor Steps
				</h1>
				<span style={{ fontSize: "0.8rem", color: "#5a5a7a" }}>
					{steps?.length ?? 0} total · read-only
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
						gridTemplateColumns: "60px 80px 60px 1fr 100px 200px 110px",
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
					<span>Flavor ID</span>
					<span>Order</span>
					<span>Description</span>
					<span>Model ID</span>
					<span>Prompts</span>
					<span>Created</span>
				</div>

				{!steps || steps.length === 0 ? (
					<p
						style={{
							color: "#5a5a7a",
							padding: "1.5rem 1.25rem",
							fontSize: "0.85rem",
						}}>
						No humor flavor steps found.
					</p>
				) : (
					steps.map((s, i) => (
						<div
							key={s.id}
							style={{
								display: "grid",
								gridTemplateColumns: "60px 80px 60px 1fr 100px 200px 110px",
								gap: "1rem",
								padding: "0.75rem 1.25rem",
								borderBottom:
									i < steps.length - 1 ? "1px solid #1e1e3a" : "none",
								alignItems: "start",
								fontSize: "0.83rem",
							}}>
							<span style={{ color: "#5a5a7a", fontSize: "0.78rem" }}>
								{s.id}
							</span>
							<span style={{ color: "#a78bfa", fontSize: "0.82rem" }}>
								{s.humor_flavor_id ?? "—"}
							</span>
							<span
								style={{
									color: "#4ecdc4",
									fontWeight: 600,
									fontSize: "0.82rem",
									textAlign: "center" as const,
								}}>
								{s.order_by ?? "—"}
							</span>
							<span
								style={{
									color: "#e0e0f0",
									lineHeight: 1.4,
									fontSize: "0.82rem",
								}}>
								{s.description ?? (
									<span style={{ color: "#3a3a5a", fontStyle: "italic" }}>
										No description
									</span>
								)}
							</span>
							<span
								style={{
									color: "#8888aa",
									fontFamily: "monospace",
									fontSize: "0.75rem",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap" as const,
								}}>
								{s.llm_model_id ?? "—"}
							</span>
							<div style={{ display: "flex", flexDirection: "column" as const, gap: "4px" }}>
								{s.llm_system_prompt && (
									<span
										style={{
											color: "#5a5a7a",
											fontSize: "0.72rem",
											lineHeight: 1.35,
										}}
										title={s.llm_system_prompt}>
										<span
											style={{
												color: "#3a3a5a",
												fontWeight: 700,
												textTransform: "uppercase" as const,
												fontSize: "0.65rem",
												letterSpacing: "0.06em",
											}}>
											sys:{" "}
										</span>
										{truncate(s.llm_system_prompt, 60)}
									</span>
								)}
								{s.llm_user_prompt && (
									<span
										style={{
											color: "#5a5a7a",
											fontSize: "0.72rem",
											lineHeight: 1.35,
										}}
										title={s.llm_user_prompt}>
										<span
											style={{
												color: "#3a3a5a",
												fontWeight: 700,
												textTransform: "uppercase" as const,
												fontSize: "0.65rem",
												letterSpacing: "0.06em",
											}}>
											usr:{" "}
										</span>
										{truncate(s.llm_user_prompt, 60)}
									</span>
								)}
								{!s.llm_system_prompt && !s.llm_user_prompt && (
									<span style={{ color: "#3a3a5a" }}>—</span>
								)}
							</div>
							<span style={{ color: "#5a5a7a", fontSize: "0.78rem" }}>
								{formatDate(s.created_datetime_utc ?? null)}
							</span>
						</div>
					))
				)}
			</div>
		</div>
	);
}
