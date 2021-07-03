# gqlc GraphQL Client library
https://github.com/McRain/reneos.gqlc

## Install

```npm i @reneos/gqlc```

## Browser usage (static)

```import gqlc from "@reneos/gqlc"```

###### Init:

```js
const Api = gqlc.Init({
	"method": "post",
	"credentials": "include",
	"headers": {},
	"url": "https://127.0.0.1/api"
})
```

###### Query (runtime build query):

```js
const {error,user} = await gqlc.Get({
	user:[{
		$args:{
			id:"userId"
		}
	},"name","email"]
})
```

###### Query (prebuild query):

```js
gqlc.Add({
	user_query:{
		user:[{
			$args:{
				id:"$userid"
			}
		},"name","email"]
	}
})
const {error,user} = await gqlc.Get("user_query",{$userid:"UserId"})
```

###### Mutation:
   
```js
const {entrypoint,error} = await gqlc.Set({
				entrypoint: [
					{
						$args: {
							type: valuetype
						}
					},
					"result",
					"code"
				]
			})
```

## Browser Usage (instance)

```js
import {Client} from "@reneos/gqlc"

const client = new Client({
	"method": "post",
	"credentials": "include",
	"headers": {},
	"url": "http://127.0.0.1/api"
})

const {error,user} = await client.read({
	user:[{
		$args:{
			id:"userId"
		}
	},"name","email"]
})

const {entrypoint,error} = await client.write({
				entrypoint: [
					{
						$args: {
							type: valuetype
						}
					},
					"result",
					"code"
				]
			})
```

## Node.js Usage (static)

```import gqlc from "@reneos/gqlc"```

###### After init:

```js
gql.Init({
	"fetch": false,
})
```