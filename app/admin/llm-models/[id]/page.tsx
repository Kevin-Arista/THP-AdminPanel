"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type LlmModel = {
	id: number;
	name: string | null;
	llm_provider_id: number | null;
	provider_model_id: string | null;
	is_temperature_supported: boolean | null;
	created_datetime_utc: string | null;
};

function FormField({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
			<label
				style={{
					fontSize: "0.75rem",
					fontWeight: 600,
					color: "#8888aa",
					letterSpacing: "0.05em",
				}}>
				{label}
			</label>
			{children}
		</div>
	);
}

const inputStyle: React.CSSProperties = {
	width: "100%",
	padding: "0.6rem 0.75rem",
	fontSize: "0.875rem",
	color: "#e0e0f0",
	background: "#11112a",
	border: "1px solid #2a2a4a",
	borderRadius: "8px",
	outline: "none",
};

export default function EditLlmModelPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const [model, setModel] = useState<LlmModel | null>(null);
	const [name, setName] = useState("");
	const [providerModelId, setProviderModelId] = useState("");
	const [llmProviderId, setLlmProviderId] = useState("");
	const [isTemperatureSupported, setIsTemperatureSupported] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function load() {
			const supabase = createClient();
			const { data, error } = await supabase
				.from("llm_models")
				.select("*")
				.eq("id", parseInt(params.id, 10))
				.single();

			if (error || !data) {
				setError("Model not found.");
				setLoading(false);
				return;
			}

			const row = data as LlmModel;
			setModel(row);
			setName(row.name ?? "");
			setProviderModelId(row.provider_model_id ?? "");
			setLlmProviderId(row.llm_provider_id != null ? String(row.llm_provider_id) : "");
			setIsTemperatureSupported(row.is_temperature_supported ?? false);
			setLoading(false);
		}
		load();
	}, [params.id]);

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) {
			setError("Name is required.");
			return;
		}
		if (!providerModelId.trim()) {
			setError("Provider Model ID is required.");
			return;
		}
		if (!llmProviderId.trim()) {
			setError("Provider ID is required.");
			return;
		}
		setSaving(true);
		setError(null);

		const res = await fetch(`/api/admin/llm-models/${params.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: name.trim(),
				provider_model_id: providerModelId.trim(),
				llm_provider_id: parseInt(llmProviderId, 10),
				is_temperature_supported: isTemperatureSupported,
			}),
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			setError(body.error ?? "Save failed.");
			setSaving(false);
			return;
		}

		router.push("/admin/llm-models");
		router.refresh();
	}

	async function handleDelete() {
		if (!confirm("Permanently delete this model?")) return;
		setDeleting(true);
		setError(null);

		const res = await fetch(`/api/admin/llm-models/${params.id}`, {
			method: "DELETE",
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			setError(body.error ?? "Delete failed.");
			setDeleting(false);
			return;
		}

		router.push("/admin/llm-models");
		router.refresh();
	}

	if (loading) {
		return <p style={{ color: "#5a5a7a", fontSize: "0.9rem" }}>Loading…</p>;
	}

	return (
		<div style={{ maxWidth: "480px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "0.75rem",
					marginBottom: "1.75rem",
				}}>
				<Link
					href="/admin/llm-models"
					style={{ color: "#5a5a7a", fontSize: "0.85rem" }}>
					← LLM Models
				</Link>
				<span style={{ color: "#2a2a4a" }}>/</span>
				<h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f0f0ff" }}>
					Edit Model
				</h1>
			</div>

			<form
				onSubmit={handleSave}
				style={{
					background: "#16213e",
					border: "1px solid #2a2a4a",
					borderRadius: "12px",
					padding: "1.75rem",
					display: "flex",
					flexDirection: "column",
					gap: "1.25rem",
				}}>
				{error && (
					<div
						style={{
							color: "#ff6b6b",
							background: "rgba(255,107,107,0.1)",
							border: "1px solid rgba(255,107,107,0.3)",
							borderRadius: "8px",
							padding: "0.6rem 0.9rem",
							fontSize: "0.85rem",
						}}>
						{error}
					</div>
				)}

				<FormField label="Name *">
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="e.g. GPT-4o"
						required
						style={inputStyle}
					/>
				</FormField>

				<FormField label="Provider Model ID *">
					<input
						type="text"
						value={providerModelId}
						onChange={(e) => setProviderModelId(e.target.value)}
						placeholder="e.g. gpt-4o-2024-08-06"
						required
						style={inputStyle}
					/>
				</FormField>

				<FormField label="Provider ID *">
					<input
						type="number"
						value={llmProviderId}
						onChange={(e) => setLlmProviderId(e.target.value)}
						placeholder="e.g. 1"
						required
						min={1}
						style={inputStyle}
					/>
				</FormField>

				<FormField label="Temperature Supported">
					<label
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.6rem",
							cursor: "pointer",
							fontSize: "0.875rem",
							color: "#e0e0f0",
						}}>
						<input
							type="checkbox"
							checked={isTemperatureSupported}
							onChange={(e) => setIsTemperatureSupported(e.target.checked)}
							style={{ width: "16px", height: "16px", accentColor: "#4ecdc4" }}
						/>
						Model supports temperature parameter
					</label>
				</FormField>

				<div
					style={{
						display: "flex",
						gap: "0.75rem",
						marginTop: "0.25rem",
						flexWrap: "wrap",
					}}>
					<button
						type="submit"
						disabled={saving || deleting}
						style={{
							flex: 1,
							padding: "0.65rem",
							fontSize: "0.9rem",
							fontWeight: 600,
							color: saving ? "#5a5a7a" : "#0d0d1a",
							background: saving ? "#2a2a4a" : "#4ecdc4",
							border: "none",
							borderRadius: "8px",
							cursor: saving || deleting ? "default" : "pointer",
							transition: "background 0.2s",
						}}>
						{saving ? "Saving…" : "Save Changes"}
					</button>

					<button
						type="button"
						onClick={handleDelete}
						disabled={deleting || saving}
						style={{
							padding: "0.65rem 1.25rem",
							fontSize: "0.9rem",
							fontWeight: 600,
							color: deleting ? "#5a5a7a" : "#ff6b6b",
							background: "transparent",
							border: `1px solid ${deleting ? "#2a2a4a" : "rgba(255,107,107,0.4)"}`,
							borderRadius: "8px",
							cursor: deleting || saving ? "default" : "pointer",
						}}>
						{deleting ? "Deleting…" : "Delete"}
					</button>

					<Link
						href="/admin/llm-models"
						style={{
							padding: "0.65rem 1.25rem",
							fontSize: "0.9rem",
							color: "#8888aa",
							border: "1px solid #2a2a4a",
							borderRadius: "8px",
							textAlign: "center",
						}}>
						Cancel
					</Link>
				</div>

				{model && (
					<p style={{ fontSize: "0.7rem", color: "#3a3a5a", marginTop: "0.5rem" }}>
						ID: {model.id}
					</p>
				)}
			</form>
		</div>
	);
}
