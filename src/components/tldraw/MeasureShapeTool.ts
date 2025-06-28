import { StateNode, TLEventHandlers, TLPointerEventInfo } from 'tldraw'
import { TLShapeId, createShapeId } from 'tldraw'

export class MeasureShapeTool extends StateNode {
	static override id = 'measure'
	static override initial = 'idle'
	static override children = () => [Idle, Pointing, Dragging]

	shapeType = 'measure'
}

class Idle extends StateNode {
	static override id = 'idle'

	override onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
		this.parent.transition('pointing', info)
	}
}

class Pointing extends StateNode {
	static override id = 'pointing'

	override onPointerMove: TLEventHandlers['onPointerMove'] = (info) => {
		this.parent.transition('dragging', info)
	}

	override onPointerUp: TLEventHandlers['onPointerUp'] = (info) => {
		this.parent.transition('idle', info)
	}
}

let shapeId: TLShapeId

class Dragging extends StateNode {
	static override id = 'dragging'
	private info?: TLPointerEventInfo

	override onEnter = (info: TLPointerEventInfo) => {
		this.info = info
		const { x, y } = this.editor.inputs.originPagePoint
		shapeId = createShapeId()
		this.editor.createShape({
			id: shapeId,
			type: 'measure',
			x,
			y,
			props: {
				w: 0,
				h: 0,
				text: '0',
				flipX: false,
				flipY: false,
			},
		})
	}

	override onPointerMove: TLEventHandlers['onPointerMove'] = (info) => {
		if (!this.info) return
		const { x, y } = this.editor.inputs.currentPagePoint
		const start = this.editor.inputs.originPagePoint

		const newX = Math.min(start.x, x)
		const newY = Math.min(start.y, y)
		const newW = Math.abs(x - start.x)
		const newH = Math.abs(y - start.y)
		const flipX = x < start.x
		const flipY = y < start.y

		this.editor.updateShape({
			id: shapeId,
			type: 'measure',
			x: newX,
			y: newY,
			props: {
				w: newW,
				h: newH,
				text: `${Math.hypot(x - start.x, y - start.y).toFixed(0)}`,
				flipX,
				flipY,
			},
		})
	}

	override onPointerUp: TLEventHandlers['onPointerUp'] = (info) => {
		this.parent.transition('idle', info)
	}
} 