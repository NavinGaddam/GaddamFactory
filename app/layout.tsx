import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata={title:'Gaddam Factory',description:'Gaddam Factory textile operations, stock, attendance and payroll',manifest:'/manifest.json',themeColor:'#172033'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="mr"><body>{children}<script dangerouslySetInnerHTML={{__html:`if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}`}}/></body></html>}
