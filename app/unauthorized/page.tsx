import Link from "next/link";

export default function UnauthorizedPage() {
	return (
		<main
			style={{
				minHeight: "100vh",
				background: "#0d0d1a",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				fontFamily: "system-ui, sans-serif",
				textAlign: "center",
				padding: "2rem",
			}}>
			<div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚫</div>
			<h1
				style={{
					fontSize: "1.8rem",
					fontWeight: 800,
					color: "#ff6b6b",
					marginBottom: "0.5rem",
				}}>
				Access Denied
			</h1>
			<p
				style={{
					color: "#8888aa",
					fontSize: "1rem",
					maxWidth: "360px",
					lineHeight: 1.6,
					marginBottom: "2rem",
				}}>
				Your account is not authorized to access the admin panel.
				<br />
				<code
					style={{
						fontSize: "0.8rem",
						color: "#4ecdc4",
						background: "rgba(78,205,196,0.1)",
						padding: "2px 6px",
						borderRadius: "4px",
					}}>
					profiles.is_superadmin
				</code>{" "}
				must be{" "}
				<code
					style={{
						fontSize: "0.8rem",
						color: "#4ecdc4",
						background: "rgba(78,205,196,0.1)",
						padding: "2px 6px",
						borderRadius: "4px",
					}}>
					true
				</code>{" "}
				for your account.
			</p>
			<Link
				href="/login"
				style={{
					padding: "0.6rem 1.5rem",
					fontSize: "0.9rem",
					color: "#8888aa",
					border: "1px solid #3a3a5a",
					borderRadius: "8px",
					transition: "border-color 0.2s, color 0.2s",
				}}>
				← Back to Login
			</Link>
		</main>
	);
}
