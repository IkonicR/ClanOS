import { TLUiOverrides } from 'tldraw'

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