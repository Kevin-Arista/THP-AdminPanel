"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function NewLlmProviderPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) {
			setError("Name is required.");
			return;
		}
		setSaving(true);
		setError(null);

		const res = await fetch("/api/admin/llm-providers", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: name.trim() }),
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			setError(body.error ?? "Failed to create provider.");
			setSaving(false);
			return;
		}

		router.push("/admin/llm-providers");
		router.refresh();
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
					href="/admin/llm-providers"
					style={{ color: "#5a5a7a", fontSize: "0.85rem" }}>
					← LLM Providers
				</Link>
				<span style={{ color: "#2a2a4a" }}>/</span>
				<h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f0f0ff" }}>
					New Provider
				</h1>
			</div>

			<form
				onSubmit={handleSubmit}
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
						placeholder="e.g. OpenAI"
						required
						style={inputStyle}
					/>
				</FormField>

				<div
					style={{
						display: "flex",
						gap: "0.75rem",
						marginTop: "0.25rem",
					}}>
					<button
						type="submit"
						disabled={saving}
						style={{
							flex: 1,
							padding: "0.65rem",
							fontSize: "0.9rem",
							fontWeight: 600,
							color: saving ? "#5a5a7a" : "#0d0d1a",
							background: saving ? "#2a2a4a" : "#4ecdc4",
							border: "none",
							borderRadius: "8px",
							cursor: saving ? "default" : "pointer",
							transition: "background 0.2s",
						}}>
						{saving ? "Creating…" : "Create Provider"}
					</button>

					<Link
						href="/admin/llm-providers"
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
			</form>
		</div>
	);
}
