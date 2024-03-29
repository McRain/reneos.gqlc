class Client {
	constructor(config) {
		const options = {
			"method": "post",
			"credentials": "include",
			"headers": {},
			"url": "",
			"port": 80,
			...config
		}
		this.send = this.run.bind(null, options)
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
	subs(value, data) {
		const t = typeof value === "string" ? this._stored[value] : value
		return this.do('subscription', this.parseTemplate(t, data))
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
				if (!element || !element.$args)
					return false
				return true
			})
			let acount = 0
			if (arg) {
				result += this.buildargs(arg.$args)
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
	async run(options, data) {
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
	async send() {}
}

export default Client