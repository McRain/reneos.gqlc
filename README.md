# gqlc
GraphQL Client library : https://github.com/McRain/reneos.gqlc

## Install

`npm i @reneos/gqlc`

## Usage Static

`import gqlc from "@reneos/gqlc"`

###### Init:

`const Api = gqlc.Init({
	"method": "post",
	"credentials": "include",
	"headers": {},
	"url": "https://127.0.0.1/api"
})`

###### Query (runtime build query):

`const {error,user} = await gqlc.Get({
	user:[{
		$args:{
			id:"userId"
		}
	},"name","email"]
})`

###### Query (prebuild query):

`gqlc.Add({
	user_query:{
		user:[{
			$args:{
				id:"$userid"
			}
		},"name","email"]
	}
})

const {error,user} = await gqlc.Get("user_query",{$userid:"UserId"})`


###### Mutation:
   
`const {entrypoint,error} = await gqlc.Set({
				entrypoint: [
					{
						$args: {
							type: valuetype
						}
					},
					"result",
					"code"
				]
			})`

## Usage instance

`import gqlc from "@reneos/gqlc"

const client = new gqlc.Client({
	"method": "post",
	"credentials": "include",
	"headers": {},
	"url": "http://127.0.0.1/api"
})`

`const {error,user} = await client.read({
	user:[{
		$args:{
			id:"userId"
		}
	},"name","email"]
})
`
`const {entrypoint,error} = await client.write({
				entrypoint: [
					{
						$args: {
							type: valuetype
						}
					},
					"result",
					"code"
				]
			})`