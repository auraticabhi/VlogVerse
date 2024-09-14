import { NeonQueryFunction } from "@neondatabase/serverless";
import { plansMap } from "./constants";

export async function hasCancelledSubscription(
  sql: NeonQueryFunction<false, false>,
  email: string
) {
  const query =
    await sql`SELECT * FROM users where email = ${email} AND status = 'cancelled'`;

  return query && query.length > 0;
}

export async function doesUserExist(
  sql: NeonQueryFunction<false, false>,
  email: string
) {
  const query = await sql`SELECT * FROM users where email = ${email}`;
  if (query && query.length > 0) {
    return query;
  }
  return null;
}

export async function updateUser(
  sql: NeonQueryFunction<false, false>,
  userId: string,
  email: string
) {
  return sql`UPDATE users SET user_id = ${userId} WHERE email = ${email}`;
}

//seach through subscription plan id in future updates...
export function getPlanType(priceId: string) {
  if(priceId){
    if(priceId=="na"){
      return { id: "basic", name: "Basic" }
    }
    else return { id: "pro", name: "Pro" }
  }else{
    return { id: "basic", name: "Basic" }
  }
}
