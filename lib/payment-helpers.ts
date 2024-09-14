//import Stripe from "stripe";
import getDbConnection from "./db";

// export async function handleSubscriptionDeleted({
//   subscriptionId,
//   stripe,
// }: {
//   subscriptionId: string;
//   stripe: Stripe;
// }) {
//   try {
//     const subscription = await stripe.subscriptions.retrieve(subscriptionId);
//     const sql = await getDbConnection();
//     await sql`UPDATE users SET status = 'cancelled' WHERE customer_id = ${subscription.customer}`;
//   } catch (error) {
//     console.error("Error handling subscription deletion", error);
//     throw error;
//   }
// }

export async function handleCheckoutSessionCompleted(razorDetails:any, user:any) {
  const razorpayId = razorDetails.razorpay_payment_id;
  const subscriptionId = razorDetails.razorpay_subscription_id;

  const sql = await getDbConnection();

  if (user) {
    await createOrUpdateUser(sql, user);
    //update user subscription
    await updateUserSubscription(sql, subscriptionId, user?.primaryEmailAddress?.emailAddress as string);
    //insert the payment
    await insertPayment(sql, subscriptionId, razorpayId, user?.primaryEmailAddress?.emailAddress as string);
  }
}

async function insertPayment(
  sql: any,
  priceId: string,
  razorpayId: string,
  customerEmail: string
) {
  try {
    await sql`INSERT INTO payments (amount, status, razorpay_payment_id, price_id, user_email) VALUES (${1599}, ${"completed"}, ${razorpayId}, ${priceId}, ${customerEmail})`;
  } catch (err) {
    console.error("Error in inserting payment", err);
  }
}

export async function createOrUpdateUser(
  sql: any,
  customer: any,
) {
  try {
    const user = await sql`SELECT * FROM users WHERE email = ${customer?.primaryEmailAddress?.emailAddress}`;
    if (user.length === 0) {
      await sql`INSERT INTO users (email, full_name) VALUES (${customer?.primaryEmailAddress?.emailAddress}, ${customer?.fullName})`;
    }
  } catch (err) {
    console.error("Error in inserting user", err);
  }
}

export async function updateUserSubscription(
  sql: any,
  priceId: string,
  email: string
) {
  try {
    await sql`UPDATE users SET subscription_id = ${priceId}, status = 'active' where email = ${email}`;
  } catch (err) {
    console.error("Error in updating user", err);
  }
}
