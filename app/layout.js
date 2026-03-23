export const metadata = {
  title: 'Karo UK Price Intelligence',
  description: 'E45 vs Competitors — Boots UK Price Monitoring',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.cdnfonts.com/css/euclid-circular-a" rel="stylesheet" />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
