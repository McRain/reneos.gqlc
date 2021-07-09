 /* eslint-disable */

 import GraphError from "./grapherror.js"

 const _gqlcOpt = {
	"method": "post",
	"credentials": "include",
	"headers": {},
	"url": "",
	"port": 80,
	"poth": "/",
	"fetch": true
}

const _stored = {}

let _eventHandlers = {}

class Client {
	constructor(options) {
		this._options = {
			"method": "post",
			"credentials": "include",
			"headers": {},
			"url": "",
			"port": 80,
			"poth": "/",
			"fetch": true,
			...options
		}
		this._stored = {}
	}
	add(obj) {
		const keys = Object.keys(obj)
		for (let i = 0; i < keys.length; i++) {
			const k = keys[i]
			this._stored[k] = obj[k]
		}
	}
	remove(keys) {
		for (let i = 0; i < keys.length; i++) {
			delete this._stored[keys[i]]
		}
	}
	parseTemplate(template, data) {
		return data ? JSON.parse(JSON.stringify(template, (k, v) => {
			if (v in data)
				return data[v]
			return v
		})) : template
	}
	read(value, data) {
		const t = typeof value === "string" ? this._stored[value] : value
		return this.do('query', this.parseTemplate(t, data))
	}
	write(value, data) {
		const t = typeof value === "string" ? this._stored[value] : value
		return this.do('mutation', this.parseTemplate(t, data))
	}
	async do(op, q) {
		const query = this.build(op, q)
		try {
			return await this.send(JSON.stringify({ query }))
		} catch (error) {
			if (!error.code)
				return { error: { code: 500 } } //no serverside error
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
	buildarg(arg) {
		let str = ''
		if (arg === null)
			arg = undefined
		switch (typeof arg) {
			case "object":
				if (Array.isArray(arg)) {
					const red = arg.reduce((acc, el) => {
						return acc + this.buildarg(el) + ' ,'
					}, '')
					str += `[${red.slice(0, -1)}]`
				} else {
					const keys = Object.keys(arg)
					str += ` { `
					for (let i = 0; i < keys.length; i++) {
						const k = keys[i]
						str += `${k}:${this.buildarg(arg[k])},`
					}
					str += ` } `
				}
				break
			case "string":
				if (arg.startsWith('$'))
					str += `${arg.slice(1)}`
				else
					str += JSON.stringify(arg)
				break
			case "number":
				str += arg
				break
			case "undefined":
				str += 'null'
				break
			default:
				str += JSON.stringify(arg)
				break
		}
		return str
	}
	buildargs(args) {
		let result = " ( "
		const keys = Object.keys(args)
		for (let i = 0; i < keys.length; i++) {
			const k = keys[i]
			const v = args[k]
			result += `${k}:${this.buildarg(v)},`
		}
		return result.slice(0, -1) + " ) "
	}
	async send(data, url, method, credentials, headers) {
		if (this._options.fetch) {
			let result = {}
			try {
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
			} catch (e) {
				result.error = e
			}
			if (result.error)
				throw new GraphError(result.error.code || 400)
			return result.data
		}
		return await this.request(data, url, method, credentials, headers)
	}

	static request(data, url, method, credentials, headers) {
		const opt = {
			hostname: url,
			port: this._options.port || 80,
			path: this._options.path || '/',
			method: method,
			headers: {
				'Content-Type': 'application/json',
				"Accept": "application/json",
				'Content-Length': data.length,
				...headers || {}
			}
		}
		return new Promise((resolve, reject) => {
			const req = http.request(opt, (res) => {
				let result = ""
				res.setEncoding('utf8');
				res.on('data', chunk => result += chunk);
				res.on('end', () => {
					let rs
					try {
						rs = JSON.parse(result)
					} catch (error) {
						return reject(error)
					}
					resolve(rs.data)
				});
				res.on("error", (e) => {
					console.logs(r.message)
				})
			});
			req.on('error', (e) => {
				reject(e)
			});
			req.write(data);
			req.end();
		})
	}
}

export default class GraphQLClient {

	static get Client() {
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

	static BuildArg(arg) {
		let str = ''
		if (arg === null)
			arg = undefined
		switch (typeof arg) {
			case "object":
				if (Array.isArray(arg)) {
					const red = arg.reduce((acc, el) => {
						return acc + GraphQLClient.BuildArg(el) + ' ,'
					}, '')
					str += `[${red.slice(0, -1)}]`
				} else {
					const keys = Object.keys(arg)
					str += ` { `
					for (let i = 0; i < keys.length; i++) {
						const k = keys[i]
						str += `${k}:${GraphQLClient.BuildArg(arg[k])},`
					}
					str += ` } `
				}
				break
			case "string":
				if (arg.startsWith('$'))
					str += `${arg.slice(1)}`
				else
					str += JSON.stringify(arg)
				break
			case "number":
				str += arg
				break
			case "undefined":
				str += 'null'
				break
			default:
				str += JSON.stringify(arg)
				break
		}
		return str
	}

	static BuildArgs(args) {
		let result = " ( "
		const keys = Object.keys(args)
		for (let i = 0; i < keys.length; i++) {
			const k = keys[i]
			const v = args[k]
			result += `${k}:${GraphQLClient.BuildArg(v)},`
		}
		return result.slice(0, -1) + " ) "
	}

	/**
	 * 
	 * @param {String} data 
	 * @param {Object} optional
	 */
	static async Send(data, { url, method, credentials, headers }) {
		if (_gqlcOpt.fetch) {
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
		return await GraphQLClient.Request(data, { url, method, credentials, headers })

	}

	static Request(data, { url, method, credentials, headers }) {
		const opt = {
			hostname: url,
			port: _gqlcOpt.port || 80,
			path: _gqlcOpt.path || '/',
			method: method,
			headers: {
				'Content-Type': 'application/json',
				"Accept": "application/json",
				'Content-Length': data.length,
				...headers || {}
			}
		}
		return new Promise((resolve, reject) => {
			const req = http.request(opt, (res) => {
				let result = ""
				res.setEncoding('utf8');
				res.on('data', chunk => result += chunk);
				res.on('end', () => {
					let rs
					try {
						rs = JSON.parse(result)
					} catch (error) {
						return reject(error)
					}
					resolve(rs.data)
				});
				res.on("error", (e) => {
					console.logs(r.message)
				})
			});
			req.on('error', (e) => {
				reject(e)
			});
			req.write(data);
			req.end();
		})
	}
}