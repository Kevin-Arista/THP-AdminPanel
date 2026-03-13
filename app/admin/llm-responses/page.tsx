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

export default async function LlmResponsesPage() {
	const supabase = await createClient();

	const { data: responses, error } = await supabase
		.from("llm_model_responses")
		.select(
			`id, created_datetime_utc, llm_model_id, humor_flavor_id, processing_time_seconds, llm_temperature, llm_model_response,
			llm_models (name)`,
		)
		.order("created_datetime_utc", { ascending: false })
		.limit(200);

	return (
		<div style={{ maxWidth: "1300px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					gap: "1rem",
					marginBottom: "1.5rem",
				}}>
				<h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f0f0ff" }}>
					LLM Responses
				</h1>
				<span style={{ fontSize: "0.8rem", color: "#5a5a7a" }}>
					{responses?.length ?? 0} shown (limit 200) · read-only
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
						gridTemplateColumns: "80px 160px 80px 90px 90px 1fr 110px",
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
					<span>Model</span>
					<span>Flavor ID</span>
					<span>Processing</span>
					<span>Temp</span>
					<span>Response</span>
					<span>Created</span>
				</div>

				{!responses || responses.length === 0 ? (
					<p
						style={{
							color: "#5a5a7a",
							padding: "1.5rem 1.25rem",
							fontSize: "0.85rem",
						}}>
						No LLM responses found.
					</p>
				) : (
					responses.map((r, i) => {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const row = r as any;
						const modelName = (row.llm_models as { name: string | null } | null)
							?.name;

						return (
							<div
								key={r.id}
								style={{
									display: "grid",
									gridTemplateColumns: "80px 160px 80px 90px 90px 1fr 110px",
									gap: "1rem",
									padding: "0.75rem 1.25rem",
									borderBottom:
										i < responses.length - 1 ? "1px solid #1e1e3a" : "none",
									alignItems: "center",
									fontSize: "0.83rem",
								}}>
								{/* ID — first 8 chars */}
								<span
									style={{
										color: "#5a5a7a",
										fontFamily: "monospace",
										fontSize: "0.72rem",
									}}
									title={r.id}>
									{r.id ? r.id.slice(0, 8) : "—"}
								</span>

								{/* Model name */}
								<span
									style={{
										color: "#4ecdc4",
										fontSize: "0.8rem",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap" as const,
									}}
									title={modelName ?? r.llm_model_id ?? undefined}>
									{modelName ?? r.llm_model_id ?? (
										<span style={{ color: "#3a3a5a" }}>—</span>
									)}
								</span>

								{/* Humor Flavor ID */}
								<span style={{ color: "#a78bfa", fontSize: "0.8rem" }}>
									{r.humor_flavor_id ?? (
										<span style={{ color: "#3a3a5a" }}>—</span>
									)}
								</span>

								{/* Processing time */}
								<span style={{ color: "#e0e0f0", fontSize: "0.8rem" }}>
									{r.processing_time_seconds != null ? (
										<>
											{typeof r.processing_time_seconds === "number"
												? r.processing_time_seconds.toFixed(2)
												: r.processing_time_seconds}
											<span style={{ color: "#5a5a7a", fontSize: "0.72rem" }}>
												{" "}
												s
											</span>
										</>
									) : (
										<span style={{ color: "#3a3a5a" }}>—</span>
									)}
								</span>

								{/* Temperature */}
								<span style={{ color: "#e0e0f0", fontSize: "0.8rem" }}>
									{r.llm_temperature != null ? (
										r.llm_temperature
									) : (
										<span style={{ color: "#3a3a5a" }}>—</span>
									)}
								</span>

								{/* Response preview */}
								<span
									style={{
										color: "#8888aa",
										fontSize: "0.78rem",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap" as const,
									}}
									title={r.llm_model_response ?? undefined}>
									{truncate(r.llm_model_response ?? null, 80)}
								</span>

								{/* Created */}
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
