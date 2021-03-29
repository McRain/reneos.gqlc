/* eslint-disable */
const _gqlcOpt = {
	"method": "post",
	"credentials": "include",
	"headers": {},
	"url": ""
}

const _stored = {}

let _eventHandlers = {}

class Client extends EventTarget {
	constructor(options) {
		super()
		this._options = options
		this._stored = {}
	}
	add(obj){
		const keys = Object.keys(obj)
		for(let i=0;i<keys.length;i++)
		{
			const k = keys[i]
			this._stored[k] = obj[k] 
		}
	}
	remove(keys){
		for(let i=0;i<keys.length;i++){
			delete this._stored[keys[i]]
		}
	}
	parseTemplate(template, data) {
		return data?JSON.parse(JSON.stringify(template, (k, v) => {
			if (v in data)
				return data[v]
			return v
		})):template
	}
	read(value, data) {
		const t = typeof value === "string" ? this._stored[value] : value
		return this.do('query', this.parseTemplate(t, data))
	}
	write(value, data) {
		const t = typeof value === "string" ? this._stored[value] : value
		return this.do('mutation', this.parseTemplate(t, data))
	}
	do(op, q) {
		const query = this.build(op, q)
		try {
			return this.send(JSON.stringify({ query }))
		} catch (error) {
			if (!error.code)
				return { error: { code: 400 } } //no serverside error
			return { error }
		}
	}
	build(op, ...args) {
		let result = `${op} { `
		for (let i = 0; i < args.length; i++)
			result += this.buildobject(args[i])
		return result + " }"
	}
	buildobject(obj) {
		let result = ``
		if (obj === null || obj === undefined) return result
		if (typeof (obj) === "string" ||
			typeof (obj) === "number" ||
			Array.isArray(obj))
			return JSON.stringify(obj)
		Object.keys(obj).forEach((k) => {
			result += k + " "
			const values = obj[k]
			const arg = values.find((element) => {
				if (!element || !element.$args/* || typeof element !== "object"*/)
					return false
				return true
			})
			let acount = 0
			if (arg) {
				result += /*`(${this.Stringify(arg.$args)})`*/ this.buildargs(arg.$args)
				const ind = values.indexOf(arg)
				values.splice(ind, 1)
			}
			result += values.length > acount ? " { " : ""
			for (let i = 0; i < values.length; i++) {
				const o = values[i]
				if (!o)
					continue
				if (typeof o === "string") {
					result += o + " "
				} else if (o instanceof Array) {
					result += o.join(' ')
				} else
					result += this.buildobject(o)
			}
			result += values.length > acount ? " } " : ""
		})
		return result
	}
	buildargs(args) {
		let result = " ( "
		Object.keys(args).forEach((k) => {
			result += k + ":"
			const vals = args[k]
			if (vals instanceof Array) {
				if (vals.length === 0)
					result += "[],"
				else {
					const v = vals[0]
					if (typeof (v) === "string")
						result += JSON.stringify(vals) + ","
					else if (typeof (v) === "number")
						result += "[" + vals.join(',') + "],"
					else {
						result += "["
						vals.forEach((el) => {
							result += "{"
							Object.keys(el).forEach((kl) => {
								result += kl + ":" + this.buildobject(el[kl]) + ","
							})
							result = result.slice(0, -1) + "},"
						})
						result = result.slice(0, -1) + "],"
					}
				}
			} else if (typeof vals === "object") {
				result += JSON.stringify(vals).replaceAll('"', '') + ","
			} else
				result += JSON.stringify(vals) + ","
		})
		return result.slice(0, -1) + " ) "
	}
	async send(data, url, method, credentials, headers) {
		let result = {}
		const resp = await fetch(url || this._options.url, {
			method: method || this._options.method,
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json",
				...this._options.headers,
				...headers
			},
			body: data,
			credentials: credentials || this._options.credentials
		})
		result = await resp.json()
		if (result.error)
			throw new Error(result.error)
		return result.data
	}
}

export default class GraphQLClient {

	static get Client(){
		return Client
	}

	static On(event, handler) {
		_eventHandlers[event] = handler
	}

	/**
	 * Save to stored templates
	 * @param {Object} obj 
	 */
	static Add(obj) {
		Object.keys(obj).forEach(k => {
			_stored[k] = obj[k]
		})
	}

	/**
	 * Delete stored template
	 * @param {Array} keys 
	 */
	static Remove(keys) {
		keys.forEach(k => {
			if (_stored[k])
				delete _stored[k]
		})
	}

	static Init(config) {
		Object.assign(_gqlcOpt, config)
		return GraphQLClient
	}

	static ParseTemplate(template, data) {
		let q = template
		if (data)
			q = JSON.parse(JSON.stringify(template, (k, v) => {
				if (data.hasOwnProperty(v))
					return data[v]
				return v
			}))
		return q
	}

	/**	 
	 * @param {Object | String} str 
	 * @param {Object} data 
	 */
	static Get(value, data) {
		const t = typeof value === "string" ? _stored[value] : value
		return GraphQLClient.Do('query', GraphQLClient.ParseTemplate(t, data))
	}

	/**
	 * 
	 * @param {Object | String} str 
	 * @param {Object} data 
	 */
	static Set(value, data) {
		const t = typeof value === "string" ? _stored[value] : value
		return GraphQLClient.Do('mutation', GraphQLClient.ParseTemplate(t, data))
	}

	/**
	 * 
	 * @param {Object | String} str 
	 * @param {Object} data 
	 */
	static Sub(value, data) {
		const t = typeof value === "string" ? _stored[value] : value
		return GraphQLClient.Do('subscript', GraphQLClient.ParseTemplate(t, data))
	}

	/**
	 * 
	 * @param {string} op : Operation
	 * @param {Object} q : Query
	 */
	static async Do(op, q) {
		const query = GraphQLClient.Build(op, q)
		try {
			return await GraphQLClient.Send(JSON.stringify({ query }), _gqlcOpt)
		} catch (error) {
			if (_eventHandlers.error)
				_eventHandlers.error(error.code ? error : { error: { code: 400 } })
			if (!error.code)
				return { error: { code: 400 } } //no serverside error
			return { error }
		}
	}

	static Build(op, ...args) {
		let result = `${op} { `
		for (let i = 0; i < args.length; i++)
			result += GraphQLClient.BuildObject(args[i])
		return result + " }"
	}
	static BuildObject(obj) {
		let result = ``
		if (obj === null || obj === undefined) return result
		if (typeof (obj) === "string" ||
			typeof (obj) === "number" ||
			Array.isArray(obj))
			return JSON.stringify(obj)
		Object.keys(obj).forEach((k) => {
			result += k + " "
			const values = obj[k]
			const arg = values.find((element, index, array) => {
				if (!element || !element.$args/* || typeof element !== "object"*/)
					return false
				return true
			})
			let acount = 0
			if (arg) {
				result += GraphQLClient.BuildArgs(arg.$args)
				const ind = values.indexOf(arg)
				values.splice(ind, 1)
			}
			result += values.length > acount ? " { " : ""
			for (let i = 0; i < values.length; i++) {
				const o = values[i]
				if (!o)
					continue
				if (typeof (o) === "string") {
					result += o + " "
				} else if (o instanceof Array) {
					result += o.join(' ')
				} else
					result += GraphQLClient.BuildObject(o)
			}
			result += values.length > acount ? " } " : ""
		})
		return result
	}

	static BuildArgs(args) {
		let result = " ( "
		Object.keys(args).forEach((k) => {
			result += k + ":"
			const vals = args[k]
			if (vals instanceof Array) {
				if (vals.length === 0)
					result += "[],"
				else {
					const v = vals[0]
					if (typeof (v) === "string")
						result += JSON.stringify(vals) + ","
					else if (typeof (v) === "number")
						result += "[" + vals.join(',') + "],"
					else {
						result += "["
						vals.forEach((el) => {
							result += "{"
							Object.keys(el).forEach((kl) => {
								result += kl + ":" + GraphQLClient.BuildObject(el[kl]) + ","
							})
							result = result.slice(0, -1) + "},"
						})
						result = result.slice(0, -1) + "],"
					}
				}
			} else if (typeof vals === "object") {
				result += JSON.stringify(vals).replaceAll('"', '') + ","
			} else
				result += JSON.stringify(vals) + ","
		})
		return result.slice(0, -1) + " ) "
	}

	/**
	 * 
	 * @param {String} data 
	 * @param {Object} optional
	 */
	static async Send(data, { url, method, credentials, headers }) {
		let result = {}
		try {
			const resp = await fetch(url || _gqlcOpt.url, {
				method: method || _gqlcOpt.method,
				headers: Object.assign({
					"Content-Type": "application/json",
					"Accept": "application/json"
				}, headers || _gqlcOpt.headers),
				body: data,
				credentials: credentials || _gqlcOpt.credentials
			})
			result = await resp.json()
		} catch (e) {
			throw e
		}
		if (result.error)
			throw new GraphError(result.error)
		return result.data
	}
}

class GraphError extends Error {
	constructor(obj) {
		super(obj.message)
		this.code = obj.code
		this.data = obj.data
	}
}