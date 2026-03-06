"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
	{ href: "/admin/dashboard", label: "Dashboard", icon: "◈" },
	{ href: "/admin/users", label: "Users", icon: "◉" },
	{ href: "/admin/images", label: "Images", icon: "◧" },
	{ href: "/admin/captions", label: "Captions", icon: "◫" },
];

export default function AdminNav({ userEmail }: { userEmail: string }) {
	const pathname = usePathname();
	const router = useRouter();

	async function handleSignOut() {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/login");
	}

	return (
		<aside
			style={{
				width: "220px",
				flexShrink: 0,
				background: "#11112a",
				borderRight: "1px solid #1e1e3a",
				display: "flex",
				flexDirection: "column",
				padding: "1.5rem 0",
			}}>
			{/* Brand */}
			<div
				style={{
					padding: "0 1.25rem 1.5rem",
					borderBottom: "1px solid #1e1e3a",
				}}>
				<div
					style={{
						fontSize: "1.1rem",
						fontWeight: 800,
						color: "#f0f0ff",
						textShadow:
							"0 0 7px rgba(78,205,196,0.5), 0 0 20px rgba(78,205,196,0.25)",
						letterSpacing: "-0.02em",
					}}>
					⚙ MemeVote
				</div>
				<div
					style={{
						fontSize: "0.7rem",
						color: "#4ecdc4",
						marginTop: "2px",
						letterSpacing: "0.08em",
						textTransform: "uppercase",
					}}>
					Admin Panel
				</div>
			</div>

			{/* Nav links */}
			<nav style={{ flex: 1, padding: "1rem 0" }}>
				{NAV_ITEMS.map(({ href, label, icon }) => {
					const active =
						pathname === href || pathname.startsWith(href + "/");
					return (
						<Link
							key={href}
							href={href}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.6rem",
								padding: "0.6rem 1.25rem",
								fontSize: "0.875rem",
								fontWeight: active ? 600 : 400,
								color: active ? "#4ecdc4" : "#8888aa",
								background: active
									? "rgba(78,205,196,0.08)"
									: "transparent",
								borderLeft: `3px solid ${active ? "#4ecdc4" : "transparent"}`,
								transition: "all 0.15s",
							}}>
							<span style={{ fontSize: "0.9rem" }}>{icon}</span>
							{label}
						</Link>
					);
				})}
			</nav>

			{/* User info + sign out */}
			<div
				style={{
					padding: "1rem 1.25rem",
					borderTop: "1px solid #1e1e3a",
				}}>
				<div
					style={{
						fontSize: "0.72rem",
						color: "#5a5a7a",
						marginBottom: "0.6rem",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
					title={userEmail}>
					{userEmail}
				</div>
				<button
					onClick={handleSignOut}
					style={{
						width: "100%",
						padding: "0.4rem 0.75rem",
						fontSize: "0.8rem",
						color: "#8888aa",
						background: "transparent",
						border: "1px solid #2a2a4a",
						borderRadius: "6px",
						cursor: "pointer",
						transition: "all 0.15s",
					}}
					onMouseEnter={(e) => {
						(e.target as HTMLButtonElement).style.color = "#ff6b6b";
						(e.target as HTMLButtonElement).style.borderColor = "#ff6b6b";
					}}
					onMouseLeave={(e) => {
						(e.target as HTMLButtonElement).style.color = "#8888aa";
						(e.target as HTMLButtonElement).style.borderColor = "#2a2a4a";
					}}>
					Sign Out
				</button>
			</div>
		</aside>
	);
}
