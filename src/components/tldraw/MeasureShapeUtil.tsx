import {
	BaseBoxShapeUtil,
	Geometry2d,
	HTMLContainer,
	Rectangle2d,
	ShapeUtil,
	T,
	TLBaseShape,
	recordDiff,
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
	}

	getDefaultProps(): MeasureShape['props'] {
		return {
			w: 200,
			h: 0,
			text: '0',
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
		const distance = Math.sqrt(shape.props.w * shape.props.w + shape.props.h * shape.props.h)
		const text = distance.toFixed(0)

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
					width="100%"
					height="100%"
					viewBox={`0 0 ${shape.props.w} ${Math.max(1, Math.abs(shape.props.h))}`}
					style={{ position: 'absolute' }}
				>
					<line
						x1={0}
						y1={shape.props.h >= 0 ? 0 : Math.abs(shape.props.h)}
						x2={shape.props.w}
						y2={shape.props.h >= 0 ? shape.props.h : 0}
						stroke="var(--color-text)"
						strokeWidth={2}
					/>
				</svg>
				<div
					style={{
						color: 'var(--color-text)',
						backgroundColor: 'var(--color-background)',
						padding: '2px 4px',
						borderRadius: '2px',
						fontSize: '12px',
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