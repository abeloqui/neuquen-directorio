"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  byStatus: { label: string; value: number }[];
  topHoods: { name: string; value: number }[];
  evolution: { month: string; creados: number; resueltos: number }[];
}

export default function StatsCharts({ byStatus, topHoods, evolution }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card">
        <h3 className="mb-3 font-semibold">Reportes por estado</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byStatus}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Bar dataKey="value" name="Reportes" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3 font-semibold">Barrios con más problemas abiertos</h3>
        <div className="h-64">
          {topHoods.length === 0 ? (
            <p className="text-sm text-gray-500">Sin datos todavía.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topHoods} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis type="category" dataKey="name" width={110} fontSize={10} />
                <Tooltip />
                <Bar dataKey="value" name="Abiertos" fill="#dc2626" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card lg:col-span-2">
        <h3 className="mb-3 font-semibold">Evolución mensual</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolution}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="creados" name="Recibidos" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="resueltos" name="Resueltos" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
