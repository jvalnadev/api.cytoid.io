import { gql } from 'apollo-server-koa'
import {GraphQLResolveInfo} from 'graphql'
import {SelectQueryBuilder} from 'typeorm'
import {redis} from '../db'
import User from '../models/user'

export const typeDefs = gql`
type Email {
  address: String! @column(primary: true)
  verified: Boolean! @column
}

type User {
  id: ID! @column(primary: true)
  uid: String @column
  name: String @column
  email: Email @column(name: "email") @relation(name: "emails", field: "emailObj")
  registrationDate: Date @column
  role: String! @column
  avatarURL: String! @column(name: "avatarPath")

  online: Boolean!
}

extend type Query {
  user(id: ID, uid: String): User @toOne(name: "users")
}
`

export const resolvers = {
  User: {
    online(parent: User) {
      return redis.getAsync('onlinestatus:' + parent.id)
        .then((val) => val !== null)
    },
  },
  Query: {
    user(
      parent: never,
      args: {
        id: string,
        uid: string,
      },
      context: { queryBuilder: SelectQueryBuilder<User> },
      info: GraphQLResolveInfo,
    ) {
      if (args.id) {
        return context.queryBuilder.where({ id: args.id })
      } else if (args.uid) {
        return context.queryBuilder.where({ uid: args.uid })
      } else {
        return null
      }
    },
  },
}
