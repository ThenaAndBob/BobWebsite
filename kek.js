import stripe from stripe

async function main(){
    console.log("1")
    const price = await stripe.prices.create({
    currency: 'usd',
    unit_amount: 1000,
    recurring: {
        interval: 'month',
    },
    product_data: {
        name: 'Gold Plan',
    },
    });
    console.log("2")

    const paymentLink = await stripe.paymentLinks.create({
    line_items: [
        {
        price: price.id,
        quantity: 1,
        },
    ],
    });

    console.log(paymentLink.url)
    return paymentLink.url
}
console.log("A")
main();
console.log("B")