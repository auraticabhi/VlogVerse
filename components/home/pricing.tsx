"use client"
import { ArrowRight, CheckIcon, LoaderCircle } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { plansMap } from "@/lib/constants";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import axios from "axios"
import Script from "next/script";
import { handleCheckoutSessionCompleted } from "@/lib/payment-helpers";
import { useRouter } from 'next/navigation'
import getDbConnection from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

export default function Pricing() {

  const { toast } = useToast();
  const {user, isLoaded} = useUser();
  const [isPro, setIsPro] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  async function doesUserExist(
    email: string
  ) {
    setUserLoading(true);
    const sql = await getDbConnection();
    const query = await sql`SELECT * FROM users where email = ${email}`;
    setUserLoading(false);
    if (query && query.length > 0) {
      if(query[0].subscription_id!="na"){
      setIsPro(true);
      }
      return query;
    }
    return null;
  }

  useEffect(()=>{
    //console.log("USr: ", user);
    if(user?.primaryEmailAddress?.emailAddress){
    doesUserExist(user?.primaryEmailAddress?.emailAddress)
    }
  }, [user, isLoaded]);

  const [loading, setLoading]=useState(false);
    const router = useRouter()
    
    const createSubscription=(id:string)=>{
      if (!user) {
        router.push("/sign-in");
        return;
      }
      if(userLoading){
        toast({
          title: "Please Try Again :(",
        });
        return;
      }
      if(isPro){
        toast({
          title: "You are already a Pro Member 🔥",
        });
        return;
      }
      if(id=="basic"){
        toast({
          title: "You are already a Free Plan Member ✅",
          description: "Upgrade to Pro to get Unlimited Blog Posts"
        });
        return;
      }
        setLoading(true);
        axios.post('/api/payments', {}).then(res=>{
            console.log("res: ", res);
            onPayment(res.data.id);
        }, ()=>{
            setLoading(false);
        })
    }

    const onPayment=(subId:string)=>{
        const options={
            key: "rzp_test_JXjf4BhyJImTqw",
            subscription_id: subId,
            name:'VlogVerse',
            description:"Monthly Subscription",
            handler:async(resp:any)=>{
                //console.log(resp);
                if(resp){
                    //console.log("R: ", resp);
                    saveSubscription(resp)
                }
                setLoading(false);
            }
        }

        // @ts-ignore
        const rzp = new window.Razorpay(options);
        rzp.open();
    }

    const saveSubscription = async(resp:any)=>{
        // const result = await db.insert(UserSubscription).values({
        //     email:user?.primaryEmailAddress?.emailAddress,
        //     userName:user?.fullName,
        //     active:true,
        //     paymentId:paymentId,
        //     joinDate:moment().format('DD/MM/yyyy')
        // });
        // console.log(result);
        // if(result){
        //     window.location.reload();
        // }
      await handleCheckoutSessionCompleted(resp, user);
      window.location.reload();
    }

  return (
    <section className="relative overflow-hidden" id="pricing">
      <Script src="https://checkout.razorpay.com/v1/checkout.js"></Script>
      <div className="py-12 lg:py-24 max-w-5xl mx-auto px-12 lg:px-0">
        <div className="flex items-center justify-center w-full pb-12">
          <h2 className="font-bold text-xl uppercase mb-8 text-purple-600">
            Pricing
          </h2>
        </div>
        <div className="relative flex justify-center flex-col lg:flex-row items-center lg:items-stretch gap-8">
          {plansMap.map(
            ({ name, price, description, items, id, paymentLink }, idx) => (
              <div className="relative w-full max-w-lg" key={idx}>
                <div
                  className={cn(
                    "relative flex flex-col h-full gap-4 lg:gap-8 z-10 p-8 rounded-box border-[1px] border-gray-500/20 rounded-2xl",
                    isPro&&id === "pro" && "border-violet-500 gap-5 border-2",
                    !isPro&&id === "basic" && "border-violet-500 gap-5 border-2"
                  )}
                >
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <p className="text-lg lg:text-xl font-bold capitalize">
                        {`${name}${id=="pro"&&isPro?" | Current Plan":""}${id=="basic"&&!isPro&&user?" | Current Plan":""}`}
                      </p>
                      <p className="text-base-content/80 mt-2">{description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <p className="text-5xl tracking-tight font-extrabold">
                      ${price}
                    </p>
                    <div className="flex flex-col justify-end mb-[4px]">
                      <p className="text-xs text-base-content/60 uppercase font-semibold">
                        USD
                      </p>
                      <p className="text-xs text-base-content/60">/month</p>
                    </div>
                  </div>
                  <ul className="space-y-2.5 leading-relaxed text-base flex-1">
                    {items.map((item, idx) => (
                      <li className="flex items-center gap-2" key={idx}>
                        <CheckIcon size={18}></CheckIcon>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2">
                    <Button
                      variant={"link"}
                      className={cn(
                        "border-2 rounded-full flex gap-2 bg-black text-gray-100",
                        id === "pro" && "border-amber-300 px-4"
                      )}
                    >
                      <span className={`${id=="basic"?"hidden":""}`} >{loading&&<LoaderCircle className="animate-spin"/>}</span>
                      <div
                        onClick={()=>{createSubscription(id)}}
                        className="flex gap-1 items-center"
                      >
                        Get VlogVerse <ArrowRight size={18} />
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
