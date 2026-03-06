import { createClient } from "@/lib/supabase/server";

// ── helpers ──────────────────────────────────────────────────────────────────

function StatCard({
	label,
	value,
	sub,
	accent,
}: {
	label: string;
	value: string | number;
	sub?: string;
	accent?: string;
}) {
	return (
		<div
			style={{
				background: "#16213e",
				border: "1px solid #2a2a4a",
				borderRadius: "12px",
				padding: "1.25rem 1.5rem",
			}}>
			<div
				style={{ fontSize: "0.75rem", color: "#5a5a7a", marginBottom: "0.4rem" }}>
				{label}
			</div>
			<div
				style={{
					fontSize: "2rem",
					fontWeight: 800,
					color: accent ?? "#f0f0ff",
					lineHeight: 1,
				}}>
				{value}
			</div>
			{sub && (
				<div style={{ fontSize: "0.75rem", color: "#5a5a7a", marginTop: "0.3rem" }}>
					{sub}
				</div>
			)}
		</div>
	);
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
	return (
		<div style={{ margin: "2rem 0 0.6rem" }}>
			<h2
				style={{
					fontSize: "0.7rem",
					fontWeight: 700,
					letterSpacing: "0.1em",
					textTransform: "uppercase",
					color: "#4ecdc4",
					marginBottom: description ? "0.3rem" : 0,
				}}>
				{title}
			</h2>
			{description && (
				<p style={{ fontSize: "0.775rem", color: "#5a5a7a", lineHeight: 1.5 }}>
					{description}
				</p>
			)}
		</div>
	);
}

// Mini horizontal bar, width 0–100%
function Bar({ pct, color }: { pct: number; color: string }) {
	return (
		<div
			style={{
				height: "6px",
				borderRadius: "3px",
				background: "#1e1e3a",
				overflow: "hidden",
				flex: 1,
			}}>
			<div
				style={{
					width: `${pct}%`,
					height: "100%",
					background: color,
					borderRadius: "3px",
				}}
			/>
		</div>
	);
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
	const supabase = await createClient();

	// ── counts ───────────────────────────────────────────────────────────────
	const [
		{ count: userCount },
		{ count: imageCount },
		{ count: captionCount },
		{ count: voteCount },
		{ count: publicImageCount },
	] = await Promise.all([
		supabase.from("profiles").select("*", { count: "exact", head: true }),
		supabase.from("images").select("*", { count: "exact", head: true }),
		supabase.from("captions").select("*", { count: "exact", head: true }),
		supabase.from("caption_votes").select("*", { count: "exact", head: true }),
		supabase
			.from("images")
			.select("*", { count: "exact", head: true })
			.eq("is_public", true),
	]);

	// ── upvotes vs downvotes ─────────────────────────────────────────────────
	const { data: allVotes } = await supabase
		.from("caption_votes")
		.select("vote_value");

	const upvotes = (allVotes ?? []).filter((v) => v.vote_value > 0).length;
	const downvotes = (allVotes ?? []).filter((v) => v.vote_value < 0).length;
	const totalVotes = upvotes + downvotes;
	const upPct = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;

	// ── top 5 most-loved captions ────────────────────────────────────────────
	const { data: allVoteRows } = await supabase
		.from("caption_votes")
		.select("caption_id, vote_value");

	const upMap: Record<string, number> = {};
	const downMap: Record<string, number> = {};
	(allVoteRows ?? []).forEach((v) => {
		const id = v.caption_id;
		if (v.vote_value > 0) upMap[id] = (upMap[id] ?? 0) + 1;
		else downMap[id] = (downMap[id] ?? 0) + 1;
	});

	// controversy score = min(up, down) / max(up, down)  → 1 = perfectly split
	const allIds = [...new Set(Object.keys(upMap).concat(Object.keys(downMap)))];
	const controversial = allIds
		.map((id) => {
			const u = upMap[id] ?? 0;
			const d = downMap[id] ?? 0;
			const score = Math.min(u, d) / Math.max(u, d, 1);
			const total = u + d;
			return { id, u, d, score, total };
		})
		.filter((x) => x.total >= 3)
		.sort((a, b) => b.score - a.score || b.total - a.total)
		.slice(0, 5);

	const topLovedIds = Object.entries(upMap)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([id]) => id);

	// fetch caption content for loved + controversial
	const fetchIds = [
		...new Set([...topLovedIds, ...controversial.map((c) => c.id)]),
	];
	const { data: captionRows } = await supabase
		.from("captions")
		.select("id, content")
		.in("id", fetchIds);

	const captionMap: Record<string, string> = {};
	(captionRows ?? []).forEach((c) => {
		captionMap[c.id] = c.content ?? "(no content)";
	});

	// ── top voters ───────────────────────────────────────────────────────────
	const voterMap: Record<string, number> = {};
	(allVoteRows ?? []).forEach((v) => {
		// We don't have profile_id in this query, skip for now — done below
	});
	const { data: voterRows } = await supabase
		.from("caption_votes")
		.select("profile_id");

	const voterCounts: Record<string, number> = {};
	(voterRows ?? []).forEach((v) => {
		voterCounts[v.profile_id] = (voterCounts[v.profile_id] ?? 0) + 1;
	});
	const topVoterIds = Object.entries(voterCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5);

	const { data: profileRows } = await supabase
		.from("profiles")
		.select("id, first_name, last_name")
		.in(
			"id",
			topVoterIds.map(([id]) => id),
		);
	const profileMap: Record<string, string> = {};
	(profileRows ?? []).forEach((p) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const row = p as any;
		const first = row.first_name?.trim() || null;
		const last = row.last_name?.trim() || null;
		profileMap[row.id] =
			first && last ? `${first} ${last}` : first ?? last ?? `User ${row.id.slice(0, 8)}`;
	});

	// ── captions without any votes (orphans) ─────────────────────────────────
	const votedCaptionIds = new Set(Object.keys(upMap).concat(Object.keys(downMap)));
	const { count: orphanCount } = await supabase
		.from("captions")
		.select("*", { count: "exact", head: true })
		.not("content", "is", null);

	const unvotedCount = Math.max(
		0,
		(orphanCount ?? 0) - votedCaptionIds.size,
	);

	// ── avg caption length ────────────────────────────────────────────────────
	const { data: allCaptions } = await supabase
		.from("captions")
		.select("content")
		.not("content", "is", null);

	const avgLen =
		allCaptions && allCaptions.length > 0
			? Math.round(
					allCaptions.reduce((s, c) => s + (c.content?.length ?? 0), 0) /
						allCaptions.length,
				)
			: 0;

	const privateImageCount = (imageCount ?? 0) - (publicImageCount ?? 0);

	return (
		<div style={{ maxWidth: "900px" }}>
			<h1
				style={{
					fontSize: "1.4rem",
					fontWeight: 800,
					color: "#f0f0ff",
					marginBottom: "0.25rem",
				}}>
				Dashboard
			</h1>
			<p style={{ color: "#5a5a7a", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
				Platform overview — live from Supabase
			</p>

			{/* ── Overview ─────────────────────────────────────────────── */}
			<SectionHeader
				title="Overview"
				description="High-level counts across the entire platform — users who have signed in, images in the library, AI-generated captions, and votes cast by users."
			/>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
					gap: "0.75rem",
				}}>
				<StatCard label="Users" value={userCount ?? 0} accent="#4ecdc4" />
				<StatCard label="Images" value={imageCount ?? 0} />
				<StatCard
					label="Captions"
					value={captionCount ?? 0}
					sub={`${unvotedCount} awaiting votes`}
				/>
				<StatCard label="Total Votes" value={voteCount ?? 0} />
				<StatCard
					label="Avg Caption Length"
					value={`${avgLen} chars`}
					accent="#a78bfa"
				/>
			</div>

			{/* ── Vote Sentiment ───────────────────────────────────────── */}
			<SectionHeader
				title="Vote Sentiment"
				description="When a user swipes right on a caption they cast an upvote (+1); swiping left casts a downvote (−1). This shows the split across all votes ever recorded — a quick read on whether the community generally likes or dislikes what they see."
			/>
			<div
				style={{
					background: "#16213e",
					border: "1px solid #2a2a4a",
					borderRadius: "12px",
					padding: "1.25rem 1.5rem",
				}}>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "1rem",
						marginBottom: "0.75rem",
					}}>
					<span style={{ fontSize: "0.8rem", color: "#4ecdc4", minWidth: "80px" }}>
						👍 {upvotes.toLocaleString()} upvotes
					</span>
					<Bar pct={upPct} color="#4ecdc4" />
					<span style={{ fontSize: "0.8rem", color: "#5a5a7a", minWidth: "40px" }}>
						{upPct}%
					</span>
				</div>
				<div
					style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
					<span style={{ fontSize: "0.8rem", color: "#ff6b6b", minWidth: "80px" }}>
						👎 {downvotes.toLocaleString()} downvotes
					</span>
					<Bar pct={100 - upPct} color="#ff6b6b" />
					<span style={{ fontSize: "0.8rem", color: "#5a5a7a", minWidth: "40px" }}>
						{100 - upPct}%
					</span>
				</div>
			</div>

			{/* ── Image Visibility ─────────────────────────────────────── */}
			<SectionHeader
				title="Image Visibility"
				description="Images marked public appear in the voting feed and gallery. Private images are stored but hidden from all users — useful for staging content before it goes live."
			/>
			<div
				style={{
					background: "#16213e",
					border: "1px solid #2a2a4a",
					borderRadius: "12px",
					padding: "1.25rem 1.5rem",
					display: "flex",
					gap: "2rem",
					alignItems: "center",
				}}>
				<div style={{ textAlign: "center" }}>
					<div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#4ecdc4" }}>
						{publicImageCount ?? 0}
					</div>
					<div style={{ fontSize: "0.75rem", color: "#5a5a7a" }}>Public</div>
				</div>
				<div
					style={{
						flex: 1,
						height: "16px",
						borderRadius: "8px",
						background: "#1e1e3a",
						overflow: "hidden",
					}}>
					<div
						style={{
							width: `${
								(imageCount ?? 0) > 0
									? Math.round(((publicImageCount ?? 0) / (imageCount ?? 1)) * 100)
									: 0
							}%`,
							height: "100%",
							background: "#4ecdc4",
						}}
					/>
				</div>
				<div style={{ textAlign: "center" }}>
					<div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#3a3a5a" }}>
						{privateImageCount}
					</div>
					<div style={{ fontSize: "0.75rem", color: "#5a5a7a" }}>Private</div>
				</div>
			</div>

			{/* ── Most Loved Captions ──────────────────────────────────── */}
			<SectionHeader
				title="Most Loved Captions"
				description="The 5 captions with the most upvotes from users. A high upvote count means many people swiped right — the crowd's favourite AI-generated lines."
			/>
			<div
				style={{
					background: "#16213e",
					border: "1px solid #2a2a4a",
					borderRadius: "12px",
					overflow: "hidden",
				}}>
				{topLovedIds.length === 0 ? (
					<p style={{ color: "#5a5a7a", padding: "1rem 1.5rem", fontSize: "0.85rem" }}>
						No votes recorded yet.
					</p>
				) : (
					topLovedIds.map((id, i) => (
						<div
							key={id}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "1rem",
								padding: "0.75rem 1.5rem",
								borderBottom: i < topLovedIds.length - 1 ? "1px solid #1e1e3a" : "none",
							}}>
							<span
								style={{
									fontSize: "0.75rem",
									fontWeight: 700,
									color: "#4ecdc4",
									minWidth: "20px",
								}}>
								#{i + 1}
							</span>
							<span style={{ fontSize: "0.82rem", color: "#e0e0f0", flex: 1 }}>
								{(captionMap[id] ?? "").slice(0, 100)}
								{(captionMap[id] ?? "").length > 100 ? "…" : ""}
							</span>
							<span style={{ fontSize: "0.8rem", color: "#4ecdc4", whiteSpace: "nowrap" }}>
								👍 {upMap[id] ?? 0}
							</span>
						</div>
					))
				)}
			</div>

			{/* ── Most Controversial ───────────────────────────────────── */}
			<SectionHeader
				title="Most Controversial Captions"
				description="Captions where the community is most divided — scored by how evenly upvotes and downvotes are split (score = 1.0 means perfectly 50/50). Only captions with at least 3 total votes are included to filter out noise."
			/>
			<div
				style={{
					background: "#16213e",
					border: "1px solid #2a2a4a",
					borderRadius: "12px",
					overflow: "hidden",
				}}>
				{controversial.length === 0 ? (
					<p style={{ color: "#5a5a7a", padding: "1rem 1.5rem", fontSize: "0.85rem" }}>
						Not enough votes for controversy analysis yet.
					</p>
				) : (
					controversial.map((c, i) => (
						<div
							key={c.id}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "1rem",
								padding: "0.75rem 1.5rem",
								borderBottom:
									i < controversial.length - 1 ? "1px solid #1e1e3a" : "none",
							}}>
							<span
								style={{
									fontSize: "0.75rem",
									fontWeight: 700,
									color: "#f59e0b",
									minWidth: "20px",
								}}>
								#{i + 1}
							</span>
							<span style={{ fontSize: "0.82rem", color: "#e0e0f0", flex: 1 }}>
								{(captionMap[c.id] ?? "").slice(0, 100)}
								{(captionMap[c.id] ?? "").length > 100 ? "…" : ""}
							</span>
							<span
								style={{
									fontSize: "0.75rem",
									color: "#8888aa",
									whiteSpace: "nowrap",
								}}>
								<span style={{ color: "#4ecdc4" }}>+{c.u}</span>
								{" / "}
								<span style={{ color: "#ff6b6b" }}>-{c.d}</span>
							</span>
						</div>
					))
				)}
			</div>

			{/* ── Top Voters ───────────────────────────────────────────── */}
			<SectionHeader
				title="Most Active Voters"
				description="The 5 registered users who have cast the most votes in total (upvotes + downvotes combined). The bar shows each person's count relative to the top voter."
			/>
			<div
				style={{
					background: "#16213e",
					border: "1px solid #2a2a4a",
					borderRadius: "12px",
					overflow: "hidden",
					marginBottom: "2rem",
				}}>
				{topVoterIds.length === 0 ? (
					<p style={{ color: "#5a5a7a", padding: "1rem 1.5rem", fontSize: "0.85rem" }}>
						No votes recorded yet.
					</p>
				) : (
					topVoterIds.map(([id, count], i) => {
						const maxCount = topVoterIds[0][1];
						const pct = Math.round((count / maxCount) * 100);
						return (
							<div
								key={id}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "1rem",
									padding: "0.65rem 1.5rem",
									borderBottom:
										i < topVoterIds.length - 1 ? "1px solid #1e1e3a" : "none",
								}}>
								<span
									style={{
										fontSize: "0.75rem",
										fontWeight: 700,
										color: "#a78bfa",
										minWidth: "20px",
									}}>
									#{i + 1}
								</span>
								<span
									style={{
										fontSize: "0.82rem",
										color: "#e0e0f0",
										minWidth: "140px",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}>
									{profileMap[id] ?? id.slice(0, 8)}
								</span>
								<Bar pct={pct} color="#a78bfa" />
								<span
									style={{
										fontSize: "0.8rem",
										color: "#a78bfa",
										minWidth: "50px",
										textAlign: "right",
									}}>
									{count} votes
								</span>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
