'use client';

import React from 'react';
import { War, WarMember } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Users, Clock, AlertTriangle } from 'lucide-react';

type WarData = War;

export function PlanningCanvas({ war, selectedBase, isReadOnly }: { war: WarData, selectedBase: WarMember, isReadOnly: boolean }) {
	return (
		<Card className="w-full h-full min-h-[500px]">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Target className="w-5 h-5" />
					War Planning Canvas
					<Badge variant="secondary" className="ml-2">
						Coming Soon
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col items-center justify-center h-full space-y-4">
				<AlertTriangle className="w-12 h-12 text-muted-foreground" />
				<div className="text-center space-y-2">
					<h3 className="text-lg font-semibold">Interactive War Planning</h3>
					<p className="text-muted-foreground max-w-md">
						An interactive canvas for planning war attacks is coming soon. For now, you can still view your war details below.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg mt-6">
					<div className="text-center p-4 border rounded-lg">
						<Users className="w-6 h-6 mx-auto mb-2 text-primary" />
						<div className="font-semibold">Base Details</div>
						<div className="text-sm text-muted-foreground">
							{selectedBase.name}
						</div>
					</div>
					<div className="text-center p-4 border rounded-lg">
						<Target className="w-6 h-6 mx-auto mb-2 text-primary" />
						<div className="font-semibold">War Status</div>
						<div className="text-sm text-muted-foreground">
							{war.state}
						</div>
					</div>
					<div className="text-center p-4 border rounded-lg">
						<Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
						<div className="font-semibold">Team Size</div>
						<div className="text-sm text-muted-foreground">
							{war.teamSize} vs {war.teamSize}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
} 