import { neon } from "@neondatabase/serverless";

export default async function getDbConnection() {
  // if (!process.env.DATABASE_URL) {
  //   throw new Error("Neon Database URL is not defined");
  // }
  const sql = neon("postgresql://ideaflowdb_owner:uiHq7VStjy2d@ep-sparkling-glitter-a5flst8d.us-east-2.aws.neon.tech/VlogVerse?sslmode=require");
  return sql;
}
