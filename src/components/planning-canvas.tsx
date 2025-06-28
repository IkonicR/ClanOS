'use client';

import React from 'react';
import { War, WarMember } from '@/lib/types';
import { RoomProvider, ClientSideSuspense } from '@liveblocks/react';
import 'tldraw/tldraw.css';
import { Tldraw, TLOnMountHandler, TLUiOverrides, TLUiAssetUrlOverrides, TLComponents, useTools, useIsToolSelected, TldrawUiMenuItem, DefaultToolbar, DefaultToolbarContent } from 'tldraw';
import { MeasureShapeUtil } from '@/components/tldraw/MeasureShapeUtil';
import { MeasureShapeTool } from '@/components/tldraw/MeasureShapeTool';
import { uiOverrides } from '@/components/tldraw/ui-overrides';

type WarData = War;

export function PlanningCanvas({ war, selectedBase, isReadOnly }: { war: WarData, selectedBase: WarMember, isReadOnly: boolean }) {
	const roomId = `coc-war-room-${war.startTime}-${selectedBase.tag}`;

	const handleMount: TLOnMountHandler = (editor) => {
		editor.updateInstanceState({ isReadonly: isReadOnly });
	};

	const customShapeUtils = [MeasureShapeUtil];
	const customTools = [MeasureShapeTool];

	const customAssetUrls: TLUiAssetUrlOverrides = {
		icons: {
			ruler: '/icons/ruler.svg',
		},
	};

	const components: TLComponents = {
		Toolbar: (props: any) => {
			const tools = useTools()
			const isMeasureSelected = useIsToolSelected(tools.measure)
			return (
				<DefaultToolbar {...props}>
					<DefaultToolbarContent />
					<TldrawUiMenuItem {...tools.measure} isSelected={isMeasureSelected} />
				</DefaultToolbar>
			)
		},
	}

	return (
		<div className="w-full h-full relative">
			<RoomProvider id={roomId} initialPresence={{}}>
				<ClientSideSuspense fallback={<div className="flex items-center justify-center h-full text-foreground">Loading planning canvas...</div>}>
					{() => (
						<Tldraw 
							persistenceKey={roomId} 
							onMount={handleMount} 
							shapeUtils={customShapeUtils} 
							tools={customTools} 
							overrides={uiOverrides} 
							components={components} 
							assetUrls={customAssetUrls}
						/>
					)}
				</ClientSideSuspense>
			</RoomProvider>
		</div>
	);
} 