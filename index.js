import GraphError from "./grapherror.js"
import Client from "./client.js"

const _stored = {}

class GraphQLClient {

	static get GraphError() {
		return GraphError
	}

	static get Client() {
		return Client
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

/**
 * 
 * @param {*} config 
 * @returns 
 */
	static Init(config) {
		GraphQLClient.Send = GraphQLClient.Run.bind(null, config)
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
			const result = await GraphQLClient.Send(JSON.stringify({ query }))
			return result
		} catch (error) {
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
	 * @param {*} options 
	 * @param {*} data 
	 * @returns 
	 */
	static async Run(options, data) {
		try {
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
		} catch (e) {
			throw e
		}
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