export default class GraphError extends Error {
	constructor(obj) {
		super(obj.message)
		this.code = obj.code
		this.data = obj.data
	}
}