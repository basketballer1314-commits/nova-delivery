'use client'

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'

export interface MapCourier { id: string; lat: number; lng: number; availability: string }
export interface MapJob { id: string; lat: number; lng: number; status: string; job_type: string }

export default function OpsMap({ couriers, jobs }: { couriers: MapCourier[]; jobs: MapJob[] }) {
  return (
    <MapContainer center={[14.42, -16.96]} zoom={13} style={{ height: 480, width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {jobs.map((j) => (
        <CircleMarker key={j.id} center={[j.lat, j.lng]} radius={8} pathOptions={{ color: '#FF6B35', fillColor: '#FF6B35', fillOpacity: 0.7 }}>
          <Popup>
            <div className="text-[12px]">Mission {j.id.slice(0, 8)}<br />{j.job_type} — {j.status}</div>
          </Popup>
        </CircleMarker>
      ))}
      {couriers.map((c) => (
        <CircleMarker key={c.id} center={[c.lat, c.lng]} radius={6} pathOptions={{ color: '#0FA3A3', fillColor: '#0FA3A3', fillOpacity: 0.9 }}>
          <Popup>
            <div className="text-[12px]">Livreur {c.id.slice(0, 8)}<br />{c.availability}</div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
