"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Tab = "upload" | "url";
type Stage = "idle" | "presigning" | "uploading" | "registering" | "error";

const BASE_URL = "https://api.almostcrackd.ai";
const ACCEPTED_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
	"image/gif",
	"image/heic",
];
const STAGE_LABELS: Partial<Record<Stage, string>> = {
	presigning: "Getting upload URL...",
	uploading: "Uploading image...",
	registering: "Registering image...",
};

export default function NewImagePage() {
	const router = useRouter();
	const supabase = createClient();
	const [tab, setTab] = useState<Tab>("upload");

	// Upload tab state
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [stage, setStage] = useState<Stage>("idle");
	const [uploadError, setUploadError] = useState<string | null>(null);
	const previewUrlRef = useRef<string | null>(null);
	const isProcessing = ["presigning", "uploading", "registering"].includes(stage);

	// Shared fields
	const [description, setDescription] = useState("");
	const [isPublic, setIsPublic] = useState(false);

	// URL tab state
	const [url, setUrl] = useState("");
	const [urlSaving, setUrlSaving] = useState(false);
	const [urlError, setUrlError] = useState<string | null>(null);

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const selected = e.target.files?.[0] ?? null;
		if (previewUrlRef.current) {
			URL.revokeObjectURL(previewUrlRef.current);
			previewUrlRef.current = null;
		}
		setUploadError(null);
		setStage("idle");

		if (!selected) {
			setFile(null);
			setPreview(null);
			return;
		}

		const isHeic =
			selected.type === "image/heic" || selected.name.toLowerCase().endsWith(".heic");
		const validType = ACCEPTED_TYPES.includes(selected.type) || isHeic;

		if (!validType) {
			setFile(null);
			setPreview(null);
			setUploadError(
				"Unsupported file type. Please upload a JPEG, PNG, WebP, GIF, or HEIC image.",
			);
			setStage("error");
			return;
		}

		const objUrl = URL.createObjectURL(selected);
		previewUrlRef.current = objUrl;
		setFile(selected);
		setPreview(objUrl);
	}

	async function handleUpload() {
		if (!file) return;

		try {
			const { data: sessionData } = await supabase.auth.getSession();
			const token = sessionData.session?.access_token;
			if (!token) {
				setUploadError("Session expired, please sign in again.");
				setStage("error");
				return;
			}

			const authHeaders = {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			};

			// Step 1: Get presigned URL
			setStage("presigning");
			const presignRes = await fetch(`${BASE_URL}/pipeline/generate-presigned-url`, {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify({ contentType: file.type }),
			});
			if (!presignRes.ok)
				throw new Error(`Failed to get upload URL: ${await presignRes.text()}`);
			const { presignedUrl, cdnUrl } = await presignRes.json();

			// Step 2: Upload to S3
			setStage("uploading");
			const uploadRes = await fetch(presignedUrl, {
				method: "PUT",
				headers: { "Content-Type": file.type },
				body: file,
			});
			if (!uploadRes.ok)
				throw new Error(`Upload failed with status ${uploadRes.status}`);

			// Step 3: Register image (creates the images.almostcrackd.ai record)
			setStage("registering");
			const registerRes = await fetch(`${BASE_URL}/pipeline/upload-image-from-url`, {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
			});
			if (!registerRes.ok)
				throw new Error(`Failed to register image: ${await registerRes.text()}`);

			router.push("/admin/images");
			router.refresh();
		} catch (err) {
			setUploadError(err instanceof Error ? err.message : String(err));
			setStage("error");
		}
	}

	async function handleUrlSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!url.trim()) {
			setUrlError("URL is required.");
			return;
		}
		setUrlSaving(true);
		setUrlError(null);

		const res = await fetch("/api/admin/images", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				url: url.trim(),
				image_description: description.trim() || null,
				is_public: isPublic,
			}),
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			setUrlError(body.error ?? "Failed to create image.");
			setUrlSaving(false);
			return;
		}

		router.push("/admin/images");
		router.refresh();
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
				<Link href="/admin/images" style={{ color: "#5a5a7a", fontSize: "0.85rem" }}>
					← Images
				</Link>
				<span style={{ color: "#2a2a4a" }}>/</span>
				<h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f0f0ff" }}>
					New Image
				</h1>
			</div>

			{/* Tabs */}
			<div style={{ display: "flex", borderBottom: "1px solid #2a2a4a" }}>
				{(["upload", "url"] as Tab[]).map((t) => (
					<button
						key={t}
						onClick={() => setTab(t)}
						style={{
							padding: "0.6rem 1.25rem",
							fontSize: "0.85rem",
							fontWeight: 600,
							color: tab === t ? "#4ecdc4" : "#5a5a7a",
							background: "transparent",
							border: "none",
							borderBottom: tab === t ? "2px solid #4ecdc4" : "2px solid transparent",
							cursor: "pointer",
							marginBottom: "-1px",
						}}>
						{t === "upload" ? "Upload File" : "From URL"}
					</button>
				))}
			</div>

			<div
				style={{
					background: "#16213e",
					border: "1px solid #2a2a4a",
					borderTop: "none",
					borderRadius: "0 0 12px 12px",
					padding: "1.75rem",
					display: "flex",
					flexDirection: "column",
					gap: "1.25rem",
				}}>
				{tab === "upload" ? (
					<>
						<style>{`@keyframes loadingSweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(550%); } }`}</style>

						<FormField label="Image File">
							<label style={dropZoneStyle}>
								<div style={{ pointerEvents: "none", textAlign: "center" }}>
									<div style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>🖼️</div>
									<span
										style={{
											color: "#c0c0e0",
											fontSize: "0.88rem",
											fontWeight: 500,
										}}>
										{file ? file.name : "Click to select a file"}
									</span>
									<span
										style={{
											display: "block",
											color: "#8888aa",
											fontSize: "0.75rem",
											marginTop: "0.25rem",
										}}>
										JPEG · PNG · WebP · GIF · HEIC
									</span>
								</div>
								<input
									type="file"
									accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,.heic"
									onChange={handleFileChange}
									disabled={isProcessing}
									style={{
										position: "absolute",
										inset: 0,
										opacity: 0,
										cursor: "pointer",
									}}
								/>
							</label>
						</FormField>

						{preview && (
							<div
								style={{
									borderRadius: "8px",
									overflow: "hidden",
									background: "#1e1e3a",
									maxHeight: "200px",
								}}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={preview}
									alt="Preview"
									style={{
										width: "100%",
										maxHeight: "200px",
										objectFit: "contain",
										display: "block",
									}}
								/>
							</div>
						)}

						{stage === "error" && uploadError && (
							<div
								style={{
									color: "#ff6b6b",
									background: "rgba(255,107,107,0.1)",
									border: "1px solid rgba(255,107,107,0.3)",
									borderRadius: "8px",
									padding: "0.6rem 0.9rem",
									fontSize: "0.85rem",
								}}>
								{uploadError}
							</div>
						)}

						{isProcessing && (
							<div>
								<span
									style={{
										color: "#4ecdc4",
										fontSize: "0.85rem",
										fontWeight: 600,
									}}>
									{STAGE_LABELS[stage]}
								</span>
								<div
									style={{
										width: "100%",
										height: "4px",
										background: "#2a2a4a",
										borderRadius: "999px",
										overflow: "hidden",
										marginTop: "0.5rem",
									}}>
									<div
										style={{
											height: "100%",
											width: "35%",
											background:
												"linear-gradient(90deg, transparent, #4ecdc4, #a8f0ec, #4ecdc4, transparent)",
											borderRadius: "999px",
											animation: "loadingSweep 1.5s ease-in-out infinite",
										}}
									/>
								</div>
							</div>
						)}

						<SharedFields
							description={description}
							setDescription={setDescription}
							isPublic={isPublic}
							setIsPublic={setIsPublic}
							disabled={isProcessing}
						/>

						<div style={{ display: "flex", gap: "0.75rem" }}>
							<button
								onClick={handleUpload}
								disabled={!file || isProcessing}
								style={{
									flex: 1,
									padding: "0.65rem",
									fontSize: "0.9rem",
									fontWeight: 600,
									color: !file || isProcessing ? "#5a5a7a" : "#0d0d1a",
									background: !file || isProcessing ? "#2a2a4a" : "#4ecdc4",
									border: "none",
									borderRadius: "8px",
									cursor: !file || isProcessing ? "not-allowed" : "pointer",
									transition: "background 0.2s",
								}}>
								{isProcessing ? STAGE_LABELS[stage] : "Upload & Save"}
							</button>
							<Link
								href="/admin/images"
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
					</>
				) : (
					<form
						onSubmit={handleUrlSubmit}
						style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
						{urlError && (
							<div
								style={{
									color: "#ff6b6b",
									background: "rgba(255,107,107,0.1)",
									border: "1px solid rgba(255,107,107,0.3)",
									borderRadius: "8px",
									padding: "0.6rem 0.9rem",
									fontSize: "0.85rem",
								}}>
								{urlError}
							</div>
						)}

						<FormField label="Image URL *">
							<input
								type="url"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								placeholder="https://example.com/image.jpg"
								required
								style={inputStyle}
							/>
						</FormField>

						{url && (
							<div
								style={{
									borderRadius: "8px",
									overflow: "hidden",
									background: "#1e1e3a",
									maxHeight: "200px",
								}}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={url}
									alt="Preview"
									style={{
										width: "100%",
										maxHeight: "200px",
										objectFit: "cover",
										display: "block",
									}}
									onError={(e) => {
										(e.target as HTMLImageElement).style.display = "none";
									}}
								/>
							</div>
						)}

						<SharedFields
							description={description}
							setDescription={setDescription}
							isPublic={isPublic}
							setIsPublic={setIsPublic}
							disabled={urlSaving}
						/>

						<div style={{ display: "flex", gap: "0.75rem" }}>
							<button
								type="submit"
								disabled={urlSaving}
								style={{
									flex: 1,
									padding: "0.65rem",
									fontSize: "0.9rem",
									fontWeight: 600,
									color: urlSaving ? "#5a5a7a" : "#0d0d1a",
									background: urlSaving ? "#2a2a4a" : "#4ecdc4",
									border: "none",
									borderRadius: "8px",
									cursor: urlSaving ? "default" : "pointer",
									transition: "background 0.2s",
								}}>
								{urlSaving ? "Creating…" : "Create Image"}
							</button>
							<Link
								href="/admin/images"
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
				)}
			</div>
		</div>
	);
}

function SharedFields({
	description,
	setDescription,
	isPublic,
	setIsPublic,
	disabled,
}: {
	description: string;
	setDescription: (v: string) => void;
	isPublic: boolean;
	setIsPublic: (v: boolean) => void;
	disabled: boolean;
}) {
	return (
		<>
			<FormField label="Description">
				<input
					type="text"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="A brief description of this image"
					disabled={disabled}
					style={inputStyle}
				/>
			</FormField>
			<FormField label="Visibility">
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
						checked={isPublic}
						onChange={(e) => setIsPublic(e.target.checked)}
						disabled={disabled}
						style={{ width: "16px", height: "16px", accentColor: "#4ecdc4" }}
					/>
					Make image public
				</label>
			</FormField>
		</>
	);
}

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

const dropZoneStyle: React.CSSProperties = {
	position: "relative",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	width: "100%",
	minHeight: "110px",
	border: "2px dashed #3a3a5a",
	borderRadius: "12px",
	background: "#0f0f23",
	cursor: "pointer",
	boxSizing: "border-box",
};
