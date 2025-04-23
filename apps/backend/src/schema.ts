// apps/backend/src/schema.ts
import { gql } from "graphql-tag"; // Use graphql-tag for schema definition

// Note: Using gql tag is common for schema definition
const typeDefs = gql`
  # The Query type lists all available queries clients can execute
  type Query {
    # Simple health check query
    healthCheck: HealthCheckStatus!
  }

  # Simple type for the health check status
  type HealthCheckStatus {
    status: String!
  }

  # Add Mutations, other Types, Inputs, etc. here later
`;

export default typeDefs;
