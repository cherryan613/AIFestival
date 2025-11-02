
export const metadata = { title: "Route Field" };

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        {/* 모바일 뷰포트 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
        <style>{`
          @font-face {
            font-family: 'NeoDGM';
            src: url('/font/neodgm.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
          html, body, * {
            font-family: 'NeoDGM', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          }
        `}</style>
      </head>
      <body className="bg-emerald-100">{children}</body>
    </html>
  );
}