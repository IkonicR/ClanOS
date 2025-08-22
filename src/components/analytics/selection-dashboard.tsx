"use client";

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Users, Swords, Sparkles } from 'lucide-react'

interface SelectionEntry {
  name: string
  tag: string
  role: string
  townHall: number
  trophies: number
  scores: { offense: number; consistency: number; clutch: number; participation: number; cleanup: number; capital: number; composite: number }
}

interface SelectionData {
  clan: { name: string; tag: string; level: number }
  params: { teamSize: number }
  lineup: SelectionEntry[]
  openers: SelectionEntry[]
  cleanups: SelectionEntry[]
  bench: SelectionEntry[]
  generatedAt: string
}

export function SelectionDashboard({ data, teamSize, setTeamSize, onRefresh }:{ data: SelectionData, teamSize: number, setTeamSize: (n:number)=>void, onRefresh: ()=>void }) {
  return (
    <div className="space-y-6">
      <Card className="bg-card/75 backdrop-blur-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4"/> Recommended Lineup</CardTitle>
            <div className="text-sm text-muted-foreground">{data.clan.name} ({data.clan.tag}) • Generated {new Date(data.generatedAt).toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm flex items-center gap-2">
              <span>Team Size</span>
              <input type="number" min={5} max={50} value={teamSize} onChange={(e)=>setTeamSize(Math.max(5, Math.min(50, Number(e.target.value)||15)))} className="w-20 rounded border bg-background px-2 py-1 text-sm"/>
            </div>
            <Button variant="outline" onClick={onRefresh}>Refresh</Button>
          </div>
        </CardHeader>
        <CardContent>
          <RosterTable title="Starting Lineup" icon={<Users className="h-4 w-4"/>} entries={data.lineup}/>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/75 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Swords className="h-4 w-4"/> Preferred Openers</CardTitle>
          </CardHeader>
          <CardContent>
            <RosterTable entries={data.openers}/>
          </CardContent>
        </Card>
        <Card className="bg-card/75 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Swords className="h-4 w-4"/> Cleanup Specialists</CardTitle>
          </CardHeader>
          <CardContent>
            <RosterTable entries={data.cleanups}/>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/75 backdrop-blur-lg">
        <CardHeader>
          <CardTitle>Bench</CardTitle>
        </CardHeader>
        <CardContent>
          <RosterTable entries={data.bench}/>
        </CardContent>
      </Card>
    </div>
  )
}

function RosterTable({ title, icon, entries }:{ title?: string, icon?: React.ReactNode, entries: SelectionEntry[] }){
  return (
    <div className="space-y-3">
      {title && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">{icon}{title}</div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Role</TableHead>
            <TableHead>TH</TableHead>
            <TableHead className="hidden md:table-cell">Trophies</TableHead>
            <TableHead className="hidden lg:table-cell">Off</TableHead>
            <TableHead className="hidden lg:table-cell">Cons</TableHead>
            <TableHead className="hidden lg:table-cell">Clutch</TableHead>
            <TableHead className="hidden lg:table-cell">Part</TableHead>
            <TableHead>Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e)=> (
            <TableRow key={`${e.tag}-${e.scores.composite}`}>
              <TableCell className="font-medium">{e.name}</TableCell>
              <TableCell className="hidden sm:table-cell">{prettyRole(e.role)}</TableCell>
              <TableCell>TH{e.townHall}</TableCell>
              <TableCell className="hidden md:table-cell">{e.trophies}</TableCell>
              <TableCell className="hidden lg:table-cell">{e.scores.offense}</TableCell>
              <TableCell className="hidden lg:table-cell">{e.scores.consistency}</TableCell>
              <TableCell className="hidden lg:table-cell">{e.scores.clutch}</TableCell>
              <TableCell className="hidden lg:table-cell">{e.scores.participation}</TableCell>
              <TableCell>{e.scores.composite}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function prettyRole(r?: string){
  if (!r) return 'Member'
  if (r === 'coLeader') return 'Co-Leader'
  return r.charAt(0).toUpperCase()+r.slice(1)
}
