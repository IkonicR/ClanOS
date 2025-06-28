import { TLUiOverrides } from 'tldraw'

export const uiOverrides: TLUiOverrides = {
	tools(editor, tools) {
		tools.measure = {
			id: 'measure',
			icon: 'ruler',
			label: 'Measure',
			kbd: 'm',
			onSelect: () => {
				editor.setCurrentTool('measure')
			},
		}
		return tools
	},
} 