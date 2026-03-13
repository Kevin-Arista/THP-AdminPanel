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

export default async function LlmModelsPage() {
	const supabase = await createClient();

	const [{ data: models, error }, { data: providers }] = await Promise.all([
		supabase
			.from("llm_models")
			.select("*")
			.order("id", { ascending: true }),
		supabase.from("llm_providers").select("id, name"),
	]);

	const providerMap: Record<number, string> = {};
	(providers ?? []).forEach((p: { id: number; name: string | null }) => {
		providerMap[p.id] = p.name ?? String(p.id);
	});

	return (
		<div style={{ maxWidth: "1000px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: "1.5rem",
					gap: "1rem",
					flexWrap: "wrap",
				}}>
				<div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
					<h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f0f0ff" }}>
						LLM Models
					</h1>
					<span style={{ fontSize: "0.8rem", color: "#5a5a7a" }}>
						{models?.length ?? 0} total
					</span>
				</div>
				<Link
					href="/admin/llm-models/new"
					style={{
						padding: "0.5rem 1.25rem",
						fontSize: "0.85rem",
						fontWeight: 600,
						color: "#0d0d1a",
						background: "#4ecdc4",
						borderRadius: "8px",
						boxShadow: "0 0 12px rgba(78,205,196,0.3)",
					}}>
					+ New Model
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
						gridTemplateColumns: "50px 1fr 120px 1fr 80px 110px 50px",
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
					<span>Name</span>
					<span>Provider</span>
					<span>Model ID</span>
					<span>Temp</span>
					<span>Created</span>
					<span></span>
				</div>

				{/* Rows */}
				{!models || models.length === 0 ? (
					<p
						style={{
							color: "#5a5a7a",
							padding: "1.5rem 1.25rem",
							fontSize: "0.85rem",
						}}>
						No models found.
					</p>
				) : (
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					models.map((m: any, i: number) => (
						<div
							key={m.id}
							style={{
								display: "grid",
								gridTemplateColumns: "50px 1fr 120px 1fr 80px 110px 50px",
								gap: "1rem",
								padding: "0.75rem 1.25rem",
								borderBottom:
									i < models.length - 1 ? "1px solid #1e1e3a" : "none",
								alignItems: "center",
								fontSize: "0.83rem",
							}}>
							<span style={{ color: "#5a5a7a", fontSize: "0.78rem" }}>{m.id}</span>
							<span
								style={{
									color: "#e0e0f0",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}>
								{m.name ?? <span style={{ color: "#3a3a5a", fontStyle: "italic" }}>—</span>}
							</span>
							<span
								style={{
									color: "#8888aa",
									fontSize: "0.78rem",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}>
								{m.llm_provider_id != null
									? (providerMap[m.llm_provider_id] ?? String(m.llm_provider_id))
									: "—"}
							</span>
							<span
								style={{
									color: "#8888aa",
									fontSize: "0.78rem",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}>
								{m.provider_model_id ?? "—"}
							</span>
							<span>
								{m.is_temperature_supported ? (
									<span
										style={{
											fontSize: "0.7rem",
											fontWeight: 700,
											color: "#4ecdc4",
											background: "rgba(78,205,196,0.12)",
											border: "1px solid rgba(78,205,196,0.3)",
											borderRadius: "4px",
											padding: "2px 6px",
										}}>
										Yes
									</span>
								) : (
									<span style={{ color: "#3a3a5a", fontSize: "0.75rem" }}>No</span>
								)}
							</span>
							<span style={{ color: "#5a5a7a", fontSize: "0.78rem" }}>
								{formatDate(m.created_datetime_utc ?? null)}
							</span>
							<Link
								href={`/admin/llm-models/${m.id}`}
								style={{
									fontSize: "0.78rem",
									color: "#4ecdc4",
									fontWeight: 600,
								}}>
								Edit
							</Link>
						</div>
					))
				)}
			</div>
		</div>
	);
}
