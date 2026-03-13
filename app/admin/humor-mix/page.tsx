"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type HumorMixRow = {
	id: number;
	humor_flavor_id: number;
	caption_count: number;
	slug: string;
};

const inputStyle: React.CSSProperties = {
	width: "80px",
	padding: "0.6rem 0.75rem",
	fontSize: "0.875rem",
	color: "#e0e0f0",
	background: "#11112a",
	border: "1px solid #2a2a4a",
	borderRadius: "8px",
	outline: "none",
	textAlign: "center",
};

export default function HumorMixPage() {
	const [rows, setRows] = useState<HumorMixRow[]>([]);
	const [counts, setCounts] = useState<Record<number, number>>({});
	const [saving, setSaving] = useState<Record<number, boolean>>({});
	const [rowStatus, setRowStatus] = useState<Record<number, { ok: boolean; msg: string } | null>>(
		{},
	);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setLoadError(null);
		const supabase = createClient();

		const { data, error } = await supabase
			.from("humor_flavor_mix")
			.select("id, humor_flavor_id, caption_count, humor_flavors(slug)")
			.order("id", { ascending: true });

		if (error) {
			setLoadError(error.message);
			setLoading(false);
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const mapped: HumorMixRow[] = (data ?? []).map((r: any) => ({
			id: r.id,
			humor_flavor_id: r.humor_flavor_id,
			caption_count: r.caption_count ?? 0,
			slug: r.humor_flavors?.slug ?? String(r.humor_flavor_id),
		}));

		setRows(mapped);
		const initCounts: Record<number, number> = {};
		mapped.forEach((r) => {
			initCounts[r.id] = r.caption_count;
		});
		setCounts(initCounts);
		setLoading(false);
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	async function handleSave(id: number) {
		setSaving((prev) => ({ ...prev, [id]: true }));
		setRowStatus((prev) => ({ ...prev, [id]: null }));

		const res = await fetch(`/api/admin/humor-mix/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ caption_count: counts[id] ?? 0 }),
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			setRowStatus((prev) => ({
				...prev,
				[id]: { ok: false, msg: body.error ?? "Save failed." },
			}));
		} else {
			setRowStatus((prev) => ({ ...prev, [id]: { ok: true, msg: "Saved." } }));
			setTimeout(() => {
				setRowStatus((prev) => ({ ...prev, [id]: null }));
			}, 2000);
		}
		setSaving((prev) => ({ ...prev, [id]: false }));
	}

	return (
		<div style={{ maxWidth: "700px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					gap: "1rem",
					marginBottom: "1.5rem",
				}}>
				<h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f0f0ff" }}>
					Humor Mix
				</h1>
				{!loading && (
					<span style={{ fontSize: "0.8rem", color: "#5a5a7a" }}>
						{rows.length} flavor{rows.length !== 1 ? "s" : ""}
					</span>
				)}
			</div>

			{loadError && (
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
					{loadError}
				</div>
			)}

			{loading ? (
				<p style={{ color: "#5a5a7a", fontSize: "0.9rem" }}>Loading…</p>
			) : (
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
							gridTemplateColumns: "1fr 140px 120px",
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
						<span>Flavor Slug</span>
						<span>Caption Count</span>
						<span>Action</span>
					</div>

					{rows.length === 0 ? (
						<p
							style={{
								color: "#5a5a7a",
								padding: "1.5rem 1.25rem",
								fontSize: "0.85rem",
							}}>
							No humor mix entries found.
						</p>
					) : (
						rows.map((row, i) => {
							const isSaving = saving[row.id] ?? false;
							const status = rowStatus[row.id] ?? null;

							return (
								<div
									key={row.id}
									style={{
										display: "grid",
										gridTemplateColumns: "1fr 140px 120px",
										gap: "1rem",
										padding: "0.65rem 1.25rem",
										borderBottom:
											i < rows.length - 1 ? "1px solid #1e1e3a" : "none",
										alignItems: "center",
										fontSize: "0.83rem",
									}}>
									{/* Slug */}
									<span
										style={{
											color: "#e0e0f0",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}>
										{row.slug}
									</span>

									{/* Caption count input */}
									<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
										<input
											type="number"
											min={0}
											value={counts[row.id] ?? 0}
											onChange={(e) =>
												setCounts((prev) => ({
													...prev,
													[row.id]: parseInt(e.target.value, 10) || 0,
												}))
											}
											style={inputStyle}
										/>
									</div>

									{/* Action + status */}
									<div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
										<button
											onClick={() => handleSave(row.id)}
											disabled={isSaving}
											style={{
												padding: "0.4rem 0.9rem",
												fontSize: "0.8rem",
												fontWeight: 600,
												color: isSaving ? "#5a5a7a" : "#0d0d1a",
												background: isSaving ? "#2a2a4a" : "#4ecdc4",
												border: "none",
												borderRadius: "6px",
												cursor: isSaving ? "default" : "pointer",
												transition: "background 0.2s",
												whiteSpace: "nowrap",
											}}>
											{isSaving ? "Saving…" : "Save"}
										</button>
										{status && (
											<span
												style={{
													fontSize: "0.75rem",
													color: status.ok ? "#4ecdc4" : "#ff6b6b",
												}}>
												{status.msg}
											</span>
										)}
									</div>
								</div>
							);
						})
					)}
				</div>
			)}
		</div>
	);
}
