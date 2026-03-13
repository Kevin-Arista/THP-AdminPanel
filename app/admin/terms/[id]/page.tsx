"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type TermRow = {
	id: number;
	term: string;
	definition: string;
	example: string;
	priority: number;
	term_type_id: number | null;
	created_datetime_utc: string | null;
	modified_datetime_utc: string | null;
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

const textareaStyle: React.CSSProperties = {
	...inputStyle,
	resize: "vertical",
	minHeight: "90px",
	fontFamily: "inherit",
	lineHeight: 1.5,
};

export default function EditTermPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();

	const [termRow, setTermRow] = useState<TermRow | null>(null);
	const [term, setTerm] = useState("");
	const [definition, setDefinition] = useState("");
	const [example, setExample] = useState("");
	const [priority, setPriority] = useState(0);
	const [termTypeId, setTermTypeId] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function load() {
			const supabase = createClient();
			const { data, error } = await supabase
				.from("terms")
				.select(
					"id, term, definition, example, priority, term_type_id, created_datetime_utc, modified_datetime_utc",
				)
				.eq("id", params.id)
				.single();

			if (error || !data) {
				setError("Term not found.");
				setLoading(false);
				return;
			}

			const row = data as TermRow;
			setTermRow(row);
			setTerm(row.term ?? "");
			setDefinition(row.definition ?? "");
			setExample(row.example ?? "");
			setPriority(row.priority ?? 0);
			setTermTypeId(row.term_type_id != null ? String(row.term_type_id) : "");
			setLoading(false);
		}
		load();
	}, [params.id]);

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		if (!term.trim()) {
			setError("Term is required.");
			return;
		}
		if (!definition.trim()) {
			setError("Definition is required.");
			return;
		}
		if (!example.trim()) {
			setError("Example is required.");
			return;
		}

		setSaving(true);
		setError(null);

		const res = await fetch(`/api/admin/terms/${params.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				term: term.trim(),
				definition: definition.trim(),
				example: example.trim(),
				priority,
				term_type_id: termTypeId !== "" ? Number(termTypeId) : null,
			}),
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			setError(body.error ?? "Save failed.");
			setSaving(false);
			return;
		}

		router.push("/admin/terms");
		router.refresh();
	}

	async function handleDelete() {
		if (!confirm("Permanently delete this term?")) return;
		setDeleting(true);
		setError(null);

		const res = await fetch(`/api/admin/terms/${params.id}`, {
			method: "DELETE",
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			setError(body.error ?? "Delete failed.");
			setDeleting(false);
			return;
		}

		router.push("/admin/terms");
		router.refresh();
	}

	if (loading) {
		return <p style={{ color: "#5a5a7a", fontSize: "0.9rem" }}>Loading…</p>;
	}

	return (
		<div style={{ maxWidth: "560px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "0.75rem",
					marginBottom: "1.75rem",
				}}>
				<Link
					href="/admin/terms"
					style={{ color: "#5a5a7a", fontSize: "0.85rem", textDecoration: "none" }}>
					← Terms
				</Link>
				<span style={{ color: "#2a2a4a" }}>/</span>
				<h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f0f0ff" }}>
					Edit Term
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

				<FormField label="Term *">
					<input
						type="text"
						value={term}
						onChange={(e) => setTerm(e.target.value)}
						placeholder="e.g. Punchline"
						required
						style={inputStyle}
					/>
				</FormField>

				<FormField label="Definition *">
					<textarea
						value={definition}
						onChange={(e) => setDefinition(e.target.value)}
						placeholder="A clear definition of the term…"
						required
						style={textareaStyle}
					/>
				</FormField>

				<FormField label="Example *">
					<textarea
						value={example}
						onChange={(e) => setExample(e.target.value)}
						placeholder="An example sentence or usage…"
						required
						style={textareaStyle}
					/>
				</FormField>

				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: "1rem",
					}}>
					<FormField label="Priority">
						<input
							type="number"
							value={priority}
							onChange={(e) => setPriority(Number(e.target.value))}
							style={inputStyle}
						/>
					</FormField>

					<FormField label="Term Type ID (optional)">
						<input
							type="number"
							value={termTypeId}
							onChange={(e) => setTermTypeId(e.target.value)}
							placeholder="—"
							style={inputStyle}
						/>
					</FormField>
				</div>

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
						href="/admin/terms"
						style={{
							padding: "0.65rem 1.25rem",
							fontSize: "0.9rem",
							color: "#8888aa",
							border: "1px solid #2a2a4a",
							borderRadius: "8px",
							textAlign: "center",
							textDecoration: "none",
						}}>
						Cancel
					</Link>
				</div>

				{termRow && (
					<p style={{ fontSize: "0.7rem", color: "#3a3a5a", marginTop: "0.5rem" }}>
						ID: {termRow.id}
						{termRow.modified_datetime_utc && (
							<>
								{" · "}Last modified:{" "}
								{new Date(termRow.modified_datetime_utc).toLocaleDateString(undefined, {
									year: "numeric",
									month: "short",
									day: "numeric",
								})}
							</>
						)}
					</p>
				)}
			</form>
		</div>
	);
}
