import { ScrollViewStyleReset } from 'expo-router/html'
import type { ReactNode } from 'react'

export default function RootHtml({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Theo dõi thu chi, tài khoản và ngân sách cá nhân." />
        <link rel="icon" href="/so-tien.svg" type="image/svg+xml" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  )
}
