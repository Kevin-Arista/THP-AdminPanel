"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type EmailRow = {
	id: number;
	email_address: string;
	created_datetime_utc: string | null;
	modified_datetime_utc: string | null;
};

function formatDate(iso: string | null) {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
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

export default function WhitelistEmailsPage() {
	const [emails, setEmails] = useState<EmailRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [newEmail, setNewEmail] = useState("");
	const [adding, setAdding] = useState(false);
	const [addError, setAddError] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setLoadError(null);
		const supabase = createClient();

		const { data, error } = await supabase
			.from("whitelist_email_addresses")
			.select("*")
			.order("created_datetime_utc", { ascending: false });

		if (error) {
			setLoadError(error.message);
		} else {
			setEmails((data ?? []) as EmailRow[]);
		}
		setLoading(false);
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	async function handleAdd(e: React.FormEvent) {
		e.preventDefault();
		if (!newEmail.trim()) {
			setAddError("Email address is required.");
			return;
		}
		setAdding(true);
		setAddError(null);

		const res = await fetch("/api/admin/whitelist-emails", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email_address: newEmail.trim() }),
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			setAddError(body.error ?? "Failed to add email.");
			setAdding(false);
			return;
		}

		setNewEmail("");
		setAdding(false);
		await load();
	}

	async function handleDelete(id: number) {
		if (!confirm("Remove this email from the whitelist?")) return;
		setDeletingId(id);
		setDeleteError(null);

		const res = await fetch(`/api/admin/whitelist-emails/${id}`, {
			method: "DELETE",
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			setDeleteError(body.error ?? "Delete failed.");
			setDeletingId(null);
			return;
		}

		setDeletingId(null);
		await load();
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
					Whitelisted Emails
				</h1>
				{!loading && (
					<span style={{ fontSize: "0.8rem", color: "#5a5a7a" }}>
						{emails.length} total
					</span>
				)}
			</div>

			{/* Add form */}
			<form
				onSubmit={handleAdd}
				style={{
					background: "#16213e",
					border: "1px solid #2a2a4a",
					borderRadius: "12px",
					padding: "1.25rem 1.5rem",
					marginBottom: "1.5rem",
					display: "flex",
					flexDirection: "column",
					gap: "0.75rem",
				}}>
				<span
					style={{
						fontSize: "0.75rem",
						fontWeight: 600,
						color: "#8888aa",
						letterSpacing: "0.05em",
					}}>
					Add Email
				</span>
				<div style={{ display: "flex", gap: "0.75rem" }}>
					<input
						type="email"
						value={newEmail}
						onChange={(e) => setNewEmail(e.target.value)}
						placeholder="e.g. user@example.com"
						disabled={adding}
						style={{ ...inputStyle, flex: 1 }}
					/>
					<button
						type="submit"
						disabled={adding}
						style={{
							padding: "0.6rem 1.25rem",
							fontSize: "0.875rem",
							fontWeight: 600,
							color: adding ? "#5a5a7a" : "#0d0d1a",
							background: adding ? "#2a2a4a" : "#4ecdc4",
							border: "none",
							borderRadius: "8px",
							cursor: adding ? "default" : "pointer",
							transition: "background 0.2s",
							whiteSpace: "nowrap",
						}}>
						{adding ? "Adding…" : "Add"}
					</button>
				</div>
				{addError && (
					<div
						style={{
							color: "#ff6b6b",
							fontSize: "0.82rem",
						}}>
						{addError}
					</div>
				)}
			</form>

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

			{deleteError && (
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
					{deleteError}
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
							gridTemplateColumns: "1fr 130px 80px",
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
						<span>Email</span>
						<span>Created</span>
						<span>Delete</span>
					</div>

					{emails.length === 0 ? (
						<p
							style={{
								color: "#5a5a7a",
								padding: "1.5rem 1.25rem",
								fontSize: "0.85rem",
							}}>
							No whitelisted emails yet.
						</p>
					) : (
						emails.map((e, i) => {
							const isDeleting = deletingId === e.id;

							return (
								<div
									key={e.id}
									style={{
										display: "grid",
										gridTemplateColumns: "1fr 130px 80px",
										gap: "1rem",
										padding: "0.75rem 1.25rem",
										borderBottom:
											i < emails.length - 1 ? "1px solid #1e1e3a" : "none",
										alignItems: "center",
										fontSize: "0.83rem",
									}}>
									<span
										style={{
											color: "#e0e0f0",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}>
										{e.email_address}
									</span>
									<span style={{ color: "#5a5a7a", fontSize: "0.78rem" }}>
										{formatDate(e.created_datetime_utc)}
									</span>
									<button
										onClick={() => handleDelete(e.id)}
										disabled={isDeleting || deletingId !== null}
										style={{
											padding: "0.35rem 0.75rem",
											fontSize: "0.78rem",
											fontWeight: 600,
											color: isDeleting ? "#5a5a7a" : "#ff6b6b",
											background: "transparent",
											border: `1px solid ${isDeleting ? "#2a2a4a" : "rgba(255,107,107,0.4)"}`,
											borderRadius: "6px",
											cursor:
												isDeleting || deletingId !== null ? "default" : "pointer",
										}}>
										{isDeleting ? "…" : "Delete"}
									</button>
								</div>
							);
						})
					)}
				</div>
			)}
		</div>
	);
}
