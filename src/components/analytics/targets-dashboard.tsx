"use client";

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Swords } from 'lucide-react'

export function TargetsDashboard({ data, onRefresh }:{ data: any, onRefresh: ()=>void }){
  return (
    <div className="space-y-6">
      <Card className="bg-card/75 backdrop-blur-lg">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Swords className="h-4 w-4"/> Target Assignments</CardTitle>
            <div className="text-sm text-muted-foreground">Opponent: {data.war.opponent?.name} ({data.war.opponent?.tag}) • Generated {new Date(data.generatedAt).toLocaleString()}</div>
          </div>
          <Button variant="outline" onClick={onRefresh}>Refresh</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attacker</TableHead>
                <TableHead>TH</TableHead>
                <TableHead>Defender</TableHead>
                <TableHead>TH</TableHead>
                <TableHead>Pred Stars</TableHead>
                <TableHead className="hidden lg:table-cell">Rationale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.assignments.map((a: any, idx: number)=> (
                <TableRow key={`${a.attacker.tag}-${a.defender.tag}-${idx}`}>
                  <TableCell className="font-medium">{a.attacker.name}</TableCell>
                  <TableCell>TH{a.attacker.townHall}</TableCell>
                  <TableCell>{a.defender.name}</TableCell>
                  <TableCell>TH{a.defender.townHall}</TableCell>
                  <TableCell>{a.predictedStars}</TableCell>
                  <TableCell className="hidden lg:table-cell">off:{a.rationale.offense} clutch:{a.rationale.clutch} ΔTH:{a.rationale.thDiff}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {data.alternates?.length > 0 && (
        <Card className="bg-card/75 backdrop-blur-lg">
          <CardHeader>
            <CardTitle>Alternates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Unassigned defenders:</div>
            <ul className="list-disc pl-6">
              {data.alternates.map((d:any)=> (
                <li key={d.tag}>{d.name} (TH{d.townHall})</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
