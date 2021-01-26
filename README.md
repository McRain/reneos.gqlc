# gqlc
GraphQL Client library for browsers : https://github.com/McRain/reneos.gqlc

## Install

npm i @reneos/gqlc

## Usage

`import gqlc from "@reneos/gqlc"
gqlc.Init({
	url: https://webserver/grapqlapi`,
	method: "post",
	credentials: "include"
})`

###### Query:

`const {user,error} = await gqlc.Get(
						{
							user: [
								"_id"
								{ rates: ["value", "previos"] }
							]
						},
						null,
						"user"
					)`
    
    
###### Mutation

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
