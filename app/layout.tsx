import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "MemeVote Admin",
	description: "Admin panel for the MemeVote platform",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
