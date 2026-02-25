import GraphError from "./grapherror.js"
import Client from "./client.js"

const _stored = {}

class GraphQLClient {

	static GraphError = GraphError;
	static Client = Client;

	/**
	 * Save to stored templates
	 * @param {Object} obj 
	 */
	static Add(obj) {
		Object.keys(obj).forEach(k => {
			_stored[k] = obj[k]
		})
	}

	static Read(key) {
		return _stored[key]
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

	/**
	 * 
	 * @param {*} config 
	 * {
	 * 	url:"",
	 * 	headers:{}
	 * ...options for fetch
	 * }
	 * @returns 
	 */
	static Init(config) {
		GraphQLClient.Send = GraphQLClient.Run.bind(null, config)
		return GraphQLClient
	}

	static ParseTemplate(template, data) {
		return data ?
			JSON.parse(JSON.stringify(template, (k, v) => {
				if (data != null && Object.prototype.hasOwnProperty.call(data, v))
					return data[v]
				return v
			})) : template
	}

	/**
	 * @param {Object | String} value - Query template or stored template key
	 * @param {Object} data - Template substitution data
	 */
	static Get(value, data) {
		const t = typeof value === "string" ? _stored[value] : value
		return GraphQLClient.Do('query', GraphQLClient.ParseTemplate(t, data))
	}

	/**
	 * @param {Object | String} value - Mutation template or stored template key
	 * @param {Object} data - Template substitution data
	 */
	static Set(value, data) {
		const t = typeof value === "string" ? _stored[value] : value
		return GraphQLClient.Do('mutation', GraphQLClient.ParseTemplate(t, data))
	}

	/**
	 * @param {Object | String} value - Subscription template or stored template key
	 * @param {Object} data - Template substitution data
	 */
	static Sub(value, data) {
		const t = typeof value === "string" ? _stored[value] : value
		return GraphQLClient.Do('subscription', GraphQLClient.ParseTemplate(t, data))
	}

	/**
	 * 
	 * @param {string} op : Operation
	 * @param {Object} q : Query
	 */
	static async Do(op, q) {
		const query = GraphQLClient.Build(op, q)
		try {
			const result = await GraphQLClient.Send({ query }) //GraphQLClient.Send(JSON.stringify({ query }))
			return result
		} catch (error) {
			if (!error.code)
				return { error: { code: 400, message: error.message } } //no serverside error
			return { error }
		}
	}

	static Build(op, ...args) {
		let result = `${op} { `
		for (let i = 0; i < args.length; i++)
			result += GraphQLClient.BuildObject(args[i])
		return result + "}"
	}

	
	static BuildObject(obj) {
		let result = ``
		if (obj === null || obj === undefined) return result
		if (typeof (obj) === "string" ||
			typeof (obj) === "number" ||
			Array.isArray(obj)) {
			return JSON.stringify(obj)
		}
		const keys = Object.keys(obj)
		for (let i = 0; i < keys.length; i++) {
			const k = keys[i]
			result += k + " "
			const values = [...obj[k]]
			const argIndex = values.findIndex((element) => element && element.$args)
			if (argIndex !== -1) {
				result += GraphQLClient.BuildArgs(values[argIndex].$args)
				values.splice(argIndex, 1)
			}
			result += values.length > 0 ? " { " : ""
			for (let j = 0; j < values.length; j++) {
				const o = values[j]
				if (!o)
					continue
				if (typeof (o) === "string") {
					result += o + " "
				} else if (o instanceof Array) {
					result += o.join(' ')
				} else
					result += GraphQLClient.BuildObject(o)
			}
			result += values.length > 0 ? " } " : ""
		}
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
			case "boolean":
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
	 * @param {*} options 
	 * @param {*} data 
	 * @returns 
	 */
	static async Run(options, d) {
		const data = JSON.stringify(d)
		const resp = await fetch(options.url, {
			...options,
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json",
				...options.headers
			},
			body: data
		})
		const { data: value, error } = await resp.json()
		if (error)
			throw new GraphError(error)
		return value
	}

	/**
	 * @param {*} data 
	 * @returns 
	 */
	static async Send() {
		throw new Error(`GQLC.Send - Use Init before , or override Send`)
	}
}

export default GraphQLClient