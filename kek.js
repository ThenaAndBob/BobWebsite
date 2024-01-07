async function main(){
    console.log("1")
    const stripeprice = require('stripe')('sk_test_51OVvlADGfuBnaQvUn2EDmLDcKVfTeBwoaNXPG3zF6HQvdnpYpdn2TqysJxpPS0STltbaQSKNVQysTjGLTs0yN5N100zUQT0UXz');
    const price = await stripeprice.prices.create({
    currency: 'usd',
    unit_amount: 1000,
    recurring: {
        interval: 'month',
    },
    product_data: {
        name: 'Gold Plan',
    },
    });


    const stripe = require('stripe')('sk_test_51OVvlADGfuBnaQvUn2EDmLDcKVfTeBwoaNXPG3zF6HQvdnpYpdn2TqysJxpPS0STltbaQSKNVQysTjGLTs0yN5N100zUQT0UXz');

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