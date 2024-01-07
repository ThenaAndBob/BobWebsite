import stripe
stripe.api_key = "sk_test_51OVvlADGfuBnaQvUn2EDmLDcKVfTeBwoaNXPG3zF6HQvdnpYpdn2TqysJxpPS0STltbaQSKNVQysTjGLTs0yN5N100zUQT0UXz"
a = stripe.Price.create(
  currency="usd",
  unit_amount=1000,
  product_data={"name": "Gold Plan"},
)

stripe.api_key = "sk_test_51OVvlADGfuBnaQvUn2EDmLDcKVfTeBwoaNXPG3zF6HQvdnpYpdn2TqysJxpPS0STltbaQSKNVQysTjGLTs0yN5N100zUQT0UXz"
b = stripe.PaymentLink.create(
  line_items=[{"price": a.id, "quantity": 1}],
)

print(b)