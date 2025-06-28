import { TLBaseShape } from 'tldraw'

export type MeasureShape = TLBaseShape<
	'measure',
	{
		w: number
		h: number
		text: string
	}
> 