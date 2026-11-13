import type { Metadata } from 'next'
import '../globals.css'
import 'leaflet/dist/leaflet.css'
import AdminProvider from './AdminProvider'

export const metadata: Metadata = {
  title: 'NOVA — Back-office',
  description: 'Administration NOVA',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminProvider>{children}</AdminProvider>
}
