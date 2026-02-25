export default class GraphError extends Error {
	constructor(obj) {
		super(obj.message)
		this.name = 'GraphError'
		this.code = obj.code
		this.data = obj.data
	}

	toJSON() {
		return {
			code: this.code,
			message: this.message,
			data: this.data
		}
	}
}