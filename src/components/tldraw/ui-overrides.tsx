import {
	TLUiOverrides,
} from 'tldraw'
import { TldrawUiIcon } from 'tldraw'
import { FC } from 'react'

export const uiOverrides: TLUiOverrides = {
	tools(editor, tools) {
		tools.measure = {
			id: 'measure',
			label: 'Measure',
			readonlyOk: false,
			icon: 'ruler',
			kbd: 'm',
			onSelect() {
				editor.setCurrentTool('measure')
			},
		}
		return tools
	},
}

export const CustomIcons: FC = () => {
	return (
		<>
			<TldrawUiIcon
				icon="ruler"
				small
				style={{
					width: 'var(--tld-icon-size-small)',
					height: 'var(--tld-icon-size-small)',
				}}
			>
				<svg
					width="100%"
					height="100%"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M3 21H21V18H3V21ZM5 16H19V13H5V16ZM3 11H21V8H3V11ZM5 6H19V3H5V6Z"
						fill="currentColor"
					/>
				</svg>
			</TldrawUiIcon>
			<TldrawUiIcon
				icon="ruler"
				style={{
					width: 'var(--tld-icon-size-medium)',
					height: 'var(--tld-icon-size-medium)',
				}}
			>
				<svg
					width="100%"
					height="100%"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M3 21H21V18H3V21ZM5 16H19V13H5V16ZM3 11H21V8H3V11ZM5 6H19V3H5V6Z"
						fill="currentColor"
					/>
				</svg>
			</TldrawUiIcon>
		</>
	)
} 