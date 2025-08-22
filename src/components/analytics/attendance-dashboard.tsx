"use client";

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface AttendanceResult {
  tag: string
  name: string
  wars: number
  totalWars: number
  expected: number
  used: number
  missed: number
  participationRate: number
  missRate: number
  lastWar: string
  risk: number
}

export function AttendanceDashboard({ data, days, setDays, onRefresh }:{ data: {summary:any, results: AttendanceResult[], generatedAt: string}, days: number, setDays: (n:number)=>void, onRefresh: ()=>void }){
  return (
    <div className="space-y-6">
      <Card className="bg-card/75 backdrop-blur-lg">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Missed Attacks & Attendance</CardTitle>
            <div className="text-sm text-muted-foreground">Window: {days} days • Generated {new Date(data.generatedAt).toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm flex items-center gap-2">
              <span>Days</span>
              <input type="number" min={7} max={180} value={days} onChange={(e)=> setDays(Math.max(7, Math.min(180, Number(e.target.value)||60)))} className="w-20 rounded border bg-background px-2 py-1 text-sm"/>
            </div>
            <Button variant="outline" onClick={onRefresh}>Refresh</Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat title="Wars Analyzed" value={data.summary.warsAnalyzed} />
          <Stat title="Members Analyzed" value={data.summary.membersAnalyzed} />
          <Stat title="Avg Miss Rate" value={`${data.summary.avgMissRate}%`} />
        </CardContent>
      </Card>

      <Card className="bg-card/75 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500"/> High-Risk Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="hidden md:table-cell">Wars</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Missed</TableHead>
                <TableHead className="hidden lg:table-cell">Miss%</TableHead>
                <TableHead>Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.results.slice(0, 25).map((r)=> (
                <TableRow key={r.tag}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{r.wars}/{r.totalWars}</TableCell>
                  <TableCell>{r.expected}</TableCell>
                  <TableCell>{r.used}</TableCell>
                  <TableCell>{r.missed}</TableCell>
                  <TableCell className="hidden lg:table-cell">{r.missRate}%</TableCell>
                  <TableCell>{r.risk}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ title, value }:{ title: string, value: React.ReactNode }){
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}
