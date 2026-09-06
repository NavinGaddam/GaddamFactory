import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata={title:'Shegur Textile Factory',description:'Textile factory operations PWA'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="mr"><body>{children}</body></html>}
