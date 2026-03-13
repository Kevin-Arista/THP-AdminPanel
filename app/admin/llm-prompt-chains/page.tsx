import { createClient } from "@/lib/supabase/server";

function formatDate(iso: string | null) {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export default async function LlmPromptChainsPage() {
	const supabase = await createClient();

	const { data: chains, error } = await supabase
		.from("llm_prompt_chains")
		.select("id, caption_request_id, created_datetime_utc")
		.order("created_datetime_utc", { ascending: false });

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
					LLM Prompt Chains
				</h1>
				<span style={{ fontSize: "0.8rem", color: "#5a5a7a" }}>
					{chains?.length ?? 0} total · read-only
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
						gridTemplateColumns: "1fr 1fr 130px",
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
					<span>Caption Request ID</span>
					<span>Created</span>
				</div>

				{!chains || chains.length === 0 ? (
					<p
						style={{
							color: "#5a5a7a",
							padding: "1.5rem 1.25rem",
							fontSize: "0.85rem",
						}}>
						No LLM prompt chains found.
					</p>
				) : (
					chains.map((c, i) => (
						<div
							key={c.id}
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr 130px",
								gap: "1rem",
								padding: "0.75rem 1.25rem",
								borderBottom:
									i < chains.length - 1 ? "1px solid #1e1e3a" : "none",
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
								title={c.id}>
								{c.id}
							</span>
							<span
								style={{
									color: "#8888aa",
									fontFamily: "monospace",
									fontSize: "0.72rem",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap" as const,
								}}
								title={c.caption_request_id ?? undefined}>
								{c.caption_request_id ?? (
									<span style={{ color: "#3a3a5a" }}>—</span>
								)}
							</span>
							<span style={{ color: "#5a5a7a", fontSize: "0.78rem" }}>
								{formatDate(c.created_datetime_utc ?? null)}
							</span>
						</div>
					))
				)}
			</div>
		</div>
	);
}
