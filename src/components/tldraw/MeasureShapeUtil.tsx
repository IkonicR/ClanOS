import {
	BaseBoxShapeUtil,
	Geometry2d,
	HTMLContainer,
	Rectangle2d,
	ShapeUtil,
	T,
	TLBaseShape,
	RecordsDiff,
	RecordProps,
	Editor,
	Vec,
} from 'tldraw'
import { MeasureShape } from './measure-shape-types'

export class MeasureShapeUtil extends BaseBoxShapeUtil<MeasureShape> {
	static override type = 'measure' as const
	static override props: RecordProps<MeasureShape> = {
		w: T.number,
		h: T.number,
		text: T.string,
		flipX: T.boolean,
		flipY: T.boolean,
	}

	getDefaultProps(): MeasureShape['props'] {
		return {
			w: 0,
			h: 0,
			text: '0',
			flipX: false,
			flipY: false,
		}
	}

	getGeometry(shape: MeasureShape): Geometry2d {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

	component(shape: MeasureShape) {
		const { w, h, text, flipX, flipY } = shape.props

		const x1 = flipX ? w : 0
		const y1 = flipY ? h : 0
		const x2 = flipX ? 0 : w
		const y2 = flipY ? 0 : h

		return (
			<HTMLContainer
				id={shape.id}
				style={{
					pointerEvents: 'all',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<svg
					width={w}
					height={h}
					viewBox={`0 0 ${w} ${h}`}
					style={{ position: 'absolute' }}
				>
					<line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-text)" strokeWidth={2} />
				</svg>
				<div
					style={{
						color: 'var(--color-text)',
						backgroundColor: 'var(--color-background)',
						padding: '4px 8px',
						borderRadius: '4px',
						fontSize: '14px',
						whiteSpace: 'nowrap',
					}}
				>
					{text}px
				</div>
			</HTMLContainer>
		)
	}

	indicator(shape: MeasureShape) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}
} 