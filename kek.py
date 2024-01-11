import stripe
stripe.api_key = "sk_test_51OVvlADGfuBnaQvUn2EDmLDcKVfTeBwoaNXPG3zF6HQvdnpYpdn2TqysJxpPS0STltbaQSKNVQysTjGLTs0yN5N100zUQT0UXz"
f = open("test.txt", "w")
for x in range(100,20100, 100):
  a = stripe.Price.create(
    currency="eur",
    unit_amount=x,
    product_data={"name": "Boost"},
  )
  print(a)
  b = stripe.PaymentLink.create(
    line_items=[{"price": a.id, "quantity": 1}],
  )
  print(b)
  b.after_completion.type = "redirect"
  b.after_completion.redirect.url = ""
  f.write(b.url + ", ")
